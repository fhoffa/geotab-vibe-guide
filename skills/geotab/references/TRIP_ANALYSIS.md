# Trip Analysis Patterns

Common patterns for analyzing Geotab trip data.

## Trip Data Structure

Each trip contains:

| Field | Description |
|-------|-------------|
| `id` | Unique trip identifier |
| `device` | Vehicle reference |
| `driver` | Driver reference (if assigned) |
| `start` | Start timestamp |
| `stop` | End timestamp |
| `distance` | Distance in meters |
| `drivingDuration` | Time spent moving |
| `idlingDuration` | Time spent idling |
| `maximumSpeed` | Top speed during trip |
| `averageSpeed` | Average speed |

## Calculate Total Distance

```python
from datetime import datetime, timedelta

trips = api.get('Trip',
    fromDate=datetime.now() - timedelta(days=7),
    toDate=datetime.now()
)

total_km = sum(t.get('distance', 0) for t in trips) / 1000
print(f"Total distance: {total_km:.1f} km")
```

## Group by Vehicle

```python
from collections import defaultdict

trips_by_vehicle = defaultdict(list)

for trip in trips:
    device_id = trip['device']['id']
    trips_by_vehicle[device_id].append(trip)

# Show trips per vehicle
for device_id, vehicle_trips in trips_by_vehicle.items():
    total_dist = sum(t.get('distance', 0) for t in vehicle_trips) / 1000
    print(f"Vehicle {device_id}: {len(vehicle_trips)} trips, {total_dist:.1f} km")
```

## Calculate Idle Time

```python
total_idle_seconds = sum(
    t.get('idlingDuration', {}).get('totalSeconds', 0)
    for t in trips
)

idle_hours = total_idle_seconds / 3600
print(f"Total idle time: {idle_hours:.1f} hours")
```

## Find Long Trips

```python
# Trips over 100 km
long_trips = [t for t in trips if t.get('distance', 0) > 100000]

print(f"Found {len(long_trips)} trips over 100 km")
for trip in long_trips[:5]:
    dist_km = trip.get('distance', 0) / 1000
    print(f"  - {dist_km:.1f} km on {trip['start']}")
```

## Daily Trip Summary

```python
from collections import defaultdict

trips_by_day = defaultdict(lambda: {'count': 0, 'distance': 0})

for trip in trips:
    day = trip['start'][:10]  # YYYY-MM-DD
    trips_by_day[day]['count'] += 1
    trips_by_day[day]['distance'] += trip.get('distance', 0)

for day, stats in sorted(trips_by_day.items()):
    dist_km = stats['distance'] / 1000
    print(f"{day}: {stats['count']} trips, {dist_km:.1f} km")
```

## Export to CSV

```python
import csv

with open('trips.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Start', 'End', 'Distance (km)', 'Max Speed (km/h)'])

    for trip in trips:
        writer.writerow([
            trip['start'],
            trip['stop'],
            round(trip.get('distance', 0) / 1000, 1),
            round(trip.get('maximumSpeed', 0), 1)
        ])

print("Exported to trips.csv")
```
