---
name: geotab-addins
description: Build custom Add-Ins that extend the MyGeotab fleet management interface with custom pages, dashboards, and functionality. Use when creating integrations that appear directly in MyGeotab UI or when someone wants to add custom features to their Geotab fleet management system.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "1.0"
---

# Building Geotab Add-Ins

## Purpose
This skill teaches AI assistants how to build Geotab Add-Ins that extend the MyGeotab fleet management platform with custom pages and functionality.

## What Are Geotab Add-Ins?
Geotab Add-Ins are custom pages that integrate directly into the MyGeotab interface. They can:
- Display custom dashboards using MyGeotab API data
- Create specialized tools and reports
- Integrate external data sources with fleet information

## Two Deployment Types

**External Hosted (Recommended for Development)**
- Files hosted on any HTTPS server with CORS support
- Can serve static files or dynamically generated content
- Easier to develop, test, and debug
- Faster iteration (just update files on server)
- Can use separate HTML, CSS, and JS files
- Best for active development and frequent updates

**CRITICAL: CORS Requirement**
The hosting platform MUST support Cross-Origin Resource Sharing (CORS) and include the `Access-Control-Allow-Origin: *` header in responses. Without this, MyGeotab cannot load the add-in.

**Recommended Hosting Platforms (all have proper CORS support):**
- **GitHub Pages** - Free, easy setup, great for open source
- **Replit** - Excellent for AI-assisted development and quick prototypes
- **Netlify** - Fast deploys, good for static sites
- **Firebase Hosting** - Google's platform, good performance
- **Vercel** - Great for modern web apps

**Embedded (No Hosting Required)**
- Code embedded directly in JSON configuration
- No external hosting needed at all
- Full access to MyGeotab JavaScript API (same as external)
- Perfect for simple add-ins, prototypes, and sharing
- Everything in one JSON file - easy to copy-paste
- Requires JSON string escaping and everything must be inline

## Required Structure

### Single-File Pattern (Recommended for AI/Vibe Coding)

When using AI coding tools like Replit, Cursor, or Claude, request a **single HTML file** with all CSS and JavaScript inline. This simplifies deployment and reduces issues:

