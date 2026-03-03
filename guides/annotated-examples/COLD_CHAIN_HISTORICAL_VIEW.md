# Annotated Example: Cold Chain Historical View (v5.1)

**A temperature monitoring Add-In — what it does, why it works, and how to prompt for something like it.**

*Created by [Majdi Ben Hassen](https://www.linkedin.com/in/majdi-ben-hassen-48300996/)*

This Add-In lets fleet managers filter vehicles by group, pick which temperature signals to plot (across multiple reefer zones), set a date range, and see historical charts with PDF and Excel export. It supports multiple languages and includes reefer unit status tracking.

> **Try it yourself:** Paste [cold-chain-configuration.json](cold-chain-configuration.json) into MyGeotab.
> Click your user profile icon (top-right corner) → Administration → System Settings → Add-Ins → New Add-In → Configuration tab.
>
> **Read the code:** [coldchain.html](coldchain.html) is the formatted, commented source. The configuration JSON has the same code minified into one line.

---

## The Problem It Solves

A fleet manager running refrigerated trucks needs to prove the cargo stayed cold. Regulators, customers, and insurance all want proof. This Add-In answers: **"What were the temperatures in my trucks yesterday — across all zones, and was the reefer unit actually running?"**

It gives you:
- A group filter to narrow down vehicles on large fleets
- Checkbox pickers for vehicles and signals (cargo temp, setpoint, unit status — zones 1-3), each with a **Select All** option
- Min/Max threshold inputs to set the chart Y-axis range
- A date range picker (defaults to yesterday)
- One Chart.js line chart per vehicle with all selected signals overlaid
- A taller chart (400px) with **smart date labels** on the X-axis for multi-day ranges
- **Dual Y-axes**: temperature signals on the left, reefer unit status on the right — each on its own scale
- Digital signals (reefer unit status) rendered as stepped lines with human-readable labels
- A **completion indicator** that shows "Ready." only after every selected vehicle has finished loading
- PDF and Excel export with signal names and values — **no row limit**, with automatic page breaks
- Localized menu names (English, French, Spanish, Portuguese, Italian, Polish) and JS-side i18n

---

## The Prompt That Would Build It

```
Use the geotab-addins skill.

Create an embedded Geotab Add-In called "Cold Chain Historical View" that:

1. Fetches all Groups and Devices on load. Shows a group dropdown
   that filters which vehicles appear in the vehicle picker.
2. Vehicle picker is a custom checkbox dropdown (not <select multiple>),
   with a "Select All" checkbox at the top.
3. Signal picker with a "Select All" checkbox plus individual checkboxes
   for these known diagnostic IDs:
   - DiagnosticCargoTemperatureZone1Id, Zone2, Zone3
   - RefrigerationUnitSetTemperatureZone1Id, Zone2, Zone3
   - RefrigerationUnitStatusId (digital — show as stepped line)
4. Min/Max input fields that set the left Y-axis range
5. Date range pickers defaulting to yesterday
6. One Chart.js line chart per vehicle, height 400px. Each selected signal
   is a separate line with a different color. Temperature signals use the
   left Y-axis. Digital signals use a right Y-axis (0–3, labeled
   Disabled/On/Off/Error, grid lines off).
7. X-axis tick callback: show DD/MM/YYYY below the time only on the first
   tick of each new day, so multi-day ranges stay readable.
8. A pending counter: set pending = number of vehicles before the loop.
   In each multiCall callback, decrement pending and show "Ready." in
   the status div only when pending reaches 0.
9. PDF export with chart images and data tables (Time, Signal, Value).
   Digital values show labels. No row cap. Use pageBreak:'auto' and
   rowPageBreak:'avoid' in autoTable options.
10. Excel export with one worksheet per vehicle, all signals included.
    Use i18n key t.sigCol for the Signal column header.
11. Localize the menu name (menuName) in en, fr, es, pt, it, pl.
    Use state.language in initialize() to set UI labels from an i18n object.
    i18n keys: title, group, allGroups, vehicle, signal, select, selectAll,
    from, to, plot, loading, ready, timeCol, sigCol, valCol, reportTitle, zoom.

IMPORTANT:
- Use api.multiCall to batch API requests
- Pin all CDN library versions
- Use StatusData for all sensor readings
- yAxisID: 'yStatus' on digital datasets, 'y' on temperature datasets
```

---

## Key Decisions Worth Understanding

### 1. Embedded deployment (no hosting needed)

The entire HTML/JS app lives inside the `"files"` block of the configuration JSON. No GitHub Pages, no server.

**Where to see it:** The top-level structure of [cold-chain-configuration.json](cold-chain-configuration.json) — the `"files"` key contains `coldchain.html` as a single string.

**When to ask for this in your prompt:** Say "Create an **embedded** Geotab Add-In" when you want zero hosting. Say "Create an **externally hosted** Add-In" when the code is too large. See [Two Ways to Deploy](../GEOTAB_ADDINS.md#two-ways-to-deploy).

### 2. Group filtering for large fleets

v2.1 loaded all devices into a flat list — unusable on fleets with thousands of vehicles. v3.2 fetches `Group` entities alongside devices, populates a group dropdown, and filters the vehicle list client-side when the user selects a group.

**Where to see it:** The `multiCall` in `initialize` now fetches `Device` and `Group` together. The `updateVeh` function filters `allDevices` by checking if each device's `groups` array contains the selected group ID.

**Why this matters for your prompts:** For any Add-In that lists vehicles, tell the AI: *"Add a group dropdown that filters the vehicle list. Fetch Group entities with multiCall and filter devices client-side by their groups array."*

### 3. Known diagnostic IDs vs. discovery

v2.1 searched for diagnostics by name pattern (`%Temperature%`) and filtered client-side — portable but fragile. v3.2 uses a predefined list of known diagnostic IDs for reefer temperature sensors. Both approaches are valid:

- **Known IDs** (v3.2+ approach): Simpler, no false positives, but assumes specific diagnostics exist in the database
- **Discovery** (v2.1 approach): More portable, works across different device types, but needs careful client-side filtering

**Where to see it:** The `signals` array at the top of the script — 7 entries with hardcoded IDs like `DiagnosticCargoTemperatureZone1Id` and `RefrigerationUnitSetTemperatureZone1Id`.

**Why this matters for your prompts:** If you know your fleet uses standard reefer diagnostics, use known IDs for simplicity. If the Add-In needs to work across unknown databases, ask for discovery: *"Search for diagnostics by name pattern and filter client-side."* See the [diagnostic discovery pattern](../../skills/geotab/references/ADDINS.md#discovering-diagnostics-by-name-portable-across-databases) in the ADDINS skill.

### 4. Multi-zone support with user-selectable signals

Instead of hardcoding "Zone 1 only," the user picks which signals to plot from a checkbox dropdown. This covers Zone 1, 2, and 3 for both cargo temperature and setpoint, plus the reefer unit status.

**Where to see it:** The `sigDrop` dropdown is built from the `signals` array. Each checkbox carries `data-name` and optionally `data-digital` attributes. When plotting, one `multiCall` per vehicle batches a StatusData request per selected signal.

**Why this matters for your prompts:** When building sensor dashboards, tell the AI: *"Let the user select which signals to plot from a checkbox list. Build one multiCall per vehicle with one StatusData query per selected signal."*

### 5. Digital signals on a separate axis (dual Y-axes)

The reefer unit status (`RefrigerationUnitStatusId`) is a digital value (0, 1, 2, 3) — not a temperature reading in degrees. Plotting it on the same axis as temperatures (-30 to +30 °C) crushed it to an invisible flat line near zero.

**What v5.1 does differently:** When any digital signal is selected, `hasStatus` is set to `true`. Each dataset gets a `yAxisID` — temperature signals use `'y'` (left axis, °C range), the status signal uses `'yStatus'` (right axis, 0–3, labeled Disabled/On/Off/Error). The right axis is hidden (`display: false`) when no digital signal is in the selection, so it doesn't appear for temperature-only charts.

**Where to see it:** `yAxisID: isDig ? 'yStatus' : 'y'` in the dataset construction. The `yStatus` scale definition in chart options — note `grid: { drawOnChartArea: false }` keeps it from adding a second grid over the temperature data.

**Why this matters for your prompts:** Whenever you mix continuous signals (temperatures, pressures) with digital/enumerated signals (on/off, status codes) on the same chart, tell the AI: *"Use a dual Y-axis. Temperature signals bind to the left axis. Digital signals bind to a right axis with labeled integer ticks. Hide the right axis when no digital signal is selected."*

### 6. "Select All" in checkbox dropdowns

With 7 signals and potentially dozens of vehicles, clicking each checkbox individually is slow. v5.1 inserts a bold **Select All** checkbox at the top of both the signal and vehicle dropdowns. Checking it sets all matching checkboxes; unchecking it clears them.

**Where to see it:** The `sAllDiv` block just before the `signals.forEach` loop in `initialize`. The `vAllDiv` block at the top of `updateVeh`. Both use `querySelectorAll` + `forEach` with `this.checked` to mirror the master state.

**Why this matters for your prompts:** Any checkbox list with more than ~5 items benefits from this pattern. Tell the AI: *"Add a 'Select All' checkbox at the top of each checkbox dropdown. Checking it should check all items; unchecking it should uncheck all items."*

### 7. Smart date labels on the X-axis

For single-day ranges, showing `HH:mm` on the X-axis is enough. But for multi-day selections, every tick looks the same — you can't tell Wednesday's data from Thursday's.

**What v5.1 does:** A custom `ticks.callback` tracks the last date it showed. On the first tick of each new day, it returns a two-element array: `['HH:mm', 'DD/MM/YYYY']` — Chart.js renders these on two lines. For subsequent ticks in the same day, it returns just `'HH:mm'`. The result: the date appears exactly once per day, right below the first hour tick of that day.

**Where to see it:** The `lastShownDate` variable and the `callback` function inside `scales.x.ticks` in the Chart.js options.

**Why this matters for your prompts:** Whenever a time-series chart can span multiple days, tell the AI: *"Add a custom X-axis tick callback that shows the date (DD/MM/YYYY) below the time only on the first tick of each new day. Use a lastShownDate variable to track when to show it."*

### 8. Completion detection with a pending counter

v3.2 showed "Ready." in the status bar as soon as the first vehicle's data came back — which was misleading when five vehicles were selected and four were still loading.

**What v5.1 does:** Before the `vChks.forEach` loop, `pending` is set to `vChks.length`. Each `api.multiCall` callback decrements `pending` and sets the status to `t.ready` only when `pending === 0`. This guarantees the message appears exactly once, after every vehicle has finished.

**Where to see it:** `var pending = vChks.length;` before the loop. `pending--; if (pending === 0) ...` at the end of each multiCall callback.

**Why this matters for your prompts:** Any Add-In that fires multiple async calls and wants to signal completion should use this pattern. Tell the AI: *"Use a pending counter initialized to the number of async calls. Decrement it in each callback. Show the completion message only when it reaches 0."*

### 9. PDF export with no row cap and proper pagination

v3.2 capped the PDF data table at 100 rows (`.slice(0, 100)`) to avoid a crash when jsPDF tried to fit thousands of rows on a single page. The fix wasn't great: it silently dropped data.

**What v5.1 does:** The `.slice(0, 100)` is gone. Instead, `pageBreak: 'auto'` tells jsPDF-AutoTable to add a new page whenever the table overflows. `rowPageBreak: 'avoid'` prevents a single row from being split across a page boundary. `margin: { top: 20 }` gives the header on continuation pages enough breathing room.

**Where to see it:** The `doc.autoTable(...)` call in `btnExport.onclick` — compare the options block to v3.2.

**Why this matters for your prompts:** When exporting large datasets to PDF, tell the AI: *"Do not slice or cap the data. Use pageBreak:'auto' and rowPageBreak:'avoid' in autoTable options so jsPDF handles pagination automatically."*

### 10. Internationalization (i18n)

The Add-In localizes at two levels:

- **Menu name:** The `menuName` object in the configuration JSON has translations for 6 languages. MyGeotab picks the right one based on the user's language setting.
- **UI labels:** An `i18n` JavaScript object maps label keys to translated strings. `state.language` (provided by MyGeotab in `initialize`) selects the right translation set.

v5.1 added three new i18n keys: `selectAll` (for the Select All checkboxes), `sigCol` (for the Signal column header in PDF and Excel — it was previously hardcoded as the string `'Signal'`), and `ready` (for the completion message — it was previously hardcoded as `'Ready.'`). This makes the Add-In fully translatable without touching logic code.

**Where to see it:** The `menuName` block at the top of the configuration (6 language keys). In the JS, the `i18n` object and `state.language` usage at the start of `initialize`. Search for `t.sigCol` and `t.ready` to see them used.

**Why this matters for your prompts:** If your Add-In will be used by multilingual teams, tell the AI: *"Add menuName translations for en, fr, es. Use state.language in initialize() to pick UI label translations from an i18n object. Every user-visible string — including column headers and status messages — should come from the i18n object, not be hardcoded."*

### 11. Other good practices in this Add-In

A few more patterns worth noting — look for them in [coldchain.html](coldchain.html):

- **Custom checkbox dropdowns** instead of `<select multiple>` (which requires Ctrl+Click). See `vehBtn`/`vehDrop` and `sigBtn`/`sigDrop`.
- **Min/Max Y-axis thresholds** — users set acceptable temperature bounds and the chart scales accordingly. See the `minTemp`/`maxTemp` inputs and `y: { min, max }` in the Chart.js options.
- **`multiCall` batching everywhere** — on load (devices + groups in one call) and per vehicle (one StatusData query per selected signal). Search for `api.multiCall`.
- **Version-pinned CDN libraries** — every `<script>` tag uses a specific version (`@3.9.1`, not `@latest`). Check the `<head>` section.

---

## What Changed from v2.1 to v3.2

| Area | v2.1 | v3.2 |
|------|------|------|
| Vehicle selection | Flat list, `<select multiple>` | Group filter + checkbox dropdown |
| Signal selection | Auto-discovered (Zone 1 only) | User picks from 7 known signals (Zones 1-3) |
| Reefer unit status | Not tracked | Digital signal with stepped line + status labels |
| Chart Y-axis | Auto-scaled | Optional min/max thresholds |
| Localization | English only | 6 languages in menu + JS-side i18n |
| PDF/Excel | Temperature only | All signals with Signal column |
| PDF error handling | None | try/catch on canvas export |

## What Changed from v3.2 to v5.1

| Area | v3.2 | v5.1 | Why it's better |
|------|------|------|-----------------|
| "Select All" | Not present | Checkbox at top of both dropdowns | One click to select all 7 signals or all vehicles — essential for first-run exploration |
| Status Y-axis | Shared with temperature (values 0-3 squished near zero) | Separate right-side axis with text labels | The status line is actually readable; temperature scale is no longer distorted |
| X-axis labels | Time only (`HH:mm`) | Time + date on first tick of each new day | Multi-day selections are no longer ambiguous |
| Completion indicator | "Ready." after first vehicle loads | "Ready." only after all vehicles load | Accurate signal that the full dataset is available |
| PDF row limit | Capped at 100 rows (data silently dropped) | All rows, paginated automatically | Complete data in every export |
| PDF table options | No pagination config | `pageBreak:'auto'`, `rowPageBreak:'avoid'` | Long tables flow across pages cleanly |
| `Signal` column header | Hardcoded English string in PDF/Excel | `t.sigCol` from i18n | Fully translatable |
| `'Ready.'` status text | Hardcoded English string | `t.ready` from i18n | Fully translatable |
| Chart height | 300px | 400px | More room to see temperature trends clearly |

---

## Things to Watch Out For

| Issue | What Happens | What to Ask For Instead |
|-------|-------------|------------------------|
| No error callbacks on API calls | If the API fails, user sees "Loading..." forever | *"Add error callbacks to all api.multiCall calls with a user-visible error message"* |
| Temperature assumed °C | Could be wrong for some databases | *"Detect the user's unit preference or add a °C/°F toggle"* |
| i18n only has English strings in JS | Menu is translated but UI labels fall back to English | *"Add translations to the i18n object for fr, es, pt, it, pl"* |
| No loading spinner per vehicle | User can't tell which vehicles have loaded | *"Add a loading indicator for each vehicle that disappears when its data loads"* |

---

## Prompts to Extend This Add-In

Copy-paste these into Claude or another AI tool. Give it the [configuration.json](cold-chain-configuration.json) as context.

**Add breach highlighting:**
```
Take this Cold Chain Add-In and highlight chart regions where the cargo
temperature goes above or below the min/max thresholds. Use Chart.js
annotation plugin to shade those regions in red.
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

**Complete the i18n:**
```
This Cold Chain Add-In has menuName translations for fr, es, pt, it, pl
but the JavaScript i18n object only has English. Add matching translations
for all UI labels in the i18n object, including the keys added in v5.1:
selectAll, sigCol, ready, zoom. Use the same language keys as menuName.
Use the geotab-addins skill for correct patterns.
```

**Add error handling:**
```
Improve this Cold Chain Add-In's error handling:
- Add error callbacks to all api.multiCall calls
- Show a user-friendly message if no data is returned for a signal
- Add a loading spinner per vehicle while data loads
- Disable the Plot button while loading and re-enable when done
Use the geotab-addins skill for correct patterns.
```

---

## Source Files

- **[coldchain.html](coldchain.html)** — Formatted, commented source code (read this)
- **[cold-chain-configuration.json](cold-chain-configuration.json)** — Ready to paste into MyGeotab (same code, minified into the JSON `files` block)

For more on how Add-Ins work, see the [Building Add-Ins guide](../GEOTAB_ADDINS.md).
