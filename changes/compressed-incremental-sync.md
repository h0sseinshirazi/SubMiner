type: changed
area: sync

- Sync now uses compressed, incremental rsync transfers between compatible macOS and Linux machines, caching the last received snapshot per peer to cut traffic on later syncs. Machines without compatible rsync (including Windows) fall back to compressed scp, and older peers still work without the upload cache. Transfers abort after 30 minutes.
