# Entity catalog: what to replicate beyond GPS

A Geotab database is **52 entity types** (`mcp__Geotab_MCP__ListEntities`), not just GPS. A good
warehouse mirrors a handful of **facts** (high-volume, time-series) and **dimensions** (slow-changing
reference data). Pick the channel per entity.

## Channel by entity

| Entity | Role | Channel | Natural key | Cadence |
|--------|------|---------|-------------|---------|
| `LogRecord` (GPS) | fact | **Ace** (bulk CSV) | `(DeviceId, GpsDateTime)` | daily |
| `Trip` † | **mutable** fact | **Ace** | `(DeviceId, trip_start_utc)` | daily **+ re-split reconcile** |
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
| `Diagnostic` | dimension (decodes StatusData/Fault) | `Get` if small; **Ace bulk CSV if large** | `id` | monthly |
| `Rule` | dimension (decodes ExceptionEvent) | `Get` | `id` | monthly |
| `Driver`* | — | use `User` + `{isDriver:true}` | — | — |

\* There is no `Driver` typeName — drivers are `User`s. (Same gotcha as the rest of the Geotab API.)

† **`Trip` is a *derived, mutable* fact — its `TripId` is not stable.** Geotab recomputes trips when new
evidence arrives (a `DriverChange` from the
[driver-assignment workflow](../../geotab/references/DRIVER_TRIP_ASSIGNMENT.md), or late GPS), so an
already-loaded trip can get a **new `TripId` and a changed stop time**, retiring the old id. Plain forward
catch-up can't see this (the changed trip starts *before* your watermark). After each forward trips load,
run the **trip re-split reconcile** — [`INCREMENTAL_BACKFILL.md`](INCREMENTAL_BACKFILL.md) §D.

**Two keys, used for different jobs — and you must store *both*.** **Store `TripId`** in silver: the
re-split reconcile (§D) `DELETE`s/anti-joins on it, so a warehouse that didn't capture `TripId` can't run
operation D. But **`TripId` is not the dedup/identity key** (it changes on re-split); the *drive's* stable
identity is **`(DeviceId, trip_start_utc)`**. So: **incremental forward derive dedups on `TripId`** (new
splits land as new rows, then §D removes the retired ones); a **full bronze→silver rebuild dedups on
`(DeviceId, trip_start_utc)` keeping the latest-loaded row** (collapses a retired id into its replacement
— see [`INCREMENTAL_BACKFILL.md`](INCREMENTAL_BACKFILL.md) §D "Replaying trips from bronze").

