# Guide to Geotab's Official Add-In Samples

**7 production-quality examples you can install in 2 minutes and learn from.**

The [Geotab/sdk-addin-samples](https://github.com/Geotab/sdk-addin-samples) repository is the official collection of MyGeotab Add-In examples maintained by Geotab. Each sample is a working Add-In you can install right now and study to learn real patterns.

> **TODO:** We haven't yet confirmed that all 7 samples work correctly on the free demo database. If you run into issues with a specific sample, it may require data that the demo database doesn't have (e.g., IOX devices, start-stop vehicles). Please report what works and what doesn't!

---

## Install All 7 Samples at Once

The repo includes a single JSON config block that installs every sample under one "Add-In Samples" menu group. No coding, no hosting — just paste and go.

**Steps:**
1. Click your **user profile icon** (top-right corner) → **Administration → System → System Settings → Add-Ins**
2. Enable **"Allow unverified Add-Ins" → Yes**
3. Click **"New Add-In" → "Configuration" tab**
4. Copy the batch install JSON from the [sdk-addin-samples README](https://github.com/Geotab/sdk-addin-samples#how-to-run-the-examples)
5. Paste, save, and refresh MyGeotab
6. Look for **"Add-In Samples"** in the left menu — six page Add-Ins will appear, plus a button on the vehicle page

This is the fastest way to see what's possible. Click through each one, then come back here to understand what makes each interesting.

---

## What Each Sample Teaches

### Page Add-Ins (appear in the menu)

---

### 1. Heat Map — Map Visualization with Third-Party Libraries

Visualizes vehicle location history by displaying areas of "heat" on a map corresponding to how frequently vehicles visited a location.

**What you'll learn:**
- Integrating third-party libraries (Leaflet + Leaflet.heat) into an Add-In
- Querying location history (LogRecord data)
- Building interactive map-based visualizations

**Why it's interesting:** This is the most visually impressive sample — you get an interactive heat map in seconds. The Leaflet pattern is directly reusable for any map-based Add-In you want to build.

**Vibe prompt to build on it:**
```
I installed the Geotab Heat Map Add-In and love it. Build me something similar
but instead of a heat map, show vehicle locations as pins on a map with different
colors for each vehicle group. When I click a pin, show the vehicle name and
its last trip summary.
```

[View source code](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-heatmap)

---

### 2. Trips Timeline — Time-Series Visualization

A compact visualization showing when vehicles made their trips throughout the day, rendered as a scrollable timeline grid.

**What you'll learn:**
- Using the vis.js library for timeline visualizations
- Querying Trip data and rendering start/stop times
- Group-based filtering (filter vehicles by organizational group)

**Why it's interesting:** Fleet managers constantly ask "when were my vehicles active?" This sample answers that question with a clean, scrollable timeline. The vis.js library is powerful and underused — timelines, Gantt charts, and schedule views are all within reach.

**Vibe prompt to build on it:**
```
I like the Trips Timeline Add-In. Build me a version that also shows driver
names next to each vehicle, and highlights trips longer than 4 hours in red.
Add a summary row at the bottom showing total fleet active hours for the day.
```

[View source code](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-trips-timeline)

---

### 3. Import KML Zones — File Upload and Write Operations

Parses a KML file (Google Earth format) and imports the geographic shapes into MyGeotab as Zones.

**What you'll learn:**
- File upload and parsing in a browser-based Add-In
- Writing data *back* to Geotab (creating Zones via the `Add` method)
- A workflow pattern that goes beyond read-only dashboards

**Why it's interesting:** Most beginner Add-Ins only *read* data. This one *writes* it. Learning how to create entities via the API opens up a whole category of tools: import utilities, bulk editors, data migration tools, zone builders.

**Vibe prompt to build on it:**
```
I want an Add-In that lets me upload a CSV file with columns: zone_name,
latitude, longitude, radius_meters. For each row, create a circular Zone
in MyGeotab. Show a progress bar as zones are created, and a summary at
the end showing how many succeeded or failed.
```

[View source code](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-import-kml-zones)

---

### 4. Start-Stop Savings — Diagnostic Data and ROI Calculations

An informational display providing fuel savings estimates for vehicles with stop-start systems, with monthly and yearly comparisons.

**What you'll learn:**
- Querying diagnostic/StatusData for specific vehicle metrics
- Calculating derived business values (fuel savings, ROI)
- Presenting monthly vs. yearly analytics
- Building vehicle-specific detail views

**Why it's interesting:** This shows how to turn raw diagnostic data into business value. Fleet managers love ROI numbers. The pattern of "fetch diagnostic data → calculate savings → present results" applies to many fleet scenarios: tire wear estimates, battery health tracking, predictive maintenance scheduling.

**Vibe prompt to build on it:**
```
Build a Geotab Add-In that estimates maintenance costs per vehicle. Use
StatusData to track odometer readings, then calculate when each vehicle
is due for oil change (every 8,000 km), tire rotation (every 12,000 km),
and brake inspection (every 25,000 km). Show a table sorted by most urgent.
```

[View source code](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-start-stop)

---

### 5. IOX Output — Hardware Device Control

Demonstrates sending messages to a Geotab GO device to control an IOX (Input/Output eXpander) peripheral — turning it on or off.

**What you'll learn:**
- Sending commands to physical devices via the API
- Working with IOX peripherals
- Administration-level Add-In placement
- Device messaging patterns

**Why it's interesting:** This is the bridge between software and hardware. IOX devices can control physical outputs — relay switches, buzzers, LED indicators, auxiliary equipment. If you're building IoT-style fleet solutions (door lock control, refrigeration monitoring, auxiliary equipment management), this is your starting point.

**Vibe prompt to build on it:**
```
Build an Add-In that shows all vehicles with IOX devices installed.
For each vehicle, show the current IOX state (on/off) and provide
toggle buttons. Add a confirmation dialog before sending any command.
Include an activity log showing the last 10 commands sent.
```

[View source code](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-iox-output)

---

### 6. Storage API Sample — Persistent Data Without a Database

A to-do list Add-In that demonstrates the AddInData API. Users can add tasks, mark them complete, and everything persists inside MyGeotab.

**What you'll learn:**
- The `AddInData` API for persistent storage inside MyGeotab
- Full CRUD operations: create (`Add`), read (`Get`), update (`Set`)
- User-scoped data (tasks are tied to the logged-in user)
- Storing structured metadata (timestamps, usernames, status)

**Why it's interesting:** Most developers assume they need an external database to store data. The `AddInData` API lets your Add-In save and retrieve structured data directly within MyGeotab — no database, no backend, no extra hosting. This unlocks: saved user preferences, custom notes on vehicles, bookmarked reports, configuration settings, and audit logs.

**Vibe prompt to build on it:**
```
Build a Geotab Add-In that lets fleet managers add notes to individual
vehicles. Use the AddInData API to store notes (no external database).
Each note should have: vehicle name, text, timestamp, author.
Show a list of all notes with search and filter by vehicle.
```

[View source code](https://github.com/Geotab/sdk-addin-samples/tree/master/storage-api-sample)

---

### Button Add-Ins (appear on existing pages)

---

### 7. Engine Data Button — Context-Aware Actions

A button on the vehicle page that reads the currently selected vehicle ID from state and redirects to the engine data profile showing speed, voltage, and fuel metrics.

**What you'll learn:**
- Building **Button Add-Ins** (vs. Page Add-Ins) — buttons appear on existing MyGeotab pages
- Reading application state to get the selected vehicle ID
- Programmatic navigation to redirect users to other pages
- Multilingual button labels (English, French, Spanish, Japanese)

**Why it's interesting:** Button Add-Ins are a different paradigm. Instead of building a whole page, you add a context-aware action to an existing page. When a fleet manager is looking at a vehicle, your button appears right there. This is great for quick actions: "generate a report for this vehicle", "send an alert to this driver", "export this vehicle's data".

**Vibe prompt to build on it:**
```
Build a button Add-In for the vehicle page that, when clicked, opens a
popup showing the vehicle's last 5 trips with distance, duration, and
top speed. Include a "Copy to clipboard" button for the summary.
```

[View source code](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-engine-data-button)

---

## Patterns Worth Studying

Looking across all 7 samples, a few patterns stand out:

**CDN Deployment via jsDelivr** — Every sample serves files directly from GitHub via jsDelivr URLs. Push to GitHub, instantly available as an Add-In URL. No separate hosting step needed.

**Menu Placement Paths** — Different `path` values control where Add-Ins appear in MyGeotab's navigation:
- `ActivityLink/` — Main sidebar (dashboards, reports)
- `AdministrationLink/` — Administration section (settings, device management)
- `EngineMaintenanceLink/` — Vehicle engine maintenance section

**Page vs. Button Configuration** — Page Add-Ins use `"url"` + `"menuName"` (they load an HTML page). Button Add-Ins use `"click"` + `"buttonName"` + `"page"` (they run a JS file on a specific page).

**Localization** — The Engine Data Button includes labels in four languages. Even if you only support English now, structuring your config with `"en"` makes future localization trivial.

**Build Structure** — Production Add-Ins separate source (`app/`) from built output (`dist/`). For prototypes, a single HTML file works fine. As your Add-In grows, this separation keeps things manageable.

---

## Which Sample Should You Start With?

| Your goal | Start with | Why |
|-----------|-----------|-----|
| **Show data on a map** | Heat Map | Leaflet pattern is reusable for any map visualization |
| **Build a timeline/schedule view** | Trips Timeline | vis.js timeline + group filtering is a solid foundation |
| **Import or create data** | Import KML Zones | Learn the `Add` method for writing entities to Geotab |
| **Calculate ROI/savings** | Start-Stop Savings | Pattern for diagnostic data → business metrics |
| **Store user data in MyGeotab** | Storage API Sample | No-database persistence with AddInData |
| **Control hardware** | IOX Output | Device messaging for IoT scenarios |
| **Add a quick action button** | Engine Data Button | Context-aware buttons on existing pages |

---

## From Sample to Your Own Add-In

Once you've installed and explored a sample, the fastest path to building your own:

1. **Pick the sample closest to what you want**
2. **Tell your AI assistant:**

```
I'm studying the [sample name] Geotab Add-In from
https://github.com/Geotab/sdk-addin-samples

Use the geotab-addins skill.

Build me a similar Add-In but instead of [what it does now],
I want it to [what you want]. Keep the same structure and
deployment pattern.
```

3. **Host it** — GitHub Pages, Replit, or any HTTPS server (see [GEOTAB_ADDINS.md](./GEOTAB_ADDINS.md#hosting-requirements) for options)
4. **Install it** using the same JSON config pattern with your own URL

---

## Resources

- **[sdk-addin-samples repository](https://github.com/Geotab/sdk-addin-samples)** — Browse all source code
- **[Building Add-Ins guide](./GEOTAB_ADDINS.md)** — Complete vibe coding guide for building your own
- **[Transform to Zenith guide](./TRANSFORM_ADDIN_ZENITH.md)** — Should you upgrade your vanilla JS Add-In to React + Zenith?
- **[Geotab Add-In Developer Guide](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)** — Official documentation
- **[API Reference](https://geotab.github.io/sdk/software/api/reference/)** — All available methods and types
