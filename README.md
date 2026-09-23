# SubMiner (fork)

A fork of **[ksyasuda/SubMiner](https://github.com/ksyasuda/SubMiner)** — a sentence-mining
overlay that integrates Yomitan and mpv for on-screen lookups, one-tap mining to Anki, and
immersion tracking without leaving the video player. All credit for the project goes to the
original author; this fork adds two features I needed.

## What this fork adds

- **Automatic subtitle retiming** (`subsync.autoSyncDownloads`, `subsync.autoSyncEngine`) —
  downloaded subtitles are timed against the release they were ripped from, so they rarely
  line up with the file you're watching. This runs the existing subsync pipeline unattended
  when a Jimaku or TsukiHime download loads into mpv, retiming the exact track that was just
  added (a secondary-slot download returns to the secondary slot). Stream URLs are skipped —
  neither engine can use a remote path as a reference.

- **Hyprland fractional-scaling fix** — `hyprctl -j monitors` reports width/height in
  physical pixels while client geometry is in layout coordinates, so on a 1.25× monitor the
  overlay was sized to 1920×1080 instead of 1536×864 and covered fullscreen mpv. Now divides
  monitor bounds by scale so the overlay matches the video.

Both land with tests — `src/core/services/subsync-auto.test.ts` (229 lines) and
`src/window-trackers/hyprland-tracker.test.ts`. The change is 508 insertions across 26 files;
see the [`feat/subsync-auto`](../../tree/feat/subsync-auto) branch and its commit.

## Installation, docs, releases

Use the upstream project — this fork is not separately released:
**<https://docs.subminer.moe>** · **<https://github.com/ksyasuda/SubMiner>**
