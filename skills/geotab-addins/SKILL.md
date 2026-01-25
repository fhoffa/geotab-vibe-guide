---
name: geotab-addins
description: Build custom Add-Ins that extend the MyGeotab fleet management interface with custom pages, dashboards, and functionality. Use when creating integrations that appear directly in MyGeotab UI or when someone wants to add custom features to their Geotab fleet management system.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "1.0"
---

# Building Geotab Add-Ins

## What Are Geotab Add-Ins?
Custom pages that integrate directly into MyGeotab. They can display dashboards, create tools/reports, and modify fleet data.

## Two Deployment Types

| External Hosted (Recommended) | Embedded (No Hosting) |
|------------------------------|----------------------|
| Files on HTTPS server (GitHub Pages, Replit, etc.) | Code in JSON configuration |
| Separate HTML, CSS, JS files | Everything inline in one string |
| Easy to develop and debug | Good for simple prototypes |
| **Use external CSS files for styling** | Must use inline `style=""` attributes |

**CORS Required:** Hosting must include `Access-Control-Allow-Origin: *` header.

## Recommended Structure (3 Files)

For reliable styling in MyGeotab's iframe, use separate CSS files:

**your-addin.html**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Add-In</title>
    <link rel="stylesheet" href="your-addin.css">
</head>
<body>
    <div id="app">...</div>
    <script src="your-addin.js"></script>
</body>
</html>
```

**your-addin.css**
```css
body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
.card { background: white; padding: 20px; border-radius: 8px; }
```

**your-addin.js**
```javascript
"use strict";

geotab.addin["your-addin-name"] = function() {
    var apiRef = null;

    function loadData() {
        if (!apiRef) return;
        apiRef.call("Get", { typeName: "Device" }, function(devices) {
            document.getElementById("app").textContent = "Vehicles: " + devices.length;
        }, function(error) {
            console.error("Error:", error);
        });
    }

    return {
        initialize: function(api, state, callback) {
            apiRef = api;
            loadData();
            callback();  // MUST call this!
        },
        focus: function(api, state) {
            apiRef = api;
            loadData();  // Refresh on focus
        },
        blur: function(api, state) {}
    };
};
```

**MyGeotab Configuration:**
```json
{
  "name": "Your Add-In",
  "supportEmail": "you@example.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://yourusername.github.io/repo/your-addin.html",
    "path": "ActivityLink/",
    "menuName": { "en": "Your Add-In" }
  }]
}
```

## Lifecycle Methods

| Method | When Called | Must Do |
|--------|-------------|---------|
| `initialize(api, state, callback)` | Once on first load | Call `callback()` when done! |
| `focus(api, state)` | User navigates to add-in | Refresh data |
| `blur(api, state)` | User navigates away | Cleanup/save state |

## API Operations

### Read Data (Get)
```javascript
api.call("Get", { typeName: "Device" }, function(devices) {
    console.log("Found " + devices.length + " vehicles");
}, function(error) {
    console.error("Error:", error);
});

// With search criteria
api.call("Get", {
    typeName: "Device",
    search: { name: "Vehicle 123" }
}, successCallback, errorCallback);

// Get drivers (NOT typeName: "Driver" - it causes errors!)
api.call("Get", {
    typeName: "User",
    search: { isDriver: true }
}, function(drivers) { ... });
```

### Update Data (Set)
```javascript
api.call("Set", {
    typeName: "Device",
    entity: { id: deviceId, name: "New Name" }
}, function() {
    console.log("Updated!");
}, function(error) {
    console.error("Error:", error);
});
```

### Create Data (Add)
```javascript
api.call("Add", {
    typeName: "Zone",
    entity: { name: "New Geofence", points: [...] }
}, function(newId) {
    console.log("Created with ID:", newId);
});
```

### Delete Data (Remove)
```javascript
api.call("Remove", {
    typeName: "Zone",
    entity: { id: zoneId }
}, function() {
    console.log("Deleted");
});
```

### Multiple Calls (MultiCall)
```javascript
api.multiCall([
    ["Get", { typeName: "Device" }],
    ["Get", { typeName: "User", search: { isDriver: true } }]
], function(results) {
    var devices = results[0];
    var drivers = results[1];
});
```

### Session Info
```javascript
api.getSession(function(session) {
    console.log("User:", session.userName);
    console.log("Database:", session.database);
});
```

### Common Type Names
`Device` (vehicles), `User`, `Trip`, `Zone` (geofences), `LogRecord` (GPS), `ExceptionEvent` (rule violations), `Group`, `Rule`, `FuelTransaction`, `StatusData`

## Critical Mistakes to Avoid

### 1. Forgetting callback()
```javascript
// WRONG - Add-In hangs forever
initialize: function(api, state, callback) {
    loadData(api);
    // Missing callback()!
}

// CORRECT
initialize: function(api, state, callback) {
    loadData(api);
    callback();
}
```

### 2. Using typeName: "Driver"
```javascript
// WRONG - causes InvalidCastException
api.call("Get", { typeName: "Driver" }, ...);

// CORRECT
api.call("Get", { typeName: "User", search: { isDriver: true } }, ...);
```

### 3. Inline styles in external add-ins
```html
<!-- WRONG - styles may not render in MyGeotab iframe -->
<style>.card { background: white; }</style>

<!-- CORRECT - use external CSS file -->
<link rel="stylesheet" href="styles.css">
```

### 4. Immediate invocation
```javascript
// WRONG
geotab.addin["name"] = function() { return {...}; }();

// CORRECT - no () at end
geotab.addin["name"] = function() { return {...}; };
```

### 5. Modern JavaScript (ES6+)
```javascript
// WRONG - may not work in older browsers
const x = 1;
devices.forEach(d => console.log(d));

// CORRECT - use ES5
var x = 1;
devices.forEach(function(d) { console.log(d); });
```

## Embedded Add-Ins (No Hosting)

For quick prototypes without hosting:

```json
{
  "name": "Embedded Add-In",
  "supportEmail": "you@example.com",
  "version": "1.0",
  "items": [{
    "url": "page.html",
    "path": "ActivityLink",
    "menuName": { "en": "My Add-In" }
  }],
  "files": {
    "page.html": "<!DOCTYPE html><html><body style='padding:20px;font-family:Arial;'><div id='app'>Loading...</div><script>geotab.addin['myapp']=function(){return{initialize:function(api,state,callback){api.call('Get',{typeName:'Device'},function(d){document.getElementById('app').textContent='Vehicles: '+d.length;});callback();},focus:function(){},blur:function(){}};};console.log('registered');</script></body></html>"
  }
}
```

**Embedded Rules:**
- Use `style=""` on elements (not `<style>` tags)
- Single quotes for HTML attributes
- Escape double quotes: `\"`
- No external file references

## Complete Example: Vehicle Manager

A working add-in that lists vehicles and allows renaming them.

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

## Deployment Checklist

1. **Push files** to GitHub/Replit
2. **Enable GitHub Pages** (Settings → Pages → main branch)
3. **Wait 2-3 minutes** for deployment
4. **Test URL directly** in browser first
5. **Add to MyGeotab**: Administration → System Settings → Add-Ins → paste JSON
6. **Hard refresh** (Ctrl+Shift+R) if add-in doesn't appear

## References

- Official Docs: https://developers.geotab.com/myGeotab/addIns/developingAddIns/
- API Reference: https://geotab.github.io/sdk/software/api/reference/
- Sample Add-Ins: https://github.com/Geotab/sdk-addin-samples
