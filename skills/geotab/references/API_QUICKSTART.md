# Geotab API Quickstart

## When to Use This Reference

- Connecting to the Geotab API for the first time
- Fetching vehicles, trips, drivers, or any fleet data
- Building Python scripts or dashboards with Geotab data
- Any task that needs to read from or write to Geotab

## Authentication

### Required Credentials

```
Database: your_database_name
Username: your_email@example.com
Password: your_password
Server: my.geotab.com (or regional server)
```

**Get credentials:** [Create a free demo account](https://my.geotab.com/registration.html) (click **"Create a Demo Database"**, not "I'm a New Customer")

### Python Setup

```bash
pip install mygeotab python-dotenv
```

### .env File (Keep Credentials Safe)

```bash
# .env file - NEVER commit this to git
GEOTAB_DATABASE=your_database
GEOTAB_USERNAME=your_email@example.com
GEOTAB_PASSWORD=your_password
GEOTAB_SERVER=my.geotab.com
```

### Connect and Authenticate

```python
import mygeotab
from dotenv import load_dotenv
import os

load_dotenv()

# Create API client
api = mygeotab.API(
    username=os.getenv('GEOTAB_USERNAME'),
    password=os.getenv('GEOTAB_PASSWORD'),
    database=os.getenv('GEOTAB_DATABASE'),
    server=os.getenv('GEOTAB_SERVER', 'my.geotab.com')
)

# Authenticate (gets session token)
api.authenticate()

print("Connected!")
```

### Server Redirection

MyGeotab uses server redirection - authentication may return a different server URL in the `path` field. The `mygeotab` Python library handles this automatically.

**If using raw HTTP requests:** Check the authentication response for a `path` value. If it's a real hostname (contains `.`), use that for subsequent calls. If it returns `"ThisServer"`, keep using the original server.

```python
# The mygeotab library handles this automatically:
api.authenticate()  # May internally redirect to a different server

# If using requests directly:
auth_result = response.json()["result"]
if "path" in auth_result:
    new_server = auth_result["path"]
    if new_server and "." in new_server and new_server.lower() != "thisserver":
        base_url = f"https://{new_server}/apiv1"
```

## Fetching Data

### Count Entities (Efficient)

```python
# GetCountOf returns just the count - no data transfer
device_count = api.call('GetCountOf', typeName='Device')
print(f"Fleet has {device_count} vehicles")

trip_count = api.call('GetCountOf', typeName='Trip')
zone_count = api.call('GetCountOf', typeName='Zone')
```

**Note:** `GetCountOf` includes inactive entities. Use `api.get()` with filters for active-only counts.

### Get All Vehicles

```python
devices = api.get('Device')
print(f"Found {len(devices)} vehicles")

for device in devices[:5]:
    print(f"  - {device['name']} (ID: {device['id']})")
```

### Get Trips (Last 7 Days)

```python
from datetime import datetime, timedelta

trips = api.get('Trip',
    fromDate=datetime.now() - timedelta(days=7),
    toDate=datetime.now()
)

print(f"Found {len(trips)} trips in last 7 days")
```

### Get Drivers

```python
# Get users who are drivers
users = api.get('User', search={'isDriver': True})
print(f"Found {len(users)} drivers")
```

### Get Current Vehicle Locations

```python
device_statuses = api.get('DeviceStatusInfo')

for status in device_statuses[:5]:
    lat = status.get('latitude', 'N/A')
    lng = status.get('longitude', 'N/A')
    print(f"Vehicle at: {lat}, {lng}")
```

**⚠️ DeviceStatusInfo Data Completeness Warning:** `DeviceStatusInfo` is reliable for GPS position, speed, and driving status, but often **lacks odometer and engine hours**. In many Geotab environments these fields are missing or return 0. Use `StatusData` with specific Diagnostic IDs instead:

```python
# UNRELIABLE for odometer:
# status.get('odometer', 0)  # Often 0 or missing!

# RELIABLE — use StatusData with DiagnosticOdometerId
odo_data = api.get('StatusData', search={
    'diagnosticSearch': {'id': 'DiagnosticOdometerId'},
    'deviceSearch': {'id': device_id}
}, resultsLimit=1)
if odo_data:
    meters = odo_data[0]['data']
    miles = meters / 1609.34  # Meters to miles
    km = meters / 1000        # Meters to km
```

## Supported Entity Types (34 Types)

The MyGeotab API supports these entity types via the `Get` method. Not all are writable.

### Core Assets
| Type | Description | Writable | Notes |
|------|-------------|----------|-------|
| `Device` | Vehicles/assets | Yes | Fleet inventory, telematics units |
| `User` | Users and drivers | Yes | Filter with `isDriver: True` for drivers |
| `Group` | Organizational hierarchy | Yes | Company structure, vehicle grouping |

### Geofencing
| Type | Description | Writable | Notes |
|------|-------------|----------|-------|
| `Zone` | Geofences/locations | Yes | Circular or polygon areas |
| `Route` | Planned routes | Yes | Sequence of zones |

### Rules & Alerts
| Type | Description | Writable | Notes |
|------|-------------|----------|-------|
| `Rule` | Exception rules | Yes | Triggers alerts on conditions |
| `Condition` | Rule conditions | Yes | Get not supported; access via Rule entity |
| `ExceptionEvent` | Rule violations | Read-only | Generated when rules trigger |
| `DistributionList` | Notification recipients | Yes | Email/SMS alert lists |

### Diagnostics & Faults
| Type | Description | Writable | Notes |
|------|-------------|----------|-------|
| `Diagnostic` | Sensor/data definitions | Read-only | Metadata about readings (65K+ types) |
| `Controller` | ECU definitions | Read-only | Vehicle computer units |
| `FaultData` | Engine fault codes | Read-only | DTC codes from vehicle — [availability varies by demo database](../../../guides/FAULT_MONITORING.md) |
| `FailureMode` | Fault failure modes | Read-only | J1939 failure modes |
| `FlashCode` | Flash codes | Read-only | Get not supported |

### Telematics Data (Read-Only)
| Type | Description | Notes |
|------|-------------|-------|
| `LogRecord` | GPS breadcrumbs | Location/speed history |
| `StatusData` | Sensor readings | Engine data, fuel level, etc. |
| `Trip` | Completed journeys | Ignition-on to ignition-off |
| `DeviceStatusInfo` | Current vehicle state | Real-time location/status |

### Compliance (HOS/ELD)
| Type | Description | Writable | Notes |
|------|-------------|----------|-------|
| `DVIRLog` | Driver vehicle inspection | Yes | Pre/post trip inspections |
| `DutyStatusLog` | HOS duty status | Limited | ELD records |
| `DutyStatusAvailability` | Available driving time | Read-only | Requires `userSearch` parameter |
| `DutyStatusViolation` | HOS violations | Read-only | Requires specific search params |
| `DriverChange` | Driver identification | Read-only | Driver login events |

### Fuel
| Type | Description | Writable | Notes |
|------|-------------|----------|-------|
| `FuelTransaction` | Fuel card transactions | Yes | External fuel data |
| `FuelUsed` | Fuel consumption | Read-only | Calculated usage |
| `FillUp` | Fill-up events | System-only | Add requires system permissions; auto-detected from fuel data |
| `FuelTaxDetail` | IFTA tax records | Read-only | Jurisdiction fuel use |

### Custom Data
| Type | Description | Writable | Notes |
|------|-------------|----------|-------|
| `CustomData` | Custom entity storage | Yes | Store custom key-value data |
| `AddInData` | Add-In storage | Yes | Per-Add-In data storage |

### System
| Type | Description | Writable | Notes |
|------|-------------|----------|-------|
| `Audit` | Audit log entries | Read-only | System activity log |
| `BinaryPayload` | Raw device data | Read-only | Get/GetCountOf not supported |
| `DebugData` | Debug information | Read-only | Device diagnostics |
| `DeviceShare` | Shared device access | Yes | Cross-database sharing |

> **Note:** Writable types support `Add` and `Set` methods. Read-only types are telemetry or system-generated data.
>
> **Tested:** 28/33 entity types work with `Get`, 30/33 work with `GetCountOf`. See notes for types requiring special handling.

### Quick Reference (Most Common)

| Type | Description | Example Use |
|------|-------------|-------------|
| `Device` | Vehicles/assets | Fleet inventory |
| `Trip` | Completed journeys | Route analysis |
| `User` | Users and drivers | Driver management |
| `DeviceStatusInfo` | Current location/status | Live tracking |
| `LogRecord` | GPS breadcrumbs | Historical routes |
| `ExceptionEvent` | Rule violations (no GPS — use LogRecord; rule/device/driver are reference objects with id only) | Safety monitoring |
| `FaultData` | Engine fault codes | Maintenance |
| `Zone` | Geofences | Location monitoring |

### Querying StatusData with Diagnostic IDs

StatusData contains detailed sensor readings, but you need the **correct Diagnostic ID** to get specific measurements. There are 65,000+ diagnostic types - knowing the right ID unlocks detailed vehicle telemetry.

**How to discover Diagnostic IDs:**
1. In MyGeotab, go to **Engine & Maintenance > Engine Measurements**
2. Select the measurement you want (e.g., "Cranking Voltage")
3. Check the URL - it shows the Diagnostic ID: `#engineMeasurements,diagnostics:!(DiagnosticCrankingVoltageId)`

**Example: Get Cranking Voltage for a Vehicle**
```python
from datetime import datetime, timedelta

# Get StatusData for a specific diagnostic
status_data = api.get('StatusData',
    search={
        'diagnosticSearch': {'id': 'DiagnosticCrankingVoltageId'},
        'deviceSearch': {'id': device_id},
        'fromDate': datetime.now() - timedelta(days=7),
        'toDate': datetime.now()
    }
)

for reading in status_data:
    print(f"Voltage: {reading['data']} at {reading['dateTime']}")
```

**Common Diagnostic IDs:**
| Measurement | Diagnostic ID | Raw Unit |
|-------------|---------------|----------|
| Cranking Voltage | `DiagnosticCrankingVoltageId` | Volts |
| Odometer | `DiagnosticOdometerId` | **Meters** (÷1609.34→miles) |
| Fuel Level | `DiagnosticFuelLevelId` | Percentage |
| Engine Hours | `DiagnosticEngineHoursId` | **Seconds** (÷3600→hours) |
| Battery Voltage | `DiagnosticBatteryTemperatureId` | Volts |

**⚠️ Unit Conversions (Critical!):** StatusData values use SI/metric base units. Without conversion, values look absurdly large:
- Odometer of `193,297,400` is **meters** → `193,297,400 / 1609.34 ≈ 120,109 miles`
- Engine hours of `12,891,600` is **seconds** → `12,891,600 / 3600 ≈ 3,581 hours`
- Trip `.distance` is **kilometers** → multiply by `0.621371` for miles

**⚠️ Odometer vs OdometerAdjustment:** Use `DiagnosticOdometerId` for actual current readings. `DiagnosticOdometerAdjustmentId` is for manual offset adjustments and typically returns 0. Similarly, use `DiagnosticEngineHoursId` (not `DiagnosticEngineHoursAdjustmentId`) for actual hours.

**Common Mistake:** Similar-sounding IDs may not work. For example, `DiagnosticEngineCrankingVoltageId` returns no data, but `DiagnosticCrankingVoltageId` works. Always verify in Engine Measurements first.

## Historical GPS Data (LogRecord)

> **TODO:** LogRecord query patterns below haven't been tested on a demo database yet. Verify that demo databases generate enough LogRecord data for meaningful results.

LogRecords are GPS breadcrumbs — latitude, longitude, speed, and timestamp for every recorded position. Use them for route reconstruction, heat maps, and geofence analysis.

### Query Pattern

```python
from datetime import datetime, timedelta

# GPS history for one vehicle (last 24h)
records = api.get('LogRecord',
    deviceSearch={'id': device_id},
    fromDate=datetime.now() - timedelta(hours=24),
    toDate=datetime.now()
)
# Each record: latitude, longitude, speed (km/h), dateTime, device.id
```

**Critical:** Always include `fromDate`/`toDate`. LogRecord without date filters attempts to fetch millions of records. For fleet-wide queries, keep the window narrow (hours, not days).

### LogRecord Fields

| Field | Type | Description |
|-------|------|-------------|
| `latitude` | float | GPS latitude |
| `longitude` | float | GPS longitude |
| `speed` | float | Speed in km/h |
| `dateTime` | string | ISO 8601 timestamp |
| `device` | object | `{ "id": "..." }` reference |

## Filtering and Searching

### Filter by Date Range

```python
from datetime import datetime, timedelta

# Trips from last 24 hours
trips = api.get('Trip',
    fromDate=datetime.now() - timedelta(hours=24),
    toDate=datetime.now()
)
```

### Filter by Device

```python
# Get a specific device first
devices = api.get('Device', search={'name': 'Truck-101'})
if devices:
    device_id = devices[0]['id']

    # Get trips for that device
    trips = api.get('Trip',
        deviceSearch={'id': device_id},
        fromDate=datetime.now() - timedelta(days=7)
    )
```

### Filter by Group

```python
# Get devices in a specific group
groups = api.get('Group', search={'name': 'North Region'})
if groups:
    group_id = groups[0]['id']
    devices = api.get('Device', search={'groups': [{'id': group_id}]})
```

## Advanced Get Parameters

The `Get` method supports additional parameters for efficient queries:

| Parameter | Description | Status |
|-----------|-------------|--------|
| `resultsLimit` | Maximum number of entities to return | Stable |
| `search` | Filter entities by property values | Stable |
| `sort` | Sort results by property | Beta |
| `propertySelector` | Limit which properties are returned | Beta |

### Limit Results

```python
# Get only the first 10 devices (useful for testing/previews)
devices = api.get('Device', resultsLimit=10)

# Get top 5 recent trips
trips = api.get('Trip',
    fromDate=datetime.now() - timedelta(days=7),
    resultsLimit=5
)
```

**Note:** The API has a maximum limit of 5000 results per call. For larger datasets, use pagination with date ranges.

### Search (Filter by Properties)

```python
# Search by name
devices = api.get('Device', search={'name': 'Truck-101'})

# Search drivers only
drivers = api.get('User', search={'isDriver': True})

# Search by multiple criteria
devices = api.get('Device', search={
    'name': '%Truck%',  # Wildcard matching
    'groups': [{'id': 'GroupCompanyId'}]
})
```

### Sort Results (Beta)

```python
# Sort trips by distance (descending = highest first)
# Note: Sort is in Beta - check SDK docs for supported properties
trips = api.call('Get',
    typeName='Trip',
    search={
        'fromDate': (datetime.now() - timedelta(days=1)).isoformat(),
        'toDate': datetime.now().isoformat()
    },
    sort={'sortBy': 'distance', 'sortDirection': 'desc'},
    resultsLimit=10
)
```

### Property Selector (Beta)

```python
# Only return specific properties (reduces data transfer)
# Note: propertySelector is in Beta
devices = api.call('Get',
    typeName='Device',
    propertySelector={
        'fields': ['id', 'name', 'serialNumber'],
        'isIncluded': True
    }
)

# Exclude large properties you don't need
trips = api.call('Get',
    typeName='Trip',
    search={
        'fromDate': (datetime.now() - timedelta(days=1)).isoformat(),
        'toDate': datetime.now().isoformat()
    },
    propertySelector={
        'fields': ['speedProfile', 'idleTimeProfile'],
        'isIncluded': False  # Exclude these large fields
    }
)
```

### Combined Example: Top 3 Vehicles by Distance

```python
from datetime import datetime, timedelta, timezone

# Get yesterday's date range (UTC)
today_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
yesterday_start = today_utc - timedelta(days=1)
yesterday_end = today_utc

# Get all trips from yesterday with minimal properties
trips = api.call('Get',
    typeName='Trip',
    search={
        'fromDate': yesterday_start.isoformat(),
        'toDate': yesterday_end.isoformat()
    },
    propertySelector={
        'fields': ['device', 'distance'],
        'isIncluded': True
    }
)

# Aggregate distance by device
from collections import defaultdict
distance_by_device = defaultdict(float)
for trip in trips:
    device_id = trip['device']['id']
    distance_by_device[device_id] += trip.get('distance', 0)

# Get top 3
top_3 = sorted(distance_by_device.items(), key=lambda x: x[1], reverse=True)[:3]

for device_id, km in top_3:
    miles = km * 0.621371  # trip.distance is already in KM
    print(f"Device {device_id}: {miles:.1f} miles")
```

## Error Handling

```python
from mygeotab.exceptions import AuthenticationException, MyGeotabException

try:
    api.authenticate()
    devices = api.get('Device')
except AuthenticationException:
    print("Login failed - check credentials")
except MyGeotabException as e:
    print(f"API error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## Pagination for Large Results

```python
# For very large datasets, fetch in batches
all_trips = []
from_date = datetime.now() - timedelta(days=30)
to_date = datetime.now()

# Fetch in weekly chunks
current = from_date
while current < to_date:
    chunk_end = min(current + timedelta(days=7), to_date)

    trips = api.get('Trip',
        fromDate=current,
        toDate=chunk_end
    )
    all_trips.extend(trips)

    current = chunk_end

print(f"Total trips: {len(all_trips)}")
```

## Writing Data

### Add a Zone (Geofence)

```python
zone = api.add('Zone', {
    'name': 'Customer Site A',
    'points': [
        {'x': -79.3832, 'y': 43.6532},  # longitude, latitude
        {'x': -79.3830, 'y': 43.6535},
        {'x': -79.3828, 'y': 43.6532},
    ],
    'displayed': True,
    'activeFrom': datetime.now().isoformat(),
    'activeTo': '2099-12-31T00:00:00Z'
})
print(f"Created zone: {zone}")
```

### Add a FuelTransaction

```python
from datetime import datetime

fuel_tx = api.add('FuelTransaction', {
    'dateTime': datetime.now().isoformat(),
    'volume': 50.5,            # liters
    'cost': 75.25,
    'currencyCode': 'USD',
    'device': {'id': device_id},  # replace with your device ID
    'location': {'x': -79.4, 'y': 43.6},  # longitude, latitude
    'sourceFlag': 'Manual'
})
print(f"Created fuel transaction: {fuel_tx}")
```

### Batch Operations (multi_call)

```python
# Multiple operations in one request — works for reads, writes, or mixed
results = api.multi_call([
    ('Add', dict(typeName='Zone', entity={'name': 'Site A', 'points': [...]})),
    ('Add', dict(typeName='Zone', entity={'name': 'Site B', 'points': [...]})),
    ('Add', dict(typeName='Zone', entity={'name': 'Site C', 'points': [...]})),
])
# results = [id_a, id_b, id_c]
```

### Update a Device Name

```python
# Get the device first
devices = api.get('Device', search={'name': 'Old Name'})
if devices:
    device = devices[0]
    device['name'] = 'New Name'
    api.set('Device', device)
    print("Device renamed")
```

## Complete Example: Fleet Summary

```python
import mygeotab
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os

load_dotenv()

# Connect
api = mygeotab.API(
    username=os.getenv('GEOTAB_USERNAME'),
    password=os.getenv('GEOTAB_PASSWORD'),
    database=os.getenv('GEOTAB_DATABASE'),
    server=os.getenv('GEOTAB_SERVER', 'my.geotab.com')
)
api.authenticate()

# Get fleet summary
devices = api.get('Device')
drivers = api.get('User', search={'isDriver': True})
trips = api.get('Trip',
    fromDate=datetime.now() - timedelta(days=7),
    toDate=datetime.now()
)

# Calculate stats
total_distance = sum(t.get('distance', 0) for t in trips)

print("=== Fleet Summary ===")
print(f"Vehicles: {len(devices)}")
print(f"Drivers: {len(drivers)}")
print(f"Trips (7 days): {len(trips)}")
print(f"Distance (7 days): {total_distance:.1f} km")  # trip.distance is already in KM
```

## Common Mistakes

### Wrong: Using 'Driver' type
```python
# WRONG - causes errors in demo databases
drivers = api.get('Driver')

# CORRECT - filter users by isDriver
drivers = api.get('User', search={'isDriver': True})
```

### Wrong: No error handling
```python
# WRONG - will crash on network issues
api.authenticate()
devices = api.get('Device')

# CORRECT - handle errors gracefully
try:
    api.authenticate()
    devices = api.get('Device')
except Exception as e:
    print(f"Error: {e}")
    devices = []
```

### Wrong: Fetching too much data
```python
# WRONG - fetches ALL trips ever (can be millions)
trips = api.get('Trip')

# CORRECT - always use date range
trips = api.get('Trip',
    fromDate=datetime.now() - timedelta(days=7),
    toDate=datetime.now()
)
```

### Wrong: Assuming ExceptionEvent has GPS coordinates
```python
# WRONG - ExceptionEvent has no latitude/longitude fields
for ex in exceptions:
    add_marker(ex['latitude'], ex['longitude'])  # KeyError!

# CORRECT - query LogRecord for GPS during the exception time range
for ex in exceptions:
    logs = api.get('LogRecord', search={
        'deviceSearch': {'id': ex['device']['id']},
        'fromDate': ex['activeFrom'],
        'toDate': ex['activeTo']
    })
    for log in logs:
        add_marker(log['latitude'], log['longitude'])
```

### Wrong: Using reference object fields directly
```python
# WRONG - rule/device/driver are reference objects with only an 'id'
for ex in exceptions:
    print(ex['rule']['name'])    # KeyError! Only 'id' exists
    print(ex['device']['name'])  # KeyError! Only 'id' exists

# CORRECT - fetch entities first, build lookup maps
rules = api.get('Rule')
rule_map = {r['id']: r['name'] for r in rules}

devices = api.get('Device')
device_map = {d['id']: d['name'] for d in devices}

for ex in exceptions:
    rule_name = rule_map.get(ex['rule']['id'], 'Unknown')
    device_name = device_map.get(ex['device']['id'], 'Unknown')
    print(f"{device_name}: {rule_name} for {ex['duration']}")
```

## Next Steps

- **AI-powered queries:** Use natural language with [ACE_API.md](ACE_API.md)
- **Build a dashboard:** Use Streamlit with this data
- **Create an Add-In:** See [ADDINS.md](ADDINS.md)
- **Analyze trips:** See [TRIP_ANALYSIS.md](TRIP_ANALYSIS.md)
- **Understand demo data:** See [Demo Database Reference](../../../guides/DEMO_DATABASE_REFERENCE.md)

## Resources

- [Geotab SDK Documentation](https://geotab.github.io/sdk/)
- [MyGeotab Python Library](https://github.com/Geotab/mygeotab-python)
- [API Reference](https://geotab.github.io/sdk/software/api/reference/)
