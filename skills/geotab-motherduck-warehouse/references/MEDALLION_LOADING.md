# Loading into MotherDuck: tables, layers, shape checks, dedup

How the data actually lands. Tools: `mcp__MotherDuck__query` (read), `mcp__MotherDuck__query_rw`
(write). DuckDB SQL. `httpfs`, `spatial`, `h3`, `json`, `parquet` are pre-installed.

## Bronze / Silver / Gold

| Layer | Contract | Typing | Dedup | Rebuildable? |
|-------|----------|--------|-------|--------------|
| **Bronze** | Exactly what the source returned + provenance. Append-only, never mutated. | `all_varchar` (lossless) | no | no — it's the system of record for raw pulls |
| **Silver** | Conformed, typed, deduped on a natural key. The table people query. | proper types | yes | yes — a deterministic projection of bronze |
| **Gold** | Aggregates / marts for analytics & BI. | derived | n/a | yes — from silver |

### The rule that decides whether you need bronze

It hinges on **one question: can you reproduce the source on demand?**

- **Ace-sourced facts → bronze is mandatory.** The source is *not* reproducible: the signed CSV URL
  **expires in ~24 h**, and **Ace is non-deterministic** — re-pulling the same window can return a
  differently-shaped/counted result (different source table, `IsTracked` population — see quirk #11).
  Bronze is therefore your *only* durable, replayable record of what you actually ingested. **Silver is
  a deterministic projection of bronze** — never loaded straight from the URL.
- **`Get`-sourced dimensions → skip bronze.** `Get` is exact, real-time, reproducible any time, and
  reconciles with `GetCountOf`. There's nothing to preserve that you can't re-fetch, so land straight
  to a typed `dim_*`.

> This asymmetry is the whole design. Don't put a bronze layer under dimensions, and don't let a fact
> table skip bronze. The "quick mirror, Ace → silver directly" shortcut is a trap: the moment the URL
> expires you've lost the ability to rebuild, and the first non-deterministic re-pull silently changes
> your history with no raw record of what changed.

**Storage note:** bronze keeps *every* batch ever ingested (dupes, boundary overlaps, drift and all),
so it grows ~2× silver. That's intended — full raw is the point. Pruning *stable, old* raw batches is a
later optimization once a window is proven settled; don't pre-optimize it away.

## Isolate each Geotab source — one database per source, schema per layer

**One MotherDuck database per Geotab database, with a schema per medallion layer
(`bronze`/`silver`/`gold`).** This is the only supported layout — never put two sources in the same
database.

```sql
CREATE DATABASE IF NOT EXISTS geotab_demo_fh4;          -- one per Geotab source DB
CREATE SCHEMA  IF NOT EXISTS geotab_demo_fh4.bronze;
CREATE SCHEMA  IF NOT EXISTS geotab_demo_fh4.silver;
CREATE SCHEMA  IF NOT EXISTS geotab_demo_fh4.gold;
-- Source identity, recorded once in a metadata table (COMMENT ON DATABASE is NOT
-- implemented in MotherDuck — verified 2026-06-30: "Not implemented Error: Adding
-- comments to databases is not implemented"). COMMENT ON TABLE *does* work.
CREATE TABLE IF NOT EXISTS geotab_demo_fh4.main.warehouse_meta (
  source_db VARCHAR, geotab_server VARCHAR, layout VARCHAR, note VARCHAR,
  created_at TIMESTAMP DEFAULT now());
INSERT INTO geotab_demo_fh4.main.warehouse_meta (source_db, geotab_server, layout, note)
VALUES ('demo_fh4', 'my.geotab.com', 'db-per-source + schema-per-layer (bronze/silver/gold)',
        'Geotab source identity. One Geotab source per MotherDuck database.');
COMMENT ON TABLE geotab_demo_fh4.main.warehouse_meta IS 'Geotab source: demo_fh4 (my.geotab.com)';
-- geotab_demo_fh4.bronze.gps_raw · geotab_demo_fh4.silver.planet_gps_pings
-- geotab_demo_fh4.silver.dim_device · geotab_demo_fh4.gold.daily_device_km
```

**Why a whole database per source, not a shared one:** Geotab entity IDs are unique only *within* one
database — every Geotab DB reuses `b1`, `b2`, `b3`, … for devices (and zones, rules, users, groups).
Silver dedups on the natural key (`(DeviceId, GpsDateTime)`) and dimensions key on `id`, so two sources
in the same tables would **collide** — DB-A's `b3` and DB-B's `b3` dedup into one silver row,
`dim_device.id='b2'` from one clobbers the other — corrupting both, silently. A separate database also
puts isolation at the level where MotherDuck scopes **Sharing** (zero-copy Shares are per-database),
**retention/backup** (`historical_bytes`, point-in-time restore), **access**, and **cost** —
so you can share or drop one source without touching another. Layers as schemas is the conventional
medallion shape (grant analysts `silver`/`gold`, restrict `bronze`).

> Validated 2026-06-29: same table name lives independently in two databases (and in two schemas of one
> DB) with no collision; `DROP DATABASE` / `DROP SCHEMA … CASCADE` removes one cleanly. The demo warehouse
> was migrated from the generic `my_db.main.*` to `geotab_demo_fh4` with `bronze`/`silver`/`gold` schemas.
> Worked-SQL examples below still use the short `my_db.<table>` form for brevity — read them as
> `geotab_<source>.<layer>.<table>`.

**Provenance:** keep per-row **`_batch_id`** (which ingestion produced the row). The **source identity is
recorded once at the database level** — in the `main.warehouse_meta` table above (plus the optional
`COMMENT ON TABLE` and `warehouse_ingest_log`). **Don't use `COMMENT ON DATABASE`** — it's *not
implemented* in MotherDuck (verified 2026-06-30) and fails/no-ops, so the identity would be lost.
**Don't add a per-row `_source_db`** either: with one database per source it's a constant column (≈0
bytes after compression, but pure noise).

## Always inspect before you derive

Appending to **bronze is unconditional** — it's lossless `all_varchar`, so it can't be "wrong"; just
land whatever Ace returned. Inspection is about the **silver derive**: catch Class-A semantic problems
(wrong source table, aggregation, timezone — see [`QUALITY_AND_REPAIR.md`](QUALITY_AND_REPAIR.md))
*before* they propagate, and confirm the cast/dedup will behave. Two cheap reads decide it. **Never
derive silver blind.**

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
| Schema identical, `new_rows` > 0 | Land in bronze, then derive silver with the watermark filter (below). |
| Schema differs (renamed/dropped/case) — quirk #7/#8 | Still land raw in bronze; map by position in the **derive** `SELECT` **or** re-ask Ace. |
| `overlap` > 0 (boundary second — quirk #6) | Expected; bronze keeps it, the silver derive's `> watermark`/anti-join removes it. |
| `new_rows` = 0 | Ace had no fresher data (it lags real-time). Skip the bronze append too — nothing to record. |
| `csv_rows` ≈ 0 / unexpectedly tiny | Vague prompt, wrong window, or new account; re-ask before landing. |

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

### Bronze (lossless landing) — force VARCHAR + provenance, append-only

Create the shell **once** with `CREATE TABLE IF NOT EXISTS` — **never `CREATE OR REPLACE`** (that
would overwrite the system of record and destroy replay). Every run only ever `INSERT`s.

```sql
CREATE TABLE IF NOT EXISTS my_db.bronze_gps_raw AS
SELECT *,                                  -- raw columns exactly as returned
       'ace:<chat-uuid>' AS _batch_id,     -- identifies the exact ingestion that produced this row
       now()      AS _loaded_at,
       'ace_csv'  AS _source_channel,      -- how it arrived: ace_csv | bootstrap_from_silver | …
       'gs://planet-user-results-prod-<region>/<uuid>-000000000000.csv' AS _source_uri
FROM read_csv_auto('<signed url>', all_varchar=true)
WHERE FALSE;                               -- create empty; INSERT below on each run
```

(No per-row `_source_db` — the source is one whole database, recorded once in `main.warehouse_meta`;
see §isolate.)

> `_batch_id` distinguishes ingestion provenance — e.g. `ace:4b008ce3-…` (the Ace chat id) for a live
> window pull vs. `bootstrap_from_silver:2026-06-29` for the one-time reconstruction (see "Brownfield"
> below) vs. `backfill:2026-06-18` for a historical window. It's what lets you audit, selectively
> re-derive, or prune one batch without touching others. `_source_channel` is the coarse "how"
> (`ace_csv`, `bootstrap_from_silver`); `_batch_id` is the fine-grained "which run."

> Verified: with `all_varchar=true` the bronze row preserves `GpsDateTime = '2026-06-26 01:42:40.423
> UTC'` **verbatim** (suffix and all) and `now()` lands as `TIMESTAMP WITH TIME ZONE`. True lossless
> landing — you can always replay bronze → silver if your typing logic changes.

**Append to bronze — no dedup, no watermark.** Bronze keeps *everything* exactly as Ace returned it,
including the boundary overlap (quirk #6) and any drift. Dedup happens later, in silver.

```sql
INSERT INTO my_db.bronze_gps_raw
SELECT *, 'ace:<chat-uuid>', now(), 'ace_csv', 'gs://…/<uuid>….csv'
FROM read_csv_auto('<signed url>', all_varchar=true);
```

> The append stamps **4 provenance values** (`_batch_id`, `_loaded_at`, `_source_channel`, `_source_uri`)
> to match the 4 provenance columns in the bronze DDL above. **Brownfield note:** an *earlier* version of
> this guide also added a per-row `_source_db` column; that's been removed (one database per source already
> records identity — see §isolate). If you have a pre-existing bronze table from that version, the `SELECT
> *, …4 values` here will hit a column-count mismatch — drop the stale column once and the append matches:
> `ALTER TABLE <bronze table> DROP COLUMN IF EXISTS _source_db;` (apply to every bronze/silver/gold table
> that has it). Treat `_source_db` as if it never existed going forward.

## Deriving silver from bronze (the workhorse)

Silver is **always** a deterministic projection of bronze — type-cast + strip ` UTC` + dedup on the
natural key. Re-running adds only newer rows (watermark advances), so it's idempotent and safe to
retry. This is the one path for facts; there is no "load silver straight from the URL."

> **Large facts: derive per shard / per day, not one-shot.** A single `INSERT … DISTINCT ON …` over a
> very large bronze can exceed the host's tool timeout — observed on `status_data` (ChatGPT/MCP,
> 2026-06-29): a one-shot deduped derive over **23.15M** rows timed out at 55 s, while **per-shard**
> inserts (one statement per shard) succeeded. **Bound each derive by `_source_uri`** (the shard's
> `gs://…` object path — genuinely per-shard) **or by an event-time day** (`WHERE
> replace(GpsDateTime,' UTC','')::TIMESTAMP >= '<day>' AND < '<day+1>'`). **Do *not* filter by
> `_batch_id`**: every shard of one Ace export shares the *same* `_batch_id` (the chat id), so a
> `WHERE _batch_id = '<shard>'` matches all shards or none. So for high-volume facts (StatusData
> especially), **load each Ace CSV shard to bronze, then derive silver one shard (or one day) per
> statement** — same projection, bounded per call. The anti-join / `DISTINCT ON` still dedups across
> shards.
>
> **Housekeeping:** make the **silver fact itself deduped** — don't ship an un-deduped `status_data`
> plus a separate `status_data_dedup` (observed on Vegas: `status_data` had 605 duplicate `StatusId`s
> and a `status_data_dedup` *view* sat on top to fix it). Fold the dedup into the base table (the
> `QUALIFY row_number() OVER (PARTITION BY <natural key> …) = 1` projection) and drop the helper. Drop
> staging/probe scratch (`*_stage_tmp`, `*_probe*`) once the load lands.
>
> **Before `DROP`/`RENAME`, check table vs view** (`information_schema.tables.table_type` /
> `duckdb_views()`). A `_dedup`/`_clean` sibling is often a **view** over the base table — dropping the
> base breaks it, and `ALTER TABLE … RENAME` errors on a view. (And MotherDuck doesn't implement
> `ALTER TABLE … SET SCHEMA`.) If you do drop the wrong silver table, it's fine: **re-derive it from
> bronze** — that's the replay guarantee. (Verified live: dropped `silver.status_data`, rebuilt it
> deduped from `bronze.status_data_raw` with zero data loss.)

