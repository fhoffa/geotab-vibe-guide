# Securing Your Add-In's Backend Endpoints

**Your Add-In calls a Cloud Function. How do you stop everyone else from calling it too?**

> **Hackathon note:** During a vibe coding hackathon with a demo database, security isn't your top priority — focus on building something cool. But if you deploy an Add-In that calls a paid API (like image generation), you'll want to come back here. This guide explains the concepts so you understand them when you need them. The actual code patterns live in the [SECURE_BACKEND skill](https://github.com/fhoffa/geotab-vibe-guide/blob/main/skills/geotab/references/SECURE_BACKEND.md), and a complete working example is in [`examples/server-side/generate-image/`](https://github.com/fhoffa/geotab-vibe-guide/tree/main/examples/server-side/generate-image).

---

## The Problem

Add-Ins run as JavaScript inside MyGeotab. That means:

- Your code is **visible** to anyone who inspects the page source
- Any API keys you embed in JavaScript can be **copied**
- Other Add-Ins on the same MyGeotab server share the same browser context
- Public endpoints can be called by **anyone** on the internet

You cannot solve this on the client side alone. You need server-side verification.

---

## The Solution: Verify Geotab Sessions Server-Side

Every user logged into MyGeotab has an active session with a `sessionId`. Your Add-In can access this via `api.getSession()`. The key insight: **your backend can verify that session directly with Geotab's API** before doing any work.

### How It Works

```
User logged into MyGeotab
        │
        ▼
┌─────────────────┐     POST {database, userName,     ┌──────────────────┐
│  Your Add-In    │────  sessionId, server, prompt} ──▶│  Your Cloud      │
│  (JavaScript)   │                                    │  Function         │
└─────────────────┘                                    └────────┬─────────┘
                                                                │
                                                    1. Check database allowlist
                                                    2. Verify session with Geotab ──▶ Geotab API
                                                    3. Check user allowlist (optional)
                                                    4. If valid → do the work
                                                    5. If invalid → return 401/403
```

### Step 1: Your Add-In Sends Session Credentials

When your Add-In needs to call your backend, it first gets the current user's session using `api.getSession()`, then includes the `database`, `userName`, `sessionId`, and `server` in every request. The server comes from `window.location.hostname` since your Add-In runs inside MyGeotab's iframe.

> See [SECURE_BACKEND skill — Add-In Side](https://github.com/fhoffa/geotab-vibe-guide/blob/main/skills/geotab/references/SECURE_BACKEND.md#add-in-side-send-session-credentials) for the code pattern.

### Step 2: Your Backend Verifies the Session

Before doing any work, your backend calls Geotab's `GetSystemTimeUtc` API using the credentials the caller provided. You don't care about the result (a timestamp) — you only care whether Geotab accepts the session. If the `sessionId` is fake, expired, or belongs to a different user, Geotab rejects it.

**Why `GetSystemTimeUtc`?** It's the lightest possible Geotab API call. No sensitive data returned, minimal processing.

**Why not just trust the credentials from the client?** Because your Add-In's JavaScript is public. Anyone can see the request format and send their own request with made-up credentials. Only Geotab's server can confirm a session is real.

> See [SECURE_BACKEND skill — Server Side](https://github.com/fhoffa/geotab-vibe-guide/blob/main/skills/geotab/references/SECURE_BACKEND.md#server-side-verify-session-with-geotab-api) for Python and JavaScript implementations.

### Step 3: Cache Verified Sessions

Calling Geotab's API on every request adds ~100-300ms of latency. You can cache verified sessions for a few minutes so repeat requests from the same user skip the network call.

**Why only 5 minutes?** Sessions can be revoked (user logs out, admin disables account). Geotab sessions themselves last 14 days, so 5 minutes is a good balance between security and performance.

> See [SECURE_BACKEND skill — Session Caching](https://github.com/fhoffa/geotab-vibe-guide/blob/main/skills/geotab/references/SECURE_BACKEND.md#session-caching) for the caching pattern.

---

## The Five Security Gates

Every request to your backend should pass through these checks, in this order. The cheap checks come first so most bad requests are rejected instantly.

| Gate | What it does | What it stops | Cost |
|------|-------------|--------------|------|
| **Database allowlist** | Is the caller's database on your list? | Users from other organizations | Free (string comparison) |
| **Server validation** | Is the Geotab server a real `*.geotab.com` domain? | SSRF attacks (see below) | Free (string comparison) |
| **Session verification** | Does Geotab confirm this session is valid? | Forged/expired credentials, bots, random callers | ~100-300ms (cached 5 min) |
| **User allowlist** (optional) | Is this specific user authorized? | Other developers in the same database | Free (string comparison) |
| **Rate limiting** | Has this user exceeded their quota? | Authorized users running up your bill | Free (in-memory counter) |

### About SSRF Prevention

The `server` parameter comes from the client. Your backend uses it to make an HTTP request to Geotab's API. If you don't validate it, an attacker could set `geotab_server` to `geotab.com.evil.com` — a domain they control that always responds "yes, valid session."

The fix is simple: only accept servers that are exactly `my.geotab.com` or end with `.geotab.com`. Using `.includes('geotab.com')` is NOT safe — it matches `geotab.com.evil.com`.

> See [SECURE_BACKEND skill — SSRF Prevention](https://github.com/fhoffa/geotab-vibe-guide/blob/main/skills/geotab/references/SECURE_BACKEND.md#server-validation-ssrf-prevention) for the code.

### About User Allowlists

Database + session verification blocks outsiders, but what about another developer in the **same** Geotab database? They also have a valid session.

You have two options:
- **User allowlist** — maintain a list of authorized email addresses (simple, but requires redeployment to update)
- **Security group check** — check if the user belongs to a specific Geotab security group (managed from MyGeotab's admin panel, no redeployment needed)

The `userName` can't be spoofed because it's tied to the session that Geotab just verified. If the session is valid, the user is who they claim to be.

> See [SECURE_BACKEND skill — Security Group check](https://github.com/fhoffa/geotab-vibe-guide/blob/main/skills/geotab/references/SECURE_BACKEND.md#verify-by-security-group-alternative-to-user-allowlist) for the code.

---

## Common Mistakes

**Embedding API keys in JavaScript** — Your Add-In's source is public. Anyone can view it and copy the key. The whole point of having a backend is to keep secrets on the server.

**Relying on CORS** — CORS is a browser-enforced policy. It prevents another *website* from calling your API from a browser, but a server-side script ignores CORS entirely. It doesn't distinguish between Add-Ins on the same MyGeotab page. It's a convenience feature, not a security boundary.

**Checking Origin/Referer headers** — These are trivially spoofable from server-side code. Don't rely on them.

**Hardcoding the Geotab server** — Geotab has multiple servers (`my.geotab.com`, `my123.geotab.com`, etc.). The session is only valid on the server where it was created. Always pass the server from the client and validate it before use.

**Failing open** — If your configuration is missing (e.g., forgot to set `ALLOWED_DATABASES`), your backend should reject all requests, not allow all requests. A misconfiguration should lock the door, not open it.

---

## Vibe Prompts

### Add security to an existing Cloud Function

```
I have a Geotab Add-In that calls my Cloud Function at [YOUR_URL].

Add Geotab session verification using the patterns in the SECURE_BACKEND skill:
1. In the Add-In, use api.getSession() and send database, userName, sessionId, server with every request.
2. In the Cloud Function, verify the session by calling Geotab's GetSystemTimeUtc with the provided credentials.
3. Add a database allowlist so only my database "[YOUR_DATABASE]" can use it.
4. Validate the server parameter to prevent SSRF (must end with .geotab.com).
5. Cache verified sessions for 5 minutes.
6. Add rate limiting (20 requests/hour per user).
7. Return 401 for invalid sessions, 403 for unauthorized databases, 429 for rate limits.

Skill reference: skills/geotab/references/SECURE_BACKEND.md
```

### Build a new secured Cloud Function from scratch

```
Create a Google Cloud Function (Node.js) that [YOUR_FEATURE].

Security requirements:
- Only Geotab users in database "[YOUR_DATABASE]" can call it
- Verify their session server-side using Geotab's GetSystemTimeUtc API
- Validate the geotab_server parameter to prevent SSRF (must end with .geotab.com)
- Cache verified sessions for 5 minutes
- Rate limit to 20 requests per hour per user
- Fail closed: if ALLOWED_DATABASES env var is not set, reject all requests

Use the patterns from skills/geotab/references/SECURE_BACKEND.md
See examples/server-side/generate-image/ for a complete working example.
```

### Add security group check instead of user allowlist

```
My Cloud Function is already secured with Geotab session verification, but I want to
restrict access to users in a specific Geotab security group instead of maintaining
an email allowlist.

After verifying the session, use the Geotab API to fetch the user's companyGroups
and check if they belong to group "[YOUR_GROUP_ID]".

Skill reference: skills/geotab/references/SECURE_BACKEND.md (Security Group section)
```

---

## Working Example

The [`examples/server-side/generate-image/`](https://github.com/fhoffa/geotab-vibe-guide/tree/main/examples/server-side/generate-image) directory contains a complete, deployable Google Cloud Function with all five security gates implemented. It generates images using Gemini, secured so only authenticated Geotab users can call it.

For a walkthrough of how each security layer works in that example, see the [annotated guide](https://github.com/fhoffa/geotab-vibe-guide/blob/main/guides/annotated-examples/GENERATE_IMAGE_ANNOTATED.md).

---

## Further Reading

- [Developing Add-Ins](https://developers.geotab.com/myGeotab/addIns/developingAddIns/) — Official Add-In developer guide
- [API Concepts (Authentication & Sessions)](https://developers.geotab.com/myGeotab/guides/concepts/index.html) — How sessions and credentials work
- [Credentials Object Reference](https://developers.geotab.com/myGeotab/apiReference/objects/Credentials/) — Structure of database, userName, sessionId
- [Using the API in JavaScript](https://developers.geotab.com/myGeotab/guides/codeBase/usingInJavascript/) — JavaScript SDK and session management
- [Better Practices for the MyGeotab API](https://www.geotab.com/blog/better-practices-mygeotab-api/) — Session reuse, caching, rate limits
