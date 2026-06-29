# Loading into MotherDuck: tables, layers, shape checks, dedup

How the data actually lands. Tools: `mcp__MotherDuck__query` (read), `mcp__MotherDuck__query_rw`
(write). DuckDB SQL. `httpfs`, `spatial`, `h3`, `json`, `parquet` are pre-installed.

## Bronze / Silver / Gold

| Layer | Contract | Typing | Dedup | Rebuildable? |
|-------|----------|--------|-------|--------------|
| **Bronze** | Exactly what the source returned + provenance. Append-only, never mutated. | `all_varchar` (lossless) | no | no — it's the system of record for raw pulls |
| **Silver** | Conformed, typed, deduped on a natural key. The table people query. | proper types | yes | yes — from bronze |
| **Gold** | Aggregates / marts for analytics & BI. | derived | n/a | yes — from silver |

You don't always need bronze. For a quick mirror, Ace → silver directly is fine (that's what
`planet_gps_pings` is). Add bronze when you want lossless replay, audit, or to debug Ace drift.

## Always inspect before you load

Two cheap reads decide everything. **Never `INSERT` blind.**

```sql
-- (a) Shape: does the CSV's inferred schema match the target?
DESCRIBE SELECT * FROM read_csv_auto('<signed url>');
-- (b) Size + range + boundary overlap vs the current watermark
WITH raw AS (SELECT * FROM read_csv_auto('<signed url>'))
SELECT count(*)                               AS csv_rows,
       count(DISTINCT DeviceId)               AS devices,
       min(GpsDateTime) AS min_t, max(GpsDateTime) AS max_t,
       count(*) FILTER (WHERE GpsDateTime <= (SELECT max(GpsDateTime) FROM my_db.planet_gps_pings)) AS overlap,
       count(*) FILTER (WHERE GpsDateTime >  (SELECT max(GpsDateTime) FROM my_db.planet_gps_pings)) AS new_rows
FROM raw;
```

Decide from the result:

