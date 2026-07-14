# Celebrate RSVP Persistence

GitHub Pages can host the RSVP page, but it cannot save RSVP submissions by itself. The page is wired for:

- `endpointUrl` in `celebrate-config.js` as the write/read endpoint for cross-device persistence.
- Browser storage as a fallback before the endpoint is connected.
- An optional CSV read source only if `csvUrl` is set later.

If `endpointUrl` is blank, new RSVPs are saved only in that browser.

For true California/Washington cross-device sync, deploy the repository to Cloudflare Workers with the root `_worker.js` file and the `RSVPS` KV binding. `celebrate-config.js` points to `/api/rsvps`, so the shared RSVP API works automatically when the site is served by Cloudflare Workers.

If the site is hosted on GitHub Pages instead of Cloudflare Workers, replace `/api/rsvps` in `celebrate-config.js` with the full Worker URL, such as `https://your-worker-name.your-subdomain.workers.dev/api/rsvps`.

Set a Worker secret named `RESET_PASSWORD` if you want the Clear RSVPs password to be managed server-side. If it is not set, the Worker uses `archie`.

The page refreshes shared RSVPs when the details page opens and every 60 seconds while the tab is active, so Party Log and Availability stay current across browsers and devices once `endpointUrl` is connected while staying gentle on free-tier limits.

Any endpoint can be used if it supports this contract:

GET `?action=list`

Return either JSON:

```json
{
  "responses": [
    {
      "inviteeId": "max-voorhees",
      "status": "Yes, I am in",
      "availability": "Weekend of Jan 9: Friday afternoon Jan 8 + Saturday Jan 9",
      "notes": "",
      "submittedAt": "2027-01-01T00:00:00.000Z",
      "updatedAt": "2027-01-01T00:00:00.000Z"
    }
  ]
}
```

Or CSV with this header:

```csv
inviteeId,name,phone,status,availability,notes,submittedAt,updatedAt
```

POST body, sent as `text/plain` JSON:

```json
{
  "action": "upsert",
  "response": {
    "inviteeId": "max-voorhees",
    "name": "Max Voorhees",
    "phone": "5302103099",
    "status": "Yes, I am in",
    "availability": "Weekend of Jan 9: Friday afternoon Jan 8 + Saturday Jan 9",
    "notes": "",
    "submittedAt": "2027-01-01T00:00:00.000Z",
    "updatedAt": "2027-01-01T00:00:00.000Z"
  }
}
```

Clear all RSVPs:

```json
{
  "action": "clear",
  "password": "archie"
}
```