```sql
INSERT INTO my_db.planet_gps_pings
  (DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed)
SELECT DISTINCT ON (DeviceId, replace(GpsDateTime,' UTC','')::TIMESTAMP)   -- dedup on the NORMALIZED key
       DeviceId, DeviceName, DeviceTimeZoneId,
       Latitude::DOUBLE, Longitude::DOUBLE,
       replace(GpsDateTime, ' UTC', '')::TIMESTAMP,    -- explicit parse from raw VARCHAR
       Speed::BIGINT
FROM my_db.bronze_gps_raw b
WHERE replace(GpsDateTime,' UTC','')::TIMESTAMP > (SELECT coalesce(max(GpsDateTime), TIMESTAMP '1970-01-01') FROM my_db.planet_gps_pings);
```

> **Dedup on the parsed timestamp, not the raw string.** Bronze mixes batches with different
> formatting — the `ace_csv` batch carries the literal ` UTC` suffix (`…40.423 UTC`) while the
> `bootstrap_from_silver` batch has clean strings (`…40.423`). Those are the *same instant* but
> *different text*, so `DISTINCT ON (DeviceId, GpsDateTime)` on the raw VARCHAR keeps both
> (verified: **679,581** rows — dupes survive), while `DISTINCT ON` over
> `replace(GpsDateTime,' UTC','')::TIMESTAMP` collapses them (verified: **679,577** — correct).

