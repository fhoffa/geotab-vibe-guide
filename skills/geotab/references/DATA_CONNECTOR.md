# Geotab Data Connector (OData API)

## When to Use This Reference

- Querying pre-aggregated fleet KPIs (distance, fuel, idle time, safety scores)
- Building dashboards or reports from fleet data without raw API calls
- Server-side scripts and standalone apps needing aggregated data
- Connecting Python, Power BI, Excel, or Tableau to fleet analytics
- Any task involving the Data Connector endpoint at `odata-connector-{N}.geotab.com`

**Not for Add-Ins:** The Data Connector requires HTTP Basic Auth (username + password) on a separate server. MyGeotab Add-Ins only receive a session token — they cannot query the Data Connector directly. Use the standard MyGeotab API or Ace for in-Add-In analytics.

## Prerequisites

The Data Connector add-in must be enabled on the database. On demo databases, install manually since the Marketplace is not available:

1. MyGeotab → **Administration > System Settings > Add-Ins**
2. Add: `{"url": "https://app.geotab.com/addins/geotab/dataConnector/manifest.json"}`
3. Save and refresh

Without this: 412 (`"Database cannot be subscribed"`) or 403.

**Can't see the Add-In?** The Data Connector page is under MyGeotab Administration. The user account needs these security clearances: **Launch Custom Reports or Add-Ins** and **View "Geotab Data Connector" Add-In**. An admin can grant these under Administration > Users.

**New databases:** KPI/safety tables are empty for ~2–3 hours after activation while the pipeline backfills. `LatestVehicleMetadata` populates immediately.

## Data Availability by Rate Plan

Not all tables and columns are available on every plan:

| Table/Feature | Base | Regulatory | Pro | ProPlus | GO Plan |
|---|---|---|---|---|---|
| Vehicle KPI — utilization columns (driving, idling, trips) | Yes | Yes | Yes | Yes | Yes |
| Vehicle KPI — engine-status columns (fuel, odometer) | No | No | Yes | Yes | Yes |
| Vehicle KPI — fault-related columns | No | No | Yes | Yes | Yes |
| Latest Vehicle Metadata — engine-status columns | No | No | Yes | Yes | Yes |
| Latest Vehicle Metadata — fault-related columns | No | No | Yes | Yes | Yes |
| Vehicle Groups | Yes | Yes | Yes | Yes | Yes |
| Safety Predictive Analytics and Benchmarks | Yes* | Yes* | Yes | Yes | Yes |
| Maintenance Insights (FaultMonitoring) | No | No | Yes | Yes | Yes |

\* Detected collisions unavailable on Base and Regulatory plans.

Free demo databases include ProPlus features.

## Data Assumptions

These are critical for writing correct code:

- **Timezone for Vehicle KPI:** Data aggregated by local time per device timezone set in MyGeotab. Default: `America/New_York` if no timezone set.
- **Timezone for Driver KPI:** Aggregated by local time per user timezone set in MyGeotab. Default: `America/New_York`.
- **Timezone for Safety tables:** Aggregated by UTC date.
- **VIN decoding:** Best-effort from engine. Falls back to user-inputted VIN. Vehicle characteristics (Year, Manufacturer, Model) depend on VIN validity.
- **Utilization metrics** (distance, engine hours, drive time, idle time, trip counts) are computed from MyGeotab trip history, aggregated on **trip start time**.
- **Fuel and energy metrics** are computed on a **trip-end-time basis**. If a vehicle has a trip from 2:15 PM to 5:07 PM, fuel for the entire trip appears in the 5:00 PM hour (not spread across hours).
- **IdleFuel_Litres** is available starting July 2025.
- **Fuel and EV energy data** available from July 2023 onward.
- **Units:** Metric (km, litres, kWh, seconds) unless otherwise noted.
- **Historical data:** KPI tables from 2023-01-01 onward. Safety and Maintenance Insights from 2023-01-01 onward.
- **Permission changes** in MyGeotab take up to 10 minutes to reflect. Group membership changes take up to 1 hour.
- **DateTo of 2050-01-01** in LatestVehicleMetadata means "currently active."
- **Multiple rows per device** in LatestVehicleMetadata: If a device was associated with more than one vehicle, filter by `DateTo = 2050-01-01` to get the current assignment.

## Vocation Definitions

The `VocationName` column in LatestVehicleMetadata uses Geotab's patented ML algorithm to classify driving behavior:

| Vocation | Description |
|---|---|
| Long Haul | Very large range of activity, does not rest in same location. Not hub-and-spoke or door-to-door. |
| Regional | Wide range (over 150 air miles) but tends to rest in the same location. Not hub-and-spoke or door-to-door. |
| Local | Range below 150 air miles (qualifies for short-haul HOS exemption). Not hub-and-spoke or door-to-door. |
| Door to Door | Significantly more stops per work day than most, with very little time per stop. |
| Hub and Spoke | Multiple round trips per day from a centralized hub. Averages over one round trip per working day. |

## Connection Pattern

