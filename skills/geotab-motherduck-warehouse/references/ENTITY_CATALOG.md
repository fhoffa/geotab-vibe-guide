# Entity catalog: what to replicate beyond GPS

A Geotab database is **52 entity types** (`mcp__Geotab_MCP__ListEntities`), not just GPS. A good
warehouse mirrors a handful of **facts** (high-volume, time-series) and **dimensions** (slow-changing
reference data). Pick the channel per entity.

## Channel by entity

| Entity | Role | Channel | Natural key | Cadence |
|--------|------|---------|-------------|---------|
| `LogRecord` (GPS) | fact | **Ace** (bulk CSV) | `(DeviceId, GpsDateTime)` | daily |
| `Trip` | fact | **Ace** | `(DeviceId, trip_start_utc)` | daily |
| `StatusData` (engine/sensor) | fact | **Ace** | `(DeviceId, DiagnosticId, status_datetime_utc)` | daily |
| `ExceptionEvent` (safety) | fact | **Ace** | `(DeviceId, RuleId, active_from_utc)` | daily |
| `FaultData` (DTCs) | fact | **Ace** or `Get` | `(DeviceId, DiagnosticId, dateTime)` | daily |
| `FuelTransaction` / `FillUp` | fact | `Get` (sparse) | `(DeviceId, dateTime)` | daily/weekly |
| `ChargeEvent` / `BatteryStateOfHealth` (EV) | fact | `Get` | `(DeviceId, startTime)` | daily |
| `DeviceStatusInfo` | live snapshot | `Get` | `DeviceId` | on demand (don't historize) |
| `Device` | **dimension** | **`Get`** | `id` | weekly |
| `User` (incl. drivers) | dimension | `Get` (`{isDriver:true}` for drivers) | `id` | weekly |
| `Zone` (geofences) | dimension | `Get` | `id` | weekly |
| `Group` (hierarchy) | dimension | `Get` | `id` | weekly |
| `Diagnostic` | dimension (decodes StatusData/Fault) | `Get` | `id` | monthly |
| `Rule` | dimension (decodes ExceptionEvent) | `Get` | `id` | monthly |
| `Driver`* | — | use `User` + `{isDriver:true}` | — | — |

\* There is no `Driver` typeName — drivers are `User`s. (Same gotcha as the rest of the Geotab API.)

**Heuristic:** if it has a timestamp and grows forever → **fact via Ace**. If it's a list you join
*to* (vehicles, drivers, zones, diagnostics, rules) → **dimension via `Get`**, because `Get` is exact,
real-time, and permission-scoped, while Ace filters to `IsTracked=TRUE` and pre-aggregates.

## Facts via Ace

Same loop as GPS — see [`ACE_TO_CSV.md`](ACE_TO_CSV.md) for prompts (GPS, trips, status, exceptions
are pre-written there). Each gets its own silver table, watermark column, and `warehouse_ingest_log`
rows. The watermark column is the entity's event time:

| Table | Watermark column |
|-------|------------------|
| `planet_gps_pings` | `GpsDateTime` |
| `trips` | `trip_end_utc` (or `trip_start_utc`) |
| `status_data` | `status_datetime_utc` |
| `exception_events` | `active_from_utc` |

## Dimensions via `Get`

`mcp__Geotab_MCP__Get(database, typeName, resultsLimit, propertySelector, search, sort)`. Returns
JSON. Validated on `demo_fh4`:

```
Get(typeName='Device', resultsLimit=3, propertySelector={fields:['id','name','serialNumber',
    'vehicleIdentificationNumber','licensePlate','productId']})
→ [{ id:'b2', name:'Demo - 02', serialNumber:'G90000000002',
     vehicleIdentificationNumber:'VF611A364JD011741', licensePlate:'DEMO02',
     deviceType:'GO9', productId:120 }, …]   (GetCountOf Device = 50)
```

Tips:
- **Always pass `propertySelector`** to shrink the payload (entities like `Device`/`User`/`Trip` have
  dozens of fields). Pull only what your dimension needs.
- **Always pass `resultsLimit`.** Omitting it returns *everything* and can overflow context.
- Land it as in [`MEDALLION_LOADING.md`](MEDALLION_LOADING.md) → `dim_device`, `dim_user`, `dim_zone`,
  `dim_group`, `dim_diagnostic`, `dim_rule`. Refresh with delete-then-insert or `ON CONFLICT` upsert.

### The `Get` pagination quirk — cursor, not page numbers

`Get` paginates **two different ways** depending on the entity (this bit us in testing — the
`hasMoreResults` hint is easy to miss):

1. **Reference entities (`Device`, `User`, `Zone`, …): cursor via `offset` + `lastId`.** When
   `resultCount == resultsLimit`, more rows exist. Page with `sort`:
   ```
   Get(typeName='Device', resultsLimit=1000,
       sort={sortBy:'name', sortDirection:'asc', offset:<last row's name>, lastId:<last row's id>})
   ```
   Loop until a page returns fewer than `resultsLimit`. **There are no page numbers.**
2. **Time-series entities (`LogRecord`, `Trip`, `StatusData`, …): narrow the `fromDate`/`toDate`
   window**, don't page. If a window hits the limit, split it in half and re-pull. (This is exactly
   why facts are easier via Ace, which streams the whole window to one CSV.)

The live `Get Device` response spelled this out:
> `"hasMoreResults": true … To fetch the next page: use sort with offset set to the last record's
> sortBy field value and lastId set to its id, or narrow your fromDate/toDate range.`

## Suggested dimension DDL

```sql
CREATE TABLE IF NOT EXISTS my_db.dim_device (
  id VARCHAR PRIMARY KEY, name VARCHAR, serialNumber VARCHAR,
  vehicleIdentificationNumber VARCHAR, licensePlate VARCHAR, deviceType VARCHAR, productId BIGINT,
  _refreshed_at TIMESTAMP DEFAULT now()
);
CREATE TABLE IF NOT EXISTS my_db.dim_user (
  id VARCHAR PRIMARY KEY, name VARCHAR, firstName VARCHAR, lastName VARCHAR,
  isDriver BOOLEAN, employeeNo VARCHAR, _refreshed_at TIMESTAMP DEFAULT now()
);
CREATE TABLE IF NOT EXISTS my_db.dim_zone (
  id VARCHAR PRIMARY KEY, name VARCHAR, comment VARCHAR, _refreshed_at TIMESTAMP DEFAULT now()
);
CREATE TABLE IF NOT EXISTS my_db.dim_diagnostic (
  id VARCHAR PRIMARY KEY, name VARCHAR, code BIGINT, unitOfMeasure VARCHAR
);
```

Use `GetEntity(entity_type='Device')` to discover the full field list and required/optional flags
before designing a wide dimension.

## Minimal vs full mirror

- **Minimal mirror (most demos):** `planet_gps_pings` (fact) + `dim_device` (dimension). Enough to map,
  measure distance, and label vehicles.
- **Operational mirror:** add `trips`, `exception_events`, `status_data`, plus `dim_user`, `dim_zone`,
  `dim_rule`, `dim_diagnostic` so facts are human-readable.
- **Full replica:** iterate `ListEntities` and replicate everything relevant to the user's use case —
  but only what they'll query. Every table you add is a table you must keep fresh and gap-check.
