# Building Geotab Add-Ins

**Extend MyGeotab with custom pages using HTML, CSS, and JavaScript.**

This guide shows you how to build Add-Ins that integrate directly into the MyGeotab interface.

---

## What Are Geotab Add-Ins?

Geotab Add-Ins let you add custom pages to MyGeotab. They appear in the navigation menu and can:
- Display custom dashboards using MyGeotab data
- Create specialized tools for your workflow
- Build business-specific reports and visualizations

### Two Approaches

**1. Embedded Add-Ins** (Simple)
- Code is embedded directly in the JSON configuration
- No external hosting required
- Good for very simple pages with minimal JavaScript
- Limited - cannot easily access MyGeotab API in complex ways

**2. External Hosted Add-Ins** (Recommended)
- Files hosted on GitHub Pages or other HTTPS server
- Full access to MyGeotab JavaScript API
- Easy to develop and iterate
- Can use modern development tools
- **This is the recommended approach**

---

## Quick Start: Working Example

We have a tested, working Add-In you can try right now.

### 1. Wait for GitHub Pages

Our example is hosted at:
```
https://fhoffa.github.io/geotab-vibe-guide/simple-test.html
```

Give it 2-3 minutes after this repository is updated to ensure GitHub Pages has deployed the latest version.

### 2. Install in MyGeotab

1. Go to: **Administration → System → System Settings → Add-Ins**
2. Click **"New Add-In"** → **"Configuration"** tab
3. Paste this JSON:

```json
{
  "name": "Simple Fleet Test",
  "supportEmail": "test@example.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://fhoffa.github.io/geotab-vibe-guide/simple-test.html",
    "path": "ActivityLink/",
    "menuName": {
      "en": "Simple Test"
    }
  }]
}
```

4. Click **"Save"** and refresh MyGeotab
5. Look for **"Simple Test"** in the left navigation menu

### 3. What You'll See

The Add-In displays:
- ✅ Connection status
- Your username and database
- Total vehicle count from your fleet

**Check the browser console** (F12) to see the lifecycle methods being called:
- `initialize()` - Called once when the page loads
- `focus()` - Called when you navigate to the Add-In
- `blur()` - Called when you navigate away

---

## How It Works

### The Files

An external Add-In needs just two files:

**simple-test.html**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Simple Test</title>
    <style>
        /* Your styles here */
        body { font-family: Arial, sans-serif; padding: 20px; }
        .card { background: white; border-radius: 8px; padding: 20px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🚗 Simple Fleet Test</h1>
        <div id="status">Initializing...</div>
        <div id="info"></div>
    </div>
    <script src="https://yoursite.com/simple-test.js"></script>
</body>
</html>
```

**simple-test.js**
```javascript
"use strict";

// CRITICAL: Assign the function itself - do NOT use () at the end!
geotab.addin["simple-test"] = function() {
    console.log("Add-In loading...");

    return {
        initialize: function(api, state, callback) {
            console.log("Initialize called!");

            var statusEl = document.getElementById("status");
            statusEl.textContent = "✅ Connected!";

            // Get user info
            api.getSession(function(session) {
                var html = '<p>User: ' + session.userName + '</p>';
                html += '<p>Database: ' + session.database + '</p>';

                // Get vehicle count
                api.call("Get", {
                    typeName: "Device"
                }, function(vehicles) {
                    html += '<p>Vehicles: ' + vehicles.length + '</p>';
                    document.getElementById("info").innerHTML = html;
                });
            });

            callback();
        },

        focus: function(api, state) {
            console.log("Focus called");
        },

        blur: function(api, state) {
            console.log("Blur called");
        }
    };
};  // ✅ NO () here - this is critical!

console.log("Add-In registered");
```

### The Critical Pattern

**DO NOT use immediate function invocation!**

```javascript
// ❌ WRONG - This will NOT work!
geotab.addin.myAddin = function() {
    return {...};
}();  // The () breaks it!

// ✅ CORRECT - This works!
geotab.addin.myAddin = function() {
    return {...};
};  // No () - let MyGeotab call your function
```

**Why this matters:**
- MyGeotab needs to **call your function** to get the Add-In object
- With `()` you're assigning the object directly
- MyGeotab won't recognize it and won't call `initialize()`

### The Lifecycle Methods

Your Add-In object must return three methods:

**1. initialize(api, state, callback)**
- Called once when your Add-In first loads
- `api` - The MyGeotab API object (use this to fetch data)
- `state` - Current page state
- `callback` - **You MUST call this when initialization is complete**

**2. focus(api, state)**
- Called when user navigates to your Add-In
- Perfect time to refresh data

**3. blur(api, state)**
- Called when user navigates away
- Use this to save state or clean up

---

## Using the MyGeotab API

The `api` object gives you access to all MyGeotab data:

```javascript
// Get current session
api.getSession(function(credentials) {
    console.log("User:", credentials.userName);
    console.log("Database:", credentials.database);
});

// Get all vehicles
api.call("Get", {
    typeName: "Device"
}, function(devices) {
    console.log("Found " + devices.length + " vehicles");
}, function(error) {
    console.error("Error:", error);
});

// Get trips from last 7 days
var oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

api.call("Get", {
    typeName: "Trip",
    search: {
        fromDate: oneWeekAgo.toISOString()
    }
}, function(trips) {
    console.log("Found " + trips.length + " trips");
});
```

**Common typeName values:**
- `Device` - Vehicles
- `Trip` - Trip data
- `LogRecord` - GPS logs
- `ExceptionEvent` - Rule violations
- `Driver` - Driver information
- `Zone` - Geofences

See the [Geotab API Reference](https://geotab.github.io/sdk/software/api/reference/) for all available types and methods.

---

## Hosting on GitHub Pages

GitHub Pages provides free HTTPS hosting - perfect for Add-Ins!

### Setup Steps

**1. Create a repository** (or use an existing one)

**2. Enable GitHub Pages**
- Go to repository Settings
- Click "Pages" in the left sidebar
- Under "Source", select "main" branch
- Click "Save"

**3. Add your files**
- Create `your-addin.html` in the repository root
- Create `your-addin.js` in the repository root
- Commit and push

**4. Wait 2-3 minutes** for GitHub Pages to deploy

**5. Your Add-In is live at:**
```
https://yourusername.github.io/your-repo/your-addin.html
```

**6. Configure in MyGeotab**
```json
{
  "name": "My Add-In",
  "supportEmail": "you@example.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://yourusername.github.io/your-repo/your-addin.html",
    "path": "ActivityLink/",
    "menuName": {
      "en": "My Add-In"
    }
  }]
}
```

### Making Updates

1. Edit your files in the repository
2. Commit and push
3. Wait 2-3 minutes for GitHub Pages to deploy
4. Refresh MyGeotab - your changes appear automatically!

**Tip:** Add a version query parameter if you need to bypass caching:
```
https://yourusername.github.io/your-repo/your-addin.js?v=2
```

---

## Example Add-In Ideas

### Fleet Status Dashboard
Shows real-time stats: active vehicles, total trips today, fuel usage, speeding events

### Quick Vehicle Finder
Search bar that filters vehicles by name and provides quick navigation to details

### Safety Report Generator
Displays exception events grouped by driver with one-click CSV export

### Custom Map View
Leaflet.js map showing vehicle locations color-coded by status or group

---

## Debugging Tips

### Open Browser Console
- **Chrome/Edge**: `F12` or `Ctrl+Shift+J`
- **Firefox**: `F12` or `Ctrl+Shift+K`
- **Safari**: Enable Developer menu in Preferences, then `Cmd+Option+C`

### Common Issues

**Add-In doesn't appear in menu**
- Check you saved the configuration
- Refresh your browser (hard refresh: `Ctrl+Shift+R`)
- Check for JSON syntax errors

**"Issue Loading This Page" error**
- Verify the URL is accessible and uses HTTPS
- Check browser console for errors
- Ensure files are deployed on GitHub Pages (wait 2-3 minutes)

**initialize() never called**
- **Most common:** You used `}();` instead of `};` at the end
- Check browser console - is your JavaScript loading?
- Verify you're using `geotab.addin["your-name"]` pattern
- Make sure the name matches your configuration

**API calls fail**
- Check you're calling `callback()` in initialize
- Verify you have permission to access that data type in MyGeotab
- Check the error callback for details

### Testing Locally

You can't run Add-Ins locally (they need MyGeotab's API context), but you can:
1. Test your HTML/CSS independently
2. Mock the API object for JavaScript testing
3. Use GitHub Pages for fast iteration (2-3 minute deploy)

---

## Security Model

Understanding how Add-Ins work within MyGeotab's security model is important for building reliable integrations.

### Why HTTPS is Required

**All Add-In files must be served over HTTPS with valid certificates.**

This is a non-negotiable security requirement because:
- Add-Ins run in the same browser context as MyGeotab
- They have access to sensitive fleet data through the API
- Mixed content (HTTPS page loading HTTP resources) is blocked by browsers
- It protects against man-in-the-middle attacks

**GitHub Pages provides free HTTPS** - this is why we recommend it for hosting.

### What Add-Ins Can Access

**Add-Ins have full access to:**
- The MyGeotab API through the `api` object
- All data your MyGeotab user account can access
- Current session information (username, database, server)
- Page state and navigation context

**Add-Ins are limited to:**
- Data accessible to the currently logged-in user
- Same API permissions as the user's role
- Read-only access to most system settings

**Example:** If your user account can't view driver salary information, your Add-In can't access it either.

### How the Security Works

**Sandbox Model:**
1. Your Add-In HTML loads in an iframe within MyGeotab
2. MyGeotab injects the `api` object into your Add-In's context
3. All API calls go through MyGeotab's authentication layer
4. Your Add-In inherits the current user's permissions

**Why Embedded Add-Ins are Limited:**
- Embedded code runs in a more restricted context
- The `api` object may not be fully initialized
- MyGeotab strips certain code patterns for security
- **Recommendation:** Use external hosting for anything beyond static HTML

### Cross-Origin Considerations

**Your Add-In's domain is different from MyGeotab's domain:**
- This is intentional - it isolates your code
- The `api` object handles cross-origin communication for you
- You don't need to worry about CORS when using the API
- External APIs you call from your Add-In may have their own CORS policies

**Example:**
```javascript
// ✅ This works - API handles cross-origin
api.call("Get", {typeName: "Device"}, function(devices) {
    console.log(devices);
});

