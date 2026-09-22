type: fixed
area: jellyfin

- Jellyfin playback, subtitle, artwork, and remote-control URLs now authenticate with the `ApiKey` query parameter instead of the legacy `X-Emby-*` headers, so the integration works on Jellyfin 12 where legacy authorization is disabled by default.
- "Play on SubMiner" keeps working on Jellyfin 12: the cast-target websocket answers keep-alive requests and reconnects when the server stops replying instead of silently dying after about a minute.
- The Jellyfin "now playing" bar clears when you close or finish a cast video instead of running on to the end of the episode.
- Anki cards mined from Jellyfin playback get the episode title in the misc info field again instead of "Unknown media".
