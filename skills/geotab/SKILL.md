---
name: geotab
description: Complete guide for Geotab fleet management development. Use for any task involving the Geotab API, MyGeotab Add-Ins, Zenith styling, or Ace AI queries. This unified skill covers Python API, JavaScript Add-Ins, React components, and natural language fleet queries.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "2.0"
---

# Geotab Development Guide

This is the unified skill for all Geotab fleet management development. Navigate to the specific reference you need based on your task.

## Choosing a Data Channel

Geotab has three ways to get fleet data. Pick based on the task:

| Need | Channel | Reference | Speed |
|------|---------|-----------|-------|
| Pre-aggregated KPIs (distance, fuel, idle, safety) for dashboards/reports | **OData Data Connector** | [DATA_CONNECTOR.md](references/DATA_CONNECTOR.md) | ~5–11s |
| Raw entities (trips, devices, GPS, faults) or real-time data | **MyGeotab API** | [API_QUICKSTART.md](references/API_QUICKSTART.md) | ~0.5–2s |
| Natural language questions, ad-hoc exploration | **Geotab Ace** | [ACE_API.md](references/ACE_API.md) | ~30–45s |

**Key constraints:**
- **Data Connector** requires HTTP Basic Auth on a separate server — **not usable from Add-Ins** (they only get a session token). Use for server-side scripts, Python apps, and BI tools. Supports `$select` (column selection) and `$filter` (row filtering) for server-side query customization. **Respects user permissions** (group/vehicle scope).
- **API** is the only channel for real-time data (`DeviceStatusInfo`) and works everywhere including Add-Ins. Scales well for targeted queries (one vehicle's trips, one device's location), but **"fetch all trips for the whole fleet and aggregate in code" doesn't scale** to production fleets with thousands of vehicles. Use the Data Connector for fleet-wide KPIs at scale. **Respects user permissions** (group/vehicle scope).
- **Ace** is great for exploration but slow, may apply implicit filters, and results can vary between runs. **Respects user permissions** (group/vehicle scope).
- For trip-level or per-event detail, use the **API** — the Data Connector only has daily/hourly/monthly aggregates.

Full comparison with benchmarks: [DATA_ACCESS_COMPARISON.md](../../guides/DATA_ACCESS_COMPARISON.md)

## Quick Navigation

| Task | Reference | Description |
|------|-----------|-------------|
| **Connect to API** | [API_QUICKSTART.md](references/API_QUICKSTART.md) | Python authentication, fetching data, entity types |
| **Build Add-Ins** | [ADDINS.md](references/ADDINS.md) | Create custom MyGeotab pages (vanilla JS) |
| **Style with Zenith** | [ZENITH_STYLING.md](references/ZENITH_STYLING.md) | React components matching MyGeotab look |
| **AI Queries** | [ACE_API.md](references/ACE_API.md) | Natural language fleet queries via Geotab Ace |
| **Data Connector** | [DATA_CONNECTOR.md](references/DATA_CONNECTOR.md) | OData API for pre-aggregated KPIs, safety, faults |

## Reference Files

### Core Development

| Reference | When to Use |
|-----------|-------------|
| [API_QUICKSTART.md](references/API_QUICKSTART.md) | Starting with Geotab API, fetching devices/trips/drivers, Python development |
| [ADDINS.md](references/ADDINS.md) | Building custom pages in MyGeotab, JavaScript Add-Ins |
| [ZENITH_STYLING.md](references/ZENITH_STYLING.md) | Upgrading Add-Ins to professional React UI |
| [ACE_API.md](references/ACE_API.md) | Natural language queries, trend analysis, AI insights |

### Data Analysis

| Reference | When to Use |
|-----------|-------------|
| [DATA_CONNECTOR.md](references/DATA_CONNECTOR.md) | Pre-aggregated fleet KPIs via OData (daily/hourly/monthly distance, fuel, idle, safety) |
| [SPEED_DATA.md](references/SPEED_DATA.md) | Working with vehicle speed data, LogRecord queries |
| [TRIP_ANALYSIS.md](references/TRIP_ANALYSIS.md) | Analyzing trip data, fuel efficiency, distance calculations |

### Add-In Development

