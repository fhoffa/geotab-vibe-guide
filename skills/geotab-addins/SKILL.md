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

### Quick Reference: Embedded Add-In Format

> ⚠️ **CRITICAL:** Embedded Add-Ins use a specific JSON structure. Getting this wrong causes "Page Not Found" errors.

```json
{
  "name": "My Add In",
  "supportEmail": "https://github.com/your-repo",
  "version": "1.0",
  "items": [{
    "url": "page.html",
    "path": "ActivityLink",
    "menuName": { "en": "My Add-In" }
  }],
  "files": {
    "page.html": "<!DOCTYPE html><html>...</html>"
  }
}
```

**Common Mistake - WRONG format:**
```json
❌ "pages": [{ "html": "..." }]
❌ "items": [{ "html": "..." }]
❌ "content": "..."
```

**Correct format:**
```json
✅ "files": { "page.html": "<!DOCTYPE html>..." }
```

See [Embedded Add-Ins](#embedded-add-ins-no-hosting) section for complete details.

Other options: Netlify, Vercel, Firebase Hosting (all have CORS support).

<!-- TODO: Explore Replit server-side capabilities for dynamic add-ins (API proxies, data processing) -->

**CORS Required:** Hosting must include `Access-Control-Allow-Origin: *` header.

## Front-End Styling Options

| Approach | Best For | Notes |
|----------|----------|-------|
| **Vanilla JS + External CSS** | Most add-ins, embedded | ES5 only, external CSS for reliable styling |
| **React + Zenith** | Professional UI matching MyGeotab | See `geotab-addin-zenith-styling` skill |

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
  "name": "Your Add In",
  "supportEmail": "https://github.com/fhoffa/geotab-vibe-guide",
  "version": "1.0.0",
  "items": [{
    "url": "https://yourusername.github.io/repo/your-addin.html",
    "path": "ActivityLink/",
    "menuName": { "en": "Your Add-In" }
  }]
}
```

**Configuration Rules:**
- `name`: Letters, numbers, spaces, dots, dashes, underscores, parentheses OK. No `&`, `+`, `!`. Use `"Fleet Dashboard (Beta)"` not `"Fleet & Dashboard"`
- `supportEmail`: Never use support@geotab.com. Use `https://github.com/fhoffa/geotab-vibe-guide` or your own contact
- `menuName`: Can contain spaces and special characters (this is what users see in the menu)

**Embedded Add-In Rules:**
- `<style>` tags ARE stripped - use inline `style=""` or load CSS dynamically via JS
- CDN JS libraries WORK via `<script src="https://cdn...">`
- CDN CSS works via dynamic loading: `var link=document.createElement('link');link.rel='stylesheet';link.href='https://cdn.../bootstrap.min.css';document.head.appendChild(link);`
- Must use ES5 JavaScript (no arrow functions, const/let, template literals)

**Recommended CDN Libraries:**
- **Charts:** Chart.js (`https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js`)
- **Maps:** Leaflet (`https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` + CSS via dynamic load)
- **Dates:** Day.js (`https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.10/dayjs.min.js`)
- **CSS Framework:** Bootstrap (load CSS dynamically: `https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css`)

