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
| Files on HTTPS server | Code in JSON configuration |
| Separate HTML, CSS, JS files | Everything inline in one string |
| Easy to develop and debug | Good for simple prototypes |
| **Use external CSS files for styling** | Must use inline `style=""` attributes |

**Recommended Hosting: GitHub Pages** - Free, simple static hosting with proper CORS support. Just push files and enable Pages in repo settings.

Other options: Netlify, Vercel, Firebase Hosting (all have CORS support).

<!-- TODO: Explore Replit server-side capabilities for dynamic add-ins (API proxies, data processing) -->

**CORS Required:** Hosting must include `Access-Control-Allow-Origin: *` header.

## Front-End Styling Options

| Approach | Best For | Notes |
|----------|----------|-------|
| **Vanilla JS + External CSS** | Most add-ins, embedded | ES5 only, external CSS for reliable styling |
| **React + Zenith** | Professional UI matching MyGeotab | See `geotab-zenith-design` skill |

**Note:** Embedded add-ins must use vanilla JS with inline styles. React/Zenith requires external hosting.

## Add-In Structure

Every Add-In must register with MyGeotab and implement three lifecycle methods:

```javascript
geotab.addin["your-addin-name"] = function() {
    var apiRef = null;

    return {
        initialize: function(api, state, callback) {
            apiRef = api;
            // Setup code here
            callback();  // MUST call this!
        },
        focus: function(api, state) {
            apiRef = api;
            // Refresh data here
        },
        blur: function(api, state) {
            // Cleanup here
        }
    };
};  // Note: No () - assign function, don't invoke it
```

## Recommended: External CSS Pattern

For reliable styling in MyGeotab's iframe, use separate CSS files (inline `<style>` tags may not render):

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

// DON'T use resultsLimit when counting!
// api.call("Get", { typeName: "Device", resultsLimit: 100 })
// ^ Wrong - only returns up to 100, not total count
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

| Mistake | Problem | Solution |
|---------|---------|----------|
| Missing `callback()` | Add-In hangs | Always call `callback()` in initialize |
| Using `}();` | Wrong pattern | Use `};` - assign function, don't invoke |
| Modern JS (ES6+) | Browser errors | Use ES5 syntax only |
| `typeName: "Driver"` | API errors | Use `User` with `isDriver: true` |
| Inline `<style>` tags | Styles don't render | Use external CSS file |
| Variable named `state` | Shadows parameter | Use `appState` or similar |

See [references/TROUBLESHOOTING.md](references/TROUBLESHOOTING.md) for complete debugging guide.

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
- Path without trailing slash: `"ActivityLink"` (not `"ActivityLink/"`)

See [references/EMBEDDED.md](references/EMBEDDED.md) for complete embedded add-in guide.

## Complete Example: Vehicle Manager

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

## GitHub Pages Deployment

1. Push files to GitHub repository
2. Enable GitHub Pages (Settings → Pages → main branch)
3. Wait 2-3 minutes for deployment
4. Test URL directly in browser first
5. Add to MyGeotab: Administration → System Settings → Add-Ins → paste JSON
6. Hard refresh (Ctrl+Shift+R) if add-in doesn't appear

**Cache Busting:** Add version query if changes don't appear:
```json
"url": "https://username.github.io/repo/addin.html?v=2"
```

## Additional Resources

**Related Skills:**
- `geotab-zenith-design` - React component library for professional Geotab UI

**Reference Files:**
- [Complete Examples](references/EXAMPLES.md) - Full working add-in code
- [Embedded Add-Ins Guide](references/EMBEDDED.md) - No-hosting deployment
- [Troubleshooting](references/TROUBLESHOOTING.md) - Common mistakes and debugging

**External Documentation:**
- [Official Docs](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)
- [API Reference](https://geotab.github.io/sdk/software/api/reference/)
- [Sample Add-Ins](https://github.com/Geotab/sdk-addin-samples)
