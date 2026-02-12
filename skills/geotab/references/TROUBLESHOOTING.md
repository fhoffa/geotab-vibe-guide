# Troubleshooting & Common Mistakes

## Debugging Checklist

When an Add-In doesn't work:

1. **Check browser console** (F12) for JavaScript errors
2. **Check callback** - are you calling `callback()` in initialize?
3. **Check GitHub Pages** - is the URL accessible? Wait 2-3 minutes after push
4. **Test the URL** - open it directly in browser, does it load?
5. **Check configuration** - valid JSON? Correct URL?
6. **Hard refresh** - Clear cache with Ctrl+Shift+R

## Copy Debug Data Button (Essential for AI-Assisted Debugging)

Every Add-In should include a "Copy Debug Data" button that copies raw API response data to the clipboard. This is critical for the AI-assisted debugging loop: the user clicks the button, pastes the data back to their AI assistant, and the AI can diagnose the actual problem from real data instead of guessing.

```javascript
var _debugData = {};  // Store raw API responses

function copyDebugData() {
    var t = document.createElement('textarea');
    t.value = JSON.stringify(_debugData, null, 2);
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
    alert('Debug data copied to clipboard! Paste it back to the AI chat for analysis.');
}

// Store data samples in every API callback:
api.call('Get', { typeName: 'Device' }, function(devices) {
    _debugData.devices = devices.slice(0, 5);  // First 5 for debugging
    // ... your logic
}, function(err) {
    _debugData.lastError = String(err.message || err);
});
```

**HTML button (add alongside the debug log toggle):**
```html
<button onclick='copyDebugData()' style='background:#f39c12;color:#fff;border:none;padding:4px 16px;cursor:pointer;font-size:12px;border-radius:4px 4px 0 0;margin-left:4px;'>Copy Debug Data</button>
```

### Why This Matters

In practice, when users report problems to an AI assistant, the AI tends to guess at causes (name mismatch? permissions? CDN issue?) and generate speculative fixes one after another. Each failed guess wastes a full copy-paste-install cycle. The "Copy Debug Data" button short-circuits this: one click gives the AI the actual data to diagnose the real problem immediately.

## On-Screen Debug Console

When browser DevTools are inconvenient (mobile testing, quick iterations), add a visible console directly in your Add-In:

```javascript
// Add this to your Add-In for visible debug output
function setupDebugConsole() {
    var debugDiv = document.createElement("div");
    debugDiv.id = "debug-console";
    debugDiv.style.cssText = "position:fixed;bottom:0;left:0;right:0;max-height:200px;" +
        "overflow-y:auto;background:#1a1a1a;color:#00ff00;font-family:monospace;" +
        "font-size:12px;padding:10px;z-index:9999;border-top:2px solid #333;";
    document.body.appendChild(debugDiv);

    // Override console.log to also display on screen
    var originalLog = console.log;
    console.log = function() {
        var args = Array.prototype.slice.call(arguments);
        var message = args.map(function(arg) {
            return typeof arg === "object" ? JSON.stringify(arg) : String(arg);
        }).join(" ");

        var line = document.createElement("div");
        line.textContent = "[" + new Date().toLocaleTimeString() + "] " + message;
        debugDiv.appendChild(line);
        debugDiv.scrollTop = debugDiv.scrollHeight;

        originalLog.apply(console, arguments);
    };

    console.log("Debug console initialized");
}

// Call in initialize:
initialize: function(api, state, callback) {
    setupDebugConsole();
    console.log("Add-In starting...");
    // ... rest of your code
}
```

### Debug Console Features

- Shows timestamped log messages
- Auto-scrolls to latest
- Objects displayed as JSON
- Visible even without DevTools open
- Useful for mobile testing

### Quick Debug Pattern

For temporary debugging during development:

```javascript
// Simple inline debug - add anywhere
function debug(msg) {
    var d = document.getElementById("debug") || (function() {
        var div = document.createElement("div");
        div.id = "debug";
        div.style.cssText = "position:fixed;bottom:10px;right:10px;background:#000;color:#0f0;" +
            "padding:10px;font-family:monospace;font-size:11px;max-width:400px;max-height:300px;" +
            "overflow:auto;z-index:9999;border-radius:4px;";
        document.body.appendChild(div);
        return div;
    })();
    d.innerHTML += msg + "<br>";
    d.scrollTop = d.scrollHeight;
}

// Usage throughout your code
debug("Loaded " + devices.length + " devices");
debug("API response: " + JSON.stringify(result).substring(0, 100));
```

