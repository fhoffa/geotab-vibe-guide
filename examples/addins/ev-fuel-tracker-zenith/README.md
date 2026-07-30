# EV Mix and Fuel Tracker - Zenith Version

React + [@geotab/zenith](https://www.npmjs.com/package/@geotab/zenith) rewrite of the EV Fuel Tracker. Identical functionality to the vanilla version — same API calls, same data model — but styled to match MyGeotab's native look exactly.

## What It Does

Same features as `../ev-fuel-tracker/` with Zenith components:

| Section | Zenith component(s) |
|---------|---------------------|
| Loading state | `Waiting` |
| API error | `Alert` (wrapped in `FeedbackProvider`) |
| Refresh button | `Button variant="primary"` |
| Filter buttons | `Button variant="primary/secondary"` |
| Fleet mix bar | HTML div with Zenith color tokens |
| Vehicle table | HTML table with Zenith color tokens |
| Type badges | Inline spans using Zenith color tokens |

## Setup

```bash
cd examples/addins/ev-fuel-tracker-zenith
npm install
npm run build
```

The `dist/` folder is already built and committed. Rebuild only when you change `src/`.

## Development

```bash
npm run dev   # watch mode — rebuilds on every save
```

## Files

| File | Purpose |
|------|---------|
| `src/index.jsx` | `geotab.addin` entry point — mounts/unmounts React on focus/blur |
| `src/EvFuelTracker.jsx` | Main React component |
| `dist/ev-fuel-tracker.html` | HTML shell (just the root div + script tag) |
| `dist/ev-fuel-tracker.js` | Webpack bundle (React + Zenith + app code) |
| `ev-fuel-tracker-zenith-config.json` | MyGeotab install config |

## Install

1. Copy the entire contents of **`ev-fuel-tracker-zenith-config.json`**
2. MyGeotab: profile icon → **Administration → System → System Settings → Add-Ins**
3. Enable **"Allow unverified Add-Ins"** → Yes
4. **New Add-In → Configuration tab** → paste → Save
5. Hard-refresh (`Ctrl+Shift+R`) — look for **"EV Fuel Tracker (Zenith)"**

## Vanilla vs Zenith

| | Vanilla (`../ev-fuel-tracker/`) | Zenith (this folder) |
|---|---|---|
| Build required | No | Yes (`npm run build`) |
| Bundle size | ~10 KB | ~2.3 MB |
| Looks like MyGeotab | Approximate | Exact |
| Debugging | Clear line numbers | Minified stack traces |
| Iteration speed | Edit → refresh | Edit → build → refresh |

## Learn More

- [TRANSFORM_ADDIN_ZENITH.md](../../../guides/TRANSFORM_ADDIN_ZENITH.md) — when to use Zenith
- [ZENITH_STYLING.md](../../../skills/geotab/references/ZENITH_STYLING.md) — component reference
- [Zenith official docs](https://developers.geotab.com/zenith/introduction/)
