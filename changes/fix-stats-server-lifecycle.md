type: fixed
area: stats

- Stats server port conflicts are reported through status notifications instead of crashing SubMiner. Startup and shutdown are also more robust: concurrent startup requests are shared, background stop no longer disconnects foreground dashboards, and shutdown bounds how long it waits for active requests.
