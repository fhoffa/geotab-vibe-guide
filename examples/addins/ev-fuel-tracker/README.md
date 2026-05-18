# EV Mix and Fuel Tracker v0.2

A Geotab Add-In that gives fleet managers a live view of their mixed EV/ICE fleet — every vehicle in one table, sorted by fuel/battery level, with low-energy alerts highlighted.

## What It Does

On load the add-in fires a single `multiCall` and renders:

| Section | Description |
|---------|-------------|
| **Summary cards** | Total fleet, EV count + %, Gas/ICE count + %, low-energy alert count |
| **Fleet mix bar** | Animated progress bar showing EV vs Gas split |
| **All vehicles table** | Every vehicle, clickable by name, with fuel/battery mini-bar, live speed, and OK/alert status |

### Vehicle table features

- **Clickable names** — clicking any vehicle name navigates MyGeotab to that vehicle's detail page
- **Color-coded mini-bar** — green ≥40%, amber 20–39%, red <20%
- **Sortable columns** — click any column header to sort ascending/descending
- **Filter buttons** — All / EV / Gas / Low (<20%) to narrow the view
- **Low-fuel rows** — highlighted in light red so alerts are immediately visible without scrolling

### How vehicle type is determined

- Devices with `DiagnosticElectricVehicleBatteryStateOfChargeId` readings in the past 2 days → **EV**
- All other devices → **Gas/ICE**
- Battery SoC always wins over fuel readings (handles PHEVs)

### API calls made

```js
api.multiCall([
  ['Get', { typeName: 'Device' }],
  ['Get', { typeName: 'StatusData', search: { diagnosticSearch: { id: 'DiagnosticFuelLevelId' }, fromDate: <2 days ago> } }],
  ['Get', { typeName: 'StatusData', search: { diagnosticSearch: { id: 'DiagnosticElectricVehicleBatteryStateOfChargeId' }, fromDate: <2 days ago> } }],
  ['Get', { typeName: 'DeviceStatusInfo' }]
], ...)
```

`DeviceStatusInfo` supplies the live speed column.

## Files

| File | Purpose |
|------|---------|
| `ev_tracker_v2.html` | Add-in source — hosted on GitHub Pages |
| `ev-fuel-tracker-config.json` | Install config — paste into MyGeotab |
| `README.md` | This file |

## Install (GitHub Pages hosted)

1. Copy the entire contents of **`ev-fuel-tracker-config.json`**
2. In MyGeotab: profile icon (top-right) → **Administration → System → System Settings → Add-Ins**
3. Enable **"Allow unverified Add-Ins"** → Yes
4. Click **"New Add-In"** → **"Configuration"** tab
5. Paste and **Save**
6. Hard-refresh (`Ctrl+Shift+R`) — look for **"EV & Fuel Tracker v0.2"** in the left menu

The add-in loads `ev_tracker_v2.html` directly from GitHub Pages — no separate hosting setup needed.

## Tests

```bash
bash tests/ev-fuel-tracker/run.sh
```

Runs two suites:

1. **Config JSON checks** — validates the install config against external-hosted requirements (no `files`, absolute HTTPS URL, no trailing slash, etc.)
2. **HTML checks** — validates the add-in HTML against Geotab add-in rules (callback(), no style tags, clickable vehicles, correct diagnostic IDs, debug panel, etc.)

Fixtures in `tests/ev-fuel-tracker/fixtures/`:
- `pass-config.json` — valid config that should pass all checks
- `fail-embedded-files.json` — config with `files` property (wrong format for external-hosted)
- `fail-relative-url.json` — config with relative URL instead of GitHub Pages URL
- `fail-trailing-slash.json` — config with trailing slash on path

## Debug Panel

Click **Toggle Debug Log** (fixed at page bottom) to see API counts and timing. Click **Copy Debug Data** to snapshot raw API samples as JSON — paste back to an AI assistant for analysis.

## Extending This Add-In

- **Change the alert threshold** — update `< 20` in the JS to any percentage
- **Add a refresh button** — call the same `multiCall` block and re-run `renderRows()`
- **Filter by group** — add `groupSearch` to the Device call to scope to a depot
- **Add mileage / odometer** — query `DiagnosticOdometerId` in the same `multiCall`
- **Email/Slack alerts** — see [SECURE_ADDIN_BACKEND.md](../../../guides/SECURE_ADDIN_BACKEND.md)

## Learn More

- [GEOTAB_ADDINS.md](../../../guides/GEOTAB_ADDINS.md) — full Add-Ins guide
- [Geotab SDK Add-In docs](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)