**Leaflet Vehicle Map Pattern:**
```javascript
// Load Leaflet JS in HTML head, CSS dynamically
var link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
document.head.appendChild(link);

// Create map and add markers for vehicle positions
var map = L.map('map').setView([37.7749, -122.4194], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OpenStreetMap'
}).addTo(map);

api.call('Get', { typeName: 'DeviceStatusInfo' }, function(statuses) {
    statuses.forEach(function(status) {
        if (status.latitude && status.longitude) {
            L.marker([status.latitude, status.longitude])
                .addTo(map)
                .bindPopup('<b>' + status.device.id + '</b>');
        }
    });
});
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

## Using Geotab Ace in Add-Ins

Add-Ins can use Geotab Ace for AI-powered natural language queries. **Ace uses the same API connection** - no separate authentication needed.

| Direct API | Ace AI |
|-----------|--------|
| ~400ms response | ~30-90 seconds |
| Real-time data | 2-24 hours behind |
| Structured queries | Natural language |
| Best for: live data, writes | Best for: trends, insights |

### Quick Example

```javascript
// Ace uses the SAME api object - no separate auth
askAce(api, "Which vehicles drove the most last month?", function(result) {
    console.log("Data:", result.data);       // Array of rows
    console.log("Reasoning:", result.reasoning); // AI explanation
}, function(error) {
    console.error("Error:", error);
});
```

### Good Ace Questions

- "Which drivers have the best safety scores this month?"
- "What's the fuel consumption trend for vehicle X?"
- "Find vehicles that might need maintenance soon"
- "Compare performance across my fleet regions"

### When NOT to Use Ace

- Displaying current vehicle positions (use DeviceStatusInfo)
- Showing today's trips (use Get Trip with date filter)
- Creating/updating entities (use Add/Set)
- Any UI that needs instant response

> **Full Ace documentation:** See the [geotab-ace skill](../geotab-ace/SKILL.md) for complete patterns, response parsing, rate limiting, and code examples.

## Navigating to MyGeotab Pages

Add-Ins can navigate the parent MyGeotab window to other pages using `window.parent.location.hash`. This makes entity names (vehicles, drivers, zones) clickable.

### Navigation Hash Patterns

| Page | Hash Format | Example |
|------|-------------|---------|
| Vehicle detail | `#device,id:{id}` | `#device,id:b3230` |
| Trip history | `#tripsHistory,devices:!({id})` | `#tripsHistory,devices:!(b12)` |
| Exceptions | `#exceptions2,assetsFilter:!({id})` | `#exceptions2,assetsFilter:!(b3306)` |
| Live map | `#map,liveVehicleIds:!({id})` | `#map,liveVehicleIds:!(b3230)` |
| Zone edit | `#zones,edit:{id}` | `#zones,edit:b2F` |

### Creating Clickable Vehicle Links

```javascript
function createVehicleLink(device) {
    var link = document.createElement("a");
    link.textContent = device.name;
    link.href = "#";
    link.style.cssText = "color:#2563eb;cursor:pointer;";
    link.onclick = function(e) {
        e.preventDefault();
        window.parent.location.hash = "device,id:" + device.id;
    };
    return link;
}
```

### Multiple Action Links

```javascript
// In a table row, add links for different destinations
var actionsCell = document.createElement("td");

// Link to vehicle page
var vehicleLink = document.createElement("a");
vehicleLink.textContent = "Details";
vehicleLink.href = "#";
vehicleLink.onclick = function(e) {
    e.preventDefault();
    window.parent.location.hash = "device,id:" + device.id;
};
actionsCell.appendChild(vehicleLink);

actionsCell.appendChild(document.createTextNode(" | "));

// Link to trip history
var tripsLink = document.createElement("a");
tripsLink.textContent = "Trips";
tripsLink.href = "#";
tripsLink.onclick = function(e) {
    e.preventDefault();
    window.parent.location.hash = "tripsHistory,devices:!(" + device.id + ")";
};
actionsCell.appendChild(tripsLink);
```

**Key points:**
- Use `device.id` (the internal ID like "b3230"), not `device.name`
- Array parameters use `!(id)` syntax
- Multiple IDs: `devices:!(b12,b13,b14)`
- Always call `e.preventDefault()` in click handlers

## Creative Integrations (Browser-Native)

Add-Ins can integrate with external services using URL schemes and browser APIs - no external hosting or API keys needed.

### Email with Pre-Populated Content

```javascript
// "Report Issue" link that opens email with vehicle details
function createEmailLink(device, recipientEmail) {
    var link = document.createElement("a");
    var subject = encodeURIComponent("Issue with " + device.name);
    var body = encodeURIComponent(
        "Vehicle: " + device.name + "\n" +
        "Serial: " + device.serialNumber + "\n\n" +
        "Describe the issue:\n"
    );
    link.href = "mailto:" + recipientEmail + "?subject=" + subject + "&body=" + body;
    link.textContent = "Report Issue";
    return link;
}
```

### Google Calendar Event

```javascript
// Create a maintenance reminder in Google Calendar
function createCalendarLink(device, date) {
    var title = encodeURIComponent("Maintenance: " + device.name);
    var details = encodeURIComponent(
        "Vehicle: " + device.name + "\n" +
        "Serial: " + device.serialNumber
    );
    var dateStr = date.toISOString().replace(/-|:|\.\d+/g, "").slice(0, 15) + "Z";
    return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
           "&text=" + title +
           "&details=" + details +
           "&dates=" + dateStr + "/" + dateStr;
}
```

### Google Maps Link

```javascript
// Open location in Google Maps
function createMapsLink(latitude, longitude, label) {
    var link = document.createElement("a");
    link.href = "https://www.google.com/maps?q=" + latitude + "," + longitude;
    link.textContent = label || "Open in Maps";
    link.target = "_blank";
    return link;
}
```

