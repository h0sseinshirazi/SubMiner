# Hachidori in SubMiner

This is a source snapshot of Hachidori at the revision in `SOURCE.json`.
`UPSTREAM-README.md` is the original project introduction. The extension,
WebAssembly bindings, engine source, build scripts and licenses are kept here
so host changes stay local to SubMiner.

`bun run build:hachidori` verifies the committed engine artifacts and
copies the extension to `build/hachidori`. The full app build includes this step,
and Electron packaging puts the result in `resources/hachidori`.

## Local changes

- `extension/overlay-mode.js` enables embedded host behavior. Custom
  JavaScript is disabled because Electron does not provide `userScripts`.
- `extension/subminer-host.js` implements the existing SubMiner popup event and
  command contract and prioritizes character-name results. `content.js` supplies
  popup lifecycle and reader actions.
- `extension/anki-mining.js` marks initial add/overwrite requests for SubMiner's
  AnkiConnect proxy. Later Hachidori pronunciation updates remain unmarked so
  they do not repeat SubMiner media enrichment.
- `extension/anki.js` sends those private markers only to the exact configured
  SubMiner proxy URL. Direct AnkiConnect requests use standard parameters.
- `extension/manifest.json` loads the host bridge and drops `userScripts`.
- The native `hdw_frequencies` binding and `hd_frequencies` engine message query
  frequency dictionaries without requiring a term dictionary. Frequency values
  retain their source reading, including whether a frequency was untagged.

- External dictionary links retain local Anki templates, audio sources, and custom buttons. Dictionary requests use the host; mining and media rendering use SubMiner. Setup uses Hachidori's native link/unlink messages and verifies the live host inventory.

## Rebuilding the engine

Ordinary app builds use the locally rebuilt WASM and JavaScript files with
SHA-256 checksums in `SOURCE.json`. The current engine uses Emscripten 6.0.9.
To rebuild them, install Emscripten and the
CMake prerequisites described in `docs/source-build.md`. Use a temporary checkout
of `https://github.com/bee-san/hachidori` at the exact `revision` in `SOURCE.json`,
then run `git submodule update --init --recursive`. Copy this snapshot's
`wasm/` and `third_party/hoshidicts/` sources into that temporary checkout,
preserving the initialized external submodules. Run `sh wasm/build.sh` and,
if changing the unused overlay capture encoder, `sh wasm/avif/build.sh`.

The snapshot's `third_party/hoshidicts` has its engine sources and `.gitmodules`;
its external submodules are retrieved by that recursive checkout. The
hoshidicts revision is pinned separately in `SOURCE.json`. The AVIF CMake file
pins libavif. Copy rebuilt files from that temporary checkout's
`extension/vendor/` only as an intentional source/artifact update and update
the corresponding checksums. Do not overwrite the locally adapted extension.

Hachidori and its modifications are GPL-3.0-or-later, see `LICENSE`.
The engine and bundled libraries retain their own license files.
The packaged `extension/vendor/hoshidicts-licenses/` includes dependency and
toolchain notices for the rebuilt engine.