| Observation | Action |
|-------------|--------|
| Schema identical, `new_rows` > 0 | Append with the watermark filter (below). |
| Schema differs (renamed/dropped/case) — quirk #7/#8 | Transform in the `SELECT` (alias by position) **or** re-ask Ace. |
| `overlap` > 0 (boundary second — quirk #6) | Expected; the `> watermark` filter or anti-join removes it. |
| `new_rows` = 0 | Nothing to do — Ace had no fresher data (it lags real-time). Skip the insert. |
| `csv_rows` ≈ 0 / unexpectedly tiny | Vague prompt, wrong window, or new account; re-ask before loading. |

> Observed for the GPS load: `DESCRIBE` returned `DeviceId VARCHAR, DeviceName VARCHAR,
> DeviceTimeZoneId VARCHAR, Latitude DOUBLE, Longitude DOUBLE, GpsDateTime TIMESTAMP, Speed BIGINT` —
> **identical** to the target. `read_csv_auto` even coerced the ` UTC`-suffixed strings to `TIMESTAMP`.
> `csv_rows=157419, overlap=4, new_rows=157415`.

## Creating tables from zero

### Silver (typed) — explicit DDL

```sql
CREATE TABLE IF NOT EXISTS my_db.planet_gps_pings (
  DeviceId         VARCHAR,
  DeviceName       VARCHAR,
  DeviceTimeZoneId VARCHAR,
  Latitude         DOUBLE,
  Longitude        DOUBLE,
  GpsDateTime      TIMESTAMP,
  Speed            BIGINT
);
```

Or let the first Ace CSV define it (then you own the types):

```sql
CREATE TABLE my_db.planet_gps_pings AS
SELECT * FROM read_csv_auto('<signed url>') WHERE FALSE;   -- schema only, 0 rows
```

### Bronze (lossless landing) — force VARCHAR + provenance

```sql
CREATE TABLE IF NOT EXISTS my_db.bronze_gps_raw AS
SELECT *,                                  -- raw columns exactly as returned
       now()      AS _loaded_at,
       'demo_fh4' AS _source_db,
       'ace_csv'  AS _source_channel,
       'gs://planet-user-results-prod-eu/<uuid>-000000000000.csv' AS _source_uri
FROM read_csv_auto('<signed url>', all_varchar=true)
WHERE FALSE;                               -- create empty; INSERT below on each run
```

> Verified: with `all_varchar=true` the bronze row preserves `GpsDateTime = '2026-06-26 01:42:40.423
> UTC'` **verbatim** (suffix and all) and `now()` lands as `TIMESTAMP WITH TIME ZONE`. True lossless
> landing — you can always replay bronze → silver if your typing logic changes.

Append to bronze (no dedup — bronze keeps everything, including the boundary overlap):

```sql
INSERT INTO my_db.bronze_gps_raw
SELECT *, now(), 'demo_fh4', 'ace_csv', 'gs://…/<uuid>….csv'
FROM read_csv_auto('<signed url>', all_varchar=true);
```

Bronze → Silver (type + dedup in one pass):

```sql
INSERT INTO my_db.planet_gps_pings
  (DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed)
SELECT DISTINCT ON (DeviceId, GpsDateTime)
       DeviceId, DeviceName, DeviceTimeZoneId,
       Latitude::DOUBLE, Longitude::DOUBLE,
       replace(GpsDateTime, ' UTC', '')::TIMESTAMP,    -- explicit parse from raw VARCHAR
       Speed::BIGINT
FROM my_db.bronze_gps_raw b
WHERE replace(GpsDateTime,' UTC','')::TIMESTAMP > (SELECT coalesce(max(GpsDateTime), TIMESTAMP '1970-01-01') FROM my_db.planet_gps_pings);
```

## The idempotent append (silver, direct from URL)

The workhorse. Re-running inserts nothing new (watermark advances), so it's safe to retry:

```sql
INSERT INTO my_db.planet_gps_pings
  (DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed)
SELECT DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed
FROM read_csv_auto('<signed url>')
WHERE GpsDateTime > (SELECT max(GpsDateTime) FROM my_db.planet_gps_pings);
```

> Result on the live run: **157,415 inserted**, the 4 boundary-second rows skipped, table 522,258 →
> 679,673. Verify after every load:
> `SELECT count(*), max(GpsDateTime) FROM my_db.planet_gps_pings;`

### When a strict watermark isn't enough — natural-key anti-join

Use this for **backfills**, overlapping windows, or any source you can't trust to be monotonic. It
dedups on the entity's natural key instead of a single timestamp:

```sql
INSERT INTO my_db.planet_gps_pings
  (DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed)
SELECT c.DeviceId, c.DeviceName, c.DeviceTimeZoneId, c.Latitude, c.Longitude, c.GpsDateTime, c.Speed
FROM read_csv_auto('<signed url>') c
WHERE NOT EXISTS (
  SELECT 1 FROM my_db.planet_gps_pings t
  WHERE t.DeviceId = c.DeviceId AND t.GpsDateTime = c.GpsDateTime
);
```

Natural keys per entity are in [`ENTITY_CATALOG.md`](ENTITY_CATALOG.md). The watermark filter is
faster (no full-table probe) for steady daily loads; the anti-join is bullet-proof for backfill.

### Column mismatch? Map by position, not name (quirk #7/#8)

If Ace renamed/cased columns, don't rely on `INSERT … SELECT *`. Pull positionally and alias:

```sql
-- Suppose Ace returned columns ["UTC_GpsTimestamp","DeviceId","Latitude","Longitude"]
INSERT INTO my_db.planet_gps_pings (DeviceId, Latitude, Longitude, GpsDateTime)
SELECT DeviceId, Latitude, Longitude, UTC_GpsTimestamp::TIMESTAMP
FROM read_csv_auto('<signed url>')
WHERE UTC_GpsTimestamp::TIMESTAMP > (SELECT max(GpsDateTime) FROM my_db.planet_gps_pings);
```

Or use DuckDB's `INSERT INTO tbl BY NAME SELECT …` when names match but order differs.

## Dimensions from `Get` (JSON, not CSV)

`mcp__Geotab_MCP__Get` returns JSON. Two ways to land it:

- **Small/medium (≤ a few thousand):** read the JSON result and build an `INSERT … VALUES`, or write
  it to a local `.json`/`.csv` in the scratchpad and `read_json_auto`/`read_csv_auto` it.
- Always `CREATE TABLE IF NOT EXISTS` the dimension first with explicit types.

```sql
CREATE TABLE IF NOT EXISTS my_db.dim_device (
  id VARCHAR PRIMARY KEY, name VARCHAR, serialNumber VARCHAR,
  vehicleIdentificationNumber VARCHAR, licensePlate VARCHAR, deviceType VARCHAR, productId BIGINT
);
```
Refresh dimensions with **upsert** semantics (they change slowly): delete-then-insert the pulled set,
or `INSERT … ON CONFLICT (id) DO UPDATE` if you declared a primary key. See
[`ENTITY_CATALOG.md`](ENTITY_CATALOG.md) for the `Get` pagination quirk.

## The `device_id_map` helper

A tiny `(DeviceId, DeviceName)` table (it already exists in `my_db`) resolves Ace output: depending on
the prompt, Ace returns `DeviceName`, `DeviceId`, or both (the degraded URL request returned only
`DeviceId`). Keep an authoritative map from `dim_device` so every fact table can be enriched/joined
regardless of which Ace handed you.

## Gold (later)

Once silver is trustworthy, build marts for analysis — daily distance per device, H3 hex density,
idle hotspots, etc. Keep these **out of the ingestion path**; rebuild them from silver on a schedule.
(`h3_latlng_to_cell`, `h3_cell_to_latlng`, `h3_h3_to_string` and the `spatial` functions are
available.) Analytics recipes are deliberately not part of this engineering skill.