**single-file-addin.html**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Add-In</title>
    <style>
        /* All CSS here - inline in the HTML */
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 10px 0; }
        .stat { font-size: 2em; font-weight: bold; color: #2c3e50; }
        .loading { color: #999; }
        .error { color: #d9534f; }
    </style>
</head>
<body>
    <h1>Your Add-In Title</h1>
    <div class="card">
        <h2>Statistic Name</h2>
        <div class="stat" id="stat-value">...</div>
    </div>

    <script>
    // All JavaScript inline - ES5 only!
    geotab.addin["your-addin-name"] = function() {
        var apiRef = null;

        function updateStats() {
            if (!apiRef) return;

            // Get session info
            apiRef.getSession(function(session) {
                // Update UI with session.userName and session.database
            });

            // Get all vehicles (no resultsLimit!)
            apiRef.call("Get", {
                typeName: "Device"
            }, function(devices) {
                document.getElementById("stat-value").textContent = devices.length;
            }, function(error) {
                document.getElementById("stat-value").textContent = "Error";
                document.getElementById("stat-value").className = "stat error";
            });
        }

        return {
            initialize: function(api, state, callback) {
                apiRef = api;
                updateStats();
                callback(); // MUST call this!
            },
            focus: function(api, state) {
                apiRef = api;
                updateStats(); // Refresh on focus
            },
            blur: function(api, state) {
                // Cleanup if needed
            }
        };
    };

    console.log("Add-In registered");
    </script>
</body>
</html>
```

**Benefits of Single-File Pattern:**
- One file to deploy - simpler for AI tools
- No path issues between HTML and JS
- Easier to test locally
- Works with all hosting platforms
- AI can generate complete working code in one response

**UI Best Practices:**
- Show `...` while loading data
- Show `Error` if API calls fail
- Auto-refresh data in the `focus` method
- Use clear loading/error CSS classes

### Separate Files Pattern (Alternative)
An external Add-In can also use two files:

**your-addin.html**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Add-In</title>
    <style>
        /* Your CSS here */
    </style>
</head>
<body>
    <div id="app">
        <!-- Your UI here -->
    </div>
    <script src="your-addin.js"></script>
</body>
</html>
```

**your-addin.js**
```javascript
"use strict";

geotab.addin["your-addin-name"] = function() {
    // Private variables and functions here
    var privateData = null;

    function helperFunction() {
        // Helper code
    }

    // Return the Add-In object
    return {
        initialize: function(api, state, callback) {
            // Called once when Add-In loads
            // MUST call callback() when done!

            console.log("Initializing...");

            // Store API reference if needed
            privateData = api;

            // Do initialization work
            helperFunction();

            // Signal completion
            callback();
        },

        focus: function(api, state) {
            // Called when user navigates to this Add-In
            // Perfect place to refresh data
            console.log("Add-In focused");
        },

        blur: function(api, state) {
            // Called when user navigates away
            // Use for cleanup or saving state
            console.log("Add-In blurred");
        }
    };
};  // Note: No () here - assign the function, not its result
    // MyGeotab will call this function when ready

console.log("Add-In registered");
```

**Pattern Note:** Don't use immediate invocation `}();` - MyGeotab expects a function it can call, not the returned object.

## Embedded Add-Ins (No Hosting Required)

Instead of hosting files externally, you can embed everything directly in the JSON configuration using the `files` property. This eliminates the need for GitHub Pages or HTTPS hosting.

### Critical: CSS Must Be Inline in Embedded Add-Ins

**IMPORTANT:** When creating embedded add-ins, you CANNOT use `<style>` tags in the `<head>`. MyGeotab may strip or ignore these styles. Instead, you MUST use inline styles directly on each element.

**This will NOT work:**
```html
<head>
  <style>
    .card { background: white; padding: 20px; }
  </style>
</head>
<body>
  <div class="card">Content</div>
</body>
```

**This WILL work:**
```html
<body>
  <div style="background:white;padding:20px;">Content</div>
</body>
```

For embedded add-ins, build your HTML strings with inline styles in JavaScript, or use the `style` attribute directly on every element that needs styling.

### Structure
```json
{
  "name": "Embedded Add-In",
  "supportEmail": "you@example.com",
  "version": "1.0",
  "items": [{
    "url": "page.html",
    "path": "ActivityLink",
    "menuName": {
      "en": "My Add-In"
    }
  }],
  "files": {
    "page.html": "<html><head><title>My Add-In</title></head><body style='font-family:Arial;padding:20px;'><div id='app' style='font-size:2em;'>Loading...</div><script>geotab.addin['myapp']=function(){return{initialize:function(api,state,callback){document.getElementById('app').textContent='Connected!';api.call('Get',{typeName:'Device'},function(devices){document.getElementById('app').textContent='Vehicles: '+devices.length;});callback();},focus:function(api,state){},blur:function(api,state){}};};console.log('Add-in registered');</script></body></html>"
  }
}
```

**Critical Points:**
- Use `"url": "page.html"` in items (NOT `"page"`)
- Remove trailing slash from path: `"ActivityLink"` not `"ActivityLink/"`
- **All CSS and JavaScript MUST be inlined** in the HTML using `<style>` and `<script>` tags
- **Cannot use separate file references** like `<script src="app.js">` - they will cause 404 errors
- Everything must be in a single HTML string

### Complete Working Example (Inline Styles)

This embedded add-in shows vehicle count using the MyGeotab API with inline styles:

```json
{
  "name": "Embedded Fleet Stats",
  "supportEmail": "test@example.com",
  "version": "1.0",
  "items": [{
    "url": "fleet-stats.html",
    "path": "ActivityLink",
    "menuName": {
      "en": "Fleet Stats"
    }
  }],
  "files": {
    "fleet-stats.html": "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Fleet Stats</title></head><body style='margin:0;padding:20px;font-family:Arial,sans-serif;background:#f5f5f5;'><h1 style='color:#333;'>Fleet Statistics</h1><div id='status' style='margin:15px 0;'>Initializing...</div><div id='info'></div><script>geotab.addin['embedded-fleet']=function(){return{initialize:function(api,state,callback){var statusEl=document.getElementById('status');var infoEl=document.getElementById('info');statusEl.textContent='Connected to MyGeotab!';api.getSession(function(session){var html='<div style=\"margin:15px 0;padding:10px;background:#e8f4f8;border-radius:4px;\"><strong>User:</strong> '+session.userName+'<br><strong>Database:</strong> '+session.database+'</div>';infoEl.innerHTML=html;api.call('Get',{typeName:'Device'},function(vehicles){html+='<div style=\"margin:15px 0;padding:10px;background:#e8f4f8;border-radius:4px;\"><div style=\"font-size:2em;font-weight:bold;color:#2c3e50;margin:10px 0;\">'+vehicles.length+'</div><strong>Total Vehicles</strong></div>';infoEl.innerHTML=html;},function(error){html+='<div style=\"color:#d9534f;padding:10px;background:#f8d7da;border-radius:4px;\">Error: '+error+'</div>';infoEl.innerHTML=html;});});callback();},focus:function(api,state){},blur:function(api,state){}};};console.log('Embedded fleet stats registered');</script></body></html>"
  }
}
```

### Important Notes for Embedded Add-Ins

**Everything Must Be Inlined:**
- ❌ **Cannot use** `<script src="app.js">` or `<link rel="stylesheet" href="styles.css">`
- ✅ **Must use** inline `<script>` and `<style>` tags within the HTML
- All JavaScript and CSS must be embedded directly in the HTML string
- External file references will cause 404 errors and MIME type errors

**JSON String Escaping:**
- Double quotes must be escaped: `\"` instead of `"`
- Single quotes are safer for HTML attributes: `<div class='card'>` instead of `<div class="card">`
- Newlines should be removed (use minified code)
- Backslashes must be escaped: `\\` instead of `\`

**Example escaping:**
```javascript
// Original JavaScript
var message = "Hello \"World\"";

// In JSON string
"var message=\"Hello \\\"World\\\"\";"
```

**API Access:**
- Full MyGeotab API access works exactly like external add-ins
- Same `api.call()`, `api.getSession()`, etc.
- All lifecycle methods work identically

**Development Workflow:**
1. Develop with external hosting first (easier to debug)
2. When ready, convert to embedded format
3. Minify JavaScript to reduce size
4. Escape quotes and special characters
5. Test in MyGeotab

**When to Use Embedded:**
- Quick prototypes and demos
- Simple add-ins that won't change often
- Easy sharing (just copy-paste JSON)
- No access to hosting or GitHub
- Educational examples
- Self-contained tools

**When to Use External Hosting:**
- Active development (easier debugging)
- Frequent updates needed
- Large add-ins with many files
- Team collaboration
- Version control desired

## Using React or Modern Frameworks in Embedded Add-Ins

**Warning:** React and modern JavaScript frameworks can have issues in embedded Geotab add-ins due to:
1. State management not working properly in the MyGeotab iframe context
2. External library loading failures (CDN blocking)
3. CSS-in-JS not applying correctly

**Recommendation:** For embedded add-ins, use **vanilla JavaScript** with inline styles for maximum compatibility. Save React/frameworks for externally-hosted add-ins where you have full control.

If you must use React in embedded add-ins:
- Expect state updates to be unreliable
- Use inline styles exclusively, not Tailwind or CSS-in-JS
- Test extensively in the actual MyGeotab environment

### MyGeotab Configuration (External Hosting)
```json
{
  "name": "Your Add-In Name",
  "supportEmail": "you@example.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://yourusername.github.io/your-repo/your-addin.html",
    "path": "ActivityLink/",
    "menuName": {
      "en": "Your Add-In"
    }
  }]
}
```

## Lifecycle Methods

### initialize(api, state, callback)
**Required.** Called once when the Add-In first loads.

**Parameters:**
- `api` - MyGeotab API object (use this to fetch data)
- `state` - Current page state (contains context like selected groups)
- `callback` - **MUST be called** when initialization completes

**Common tasks:**
- Set up UI
- Fetch initial data
- Register event listeners
- Store API reference for later use

**Critical:** Always call `callback()` or the Add-In will hang!

```javascript
initialize: function(api, state, callback) {
    // Setup work
    document.getElementById("status").textContent = "Loading...";

    // Fetch initial data
    api.call("Get", {typeName: "Device"}, function(devices) {
        displayDevices(devices);
        callback();  // ✅ Called after async work completes
    });
}
```

### focus(api, state)
**Required.** Called when user navigates to this Add-In page.

**Use cases:**
- Refresh data to show latest information
- Resume animations or timers
- Show welcome messages

```javascript
focus: function(api, state) {
    console.log("User viewing Add-In");
    refreshDashboard(api);
}
```

### blur(api, state)
**Required.** Called when user navigates away from this Add-In.

**Use cases:**
- Save user's work or preferences
- Stop timers or animations
- Clean up resources

```javascript
blur: function(api, state) {
    console.log("User left Add-In");
    saveUserPreferences();
    clearInterval(refreshTimer);
}
```

## Using the MyGeotab API

### Get Session Information
```javascript
api.getSession(function(credentials, server) {
    console.log("User:", credentials.userName);
    console.log("Database:", credentials.database);
});
```

### Fetch Data
```javascript
// Get all vehicles
api.call("Get", {
    typeName: "Device"
}, function(devices) {
    console.log("Found " + devices.length + " vehicles");
    // Success callback
}, function(error) {
    console.error("Error:", error);
    // Error callback (optional)
});

// Get specific vehicle
api.call("Get", {
    typeName: "Device",
    search: {
        name: "Vehicle 123"
    }
}, function(devices) {
    if (devices.length > 0) {
        console.log("Found:", devices[0]);
    }
});

// Get data with date range
var yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

api.call("Get", {
    typeName: "Trip",
    search: {
        fromDate: yesterday.toISOString(),
        toDate: new Date().toISOString()
    }
}, function(trips) {
    console.log("Trips:", trips.length);
});
```

### Common Type Names
- `Device` - Vehicles/assets
- `Trip` - Trip records
- `LogRecord` - GPS position logs
- `ExceptionEvent` - Rule violations (speeding, harsh braking, etc.)
- `Driver` - Driver records
- `User` - MyGeotab users
- `Group` - Vehicle groups/folders
- `Zone` - Geofences
- `Rule` - Exception rules
- `FuelTransaction` - Fuel fill-ups
- `StatusData` - Engine diagnostic data

**IMPORTANT: Getting Driver Counts**
Do NOT use `typeName: "Driver"` - it causes errors in many databases including demos. Instead:

```javascript
// ❌ Wrong - causes InvalidCastException in many databases
api.call("Get", {typeName: "Driver"}, ...);

// ✅ Correct - always works
api.call("Get", {
    typeName: "User",
    search: { isDriver: true }
}, function(drivers) {
    console.log("Total drivers: " + drivers.length);
});
```

**IMPORTANT: Don't Use resultsLimit for Counting**
When counting total entities, do NOT use the `resultsLimit` parameter - it limits the returned results, so you won't get an accurate count:

```javascript
// ❌ Wrong - only returns up to 100, not the total count
api.call("Get", {
    typeName: "Device",
    resultsLimit: 100
}, function(devices) {
    // devices.length will be at most 100!
});

// ✅ Correct - returns all devices for accurate count
api.call("Get", {
    typeName: "Device"
}, function(devices) {
    console.log("Total vehicles: " + devices.length);
});
```

### MultiCall for Performance
```javascript
// Make multiple API calls in parallel
api.multiCall([
    ["Get", {typeName: "Device"}],
    ["Get", {typeName: "Driver"}],
    ["Get", {typeName: "Zone"}]
], function(results) {
    var devices = results[0];
    var drivers = results[1];
    var zones = results[2];
    console.log("Loaded all data");
});
```

## GitHub Pages Deployment

### Setup
1. Enable GitHub Pages in repository settings
2. Select main branch as source
3. Add HTML and JS files to repository root
4. Commit and push
5. Wait 2-3 minutes for deployment
6. Access at: `https://username.github.io/repo/file.html`

### Cache Busting
If changes don't appear immediately, add version query parameter:
```html
<script src="your-addin.js?v=2"></script>
```

Or in configuration:
```json
"url": "https://username.github.io/repo/your-addin.html?v=2"
```

## Common Mistakes to Avoid

### 1. Forgetting to Call callback()
**Problem:** Add-In hangs during initialization
**Solution:** Always call `callback()` at the end of `initialize()`

```javascript
// ❌ Wrong - callback never called
initialize: function(api, state, callback) {
    loadData(api);
    // Missing callback()!
}

// ✅ Correct
initialize: function(api, state, callback) {
    loadData(api);
    callback();
}

// ✅ Also correct - call after async work
initialize: function(api, state, callback) {
    api.call("Get", {typeName: "Device"}, function(devices) {
        displayDevices(devices);
        callback();  // Called when async work completes
    });
}
```

### 2. Not Handling Errors
**Problem:** API calls fail silently
**Solution:** Always provide error callback

```javascript
// ❌ No error handling
api.call("Get", {typeName: "Device"}, function(devices) {
    displayDevices(devices);
});

// ✅ With error handling
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
**Problem:** Using `}();` instead of `};` when registering the Add-In
**Solution:** Assign the function itself, not its result

```javascript
// ❌ Wrong
geotab.addin["name"] = function() { return {...}; }();

