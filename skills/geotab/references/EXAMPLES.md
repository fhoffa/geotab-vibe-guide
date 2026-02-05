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

---

## Vehicle Manager (CRUD Example)

A working add-in with CRUD operations that lists vehicles and allows renaming them.

**Live example:** `https://fhoffa.github.io/geotab-vibe-guide/examples/addins/vehicle-manager/`

**vehicle-manager.css**
```css
body {
    margin: 0; padding: 20px;
    font-family: 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}
.container { max-width: 900px; margin: 0 auto; }
.header { color: white; text-align: center; margin-bottom: 30px; }
.card {
    background: white; border-radius: 12px; padding: 24px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;
}
.stat-value { font-size: 36px; font-weight: bold; color: #1f2937; }
.vehicle-list { width: 100%; border-collapse: collapse; }
.vehicle-list th, .vehicle-list td { padding: 12px; border-bottom: 1px solid #f3f4f6; text-align: left; }
.vehicle-name-input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; width: 100%; box-sizing: border-box; }
.save-btn { background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.save-btn:hover { background: #5a67d8; }
.save-btn:disabled { background: #9ca3af; cursor: not-allowed; }
```

**vehicle-manager.html**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Vehicle Manager</title>
    <link rel="stylesheet" href="vehicle-manager.css">
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Fleet Management</h1>
            <div>Connected as: <span id="username">...</span></div>
        </div>
        <div class="card">
            <div>Total Vehicles: <span id="vehicle-count" class="stat-value">...</span></div>
        </div>
        <div class="card">
            <h2>Manage Vehicles</h2>
            <table class="vehicle-list">
                <thead><tr><th>Serial Number</th><th>Name</th><th>Action</th></tr></thead>
                <tbody id="vehicle-table-body"><tr><td colspan="3">Loading...</td></tr></tbody>
            </table>
        </div>
    </div>
    <script src="vehicle-manager.js"></script>
</body>
</html>
```

**vehicle-manager.js**
```javascript
"use strict";

geotab.addin["vehicle-manager"] = function() {
    var apiRef = null;

    function updateStats() {
        if (!apiRef) return;

        apiRef.getSession(function(session) {
            document.getElementById("username").textContent = session.userName;
        });

        apiRef.call("Get", { typeName: "Device" }, function(devices) {
            document.getElementById("vehicle-count").textContent = devices.length;
            renderVehicleList(devices);
        }, function(err) {
            document.getElementById("vehicle-count").textContent = "Error";
        });
    }

    function renderVehicleList(devices) {
        var tbody = document.getElementById("vehicle-table-body");
        tbody.innerHTML = "";

        devices.forEach(function(device) {
            var tr = document.createElement("tr");

            var tdSerial = document.createElement("td");
            tdSerial.textContent = device.serialNumber || "N/A";
            tr.appendChild(tdSerial);

            var tdName = document.createElement("td");
            var input = document.createElement("input");
            input.type = "text";
            input.className = "vehicle-name-input";
            input.value = device.name || "";
            input.id = "input-" + device.id;
            tdName.appendChild(input);
            tr.appendChild(tdName);

            var tdAction = document.createElement("td");
            var btn = document.createElement("button");
            btn.textContent = "Save";
            btn.className = "save-btn";
            btn.onclick = function() {
                saveVehicleName(device.id, document.getElementById("input-" + device.id).value, btn);
            };
            tdAction.appendChild(btn);
            tr.appendChild(tdAction);

            tbody.appendChild(tr);
        });
    }

    function saveVehicleName(deviceId, newName, btn) {
        btn.disabled = true;
        btn.textContent = "Saving...";

        apiRef.call("Set", {
            typeName: "Device",
            entity: { id: deviceId, name: newName }
        }, function() {
            btn.disabled = false;
            btn.textContent = "Saved!";
            setTimeout(function() { btn.textContent = "Save"; }, 2000);
        }, function(err) {
            btn.disabled = false;
            btn.textContent = "Retry";
            alert("Error: " + (err.message || err));
        });
    }

    return {
        initialize: function(api, state, callback) {
            apiRef = api;
            updateStats();
            callback();
        },
        focus: function(api, state) {
            apiRef = api;
            updateStats();
        },
        blur: function(api, state) {}
    };
};
```

**MyGeotab Configuration:**
```json
{
  "name": "Vehicle Manager",
  "supportEmail": "https://github.com/fhoffa/geotab-vibe-guide",
  "version": "1.0.0",
  "items": [{
    "url": "https://fhoffa.github.io/geotab-vibe-guide/examples/addins/vehicle-manager/vehicle-manager.html",
    "path": "ActivityLink/",
    "menuName": { "en": "Vehicle Manager" }
  }]
}
```
