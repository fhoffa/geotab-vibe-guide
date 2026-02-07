# Secured Image Generation Cloud Function

A Google Cloud Function that generates images using Gemini, secured so only authorized Geotab Add-In users can call it.

## Security Layers

1. **Database allowlist** — only requests from configured Geotab databases are accepted
2. **Session verification** — validates the user's Geotab session by calling the Geotab API
3. **User allowlist** — restricts access to specific users (optional but recommended)
4. **Rate limiting** — prevents abuse (default: 20 requests/hour per user)

See [Securing Your Add-In's Backend Endpoints](https://github.com/fhoffa/geotab-vibe-guide/blob/main/guides/SECURE_ADDIN_BACKEND.md) for the full explanation.

For a line-by-line walkthrough, see the [annotated version](https://github.com/fhoffa/geotab-vibe-guide/blob/main/guides/annotated-examples/GENERATE_IMAGE_ANNOTATED.md).

## Deploy

```bash
gcloud functions deploy generateImage \
  --gen2 \
  --runtime=nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="ALLOWED_DATABASES=your_db" \
  --set-env-vars="ALLOWED_USERS=you@company.com,teammate@company.com" \
  --set-env-vars="GEMINI_API_KEY=your-key" \
  --set-env-vars="MAX_REQUESTS_PER_HOUR=20"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ALLOWED_DATABASES` | Yes | Comma-separated Geotab database names |
| `ALLOWED_USERS` | No | Comma-separated emails (if empty, any user in allowed databases can access) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `MAX_REQUESTS_PER_HOUR` | No | Rate limit per user (default: 20) |

## Call from Your Add-In

```javascript
api.getSession(function(session) {
    fetch("https://YOUR_FUNCTION_URL/generateImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt: "a fleet of trucks on a highway",
            geotab_database: session.database,
            geotab_username: session.userName,
            geotab_session_id: session.sessionId,
            geotab_server: window.location.hostname
        })
    })
    .then(r => r.json())
    .then(data => console.log(data));
});
```
