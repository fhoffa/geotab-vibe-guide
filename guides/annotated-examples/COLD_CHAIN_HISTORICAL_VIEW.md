# Annotated Example: Cold Chain Historical View

**A temperature monitoring Add-In — what it does, why it works, and how to prompt for something like it.**

This Add-In lets fleet managers select vehicles, pick a date range, and see historical temperature data plotted against setpoints. It was built with AI-assisted "vibe coding" and shows patterns you'll want to reuse.

> **Try it yourself:** Paste [cold-chain-configuration.json](cold-chain-configuration.json) into MyGeotab.
> Go to Administration → System Settings → Add-Ins → New Add-In → Configuration tab.

---

## The Problem It Solves

A fleet manager running refrigerated trucks needs to prove the cargo stayed cold. Regulators, customers, and insurance all want proof. This Add-In answers one question: **"What were the temperatures in my trucks yesterday?"**

It gives you:
- A vehicle selector (multi-select for comparing trucks)
- A date range picker (defaults to yesterday — because compliance reviews happen after the fact)
- Temperature charts showing actual readings vs. the setpoint target
- PDF export with charts and data tables for compliance binders
- Excel export with one sheet per vehicle for further analysis

---

## The Prompt That Built It

Here's a prompt that would generate something very close to this Add-In:

```
Use the geotab-addins skill.

Create an embedded Geotab Add-In called "Cold Chain Historical View" that:

1. Shows a multi-select dropdown of all vehicles in the fleet
2. Has date range pickers defaulting to yesterday (full day)
3. When the user clicks "Plot Selection", fetches temperature data
   (both cargo/air temperature and setpoint) for each selected vehicle
4. Displays a Chart.js line chart per vehicle showing actual temp
   (red, filled) vs. setpoint (black, dashed) over time
5. Has a "Export PDF" button that generates a report with the chart
   images and a data table per vehicle
6. Has a "Export Excel" button that creates an .xlsx file with one
   worksheet per vehicle

IMPORTANT:
- Don't hardcode diagnostic IDs — search for diagnostics containing
  "Temperature" and filter client-side for zone 1 cargo/air and setpoint
- Use api.multiCall to batch API requests
- Pin all CDN library versions
- Use StatusData for temperature readings
```

That's it. The rest is details the AI fills in. But there are interesting decisions in *how* this Add-In was built that are worth understanding so you can guide the AI better.

---

## Key Decisions Worth Understanding

### 1. Embedded deployment (no hosting needed)

This Add-In uses the **embedded** approach — the entire HTML/JS app lives inside the `"files"` block of the configuration JSON. No GitHub Pages, no server.

**Where to see it:** Look at the top-level structure of [cold-chain-configuration.json](cold-chain-configuration.json) — the `"files"` key contains the full `coldchain.html` as a single string.

