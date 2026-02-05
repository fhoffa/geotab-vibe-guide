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
| `FaultData` | Engine fault codes | Read-only | DTC codes from vehicle |
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
| `FillUp` | Fill-up events | Read-only | Detected fill events |
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
| `ExceptionEvent` | Rule violations | Safety monitoring |
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
| Measurement | Diagnostic ID |
|-------------|---------------|
| Cranking Voltage | `DiagnosticCrankingVoltageId` |
| Odometer | `DiagnosticOdometerAdjustmentId` |
| Fuel Level | `DiagnosticFuelLevelId` |
| Engine Hours | `DiagnosticEngineHoursAdjustmentId` |
| Battery Voltage | `DiagnosticBatteryTemperatureId` |

**Common Mistake:** Similar-sounding IDs may not work. For example, `DiagnosticEngineCrankingVoltageId` returns no data, but `DiagnosticCrankingVoltageId` works. Always verify in Engine Measurements first.

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
