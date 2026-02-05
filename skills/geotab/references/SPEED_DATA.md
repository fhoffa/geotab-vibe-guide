# Working with Speed Data

Speed data in Geotab comes from multiple sources and requires specific patterns for reliable results.

## Confirmed Patterns

### ExceptionEvent.details May Be Undefined

When building speeding dashboards, developers often access `ex.details.maxSpeed` directly. This **will crash** if `details` is undefined.

**Always use defensive coding:**

```python
# Python
max_speed = exception.get('details', {}).get('maxSpeed', 0)
speed_limit = exception.get('details', {}).get('speedLimit', 0)
```

```javascript
// JavaScript
var maxSpeed = (ex.details && ex.details.maxSpeed) || 0;
var speedLimit = (ex.details && ex.details.speedLimit) || 0;
```

This pattern is confirmed from a real debugging session where `Cannot read properties of undefined (reading 'maxSpeed')` crashed an Add-In.

### Speed Diagnostic IDs

| Diagnostic ID | Description | Unit | USA Daytime Demo | Real Vehicles |
|--------------|-------------|------|------------------|---------------|
| `DiagnosticEngineRoadSpeedId` | Engine-reported road speed | km/h | Yes | Yes |
| `DiagnosticEngineSpeedId` | Engine RPM | RPM | Yes | Yes |
| `DiagnosticSpeedId` | GPS-based vehicle speed | km/h | No | Yes |
| `DiagnosticPostedRoadSpeedId` | Posted road speed limit | km/h | No | Yes (where map data exists) |

**Tested in USA Daytime demo database:**
- `DiagnosticEngineRoadSpeedId` returns ECM-reported speed (0, 3, 6, 23, 24 km/h observed)
- `DiagnosticSpeedId` and `DiagnosticPostedRoadSpeedId` return 0 results
- For demo database testing, use `DiagnosticEngineRoadSpeedId` as alternative speed source
- Other demo types (EV Fleet, Long Distance) may have different availability