### Debugging API Calls

Wrap API calls to see what's happening:

```javascript
function debugApiCall(api, method, params, onSuccess, onError) {
    console.log("API CALL: " + method + " with params:", params);

    api.call(method, params,
        function(result) {
            console.log("API SUCCESS: " + method + " returned:", result);
            if (onSuccess) onSuccess(result);
        },
        function(error) {
            console.log("API ERROR: " + method + " failed:", error);
            if (onError) onError(error);
        }
    );
}

// Usage
debugApiCall(api, "Get", { typeName: "Device" }, function(devices) {
    // handle devices
});
```

## API Call Style: Always Use Callbacks (Not api.async)

The Geotab API object injected into Add-Ins supports two calling styles, but only one works reliably everywhere:

```javascript
// ✅ CORRECT — callback-based, works in ALL environments
api.call('Get', { typeName: 'Device' }, function(devices) {
    // success
}, function(err) {
    // error
});

// ❌ WRONG — api.async may be undefined in some MyGeotab environments
api.async.call('Get', { typeName: 'Device' }).then(function(devices) {
    // This crashes with: Cannot read properties of undefined (reading 'call')
});
```

**Why:** `api.async` is a newer convenience wrapper that isn't available in all MyGeotab versions. The callback-based `api.call(method, params, successCb, errorCb)` is the universal, battle-tested pattern.

**For multiple parallel calls**, nest callbacks or use `api.multiCall`:
```javascript
// Option A: Nested callbacks
api.call('Get', { typeName: 'Device' }, function(devices) {
    api.call('Get', { typeName: 'DeviceStatusInfo' }, function(statuses) {
        // Both datasets available here
    });
});

// Option B: multiCall (preferred for independent calls)
api.multiCall([
    ['Get', { typeName: 'Device' }],
    ['Get', { typeName: 'DeviceStatusInfo' }]
], function(results) {
    var devices = results[0];
    var statuses = results[1];
});
```

## The `this` Keyword Trap in Add-Ins

A common crash pattern: defining functions as methods on the return object and calling them with `this` from event handlers or callbacks.

```javascript
// ❌ WRONG — `this` changes context in event handler
geotab.addin['my-addin'] = function() {
    return {
        initialize: function(api, state, callback) {
            document.getElementById('btn').onclick = function() {
                this.run(api);  // ERROR: `this` is now the button element!
            };
            this.run(api);
            callback();
        },
        run: function(api) { /* ... */ }
    };
};

// ✅ CORRECT — define functions as closure variables
geotab.addin['my-addin'] = function() {
    var run = function(api) { /* ... */ };

    return {
        initialize: function(api, state, callback) {
            document.getElementById('btn').onclick = function() {
                run(api);  // Works — `run` is in closure scope
            };
            run(api);
            callback();
        }
    };
};
```

**Rule:** Define your Add-In's internal functions as `var` declarations inside the outer function scope, not as methods on the return object. Pass `api` as a parameter.

## DeviceStatusInfo — Missing Odometer and Engine Hours

`DeviceStatusInfo` returns current vehicle state (GPS, speed, driving status, exception events) but often does NOT include odometer or engine hours. In many Geotab environments, these fields are missing entirely from the response object.

**Real-world example:** A user built a Fleet Replacement dashboard using `DeviceStatusInfo` for odometer data. Every vehicle showed 0 miles because the `odometer` field was absent from the response. The actual odometer data lived in `StatusData` with `DiagnosticOdometerId`.

```javascript
// ❌ UNRELIABLE — odometer may be missing from DeviceStatusInfo
api.call('Get', { typeName: 'DeviceStatusInfo' }, function(statuses) {
    statuses.forEach(function(s) {
        var miles = (s.odometer || 0) / 1609.34;  // Usually 0!
    });
});

// ✅ RELIABLE — query StatusData for odometer and engine hours
api.call('Get', {
    typeName: 'StatusData',
    search: { diagnosticSearch: { id: 'DiagnosticOdometerId' }, latestOnly: true }
}, function(odoData) {
    // Find the reading for a specific device
    var entry = odoData.find(function(o) { return o.device.id === deviceId; });
    var miles = entry ? Math.round(entry.data / 1609.34) : 0;
}, errorCallback);

// Same for engine hours
api.call('Get', {
    typeName: 'StatusData',
    search: { diagnosticSearch: { id: 'DiagnosticEngineHoursId' }, latestOnly: true }
}, function(hourData) {
    var entry = hourData.find(function(h) { return h.device.id === deviceId; });
    var hours = entry ? Math.round(entry.data / 3600) : 0;  // Seconds to hours!
}, errorCallback);
```