> Verified live: the rebuilt bronze (684,456 raw rows across GPS/trips/exceptions) re-derives to
> **exactly** 679,577 / 2,907 / 1,968 silver rows. Because silver is a pure function of bronze, you
> can `TRUNCATE` silver and rebuild it from scratch any time (drop the watermark filter for a full
> rebuild). That round-trip *is* the proof your lineage is real.

### Full rebuild from bronze (replay)

When your typing/dedup logic changes, or to prove lineage, rebuild silver from bronze with no
watermark — same projection, all of bronze:

```sql
TRUNCATE my_db.planet_gps_pings;
INSERT INTO my_db.planet_gps_pings
  (DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed)
SELECT DISTINCT ON (DeviceId, replace(GpsDateTime,' UTC','')::TIMESTAMP)
       DeviceId, DeviceName, DeviceTimeZoneId,
       Latitude::DOUBLE, Longitude::DOUBLE,
       replace(GpsDateTime,' UTC','')::TIMESTAMP, Speed::BIGINT
FROM my_db.bronze_gps_raw;
```

> **Exception — `Trip` is a *mutable* fact and does NOT replay like this.** The GPS rebuild above is a
> pure `DISTINCT ON (natural key)` projection because GPS rows are immutable. Trips get **re-split** (a
> `DriverChange` / late GPS gives the same drive a new `TripId`), so bronze holds *both* the retired and
> the current id — a `DISTINCT ON (TripId)` replay would resurrect the retired ones. Rebuild trips by
> deduping on the **stable drive key `(DeviceId, trip_start_utc)`, latest-loaded wins** — see
> [`INCREMENTAL_BACKFILL.md`](INCREMENTAL_BACKFILL.md) §D "Replaying trips from bronze". (Immutable facts —
> GPS, status, exceptions — use the plain projection here.)

