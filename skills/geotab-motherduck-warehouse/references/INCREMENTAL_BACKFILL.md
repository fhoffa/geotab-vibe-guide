# Incremental loads & the three kinds of backfill

How the warehouse grows over time without gaps or duplicates — the operational core of the skill.
"Backfill" is overloaded; people mean three *different* operations by it. **Name which one you're doing
before you start**, because the detection, the load, and the "done" condition differ:

| # | The ask, in plain words | Direction | Detect the scope with | Load with | Done when |
|---|--------------------------|-----------|------------------------|-----------|-----------|
| **A. Forward catch-up** | "get me all the data missing **forward**" (steady daily run, or catch up after downtime) | watermark → now | `now() − max(event_time)` per table | watermark derive (the daily loop) | freshness < your cadence |
| **B. Historical recovery** | "I know we have lots of data, but there's **more past data to recover**" | oldest row → an earlier target | `min(event_time)` vs `target_start` | windowed walk backward + anti-join | `min(event_time)` reaches `target_start` |
| **C. Cross-channel reconciliation** | "re-check our mix of **`Get` + Ace** pulls isn't **missing rows**" | interior holes & channel disagreements | gap detection **+** cross-channel counts | targeted window/device re-pull + anti-join | gap scan clean **and** channels agree |

A and B move the *frontiers* (newest / oldest). C fills holes *between* them and reconciles the
**populations** the different channels return. You usually run them in that order: catch up forward,
extend the past you need, then reconcile what's actually inside.

## The state table (shared by all three)

Track every load so you can derive watermarks, detect gaps, resume, and audit. Created and validated live:

```sql
CREATE TABLE IF NOT EXISTS my_db.warehouse_ingest_log (
  run_id          UUID      DEFAULT uuid(),
  target_table    VARCHAR   NOT NULL,
  source_db       VARCHAR   NOT NULL,
  source_channel  VARCHAR   NOT NULL,      -- 'ace_csv' | 'direct_get' | 'bootstrap_from_silver'
  backfill_kind   VARCHAR,                 -- 'forward' | 'historical' | 'reconcile' (which of the 3)
  watermark_from  TIMESTAMP,               -- lower bound of the window requested
  watermark_to    TIMESTAMP,               -- max event-time actually loaded
  rows_loaded     BIGINT,
  source_uri      VARCHAR,                 -- gs:// object path (NOT the signed query string)
  loaded_at       TIMESTAMP DEFAULT now()
);
```

```sql
INSERT INTO my_db.warehouse_ingest_log
  (target_table, source_db, source_channel, backfill_kind, watermark_from, watermark_to, rows_loaded, source_uri)
VALUES
  ('planet_gps_pings','demo_fh4','ace_csv','forward',
   TIMESTAMP '2026-06-26 01:42:40.779', TIMESTAMP '2026-06-29 18:45:58.658',
   157415, 'gs://planet-user-results-prod-eu/<uuid>-000000000000.csv');
```

The watermark can come from the **data** (`max(event_time)`) or the **log** (`max(watermark_to)`).
The data table is the source of truth; the log is for observability, resumption, and gap reasoning.

---

## A. Forward catch-up — "get me everything missing forward"

The frontier-advancing case: from the newest row you have up to *now*. This is both the **steady-state
daily run** and the **catch-up after downtime** (same procedure; a wider window).

For each fact table, run the loop (pseudocode the agent executes with MCP calls):

