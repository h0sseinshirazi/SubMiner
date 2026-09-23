type: changed
area: stats

- The stats server now rejects requests from non-loopback hosts and browser origins and requires `application/json` for mutation bodies. The in-app stats overlay loads from the local server so it shares the same protection. Reverse-proxied or Tailscale Serve dashboards are unsupported; scripts that POST must set a JSON content type.
