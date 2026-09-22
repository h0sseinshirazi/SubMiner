type: added
area: dictionary

- Added a bundled Hachidori dictionary backend alongside the default Yomitan backend. Select it with `dictionaryBackend` and restart SubMiner.
- The tray and dictionary-settings shortcut follow the selected backend. `--hachidori` opens Hachidori settings, while `--yomitan` continues to open Yomitan settings.
- Hachidori integrates with subtitle scanning, popup controls, lookup tracking, character dictionaries, and Anki media enrichment, with separate dictionaries and settings for each backend.
- Hachidori auto-populates its first Anki template from SubMiner's deck, tags, and field mappings, detects an unambiguous matching note type, and preserves existing custom templates. Anki discovery retries after an unavailable connection.
- Hachidori saves downloadable word audio before sending a note through SubMiner's Anki proxy, so freshly mined animated cards include the word-audio delay.
- Hachidori reloads its background code on startup so extension updates take effect while preserving installed dictionaries and settings.
- First-run setup remembers each backend that finished it, so switching back does not repeat setup, and the launcher gates playback on the backend the running app started with. Current incomplete or cancelled setup takes precedence over stale completion history.
- Stats dashboard mining and deck lookup use the selected backend. Settings labels for popup pause and the dictionary deck no longer name Yomitan, and the backend selector sits with the other dictionary settings.
- Hachidori scans, dictionary counts, and settings reads wait for the dictionary engine to finish loading or importing instead of caching empty results.
- First-run setup can link an external Hachidori dictionary host in an app, browser, or Docker container, verify its library, and unlink back to local dictionaries. The optional host controls are collapsed by default and explain which apps or containers must stay running. Unresponsive connection checks time out so setup remains usable. Anki mining and media enrichment stay in SubMiner.