```
for table in [planet_gps_pings, trips, status_data, exception_events]:   # silver names
  1. watermark = MotherDuck:  SELECT max(<event_time>) FROM my_db.<silver>;
  2. ace_file  = Geotab Ace:  GetAceResults(new_chat=true, database=<db>,
                              prompt="<entity> rows after <watermark> UTC, columns: …")   # ~33–60s
     url, cols = grep(ace_file)                                                            # never inline
  3. probe     = MotherDuck:  DESCRIBE + COUNT/min/max from read_csv_auto(url)             # shape & size check
     if schema mismatch -> map by position in the derive or re-ask; if new_rows==0 -> skip (no append)
  4. land      = MotherDuck (rw): INSERT INTO <bronze> SELECT *, provenance                # append-only, all_varchar
                              FROM read_csv_auto(url, all_varchar=true);                   # lossless, no dedup
  5. derive    = MotherDuck (rw): INSERT INTO <silver> SELECT <typed,deduped>              # deterministic projection
                              FROM <bronze> WHERE <event_time> > coalesce(watermark, '1970-01-01');
  6. log:      INSERT INTO warehouse_ingest_log (…, backfill_kind='forward', …) VALUES (…);
  7. verify:   SELECT count(*), max(<event_time>) FROM my_db.<silver>;
```

- **Idempotent:** re-running the same day appends raw rows to bronze again (bronze keeps everything) but
  the silver derive inserts 0 (watermark already advanced) and dedups on the natural key, so silver is
  unchanged. Safe to retry. (For bronze idempotency too, skip the append when `new_rows==0`, or dedupe
  bronze by `_batch_id` on replay.)
- **After downtime** (missed several days): identical loop — one Ace call with the wider
  `after <old watermark>` window. If that window is huge (days × big fleet), chunk it the same way as
  historical backfill (below) so no single CSV is unwieldy.
- **Cost:** ~33–60 s of Ace time per fact table + a couple fast MotherDuck calls. Dimensions (via `Get`)
  are sub-second; refresh weekly, not daily. **Ordering:** load dimensions first, then facts.
- **Freshness floor:** Ace lags ~1–2 min, so "caught up" means `max(event_time)` within ~2 min of now,
  not exactly now ([`CHANNELS_AND_FRESHNESS.md`](CHANNELS_AND_FRESHNESS.md)).

---

## B. Historical recovery — "there's more past data to recover"

The other frontier: extend *earlier* than your current oldest row. Don't ask Ace for "everything" —
that's slow, may hit caps, and one giant CSV is unwieldy. **Walk backwards in bounded windows:**

```
target_start = 2026-01-01
cursor       = current earliest in table  (SELECT min(<event_time>) …)
while cursor > target_start:
  window_lo = max(cursor - INTERVAL 1 DAY, target_start)
  Ace: "<entity> rows where <event_time> >= <window_lo> and <event_time> < <cursor> UTC, columns: …"
       # repeat <event_time> on BOTH sides — Ace drops a bare "< <cursor>" and returns the whole tail (quirk #12)
  MotherDuck (rw): INSERT INTO <bronze> SELECT *, provenance ('backfill:<window_lo>' as _batch_id)
                   FROM read_csv_auto(url, all_varchar=true);                   # land raw, append-only
  MotherDuck (rw): INSERT INTO <silver> … FROM <bronze> with the ANTI-JOIN dedup  # windows can overlap
  log the window (backfill_kind='historical', watermark_from=window_lo, watermark_to=cursor)
  cursor = window_lo
```

Why windows:
- **Bounded size** per CSV → predictable load, easy retry on the one failed window.
- **Resumable** — the log shows which windows are done; restart from the gap.
- **Respects Ace's date semantics** (quirks #11/#12): inclusive, device-local, with injected partition
  guards. Use explicit UTC bounds and verify the loaded `min/max` against what you asked for.
- Pick window width from density: ~157K GPS rows ≈ 3.7 days across 26 vehicles, so **1 day ≈ 40K rows
  ≈ 3 MB** here — comfortably one CSV. Larger fleets → narrower windows.

After recovery, re-run **reconciliation (C)** to confirm the new history is contiguous, then resume A
from the newest watermark.

---

## C. Cross-channel reconciliation — "are `Get` + Ace missing rows?"

Neither A nor B can see holes *behind the frontier*: a device offline for a day, an Ace window that came
back short, a failed run, or — the big one — **rows a channel never returns because of its default
filters.** Reconciliation is the completeness audit that makes the mirror *provably* whole. Two halves:
**interior gaps** (within a table) and **channel disagreements** (between Ace, `Get`, and the roster).

