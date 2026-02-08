# Annotated Example: Cold Chain Historical View (v3.2)

**A temperature monitoring Add-In — what it does, why it works, and how to prompt for something like it.**

*Created by [Majdi Ben Hassen](https://www.linkedin.com/in/majdi-ben-hassen-48300996/)*

This Add-In lets fleet managers filter vehicles by group, pick which temperature signals to plot (across multiple reefer zones), set a date range, and see historical charts with PDF and Excel export. It supports multiple languages and includes reefer unit status tracking.

> **Try it yourself:** Paste [cold-chain-configuration.json](cold-chain-configuration.json) into MyGeotab.
> Go to Administration → System Settings → Add-Ins → New Add-In → Configuration tab.
>
> **Read the code:** [coldchain.html](coldchain.html) is the formatted, commented source. The configuration JSON has the same code minified into one line.

---

## The Problem It Solves

A fleet manager running refrigerated trucks needs to prove the cargo stayed cold. Regulators, customers, and insurance all want proof. This Add-In answers: **"What were the temperatures in my trucks yesterday — across all zones, and was the reefer unit actually running?"**

It gives you:
- A group filter to narrow down vehicles on large fleets
- Checkbox pickers for vehicles and signals (cargo temp, setpoint, unit status — zones 1-3)
- Min/Max threshold inputs to set the chart Y-axis range
- A date range picker (defaults to yesterday)
- One Chart.js line chart per vehicle with all selected signals overlaid
- Digital signals (reefer unit status) rendered as stepped lines with human-readable labels
- PDF and Excel export with signal names and values
- Localized menu names (English, French, Spanish, Portuguese, Italian, Polish) and JS-side i18n

---

## The Prompt That Would Build It

```
Use the geotab-addins skill.

Create an embedded Geotab Add-In called "Cold Chain Historical View" that:

1. Fetches all Groups and Devices on load. Shows a group dropdown
   that filters which vehicles appear in the vehicle picker.
2. Vehicle picker is a custom checkbox dropdown (not <select multiple>)
3. Signal picker with checkboxes for these known diagnostic IDs:
   - DiagnosticCargoTemperatureZone1Id, Zone2, Zone3
   - RefrigerationUnitSetTemperatureZone1Id, Zone2, Zone3
   - RefrigerationUnitStatusId (digital — show as stepped line)
4. Min/Max input fields that set the chart Y-axis range
5. Date range pickers defaulting to yesterday
6. One Chart.js line chart per vehicle. Each selected signal is a
   separate line with a different color. Digital signals use stepped lines.
7. PDF export with chart images and data tables (Time, Signal, Value).
   Digital values should show labels: Disabled, On, Off, Error.
8. Excel export with one worksheet per vehicle, all signals included.
9. Localize the menu name (menuName) in en, fr, es, pt, it, pl.
   Use state.language in initialize() to set UI labels from an i18n object.

IMPORTANT:
- Use api.multiCall to batch API requests
- Pin all CDN library versions
- Use StatusData for all sensor readings
- Add try/catch around PDF canvas export
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

- **Known IDs** (v3.2 approach): Simpler, no false positives, but assumes specific diagnostics exist in the database
- **Discovery** (v2.1 approach): More portable, works across different device types, but needs careful client-side filtering

**Where to see it:** The `signals` array at the top of the script — 7 entries with hardcoded IDs like `DiagnosticCargoTemperatureZone1Id` and `RefrigerationUnitSetTemperatureZone1Id`.

**Why this matters for your prompts:** If you know your fleet uses standard reefer diagnostics, use known IDs for simplicity. If the Add-In needs to work across unknown databases, ask for discovery: *"Search for diagnostics by name pattern and filter client-side."* See the [diagnostic discovery pattern](../../skills/geotab/references/ADDINS.md#discovering-diagnostics-by-name-portable-across-databases) in the ADDINS skill.

### 4. Multi-zone support with user-selectable signals

Instead of hardcoding "Zone 1 only," the user picks which signals to plot from a checkbox dropdown. This covers Zone 1, 2, and 3 for both cargo temperature and setpoint, plus the reefer unit status.

**Where to see it:** The `sigDrop` dropdown is built from the `signals` array. Each checkbox carries `data-name` and optionally `data-digital` attributes. When plotting, one `multiCall` per vehicle batches a StatusData request per selected signal.

**Why this matters for your prompts:** When building sensor dashboards, tell the AI: *"Let the user select which signals to plot from a checkbox list. Build one multiCall per vehicle with one StatusData query per selected signal."*

### 5. Digital signals (stepped lines)

The reefer unit status (`RefrigerationUnitStatusId`) is a digital value — not a continuous temperature reading. v3.2 marks it with `isDigital: true` and renders it as a `stepped` Chart.js line. Raw numeric values (0, 1, 2, 3) map to human labels: Disabled, On, Off, Error.

**Where to see it:** The `signals` array entry with `isDigital: true`. In the chart config, `stepped: isDig` produces a stepped line. In the export functions, `statusLabels[p.data]` maps numbers to words.

**Why this matters for your prompts:** When you have binary or enumerated sensor data (on/off, open/closed, status codes), tell the AI: *"Render digital signals as stepped lines. Map numeric values to human-readable labels."*

### 6. Internationalization (i18n)

The Add-In localizes at two levels:

- **Menu name:** The `menuName` object in the configuration JSON has translations for 6 languages. MyGeotab picks the right one based on the user's language setting.
- **UI labels:** An `i18n` JavaScript object maps label keys to translated strings. `state.language` (provided by MyGeotab in `initialize`) selects the right translation set.

**Where to see it:** The `menuName` block at the top of the configuration (6 language keys). In the JS, the `i18n` object and the `state.language` usage at the start of `initialize`.

**Why this matters for your prompts:** If your Add-In will be used by multilingual teams, tell the AI: *"Add menuName translations for en, fr, es. Use state.language in initialize() to pick UI label translations from an i18n object."* MyGeotab passes the user's language in the `state` parameter — this is the standard way to localize Add-Ins.

### 7. Other good practices in this Add-In

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

---

## Things to Watch Out For

| Issue | What Happens | What to Ask For Instead |
|-------|-------------|------------------------|
| No error callbacks on API calls | If the API fails, user sees "Loading..." forever | *"Add error callbacks to all api.multiCall calls with a user-visible error message"* |
| PDF table capped at 100 rows | Long date ranges lose data in the PDF | *"Paginate the PDF data table across multiple pages if it exceeds one page"* |
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
for all UI labels in the i18n object. Use the same language keys as menuName.
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