`Trip.driver` (the `DriverId` column) is itself derived from `DriverChange`; it resolves to `dim_user.id`
for rows where a driver was assigned and is the sentinel `'UnknownDriverId'` otherwise — so a
trips→`dim_user` join must tolerate that sentinel. (Pure event facts — `ExceptionEvent`, `FaultData` —
don't mutate once fired.)

**Heuristic:** if it has a timestamp and grows forever → **fact via Ace**. If it's a list you join
*to* (vehicles, drivers, zones, diagnostics, rules) → **dimension via `Get`**, because `Get` is exact,
real-time, and permission-scoped, while Ace filters to `IsTracked=TRUE` and pre-aggregates.

## Facts via Ace

Same loop as GPS — see [`ACE_TO_CSV.md`](ACE_TO_CSV.md) for prompts (GPS, trips, status, exceptions
are pre-written there). Each fact gets its own **append-only `bronze_*_raw`** table (lossless landing)
**and** a silver table derived from it, plus a watermark column and `warehouse_ingest_log` rows.
Bronze is mandatory for these because Ace's output isn't reproducible (URL expiry + non-determinism) —
see [`MEDALLION_LOADING.md`](MEDALLION_LOADING.md). The watermark column is the entity's event time:

| Table | Watermark column |
|-------|------------------|
| `planet_gps_pings` | `GpsDateTime` |
| `trips` | **`trip_start_utc`**, but pull with a lookback `L` ≥ longest trip (re-splits change `trip_end_utc`; a long trip can also *complete* after a later trip advanced the watermark — see † and §D) |
| `status_data` | `status_datetime_utc` |
| `exception_events` | `active_from_utc` |

## Dimensions via `Get`

> **Pick the channel by *size*, not just fact-vs-dimension.** The `Get` → JSON → hand-built `INSERT`
> path is great for small/medium dimensions but **doesn't scale to large ones** — observed on
> `Demo_fh_vegas4` (2026-06-29): `User`=1, `Zone`=0, `Rule`=13, but **`Diagnostic`=65,757** (`GetCountOf`;
> the Ace bulk CSV returned 65,772 — see the Get-vs-Ace gap below). Serializing
> 65 K rows of JSON into SQL is impractical (and impossible to hand-build in clients without a scratchpad,
> e.g. ChatGPT). For a **large reference table, use the Ace bulk-CSV path** (land it via `read_csv_auto`
> like a fact, then treat the typed result as your `dim_*`), **or load only the subset your facts
> reference** (e.g. the `DiagnosticId`s present in `status_data`/`fault_data`) — you rarely need all
> 65 K. **Measured: of 65,772 diagnostics, `status_data` referenced only 56** (~0.1%); the referenced
> subset is tiny. Small dims stay on `Get` (exact, reproducible). (Bulk-CSV `Diagnostic` quirks: Ace
> returned 65,772 vs `GetCountOf`=65,757, couldn't return `Controller` → loaded NULL, uppercased `SOURCE`.)

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
- **Verify field names with `GetEntity` first — don't guess.** One unknown field fails the *whole* `Get`
  call: `Get(User, fields=[…,'isActive'])` → `'User.isActive' is an unknown property`
  (`NotSupportedException`). `User` has no `isActive` — use `isDriver` + `activeFrom`/`activeTo`. Call
  `GetEntity(entity_type='User')` (or read `mygeotab://entities/{name}`) before building the selector.
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

### Landing `Get` JSON into a table (validated)

`Get` JSON lands in your context, not at a URL — so you serialize it into SQL. Two ways, both tested
on the 50-device `demo_fh4` fleet:

- **Generate the `INSERT` with a script** (recommended for reliability): write the JSON to the
  scratchpad, then a tiny Python pass emits `INSERT … VALUES (…)` with proper quote-escaping and
  timestamp cleanup. **Geotab timestamps come as `2026-05-15T14:47:06.746Z`** — strip the `Z` and
  swap `T`→space (`replace('T',' ').replace('Z','')`) so they cast cleanly to `TIMESTAMP` (a bare
  `Z` string doesn't cast to a plain `TIMESTAMP`). This produced a correct 50-row load.
- **Cast the JSON array inline** with DuckDB: `SELECT unnest(CAST('<json>' AS STRUCT(id VARCHAR,
  name VARCHAR, …)[]))`. Elegant for small payloads; the script path scales better and escapes safely.

**`id` is the only safe natural key.** On `demo_fh4`, the 50 devices share just **10 distinct VINs**
(the demo reuses them) — so never key a device dimension on `vehicleIdentificationNumber`. Refresh
slowly-changing dims with `CREATE OR REPLACE` or delete-then-insert keyed on `id` (**dims only — they're
reproducible from `Get`; never `CREATE OR REPLACE` bronze or silver during a load**).

### Entities cover different device populations

Observed counts (2026-06-29, `demo_fh4`; point-in-time) on the same fleet/window: GPS **26 devices**,
trips **26**, exception events **50**, `dim_device` **50**. Facts pulled via Ace reflect only devices with activity (and `IsTracked=TRUE`),
while the device dimension has the whole fleet. So **a device missing from a fact table isn't
necessarily a gap** — cross-check against `dim_device` and the entity's own nature before backfilling.

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

- **Minimal mirror (most demos):** `planet_gps_pings` (fact, with its `bronze_gps_raw` underneath) +
  `dim_device` (dimension, no bronze). Enough to map, measure distance, and label vehicles.
- **Operational mirror:** add `trips`, `exception_events`, `status_data`, plus `dim_user`, `dim_zone`,
  `dim_rule`, `dim_diagnostic` so facts are human-readable.
- **Full replica:** iterate `ListEntities` and replicate everything relevant to the user's use case —
  but only what they'll query. Every table you add is a table you must keep fresh and gap-check.
