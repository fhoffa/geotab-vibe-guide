# Pipeline quality tests, predicting problems, and repair strategy

A warehouse is only as good as your trust in it. This file covers (1) the quality tests to run after
every load, (2) how to **predict** problems by reading Ace's generated SQL, (3) the crucial distinction
between *SQL* problems and *result* problems, and (4) how to repair — re-ask vs. patch the gap.

Everything here was exercised live on the `my_db` warehouse built from `demo_fh4`, **2026-06-29**. The
"Live result" figures are point-in-time observations — re-verify and re-date them when you re-run.

## 1. Pipeline quality tests

Run these after each load and record pass/fail. They are cheap reads. Real results from the live
warehouse are shown so you know what "good" looks like (and what slips through).

| Test | What it catches | Live result |
|------|-----------------|-------------|
| **Uniqueness** on natural key | dupes the watermark can't stop | **found 96** dupes in `planet_gps_pings` (pre-existing) → repaired to 0 |
| **Bounds** lat∈[-90,90], lng∈[-180,180], speed≥0 | corrupt coordinates, bad sensors | 0 bad |
| **Not-null** on key columns (DeviceId, event-time) | dropped/blank keys | 0 null |
| **No future rows** (`event_time <= now()`) | clock/timezone bugs, bad parse | 0 future |
| **Freshness** `now() - max(event_time)` | stale pipeline (≠ Ace lag) | measures time since last load; Ace's *own* lag is only ~1–2 min (see [`CHANNELS_AND_FRESHNESS.md`](CHANNELS_AND_FRESHNESS.md)) |
| **Referential integrity** fact.DeviceId ∈ `dim_device.id` | facts for unknown devices | 0 orphans (gps/trips/exc) |
| **Range sanity** trip end ≥ start, duration ≥ 0 | logic/parse errors | 0 bad |
| **Row-count plausibility** vs historical daily mean | silent under/over-pull | compare to prior runs in `warehouse_ingest_log` |

Copy-paste battery (returns one row per check; non-zero = investigate):

```sql
SELECT 'gps: dupes on (DeviceId,GpsDateTime)' AS check,
       (count(*) - count(DISTINCT DeviceId||'|'||GpsDateTime::VARCHAR))::VARCHAR AS value FROM my_db.planet_gps_pings
UNION ALL SELECT 'gps: bad coords',
       count(*) FILTER (WHERE Latitude NOT BETWEEN -90 AND 90 OR Longitude NOT BETWEEN -180 AND 180)::VARCHAR FROM my_db.planet_gps_pings
UNION ALL SELECT 'gps: negative speed', count(*) FILTER (WHERE Speed < 0)::VARCHAR FROM my_db.planet_gps_pings
UNION ALL SELECT 'gps: null natural key', count(*) FILTER (WHERE DeviceId IS NULL OR GpsDateTime IS NULL)::VARCHAR FROM my_db.planet_gps_pings
UNION ALL SELECT 'gps: future rows', count(*) FILTER (WHERE GpsDateTime > now())::VARCHAR FROM my_db.planet_gps_pings
UNION ALL SELECT 'gps: freshness hours', round(date_diff('minute', max(GpsDateTime), now())/60.0,1)::VARCHAR FROM my_db.planet_gps_pings
UNION ALL SELECT 'trips: device not in dim', count(DISTINCT t.DeviceId) FILTER (WHERE d.id IS NULL)::VARCHAR
       FROM my_db.trips t LEFT JOIN my_db.dim_device d ON d.id=t.DeviceId;
```

**Cross-source reconciliation (the strongest test) — but pick the right oracle.** `GetCountOf` here is
the **Get API** method (`mcp__Geotab_MCP__GetCountOf`), **not** Ace/`GetAceResults`. It is an
exact oracle **only for dimensions**: `GetCountOf Device = 50` and `dim_device = 50` ✓. For
high-volume **facts it is useless as a windowed check — it ignores the date/device search entirely**:
two different `LogRecord` windows for one device both returned **16,098,152** (the whole table), and a
`Trip` window returned **1,388,687** (all trips). So `GetCountOf LogRecord` answers "how many logs
exist in total," not "how many in my window." To reconcile a fact window, **count rows from a bounded
`Get` read of the same window** (e.g. `Get LogRecord` with `deviceSearch`+`fromDate`/`toDate`), or
compare Ace against the warehouse silver — never against `GetCountOf`. (And if two Ace runs of the
"same" question disagree, suspect a **different source table**, not random drift — an identical prompt
was stable at 49 across 3 runs while a re-phrasing answered 47 from `Trip`; see §4 and
[`CHANNELS_AND_FRESHNESS.md`](CHANNELS_AND_FRESHNESS.md). Read the returned SQL to tell which.)

