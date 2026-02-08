# Building Geotab Add-Ins (Vibe Guide)

**Tell AI what you want. Get a custom page in MyGeotab.**

This guide shows you how to use AI to build Add-Ins that extend MyGeotab with custom pages.

---

## Try It Right Now

Copy-paste this into MyGeotab to see a working Add-In:

**1. Go to:** Administration → System → System Settings → Add-Ins
**2. Enable:** "Allow unverified Add-Ins" → Yes (required for custom Add-Ins)
**3. Click:** "New Add-In" → "Configuration" tab
**4. Paste this:**

```json
{
  "name": "Simple Fleet Test",
  "supportEmail": "https://github.com/fhoffa/geotab-vibe-guide",
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

**5. Save and refresh MyGeotab**
**6. Look for "Fleet Stats" in the left menu**

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
  "supportEmail": "https://github.com/fhoffa/geotab-vibe-guide",
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

### What About Server-Side Logic?

Add-Ins are HTML/JS that run in the browser, but that doesn't mean you're limited to client-side code. An externally hosted Add-In can call **your own backend API** for anything the browser can't (or shouldn't) do:

- **Heavy processing** — crunch large datasets on your server instead of in the browser
- **Database access** — store historical data, user preferences, or audit logs in your own database
- **External integrations** — call third-party APIs that require server-side secrets
- **PDF/Excel generation** — generate complex reports server-side if client-side libraries aren't enough
- **Scheduled tasks** — trigger background jobs from the Add-In UI

Your Add-In's JavaScript calls your server with `fetch()` or `XMLHttpRequest`, and your server does the work. The MyGeotab `api` object handles Geotab data; your backend handles everything else.

```
Create a Geotab Add-In that shows a vehicle maintenance dashboard.
The Add-In should call my backend API at https://myserver.com/api
to store maintenance records in my database. Use the Geotab API
for vehicle data and my backend for maintenance history.
```

---

## How to Build One (The Vibe Way)

### Step 1: Use the Skill

When working with Claude or other AI assistants, tell them:

```
Use the geotab-addins skill to help me build a Geotab Add-In
```

The [skill file](/skills/geotab/SKILL.md) teaches AIs the correct patterns and common mistakes.

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

## Battle-Tested Prompt (Works with Replit, Cursor, etc.)

This prompt has been tested and successfully generates working Geotab Add-Ins with AI coding tools:

```
Create a Geotab Add-In web application that displays fleet statistics.

CRITICAL REQUIREMENTS:
1. Must be a single HTML file with ALL CSS and JavaScript inline (no external files)
2. Must register with the Geotab API using this exact pattern:
   geotab.addin["fleet-stats"] = function() { return {...}; };
3. Must implement all three required lifecycle methods: initialize, focus, and blur
4. Must call callback() in the initialize method
5. Use ES5 JavaScript only (no arrow functions, const/let, or template literals)
6. **CRITICAL FOR DEPLOYMENT**: The hosting platform MUST support CORS (Cross-Origin Resource Sharing) and include the "Access-Control-Allow-Origin: *" header in responses. This is essential for MyGeotab to load the add-in.

FUNCTIONALITY:
- Display the total number of vehicles in the fleet using the MyGeotab API
- Display the total number of drivers
- Show the connected user's name and database name
- Auto-refresh data when the page gains focus

UI REQUIREMENTS:
- Modern, clean design with cards for each statistic
- Purple/blue gradient background
- White cards with shadow effects
- Large, bold numbers for statistics
- Loading states that show "..." while fetching data
- Error handling that displays "Error" if API calls fail

GEOTAB API INTEGRATION - IMPORTANT PATTERNS:
- **For Vehicles**: Use api.call("Get", {typeName: "Device"}) - DO NOT use resultsLimit
- **For Drivers**: Use api.call("Get", {typeName: "User", search: {isDriver: true}}) - NOT typeName: "Driver" (causes errors in demo databases)
- Use api.getSession() to get user information
- Store the api reference in a private variable
- Include error callbacks for all API calls
- DO NOT use resultsLimit parameter - it limits returned results, not just for counting

DEPLOYMENT NOTES:
- The file must be served over HTTPS
- The server must include CORS headers allowing cross-origin requests
- Recommended platforms: GitHub Pages, Replit, Netlify, Firebase Hosting

OUTPUT REQUIREMENTS:
After creating the add-in, provide the MyGeotab configuration JSON in this format:
{
  "name": "Fleet Statistics",
  "supportEmail": "https://github.com/fhoffa/geotab-vibe-guide",
  "version": "1.0.0",
  "items": [{
    "url": "YOUR_DEPLOYED_URL_HERE",
    "path": "ActivityLink",
    "menuName": {
      "en": "Fleet Stats"
    }
  }]
}
Replace YOUR_DEPLOYED_URL_HERE with the actual deployed URL.

