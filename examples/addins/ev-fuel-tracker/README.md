# EV Mix and Fuel Tracker v0.2

A Geotab Add-In that gives fleet managers a live snapshot of their mixed EV/ICE fleet and immediately surfaces any vehicle with critically low fuel or battery.

## What It Does

The add-in makes a single batched `multiCall` to the Geotab API on load and presents three views:

| Section | Description |
|---------|-------------|
| **Summary cards** | Total fleet size, EV count + %, Gas/ICE count + % |
| **Fleet mix bar** | Animated horizontal progress bar showing EV vs Gas split |
| **Low energy alerts table** | Every vehicle currently below 20% fuel or battery, with live speed |

### How vehicle type is determined

- A device that has `DiagnosticElectricVehicleBatteryStateOfChargeId` readings in the last 2 days is classified as **EV**.
- All other devices default to **Gas/ICE**.
- If a vehicle has both readings (plug-in hybrid edge case), the battery SoC reading wins.

### Alert threshold

Any vehicle with a fuel level (`DiagnosticFuelLevelId`) or battery SoC (`DiagnosticElectricVehicleBatteryStateOfChargeId`) **below 20%** appears in the alert table. Clicking the vehicle name navigates MyGeotab to that device's detail page.

### API calls made

```
multiCall([
  ['Get', { typeName: 'Device' }],
  ['Get', { typeName: 'StatusData', search: { diagnosticSearch: { id: 'DiagnosticFuelLevelId' }, fromDate: <2 days ago> } }],
  ['Get', { typeName: 'StatusData', search: { diagnosticSearch: { id: 'DiagnosticElectricVehicleBatteryStateOfChargeId' }, fromDate: <2 days ago> } }],
  ['Get', { typeName: 'DeviceStatusInfo' }]
])
```

`DeviceStatusInfo` supplies the live speed shown in the table.

## Files

| File | Purpose |
|------|---------|
| `ev_tracker_v2.html` | Readable, formatted source HTML — the canonical version for development and review |
| `ev-fuel-tracker-config.json` | **Paste-ready embedded config** — the entire add-in in one JSON blob, no hosting required |
| `README.md` | This file |

## Quick Install (No Hosting Needed)

1. Copy the entire contents of **`ev-fuel-tracker-config.json`**
2. In MyGeotab: profile icon (top-right) → **Administration → System → System Settings → Add-Ins**
3. Enable **"Allow unverified Add-Ins"** → Yes
4. Click **"New Add-In"** → **"Configuration"** tab
5. Paste and **Save**
6. Hard-refresh (`Ctrl+Shift+R`) — look for **"EV & Fuel Tracker v0.2"** in the left menu

## Debug Panel

A hidden debug panel is included at the bottom of the page. Click **Toggle Debug Log** to see API call timing and counts. Click **Copy Debug Data** to copy a JSON snapshot of raw API samples — useful for pasting back to an AI assistant for analysis.

## Extending This Add-In

Common next steps:

- **Lower the alert threshold** — change `v.level < 20` in the JS to any percentage you prefer
- **Add a refresh button** — call the same `multiCall` block again on click
- **Email/Slack alerts** — connect to a backend via the [Secure Add-In Backend guide](../../../guides/SECURE_ADDIN_BACKEND.md)
- **Filter by group** — add a `groupSearch` to the Device call to scope to a depot or region
- **Sort the alert table** — sort `lowEnergy` by `item.level` ascending before rendering

## Learn More

- [GEOTAB_ADDINS.md](../../../guides/GEOTAB_ADDINS.md) — full Add-Ins guide
- [EMBEDDED_README.md](../EMBEDDED_README.md) — how embedded add-ins work
- [Geotab SDK Add-In docs](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)