// ✅ Correct
geotab.addin["name"] = function() { return {...}; };
```

### 4. Using Modern JS Features
**Problem:** MyGeotab may run in older browsers
**Solution:** Use ES5 JavaScript (no arrow functions, const/let, template literals)

```javascript
// ❌ Modern JavaScript (may not work)
const devices = [];
api.call("Get", {typeName: "Device"}, (devices) => {
    console.log(`Found ${devices.length} vehicles`);
});

// ✅ ES5 JavaScript (always works)
var devices = [];
api.call("Get", {typeName: "Device"}, function(devices) {
    console.log("Found " + devices.length + " vehicles");
});
```

### 5. Variable Name Collisions with 'state' Parameter
**Problem:** Using `state` as both a function parameter AND a global variable causes confusion
**Solution:** Rename your global state variable to avoid collision

```javascript
// ❌ Wrong - 'state' parameter collides with global 'state' variable
var state = { data: [] };

geotab.addin["name"] = function() {
    return {
        initialize: function(api, state, callback) {
            // Which 'state' are we using? Confusion!
            state.data = [];  // This modifies the parameter, not your variable!
            callback();
        }
    };
};

// ✅ Correct - use different names
var appState = { data: [] };

geotab.addin["name"] = function() {
    return {
        initialize: function(api, pageState, callback) {
            // Clear: appState is your data, pageState is from MyGeotab
            appState.data = [];
            callback();
        }
    };
};
```

## Debugging Checklist

When an Add-In doesn't work:

1. **Check browser console** (F12) for JavaScript errors
2. **Check callback** - are you calling `callback()` in initialize?
3. **Check GitHub Pages** - is the URL accessible? Wait 2-3 minutes after push
4. **Test the URL** - open it directly in browser, does it load?
5. **Check configuration** - valid JSON? Correct URL?
6. **Hard refresh** - Clear cache with Ctrl+Shift+R

## Complete Working Example

**fleet-stats.html**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Fleet Stats</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .card {
            background: white;
            padding: 20px;
            margin: 10px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
        }
    </style>
</head>
<body>
    <h1>Fleet Statistics</h1>
    <div class="card">
        <h2>Total Vehicles</h2>
        <div class="stat" id="vehicle-count">--</div>
    </div>
    <div class="card">
        <h2>Total Drivers</h2>
        <div class="stat" id="driver-count">--</div>
    </div>
    <script src="fleet-stats.js"></script>
</body>
</html>
```