```python
import requests
from dotenv import load_dotenv
import os

load_dotenv()

database = os.getenv('GEOTAB_DATABASE')
username = os.getenv('GEOTAB_USERNAME')
password = os.getenv('GEOTAB_PASSWORD')

# Basic Auth: "database/username" as the username field
auth = (f"{database}/{username}", password)

# Server numbers by jurisdiction: 1=EU, 2=US, 3=CA, 4=AU, 5=BR, 6=AS, 7=USGov
for server in range(1, 8):
    url = f"https://odata-connector-{server}.geotab.com/odata/v4/svc/LatestVehicleMetadata"
    r = requests.get(url, auth=auth)
    if r.status_code == 200:
        base = f"https://odata-connector-{server}.geotab.com/odata/v4/svc"
        print(f"Connected on server {server}")
        break
```

**Server detection:** The wrong server returns **406 Jurisdiction Mismatch**. Iterate through servers 1–7 or use `data-connector.geotab.com` with redirect handling.

**Base DNS:** `https://data-connector.geotab.com/odata/v4/svc/` redirects to the correct jurisdictional server. Useful for Power BI/Excel, but programmatic clients must follow the redirect. For direct access, use the server-specific URL.

## .env File

```bash
GEOTAB_DATABASE=your_database
GEOTAB_USERNAME=your_email@example.com
GEOTAB_PASSWORD=your_password
```

## Query Options

The Data Connector supports three OData query options: `$search` for date ranges, `$select` for column selection, and `$filter` for row filtering. They can be combined in a single URL.

### Permissions

The Data Connector respects user group access. Non-admin users only see data for the devices and drivers they have permission to access in MyGeotab. Filter values for `GroupId`, `DeviceId`, and `DriverId` must be within the user's access scope; otherwise, those filters are ignored.

## Date Range Filters

Time-series tables require a `$search` parameter for date ranges.

### Relative Dates (Recommended for Dashboards)

Syntax: `<position>_<number>_<datePart>` — when number is 1, it can be omitted.

- **`last_`** = last N *complete* periods (excludes current). `last_3_month` = 3 full months before current.
- **`this_`** (or `these_`) = most recent N periods *including* current partial. `this_3_month` = current + 2 prior months.

Supported date parts: `day`, `week`, `month`, `year`

```python
# Rolling windows
url = f"{base}/VehicleKpi_Daily?$search=last_14_day"
url = f"{base}/VehicleKpi_Monthly?$search=last_3_month"    # 3 complete months
url = f"{base}/VehicleKpi_Monthly?$search=this_1_year"      # year-to-date
url = f"{base}/VehicleKpi_Daily?$search=this_month"          # month-to-date (1 can be omitted)
url = f"{base}/VehicleKpi_Hourly?$search=last_14_day"        # hourly granularity
```

### Absolute Dates (Ad-Hoc Analysis)

```python
url = f"{base}/VehicleKpi_Daily?$search=from_2026-01-01_to_2026-01-31"
url = f"{base}/VehicleKpi_Daily?$search=from_2026-01-01"
```

**Too-wide ranges return 416.** Use single months for daily data, a year for monthly data.

## Pagination

Large result sets are paginated. Follow `@odata.nextLink`:

```python
def fetch_all(url, auth):
    """Fetch all pages from an OData endpoint."""
    all_records = []
    while url:
        r = requests.get(url, auth=auth)
        r.raise_for_status()
        data = r.json()
        all_records.extend(data.get("value", []))
        url = data.get("@odata.nextLink")
    return all_records

records = fetch_all(f"{base}/VehicleKpi_Daily?$search=last_30_day", auth)
```

## Column Selection ($select)

Use `$select` to retrieve only specific columns, reducing data transfer:

```python
# Fetch only specific columns from DeviceGroups
url = f"{base}/DeviceGroups?$select=CompanyGuid,GroupId,GroupName,ImmediateGroup,SerialNo,DeviceId"
r = requests.get(url, auth=auth)
```

For Power BI and Excel, use the simplified URL: `https://data-connector.geotab.com/odata/v4/svc/[table]?$select=[Column1],[Column2],...`

## Row Filtering ($filter)

Use `$filter` to filter rows server-side on any column. This works like a SQL `WHERE` clause.

**Note:** Date range filtering still uses `$search`, not `$filter`. Use `$filter` for column-level conditions.

### Comparison Operators

| Operator | Meaning | Example |
|---|---|---|
| `eq` | Equals | `DeviceId eq 'b14FA'` |
| `ne` | Not equals | `DeviceId ne 'b14FA1'` |
| `gt` | Greater than | `LastGps_Speed gt 3` |
| `ge` | Greater than or equals | `Local_Date ge '2025-01-01'` |
| `lt` | Less than | `LastGps_Speed lt 100` |
| `le` | Less than or equals | `Local_Date le '2025-12-31'` |
| `in` | In a list | `DeviceId in ('b14F9','b14FA')` |

### Logic Operators

Combine expressions with `and`, `or`, and `not`:

```python
# Multiple conditions
url = f"{base}/DeviceGroups?$filter=DeviceId in ('b14FA') and ImmediateGroup eq true and DeviceId ne 'b14FA1'"

# Parenthesized OR
url = f"{base}/LatestVehicleMetadata?$filter=LastGps_Speed gt 3 and (Year ne null or Model ne null) and Engine ne null"

# NOT operator — must wrap expression in parentheses
url = f"{base}/DeviceGroups?$filter=not (DeviceId eq 'b14FA')"
```

### Data Types in Filter Values

| Type | Format | Examples |
|---|---|---|
| String | Single-quoted | `'b14FA'`, `'O''Reilly'` (escape `'` with `''`) |
| Date | `YYYY-MM-DD` | `Local_Date ge '2025-01-01'` |
| Datetime | `YYYY-MM-DDTHH:MM:SSZ` | Prefer `date(column)` for comparisons |
| Integer | Bare number | `Trip_Count gt 5` |
| Double | Decimal number | Prefer `round(column)` for comparisons |
| Boolean | Case-insensitive | `ImmediateGroup eq true` |
| Null | Case-sensitive | `Year ne null` (only with `eq`/`ne`) |

### Functions in Filters

- **String functions:** For string comparisons
- **Arithmetic:** `round()`, `ceiling()`, `floor()` — work with double columns
- **Date/Time:** `second()`, `minute()`, `hour()`, `day()`, `month()`, `year()` return integers; `date()` returns a date; `time()` returns `HH:MM:SS`

### Combining $select, $filter, and $search

```python
# Select specific columns, filter by DeviceId, with date range
url = f"{base}/DeviceGroups?$search=from_2025-01-01&$select=CompanyGuid,GroupId,GroupName,ImmediateGroup,SerialNo,DeviceId&$filter=DeviceId in ('b14F9','b14FA')"
```

### Filter Restrictions

- One `$filter` parameter per query
- Column names are case-sensitive; operators are lowercase
- Filtering on `CompanyGuid` is not allowed
- `GroupId`, `DeviceId`, and `DriverId` filter values must be within the user's access scope (out-of-scope values are silently ignored)
- Escape single quotes inside values: `'O''Reilly'`
- Use `not (column in ('xxx'))` instead of `column not in ('xxx')`
- Special characters must be URL-encoded (e.g., `&` → `%26`)
- Maximum 100 columns, parameters, or array values per query
- Column filters cannot override the default `$search` date range

## Table Overview

### Time-Series Tables (Date Filter Required)

| Table | Refresh | Content |
|---|---|---|
| `VehicleKpi_Daily` | Hourly | Daily vehicle metrics (distance, fuel, idle, trips, after-hours, faults) |
| `VehicleKpi_Hourly` | Hourly | Same metrics at hourly granularity |
| `VehicleKpi_Monthly` | Hourly | Same metrics, monthly rollup |
| `DriverKPI_Daily` | Hourly | Daily driver metrics (distance, fuel, idle, trips, after-hours) |
| `DriverKPI_Monthly` | Hourly | Monthly driver metrics |
| `FleetSafety_Daily` | Daily ~11:30 PM UTC | Fleet-level safety rankings and collision predictions (lag up to 2 days) |
| `VehicleSafety_Daily` | Daily ~11:30 PM UTC | Per-vehicle safety rankings and collision predictions |
| `DriverSafety_Daily` | Daily ~11:30 PM UTC | Per-driver safety rankings and collision predictions |
| `FaultMonitoring_Daily` | Hourly | Daily log of fault cycles per vehicle |

### Snapshot Tables (No Date Filter)

| Table | Refresh | Content |
|---|---|---|
| `LatestVehicleMetadata` | Hourly | VIN, make, model, vocation, last GPS, odometer, health, faults |
| `FaultMonitoring` | Hourly | Fault lifecycle — cycles, persistence, Pending/Active/Confirmed states |
| `DeviceGroups` | Daily | Device-to-group mappings |
| `DriverGroups` | Daily | Driver-to-group mappings |
| `LatestDriverMetadata` | Hourly | Driver names, timezones, account status |

## Detailed Schemas

### VehicleKPI_Daily