**When to ask for this in your prompt:** Say "Create an **embedded** Geotab Add-In" when you want zero hosting. Say "Create an **externally hosted** Add-In" when the code is too large for a single string. See [Two Ways to Deploy](../GEOTAB_ADDINS.md#two-ways-to-deploy) for the trade-offs.

### 2. Diagnostic discovery instead of hardcoded IDs

Different Geotab databases have different diagnostic IDs for temperature sensors. This Add-In searches for diagnostics with "Temperature" in the name, then filters client-side for "zone 1" + "cargo" or "set".

**Where to see it:** In the `initialize` function — look for the `multiCall` that fetches `Diagnostic` with `search: { name: '%Temperature%' }`, followed by the `for` loop that checks `indexOf('set')` and `indexOf('cargo')`.

**Why this matters for your prompts:** If you're building any sensor-based Add-In (temperature, fuel, tire pressure), always tell the AI: *"Don't hardcode diagnostic IDs — search by name pattern and filter client-side."* This makes your Add-In portable across databases.

### 3. `multiCall` for batching

The Add-In uses `api.multiCall` in two places:
- **On load:** Fetches all devices AND all temperature diagnostics in a single API round-trip
- **Per vehicle:** Fetches both actual temperature AND setpoint data together

**Where to see it:** Search for `api.multiCall` in the configuration — there are two instances. The first is in `initialize` (devices + diagnostics). The second is inside the `btnLoad` click handler (StatusData for each vehicle).

**Why this matters for your prompts:** Always tell the AI: *"Use `api.multiCall` to batch API calls."* A common mistake is making separate `api.call` requests that could be combined.

### 4. `StatusData` for sensor readings

All telematics sensor data in Geotab lives in `StatusData` — temperature, fuel level, tire pressure, battery voltage. The search always follows the same shape: filter by device, diagnostic, and time range.

**Where to see it:** Look for `typeName: 'StatusData'` in the click handler. The search includes `deviceSearch`, `diagnosticSearch`, `fromDate`, and `toDate`.

**Why this matters for your prompts:** When asking the AI for sensor data, be specific: *"Use StatusData with deviceSearch and diagnosticSearch filters."* This prevents the AI from inventing wrong approaches.

### 5. One dynamic chart per vehicle

Instead of cramming all vehicles into one chart (messy), the Add-In creates a separate `<canvas>` and Chart.js instance per selected vehicle. Each chart shows that vehicle's actual temperature (red filled area) vs. its setpoint (black dashed line).

**Where to see it:** Inside the `btnLoad` click handler — a `forEach` loop over selected vehicle IDs. Each iteration creates a new `<div>` with a `<canvas>`, then instantiates a `new Chart()`.

**Why this matters for your prompts:** When you want per-item visualizations, tell the AI: *"Create one chart per vehicle, dynamically added to the page."* This scales better than trying to overlay 10 vehicles on one chart.

### 6. Client-side PDF and Excel export

Both exports happen entirely in the browser using CDN libraries. The PDF captures chart canvases as PNG images and adds data tables. The Excel file creates one worksheet per vehicle. No server setup required — though you could also generate exports server-side if you have a backend.

**Where to see it:** Look for `btnExport` (PDF using jsPDF + autoTable) and `btnExcel` (Excel using SheetJS/xlsx).

**Why this matters for your prompts:** Client-side export is the simplest path when you haven't set up a server. When asking for export features, specify: *"Use jsPDF for PDF export and SheetJS for Excel export, loaded from CDN."*

### 7. Version-pinned CDN libraries

Every `<script>` tag uses a specific version (`chart.js@3.9.1`, not `chart.js@latest`). This prevents the Add-In from breaking when libraries release updates.

**Where to see it:** The `<head>` section — six `<script>` tags, all with pinned versions.

**Why this matters for your prompts:** AI tools sometimes generate `@latest` CDN links. Always tell the AI: *"Pin all CDN library versions."*

---

## Things to Watch Out For

This is a solid Add-In, but it has a few limitations worth knowing about — either to fix or to avoid in your own builds:

| Issue | What Happens | What to Ask For Instead |
|-------|-------------|------------------------|
| No error callbacks on API calls | If the API fails, user sees "Loading..." forever | *"Add error callbacks to all api.multiCall calls with a user-visible error message"* |
| Hardcoded to Zone 1 only | Multi-zone reefer trucks only show the first zone | *"Search for all temperature zones and let the user select which zone to display"* |
| No loading spinner per vehicle | User can't tell which vehicles have loaded | *"Add a loading indicator for each vehicle that disappears when its data loads"* |
| PDF table capped at 100 rows | Long date ranges lose data in the PDF | *"Paginate the PDF data table across multiple pages if it exceeds one page"* |
| Temperature assumed °C | Could be wrong for some databases | *"Detect the user's unit preference or add a °C/°F toggle"* |
| All devices fetched (no group filter) | Slow on large fleets | *"Filter the device list by group so only relevant vehicles appear"* |

---

## Prompts to Extend This Add-In

Copy-paste these into Claude or another AI tool. Give it the [configuration.json](cold-chain-configuration.json) as context.

**Add alert thresholds:**
```
Take this Cold Chain Add-In and add configurable temperature thresholds.
When the cargo temperature exceeds the threshold, highlight that section
of the chart in red. Add input fields for min and max acceptable temperature.
Use the geotab-addins skill for correct patterns.
```

**Add multi-zone support:**
```
Modify this Cold Chain Add-In to support multiple reefer zones
(Zone 1, Zone 2, Zone 3). Search for all temperature diagnostics,
group them by zone, and show each zone as a separate line on the chart.
Use different colors per zone.
Use the geotab-addins skill for correct patterns.
```

**Add a map view:**
```
Extend this Cold Chain Add-In with a Leaflet map showing the vehicle's
route for the selected time period. Color the route markers by temperature
(green = in range, red = out of range). Use LogRecord for GPS positions
and correlate with the StatusData timestamps.
Use the geotab-addins skill for correct patterns.
```

**Fix the error handling:**
```
Improve this Cold Chain Add-In's error handling:
- Add error callbacks to all api.multiCall calls
- Show a user-friendly message if no temperature diagnostics are found
- Add a loading spinner per vehicle while data loads
- Handle the case where a vehicle has no temperature data
Use the geotab-addins skill for correct patterns.
```

---

## Full Configuration

The complete configuration ready to paste into MyGeotab:
[cold-chain-configuration.json](cold-chain-configuration.json)

For more on how Add-Ins work, see the [Building Add-Ins guide](../GEOTAB_ADDINS.md).
