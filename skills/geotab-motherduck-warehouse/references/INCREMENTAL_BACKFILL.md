# Incremental loads, gap detection & historical backfill

How the warehouse grows over time without gaps or duplicates. This is the operational core of the
skill — the part a user runs "every day."

## The state table

Track every load so you can derive watermarks, detect gaps, and audit. Created and validated live:

```sql
CREATE TABLE IF NOT EXISTS my_db.warehouse_ingest_log (
  run_id          UUID      DEFAULT uuid(),
  target_table    VARCHAR   NOT NULL,
  source_db       VARCHAR   NOT NULL,
  source_channel  VARCHAR   NOT NULL,      -- 'ace_csv' | 'direct_get'
  watermark_from  TIMESTAMP,               -- exclusive lower bound requested
  watermark_to    TIMESTAMP,               -- max event-time actually loaded
  rows_loaded     BIGINT,
  source_uri      VARCHAR,                 -- gs:// object path (NOT the signed query string)
  loaded_at       TIMESTAMP DEFAULT now()
);
```

Log one row per successful load:

```sql
INSERT INTO my_db.warehouse_ingest_log
  (target_table, source_db, source_channel, watermark_from, watermark_to, rows_loaded, source_uri)
VALUES
  ('planet_gps_pings','demo_fh4','ace_csv',
   TIMESTAMP '2026-06-26 01:42:40.779', TIMESTAMP '2026-06-29 18:45:58.658',
   157415, 'gs://planet-user-results-prod-eu/<uuid>-000000000000.csv');
```

The watermark can come from the **data** (`max(event_time)`) or the **log** (`max(watermark_to)`).
The data table is the source of truth; the log is for observability and gap reasoning.

## The daily-run runbook (steady state)

For each fact table, run the 3-call loop. Pseudocode the agent executes with MCP calls:

```
for table in [planet_gps_pings, trips, status_data, exception_events]:
  1. watermark = MotherDuck:  SELECT max(<event_time>) FROM my_db.<table>;
  2. ace_file  = Geotab Ace:  GetAceResults(new_chat=true, database=<db>,
                              prompt="<entity> rows after <watermark> UTC, columns: …")   # ~33–60s
     url, cols = grep(ace_file)                                                            # never inline
  3. probe     = MotherDuck:  DESCRIBE + COUNT/min/max from read_csv_auto(url)             # shape & size check
     if schema mismatch -> transform or re-ask; if new_rows==0 -> skip
     MotherDuck (rw): INSERT … SELECT FROM read_csv_auto(url) WHERE <event_time> > watermark;
  4. log:      INSERT INTO warehouse_ingest_log (…) VALUES (…);
  5. verify:   SELECT count(*), max(<event_time>) FROM my_db.<table>;
```

- **Idempotent:** re-running the same day inserts 0 (watermark already advanced). Safe to retry after a
  failure.
- **Cost:** ~33–60 s of Ace time per fact table + a couple of fast MotherDuck calls. Four fact tables
  ≈ a few minutes. Dimensions (via `Get`) are sub-second; refresh them weekly, not daily.
- **Ordering:** load dimensions first (so joins resolve), then facts.
- **Scheduling:** the user can ask you to "run the warehouse update." If they want it unattended, this
  is a natural fit for a scheduled/cron-style invocation that runs the runbook and reports the
  per-table verify line.

## Gap detection — find the "missing spots"

Watermark loading only ever moves *forward* from the newest row; it can't see holes **behind** the
frontier (a device that was offline, an Ace call that returned a short window, a failed run). Hunt for
them explicitly.

**1. Per-device time gaps (validated live):**

```sql
WITH g AS (
  SELECT DeviceId, DeviceName, GpsDateTime,
         GpsDateTime - lag(GpsDateTime) OVER (PARTITION BY DeviceId ORDER BY GpsDateTime) AS gap
  FROM my_db.planet_gps_pings
)
SELECT DeviceName,
       count(*) FILTER (WHERE gap > INTERVAL 1 HOUR) AS gaps_over_1h,
       max(gap)                                      AS biggest_gap,
       arg_max(GpsDateTime, gap)                     AS gap_ends_at      -- when the device came back
FROM g
GROUP BY DeviceName
HAVING count(*) FILTER (WHERE gap > INTERVAL 1 HOUR) > 0
ORDER BY biggest_gap DESC;
```

