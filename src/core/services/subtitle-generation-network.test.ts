import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { DEFAULT_SUBTITLE_GENERATION_CONFIG } from '../../shared/subtitle-generation';
import { generateJapaneseSubtitles } from './subtitle-generation';
import { runSubtitleGenerationProcess } from './subtitle-generation-process';
import { resolveSubtitleGenerationTools } from './subtitle-generation-tools';

test(
  'real FFmpeg extracts a header-protected HLS episode and cleans up downloaded audio',
  {
    skip: process.platform === 'win32' ? 'Requires a POSIX executable fixture.' : false,
  },
  async (t) => {
    const tools = await resolveSubtitleGenerationTools(DEFAULT_SUBTITLE_GENERATION_CONFIG);
    if (tools.ffmpeg.kind !== 'found' || tools.ffprobe.kind !== 'found') {
      t.skip('FFmpeg and ffprobe are required for the network extraction test.');
      return;
    }
    const directory = await mkdtemp(path.join(tmpdir(), 'subminer-network-generation-'));
    const requests: string[] = [];
    const server = createServer(async (req, res) => {
      if (
        req.headers.referer !== 'https://anime.example/' ||
        req.headers['user-agent'] !== 'SubMiner test'
      ) {
        res.writeHead(403).end();
        return;
      }
      const name = req.url?.slice(1) ?? '';
      if (!/^(episode\.m3u8|segment\d+\.ts)$/.test(name)) {
        res.writeHead(404).end();
        return;
      }
      requests.push(name);
      try {
        res.end(await readFile(path.join(directory, name)));
      } catch {
        res.writeHead(404).end();
      }
    });
    try {
      await runSubtitleGenerationProcess({
        command: tools.ffmpeg.path,
        args: [
          '-v',
          'error',
          '-f',
          'lavfi',
          '-i',
          'sine=frequency=440:duration=3',
          '-c:a',
          'aac',
          '-f',
          'hls',
          '-hls_time',
          '1',
          '-hls_playlist_type',
          'vod',
          '-hls_segment_filename',
          path.join(directory, 'segment%d.ts'),
          path.join(directory, 'episode.m3u8'),
        ],
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const address = server.address();
      assert.ok(address && typeof address === 'object');
      const modelPath = path.join(directory, 'model.bin');
      const model = Buffer.alloc(8);
      model.writeUInt32LE(0x67676d6c, 0);
      model.writeInt32LE(51865, 4);
      await writeFile(modelPath, model);
      const whisperPath = path.join(directory, 'whisper-test');
      // Recognition is deterministic here; probing, HTTP requests and decoding use real FFmpeg.
      await writeFile(
        whisperPath,
        `#!${process.execPath}
const fs = require('node:fs');
const assert = require('node:assert/strict');
const args = process.argv.slice(2);
const wav = args[args.indexOf('-f') + 1];
const bytes = fs.readFileSync(wav);
assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
assert.ok(bytes.length > 90000);
fs.writeFileSync(${JSON.stringify(path.join(directory, 'audio-path'))}, wav);
fs.writeFileSync(args[args.indexOf('-of') + 1] + '.srt', '1\\n00:00:00,500 --> 00:00:01,500\\nこんにちは\\n');
`,
        { mode: 0o755 },
      );
      const cacheDirectory = path.join(directory, 'cache');
      const input = {
        config: {
          ...DEFAULT_SUBTITLE_GENERATION_CONFIG,
          modelPath,
          whisperPath,
          ffmpegPath: tools.ffmpeg.path,
          ffprobePath: tools.ffprobe.path,
        },
        modelDirectory: directory,
        mediaPath: `http://127.0.0.1:${address.port}/episode.m3u8`,
        audioStreamIndex: 0,
        remote: {
          cacheDirectory,
          httpHeaders: {
            headers: { Referer: 'https://anime.example/' },
            userAgent: 'SubMiner test',
          },
        },
      };
      const output = await generateJapaneseSubtitles(input);
      assert.match(await readFile(output, 'utf8'), /00:00:00,500 --> 00:00:01,500\nこんにちは/);
      assert.ok(requests.includes('episode.m3u8'));
      assert.ok(requests.includes('segment2.ts'));
      const wav = await readFile(path.join(directory, 'audio-path'), 'utf8');
      await assert.rejects(readFile(wav), /ENOENT/);
      await assert.rejects(
        generateJapaneseSubtitles({
          ...input,
          remote: { ...input.remote, httpHeaders: { headers: {}, userAgent: null } },
        }),
        /403/,
      );
      assert.deepEqual(await readdir(cacheDirectory), [path.basename(output)]);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) =>
          error && (!('code' in error) || error.code !== 'ERR_SERVER_NOT_RUNNING')
            ? reject(error)
            : resolve(),
        ),
      );
      await rm(directory, { recursive: true, force: true });
    }
  },
);
