import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { autoSyncDownloadedSubtitle } from './subsync-auto';
import type { TriggerSubsyncFromConfigDeps } from './subsync';
import type { SubsyncResolvedConfig } from '../../subsync/utils';

const DOWNLOADED_SUB = '/tmp/show/episode.ja.srt';

function makeResolvedConfig(overrides: Partial<SubsyncResolvedConfig> = {}): SubsyncResolvedConfig {
  return {
    alassPath: '/usr/bin/alass',
    ffsubsyncPath: '/usr/bin/ffsubsync',
    ffmpegPath: '/usr/bin/ffmpeg',
    autoSyncDownloads: true,
    autoSyncEngine: 'ffsubsync',
    ...overrides,
  };
}

function makeDeps(
  overrides: Partial<TriggerSubsyncFromConfigDeps> = {},
  mediaPath = '/tmp/show/episode.mkv',
): TriggerSubsyncFromConfigDeps {
  const mpvClient = {
    connected: true,
    currentAudioStreamIndex: null,
    send: () => {},
    requestProperty: async (name: string) => {
      if (name === 'path') return mediaPath;
      if (name === 'sid') return 2;
      if (name === 'secondary-sid') return null;
      if (name === 'track-list') {
        return [
          { id: 1, type: 'sub', selected: false, lang: 'jpn' },
          {
            id: 2,
            type: 'sub',
            selected: true,
            external: true,
            'external-filename': DOWNLOADED_SUB,
          },
        ];
      }
      return null;
    },
  };

  return {
    getMpvClient: () => mpvClient,
    getResolvedConfig: () => makeResolvedConfig(),
    isSubsyncInProgress: () => false,
    setSubsyncInProgress: () => {},
    showMpvOsd: () => {},
    runWithSubsyncSpinner: async <T>(task: () => Promise<T>) => task(),
    openManualPicker: () => {},
    ...overrides,
  };
}

test('autoSyncDownloadedSubtitle does nothing when the feature is disabled', async () => {
  let spinnerRuns = 0;
  const result = await autoSyncDownloadedSubtitle(
    DOWNLOADED_SUB,
    makeDeps({
      getResolvedConfig: () => makeResolvedConfig({ autoSyncDownloads: false }),
      runWithSubsyncSpinner: async <T>(task: () => Promise<T>) => {
        spinnerRuns += 1;
        return task();
      },
    }),
  );

  assert.equal(result, null);
  assert.equal(spinnerRuns, 0);
});

test('autoSyncDownloadedSubtitle skips stream URLs and explains why on the OSD', async () => {
  const osd: string[] = [];
  const result = await autoSyncDownloadedSubtitle(
    DOWNLOADED_SUB,
    makeDeps(
      {
        showMpvOsd: (text) => {
          osd.push(text);
        },
      },
      'https://example.com/stream.m3u8',
    ),
  );

  assert.equal(result, null);
  assert.equal(osd.length, 1);
  assert.match(osd[0] ?? '', /stream/i);
});

test('autoSyncDownloadedSubtitle yields to a subsync run already in progress', async () => {
  const flags: boolean[] = [];
  const result = await autoSyncDownloadedSubtitle(
    DOWNLOADED_SUB,
    makeDeps({
      isSubsyncInProgress: () => true,
      setSubsyncInProgress: (value) => {
        flags.push(value);
      },
    }),
  );

  assert.equal(result, null);
  assert.deepEqual(flags, []);
});

test('autoSyncDownloadedSubtitle skips when mpv never reports the added track', async () => {
  const mpvClient = {
    connected: true,
    currentAudioStreamIndex: null,
    send: () => {},
    requestProperty: async (name: string) => {
      if (name === 'path') return '/tmp/show/episode.mkv';
      if (name === 'sid') return 1;
      if (name === 'secondary-sid') return null;
      if (name === 'track-list') return [{ id: 1, type: 'sub', selected: true, lang: 'jpn' }];
      return null;
    },
  };

  const result = await autoSyncDownloadedSubtitle(
    DOWNLOADED_SUB,
    makeDeps({ getMpvClient: () => mpvClient }),
  );

  assert.equal(result, null);
});