**Record results.** Add a `warehouse_quality_checks(run_id, check, value, passed, checked_at)` table
(or extend `warehouse_ingest_log`) so you get a time series and can alert on regressions.

## 2. Predict problems by reading Ace's generated SQL

The Ace MCP response contains the **SQL Ace actually ran** (grep it from the spilled file — see
[`ACE_TO_CSV.md`](ACE_TO_CSV.md)). Reading it is a *pre-load* quality gate: most semantic problems are
visible in the SQL before you ever look at a row. Lint the SQL for:

| Look for in the SQL | Predicts | Example we saw |
|---------------------|----------|----------------|
| `FROM` source table | wrong grain/source | `VehicleKPI_Daily` (pre-agg rollup) when you wanted raw `LogRecord` → distances won't match haversine |
| `IsTracked = TRUE`, `Device_ActiveTo >= CURRENT_DATETIME()` | missing devices | active-only → 26 devices in GPS vs 50 in the fleet |
| `Local_Date` / `DeviceTimeZoneId` in `WHERE` | timezone drift | device-local dates, not your UTC watermark |
| `BETWEEN lo AND hi` | inclusive bounds | both ends included → boundary-day overlap/dupes |
| `GROUP BY` / aggregate fns | you got rollups | a "raw rows" request silently aggregated |
| unit math (`/1609.34`, `*1.609`) | unit surprises | miles computed internally, km returned |
| column aliases | rename/case drift | `day`→`DAY`; default schema `UTC_GpsTimestamp` |

If the SQL is wrong for your intent, **no amount of downstream cleanup fixes it** — the data is the
wrong shape. Re-ask (section 4). If the SQL is right, trust it and move to result-level checks.

## 3. Is the problem the SQL, or the results? (two failure classes)

This is the key mental split:

**Class A — semantic / SQL problems.** Ace built a different query than you intended: wrong source
table, active-only filter, device-local dates, inclusive range, unwanted aggregation, unit conversion.
- **Systematic** (the same "wrong" applies to every row), and **predictable by reading the SQL**.
- **Fix by re-asking** with sharper wording (pin columns, "raw rows, do not aggregate", "Use UTC",
  a precise lower bound). Cleaning the output won't help — the rows are the wrong shape/population.

