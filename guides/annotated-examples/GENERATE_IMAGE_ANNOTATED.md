# Annotated: Secured Image Generation Cloud Function

A walkthrough of [`examples/server-side/generate-image/index.js`](../../examples/server-side/generate-image/index.js) — a Google Cloud Function that generates images using Gemini, secured so only your Geotab Add-In's authorized users can call it.

For the security concepts behind this code, see [Securing Your Add-In's Backend Endpoints](../SECURE_ADDIN_BACKEND.md).

---

## What This Function Does

Your Geotab Add-In needs to generate images. Gemini can do that, but the API key costs money. You can't put the key in your Add-In's JavaScript (it's public). So you put it in a Cloud Function and have your Add-In call that instead.

The problem: how do you stop everyone else from calling your Cloud Function? The answer: make callers prove they're a real Geotab user in your database before you do any work.

---

## The Five Security Gates

Every request passes through five checks, in this order. The cheap checks come first so most bad requests are rejected instantly.

### Gate 1: Database Allowlist

> See [`index.js` lines 161–169](../../examples/server-side/generate-image/index.js)

Is the caller's Geotab database on your list? This is a simple string comparison — instant, free. Blocks anyone from a different Geotab organization.

The database list comes from the `ALLOWED_DATABASES` environment variable, so you can change it without redeploying.

### Gate 2: Server Validation (SSRF Prevention)

> See [`index.js` lines 28–32](../../examples/server-side/generate-image/index.js) — `isValidGeotabServer()`

The caller tells you which Geotab server to verify their session against. Your function will make an HTTP request to that server. If you don't validate it, an attacker could point you at `geotab.com.evil.com` — a server they control that always says "yes, valid session."

The fix: only allow domains that are exactly `my.geotab.com` or end with `.geotab.com`.

**The wrong way** (from the original code):
```javascript
// BAD — matches 'geotab.com.evil.com'
server.includes('geotab.com')
```

**The right way:**
```javascript
server === 'my.geotab.com' || server.endsWith('.geotab.com')
```

This is called **SSRF (Server-Side Request Forgery)** prevention.

### Gate 3: Session Verification

> See [`index.js` lines 37–64](../../examples/server-side/generate-image/index.js) — `verifyGeotabSession()`

The real security layer. Your function calls Geotab's `GetSystemTimeUtc` API using the caller's credentials. You don't care about the result (a timestamp) — you only care whether Geotab accepts the session. If the `sessionId` is fake, expired, or belongs to a different user, Geotab rejects it.

**Why `GetSystemTimeUtc`?** It's the lightest possible Geotab API call. No sensitive data returned, minimal server load.

**Why not just trust the credentials from the client?** Because your Add-In's JavaScript is public. Anyone can see the request format and send their own request with made-up credentials. Only Geotab's server can confirm a session is real.

Results are cached for 5 minutes (`SESSION_CACHE_TTL_MS`) to avoid hitting Geotab's API on every request. See [`isSessionValid()` at line 72](../../examples/server-side/generate-image/index.js).

### Gate 4: User Allowlist (Optional)

> See [`index.js` lines 192–200](../../examples/server-side/generate-image/index.js)

If `ALLOWED_USERS` is set, only those specific email addresses can use the endpoint. This blocks other developers in the same Geotab database.

**Why can't this be spoofed?** The `userName` is tied to the session that Gate 3 just verified. If the session is valid, the user is who they claim to be.

If `ALLOWED_USERS` is not set, any authenticated user in an allowed database gets through. This is the default.

### Gate 5: Rate Limiting

> See [`index.js` lines 97–130](../../examples/server-side/generate-image/index.js) — `checkRateLimit()`

Even authorized users shouldn't call Gemini 1,000 times in a loop. Default: 20 requests per hour per user.

Uses a **sliding window** — tracks each request timestamp, counts how many fall within the last 60 minutes. Fairer than a fixed hourly reset.

**Caveat:** In-memory, so limits reset when the Cloud Function instance is recycled. Fine for most Add-In backends. For strict enforcement across multiple instances, you'd need Redis.

---

## Other Design Decisions

### CORS `*`

> See [`index.js` line 143](../../examples/server-side/generate-image/index.js)

Your Add-In runs inside a MyGeotab iframe. The browser requires CORS headers for cross-origin requests. `*` is permissive but acceptable because CORS is not your security boundary — session verification is. See [Common Mistakes](../SECURE_ADDIN_BACKEND.md#common-mistakes).

### Fail Closed

> See [`index.js` lines 155–163](../../examples/server-side/generate-image/index.js)

If `ALLOWED_DATABASES` is not configured, the function rejects everything (500) rather than allowing everything. Forgetting an environment variable during deploy should lock the door, not open it.

### Gemini API Key Safety

> See [`index.js` lines 215–222](../../examples/server-side/generate-image/index.js)

The Gemini API key lives in the `GEMINI_API_KEY` environment variable and never leaves the server. Your Add-In sends a prompt to your Cloud Function; your Cloud Function sends the prompt to Gemini. The browser never sees the key. This is the whole point of having a backend.

---

## Security Summary

| Gate | What it stops | Cost |
|------|--------------|------|
| Database allowlist | Users from other Geotab databases | Free (string comparison) |
| Server validation | SSRF attacks via fake Geotab servers | Free (string comparison) |
| Session verification | Forged/expired credentials, bots, random internet callers | ~100-300ms (cached 5 min) |
| User allowlist | Other developers in the same database (optional) | Free (string comparison) |
| Rate limiting | Authorized users abusing the endpoint | Free (in-memory counter) |