**Use DeviceStatusInfo for:** GPS position, speed, driving status, bearing, exception events, device communication status.

**Use StatusData for:** Odometer, engine hours, fuel level, battery voltage, and any specific diagnostic readings.

## StatusData Unit Conversions (Critical!)

StatusData values from the Geotab API use SI/metric base units. Without conversion, values look absurdly large or nonsensical.

| Diagnostic | Raw Unit | To Miles | To Hours | To km/h |
|------------|----------|----------|----------|---------|
| `DiagnosticOdometerId` | **meters** | ÷ 1609.34 | — | ÷ 1000 (km) |
| `DiagnosticEngineHoursId` | **seconds** | — | ÷ 3600 | — |
| `DiagnosticSpeedId` | **km/h** | × 0.621371 (mph) | — | (already km/h) |
| Trip `.distance` | **kilometers** | × 0.621371 | — | (already km) |

**Real-world example:** An odometer reading of `193,297,400` is meters, not miles. That's `193,297,400 / 1609.34 ≈ 120,109 miles`. Engine hours of `12,891,600` is seconds, which is `12,891,600 / 3600 ≈ 3,581 hours`.

```javascript
// Convert StatusData odometer (meters) to miles
var miles = Math.round(odoEntry.data / 1609.34);

// Convert StatusData engine hours (seconds) to hours
var hours = Math.round(hourEntry.data / 3600);
```

## Common Mistakes

### 1. Forgetting to Call callback()

**Problem:** Add-In hangs during initialization

```javascript
// Wrong - callback never called
initialize: function(api, state, callback) {
    loadData(api);
    // Missing callback()!
}

// Correct
initialize: function(api, state, callback) {
    loadData(api);
    callback();
}

// Also correct - call after async work
initialize: function(api, state, callback) {
    api.call("Get", {typeName: "Device"}, function(devices) {
        displayDevices(devices);
        callback();  // Called when async work completes
    });
}
```

### 2. Not Handling Errors

**Problem:** API calls fail silently

```javascript
// No error handling
api.call("Get", {typeName: "Device"}, function(devices) {
    displayDevices(devices);
});

// With error handling
api.call("Get", {typeName: "Device"},
    function(devices) {
        displayDevices(devices);
    },
    function(error) {
        console.error("Failed to load devices:", error);
        showErrorMessage("Could not load vehicles. Please try again.");
    }
);
```

### 3. Using Immediate Invocation

**Problem:** Using `}();` instead of `};` when registering

```javascript
// Wrong - invokes the function immediately
geotab.addin["name"] = function() { return {...}; }();

// Correct - assigns the function for MyGeotab to call
geotab.addin["name"] = function() { return {...}; };
```

### 4. Undeclared Variables

**Problem:** Forgetting `const`, `let`, or `var` creates implicit globals

```javascript
// Wrong - implicit global
devices = [];

// Correct - properly declared
const devices = [];
```

### 5. Variable Name Collisions with 'state'

**Problem:** Using `state` as both parameter AND global variable

```javascript
// Wrong - 'state' parameter collides with global
var state = { data: [] };

geotab.addin["name"] = function() {
    return {
        initialize: function(api, state, callback) {
            // Which 'state'? Confusion!
            state.data = [];  // Modifies parameter, not your variable!
            callback();
        }
    };
};

// Correct - use different names
var appState = { data: [] };

geotab.addin["name"] = function() {
    return {
        initialize: function(api, pageState, callback) {
            // Clear: appState is yours, pageState is from MyGeotab
            appState.data = [];
            callback();
        }
    };
};
```

### 6. Using resultsLimit for Counting

**Problem:** Only getting partial count