### Call or Text Driver

```javascript
// Phone call link
function createCallLink(phoneNumber, label) {
    var link = document.createElement("a");
    link.href = "tel:" + phoneNumber;
    link.textContent = label || "Call";
    return link;
}

// SMS link with pre-filled message
function createSmsLink(phoneNumber, message, label) {
    var link = document.createElement("a");
    link.href = "sms:" + phoneNumber + "?body=" + encodeURIComponent(message);
    link.textContent = label || "Text";
    return link;
}
```

### WhatsApp Message

```javascript
// WhatsApp link with pre-filled message (use number without + or spaces)
function createWhatsAppLink(phoneNumber, message, label) {
    var link = document.createElement("a");
    link.href = "https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent(message);
    link.textContent = label || "WhatsApp";
    link.target = "_blank";
    return link;
}
```

### Copy to Clipboard

```javascript
// Copy text to clipboard
function copyToClipboard(text, button) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);

    // Visual feedback
    var originalText = button.textContent;
    button.textContent = "Copied!";
    setTimeout(function() { button.textContent = originalText; }, 2000);
}

// Usage
var copyBtn = document.createElement("button");
copyBtn.textContent = "Copy Details";
copyBtn.onclick = function() {
    copyToClipboard("Vehicle: " + device.name + "\nSerial: " + device.serialNumber, copyBtn);
};
```

### Download as CSV

```javascript
// Generate and download CSV file
function downloadCSV(data, filename) {
    var csv = "Name,Serial Number,Type\n";
    data.forEach(function(d) {
        csv += '"' + (d.name || "") + '","' + (d.serialNumber || "") + '","' + (d.deviceType || "") + '"\n';
    });

    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename || "export.csv";
    link.click();
    URL.revokeObjectURL(url);
}
```

### Print Report

```javascript
// Print button
var printBtn = document.createElement("button");
printBtn.textContent = "Print Report";
printBtn.onclick = function() { window.print(); };
```

### Text-to-Speech

```javascript
// Speak text aloud (hands-free use)
function speak(text) {
    if ("speechSynthesis" in window) {
        var utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
}

// Example: Read fleet summary
speak("You have " + devices.length + " vehicles and " + drivers.length + " drivers.");
```

### Native Share (Mobile)

