# Complete Add-In Examples

## Single-File Pattern (Recommended)

When using AI coding tools, request a **single HTML file** with all CSS and JavaScript inline:

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

## Complete Fleet Stats Example

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

        // Get drivers (use User with isDriver filter)
        apiReference.call("Get", {
            typeName: "User",
            search: { isDriver: true }
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

**MyGeotab Configuration:**
```json
{
  "name": "Fleet Statistics",
  "supportEmail": "https://github.com/fhoffa/geotab-vibe-guide",
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

## Separate Files Pattern

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

console.log("Add-In registered");
```

## UI Best Practices

- Show `...` or `--` while loading data
- Show `Error` if API calls fail
- Auto-refresh data in the `focus` method
- Use clear loading/error CSS classes

```javascript
// Loading state
document.getElementById("stat-value").textContent = "...";
document.getElementById("stat-value").className = "stat loading";

// Success state
document.getElementById("stat-value").textContent = devices.length;
document.getElementById("stat-value").className = "stat";

// Error state
document.getElementById("stat-value").textContent = "Error";
document.getElementById("stat-value").className = "stat error";
```