```javascript
// Wrong - only returns up to 100
api.call("Get", {
    typeName: "Device",
    resultsLimit: 100
}, function(devices) {
    // devices.length will be at most 100!
});

// Correct - returns all for accurate count
api.call("Get", {
    typeName: "Device"
}, function(devices) {
    console.log("Total vehicles: " + devices.length);
});
```

### 7. Using typeName: "Driver" Directly

**Problem:** Causes InvalidCastException in many databases

```javascript
// Wrong - causes errors in many databases
api.call("Get", {typeName: "Driver"}, ...);

// Correct - always works
api.call("Get", {
    typeName: "User",
    search: { isDriver: true }
}, function(drivers) {
    console.log("Total drivers: " + drivers.length);
});
```

## GitHub Pages Issues

### Changes Not Appearing

1. **Wait 2-3 minutes** after pushing for deployment
2. **Check GitHub Actions** if deployment takes too long: go to `https://github.com/YOUR-USERNAME/YOUR-REPO/actions` to see deployment status and whether GitHub is being slow
3. **Add cache buster** to URL:
   ```json
   "url": "https://username.github.io/repo/addin.html?v=2"
   ```
4. **Hard refresh** browser: Ctrl+Shift+R

### 404 Errors

1. Verify GitHub Pages is enabled in repo settings
2. Check branch is set correctly (usually `main`)
3. Ensure files are in root or correct path
4. Check filename case sensitivity (Linux is case-sensitive)

## CORS Issues

**Symptom:** Add-In won't load, console shows CORS errors

**Solution:** Your hosting must include `Access-Control-Allow-Origin: *` header

**Platforms with proper CORS:**
- GitHub Pages
- Replit
- Netlify
- Firebase Hosting
- Vercel

## Testing Checklist for Users

1. Wait 2-3 minutes after pushing to GitHub
2. Open the HTML file directly in browser to verify it loads
3. Check browser console for errors
4. Hard refresh MyGeotab (Ctrl+Shift+R)
5. Verify the Add-In appears in menu
6. Check console for "registered" and "initializing" messages

## Working with Speed Data and ExceptionEvents

Common issues when building speeding dashboards and safety Add-Ins.

**Full reference:** See [SPEED_DATA.md](SPEED_DATA.md) for complete patterns (Python + JavaScript).

### Quick Reference: Common Speed Data Issues

**ExceptionEvent.details undefined (CONFIRMED):**
```javascript
// Wrong - crashes if details missing
Math.round(ex.details.maxSpeed)

// Correct - defensive check
(ex.details && ex.details.maxSpeed) || 0
```

**Demo database limitations (CONFIRMED):**
- `DiagnosticSpeedId` and `DiagnosticPostedRoadSpeedId` return 0 results
- Use `DiagnosticEngineRoadSpeedId` as alternative speed source
- ExceptionEvents have no `details` object in demo databases
- See SPEED_DATA.md for `detectDemoDatabase()` function to auto-detect

**Wrong diagnostic ID (CONFIRMED):**
```javascript
// Wrong - doesn't exist
diagnosticSearch: { id: "DiagnosticPostedSpeedId" }

// Correct
diagnosticSearch: { id: "DiagnosticPostedRoadSpeedId" }
```

**Unverified patterns** (see [SPEED_DATA.md](SPEED_DATA.md)):
- Time window buffering for StatusData queries (30-second buffer)
- StatusData fallback when `details` is missing

---

## When Helping Users

### Always Include:
1. The correct pattern without `()`
2. All three lifecycle methods
3. The `callback()` call in initialize
4. Error handling for API calls
5. Properly declared variables (const/let/var)
6. Clear comments explaining each part

### Always Warn About:
1. The immediate invocation mistake
2. Forgetting to call callback()
3. Name mismatches between files
4. GitHub Pages deployment wait time (2-3 minutes)
5. Browser cache (suggest hard refresh)

### After Debugging: Offer Lessons Learned

If a debugging session uncovered a non-obvious API gotcha (e.g., DeviceStatusInfo missing odometer, reference objects returning only IDs, unit conversion surprises), offer to write a short summary the user can file at https://github.com/fhoffa/geotab-vibe-guide/issues. Keep it to: what went wrong, what the actual fix was, and which API behavior was surprising. Don't offer this for trivial typos or config mistakes — only when there's a genuine lesson that would help others.