```javascript
// Use device's native share functionality
function shareData(title, text) {
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        copyToClipboard(text);
    }
}
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

For quick prototypes without hosting.

> ⚠️ **CRITICAL:** The JSON structure must be EXACTLY as shown below. Common mistakes cause "Page Not Found" errors.

### Correct Format

```json
{
  "name": "Embedded Add In",
  "supportEmail": "https://github.com/fhoffa/geotab-vibe-guide",
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

### Common Format Mistakes

| ❌ WRONG | ✅ CORRECT |
|----------|-----------|
| `"pages": [{"html": "..."}]` | `"files": {"page.html": "..."}` |
| `"items": [{"html": "..."}]` | `"files": {"page.html": "..."}` |
| `"content": "..."` | `"files": {"page.html": "..."}` |
| `"path": "ActivityLink/"` (trailing slash) | `"path": "ActivityLink"` (no trailing slash) |

### Embedded Rules

- Use `style=""` on elements (not `<style>` tags - they get stripped!)
- Single quotes for HTML attributes inside JSON strings
- Escape double quotes: `\"`
- No external file references (everything inline)
- `url` in items matches filename in `files` object
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
5. In MyGeotab: Administration → System Settings → Add-Ins
6. Enable "Allow unverified Add-Ins" → Yes (required for custom Add-Ins)
7. Add your Add-In configuration JSON
8. Hard refresh (Ctrl+Shift+R) if add-in doesn't appear

**Cache Busting:** Add version query if changes don't appear:
```json
"url": "https://username.github.io/repo/addin.html?v=2"
```

## Learning Path: Vanilla to Zenith

### Step 1: Start with Vanilla JS

The Vehicle Manager example above uses vanilla JavaScript with external CSS. This approach:
- Works immediately (no build step)
- Easy to understand and modify
- Good for learning the Geotab API patterns
- Runs directly in MyGeotab

**Test it:** Use the vanilla example at `examples/addins/vehicle-manager/`

**Ready-to-use JSON (copy & paste into MyGeotab):**
```json
{
  "name": "Vehicle Manager Vanilla",
  "supportEmail": "https://github.com/fhoffa/geotab-vibe-guide",
  "version": "1.0.0",
  "items": [{
    "url": "https://fhoffa.github.io/geotab-vibe-guide/examples/addins/vehicle-manager/vehicle-manager.html",
    "path": "ActivityLink/",
    "menuName": { "en": "Vehicle Manager" }
  }]
}
```

### Step 2: Vibe Code the Transformation to Zenith

Once comfortable with the vanilla version, use AI to transform it to React + Zenith for a professional MyGeotab look.

**Prompt to give your AI assistant:**

```
Transform this Geotab Add-In to use React and the @geotab/zenith design system:

1. Convert the vanilla JS to a React functional component
2. Replace custom CSS with Zenith components:
   - Buttons → <Button variant="primary/secondary">
   - Text inputs → <TextInput label="..." />
   - Tables → <Table columns={} data={} />
   - Loading states → <Waiting size="large" />
   - Error/success messages → <Alert variant="error/success">
3. Use Zenith design tokens for any custom styling (--zenith-spacing-md, etc.)
4. Set up webpack build configuration
5. Keep the same Geotab API logic (Get, Set calls)

Here's my current vanilla JS add-in:
[paste your code]
```

**What changes:**

| Vanilla JS | React + Zenith |
|-----------|----------------|
| `document.getElementById()` | React state + JSX |
| Custom `.save-btn` CSS | `<Button variant="primary">` |
| Custom input styling | `<TextInput label="Name">` |
| Manual DOM table building | `<Table columns={} data={}>` |
| `alert()` for errors | `<Alert variant="error">` |
| No build step | npm + webpack required |

**Zenith version example:** `examples/addins/vehicle-manager-zenith/`

**Ready-to-use JSON (copy & paste into MyGeotab):**
```json
{
  "name": "Vehicle Manager Zenith",
  "supportEmail": "https://github.com/fhoffa/geotab-vibe-guide",
  "version": "1.0.0",
  "items": [{
    "url": "https://fhoffa.github.io/geotab-vibe-guide/examples/addins/vehicle-manager-zenith/dist/vehicle-manager.html",
    "path": "ActivityLink/",
    "menuName": { "en": "Vehicle Manager (Zenith)" }
  }]
}
```

### Why This Progression?

1. **Learn the API first** - Vanilla JS lets you focus on Geotab API patterns without React complexity
2. **Understand what Zenith replaces** - You'll appreciate Zenith more after building custom CSS
3. **Easier debugging** - Vanilla JS has no build step, simpler stack traces
4. **Vibe coding works better** - AI can transform working code more reliably than generating complex React from scratch

### Zenith Trade-offs (Be Aware!)

| Aspect | Vanilla JS | React + Zenith |
|--------|-----------|----------------|
| **Setup time** | Instant | npm install + build (minutes) |
| **Bundle size** | ~5 KB | ~2.3 MB (fonts, components) |
| **Debugging** | Clear stack traces | Minified, hard to trace |
| **Dependencies** | None | React, Zenith, Webpack, Babel |
| **Iteration speed** | Edit → Refresh | Edit → Build → Refresh |
| **Error messages** | Clear | Cryptic (minified) |

**Zenith Gotchas We Discovered:**
- `FeedbackProvider` wrapper required for `Alert` components
- Zenith `Table` component has issues with custom render functions → use HTML table with Zenith styling instead
- Component names differ: `TextInput` (not TextField), `Waiting` (not Spinner)
- Large bundle includes all fonts even if unused

**Recommendation:**
- **Quick prototypes / learning** → Vanilla JS
- **Production add-ins matching MyGeotab UI** → Zenith (worth the complexity)
- **Simple add-ins that just work** → Vanilla JS with Zenith color tokens

## Additional Resources

**Related Skills:**
- `geotab-addin-zenith-styling` - React component library for professional Geotab UI

**Reference Files:**
- [Complete Examples](references/EXAMPLES.md) - Full working add-in code
- [Embedded Add-Ins Guide](references/EMBEDDED.md) - No-hosting deployment
- [Troubleshooting](references/TROUBLESHOOTING.md) - Common mistakes and debugging

**External Documentation:**
- [Official Docs](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)
- [API Reference](https://geotab.github.io/sdk/software/api/reference/)
- [Sample Add-Ins](https://github.com/Geotab/sdk-addin-samples)