**fleet-stats.js**
```javascript
"use strict";

geotab.addin["fleet-stats"] = function() {
    var apiReference = null;

    function updateStats() {
        if (!apiReference) return;

        // Get vehicles
        apiReference.call("Get", {
            typeName: "Device"
        }, function(devices) {
            document.getElementById("vehicle-count").textContent = devices.length;
        }, function(error) {
            console.error("Error loading vehicles:", error);
            document.getElementById("vehicle-count").textContent = "Error";
        });

        // Get drivers
        apiReference.call("Get", {
            typeName: "Driver"
        }, function(drivers) {
            document.getElementById("driver-count").textContent = drivers.length;
        }, function(error) {
            console.error("Error loading drivers:", error);
            document.getElementById("driver-count").textContent = "Error";
        });
    }

    return {
        initialize: function(api, state, callback) {
            console.log("Fleet Stats initializing...");
            apiReference = api;
            updateStats();
            callback();
        },

        focus: function(api, state) {
            console.log("Fleet Stats focused - refreshing...");
            apiReference = api;
            updateStats();
        },

        blur: function(api, state) {
            console.log("Fleet Stats blurred");
        }
    };
};

console.log("Fleet Stats registered");
```

**Configuration to paste into MyGeotab:**
```json
{
  "name": "Fleet Statistics",
  "supportEmail": "you@example.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://yourusername.github.io/your-repo/fleet-stats.html",
    "path": "ActivityLink/",
    "menuName": {
      "en": "Fleet Stats"
    }
  }]
}
```

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

### Testing Checklist for Users:
1. Wait 2-3 minutes after pushing to GitHub
2. Open the HTML file directly in browser to verify it loads
3. Check browser console for errors
4. Hard refresh MyGeotab (Ctrl+Shift+R)
5. Verify the Add-In appears in menu
6. Check console for "registered" and "initializing" messages

## References

- Official Documentation: https://developers.geotab.com/myGeotab/addIns/developingAddIns/
- API Reference: https://geotab.github.io/sdk/software/api/reference/
- Sample Add-Ins: https://github.com/Geotab/sdk-addin-samples