test('autoSyncDownloadedSubtitle reports engine failures and clears the in-progress flag', async () => {
  const osd: string[] = [];
  const flags: boolean[] = [];

  // ffmpeg is missing, so the real pipeline fails fast instead of shelling out.
  const result = await autoSyncDownloadedSubtitle(
    DOWNLOADED_SUB,
    makeDeps({
      getResolvedConfig: () => makeResolvedConfig({ ffmpegPath: '/missing/ffmpeg' }),
      setSubsyncInProgress: (value) => {
        flags.push(value);
      },
      showMpvOsd: (text) => {
        osd.push(text);
      },
    }),
  );

  assert.ok(result);
  assert.equal(result?.ok, false);
  assert.deepEqual(flags, [true, false]);
  assert.equal(osd.length, 1);
  assert.match(osd[0] ?? '', /Auto-sync failed/);
});

function writeExecutableScript(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, { encoding: 'utf8', mode: 0o755 });
  fs.chmodSync(filePath, 0o755);
}

// A secondary-slot download must come back as the secondary track. Routing it to
// the primary slot would silently replace the Japanese subtitle being read.
test('autoSyncDownloadedSubtitle returns a secondary download to the secondary slot', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-subsync-secondary-'));
  const ffsubsyncPath = path.join(tmpDir, 'ffsubsync.sh');
  const ffmpegPath = path.join(tmpDir, 'ffmpeg.sh');
  const alassPath = path.join(tmpDir, 'alass.sh');
  const videoPath = path.join(tmpDir, 'video.mkv');
  const primaryPath = path.join(tmpDir, 'primary.ja.srt');
  const downloadedPath = path.join(tmpDir, 'downloaded.en.srt');

  fs.writeFileSync(videoPath, 'video');
  fs.writeFileSync(primaryPath, 'primary sub');
  fs.writeFileSync(downloadedPath, 'downloaded sub');
  writeExecutableScript(ffmpegPath, '#!/bin/sh\nexit 0\n');
  writeExecutableScript(alassPath, '#!/bin/sh\nexit 0\n');
  writeExecutableScript(
    ffsubsyncPath,
    '#!/bin/sh\nout=""\nprev=""\nfor arg in "$@"; do\n  if [ "$prev" = "-o" ]; then out="$arg"; fi\n  prev="$arg"\ndone\nif [ -n "$out" ]; then : > "$out"; fi\nexit 0\n',
  );

  const sentCommands: Array<Array<string | number>> = [];
  const trackList = [
    { id: 1, type: 'sub', selected: true, external: true, 'external-filename': primaryPath },
    { id: 2, type: 'sub', selected: false, external: true, 'external-filename': downloadedPath },
  ];

  const result = await autoSyncDownloadedSubtitle(
    downloadedPath,
    makeDeps({
      getMpvClient: () => ({
        connected: true,
        currentAudioStreamIndex: 1,
        send: (payload) => {
          sentCommands.push(payload.command);
        },
        requestProperty: async (name: string) => {
          if (name === 'path') return videoPath;
          if (name === 'sid') return 1;
          if (name === 'secondary-sid') return 2;
          if (name === 'track-list') return trackList;
          return null;
        },
      }),
      getResolvedConfig: () => makeResolvedConfig({ alassPath, ffsubsyncPath, ffmpegPath }),
    }),
  );

  assert.equal(result?.ok, true);
  assert.ok(
    sentCommands.some(
      (command) =>
        command[0] === 'set_property' && command[1] === 'secondary-sid' && command[2] === 2,
    ),
    'synced subtitle should be reloaded into the secondary slot',
  );
  assert.ok(
    !sentCommands.some((command) => command[0] === 'set_property' && command[1] === 'sub-delay'),
    'the primary slot must be left untouched',
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