### Anti-join derive — for backfill / non-monotonic batches

For backfills or overlapping windows where a single timestamp watermark isn't safe, dedup silver
against itself on the natural key instead:

```sql
INSERT INTO my_db.planet_gps_pings
  (DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed)
SELECT DISTINCT ON (b.DeviceId, replace(b.GpsDateTime,' UTC','')::TIMESTAMP)
       b.DeviceId, b.DeviceName, b.DeviceTimeZoneId,
       b.Latitude::DOUBLE, b.Longitude::DOUBLE,
       replace(b.GpsDateTime,' UTC','')::TIMESTAMP, b.Speed::BIGINT
FROM my_db.bronze_gps_raw b
WHERE NOT EXISTS (
  SELECT 1 FROM my_db.planet_gps_pings t
  WHERE t.DeviceId = b.DeviceId
    AND t.GpsDateTime = replace(b.GpsDateTime,' UTC','')::TIMESTAMP
);
```

Natural keys per entity are in [`ENTITY_CATALOG.md`](ENTITY_CATALOG.md). The watermark derive is
faster (no full-table probe) for steady daily loads; the anti-join is bullet-proof for backfill.

## Brownfield: bootstrapping bronze under an existing silver

> **Partial / resumable bootstrap.** Re-running against a target that already has *some* tables is normal
> and safe — bootstrap is resumable. Observed (ChatGPT/MCP, 2026-06-29): **resuming a prior interrupted
> run** (the operator reused the existing DB), `silver.dim_device` was already populated (50) while
> `bronze.gps_raw`/`silver.planet_gps_pings` were still empty (the fact load hadn't completed). The right
> move: **`CREATE TABLE IF NOT EXISTS` only, never `CREATE OR REPLACE` silver during bootstrap** —
> preserve the dimension, create bronze, continue the fact load, then run the population checks. (If the
> *fact* silver pre-exists without a bronze, do the one-time reconstruction below.)
>
> **Schema drift on a pre-existing table — `IF NOT EXISTS` gives you the OLD schema, not the recommended
> one.** Confirmed (ChatGPT/MCP, 2026-06-29): a reused `silver.planet_gps_pings` had only the 7 data
> columns and lacked a provenance column the `INSERT` referenced, so it failed with a `Binder Error: …
> does not have a column …`. **Before inserting into any pre-existing table, `list_columns` it and add
> what's missing** — never `CREATE OR REPLACE` to "fix" the schema:
> ```sql
> ALTER TABLE silver.planet_gps_pings ADD COLUMN IF NOT EXISTS _first_loaded_at TIMESTAMP;
> ```

If silver already exists but bronze doesn't (the "muddy middle" — silver was loaded directly from the
URL before bronze was a rule), reconstruct bronze from silver **once**, clearly labeled, so silver
becomes fully rebuildable from bronze going forward:

```sql
-- 1. Create the bronze shell (all_varchar) if it doesn't exist (see DDL above).
-- 2. Backfill it from the existing silver, stamped as a one-time bootstrap batch:
INSERT INTO my_db.bronze_gps_raw
SELECT DeviceId::VARCHAR, DeviceName::VARCHAR, DeviceTimeZoneId::VARCHAR,
       Latitude::VARCHAR, Longitude::VARCHAR,
       GpsDateTime::VARCHAR, Speed::VARCHAR,           -- cast back to text (lossless landing contract)
       'bootstrap_from_silver:2026-06-29',             -- _batch_id (the day you bootstrapped)
       now(), 'bootstrap_from_silver', 'reconstructed-from-silver'
FROM my_db.planet_gps_pings;
```

After this, every fresh Ace pull appends to bronze as `_source_channel='ace_csv'` /
`_batch_id='ace:<chat-uuid>'`, and silver is a pure projection of the union. Verify the round-trip:
re-deriving bronze → silver must reproduce silver's exact distinct-natural-key count before you trust
the lineage.

> Live result on `my_db`: bronze GPS holds two batches — `bootstrap_from_silver` (522,162 rows, the
> legacy history) and `ace_csv` (157,419 rows, the live window). Their union is 679,581 raw rows;
> deriving bronze → silver collapses the 4 boundary-second dupes to **679,577** — exactly the silver
> count that existed before bronze, proving the reconstruction is faithful.

