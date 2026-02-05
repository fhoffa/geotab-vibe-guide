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

> **CRITICAL:** Embedded Add-Ins use a specific JSON structure. Getting this wrong causes "Page Not Found" errors.

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
"pages": [{ "html": "..." }]
"items": [{ "html": "..." }]
"content": "..."
```

**Correct format:**
```json
"files": { "page.html": "<!DOCTYPE html>..." }
```

See [EMBEDDED.md](EMBEDDED.md) for complete details.

Other options: Netlify, Vercel, Firebase Hosting (all have CORS support).

**CORS Required:** Hosting must include `Access-Control-Allow-Origin: *` header.

## Front-End Styling Options

| Approach | Best For | Notes |
|----------|----------|-------|
| **Vanilla JS + External CSS** | Most add-ins, embedded | ES5 only, external CSS for reliable styling |
| **React + Zenith** | Professional UI matching MyGeotab | See [ZENITH_STYLING.md](ZENITH_STYLING.md) |

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

### Available Methods

| Method | Purpose |
|--------|---------|
| `Get` | Fetch entities by type |
| `GetCountOf` | Count entities (efficient) |
| `Add` | Create new entity |
| `Set` | Update existing entity |
| `Remove` | Delete entity |
| `GetFeed` | Incremental data sync (for polling changes) |
| `GetAddresses` | Reverse geocoding (coordinates -> address) |
| `GetCoordinates` | Geocoding (address -> coordinates) |
| `GetRoadMaxSpeeds` | Speed limits at GPS locations |
| `GetVersion` | API version info |
| `multiCall` | Batch multiple calls in one request |
| `getSession` | Get current user session (userName, database) |
| `GetAceResults` | AI-powered fleet queries (see [ACE_API.md](ACE_API.md)) |

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

### Querying StatusData with Diagnostic IDs

StatusData contains detailed sensor readings, but you need the **correct Diagnostic ID** to get specific measurements. There are 65,000+ diagnostic types - knowing the right ID unlocks detailed vehicle telemetry.

**How to discover Diagnostic IDs:**
1. In MyGeotab, go to **Engine & Maintenance > Engine Measurements**
2. Select the measurement you want (e.g., "Cranking Voltage")
3. Check the URL - it shows the Diagnostic ID: `#engineMeasurements,diagnostics:!(DiagnosticCrankingVoltageId)`

**Example: Get Cranking Voltage for a Vehicle**
```javascript
var fromDate = new Date();
fromDate.setDate(fromDate.getDate() - 7);  // Last 7 days

api.call('Get', {
    typeName: 'StatusData',
    search: {
        diagnosticSearch: { id: 'DiagnosticCrankingVoltageId' },
        deviceSearch: { id: deviceId },
        fromDate: fromDate.toISOString(),
        toDate: new Date().toISOString()
    }
}, function(readings) {
    readings.forEach(function(r) {
        console.log('Voltage: ' + r.data + ' at ' + r.dateTime);
    });
}, errorCallback);
```

**Common Diagnostic IDs:**
| Measurement | Diagnostic ID |
|-------------|---------------|
| Cranking Voltage | `DiagnosticCrankingVoltageId` |
| Odometer | `DiagnosticOdometerAdjustmentId` |
| Fuel Level | `DiagnosticFuelLevelId` |
| Engine Hours | `DiagnosticEngineHoursAdjustmentId` |
| Battery Voltage | `DiagnosticBatteryTemperatureId` |

**Common Mistake:** Similar-sounding IDs may not work. For example, `DiagnosticEngineCrankingVoltageId` returns no data, but `DiagnosticCrankingVoltageId` works. Always verify in Engine Measurements first.

## Persistent Storage (AddInData)

Add-Ins can store custom JSON data that persists across sessions using `AddInData` (10,000 char limit per record).

```javascript
// IMPORTANT: Generate this ID ONCE, then hardcode it in your Add-In
var MY_ADDIN_ID = "a2C4ABQuLFkepPVf6-4OKAQ";  // Fixed ID for this Add-In

// Save
api.call("Add", {
    typeName: "AddInData",
    entity: {
        addInId: MY_ADDIN_ID,
        groups: [{ id: "GroupCompanyId" }],
        details: { theme: "dark", lastUpdated: new Date().toISOString() }
    }
}, function(id) { console.log("Saved:", id); });

// Load
api.call("Get", {
    typeName: "AddInData",
    search: { addInId: MY_ADDIN_ID }
}, function(results) {
    if (results.length > 0) console.log(results[0].details);
});
```

> **Full documentation:** See [STORAGE_API.md](STORAGE_API.md) for query operators, object path notation, update/delete patterns, and limitations.

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

### Getting Full Results (More Than 10 Rows)

Ace's `preview_array` only returns 10 rows. For full data, use `signed_urls` from the response - **CORS-approved for geotab.com** (embedded Add-Ins work):

```javascript
// Extract CSV URL from Ace response messages
if (msg.signed_urls) {
    fetch(msg.signed_urls[0])
        .then(function(r) { return r.text(); })
        .then(function(csv) { /* parse all rows */ });
}
```

> **Full Ace documentation:** See [ACE_API.md](ACE_API.md) for complete patterns, CSV parsing, rate limiting, and code examples.

## Navigation & Integrations

### MyGeotab Navigation