| Column | Type | Description |
|---|---|---|
| `DeviceId` | STRING | Telematics device ID from MyGeotab |
| `Local_Date` | DATE | Local date for displayed data (timezone set in MyGeotab) |
| `TimeZoneId` | STRING | Timezone used for local date boundaries |
| `SerialNo` | STRING | Serial number of the telematics device last connected for this date |
| `Vin` | STRING | Vehicle Identification Number last connected to device for this date |
| `MinOdometer_Km` | FLOAT | Lowest odometer (km) measured for the VIN within the local date |
| `MaxOdometer_Km` | FLOAT | Highest odometer (km) measured for the VIN within the local date |
| `DriveDuration_Seconds` | FLOAT | Total active driving time (seconds), excluding idle |
| `IdleDuration_Seconds` | FLOAT | Total idle time (seconds) |
| `TotalEngine_Hours` | FLOAT | Total engine-on time (hours). Derived from DriveDuration + IdleDuration |
| `Distance_Km` | FLOAT | Total distance (km) by GPS or odometer |
| `Trip_Count` | INTEGER | Number of trips that began within the local date |
| `LatestLongitude` | FLOAT | Last valid GPS longitude within the local date |
| `LatestLatitude` | FLOAT | Last valid GPS latitude within the local date |
| `StopDuration_Seconds` | FLOAT | Duration stopped at end of trip, including end-of-trip idling |
| `WorkDistance_Km` | FLOAT | Distance driven during work hours |
| `WorkDrivingDuration_Seconds` | FLOAT | Driving duration during work hours |
| `WorkStopDuration_Seconds` | FLOAT | Stop duration during work hours |
| `AfterHours_Count` | INTEGER | Number of trips that started after work hours |
| `AfterHoursDistance_Km` | FLOAT | Distance driven after work hours |
| `AfterHoursDrivingDuration_Seconds` | FLOAT | Driving duration after work hours |
| `AfterHoursStopDuration_Seconds` | FLOAT | Stop duration after work hours |
| `TotalFuel_Litres` | FLOAT | Total fuel used (litres). Attributed to trips ending within this date — may exceed the date boundary. |
| `IdleFuel_Litres` | FLOAT | Fuel used while stationary (litres). Same attribution as TotalFuel. |
| `EnergyUsedWhileDriving_kWh` | FLOAT | EV energy used while driving (kWh). Same attribution as fuel. |
| `FuelEnergyDistance_Km` | FLOAT | Distance (km) where fuel/energy was tracked. Same attribution as fuel. |
| `UniqueVehicleFault_Count` | INTEGER | Unique engine/vehicle fault codes (OBDII, J1939, custom reverse-engineered) |
| `UniqueDeviceFault_Count` | INTEGER | Unique device-originated faults (health, connectivity issues) |
| `Device_Health` | STRING | Whether device is working properly and measuring activity |

### VehicleKPI_Monthly

Same schema as VehicleKPI_Daily with these differences:
- `Local_Date` → `Local_MonthStartDate` (DATE): First day of the calendar month
- All metrics are aggregated over the full local month instead of a single day
- `TimeZoneId`: Last seen timezone for the month

### VehicleKPI_Hourly

Same schema as VehicleKPI_Daily at hourly granularity. Note: fuel metrics may be null/0 for hours within a trip, with the full trip's fuel appearing in the hour when the trip ends.

### LatestVehicleMetadata

| Column | Type | Description |
|---|---|---|
| `Vin` | STRING | Vehicle Identification Number (17 chars). Null if device cannot read VIN. |
| `DeviceName` | STRING | Device name from MyGeotab |
| `DeviceId` | STRING | Telematics device ID from MyGeotab |
| `Device_Health` | STRING | Whether device is working and measuring activity in last 24 hours |
| `DeviceTimeZoneId` | STRING | Timezone name for UTC-to-local conversion |
| `DeviceTimeZoneOffset` | STRING | Timezone offset for UTC-to-local conversion |
| `SerialNo` | STRING | Telematics device serial number |
| `DateFrom` | TIMESTAMP | UTC timestamp when device was associated to this VIN. Re-set on reconnection. |
| `DateTo` | TIMESTAMP | UTC timestamp when association ended. **2050-01-01 = currently active.** |
| `Year` | STRING | Vehicle model year (decoded from VIN) |
| `Manufacturer` | STRING | Vehicle manufacturer (decoded from VIN) |
| `Model` | STRING | Vehicle model (decoded from VIN) |
| `Engine` | STRING | Vehicle engine (decoded from VIN) |
| `FuelType` | STRING | Fuel type (decoded from VIN) |
| `WeightClass` | STRING | Vehicle weight class (decoded from VIN) |
| `VocationName` | STRING | ML-predicted driving pattern (see Vocation Definitions above) |
| `VocationDescription` | STRING | Detailed description of the assigned vocation |
| `DevicePlans` | STRING | Comma-separated list of active device plans |
| `LastOdometer_DateTime` | TIMESTAMP | UTC timestamp of last valid odometer reading |
| `LastOdometer_Km` | FLOAT | Last valid odometer reading (km) |
| `LastEngineStatus_DateTime` | TIMESTAMP | UTC timestamp of last engine status reading |
| `LastGps_DateTime` | TIMESTAMP | UTC timestamp of last GPS reading |
| `LastGps_Latitude` | FLOAT | Latitude of last GPS reading |
| `LastGps_Longitude` | FLOAT | Longitude of last GPS reading |
| `LastGps_Speed` | INTEGER | Speed (km/h) at last GPS reading |
| `Last24Hours_ActiveVehicleFaults` | INTEGER | Unique engine/vehicle fault codes in last 24 hours (OBDII, J1939, custom) |
| `Last24Hours_ActiveDeviceFaults` | INTEGER | Unique device-originated faults in last 24 hours |

**Important:** If a device was associated with multiple vehicles, multiple rows exist. Filter `DateTo = '2050-01-01'` for the current assignment.

### DeviceGroups

| Column | Type | Description |
|---|---|---|
| `SerialNo` | STRING | Telematics device serial number |
| `DeviceId` | STRING | Telematics device ID from MyGeotab |
| `GroupId` | STRING | Group ID in MyGeotab |
| `ImmediateGroup` | BOOLEAN | True if explicitly assigned. False if inherited from parent group. |
| `GroupName` | STRING | Group name in MyGeotab |