### C1. Interior gap detection (within the fact table)

**Per-device time gaps (validated live):**

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
> candidate **refill window**. (Some gaps are genuine — a parked vehicle — so confirm before refilling.)

**Thin/empty (device, day) cells** — coverage map:

```sql
SELECT DeviceName, GpsDateTime::DATE AS day, count(*) AS pings
FROM my_db.planet_gps_pings
GROUP BY ALL
HAVING count(*) < 100            -- tune to your expected daily density
ORDER BY day, DeviceName;
```

**Calendar holes** — days with *no* data at all for a device that otherwise reports:

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

### C2. Channel disagreement (the part people forget)

Ace and `Get` return **different populations**, so a table can look internally contiguous yet still be
missing whole devices. Compare across channels:

- **Device population vs the roster (the active-only trap).** Ace defaults to `IsTracked = TRUE`, so the
  fact table can hold far fewer devices than the fleet. Compare to `dim_device` (from `Get`, the exact
  roster):
  ```sql
  SELECT d.id, d.name
  FROM my_db.dim_device d
  LEFT JOIN (SELECT DISTINCT DeviceId FROM my_db.planet_gps_pings) f ON f.DeviceId = d.id
  WHERE f.DeviceId IS NULL;          -- devices in the fleet with NO GPS in the warehouse
  ```
  Measured live: the warehouse held **~25** GPS devices while the fleet has **50**; an Ace pull that
  explicitly said *"include all devices, do not restrict to tracked/active"* returned **47–49**. If this
  query returns rows, your facts were pulled active-only — re-pull the window with the IsTracked
  exclusion lifted (prompt rules in [`ACE_TO_CSV.md`](ACE_TO_CSV.md)).
- **Window row-count vs an independent read.** To check a window isn't short, count it from a bounded
  **`Get LogRecord`** read of the *same* window — **not `GetCountOf`**, which ignores date/device filters
  for facts and returns the whole-table count (16,098,152 for two different windows in testing). See
  [`CHANNELS_AND_FRESHNESS.md`](CHANNELS_AND_FRESHNESS.md).
- **Real-time tail.** Because Ace lags ~1–2 min, the newest sliver may be absent until the next run;
  that's expected, not a gap. Top it up with a small `Get LogRecord` read if you need it now.

### C3. Settle it (the convergence loop)

For each confirmed hole or missing device/window:

```
1. Ace (or Get): pull EXACTLY that window/device — "<entity> for device X where <event_time> in [lo,hi) UTC,
                 include all devices, columns …"     # bounded, surgical
2. INSERT INTO <bronze> … (append-only, _batch_id='reconcile:<lo>')      # land raw
3. INSERT INTO <silver> … FROM <bronze> with the ANTI-JOIN dedup         # add only genuinely-missing rows
4. log (backfill_kind='reconcile', window)
5. re-run C1/C2  →  repeat until the gap scan is clean AND populations agree
```

Always **anti-join** (overlapping windows are expected) and **append to bronze** — never blind-insert,
never re-ask the whole question (Ace is non-deterministic; a full re-ask can replace good data with a
differently-shaped answer). Prefer re-deriving silver from bronze over re-pulling when the raw is
already there. Suspect a whole window is corrupt? Stage-and-swap it atomically — see
[`QUALITY_AND_REPAIR.md`](QUALITY_AND_REPAIR.md).

---

## Health check (run after any of the three)

```sql
SELECT 'planet_gps_pings' AS tbl, count(*) n, count(DISTINCT DeviceId) devices,
       min(GpsDateTime) earliest, max(GpsDateTime) latest
FROM my_db.planet_gps_pings
UNION ALL
SELECT target_table, rows_loaded, NULL, watermark_from, watermark_to
FROM my_db.warehouse_ingest_log ORDER BY tbl;
```