Make sure the HTML includes proper DOCTYPE, meta charset, and the geotab.addin registration happens in an inline <script> tag at the end of the body.
```

**Why this prompt works:**
- Explicitly requires single-file output (simpler for AI to generate)
- Lists all critical patterns AI tools often get wrong
- Specifies ES5 JavaScript (avoids compatibility issues)
- Warns about common API pitfalls (Driver type, resultsLimit)
- Requests the config JSON at the end (complete deliverable)

Customize it by changing the FUNCTIONALITY section to describe your add-in.

---

## More Example Prompts

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

## Using CDN Libraries (Charts, Maps, CSS Frameworks)

Add-Ins can load JavaScript and CSS libraries from CDNs. This works for both external and embedded Add-Ins.

**Available libraries:**

| Library | Use Case | CDN URL |
|---------|----------|---------|
| **Chart.js** | Bar, line, pie, doughnut charts | `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js` |
| **Leaflet** | Interactive maps with markers | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` |
| **Day.js** | Date formatting and manipulation | `https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.11.10/dayjs.min.js` |
| **Bootstrap** | Professional CSS framework | Load dynamically (see below) |
| **jsPDF** | PDF export (client-side) | `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js` |
| **jspdf-autotable** | Formatted tables in PDFs | `https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js` |
| **SheetJS (xlsx)** | Excel .xlsx export (client-side) | `https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js` |

**Example prompts:**

```
Create an Add-In with a bar chart showing trips per vehicle for the last 7 days.
Use Chart.js from CDN.
```

```
Build an Add-In that shows all my vehicles on a Leaflet map.
When I click a marker, show the vehicle name and current speed.
Auto-zoom to fit all vehicles.
```

```
Create a dashboard using Bootstrap for styling.
Show vehicle counts in Bootstrap cards with the grid layout.
```

**Important for embedded Add-Ins:**
- `<style>` tags are stripped by MyGeotab
- Static `<link>` tags get URL-rewritten and break
- **Solution:** Load CSS dynamically via JavaScript

Tell your AI: "Use Bootstrap with dynamic CSS loading for an embedded Add-In"

The [geotab skill](/skills/geotab/SKILL.md) has the code patterns for dynamic loading.

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

## Making Things Clickable (Navigate to MyGeotab Pages)

Your Add-In can make vehicle names, driver names, or any entity clickable to navigate to other MyGeotab pages. When users click, they go to the vehicle's detail page, trip history, live map, etc.

**Where it works:** Vehicle pages, trip history, exceptions, live map, zones, and more.

**Tell your AI:**

```
Make the vehicle names clickable so clicking takes the user to that vehicle's detail page in MyGeotab.
```

```
Add "View Trips" and "View on Map" action links next to each vehicle in the table.
```

```
When showing exception events, make the vehicle name a link that opens the vehicle's page.
```

```
Create a fleet overview where I can click any vehicle to see its trip history.
```

The skill file (`geotab-addins`) has the technical patterns. Just describe what you want to be clickable and where it should navigate.

---

## Creative Integrations (Surprising Things Add-Ins Can Do)

Add-Ins aren't just for displaying data. They can integrate with email, calendars, maps, and more using browser-native features.

**Email with pre-filled content:**
```
Add a "Report Issue" button next to each vehicle that opens an email
with the vehicle name and serial number pre-filled.
```

**Google Calendar events:**
```
Add a "Schedule Maintenance" link that opens Google Calendar
with a new event pre-filled with the vehicle details.
```

**Google Maps:**
```
Show vehicle locations and add "Open in Google Maps" links
that open each vehicle's position in a new tab.
```

**Call or text drivers:**
```
Make driver phone numbers clickable to call them.
Add a "Text Driver" button with a pre-written message about their vehicle.
```

**WhatsApp integration:**
```
Add a WhatsApp button that opens a chat with the driver
and pre-fills a message about their vehicle status.
```

**Copy to clipboard:**
```
Add a "Copy Details" button that copies all vehicle info
so I can paste it into other apps.
```

**Export to CSV:**
```
Add an "Export CSV" button that downloads all the data
as a spreadsheet file.
```

**Print reports:**
```
Add a "Print" button that opens the print dialog for the current page.
```

**Text-to-speech:**
```
Add a "Read Aloud" button that speaks the fleet statistics
using text-to-speech. Useful for hands-free use.
```

**Mobile sharing:**
```
On mobile devices, add a "Share" button that uses the phone's
native share menu to send fleet info via any app.
```

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

## Hosting Requirements

**HTTPS + CORS Required:** Add-Ins must be hosted on HTTPS servers that support CORS (Cross-Origin Resource Sharing). Without proper CORS headers, MyGeotab cannot load your add-in.

