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

| Type | Best For | Hosting |
|------|----------|---------|
| **External Hosted** | Active development, frequent updates | GitHub Pages, Replit, Netlify, Vercel |
| **Embedded** | Simple add-ins, easy sharing, no hosting | JSON configuration only |

**CRITICAL: External hosting requires CORS support** with `Access-Control-Allow-Origin: *` header.

## Front-End Styling Options

| Approach | Best For | Framework |
|----------|----------|-----------|
| **Vanilla JS + CSS** | Simple add-ins, embedded deployment | None (ES5) |
| **React + Zenith** | Professional UI matching MyGeotab | React |

**For React-based add-ins:** Use the `geotab-zenith-design` skill for Geotab's official design system. Zenith provides pre-built React components (buttons, tables, modals) with WCAG 2.2 accessibility and consistent MyGeotab styling.

**Note:** Embedded add-ins should use vanilla JS. React/Zenith requires external hosting.

## Add-In Structure

Every Add-In must register with MyGeotab and implement three lifecycle methods:

```javascript
geotab.addin["your-addin-name"] = function() {
    return {
        initialize: function(api, state, callback) {
            // Called once when Add-In loads
            // MUST call callback() when done!
            callback();
        },
        focus: function(api, state) {
            // Called when user navigates to Add-In
            // Refresh data here
        },
        blur: function(api, state) {
            // Called when user navigates away
            // Cleanup here
        }
    };
};  // Note: No () - assign function, don't invoke it
```

**Critical:** Always call `callback()` in initialize or the Add-In will hang.

## Recommended: Single-File Pattern

For AI-assisted development, use a single HTML file with inline CSS and JavaScript:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Add-In</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 10px 0; }
        .stat { font-size: 2em; font-weight: bold; color: #2c3e50; }
    </style>
</head>
<body>
    <h1>Your Add-In</h1>
    <div class="card">
        <div class="stat" id="count">...</div>
    </div>

    <script>
    geotab.addin["your-addin"] = function() {
        var apiRef = null;

        function refresh() {
            if (!apiRef) return;
            apiRef.call("Get", {typeName: "Device"}, function(devices) {
                document.getElementById("count").textContent = devices.length;
            }, function(error) {
                document.getElementById("count").textContent = "Error";
            });
        }

        return {
            initialize: function(api, state, callback) {
                apiRef = api;
                refresh();
                callback();
            },
            focus: function(api, state) {
                apiRef = api;
                refresh();
            },
            blur: function(api, state) {}
        };
    };
    </script>
</body>
</html>
```

## Using the MyGeotab API

### Get Session Info
```javascript
api.getSession(function(credentials, server) {
    console.log("User:", credentials.userName);
    console.log("Database:", credentials.database);
});
```

### Fetch Data
```javascript
// Get all vehicles
api.call("Get", {typeName: "Device"}, function(devices) {
    console.log("Found " + devices.length + " vehicles");
}, function(error) {
    console.error("Error:", error);
});

// With search filter
api.call("Get", {
    typeName: "Device",
    search: { name: "Vehicle 123" }
}, function(devices) {
    // Handle results
});

// With date range
api.call("Get", {
    typeName: "Trip",
    search: {
        fromDate: new Date(Date.now() - 86400000).toISOString(),
        toDate: new Date().toISOString()
    }
}, function(trips) {
    // Handle results
});
```

### MultiCall for Performance
```javascript
api.multiCall([
    ["Get", {typeName: "Device"}],
    ["Get", {typeName: "Zone"}]
], function(results) {
    var devices = results[0];
    var zones = results[1];
});
```

### Common Type Names

| Type | Description |
|------|-------------|
| `Device` | Vehicles/assets |
| `Trip` | Trip records |
| `LogRecord` | GPS position logs |
| `ExceptionEvent` | Rule violations |
| `User` | MyGeotab users |
| `Group` | Vehicle groups |
| `Zone` | Geofences |
| `StatusData` | Engine diagnostics |

### Important API Notes

**Getting Drivers:** Don't use `typeName: "Driver"` - it causes errors. Use:
```javascript
api.call("Get", {
    typeName: "User",
    search: { isDriver: true }
}, function(drivers) {
    console.log("Drivers: " + drivers.length);
});
```

**Counting Entities:** Don't use `resultsLimit` when counting - it limits results:
```javascript
// ❌ Wrong - only returns up to 100
api.call("Get", {typeName: "Device", resultsLimit: 100}, ...);

// ✅ Correct - returns all for accurate count
api.call("Get", {typeName: "Device"}, function(devices) {
    console.log("Total: " + devices.length);
});
```

## MyGeotab Configuration

### External Hosting
```json
{
  "name": "Your Add-In Name",
  "supportEmail": "you@example.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://yourusername.github.io/repo/addin.html",
    "path": "ActivityLink/",
    "menuName": {
      "en": "Your Add-In"
    }
  }]
}
```

### Embedded (No Hosting)

For embedded add-ins, use the `files` property. **All CSS must be inline styles** - `<style>` tags in head may be stripped.

```json
{
  "name": "Embedded Add-In",
  "supportEmail": "you@example.com",
  "version": "1.0",
  "items": [{
    "url": "page.html",
    "path": "ActivityLink",
    "menuName": {"en": "My Add-In"}
  }],
  "files": {
    "page.html": "<!DOCTYPE html><html>...</html>"
  }
}
```

See [references/EMBEDDED.md](references/EMBEDDED.md) for complete embedded add-in guide.

## GitHub Pages Deployment

1. Enable GitHub Pages in repository settings
2. Select main branch as source
3. Add files to repository
4. Wait 2-3 minutes for deployment
5. Access at: `https://username.github.io/repo/file.html`

**Cache Busting:** Add version query if changes don't appear:
```json
"url": "https://username.github.io/repo/addin.html?v=2"
```

## JavaScript Requirements

**Use ES5 only** - MyGeotab may run in older browsers:

```javascript
// ❌ Modern JS (may not work)
const x = 1;
const fn = () => {};
`template ${literal}`;

// ✅ ES5 (always works)
var x = 1;
var fn = function() {};
"string " + variable;
```

## Critical Mistakes to Avoid

| Mistake | Problem | Solution |
|---------|---------|----------|
| Missing `callback()` | Add-In hangs | Always call `callback()` in initialize |
| Using `}();` | Wrong pattern | Use `};` - assign function, don't invoke |
| Modern JS | Browser errors | Use ES5 syntax only |
| No error handling | Silent failures | Always provide error callback |
| `typeName: "Driver"` | API errors | Use `User` with `isDriver: true` |

See [references/TROUBLESHOOTING.md](references/TROUBLESHOOTING.md) for complete debugging guide.

## Quick Reference

### Lifecycle Methods

| Method | When Called | Must Do |
|--------|-------------|---------|
| `initialize` | Once at load | Call `callback()` |
| `focus` | User navigates to | Refresh data |
| `blur` | User navigates away | Cleanup |

### UI Best Practices

- Show `...` while loading
- Show `Error` on failures
- Refresh data in `focus` method
- Use clear loading/error states

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