> Live result flagged real holes — e.g. `Demo - 05` a **2-day** gap ending `2026-06-29 00:00:17`,
> and `Demo - 15`/`Demo - 35` ~1-day gaps. Each `(gap_ends_at − biggest_gap, gap_ends_at)` is a
> candidate **backfill window**. (Some gaps are genuine — a parked vehicle — so confirm before refilling.)

**2. Thin/empty (device, day) cells** — coverage map:

```sql
SELECT DeviceName, GpsDateTime::DATE AS day, count(*) AS pings
FROM my_db.planet_gps_pings
GROUP BY ALL
HAVING count(*) < 100            -- tune to your expected daily density
ORDER BY day, DeviceName;
```

**3. Calendar holes** — days with *no* data at all for an active device:

```sql
WITH days AS (SELECT unnest(generate_series(DATE '2026-06-18', DATE '2026-06-29', INTERVAL 1 DAY))::DATE AS day),
     devs AS (SELECT DISTINCT DeviceId, DeviceName FROM my_db.planet_gps_pings),
     have AS (SELECT DISTINCT DeviceId, GpsDateTime::DATE AS day FROM my_db.planet_gps_pings)
SELECT d.DeviceName, c.day
FROM devs d CROSS JOIN days c
LEFT JOIN have h ON h.DeviceId = d.DeviceId AND h.day = c.day
WHERE h.day IS NULL
ORDER BY d.DeviceName, c.day;
```

To **fill** a gap, run a bounded Ace pull for exactly that window and load with the **anti-join**
insert (overlapping windows are expected during backfill — see
[`MEDALLION_LOADING.md`](MEDALLION_LOADING.md)).

## Historical backfill (going backwards from day 0)

A fresh warehouse has no history. Don't ask Ace for "everything" — that's slow, may hit caps, and one
giant CSV is unwieldy. **Walk backwards in bounded windows** (a day or a few days each):

```
target_start = 2026-01-01
cursor       = current earliest in table (or "now")
while cursor > target_start:
  window_lo = max(cursor - INTERVAL 1 DAY, target_start)
  Ace: "<entity> rows where <event_time> >= <window_lo> and < <cursor> UTC, columns: …"
  MotherDuck: INSERT … SELECT FROM read_csv_auto(url) with the ANTI-JOIN dedup   # windows can overlap
  log the window into warehouse_ingest_log (watermark_from=window_lo, watermark_to=cursor)
  cursor = window_lo
```

Why windows:
- **Bounded size** per CSV → predictable load, easy retry on the one failed window.
- **Resumable** — the log shows which windows are done; restart from the gap.
- **Respects Ace's date semantics** (quirk #11): inclusive, device-local. Use explicit UTC bounds and
  verify the loaded `min/max` against what you asked for.
- Pick window width from density: ~157K GPS rows ≈ 3.7 days across 26 vehicles, so **1 day ≈ 40K rows
  ≈ 3 MB** here — comfortably one CSV. Larger fleets → narrower windows.

After backfilling, re-run **gap detection** to confirm the history is contiguous, then resume the
forward daily loop from the newest watermark.

### Backfill reliability

- **Ace is non-deterministic** — re-running a window can return a differently-shaped/counted result
  (different source table, `IsTracked` population). So backfill **append-only with the anti-join**
  dedup, never blind-insert, and don't "re-ask the whole thing" to fix a hole — ask for the specific
  missing window. (Full rationale + decision matrix: [`QUALITY_AND_REPAIR.md`](QUALITY_AND_REPAIR.md).)
- **Reconcile each window** against an independent oracle where possible: `GetCountOf <entity>` with
  the same `fromDate`/`toDate` bounds. Exact match isn't expected for Ace facts (active-only filter),
  but a wildly different count means the window is wrong — re-pull before trusting it.
- **Re-pulling a suspect window?** Load into a staging table, validate, then swap it in atomically
  (staging-and-swap pattern in [`QUALITY_AND_REPAIR.md`](QUALITY_AND_REPAIR.md)) so a bad re-pull can
  never corrupt good history.
- **Log every window** into `warehouse_ingest_log` (watermark_from/to) so backfill is resumable and
  you can see which windows are done.

## Health check (run after any load)

```sql
SELECT 'planet_gps_pings' AS tbl, count(*) rows, count(DISTINCT DeviceId) devices,
       min(GpsDateTime) earliest, max(GpsDateTime) latest
FROM my_db.planet_gps_pings
UNION ALL
SELECT target_table, rows_loaded, NULL, watermark_from, watermark_to
FROM my_db.warehouse_ingest_log ORDER BY tbl;
```