Navigate to other MyGeotab pages using `window.parent.location.hash`:

| Page | Hash | Example |
|------|------|---------|
| Vehicle | `#device,id:{id}` | `#device,id:b3230` |
| Trips | `#tripsHistory,devices:!({id})` | `#tripsHistory,devices:!(b12)` |
| Map | `#map,liveVehicleIds:!({id})` | `#map,liveVehicleIds:!(b3230)` |

```javascript
// Clickable vehicle link
link.onclick = function(e) {
    e.preventDefault();
    window.parent.location.hash = "device,id:" + device.id;
};
```

### External Integrations (No API Key)

| Integration | URL Scheme |
|-------------|-----------|
| Email | `mailto:email?subject=...&body=...` |
| Phone | `tel:number` |
| SMS | `sms:number?body=...` |
| WhatsApp | `https://wa.me/number?text=...` |
| Google Maps | `https://google.com/maps?q=lat,lng` |
| Google Calendar | `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...` |

### Free APIs

| Service | URL | Notes |
|---------|-----|-------|
| Weather | `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current_weather=true` | No key needed |
| Geocoding | `https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json` | 1 req/sec limit |

> **Full documentation:** See [INTEGRATIONS.md](INTEGRATIONS.md) for complete code examples (email, calendar, maps, clipboard, CSV export, print, text-to-speech, native share).

## Critical Mistakes to Avoid

| Mistake | Problem | Solution |
|---------|---------|----------|
| Missing `callback()` | Add-In hangs | Always call `callback()` in initialize |
| Using `}();` | Wrong pattern | Use `};` - assign function, don't invoke |
| Modern JS (ES6+) | Browser errors | Use ES5 syntax only |
| `typeName: "Driver"` | API errors | Use `User` with `isDriver: true` |
| Inline `<style>` tags | Styles don't render | Use external CSS file |
| Variable named `state` | Shadows parameter | Use `appState` or similar |

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for complete debugging guide.

## Embedded Add-Ins (No Hosting)

For quick prototypes without hosting.

> **CRITICAL:** The JSON structure must be EXACTLY as shown below. Common mistakes cause "Page Not Found" errors.

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

| WRONG | CORRECT |
|-------|---------|
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

See [EMBEDDED.md](EMBEDDED.md) for complete embedded add-in guide.

## Complete Examples

**Vehicle Manager** - CRUD operations (list vehicles, rename):
- Live: `https://fhoffa.github.io/geotab-vibe-guide/examples/addins/vehicle-manager/`
- Code: [EXAMPLES.md](EXAMPLES.md#vehicle-manager-crud-example)

**Fleet Stats** - Simple read-only dashboard:
- Code: [EXAMPLES.md](EXAMPLES.md#complete-fleet-stats-example)

## GitHub Pages Deployment

1. Push files to GitHub repository
2. Enable GitHub Pages (Settings > Pages > main branch)
3. Wait 2-3 minutes for deployment
4. Test URL directly in browser first
5. In MyGeotab: Administration > System Settings > Add-Ins
6. Enable "Allow unverified Add-Ins" > Yes (required for custom Add-Ins)
7. Add your Add-In configuration JSON
8. Hard refresh (Ctrl+Shift+R) if add-in doesn't appear

**Cache Busting:** Add version query if changes don't appear:
```json
"url": "https://username.github.io/repo/addin.html?v=2"
```

## Learning Path: Vanilla to Zenith

### Step 1: Start with Vanilla JS

The Vehicle Manager example (see [EXAMPLES.md](EXAMPLES.md)) uses vanilla JavaScript with external CSS. This approach:
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
   - Buttons -> <Button variant="primary/secondary">
   - Text inputs -> <TextInput label="..." />
   - Tables -> <Table columns={} data={} />
   - Loading states -> <Waiting size="large" />
   - Error/success messages -> <Alert variant="error/success">
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
| **Iteration speed** | Edit -> Refresh | Edit -> Build -> Refresh |
| **Error messages** | Clear | Cryptic (minified) |

**Zenith Gotchas We Discovered:**
- `FeedbackProvider` wrapper required for `Alert` components
- Zenith `Table` component has issues with custom render functions -> use HTML table with Zenith styling instead
- Component names differ: `TextInput` (not TextField), `Waiting` (not Spinner)
- Large bundle includes all fonts even if unused

**Recommendation:**
- **Quick prototypes / learning** -> Vanilla JS
- **Production add-ins matching MyGeotab UI** -> Zenith (worth the complexity)
- **Simple add-ins that just work** -> Vanilla JS with Zenith color tokens

## Additional Resources

**Related References:**
- [ZENITH_STYLING.md](ZENITH_STYLING.md) - React component library for professional Geotab UI

**Reference Files:**
- [EXAMPLES.md](EXAMPLES.md) - Full working add-in code
- [EMBEDDED.md](EMBEDDED.md) - No-hosting deployment
- [INTEGRATIONS.md](INTEGRATIONS.md) - Navigation, email, maps, weather, etc.
- [STORAGE_API.md](STORAGE_API.md) - AddInData persistence patterns
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common mistakes and debugging

**External Documentation:**
- [Official Docs](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)
- [API Reference](https://geotab.github.io/sdk/software/api/reference/)
- [Sample Add-Ins](https://github.com/Geotab/sdk-addin-samples)
