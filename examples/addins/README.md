# Geotab Add-In Examples

Working examples you can use right away.

## Files

### simple-test.* (External Hosted)
Complete working Add-In showing:
- Username and database
- Vehicle count
- Clean UI with status indicators

**Files:**
- `simple-test.html` - Main HTML page
- `simple-test.js` - JavaScript with API calls
- `simple-test-config.json` - Configuration to paste into MyGeotab

**Type:** External hosted (requires HTTPS hosting)

**Try it:**
1. Copy content of `simple-test-config.json`
2. In MyGeotab, click your user profile icon (top-right corner) → Administration → System → System Settings → Add-Ins
3. Enable "Allow unverified Add-Ins" → Yes
4. Click "New Add-In" → "Configuration" tab
5. Paste and save

### minimal-test.* (External Hosted)
Even simpler example with just the basics.

**Files:**
- `minimal-test.html` - Minimal HTML
- `minimal-test.js` - Minimal JavaScript
- `minimal-test-config.json` - Configuration

**Type:** External hosted (requires HTTPS hosting)

### ace-duckdb-lab.* (Advanced: Ace + DuckDB WASM)
Demonstrates integrating Geotab Ace with DuckDB in the browser for in-memory SQL analytics.

**Features:**
- Ask natural language questions via Geotab Ace
- Load CSV results into an in-browser DuckDB database (WASM)
- Run custom SQL queries on the data
- Debug console showing Ace API workflow

**Files:**
- `ace-duckdb-lab.html` - Main HTML with embedded JavaScript
- `ace-duckdb-lab-config.json` - Configuration for MyGeotab

**Type:** External hosted (requires HTTPS hosting)

**Technical Notes:**
- DuckDB runs entirely in the browser using WebAssembly
- Includes workaround for GCS CORS restrictions (blob fetch)
- Documents engineering improvements Geotab could make

### vehicle-dashboard-map.* (Vehicle Navigator + Ace)
Dashboard with vehicle list, map navigation, and Ace AI integration.

**Features:**
- Vehicle list with clickable names (device detail) and Map buttons (live map)
- Real Ace AI integration using the 3-step GetAceResults pattern
- Pre-built question buttons for fleet queries
- Debug panel with log toggle and copy data

**Files:**
- `vehicle-dashboard-map.html` - Main HTML page
- `vehicle-dashboard-map-config.json` - Embedded config (no hosting needed)

**Type:** Both external hosted and embedded versions available

### ace-api-comparison.* (Ace vs Direct API)
Side-by-side comparison of Ace natural language queries vs direct API calls.

**Files:**
- `ace-api-comparison.html` - Comparison tool
- `ace-api-comparison-external.json` - Configuration

**Type:** External hosted

### tco-calculator.* (TCO Calculator — Annotated)
Full-featured fleet Total Cost of Ownership calculator with dashboard, Ace AI, and CSV export.

**Features:**
- Three-column dashboard: Fleet Summary, SVG Health Gauge / Vehicle Focus Card, Controls
- TCO formula: Fixed Cost (depreciation) + Operational (fuel + maintenance) + Waste (idle)
- Real fuel data from `StatusData` (`DiagnosticDeviceTotalFuelId`) with estimate fallback
- Idle hours from `Trip.idlingDuration` with Waste Cost calculation
- Date range selector (30/60/90 days, MTD, YTD) — fully wired up
- SVG odometer-style health gauge showing fleet efficiency
- Clickable rows show Vehicle Focus Card with TCO breakdown and navigation links
- Sortable table columns (click headers to sort by name, miles, idle, TCO)
- CSV export for Excel
- Ace AI integration (3-step `GetAceResults` pattern with polling)
- Persistent vehicle classification via `AddInData`
- MyGeotab navigation via `window.parent.location.hash`

**Files:**
- `tco-calculator.html` - Annotated HTML with three-column dashboard layout
- `tco-calculator.js` - Annotated JavaScript (~450 lines, heavily commented)
- `tco-calculator-config.json` - Configuration for MyGeotab

**Type:** External hosted (requires HTTPS hosting)

**Concepts demonstrated:**
- `multiCall()` batching Device + Trip + StatusData + AddInData
- `StatusData` with `DiagnosticDeviceTotalFuelId` for real fuel usage
- `AddInData` for persisting custom data across sessions
- `Trip.distance` (km to miles) and `Trip.idlingDuration` parsing
- `GetAceResults` 3-step Ace AI pattern (create-chat, send-prompt, poll)
- `window.parent.location.hash` for in-app navigation
- ES5 syntax and inline CSS for embedded compatibility
- SVG rendering for data visualization

### embedded-* (No Hosting Required!)
Embedded add-in with everything in the JSON configuration.

**Files:**
- `embedded-config.json` - Ready to paste (no hosting needed!)
- `EMBEDDED_README.md` - Complete documentation

**Type:** Embedded (no hosting required)

**Why use this?**
- ✅ No external hosting setup needed
- ✅ No waiting for deployment
- ✅ Just copy-paste JSON and it works
- ✅ Full MyGeotab API access
- ✅ Perfect for quick tests and prototypes

**Try it:**
1. Copy entire contents of `embedded-config.json`
2. In MyGeotab, click your user profile icon (top-right corner) → Administration → System → System Settings → Add-Ins
3. Enable "Allow unverified Add-Ins" → Yes
4. Click "New Add-In" → "Configuration" tab
5. Paste and save
6. Refresh page

See `EMBEDDED_README.md` for details.

## How to Use

**Copy and modify (for external hosted examples):**
1. Copy one of these examples to your own repo
2. Modify the HTML/JS to do what you want
3. Host the files on any HTTPS server (GitHub Pages, your server, etc.)
4. Update the config JSON with your file URLs
5. Install in MyGeotab

**Or tell AI:**
```
Use the geotab skill (`skills/geotab/SKILL.md`) and load `skills/geotab/references/ADDINS.md`.

Create a Geotab Add-In similar to simple-test but with [your features].
```

## Learn More

See [guides/GEOTAB_ADDINS.md](https://github.com/fhoffa/geotab-vibe-guide/blob/main/guides/GEOTAB_ADDINS.md) for the full Add-Ins guide, or jump straight to the [official SDK samples walkthrough](https://github.com/fhoffa/geotab-vibe-guide/blob/main/guides/SDK_ADDIN_SAMPLES_GUIDE.md).
