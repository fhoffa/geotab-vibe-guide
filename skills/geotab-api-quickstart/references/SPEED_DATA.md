# Working with Speed Data

Speed data in Geotab comes from multiple sources and requires specific patterns for reliable results.

## Speed Diagnostic IDs

| Diagnostic ID | Description | Unit | Notes |
|--------------|-------------|------|-------|
| `DiagnosticSpeedId` | GPS-based vehicle speed | km/h | Primary speed source |
| `DiagnosticPostedRoadSpeedId` | Posted road speed limit | km/h | Requires map data coverage |
| `DiagnosticEngineRoadSpeedId` | Engine-reported road speed | km/h | From vehicle CAN bus |
| `DiagnosticEngineSpeedId` | Engine RPM | RPM | Not vehicle speed! |

**Common Mistake:** Using `DiagnosticPostedSpeedId` (doesn't exist) instead of `DiagnosticPostedRoadSpeedId`.

## Fetching Speed Data for an Exception Event

When building speeding dashboards, you need to correlate speed data with ExceptionEvents.

### The Problem

ExceptionEvents for speeding rules may have a `details` object with `maxSpeed` and `speedLimit`, but:
- It's not always populated (especially for recent events)
- Some rule types don't include it
- Databases with limited map data may lack speed limits

### Solution: Query StatusData with Time Buffer

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

## ExceptionEvent.details Object

For speeding rules (e.g., `RulePostedSpeedingId`), the `details` object may contain pre-calculated values:

| Field | Type | Description |
|-------|------|-------------|
| `maxSpeed` | float | Maximum speed during violation (km/h) |
| `speedLimit` | float | Posted speed limit at location (km/h) |

**Always use defensive coding:**

```python
# Python
max_speed = exception.get('details', {}).get('maxSpeed', 0)
speed_limit = exception.get('details', {}).get('speedLimit', 0)

# Fall back to StatusData if details missing
if not max_speed:
    data = get_speed_data_for_exception(api, exception)
    max_speed = data['max_speed']
    speed_limit = data['speed_limit']
```

```javascript
// JavaScript
var maxSpeed = (ex.details && ex.details.maxSpeed) || 0;
var speedLimit = (ex.details && ex.details.speedLimit) || 0;

if (!maxSpeed) {
    fetchSpeedData(api, ex, function(data) {
        maxSpeed = data.maxSpeed;
        speedLimit = data.speedLimit;
    });
}
```

## Why Posted Speed Limit Shows 0 or N/A

`DiagnosticPostedRoadSpeedId` returns 0 when:
- Road segment lacks posted speed data in Geotab's map database
- Vehicle is on private property, rural roads, or unmapped areas
- Map data coverage varies by region

**Best practice:** Display "N/A" instead of 0, or fall back to the rule's configured threshold.

## Data Availability

| Diagnostic | Demo Database | Real Vehicles |
|------------|---------------|---------------|
| `DiagnosticSpeedId` | Limited | Yes |
| `DiagnosticPostedRoadSpeedId` | Limited | Yes (where map data exists) |
| `DiagnosticEngineRoadSpeedId` | Yes | Yes |

Speed diagnostics require real Geotab devices. Demo databases have simulated data that may not include all diagnostic types.

## Complete Example: Speeding Report

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

- [DEMO_DATABASE_REFERENCE.md](/guides/DEMO_DATABASE_REFERENCE.md) - StatusData schema and diagnostics
- [Geotab SDK Diagnostics](https://geotab.github.io/sdk/software/api/reference/#Diagnostic) - Official diagnostic reference
