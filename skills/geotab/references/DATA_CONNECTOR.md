# Geotab Data Connector (OData API)

## When to Use This Reference

- Querying pre-aggregated fleet KPIs (distance, fuel, idle time, safety scores)
- Building dashboards or reports from fleet data without raw API calls
- Server-side scripts and standalone apps needing aggregated data
- Connecting Python, Power BI, Excel, or Tableau to fleet analytics
- Any task involving the Data Connector endpoint at `odata-connector-{N}.geotab.com`

**Not for Add-Ins:** The Data Connector requires HTTP Basic Auth (username + password) on a separate server. MyGeotab Add-Ins only receive a session token — they cannot query the Data Connector directly. Use the standard MyGeotab API or Ace for in-Add-In analytics.

## Prerequisites

The Data Connector add-in must be enabled on the database (requires ProPlus plan — free demo databases and most customer databases already include this). On demo databases, install manually since the Marketplace is not available:

1. MyGeotab → **Administration > System Settings > Add-Ins**
2. Add: `{"url": "https://app.geotab.com/addins/geotab/dataConnector/manifest.json"}`
3. Save and refresh

Without this: 412 (`"Database cannot be subscribed"`) or 403.

**New databases:** KPI/safety tables are empty for ~2–3 hours after activation while the pipeline backfills. `LatestVehicleMetadata` populates immediately.

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

# Your database is on server 1 or 2 — find which one
for server in [1, 2]:
    url = f"https://odata-connector-{server}.geotab.com/odata/v4/svc/LatestVehicleMetadata"
    r = requests.get(url, auth=auth)
    if r.status_code == 200:
        base = f"https://odata-connector-{server}.geotab.com/odata/v4/svc"
        print(f"Connected on server {server}")
        break
```

**Server detection:** The wrong server returns **406 Jurisdiction Mismatch**. Always try both.

**Simplified URL note:** `https://data-connector.geotab.com/odata/v4/svc/` exists for Power BI/Excel but may return 403 on table queries for some servers. Use the server-specific URL.

## .env File

```bash
GEOTAB_DATABASE=your_database
GEOTAB_USERNAME=your_email@example.com
GEOTAB_PASSWORD=your_password
```

## Date Range Filters

Time-series tables require a `$search` parameter (not `$filter`).

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

## Available Tables

### Time-Series Tables (Date Filter Required)

| Table | Content | Key Columns |
|---|---|---|
| `VehicleKpi_Daily` | Daily vehicle metrics | `DeviceId`, `Vin`, `Local_Date`, `Distance_Km`, `DriveDuration_Seconds`, `IdleDuration_Seconds`, `TotalFuel_Litres`, `Trip_Count`, `Stop_Count`, `AfterHours_Count`, `AfterHoursDistance_Km`, `AfterHoursDrivingDuration_Seconds` |
| `VehicleKpi_Hourly` | Hourly vehicle metrics | Same columns at hourly granularity |
| `VehicleKpi_Monthly` | Monthly vehicle metrics | Same columns, monthly rollup |
| `DriverKPI_Daily` | Daily driver metrics | Similar to vehicle KPI but keyed by driver |
| `DriverKPI_Monthly` | Monthly driver metrics | Monthly rollup |
| `FleetSafety_Daily` | Fleet-level safety | Safety rankings, predicted collision rates |
| `VehicleSafety_Daily` | Per-vehicle safety | Vehicle safety rankings |
| `DriverSafety_Daily` | Per-driver safety | Driver safety rankings |
| `FaultMonitoring_Daily` | Daily fault activity | Fault code counts per vehicle |

### Snapshot Tables (No Date Filter)

| Table | Content | Key Columns |
|---|---|---|
| `LatestVehicleMetadata` | Vehicle info | `DeviceId`, `DeviceName`, `Vin`, `Manufacturer`, `Model`, `FuelType`, `LastGps_DateTime`, `LastGps_Latitude`, `LastGps_Longitude`, `LastOdometer_Km`, `Device_Health`, `Last24Hours_ActiveVehicleFaults` |
| `FaultMonitoring` | Current fault snapshot | Fault lifecycle details |
| `DeviceGroups` | Device-to-group mappings | Group hierarchy |
| `DriverGroups` | Driver-to-group mappings | Group hierarchy |
| `DriverMetadata` | Driver info | Names, timezones |
| `ExceptionEvent` | Rule exception events | Server 2 only |

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

## Error Codes

| Code | Meaning | Fix |
|---|---|---|
| 401 | Bad credentials | Check `database/username` format |
| 403 | Access denied | Use server-specific URL, not `data-connector.geotab.com` |
| 406 | Jurisdiction Mismatch | Wrong server number — try the other one |
| 412 | Not subscribed | Install Data Connector add-in (see Prerequisites) |
| 416 | Date range too wide | Narrow `$search` range |
| 429 | Rate limited (100 req/user/min) | Wait and retry |
| 500 | Service temporarily unavailable | Retry later |
| 503 | Auth service temporarily unavailable | Retry later |

## Critical Rules

1. **Date filters use `$search`, not `$filter`** — this is the most common mistake
2. **`last_` vs `this_`** — `last_` = complete past periods only. `this_` = includes current partial period.
3. **Auth format is `database/username`** as the Basic Auth username field
4. **SAML/SSO not supported** — Data Connector requires basic auth credentials (create a service account)
5. **Always detect your server number** (1 or 2) before querying
6. **Follow `@odata.nextLink`** for paginated results — don't assume one page has everything
7. **New databases need ~2–3 hours** for KPI tables to populate after activation
8. **Safety data lags ~2 days** — it benchmarks against fleets across Geotab, not just yours
9. **Never hardcode credentials** — use `.env` + `python-dotenv`
10. **Returns the full fleet** — unlike the API and Ace, the Data Connector ignores user permissions and always returns data for all vehicles. If you need permission-scoped results, use the API or Ace instead.

## Dependencies

```bash
pip install requests python-dotenv pandas
```

## Resources

- [Data Connector User Guide](https://support.geotab.com/mygeotab/mygeotab-add-ins/doc/data-connector)
- [Data Connector Partner Setup](https://support.geotab.com/mygeotab/mygeotab-add-ins/doc/data-conn-partner#h.wiq7fzud3vwa)
- Human-readable guide with prompts: [DATA_CONNECTOR.md](../../../guides/DATA_CONNECTOR.md)