// ✅ This also works if the external API allows it
fetch("https://api.weather.com/data")
    .then(response => response.json())
    .then(data => console.log(data));

// ❌ This might fail due to CORS from the external API
fetch("https://restricted-api.com/data")  // May be blocked
```

### Best Practices for Security

**1. Never store credentials in your Add-In code**
- Use MyGeotab's session - it's already authenticated
- If you need external API keys, use server-side proxies

**2. Validate all user input**
- Even though Add-Ins run in your fleet's MyGeotab
- Always sanitize data before displaying it

**3. Use HTTPS for all external resources**
- CDN libraries (jQuery, Leaflet, etc.) must use HTTPS
- Any images or assets must be HTTPS

**4. Don't expose sensitive data in URLs**
- GitHub Pages URLs are public
- Anyone can view your HTML/JS source code
- Never hardcode API keys or passwords

**5. Test with different user roles**
- Your Add-In might work for admin users but fail for limited users
- Handle API errors gracefully when permissions are denied

### What This Means for Development

**Your Add-In code is public:**
- GitHub Pages serves your files publicly
- Anyone can view the source code
- Don't include secrets or proprietary logic you want to hide

**For truly private logic:**
- Host your own HTTPS server with authentication
- Or use a cloud function that requires API keys
- The Add-In UI can call your secure backend

**User permissions matter:**
- An Add-In showing vehicle locations works for users with vehicle access
- It fails for users restricted to only seeing reports
- Always handle permission errors gracefully

---

## Learn from Official Examples

The Geotab SDK includes several working Add-In examples you can study and modify.

### Heat Map Example

The **Heat Map Add-In** is an excellent reference - it's a complete, production-quality example:

**View it here:** [Geotab Heat Map Add-In](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-heatmap)

**What it demonstrates:**
- External hosting with all files in a `dist/` folder
- Complex API usage (fetching LogRecords, ExceptionEvents)
- Integration with Leaflet.js mapping library
- Proper lifecycle method implementation
- User interface with controls and filters
- MultiCall API usage for performance

**Try it yourself:**
1. Go to the repository above
2. Use the CDN-hosted version:
```json
{
  "name": "Heat Map",
  "version": "1.0.0",
  "items": [{
    "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-heatmap/dist/heatmap.html",
    "path": "ActivityLink/",
    "menuName": {"en": "Heat Map"}
  }]
}
```
3. Install it in MyGeotab and see how it works
4. Study the source code to understand the patterns

### More Official Examples

**Browse all examples:** [Geotab SDK Add-In Samples](https://github.com/Geotab/sdk-addin-samples)

The repository includes:
- **Import Groups** - Shows how to add custom buttons
- **Proximity** - Demonstrates zone/geofence calculations
- **Engine Data Profile** - Charts engine diagnostic data
- **And more...**

**How to use these examples:**
1. Browse the repository to find one similar to what you want to build
2. Study the code to understand the patterns
3. Copy the example and modify it for your needs
4. Host on your own GitHub Pages
5. Test and iterate

---

## Resources

### Working Examples in This Repository
- `simple-test.html` / `simple-test.js` - Minimal working Add-In (tested)
- `minimal-test.html` / `minimal-test.js` - Even simpler example (tested)

### Official Examples to Learn From
- **[Heat Map Add-In](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-heatmap)** - Complete mapping example (recommended starting point)
- **[All SDK Samples](https://github.com/Geotab/sdk-addin-samples)** - Browse official examples

### Official Documentation
- [Geotab Add-In Developer Guide](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)
- [Geotab API Reference](https://geotab.github.io/sdk/software/api/reference/)
- [Geotab SDK](https://github.com/Geotab/sdk) - Complete SDK and samples

### Tools
- [GitHub Pages](https://pages.github.com/) - Free HTTPS hosting
- [Geotab Add-In Generator](https://github.com/Geotab/generator-addin) - Scaffold new projects

---

**Ready to build your first Add-In?**

Start with the Simple Test example above, or copy and modify the official Heat Map example to suit your needs!
