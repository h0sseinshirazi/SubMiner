import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(repoRoot, 'vendor', 'hachidori');
const output = path.join(repoRoot, 'build', 'hachidori');
const provenance = JSON.parse(fs.readFileSync(path.join(source, 'SOURCE.json'), 'utf8'));

// Upstream commits the engine binaries. Verify the pinned bytes before staging
// so ordinary app builds need neither Emscripten nor network access.
for (const [file, expected] of Object.entries(provenance.artifacts)) {
  const actual = createHash('sha256')
    .update(fs.readFileSync(path.join(source, file)))
    .digest('hex');
  if (actual !== expected) throw new Error(`Hachidori artifact checksum mismatch: ${file}`);
}
const extension = path.join(source, 'extension');
const manifest = JSON.parse(fs.readFileSync(path.join(extension, 'manifest.json'), 'utf8'));
for (const file of [
  manifest.options_page,
  manifest.background.service_worker,
  'offscreen.html',
  ...manifest.content_scripts.flatMap(({ js, css }) => [...js, ...css]),
]) {
  if (!fs.existsSync(path.join(extension, file)))
    throw new Error(`Missing Hachidori asset: ${file}`);
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
fs.cpSync(extension, output, { recursive: true });
for (const file of ['LICENSE', 'SOURCE.json', 'README.md']) {
  fs.copyFileSync(path.join(source, file), path.join(output, file));
}
process.stdout.write(`Hachidori ${provenance.revision} staged in ${output}\n`);