**Class B — result / data problems.** The query was fine but the *output* needs handling: the ` UTC`
suffix, second-precision boundary overlap (quirk #6), omitted nulls (quirk #4), schema/case drift in
the `columns` array (quirk #7/#8), a short/partial window, or accumulated dupes from prior loads.
- **Caught by inspecting output** (DESCRIBE, counts, min/max, the uniqueness test).
- **Fix in the load** (cast, dedup, watermark/anti-join, column mapping) — re-asking won't change it.

> Diagnosis order: **read the SQL → classify**. Class A → re-ask. Class B → fix in the load.
> The live 96-dupe case was Class B (and pre-existing) — repaired in SQL, no re-ask needed.

## 4. Repair: re-ask the same question, or ask for the gap and patch?

Ace's **source-table selection is not guaranteed** — re-asking a question (especially re-phrased) can
land on a different `FROM` and return differently-shaped/counted data. Observed 2026-06-29: a
"distinct GPS devices" question gave 49 from `GpsLogs` on 3 identical runs but 47 from `Trip` when
re-phrased with an attached SQL (which it ignored); separately the engine chose `VehicleKPI_Daily` for a
distance ask. (An *identical* prompt was stable; it's the *selection* across phrasings that varies.) Continue-chat
also showed it re-resolving context each turn). That reality drives the strategy:

| Situation | Most reliable action | Why |
|-----------|---------------------|-----|
| Transient failure (no `chat_id`, empty, timeout) | **Re-ask the same question**, retry w/ backoff | nothing loaded yet; idempotent to retry |
| Class A semantic mismatch | **Re-ask with corrected wording** | the data shape is wrong; only a new query fixes it |
| Known missing rows / a gap (Class B coverage) | **Ask only for the missing window**, land in bronze, derive silver with anti-join | surgical, cheap, idempotent; doesn't disturb good data |
| Suspect a whole window is bad | **Re-pull that window into staging, validate, then swap** | a bad re-pull can't corrupt the live table |
| Wrong typing/dedup logic, or accumulated dupes in silver | **Re-derive silver from bronze** (the raw is still there) | bronze is the system of record; rebuild the projection, no re-ask needed |
| Type errors you can't fix from bronze | **Repair in SQL** (cast), don't touch Ace | it's a result problem; re-asking changes nothing |

**Prefer "ask for the missing data and patch" over "re-ask the whole thing."** Because Ace varies
between runs, a full re-ask risks *replacing good data with a differently-shaped answer*. A bounded
"give me rows in window X" + **anti-join** load only adds what's truly missing and is safe to repeat.

**Repair patterns (validated):**

Re-derive from bronze (the preferred fix for *any* silver-side problem — dupes, wrong cast, changed
dedup logic). Bronze is the system of record, so you rebuild the projection instead of touching Ace:

```sql
TRUNCATE my_db.planet_gps_pings;
INSERT INTO my_db.planet_gps_pings
  (DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed)
SELECT DISTINCT ON (DeviceId, replace(GpsDateTime,' UTC','')::TIMESTAMP)   -- normalized key (mixed batch formats)
       DeviceId, DeviceName, DeviceTimeZoneId, Latitude::DOUBLE, Longitude::DOUBLE,
       replace(GpsDateTime,' UTC','')::TIMESTAMP, Speed::BIGINT
FROM my_db.bronze_gps_raw;
```

In-place dedup (only if you have *no* bronze — e.g. a pre-medallion table; what we ran once to remove
exactly 96 excess rows, kept one per key):

```sql
DELETE FROM my_db.planet_gps_pings
WHERE rowid IN (
  SELECT rowid FROM (
    SELECT rowid, row_number() OVER (PARTITION BY DeviceId, GpsDateTime ORDER BY rowid) AS rn
    FROM my_db.planet_gps_pings
  ) WHERE rn > 1
);
```

Anti-join gap patch (add only missing rows from a re-pulled window — safe to re-run). Land raw in
bronze first, then derive silver from it so the patch is replayable like everything else:

```sql
-- 1. land the re-pulled window in bronze (append-only)
INSERT INTO my_db.bronze_gps_raw
SELECT *, 'backfill:<window_lo>', now(), 'demo_fh4', 'ace_csv', 'gs://…/<uuid>….csv'
FROM read_csv_auto('<window url>', all_varchar=true);
-- 2. derive only the genuinely-missing rows into silver
INSERT INTO my_db.planet_gps_pings (DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed)
SELECT DISTINCT ON (b.DeviceId, replace(b.GpsDateTime,' UTC','')::TIMESTAMP)
       b.DeviceId, b.DeviceName, b.DeviceTimeZoneId, b.Latitude::DOUBLE, b.Longitude::DOUBLE,
       replace(b.GpsDateTime,' UTC','')::TIMESTAMP, b.Speed::BIGINT
FROM my_db.bronze_gps_raw b
WHERE NOT EXISTS (SELECT 1 FROM my_db.planet_gps_pings t
                  WHERE t.DeviceId=b.DeviceId AND t.GpsDateTime=replace(b.GpsDateTime,' UTC','')::TIMESTAMP);
```

Staging-and-swap (atomic replacement of a suspect window — a bad re-pull never touches live data):

```sql
CREATE OR REPLACE TABLE my_db._stg_gps AS SELECT * FROM read_csv_auto('<window url>');
-- validate _stg_gps (counts, bounds, schema) ...
BEGIN;
DELETE FROM my_db.planet_gps_pings WHERE GpsDateTime >= <lo> AND GpsDateTime < <hi>;
INSERT INTO my_db.planet_gps_pings SELECT DeviceId,DeviceName,DeviceTimeZoneId,Latitude,Longitude,GpsDateTime,Speed FROM my_db._stg_gps;
COMMIT;
DROP TABLE my_db._stg_gps;
```

## 5. Operational resilience

- **`query_rw` can drop mid-call** (we hit a "permission stream closed" during a CTAS). Always make
  writes **idempotent and re-runnable**: `CREATE OR REPLACE` / `CREATE TABLE IF NOT EXISTS` for
  silver/gold/staging (**never `CREATE OR REPLACE` bronze** — it's append-only), watermark/
  anti-join inserts. After a failure, **re-check with `list_tables`/a `COUNT(*)`** before retrying —
  don't assume it didn't run.
- **Load CSVs within ~24h** (signed URL expiry). If a repair spans days, re-mint the URL per window.
- **Wrap multi-statement repairs in a transaction** so a partial failure rolls back.

See also: [`INCREMENTAL_BACKFILL.md`](INCREMENTAL_BACKFILL.md) for gap detection and windowed backfill,
and [`ACE_TO_CSV.md`](ACE_TO_CSV.md) for grepping the generated SQL out of the response.