**Recommended Hosting Platforms (all support CORS correctly):**
| Platform | Best For | Setup Time |
|----------|----------|------------|
| **Replit** | AI-assisted development, quick prototypes | Instant |
| **GitHub Pages** | Free hosting, version control | 2-3 minutes |
| **Netlify** | Static sites, drag-and-drop deploys | Instant |
| **Firebase Hosting** | Google ecosystem, good performance | 5 minutes |
| **Vercel** | Modern web apps, serverless | 2 minutes |

### GitHub Pages for Beginners

**Never used GitHub?** No problem. You don't need to learn Git commands.

**The easy way - ask your AI assistant:**

```
I built this Geotab Add-In [paste your HTML code].

Help me:
1. Create a new GitHub repository for it
2. Upload these files to GitHub
3. Enable GitHub Pages so it's hosted on the web
4. Give me the URL to use in MyGeotab
```

The AI will walk you through every step. When done, your URL will look like:
`https://yourusername.github.io/your-repo-name/your-addin.html`

**Alternative - manual steps:**
1. Go to [github.com](https://github.com) and create a free account
2. Click "New repository" (green button)
3. Name it something like `my-geotab-addin`
4. Check "Add a README file"
5. Click "Create repository"
6. Click "Add file" → "Upload files" → drag your HTML file
7. Go to Settings → Pages → Source: "Deploy from a branch" → Branch: "main" → Save
8. Wait 2-3 minutes, then your URL is: `https://yourusername.github.io/my-geotab-addin/yourfile.html`

**User Permissions:** Add-Ins inherit the logged-in user's permissions
- If the user can't see driver salaries, the Add-In can't either
- Test with different user roles

**Code is Public:** Most free hosting (GitHub Pages, etc.) is public
- Don't hardcode API keys or secrets in client-side code
- Use a server-side backend for operations that require secrets (API keys, database credentials)
- See [What About Server-Side Logic?](#what-about-server-side-logic) above
- **→ [Securing Your Add-In's Backend Endpoints](SECURE_ADDIN_BACKEND.md)** — how to protect your Cloud Functions/APIs so only your Add-In can call them

**Cross-Origin Notes:**
- Calls to MyGeotab API work automatically (handled by the injected `api` object)
- External APIs you call from your add-in may have their own CORS policies

---

## Debugging

**Add-In doesn't appear in menu?**
- Check you saved the configuration
- Hard refresh: `Ctrl+Shift+R`

**"Issue Loading This Page"?**
- Verify the URL is accessible in a regular browser tab
- Check GitHub Pages is enabled (Settings → Pages)
- Wait 2-3 minutes after pushing changes
- If deployment takes too long, check GitHub Actions at `https://github.com/YOUR-USERNAME/YOUR-REPO/actions` to see if GitHub is being slow

**HTML not updating after deploy?**
- MyGeotab caches externally-hosted HTML. Add a query parameter to force reload:
  - Change URL from `https://example.github.io/addin.html` to `https://example.github.io/addin.html?v=2`
  - Increment the parameter (`?v=3`, `?v=4`) each time you need a fresh version
- This is the `?a=1` trick - the parameter name doesn't matter, just needs to change

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
- [All 7 Official SDK Samples](./SDK_ADDIN_SAMPLES_GUIDE.md) (what each teaches, vibe prompts, batch install)

**Documentation:**
- [Geotab Add-In Developer Guide](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)
- [Geotab API Reference](https://geotab.github.io/sdk/software/api/reference/)

**Tools:**
- [GitHub Pages](https://pages.github.com/) - Free HTTPS hosting
- [Geotab Skill](/skills/geotab/SKILL.md) - AI skill file (use this when prompting)

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

## Styling Your Add-In

**Start with vanilla CSS.** Get your Add-In working first.

Once it works, you can optionally upgrade to **Zenith** (Geotab's official design system) to match MyGeotab's look exactly. But there's a trade-off: Zenith requires React, webpack, and a build step.

**→ [Transform Add-In Design with Zenith](TRANSFORM_ADDIN_ZENITH.md)** - when you're ready for the polished look

**Compare both approaches:** See [screenshots in the Zenith guide](TRANSFORM_ADDIN_ZENITH.md#working-example)

---

**That's it. Describe what you want, let AI build it, paste the config, and you have a custom MyGeotab page.**

---

## Learn from Real Examples

Want to see how a production-quality Add-In works under the hood? Check out the **[Annotated Examples](annotated-examples/)** — real Add-Ins broken down line by line with explanations of every pattern and design choice.

Start with: **[Cold Chain Historical View](annotated-examples/COLD_CHAIN_HISTORICAL_VIEW.md)** — temperature monitoring with Chart.js, PDF export, and Excel export.
