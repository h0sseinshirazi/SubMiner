type: added
area: stats

- Live-action dramas and movies in the stats Library get posters, synopses, and titles from TMDB. Release builds include a project key; `tmdb.apiKey` (or `tmdb.apiKeyCommand`) overrides it and is required when running from source.
- Titles AniList cannot match are looked up on TMDB automatically when the parsed filename matches a Japanese live-action title exactly; otherwise use the new **Link to TMDB** action. Entries linked to the same TMDB title merge into one card, and the Library kind selector gained a Live Action option.
- Provider reassignment keeps the previous link and artwork if the replacement download fails. Merges and sync keep AniList and TMDB identities separate, and the merge dialog explains mixed selections instead of failing.
