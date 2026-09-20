type: added
area: subsync

- Added `subsync.autoSyncDownloads`, which retimes a subtitle automatically once a Jimaku or TsukiHime download loads into mpv, instead of leaving you to open the subsync picker by hand after every download.
- Added `subsync.autoSyncEngine` to choose whether the automatic retime runs ffsubsync (default) or alass.
- Automatic retiming is skipped for stream URLs, since neither engine can use a remote media path as its reference.