**Common Mistake:** Using `DiagnosticPostedSpeedId` (doesn't exist) instead of `DiagnosticPostedRoadSpeedId`.

### Demo Database Limitations (Tested in USA Daytime Demo)

> **Note:** Availability may vary by demo database type (EV Fleet, Long Distance, etc.).

ExceptionEvents in tested demo databases have these characteristics:
- Speeding events exist for `RulePostedSpeedingId`
- Have `NoDiagnosticId` (not linked to a specific diagnostic)
- Have no `details` object (no `maxSpeed`/`speedLimit` pre-calculated)
- All show `UnknownDriverId`
- Synthetic-looking (identical durations)

This means speeding dashboards that rely on `ex.details.maxSpeed` will show 0 or crash in demo databases.

### Detecting Demo vs Real Database

Skills should detect the database type and adjust behavior accordingly:

```python
def is_demo_database(api):
    """
    Check if connected to a demo database by testing for GPS speed data.
    Demo databases lack DiagnosticSpeedId data.
    """
    from datetime import datetime, timedelta

    # Try to get any recent GPS speed data
    result = api.get('StatusData', search={
        'diagnosticSearch': {'id': 'DiagnosticSpeedId'},
        'fromDate': (datetime.utcnow() - timedelta(days=7)).isoformat(),
        'resultsLimit': 1
    })

    return len(result) == 0

def get_speed_diagnostic_id(api):
    """
    Return the appropriate speed diagnostic for this database.
    Demo: DiagnosticEngineRoadSpeedId (ECM speed)
    Real: DiagnosticSpeedId (GPS speed)
    """
    if is_demo_database(api):
        return 'DiagnosticEngineRoadSpeedId'
    return 'DiagnosticSpeedId'
```

```javascript
// JavaScript (Add-In) version
function detectDemoDatabase(api, callback) {
    var sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    api.call("Get", {
        typeName: "StatusData",
        search: {
            diagnosticSearch: { id: "DiagnosticSpeedId" },
            fromDate: sevenDaysAgo.toISOString(),
            resultsLimit: 1
        }
    }, function(result) {
        callback(result.length === 0);  // true = demo database
    }, function(error) {
        callback(true);  // Assume demo on error
    });
}

function getSpeedDiagnosticId(isDemo) {
    return isDemo ? "DiagnosticEngineRoadSpeedId" : "DiagnosticSpeedId";
}
```

---

# Unverified Experiments

> **Note:** The patterns below are unverified experiments that future versions of this guide should confirm with real vehicle data.

## Fetching Speed Data for an Exception Event

When building speeding dashboards, you may need to correlate speed data with ExceptionEvents.

### The Problem

ExceptionEvents for speeding rules may have a `details` object with `maxSpeed` and `speedLimit`, but:
- It's not always populated (confirmed in demo databases)
- Some rule types don't include it
- Databases with limited map data may lack speed limits

### Proposed Solution: Query StatusData with Time Buffer

**Note:** This approach is theoretically sound but has not been tested with real vehicle data.

```python
from datetime import datetime, timedelta

def get_speed_data_for_exception(api, exception):
    """
    Fetch actual speed and posted limit for a speeding exception.

    Args:
        api: Authenticated Geotab API client
        exception: ExceptionEvent object with activeFrom, activeTo, device

    Returns:
        dict with max_speed and speed_limit (km/h)
    """
    # Add 30-second buffer - StatusData may not exist at exact timestamps
    start_time = datetime.fromisoformat(exception['activeFrom'].replace('Z', '+00:00'))
    end_time_str = exception.get('activeTo') or exception['activeFrom']
    end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))

    start_time -= timedelta(seconds=30)
    end_time += timedelta(seconds=30)

    device_id = exception['device']['id']

    # Fetch both speed readings in one call
    results = api.multi_call([
        ('Get', {
            'typeName': 'StatusData',
            'search': {
                'deviceSearch': {'id': device_id},
                'diagnosticSearch': {'id': 'DiagnosticSpeedId'},
                'fromDate': start_time.isoformat(),
                'toDate': end_time.isoformat()
            }
        }),
        ('Get', {
            'typeName': 'StatusData',
            'search': {
                'deviceSearch': {'id': device_id},
                'diagnosticSearch': {'id': 'DiagnosticPostedRoadSpeedId'},
                'fromDate': start_time.isoformat(),
                'toDate': end_time.isoformat()
            }
        })
    ])

    speeds = results[0] if results[0] else []
    limits = results[1] if results[1] else []

    # Find maximum speed in window
    max_speed = max((s['data'] for s in speeds), default=0)

    # Get posted limit (first reading, they're usually constant for short windows)
    speed_limit = limits[0]['data'] if limits else 0

    return {
        'max_speed': round(max_speed),
        'speed_limit': round(speed_limit) if speed_limit > 0 else None,
        'readings_count': len(speeds)
    }
```

### JavaScript (Add-In) Version

```javascript
function fetchSpeedData(api, ex, callback) {
    // Add 30-second buffer
    var startTime = new Date(ex.activeFrom);
    var endTime = new Date(ex.activeTo || ex.activeFrom);
    startTime.setSeconds(startTime.getSeconds() - 30);
    endTime.setSeconds(endTime.getSeconds() + 30);

    api.multiCall([
        ["Get", {
            typeName: "StatusData",
            search: {
                deviceSearch: { id: ex.device.id },
                diagnosticSearch: { id: "DiagnosticSpeedId" },
                fromDate: startTime.toISOString(),
                toDate: endTime.toISOString()
            }
        }],
        ["Get", {
            typeName: "StatusData",
            search: {
                deviceSearch: { id: ex.device.id },
                diagnosticSearch: { id: "DiagnosticPostedRoadSpeedId" },
                fromDate: startTime.toISOString(),
                toDate: endTime.toISOString()
            }
        }]
    ], function(results) {
        var speeds = results[0] || [];
        var limits = results[1] || [];

        var maxSpeed = 0;
        speeds.forEach(function(s) {
            if (s.data > maxSpeed) maxSpeed = s.data;
        });

        var limit = (limits.length > 0) ? limits[0].data : 0;

        callback({
            maxSpeed: Math.round(maxSpeed),
            speedLimit: limit > 0 ? Math.round(limit) : null,
            readingsCount: speeds.length
        });
    }, function(error) {
        console.error("Speed data error:", error);
        callback({ error: error });
    });
}
```

## Why Posted Speed Limit Shows 0 or N/A

`DiagnosticPostedRoadSpeedId` returns 0 when:
- Road segment lacks posted speed data in Geotab's map database
- Vehicle is on private property, rural roads, or unmapped areas
- Map data coverage varies by region
- **Demo databases don't have this diagnostic at all**

**Suggested practice:** Display "N/A" instead of 0, or fall back to the rule's configured threshold.

## Complete Example: Speeding Report (Unverified)

```python
from datetime import datetime, timedelta

def generate_speeding_report(api, days=7):
    """Generate a report of speeding events with actual vs limit speeds."""

    from_date = datetime.utcnow() - timedelta(days=days)

    # Get speeding exceptions
    exceptions = api.get('ExceptionEvent',
        search={
            'ruleSearch': {'id': 'RulePostedSpeedingId'},
            'fromDate': from_date.isoformat()
        }
    )

    # Get device names
    devices = api.get('Device')
    device_map = {d['id']: d['name'] for d in devices}

    report = []
    for ex in exceptions:
        # Try details first, fall back to StatusData
        if ex.get('details') and ex['details'].get('maxSpeed'):
            max_speed = ex['details']['maxSpeed']
            speed_limit = ex['details'].get('speedLimit', 0)
        else:
            data = get_speed_data_for_exception(api, ex)
            max_speed = data['max_speed']
            speed_limit = data['speed_limit'] or 0

        report.append({
            'vehicle': device_map.get(ex['device']['id'], 'Unknown'),
            'date': ex['activeFrom'],
            'max_speed_kmh': round(max_speed),
            'speed_limit_kmh': round(speed_limit) if speed_limit else 'N/A',
            'over_by_kmh': round(max_speed - speed_limit) if speed_limit else 'N/A'
        })

    return sorted(report, key=lambda x: x['date'], reverse=True)
```

## Related Resources

- [Demo Database Reference](../../../guides/DEMO_DATABASE_REFERENCE.md) - StatusData schema and diagnostics
- [Geotab SDK Diagnostics](https://geotab.github.io/sdk/software/api/reference/#Diagnostic) - Official diagnostic reference
