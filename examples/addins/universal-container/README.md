# Universal Add-In Container

A single MyGeotab Add-In that acts as a **security sandbox and API firewall** for any other Add-In. Install it once; use it to load, inspect, and control any Add-In without touching MyGeotab's configuration.

## Intention

Geotab Add-Ins run directly inside MyGeotab and receive a live `api` object — no authentication step, no rate limiting, no visibility into what calls are being made. This is great for productivity but makes it hard to:

- Audit what API calls a third-party Add-In is actually making
- Prototype Add-Ins without repeatedly modifying MyGeotab's Add-In list
- Teach the Geotab API by watching calls happen in real time
- Block specific API operations during demos or reviews

The Universal Container solves all of this by loading any Add-In inside an `iframe` and **proxying every `api.call()` through a postMessage bridge**. The real Geotab API is never exposed to the inner page — every call passes through the container's security layer first.

## Files

| File | Purpose |
|------|---------|
| `universal-container.html` | The Add-In shell — install this one in MyGeotab |
| `universal-container-config.json` | MyGeotab manifest for installation |

## How it works

```
MyGeotab
  └── universal-container.html  (registered Add-In, holds real `api`)
        ├── top bar: URL input + presets
        ├── monitor panel: Timeline / Stats / Block / Info
        └── <iframe>  (sandboxed, no direct API access)
              └── your Add-In  +  geotab-bridge.js
                    └── postMessage ──► container security layer ──► real api.call()
```

### The two load paths

**CORS available (auto-bridge):**
1. Container fetches the Add-In's HTML with `fetch(url, { mode: 'cors' })`
2. Runs a static scan for risky patterns (`eval`, `document.cookie`, `localStorage`, `fetch`, hardcoded credentials)
3. Injects `geotab-bridge.js` and a `<base href="…">` tag (so relative assets still resolve)
4. Loads the modified HTML via `iframe.srcdoc`
5. Bridge activates automatically — the Add-In works without any changes

**No CORS (direct load):**
1. Container loads the URL directly via `iframe.src`
2. Shows setup instructions (nginx/Apache/Express CORS config)
3. Bridge activates only if the Add-In already includes `geotab-bridge.js`

### Security layer

Every postMessage from the iframe passes three checks before reaching the real API:

1. **Origin validation** — `event.source` must be exactly `frame.contentWindow` (not just a matching origin string)
2. **Rate limiting** — sliding window, 20 calls/second max
3. **Block lists** — per-TypeName and per-Method toggles, applied instantly with no reload

### Monitor panel tabs

| Tab | Shows |
|-----|-------|
| **Timeline** | Live scrolling log: `12:34:56 Get Device [23] 145ms` |
| **Stats** | Calls / blocked / errors per TypeName × Method |
| **Block** | Toggle switches for TypeNames (discovered dynamically) and Methods |
| **Info** | Capabilities table, bridge explanation, proxy guidance |

## Installation

1. Open MyGeotab → Administration → Add-Ins → click the **+** button
2. Paste the contents of `universal-container-config.json`
3. Save — "Universal Container" appears in the menu

## Making an Add-In compatible without CORS

If you can't add CORS headers to your server, add this one line to your Add-In's `<head>`:

```html
<script src="https://fhoffa.github.io/geotab-vibe-guide/examples/addins/geotab-bridge.js"></script>
```

This replaces the native `geotab.addin` registration with a bridge that routes all `api.call()` through postMessage to the container. The Add-In's code requires no other changes.

## postMessage protocol

`geotab-bridge.js` and the container communicate with this message schema:

| Direction | `type` | Other fields |
|-----------|--------|-------------|
| inner → outer | `geotab-ready` | _(bridge loaded, request init)_ |
| outer → inner | `geotab-init` | _(container ready, triggers `initialize()`)_ |
| inner → outer | `geotab-call` | `id`, `method`, `params` |
| outer → inner | `geotab-result` | `id`, `result` |
| outer → inner | `geotab-error` | `id`, `error` |

`id` is a UUID generated per call so concurrent calls resolve to the right callback.

## Capabilities and limitations

| Client-only CAN do | Client-only CANNOT do |
|--------------------|-----------------------|
| Intercept all Geotab API calls | Read cross-origin iframe DOM/scripts |
| Block by method or TypeName | Intercept `eval()` in cross-origin frames |
| Rate limit at 20 calls/s | Intercept `fetch()` to 3rd-party servers |
| Static code scan (if CORS) | Detect runtime-injected scripts |
| iframe sandbox restrictions | Detect obfuscated code |

A server-side proxy closes all the "cannot do" gaps: it sees raw HTTP traffic, can cache responses, enforce per-user quotas, log to a database, redact sensitive fields, and bridge non-Geotab APIs without exposing credentials to the browser.

## Preset URLs

The dropdown covers CORS-enabled sources where the bridge auto-injects and the static scan runs automatically. You can also paste any URL into the input field — presets are just shortcuts.

**This repo (GitHub Pages) — CORS ✅**

| Label | URL |
|-------|-----|
| Bridge Demo | `…/examples/addins/bridge-demo.html` |
| Simple Test | `…/examples/addins/simple-test.html` |
| Minimal Test | `…/examples/addins/minimal-test.html` |
| Vehicle Dashboard Map | `…/examples/addins/vehicle-dashboard-map.html` |

**Geotab SDK samples (jsDelivr CDN) — CORS ✅**

| Label | URL |
|-------|-----|
| Heat Map | `cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-heatmap/dist/heatmap.html` |
| Trips Timeline | `…/addin-trips-timeline/dist/tripsTimeline.html` |
| Import KML Zones | `…/addin-import-kml-zones/dist/importKmlZones.html` |
| Start-Stop | `…/addin-start-stop/dist/startStop.html` |
| IOX Output | `…/addin-iox-output/dist/ioxOutput.html` |

Any URL that returns CORS headers will auto-bridge. URLs without CORS load directly and need `geotab-bridge.js` included manually.
