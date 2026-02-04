---
name: geotab-api-quickstart
description: Connect to Geotab API and fetch fleet data. Use for any task involving vehicles, trips, drivers, or other Geotab data. This is the foundation skill for all Geotab integrations.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "1.0"
---

# Geotab API Quickstart

## When to Use This Skill

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

## Fetching Data

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

## Common Data Types

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
print(f"Distance (7 days): {total_distance / 1000:.1f} km")
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

- **AI-powered queries:** Use natural language with the [geotab-ace skill](../geotab-ace/SKILL.md)
- **Build a dashboard:** Use Streamlit with this data
- **Create an Add-In:** See the [geotab-addins skill](../geotab-addins/SKILL.md)
- **Analyze trips:** See [references/TRIP_ANALYSIS.md](references/TRIP_ANALYSIS.md)
- **Understand demo data:** See [Demo Database Reference](../../guides/DEMO_DATABASE_REFERENCE.md) for complete entity schemas and sample values

## Resources

- [Geotab SDK Documentation](https://geotab.github.io/sdk/)
- [MyGeotab Python Library](https://github.com/Geotab/mygeotab-python)
- [API Reference](https://geotab.github.io/sdk/software/api/reference/)
