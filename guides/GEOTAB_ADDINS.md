# Building Geotab Add-Ins (Vibe Guide)

**Tell AI what you want. Get a custom page in MyGeotab.**

This guide shows you how to use AI to build Add-Ins that extend MyGeotab with custom pages.

---

## Try It Right Now

Copy-paste this into MyGeotab to see a working Add-In:

**1. Go to:** Administration → System → System Settings → Add-Ins
**2. Click:** "New Add-In" → "Configuration" tab
**3. Paste this:**

```json
{
  "name": "Simple Fleet Test",
  "supportEmail": "test@example.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://fhoffa.github.io/geotab-vibe-guide/examples/addins/simple-test.html",
    "path": "ActivityLink/",
    "menuName": {
      "en": "Fleet Stats"
    }
  }]
}
```

**4. Save and refresh MyGeotab**
**5. Look for "Fleet Stats" in the left menu**

You'll see your username, database, and vehicle count. This proves Add-Ins work!

---

## What Are Add-Ins?

Add-Ins extend MyGeotab with custom functionality. There are two types:

**Page Add-Ins** (covered in this guide)
- Custom pages that appear in MyGeotab's menu
- Show dashboards combining MyGeotab data with external APIs
- Display specialized reports for your workflow
- Create custom tools specific to your business

**Button Add-Ins** (not covered here)
- Custom buttons that appear on existing MyGeotab pages
- Quick actions like "Generate Report" or "Export Data"
- Context-aware based on what page you're viewing

**This guide focuses on Page Add-Ins** - they're a good starting point for extending MyGeotab.

**Example:** A safety dashboard showing today's speeding events, ranked drivers, and export to CSV.

---

## Two Ways to Deploy

**External Hosted**
- Files hosted on any HTTPS server (GitHub Pages, your own server, CDN, etc.)
- Can be static files or dynamically generated content
- Best for development - easy to update and debug
- Example above uses GitHub Pages for simplicity
- See the full guide below for how to build this way

**Embedded (No Hosting Required)**
- Everything embedded directly in the JSON configuration
- No external hosting needed at all
- Just copy-paste JSON into MyGeotab and it works
- Perfect for quick tests, prototypes, and sharing
- Full MyGeotab API access (same as external)

### Quick Example: Embedded Add-In

Copy-paste this into MyGeotab (no hosting required):

```json
{
  "name": "Embedded Fleet Stats",
  "supportEmail": "test@example.com",
  "version": "1.0",
  "items": [{
    "url": "fleet.html",
    "path": "ActivityLink",
    "menuName": {
      "en": "Fleet Stats"
    }
  }],
  "files": {
    "fleet.html": "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Fleet</title><style>body{font-family:Arial;padding:20px;background:#f5f5f5;}h1{color:#333;}.info{margin:15px 0;padding:10px;background:#e8f4f8;border-radius:4px;}</style></head><body><h1>Fleet Statistics</h1><div id='status'>Initializing...</div><div id='info'></div><script>geotab.addin['embedded-fleet']=function(){return{initialize:function(api,state,callback){var statusEl=document.getElementById('status');var infoEl=document.getElementById('info');statusEl.textContent='Connected!';api.getSession(function(session){var html='<div class=\"info\"><strong>User:</strong> '+session.userName+'<br><strong>Database:</strong> '+session.database+'</div>';infoEl.innerHTML=html;api.call('Get',{typeName:'Device'},function(devices){html+='<div class=\"info\"><strong>Vehicles:</strong> '+devices.length+'</div>';infoEl.innerHTML=html;});});callback();},focus:function(api,state){},blur:function(api,state){}};};console.log('Embedded add-in loaded');</script></body></html>"
  }
}
```

This works immediately - no GitHub Pages, no waiting. It uses the MyGeotab API just like external add-ins.

**When to use each:**
- **Embedded**: Quick tests, prototypes, sharing examples, no hosting access
- **External**: Active development, frequent updates, team projects, larger add-ins

---

## How to Build One (The Vibe Way)

### Step 1: Use the Skill

When working with Claude or other AI assistants, tell them:

```
Use the geotab-addins skill to help me build a Geotab Add-In
```

The [skill file](/skills/geotab-addins.md) teaches AIs the correct patterns and common mistakes.

### Step 2: Describe What You Want

Be specific about what your Add-In should do:

```
Create a Geotab Add-In that shows:
1. A count of vehicles currently active (moving in the last hour)
2. A list of the 5 most recent trips with vehicle name and distance
3. Total fleet mileage for today
4. A "Refresh" button to reload the data

Use external hosting and give me the files and configuration JSON to paste into MyGeotab.
```

### Step 3: Let AI Build It

The AI will:
- Create the HTML and JavaScript files
- Use the correct pattern (no immediate invocation!)
- Prepare files for hosting (or create embedded version)
- Give you the JSON configuration to install

### Step 4: Test and Iterate

Try it in MyGeotab. If something doesn't work or you want changes:

```
The vehicle count isn't showing. Can you add error handling?
```

```
Add a date picker so I can see trips from different days
```

```
Make it look nicer with a modern card-based layout
```

---

## Example Prompts to Try

