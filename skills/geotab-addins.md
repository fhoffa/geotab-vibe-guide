# Claude Skill: Building Geotab Add-Ins

## Purpose
This skill teaches AI assistants how to build Geotab Add-Ins that extend the MyGeotab fleet management platform with custom pages and functionality.

## Core Knowledge

### What Are Geotab Add-Ins?
Geotab Add-Ins are custom pages that integrate directly into the MyGeotab interface. They can:
- Display custom dashboards using MyGeotab API data
- Create specialized tools and reports
- Integrate external data sources with fleet information

### Two Deployment Types

**External Hosted (Recommended)**
- Files hosted on GitHub Pages or HTTPS server
- Full access to MyGeotab JavaScript API
- Easy to develop and iterate
- Use this for any Add-In that needs API access

**Embedded**
- Code embedded in JSON configuration
- No external hosting required
- Very limited - mainly for static content
- Avoid for anything beyond simple HTML display

## Required Structure

### File Structure
An external Add-In needs two files:

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

### MyGeotab Configuration
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

---

**Remember:** The most common mistake is using `}();` instead of `};` - always double-check this!