| Reference | When to Use |
|-----------|-------------|
| [EMBEDDED.md](references/EMBEDDED.md) | No-hosting Add-In deployment, inline JSON config |
| [EXAMPLES.md](references/EXAMPLES.md) | Complete working Add-In code examples |
| [INTEGRATIONS.md](references/INTEGRATIONS.md) | Navigation, email, maps, external APIs |
| [SECURE_BACKEND.md](references/SECURE_BACKEND.md) | Securing Cloud Functions called by Add-Ins |
| [STORAGE_API.md](references/STORAGE_API.md) | Persisting Add-In data with AddInData |
| [TROUBLESHOOTING.md](references/TROUBLESHOOTING.md) | Debugging common Add-In issues |

### Zenith Components

| Reference | When to Use |
|-----------|-------------|
| [ZENITH_COMPONENTS.md](references/ZENITH_COMPONENTS.md) | Detailed Zenith component API reference |
| [ZENITH_EXAMPLE.md](references/ZENITH_EXAMPLE.md) | Complete React + Zenith Add-In example |

## Common Patterns

### Authentication (Python)

```python
import mygeotab
from dotenv import load_dotenv
import os

load_dotenv()

api = mygeotab.API(
    username=os.getenv('GEOTAB_USERNAME'),
    password=os.getenv('GEOTAB_PASSWORD'),
    database=os.getenv('GEOTAB_DATABASE'),
    server=os.getenv('GEOTAB_SERVER', 'my.geotab.com')
)
api.authenticate()
```

### Fetching Data (Python)

```python
from datetime import datetime, timedelta

# Get all vehicles
devices = api.get('Device')

# Get trips from last 7 days
trips = api.get('Trip',
    fromDate=datetime.now() - timedelta(days=7),
    toDate=datetime.now()
)

# Get drivers
drivers = api.get('User', search={'isDriver': True})
```

### Add-In Structure (JavaScript)

```javascript
geotab.addin["your-addin-name"] = function() {
    var apiRef = null;

    return {
        initialize: function(api, state, callback) {
            apiRef = api;
            // Setup code
            callback();  // MUST call!
        },
        focus: function(api, state) {
            // Refresh data
        },
        blur: function(api, state) {
            // Cleanup
        }
    };
};
```

### API Call (JavaScript)

```javascript
api.call("Get", { typeName: "Device" }, function(devices) {
    console.log("Found " + devices.length + " vehicles");
}, function(error) {
    console.error("Error:", error);
});
```

## Critical Rules

1. **Never use `typeName: "Driver"`** - Use `User` with `search: { isDriver: true }`
2. **Always use date ranges for trips** - Never fetch all trips without time bounds
3. **Test credentials once before loops** - Failed auth locks account 15-30 min
4. **External CSS for Add-Ins** - Inline `<style>` tags may be stripped
5. **Call `callback()` in initialize** - Or Add-In will hang

## Entity Types Quick Reference

| Type | Description | Common Use |
|------|-------------|------------|
| `Device` | Vehicles/assets | Fleet inventory |
| `Trip` | Completed journeys | Route analysis |
| `User` | Users and drivers | Driver management |
| `DeviceStatusInfo` | Current location/status | Live tracking |
| `LogRecord` | GPS breadcrumbs | Historical routes |
| `StatusData` | Sensor readings | Engine diagnostics |
| `ExceptionEvent` | Rule violations | Safety monitoring |
| `FaultData` | Engine fault codes | Maintenance — [varies by demo database](../../guides/FAULT_MONITORING.md) |
| `Zone` | Geofences | Location monitoring |
| `Group` | Organizational hierarchy | Vehicle grouping |

See [API_QUICKSTART.md](references/API_QUICKSTART.md) for the complete list of 34 entity types.

## Getting Started

1. **Create demo account:** [my.geotab.com/registration.html](https://my.geotab.com/registration.html) (click "Create a Demo Database")
2. **Set up .env file:** Store credentials safely
3. **Install dependencies:** `pip install mygeotab python-dotenv`
4. **Read your first skill:** Start with [API_QUICKSTART.md](references/API_QUICKSTART.md)

## Resources

- [Geotab SDK Documentation](https://geotab.github.io/sdk/)
- [MyGeotab Python Library](https://github.com/Geotab/mygeotab-python)
- [API Reference](https://geotab.github.io/sdk/software/api/reference/)
- [Zenith Storybook](https://developers.geotab.com/zenith-storybook/)
- [Demo Database Reference](../../guides/DEMO_DATABASE_REFERENCE.md)
