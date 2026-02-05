# Troubleshooting & Common Mistakes

## Debugging Checklist

When an Add-In doesn't work:

1. **Check browser console** (F12) for JavaScript errors
2. **Check callback** - are you calling `callback()` in initialize?
3. **Check GitHub Pages** - is the URL accessible? Wait 2-3 minutes after push
4. **Test the URL** - open it directly in browser, does it load?
5. **Check configuration** - valid JSON? Correct URL?
6. **Hard refresh** - Clear cache with Ctrl+Shift+R

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

### 4. Using Modern JS Features

**Problem:** MyGeotab may run in older browsers

```javascript
// Modern JavaScript (may not work)
const devices = [];
api.call("Get", {typeName: "Device"}, (devices) => {
    console.log(`Found ${devices.length} vehicles`);
});

// ES5 JavaScript (always works)
var devices = [];
api.call("Get", {typeName: "Device"}, function(devices) {
    console.log("Found " + devices.length + " vehicles");
});
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
5. ES5 JavaScript syntax
6. Clear comments explaining each part

### Always Warn About:
1. The immediate invocation mistake
2. Forgetting to call callback()
3. Name mismatches between files
4. GitHub Pages deployment wait time (2-3 minutes)
5. Browser cache (suggest hard refresh)