### Simple Dashboard (External Hosted)
```
Build a Geotab Add-In that displays my fleet overview:
- Total vehicles
- Active vehicles today
- Total trips this week
- Use cards with icons and nice styling
Use external hosting (like GitHub Pages).
```

### Embedded Dashboard (No Hosting)
```
Build an embedded Geotab Add-In that shows:
- Total vehicles
- Total drivers
- Current user and database name
Create it as an embedded add-in with everything in the JSON configuration.
No external hosting needed.
```

### Vehicle Finder
```
Create a Geotab Add-In with a search box.
When I type a vehicle name, show matching vehicles.
Add a button next to each that navigates to that vehicle's detail page in MyGeotab.
```

### Safety Report
```
Build a Geotab Add-In showing speeding events from the last 7 days.
Group them by driver and show:
- Driver name
- Number of speeding events
- Date of most recent event
Add an "Export CSV" button
```

### Custom Map
```
Create a Geotab Add-In with a Leaflet map showing:
- Current location of all vehicles
- Color-coded by group (red for Group A, blue for Group B, etc.)
- Click a vehicle to see its name and last update time
```

---

## How Add-Ins Get Access to Your Data

Understanding how the connection works helps when prompting the AI.

**The Magic: MyGeotab Injects the API**

When your Add-In HTML loads:
1. MyGeotab loads it in an iframe within the MyGeotab interface
2. MyGeotab **injects** an `api` object into your code's scope
3. This `api` object is already authenticated as the current user
4. Your code calls methods on this object to fetch data

**You don't need to:**
- Log in (you're already authenticated)
- Set up API credentials (it's already done)
- Worry about CORS (the `api` object handles it)

**The Lifecycle:**

Your Add-In registers itself with `geotab.addin["name"]` and returns an object with three methods:

```javascript
geotab.addin["my-addin"] = function() {
    return {
        // Called once when Add-In first loads
        initialize: function(api, state, callback) {
            // 'api' is injected here - use it to fetch data
            api.call("Get", {typeName: "Device"}, function(devices) {
                console.log("Vehicles:", devices);
            });
            callback(); // Must call this when done
        },

        // Called when user navigates to your Add-In
        focus: function(api, state) {
            // Refresh data when page becomes visible
        },

        // Called when user navigates away
        blur: function(api, state) {
            // Save state or clean up
        }
    };
};
```

**Key Point:** MyGeotab calls `initialize()` and passes in the authenticated `api` object. That's how your Add-In gets access to fleet data.

When prompting the AI, mention what data you need and it will use the API object correctly.

---

## Try the Official Heat Map

Want to see a production-quality example? Try Geotab's Heat Map:

**Configuration:**
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

Install it, see how it works, then tell your AI:

```
I like the Heat Map Add-In. Build me something similar but instead of a heat map,
show vehicle locations as pins on a map with different colors for each group.
```

**[View Heat Map source code](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-heatmap)** - great for learning!

---

## Security & Permissions

**HTTPS Required:** Add-Ins must be hosted on HTTPS (GitHub Pages provides this free)

**User Permissions:** Add-Ins inherit the logged-in user's permissions
- If the user can't see driver salaries, the Add-In can't either
- Test with different user roles

**Code is Public:** GitHub Pages is public - anyone can view your source
- Don't hardcode API keys or secrets
- Use server-side APIs for sensitive operations

**Cross-Origin:** The MyGeotab API handles CORS for you
- Calls to MyGeotab API work automatically
- External APIs you call may have their own CORS policies

---

## Debugging

**Add-In doesn't appear in menu?**
- Check you saved the configuration
- Hard refresh: `Ctrl+Shift+R`

**"Issue Loading This Page"?**
- Verify the URL is accessible in a regular browser tab
- Check GitHub Pages is enabled (Settings → Pages)
- Wait 2-3 minutes after pushing changes

**Data not loading?**
- Open browser console (F12) to see errors
- Check that `callback()` is called in initialize
- Verify the user has permission to access that data type

**Still stuck?**
- Copy-paste the error message to your AI
- Ask: "This Add-In isn't working, here's the error: [paste error]"

---

## Resources

**Working Examples:**
- `examples/addins/simple-test.*` - Complete working example (tested ✅)
- `examples/addins/minimal-test.*` - Even simpler example (tested ✅)
- [Heat Map Add-In](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-heatmap) (official example)
- [All SDK Samples](https://github.com/Geotab/sdk-addin-samples) (browse more examples)

**Documentation:**
- [Geotab Add-In Developer Guide](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)
- [Geotab API Reference](https://geotab.github.io/sdk/software/api/reference/)

**Tools:**
- [GitHub Pages](https://pages.github.com/) - Free HTTPS hosting
- [Geotab Add-Ins Skill](/skills/geotab-addins.md) - AI skill file (use this when prompting)

---

## Quick Start Template

Tell your AI:

```
Use the geotab-addins skill.

Create a Geotab Add-In that [describe your feature].

Requirements:
- Host on GitHub Pages
- Use the MyGeotab API to fetch [specify data types like Device, Trip, ExceptionEvent]
- Display it with [describe UI]
- Give me the JSON configuration to install it
```

Then copy-paste the configuration into MyGeotab and you're done!

The AI will create files that use the injected `api` object to fetch your data.

---

**That's it. Describe what you want, let AI build it, paste the config, and you have a custom MyGeotab page.**
