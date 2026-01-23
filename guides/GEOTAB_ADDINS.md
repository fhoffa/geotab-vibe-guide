# Building Your First Geotab Add-In

**Transform MyGeotab with custom pages and buttons—no backend server required (mostly).**

This guide shows you how to extend MyGeotab with custom functionality using Add-Ins. Whether you want a custom fleet dashboard, quick-action buttons, or specialized reporting tools, Add-Ins let you build directly into the MyGeotab interface.

---

## Table of Contents
- [What Are Geotab Add-Ins?](#what-are-geotab-add-ins)
- [Resources You'll Need](#resources-youll-need)
- [Level 1: Your First Add-In (5 Minutes)](#level-1-your-first-add-in-5-minutes)
- [Level 2: Embedded Source Code Add-In](#level-2-embedded-source-code-add-in)
- [Level 3: GitHub-Hosted Add-In (The Pro Setup)](#level-3-github-hosted-add-in-the-pro-setup)
- [Understanding the Add-In Lifecycle](#understanding-the-add-in-lifecycle)
- [Next Level: Building Real Add-Ins](#next-level-building-real-add-ins)
- [Debugging Tips](#debugging-tips)

---

## What Are Geotab Add-Ins?

Geotab Add-Ins let you customize and extend MyGeotab with your own pages and buttons. Think of them as plugins that live directly inside your fleet management system.

### Two Types of Add-Ins

**1. Page Add-Ins**
Custom web pages that appear in your MyGeotab navigation menu. These are full applications that can:
- Display custom dashboards combining MyGeotab data with your own APIs
- Create specialized tools for your specific workflow
- Build business-specific reports and visualizations

**Example use case**: A manager compares fleet metrics with local weather data every morning. Instead of switching between tools, they open a custom Add-In page that combines both datasets in one view.

**2. Button Add-Ins**
Custom buttons that appear in MyGeotab pages to:
- Navigate quickly between different areas
- Automate routine tasks (like report generation)
- Pre-fill forms with context from the current page

**Example use case**: A one-click button that generates a weekly safety report for the currently selected driver and emails it to their manager.

---

## Resources You'll Need

### Official Documentation
- **[Geotab Add-In Developer Guide](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)** - Complete reference documentation
- **[Add-In Generator](https://github.com/Geotab/generator-addin)** - Official utility to scaffold Add-In projects

### Requirements
- **HTTPS Hosting**: All Add-In files must be publicly accessible via HTTPS
- **TLS 1.2+**: Your hosting server must support modern encryption
- **MyGeotab Account**: You'll need admin access to install Add-Ins

**Don't worry about hosting yet!** We'll start with embedded Add-Ins (no hosting needed) and then show you how to use GitHub Pages for free HTTPS hosting.

---

## Level 1: Your First Add-In (5 Minutes)

Let's prove Add-Ins work by creating a simple one that displays a custom page.

### Step 1: Copy This Configuration

```json
{
    "name": "My First Fleet Add-In",
    "supportEmail": "your.email@example.com",
    "version": "1.0",
    "items": [{
        "url": "https://geotab.github.io/sdk/src/software/introduction/developing-addins.html",
        "path": "ActivityLink",
        "menuName": {
            "en": "My Test Page"
        }
    }],
    "files": {}
}
```

### Step 2: Install It

1. Log into your MyGeotab account
2. Navigate to: **Administration → System → System Settings → Add-Ins**
3. Click **"New Add-In"**
4. Switch to the **"Configuration"** tab
5. Paste the JSON above
6. Click **"Save"**
7. **Refresh your browser page**

### Step 3: See It Work

Look at the left-hand navigation menu. You should see a new entry called **"My Test Page"** right after the Activity section. Click it!

**What just happened?**
- You told MyGeotab to add a navigation entry
- The entry links to an external webpage
- MyGeotab embedded that page into its interface

**Next**: Let's build a real Add-In with your own content.

---

## Level 2: Embedded Source Code Add-In

Now let's create an Add-In that displays YOUR content—no external hosting required. Everything lives in the JSON configuration.

### Why Embedded Add-Ins?

**Pros:**
- No need to host files on a server
- All code lives in one JSON file
- Easy to share and version control

**Cons:**
- Gets messy with complex HTML/CSS/JavaScript
- Harder to debug (no separate files to edit)
- Not ideal for large applications

**Best for**: Simple tools, proof-of-concepts, single-page utilities

### Vibe Code It!

Instead of writing HTML/CSS/JavaScript by hand, let's use Claude to build it. Copy this prompt:

```text
Create a Geotab Add-In configuration (JSON format) that displays a custom page.

Requirements:
1. Use embedded source code (no external hosting)
2. Display a welcome message: "Hello from your fleet!"
3. Access the MyGeotab API to fetch and display:
   - Total number of vehicles in the fleet
   - The current user's name
4. Style it with clean, modern CSS
5. Include the complete JSON configuration ready to paste into MyGeotab

The Add-In should be named "Fleet Overview" and appear in the menu after "ActivityLink".
```

### What You'll Get

Claude will generate a JSON file that looks like this structure:

```json
{
    "name": "Fleet Overview",
    "supportEmail": "your.email@example.com",
    "version": "1.0",
    "items": [{
        "path": "ActivityLink",
        "menuName": {
            "en": "Fleet Overview"
        },
        "page": "customPage"
    }],
    "files": {
        "customPage.html": "<html><head>...</head><body>...</body></html>",
        "css": {
            "styles.css": "body { font-family: Arial; } ..."
        },
        "js": {
            "app.js": "// JavaScript to access MyGeotab API..."
        }
    }
}
```

### Install It

1. Copy the complete JSON from Claude
2. Go to: **Administration → System → System Settings → Add-Ins**
3. Click **"New Add-In"** → **"Configuration"** tab
4. Paste the JSON
5. Save and refresh

**You now have a custom page that reads live data from your fleet!**

---

## Level 3: GitHub-Hosted Add-In (The Pro Setup)

Embedded Add-Ins work great for simple pages, but what if you want to:
- Edit code easily in separate files
- Use modern development tools
- Iterate quickly without copy-pasting JSON

**Solution**: Host your Add-In on GitHub Pages (free HTTPS hosting!).

### Why GitHub Pages?

- **Free**: No hosting costs
- **HTTPS**: Meets Geotab's security requirements
- **Easy updates**: Change code → commit → see updates
- **Version control**: Track every change you make

### Step-by-Step Setup

#### 1. Create a New Repository

Tell Claude:
```text
Create a new GitHub repository called "my-fleet-addin" with:
1. An index.html file that:
   - Displays "Fleet Dashboard" as the title
   - Uses the MyGeotab API to fetch all vehicles
   - Shows vehicle names in a simple list
2. A styles.css file with clean, modern styling
3. A README.md explaining what this Add-In does
```

#### 2. Enable GitHub Pages

After Claude creates the repo:
1. Go to your repository on GitHub.com
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under "Source", select **main** branch
4. Click **Save**
5. GitHub will show you a URL like: `https://yourusername.github.io/my-fleet-addin/`

**Wait 1-2 minutes** for the site to deploy.

#### 3. Create Your Add-In Configuration

Now create a simple JSON config that points to your GitHub Pages URL:

```json
{
    "name": "GitHub Fleet Dashboard",
    "supportEmail": "your.email@example.com",
    "version": "1.0",
    "items": [{
        "url": "https://yourusername.github.io/my-fleet-addin/",
        "path": "ActivityLink",
        "menuName": {
            "en": "Fleet Dashboard"
        }
    }],
    "files": {}
}
```

#### 4. Install in MyGeotab

1. **Administration → System → System Settings → Add-Ins**
2. **New Add-In** → **Configuration** tab
3. Paste the JSON
4. **Save** and refresh

**You're live!** Your GitHub-hosted page is now embedded in MyGeotab.

#### 5. Iterate and Update

Want to add a feature? Tell Claude:
```text
Update my-fleet-addin to add a map showing vehicle locations.
Use Leaflet.js for the map and plot each vehicle as a marker.
```

Claude will:
1. Update your HTML file
2. Commit the changes to GitHub
3. GitHub Pages auto-deploys the update (takes 1-2 minutes)
4. Refresh MyGeotab to see the changes

**No JSON changes needed** — your Add-In automatically loads the latest version from GitHub!

---

## Understanding the Add-In Lifecycle

When building Add-Ins that interact with MyGeotab data, your JavaScript needs to implement three special functions. Think of them as hooks into MyGeotab's page loading system.

### The Three Lifecycle Methods

```javascript
// 1. initialize - Called ONCE when your Add-In page first loads
function initialize(api, state, callback) {
    // Set up your Add-In
    // 'api' is your authenticated connection to MyGeotab
    // 'state' contains the current page state
    // 'callback' must be called when initialization is complete

    console.log("Add-In is initializing...");

    // Example: Store API reference for later use
    window.geotabApi = api;

    // Signal that initialization is complete
    callback();
}

// 2. focus - Called when your page becomes visible
function focus(api, state) {
    // User just navigated to your Add-In
    // Perfect time to refresh data or show welcome messages

    console.log("Add-In is now active!");

    // Example: Fetch fresh vehicle data
    api.call("Get", {
        typeName: "Device"
    }, function(vehicles) {
        displayVehicles(vehicles);
    });
}

// 3. blur - Called when user navigates away from your page
function blur(api, state) {
    // User is leaving your Add-In
    // Use this to save state or clean up

    console.log("User is leaving Add-In");

    // Example: Save any unsaved work
    // saveUserPreferences();
}
```

### How to Use These in Your Add-In

Tell Claude:
```text
Update my Add-In HTML file to implement the MyGeotab lifecycle methods:
1. initialize: Fetch all vehicles and store them in a global variable
2. focus: Refresh the vehicle list and display a "Welcome back!" message
3. blur: Save the current view state to localStorage

Make sure to call the callback in initialize!
```

**Why this matters**: MyGeotab calls these functions automatically. If you don't implement them correctly (especially `initialize`), your Add-In might not work.

---

## Next Level: Building Real Add-Ins

Now that you understand the basics, here are some practical Add-In ideas to build:

### 1. Quick Vehicle Finder
**Difficulty**: Beginner
**Prompt for Claude**:
```text
Create a Geotab Add-In that adds a search bar to quickly find vehicles by name.
When I type a vehicle name, show matching vehicles with a "Jump to Vehicle" button
that navigates to that vehicle's details page in MyGeotab.
```

### 2. Custom Safety Dashboard
**Difficulty**: Intermediate
**Prompt for Claude**:
```text
Build a Geotab Add-In that displays:
1. A chart of speeding events by driver over the last 7 days
2. A list of drivers ranked by safety score
3. A "Generate Report" button that exports data to CSV

Use Chart.js for visualizations and the MyGeotab API to fetch ExceptionEvent data.
```

### 3. Zone Creator Tool
**Difficulty**: Intermediate
**Prompt for Claude**:
```text
Create a Geotab Add-In with a map where I can:
1. Click to draw a circular geofence
2. Name the zone
3. Save it to MyGeotab using the API
4. See all my existing zones as colored overlays

Use Leaflet.js for the map and MyGeotab's Zone API.
```

### 4. Fuel Efficiency Analyzer
**Difficulty**: Advanced
**Prompt for Claude**:
```text
Build a Geotab Add-In that:
1. Fetches fuel usage data for the fleet
2. Calculates MPG for each vehicle
3. Identifies the top 5 most efficient and least efficient vehicles
4. Shows a comparison chart
5. Suggests optimization tips based on the data
```

---

## Debugging Tips

Add-Ins run in your browser, so use browser developer tools to debug.

### Open Browser Console

- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
- **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
- **Safari**: Enable Developer menu in Preferences → Advanced, then press `Cmd+Option+C`

### Common Issues & Fixes

**1. Add-In doesn't appear in menu**
- Did you save the configuration?
- Did you refresh the browser page?
- Check the browser console for JavaScript errors

**2. "api is not defined" error**
- You're trying to use the MyGeotab API before `initialize` was called
- Make sure your code is inside `initialize`, `focus`, or `blur` functions

**3. CORS errors (GitHub Pages)**
- MyGeotab might block requests to external APIs from your Add-In
- Solution: Make API calls to MyGeotab only, or use a proxy

**4. Page shows but data doesn't load**
- Open browser console and check for errors
- Add `console.log()` statements to see what's happening:
```javascript
api.call("Get", { typeName: "Device" }, function(result) {
    console.log("Vehicles:", result);  // See what you got back
});
```

### Ask Claude to Debug

If you're stuck, tell Claude:
```text
My Geotab Add-In is showing this error in the console:
[paste error message]

Here's my current code:
[paste your HTML/JS]

Can you explain what's wrong and fix it?
```

---

## Navigation Menu Placement

You can control where your Add-In appears in the left navigation menu.

### Built-in Navigation Points

Place your Add-In after any of these:
- `GettingStartedLink`
- `ActivityLink`
- `EngineMaintenanceLink`
- `ZoneAndMessagesLink`
- `RuleAndGroupsLink`
- `AdministrationLink`

### Examples

**Top-level menu item** (appears in main navigation):
```json
"path": "ActivityLink"
```

**Submenu item** (appears inside Activity dropdown):
```json
"path": "ActivityLink/"
```
Note the trailing slash!

**With custom icon**:
```json
{
    "path": "ActivityLink",
    "svgIcon": "https://www.geotab.com/geoimages/home/icon-solutions.svg",
    "menuName": {
        "en": "Custom Dashboard",
        "fr": "Tableau de Bord"
    }
}
```

---

## Advanced: Using Third-Party Libraries

Your Add-In can use any JavaScript library available via CDN.

### Example: Adding Leaflet Maps

Tell Claude:
```text
Update my Geotab Add-In to include a Leaflet.js map.
Add the Leaflet CSS and JS from CDN, then create a map centered on
the first vehicle's location.
```

Claude will add these to your HTML:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### Example: Adding Chart.js

```text
Add Chart.js to my Add-In and create a bar chart showing
vehicle count by vehicle type.
```

### CSS Naming Conflicts

MyGeotab has its own CSS that might interfere with your styles. **Best practice**: Prefix all your CSS classes.

**Bad** (might conflict):
```css
.menu { background: blue; }
.button { color: red; }
```

**Good** (won't conflict):
```css
#myaddin-menu { background: blue; }
#myaddin-button { color: red; }
```

Tell Claude:
```text
Make sure all CSS classes in my Add-In are prefixed with "myaddin-"
to avoid conflicts with MyGeotab's styles.
```

---

## Example: Complete GitHub-Hosted Add-In

Here's a full example prompt to give Claude:

```text
Create a complete Geotab Add-In project for GitHub Pages:

Project: "Fleet Health Monitor"

Features:
1. Displays all vehicles with their last known status
2. Shows engine health indicators (red/yellow/green)
3. Lists any active fault codes
4. Auto-refreshes every 60 seconds
5. Clicking a vehicle navigates to its details page in MyGeotab

Technical requirements:
1. Use the MyGeotab API lifecycle (initialize, focus, blur)
2. Fetch Device data and StatusData
3. Style with modern CSS (card layout, clean colors)
4. Make it mobile-responsive
5. Include error handling for API failures

File structure:
- index.html
- styles.css
- app.js
- README.md

Set up the GitHub repo and enable GitHub Pages.
Create the Add-In JSON configuration I can paste into MyGeotab.
```

Claude will create everything and give you:
- Complete source code
- GitHub repository setup
- JSON configuration for MyGeotab
- Instructions to deploy and test

---

## Security Best Practices

### 1. Never Hardcode Credentials

**Bad**:
```javascript
const apiKey = "sk_live_abc123secret";  // DON'T DO THIS
```

**Good**: Use the authenticated `api` object passed to your Add-In. MyGeotab handles authentication.

### 2. Validate User Input

If your Add-In accepts user input (search boxes, form fields), validate it:
```javascript
function searchVehicle(userInput) {
    // Sanitize input
    const cleanInput = userInput.trim().substring(0, 100);

    // Use it safely
    api.call("Get", {
        typeName: "Device",
        search: { name: cleanInput }
    }, callback);
}
```

### 3. Use HTTPS Only

All external resources must use HTTPS:
- ✅ `https://cdn.example.com/library.js`
- ❌ `http://cdn.example.com/library.js`

### 4. Be Careful with External APIs

If your Add-In calls your own API:
- Validate all responses
- Handle errors gracefully
- Use CORS properly
- Don't expose sensitive endpoints

---

## What's Next?

You now know how to build Geotab Add-Ins! Here's how to level up:

1. **Try the examples** in this guide with Claude
2. **Explore the [official Add-In generator](https://github.com/Geotab/generator-addin)** for advanced scaffolding
3. **Build something unique** for your fleet's specific needs
4. **Share your Add-In** with teammates or the Geotab community

### More Resources

- [Geotab SDK Documentation](https://geotab.github.io/sdk/)
- [MyGeotab API Reference](https://geotab.github.io/sdk/software/api/reference/)
- [Geotab Developer Community](https://community.geotab.com/)

---

**Remember**: You don't need to understand every line of code. Use vibe coding—tell Claude what you want, and iterate until it works. Focus on solving problems for your fleet, not on memorizing syntax.

**Ready to build?** Pick an idea from the [HACKATHON_IDEAS.md](HACKATHON_IDEAS.md) guide and tell Claude to create it as a Geotab Add-In!
