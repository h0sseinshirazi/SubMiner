type: fixed
area: jellyfin

- Jellyfin streams no longer leak URL-derived titles or credential-bearing stream URLs into metadata lookups, Anki source fields, Discord presence, stats identities, or AniList retry keys. Previously cached credential-bearing parser metadata is cleaned up without touching watch history or library assignments.