### Column mismatch? Fix it in the derive, not the landing (quirk #7/#8)

Bronze always lands raw with whatever names/case Ace returned (`all_varchar`, no mapping). You
reconcile the drift **when you derive silver** — alias by position so a rename can't silently drop a
column:

```sql
-- Suppose this batch's bronze columns are ["UTC_GpsTimestamp","DeviceId","Latitude","Longitude"]
INSERT INTO my_db.planet_gps_pings (DeviceId, Latitude, Longitude, GpsDateTime)
SELECT DISTINCT ON (DeviceId, replace(UTC_GpsTimestamp,' UTC','')::TIMESTAMP)
       DeviceId, Latitude::DOUBLE, Longitude::DOUBLE,
       replace(UTC_GpsTimestamp,' UTC','')::TIMESTAMP
FROM my_db.bronze_gps_raw
WHERE replace(UTC_GpsTimestamp,' UTC','')::TIMESTAMP
      > (SELECT coalesce(max(GpsDateTime), TIMESTAMP '1970-01-01') FROM my_db.planet_gps_pings);
```

> Always `coalesce(max(...), TIMESTAMP '1970-01-01')` the watermark — on an empty silver table
> `max()` is `NULL` and `ts > NULL` is unknown for every row, so the **first derive would silently
> insert 0 rows**. (The main derive above already guards this; match it everywhere.)

Because the raw shape is preserved in bronze, you can re-derive with corrected mapping later without
re-pulling from Ace. Use DuckDB's `INSERT INTO tbl BY NAME SELECT …` when names match but order differs.

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
available.) Analytics recipes are deliberately not part of this engineering skill — with one
exception below, because it's an *enrichment of the mirror itself*.

### Gold pattern: locating StatusData/FaultData events (`ASOF JOIN`)

`StatusData` and `FaultData` rows carry **no coordinates** (verified 2026-07-02:
`silver.status_data` on the live mirror has device/diagnostic/value/timestamps only). "Where did this
fault/reading happen?" is answered by borrowing the position from the device's GPS stream. Geotab's
official API Adapter dedicates two background services to this interpolation; in DuckDB it's **one
`ASOF JOIN`** — nearest ping at-or-before the event, per device:

```sql
CREATE OR REPLACE TABLE gold.status_data_located AS
SELECT ev.*, g.Latitude, g.Longitude, g.Speed AS gps_speed,
       ev.StatusDateTime - g.GpsDateTime AS position_age
FROM silver.status_data ev
ASOF LEFT JOIN silver.planet_gps_pings g
  ON ev.DeviceId = g.DeviceId AND ev.StatusDateTime >= g.GpsDateTime;
```

**Validated 2026-07-02 on `geotab_Demo_fh_vegas4`** (one full day, 2026-06-15: 822,203 status events
vs 7.86M pings): **100% of events matched** a same-device prior ping, median event→ping gap **2 s**,
p95 **23 s**, max ~21 min (a parked/offline device — its last known position, which is usually the
right answer anyway). Ledger row + probe **P17** in [`EVIDENCE_LOG.md`](EVIDENCE_LOG.md).

Rules that keep it honest:

- **This is gold, not silver.** The joined position is *derived*, so it lives in a clearly-named gold
  object rebuilt from silver on a schedule — never write inferred coordinates into the silver fact
  (Non-negotiable #14 territory: silver mirrors the source, and the source has no coordinates here).
- **Keep `position_age`** so consumers can filter to their own tolerance (e.g. `<= INTERVAL 5 MINUTE`
  for "at this location" claims); an `ASOF LEFT JOIN` keeps unmatched events with NULL position.
- **Late GPS is real** (it's what re-splits trips), so events near your load watermark may match a
  stale ping now and a closer one after the next GPS load — rebuilding the mart each run after GPS
  loads self-heals this (the adapter waits a configurable buffer, default 24 h, for the same reason).
- Filter both sides to the window you need before joining if you don't want the full-history rebuild;
  the day-sized validation ran in seconds on ~24M-row silver.
