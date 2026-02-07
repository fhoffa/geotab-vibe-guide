# Securing Add-In Backend Endpoints

Code patterns for protecting your Cloud Function / API so only authenticated Geotab users can call it.

For the full explanation of why these patterns are needed, see the [Securing Your Add-In's Backend Endpoints guide](https://github.com/fhoffa/geotab-vibe-guide/blob/main/guides/SECURE_ADDIN_BACKEND.md).

For a complete working example (Node.js / Google Cloud Run), see [`examples/server-side/generate-image/`](https://github.com/fhoffa/geotab-vibe-guide/tree/main/examples/server-side/generate-image).

## Add-In Side: Send Session Credentials

```javascript
// Get the current user's session and send it with every backend request
function callBackend(promptText) {
    api.getSession(function(session) {
        fetch("https://your-cloud-function.run.app/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: promptText,
                geotab_database: session.database,
                geotab_username: session.userName,
                geotab_session_id: session.sessionId,
                geotab_server: window.location.hostname || "my.geotab.com"
            })
        })
        .then(function(response) { return response.json(); })
        .then(function(data) { console.log("Result:", data); })
        .catch(function(err) { console.error("Request failed:", err); });
    });
}
```

## Server Side: Verify Session with Geotab API

Call `GetSystemTimeUtc` using the caller's credentials. If Geotab accepts them, the session is real. If not, reject the request.

### Python (Flask)

```python
import requests

def verify_geotab_session(database, username, session_id, server):
    """Verify that the Geotab session is real and active."""
    url = f"https://{server}/apiv1"
    try:
        response = requests.post(url, json={
            "method": "GetSystemTimeUtc",
            "params": {
                "credentials": {
                    "database": database,
                    "userName": username,
                    "sessionId": session_id
                }
            }
        }, timeout=10)
        result = response.json()
        return "result" in result and "error" not in result
    except Exception:
        return False
```

### JavaScript (Node.js)

```javascript
async function verifyGeotabSession(database, username, sessionId, server) {
    var apiUrl = "https://" + server + "/apiv1";
    var response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            method: "GetSystemTimeUtc",
            params: {
                credentials: {
                    database: database,
                    userName: username,
                    sessionId: sessionId
                }
            }
        })
    });
    if (!response.ok) return false;
    var data = await response.json();
    return data.result !== undefined && !data.error;
}
```

## Server Validation (SSRF Prevention)

The `server` parameter comes from the client. Validate it before making any HTTP request to it.

```javascript
// WRONG — matches 'geotab.com.evil.com'
server.includes('geotab.com')

// RIGHT — only actual Geotab subdomains
server === 'my.geotab.com' || server.endsWith('.geotab.com')
```

```python
# Python equivalent
def is_valid_geotab_server(server):
    return server == "my.geotab.com" or server.endswith(".geotab.com")
```

## Session Caching

Cache verified sessions to avoid a Geotab API round-trip on every request.

### Python

```python
import time

session_cache = {}
CACHE_TTL = 300  # 5 minutes

def is_session_verified(database, username, session_id, server):
    cache_key = f"{database}:{username}:{session_id}"
    if cache_key in session_cache and session_cache[cache_key] > time.time():
        return True
    if verify_geotab_session(database, username, session_id, server):
        session_cache[cache_key] = time.time() + CACHE_TTL
        return True
    return False
```

### JavaScript

```javascript
var sessionCache = new Map();
var CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function isSessionValid(database, username, sessionId, server) {
    var cacheKey = database + ":" + username + ":" + sessionId;
    var cached = sessionCache.get(cacheKey);
    if (cached && (Date.now() - cached.verifiedAt) < CACHE_TTL_MS) {
        return true;
    }
    var isValid = await verifyGeotabSession(database, username, sessionId, server);
    if (isValid) {
        sessionCache.set(cacheKey, { verifiedAt: Date.now() });
    }
    return isValid;
}
```

## Rate Limiting per User

```python
from collections import defaultdict

user_request_counts = defaultdict(list)
MAX_REQUESTS_PER_HOUR = 20

def check_rate_limit(username):
    now = time.time()
    user_request_counts[username] = [
        t for t in user_request_counts[username] if now - t < 3600
    ]
    if len(user_request_counts[username]) >= MAX_REQUESTS_PER_HOUR:
        return False
    user_request_counts[username].append(now)
    return True
```

## Verify by Security Group (Alternative to User Allowlist)

Instead of maintaining an email list, check Geotab security group membership.

```python
def get_user_groups(database, username, session_id, server):
    url = f"https://{server}/apiv1"
    try:
        resp = requests.post(url, json={
            "method": "Get",
            "params": {
                "typeName": "User",
                "search": {"name": username},
                "credentials": {
                    "database": database,
                    "userName": username,
                    "sessionId": session_id
                }
            }
        }, timeout=10)
        result = resp.json()
        if "result" in result and result["result"]:
            user = result["result"][0]
            return [g["id"] for g in user.get("companyGroups", [])]
    except Exception:
        pass
    return []

# Usage: check if user belongs to required group
REQUIRED_GROUP = "GroupCompanyId"
user_groups = get_user_groups(database, username, session_id, server)
if REQUIRED_GROUP not in user_groups:
    return jsonify({"error": "Insufficient permissions"}), 403
```

## Request Handler Pattern (Python / Flask)

```python
@app.route("/generate", methods=["POST"])
def generate():
    data = request.json or {}
    database = data.get("geotab_database", "")
    username = data.get("geotab_username", "")
    session_id = data.get("geotab_session_id", "")
    server = data.get("geotab_server", "my.geotab.com")

    # 1. Database allowlist (cheap, no network call)
    if database not in ALLOWED_DATABASES:
        return jsonify({"error": "Unauthorized database"}), 403

    # 2. Server validation (prevent SSRF)
    if not is_valid_geotab_server(server):
        return jsonify({"error": "Invalid server"}), 400

    # 3. Session verification (network call, cached)
    if not is_session_verified(database, username, session_id, server):
        return jsonify({"error": "Invalid session"}), 401

    # 4. User allowlist — optional, username can't be spoofed (tied to verified session)
    # if username not in ALLOWED_USERS:
    #     return jsonify({"error": "User not authorized"}), 403

    # 5. Rate limiting
    if not check_rate_limit(username):
        return jsonify({"error": "Rate limit exceeded"}), 429

    # 6. All checks passed — do the actual work
    prompt = data.get("prompt", "")
    return jsonify(do_work(prompt))
```