Supports up to 100 layers of group tree depth.

### DriverKPI_Daily

| Column | Type | Description |
|---|---|---|
| `DriverId` | STRING | Driver ID from MyGeotab |
| `Local_Date` | DATE | Local date (driver's timezone from MyGeotab) |
| `TimeZoneId` | STRING | Timezone for local date boundaries |
| `DriveDuration_Seconds` | FLOAT | Total active driving time (seconds), excluding idle |
| `IdleDuration_Seconds` | FLOAT | Total idle time (seconds) |
| `Distance_Km` | FLOAT | Total distance (km) |
| `Trip_Count` | INTEGER | Number of trips that began within the local date |
| `LatestLongitude` | FLOAT | Last valid GPS longitude |
| `LatestLatitude` | FLOAT | Last valid GPS latitude |
| `StopDuration_Seconds` | FLOAT | Duration stopped at end of trip, including end-of-trip idling |
| `WorkDistance_Km` | FLOAT | Distance driven during work hours |
| `WorkDrivingDuration_Seconds` | FLOAT | Driving duration during work hours |
| `WorkStopDuration_Seconds` | FLOAT | Stop duration during work hours |
| `AfterHours_Count` | INTEGER | Trips that started after work hours |
| `AfterHoursDistance_Km` | FLOAT | Distance driven after work hours |
| `AfterHoursDrivingDuration_Seconds` | FLOAT | Driving duration after work hours |
| `AfterHoursStopDuration_Seconds` | FLOAT | Stop duration after work hours |
| `FirstStartTime` | TIMESTAMP | UTC timestamp of the very first trip start for this driver on this date |
| `LastStopTime` | TIMESTAMP | UTC timestamp of the very last trip stop for this driver on this date |

**Key difference from Vehicle KPI:** Drivers accumulating activity across multiple vehicles get all activity aggregated into one row. No fuel/energy columns — those are vehicle-level only.

### DriverKPI_Monthly

Same schema as DriverKPI_Daily with these differences:
- `Local_Date` → `Local_MonthStartDate` (DATE): First day of the calendar month
- All metrics aggregated over the full local month
- `FirstStartTime` / `LastStopTime`: First and last across the full month

### LatestDriverMetadata

| Column | Type | Description |
|---|---|---|
| `DriverId` | STRING | Driver ID from MyGeotab |
| `Name` | STRING | Display name |
| `FirstName` | STRING | First name |
| `LastName` | STRING | Last name |
| `ActiveFrom` | TIMESTAMP | Account start timestamp |
| `ActiveTo` | TIMESTAMP | Account termination timestamp |
| `TimeZoneId` | STRING | Last seen timezone used for aggregation |
| `Designation` | STRING | Employee title/designation. Blank or null = no designation. |

### DriverGroups

| Column | Type | Description |
|---|---|---|
| `DriverId` | STRING | Driver ID from MyGeotab |
| `GroupId` | STRING | Group ID in MyGeotab |
| `ImmediateGroup` | BOOLEAN | True if explicitly assigned. False if inherited from parent group. |
| `GroupName` | STRING | Group name in MyGeotab |

### FleetSafety_Daily

Safety data lags up to 2 days behind other KPIs. Higher rank values = better performance.

| Column | Type | Description |
|---|---|---|
| `Date` | DATE | UTC date |
| `TotalCollisionCount_Daily` | INTEGER | Collisions detected by Geotab's ML model for the whole fleet on this day |
| `ClusterDescription` | STRING | Description of the peer group used for benchmarking |
| `FleetsInCluster` | INTEGER | Number of fleets in peer group |
| `VehiclesInCluster` | INTEGER | Number of vehicles in peer group |
| `HarshAcceleration_Rank` | FLOAT | Percentile rank for harsh acceleration (higher = better) |
| `HarshBraking_Rank` | FLOAT | Percentile rank for harsh braking |
| `HarshCornering_Rank` | FLOAT | Percentile rank for harsh cornering |
| `Seatbelt_Rank` | FLOAT | Percentile rank for seatbelt compliance |
| `Speeding_Rank` | FLOAT | Percentile rank for speeding |
| `Safety_Rank` | FLOAT | Overall safety percentile rank |
| `PredictedCollisionsPer1MillionKm` | FLOAT | Predicted collisions for fleet per 1M km |
| `PredictedCollisionsPer1MillionKm_Benchmark` | FLOAT | Peer group average (mean) for collisions per 1M km |
| `PredictedCollisionsPer1MillionKm_PeerGroupleader` | FLOAT | 20th percentile (best performers) in peer group |
| `PredictedCollisionsPer1MillionM` | FLOAT | Predicted collisions per 1M miles |
| `PredictedCollisionsPer1MillionM_Benchmark` | FLOAT | Peer group average per 1M miles |
| `PredictedCollisionsPer1MillionM_PeerGroupleader` | FLOAT | 20th percentile per 1M miles |

### VehicleSafety_Daily

| Column | Type | Description |
|---|---|---|
| `UTC_Date` | DATE | UTC date |
| `DeviceId` | STRING | Telematics device ID |
| `SerialNo` | STRING | Device serial number |
| `Vin` | STRING | Vehicle Identification Number |
| `HarshAcceleration_Rank` | FLOAT | Percentile rank (higher = better) |
| `HarshBraking_Rank` | FLOAT | Percentile rank |
| `HarshCornering_Rank` | FLOAT | Percentile rank |
| `Seatbelt_Rank` | FLOAT | Percentile rank |
| `Speeding_Rank` | FLOAT | Percentile rank |
| `Safety_Rank` | FLOAT | Overall safety percentile rank |
| `PredictedCollisionsPer1MillionKm` | FLOAT | Predicted collisions per 1M km |
| `PredictedCollisionsPer1MillionKm_Benchmark` | FLOAT | Peer group average |
| `PredictedCollisionsPer1MillionKm_PeerGroupleader` | FLOAT | 20th percentile (best performers) |
| `PredictedCollisionsPer1MillionM` | FLOAT | Predicted collisions per 1M miles |
| `PredictedCollisionsPer1MillionM_Benchmark` | FLOAT | Peer group average |
| `PredictedCollisionsPer1MillionM_PeerGroupleader` | FLOAT | 20th percentile |
| `CollisionProbabilityPer100ThousandKm` | FLOAT | Probability of at least one collision per 100K km |
| `CollisionProbabilityPer100ThousandKm_Benchmark` | FLOAT | Peer group average |
| `CollisionProbabilityPer100ThousandKm_PeerGroupleader` | FLOAT | 20th percentile |
| `CollisionProbabilityPer100ThousandM` | FLOAT | Probability of at least one collision per 100K miles |
| `CollisionProbabilityPer100ThousandM_Benchmark` | FLOAT | Peer group average |
| `CollisionProbabilityPer100ThousandM_PeerGroupleader` | FLOAT | 20th percentile |

### DriverSafety_Daily

Same structure as VehicleSafety_Daily, keyed by `DriverId` instead of `DeviceId`/`SerialNo`/`Vin`.

| Column | Type | Description |
|---|---|---|
| `UTC_Date` | DATE | UTC date |
| `DriverId` | STRING | Driver ID |
| `HarshAcceleration_Rank` | FLOAT | Percentile rank (higher = better) |
| `HarshBraking_Rank` | FLOAT | Percentile rank |
| `HarshCornering_Rank` | FLOAT | Percentile rank |
| `Seatbelt_Rank` | FLOAT | Percentile rank |
| `Speeding_Rank` | FLOAT | Percentile rank |
| `Safety_Rank` | FLOAT | Overall safety percentile rank |
| `PredictedCollisionsPer1MillionKm` | FLOAT | Predicted collisions per 1M km |
| `PredictedCollisionsPer1MillionKm_Benchmark` | FLOAT | Peer group average |
| `PredictedCollisionsPer1MillionKm_PeerGroupleader` | FLOAT | 20th percentile |
| `PredictedCollisionsPer1MillionM` | FLOAT | Predicted collisions per 1M miles |
| `PredictedCollisionsPer1MillionM_Benchmark` | FLOAT | Peer group average |
| `PredictedCollisionsPer1MillionM_PeerGroupleader` | FLOAT | 20th percentile |
| `CollisionProbabilityPer100ThousandKm` | FLOAT | Probability of at least one collision per 100K km |
| `CollisionProbabilityPer100ThousandKm_Benchmark` | FLOAT | Peer group average |
| `CollisionProbabilityPer100ThousandKm_PeerGroupleader` | FLOAT | 20th percentile |
| `CollisionProbabilityPer100ThousandM` | FLOAT | Probability of at least one collision per 100K miles |
| `CollisionProbabilityPer100ThousandM_Benchmark` | FLOAT | Peer group average |
| `CollisionProbabilityPer100ThousandM_PeerGroupleader` | FLOAT | 20th percentile |

### FaultMonitoring

Fault monitoring tracks Diagnostic Trouble Code (DTC) lifecycles. See [FAULT_MONITORING.md](../../../guides/FAULT_MONITORING.md) for concepts (fault cycles, persistence, severity).

Start with `AnyStatesDateTimeFirstSeen` / `AnyStatesDateTimeLastSeen` for the full cycle window. Use `IsPersistentCycle` to identify currently active faults. The Pending/Active/Confirmed columns provide detailed DTC state lifecycle.

| Column | Type | Description |
|---|---|---|
| `DeviceId` | STRING | Asset ID in MyGeotab |
| `SourceId` | STRING | Fault source ID in MyGeotab |
| `FaultCode` | STRING | Decoded fault code |
| `FaultCodeDescription` | STRING | Description of the fault code |
| `DiagnosticType` | STRING | Type of fault code (OBDII, SPN, PID/SID, etc.) |
| `FailureMode` | STRING | Failure mode of the fault code |
| `FailureModeDescription` | STRING | Failure mode description |
| `Controller` | STRING | Controller of the fault code |
| `ControllerDescription` | STRING | Controller description |
| `Component` | STRING | Component of the fault code |
| `AnyStatesDateTimeFirstSeen` | TIMESTAMP | First DTC datetime of the entire cycle |
| `AnyStatesDateTimeLastSeen` | TIMESTAMP | Last DTC datetime of the entire cycle |
| `IsPersistentCycle` | BOOLEAN | True = cycle is ongoing, last-seen can still update. False = cycle closed. |
| `PendingDateTimeFirstSeen` | TIMESTAMP | First Pending DTC datetime |
| `PendingOdometerFirstSeen` | FLOAT | Odometer at first Pending DTC |
| `PendingDateTimeLastSeen` | TIMESTAMP | Last Pending DTC datetime |
| `PendingOdometerLastSeen` | FLOAT | Odometer at last Pending DTC |
| `PendingDuration` | STRING | Duration the cycle was in Pending state |
| `PendingDistance` | FLOAT | Distance driven while in Pending state |
| `PendingCount` | INTEGER | Count of all Pending DTCs in the cycle |
| `ActiveDateTimeFirstSeen` | TIMESTAMP | First Active DTC datetime |
| `ActiveOdometerFirstSeen` | FLOAT | Odometer at first Active DTC |
| `ActiveDateTimeLastSeen` | TIMESTAMP | Last Active DTC datetime |
| `ActiveOdometerLastSeen` | FLOAT | Odometer at last Active DTC |
| `ActiveDuration` | STRING | Duration the cycle was in Active state |
| `ActiveDistance` | FLOAT | Distance driven while in Active state |
| `ActiveCount` | INTEGER | Count of all Active DTCs in the cycle |
| `ConfirmedDateTimeFirstSeen` | TIMESTAMP | First Confirmed DTC datetime |
| `ConfirmedOdometerFirstSeen` | FLOAT | Odometer at first Confirmed DTC |
| `ConfirmedDateTimeLastSeen` | TIMESTAMP | Last Confirmed DTC datetime |
| `ConfirmedOdometerLastSeen` | FLOAT | Odometer at last Confirmed DTC |
| `ConfirmedDuration` | STRING | Duration the cycle was in Confirmed state |
| `ConfirmedDistance` | FLOAT | Distance driven while in Confirmed state |
| `ConfirmedCount` | INTEGER | Count of all Confirmed DTCs in the cycle |

### FaultMonitoring_Daily

Daily log of every fault cycle between `AnyStatesDateTimeFirstSeen` and `AnyStatesDateTimeLastSeen`. Use with `$search` date filters.

| Column | Type | Description |
|---|---|---|
| `Local_Date` | DATE | Local date in device/asset timezone |
| `DeviceId` | STRING | Asset ID in MyGeotab |
| `SourceId` | STRING | Fault source ID in MyGeotab |
| `FaultCode` | STRING | Decoded fault code |
| `FaultCodeDescription` | STRING | Description of the fault code |
| `DiagnosticType` | STRING | Type (OBDII, SPN, PID/SID, etc.) |
| `FailureMode` | STRING | Failure mode |
| `FailureModeDescription` | STRING | Failure mode description |
| `Controller` | STRING | Controller |
| `ControllerDescription` | STRING | Controller description |
| `Component` | STRING | Component |

## Common Patterns

### Fleet Utilization

```python
import pandas as pd

url = f"{base}/VehicleKpi_Daily?$search=last_7_day"
records = fetch_all(url, auth)
df = pd.DataFrame(records)

df["drive_hours"] = df["DriveDuration_Seconds"] / 3600
df["idle_hours"] = df["IdleDuration_Seconds"] / 3600

summary = df.groupby("DeviceId").agg(
    total_km=("Distance_Km", "sum"),
    total_drive_hrs=("drive_hours", "sum"),
    total_idle_hrs=("idle_hours", "sum"),
    trip_count=("Trip_Count", "sum"),
).sort_values("total_km", ascending=False)
```

### Fuel Economy

```python
url = f"{base}/VehicleKpi_Daily?$search=last_30_day"
records = fetch_all(url, auth)
df = pd.DataFrame(records)

fuel = df[df["TotalFuel_Litres"] > 0].copy()
fuel["km_per_litre"] = fuel["Distance_Km"] / fuel["TotalFuel_Litres"]

worst = fuel.groupby("DeviceId")["km_per_litre"].mean().sort_values()
best = worst.tail(5)
worst_5 = worst.head(5)
```

### Idle Time Analysis

```python
url = f"{base}/VehicleKpi_Monthly?$search=last_3_month"
records = fetch_all(url, auth)
df = pd.DataFrame(records)

total_active = df["DriveDuration_Seconds"] + df["IdleDuration_Seconds"]
df["idle_pct"] = df["IdleDuration_Seconds"] / total_active * 100
worst_idlers = df.sort_values("idle_pct", ascending=False)[
    ["DeviceId", "Vin", "Distance_Km", "idle_pct"]
].head(10)
```

### Fleet Map (Last Known Positions)

```python
url = f"{base}/LatestVehicleMetadata"
r = requests.get(url, auth=auth)
df = pd.DataFrame(r.json()["value"])

active = df[df["LastGps_DateTime"].notna()]
for _, v in active.iterrows():
    print(f"{v['DeviceName']:20s} | {v['Manufacturer']} {v['Model']:10s} | "
          f"({v['LastGps_Latitude']:.4f}, {v['LastGps_Longitude']:.4f}) | "
          f"Health: {v['Device_Health']}")
```

### After-Hours Detection

```python
url = f"{base}/VehicleKpi_Daily?$search=last_14_day"
records = fetch_all(url, auth)
df = pd.DataFrame(records)

after_hours = df[df["AfterHours_Count"] > 0][
    ["DeviceId", "Local_Date", "AfterHours_Count",
     "AfterHoursDistance_Km", "AfterHoursDrivingDuration_Seconds"]
].copy()
after_hours["ah_minutes"] = after_hours["AfterHoursDrivingDuration_Seconds"] / 60
```

### Fleet Health Check

```python
url = f"{base}/LatestVehicleMetadata"
r = requests.get(url, auth=auth)
df = pd.DataFrame(r.json()["value"])

print("Device Health:", df["Device_Health"].value_counts().to_dict())
print(f"Active faults (24h): {(df['Last24Hours_ActiveVehicleFaults'] > 0).sum()}")
print(f"Reporting odometer: {df['LastOdometer_Km'].notna().sum()} / {len(df)}")
print(f"Fuel types: {df['FuelType'].value_counts().to_dict()}")
```

### Fault Monitoring — Persistent Faults

```python
url = f"{base}/FaultMonitoring"
records = fetch_all(url, auth)
df = pd.DataFrame(records)

# Currently active faults
persistent = df[df["IsPersistentCycle"] == True]
print(f"Persistent fault cycles: {len(persistent)}")
print(f"Affected vehicles: {persistent['DeviceId'].nunique()}")

# Most common active fault codes
print(persistent.groupby("FaultCode")["DeviceId"].count()
      .sort_values(ascending=False).head(10))
```

## Error Codes

| Code | Meaning | Fix |
|---|---|---|
| 401 | Bad credentials | Check `database/username` format |
| 403 | Access denied | Use server-specific URL, not `data-connector.geotab.com` |
| 406 | Jurisdiction Mismatch | Wrong server number — try servers 1–7 (1=EU, 2=US, 3=CA, 4=AU, 5=BR, 6=AS, 7=USGov) |
| 412 | Not subscribed | Install Data Connector add-in (see Prerequisites) |
| 416 | Date range too wide | Narrow `$search` range |
| 429 | Rate limited (100 req/user/min) | Wait and retry |
| 500 | Service temporarily unavailable | Retry later |
| 503 | Auth service temporarily unavailable | Retry later |

## Critical Rules

1. **Date range filters use `$search`, not `$filter`** — `$filter` is for column-level conditions (e.g., filtering by DeviceId, speed, etc.)
2. **`last_` vs `this_`** — `last_` = complete past periods only. `this_` = includes current partial period.
3. **Auth format is `database/username`** as the Basic Auth username field
4. **SAML/SSO not supported** — Data Connector requires basic auth credentials (create a service account)
5. **Always detect your server number** (1–7 by jurisdiction: 1=EU, 2=US, 3=CA, 4=AU, 5=BR, 6=AS, 7=USGov) before querying
6. **Follow `@odata.nextLink`** for paginated results — don't assume one page has everything
7. **New databases need ~2–3 hours** for KPI tables to populate after activation
8. **Safety data lags ~2 days** — it benchmarks against fleets across Geotab, not just yours
9. **Never hardcode credentials** — use `.env` + `python-dotenv`
10. **Fuel metrics use trip-end-time attribution** — fuel for a long trip appears in the hour/date when the trip ends, not spread across the trip
11. **LatestVehicleMetadata may have multiple rows per device** — filter `DateTo = '2050-01-01'` for current assignments
12. **Fault-related columns require Pro plan or higher** — Base and Regulatory plans don't include fault or engine-status data
13. **User permissions are enforced** — non-admin users only see data for devices/drivers within their group access scope
14. **Use `$select` and `$filter` to optimize queries** — `$select` reduces data transfer by fetching only needed columns; `$filter` applies server-side row filtering on any column

## Dependencies

```bash
pip install requests python-dotenv pandas
```

## Resources

- [Data Connector Schema and Dictionary](https://support.geotab.com/mygeotab/mygeotab-add-ins/doc/data-conn-schema) — Official column definitions for all tables
- [Data Connector User Guide](https://support.geotab.com/mygeotab/mygeotab-add-ins/doc/data-connector)
- [Data Connector Partner Setup](https://support.geotab.com/mygeotab/mygeotab-add-ins/doc/data-conn-partner#h.wiq7fzud3vwa)
- [Fault Monitoring Concepts](../../../guides/FAULT_MONITORING.md) — Fault cycles, persistence, severity explained
- Human-readable guide with prompts: [DATA_CONNECTOR.md](../../../guides/DATA_CONNECTOR.md)
