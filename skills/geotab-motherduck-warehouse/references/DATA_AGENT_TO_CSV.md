# Data agent → CSV: extracting bulk Geotab data for the warehouse

The MyGeotab MCP exposes a **data agent**: you ask a fleet question in natural language, it generates
**BigQuery SQL**, runs it, and returns the SQL, a 20-row preview, a row count and a **signed CSV URL** for
the full result. That URL goes straight into MotherDuck. This file is the field guide for doing it reliably.

Tool: `mcp__MyGeotab_MCP__AskDataAgent(database, prompt, delegation_context?, server?)`.

> Measured 2026-10-29/30 on `demo_fh8` (and `demo_fh_vegas8` for the core probes), `my.geotab.com`,
> 50-vehicle Iberia demo fleets — probes P19–P27 in [`EVIDENCE_LOG.md`](EVIDENCE_LOG.md). Point-in-time;
> re-measure on your fleet. Every hazard cited as `Q#` is in [`QUIRKS.md`](QUIRKS.md).

## Mental model

```
AskDataAgent(database, prompt)            ← stateless: no chat id
   → {status, sql, data_preview[≤20 rows], row_count, data_uri, turn_id, freshness{status,message}}   (~5–10 KB)
   → data_uri  ➜ signed GCS CSV (one file, 24 h)  ➜ hand to MotherDuck read_csv_auto()
   → sql       ➜ the query that ran: your pre-load approval gate (read it EVERY load)
   → row_count ➜ reconcile against COUNT(*) of the CSV before deriving silver
```

All of it is plain top-level JSON — nothing to spill to a file or grep. Every call is standalone: rephrase a
follow-up in full, or pass the previous SQL plus what should change in `delegation_context`.

## Step 1 — write the prompt

Specific English is what controls the agent. The GPS, Trips and StatusData prompts below were run as written
on 2026-10-29/30.

```
GPS (GpsLogs):
  List every GPS position log recorded after <WATERMARK> UTC, across all devices. Return these exact
  columns: DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed. Use UTC.
  Do not summarize or aggregate — return the raw position rows. Include every device; do not filter on
  IsTracked, GpsValid, speed, or ignition.

Trips (Trip):
  List individual trips that started after <WATERMARK> UTC. Return these exact columns: DeviceId, TripId,
  trip_start_utc, trip_end_utc, DriverId, TripDistance_Km, TripDuration, IdlingDuration. Use UTC. Raw rows,
  no aggregation, no unit conversion, no derived columns. Include every device; do not filter on IsTracked.
  # RAW columns only (verified 2026-10-30): TripDuration = trip_end − trip_start in SECONDS; IdlingDuration
  # is SECONDS and can EXCEED TripDuration (1062 s vs 132 s) — the agent's own `(TripDuration −
  # IdlingDuration)/60` went NEGATIVE (Q4). Join device_name from dim_device in silver; derive minutes there.
  # TripId and DriverId are NOT optional: TripId is the key the re-split reconcile (INCREMENTAL_BACKFILL §D)
  # deletes/anti-joins on, and DriverId carries the driver assignment (UnknownDriverId when none).
  # Watermark on start with a lookback L ≥ your longest expected trip (trips are re-split; a long trip can
  # materialize after a later trip advanced the watermark). The anti-join dedups the overlap.

Engine/sensor (StatusData):
  From the StatusData table (raw readings, not the Diagnostic catalog), list all readings between <LO> UTC
  and <HI> UTC. Return exactly: DeviceId, DiagnosticId, Data, UTC_StatusTimestamp. Raw rows, no aggregation,
  no joins. Include every device; do not filter on IsTracked.
  # Name the TABLE (Q6). Ask for DiagnosticId and join names from dim_diagnostic (Get Diagnostic) in the
  # warehouse.

Safety (Events), template only:
  From the Events table (exception events), list events whose active period started after <WATERMARK> UTC.
  Return exactly: DeviceId, EventId, RuleId, ActiveFrom, ActiveTo. Use UTC. Raw rows. Include every device;
  do not filter on IsTracked.
  # The agent's table is `Events`; the Get API calls the same data ExceptionEvent. Verified 2026-10-30 with
  # this exact wording: `FROM Events`, exactly these columns, 980 rows since 2026-10-29 20:00 UTC (an earlier
  # run of the same data: 2,390 rows from 10-28, 0 duplicates, P32). Add the columns your silver exception
  # table needs (read the returned SQL; ask for raw columns, Q4).
```

Rules (each tied to a quirk):
- **Name the table** when the topic is ambiguous — Q6.
- **Always forbid the default population/validity filters** (`IsTracked`, `GpsValid`) — Q1. Unprompted,
  `IsTracked = TRUE` zeroed a fleet whose devices are all `IsTracked = false`.
- **Pin units** ("in kilometers, do not convert units") and **ask for raw rows in UTC** — Q10, Q5.
- **Request raw source columns, derive in silver** — Q4.
- **Specificity beats attached SQL:** name exact columns; treat any SQL you add as a hint, not a contract.
- **Bound the window, and never use future dates.** The tool call times out at ~60 s: StatusData ≤ 1 day (744,965 rows /
  53 MB passed; 2 days timed out), GPS and trips ≤ 1–2 days; retry once — Q8; see
  [`INCREMENTAL_BACKFILL.md`](INCREMENTAL_BACKFILL.md) §timeouts. Future-dated prompts failed with HTTP 502.
- **Check the window you got.** On `freshness: stale`, compare the returned min/max timestamps to the window you
  asked for — the agent can shift it (Q3), notably for `Trip`.
- Asking for a "CSV link" is harmless (columns stay exact) but pointless — the URL always comes back.

## Step 2 — read the response (no parsing)

```
sql        → lint it (QUALITY_AND_REPAIR §2): FROM table, IsTracked/GpsValid/Speed filters, Local_Date,
             VehicleKPI_Daily, GROUP BY, unit factors, derived columns, upper bound = now.
row_count  → compare with SELECT count(*) FROM read_csv_auto('<data_uri>') after landing bronze.
data_uri   → read_csv_auto(..., all_varchar=true) into bronze. Log the gs:// path, never the signature.
row_count 0 / data_uri "" / turn_id -1 → an EMPTY result: investigate, don't treat it as "no data" (Q2).
```

`freshness.status` is `fresh`, `stale` or `unknown` and may carry a message ("Data is still not available for
the requested date range despite adjusting…"). Read the message: `stale` means **your window reaches past the data
the agent has**, and it may have silently answered for an earlier window (Q3: a request for 2026-10-30 trips was
answered for 2026-10-29). It is **not** a verdict on correctness — `stale` also accompanied correct results and a
genuinely empty window, and `fresh` accompanied filter-caused empties (Q2). Always compare returned min/max to the
window you asked for.

Signed URL shape: `https://storage.googleapis.com/ace-cli-sessions-prod-<region>/query-results/<uuid>/turn_<n>.csv?X-Goog-…&X-Goog-Expires=86400`
(**24 h**; the region varies by database — match by shape).

## Step 3 — what the CSV looks like (checked by download, 2026-10-29)

| Check | GPS, 11,599 rows | StatusData, 368,764 rows (26.2 MB) |
|-------|------------------|-----------------------------------|
| Files | 1 | 1 |
| Header vs requested | exact | `Data` → **`DATA`** (Q9) |
| `row_count` vs CSV rows | equal | equal |
| Duplicate rows / duplicate `(Device, ts)` | 0 / 0 | 0 |
| Timestamp text | `GpsDateTime`: naive ISO `2026-10-29T22:00:05.617000` | `UTC_*`: ISO with offset `2026-10-28T00:00:00.151000+00:00` |
| Upper bound of "…and now" | max 23:47:19 vs asked 23:47:35 | n/a |

Land everything `all_varchar` in bronze and parse in the derive (`TRY_CAST`); keep the natural-key dedup
(Q7) as insurance.

## Delegation (follow-ups)

`delegation_context` takes "the previous SQL + what should change" or output-shaping notes. It works, but the
agent re-derives its own partition guards (a wider `GpsDateTime >= DATETIME('2026-10-28')` appeared), so the
follow-up's SQL is **not** the previous SQL with your edit — read it again. Prefer restating the whole prompt;
use `delegation_context` for output shaping.

## Performance & freshness (observed)

- Envelope ~5–10 KB. The MCP gives no timing, so latency was measured by bracketing calls with clock readings and
  subtracting turn overhead (±3 s, one run each): the four small aggregate questions from the vibe guide's benchmark took
  **about 6–10 s each** (P37). Large exports take longer; all calls but a handful returned inside the 60 s tool limit.
- GPS pipeline lag ≈ **16–25 s** (two samples: latest point vs wall clock at query time).
- Four simultaneous calls all succeeded; stay modest.

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `status: success`, `row_count: 0`, `data_uri: ""`, `turn_id: -1` | injected filter or wrong source — NOT "no data" | read `sql`; re-ask forbidding the filter (Q1, Q2) |
| 0 vehicles / 0 trips on a demo fleet | `IsTracked = TRUE` + `Device_ActiveTo >= now` | forbid `IsTracked`; don't restrict by ActiveFrom/To |
| catalog-looking rows (diagnostic names) instead of readings | intent routed to `Diagnostic` | name the table `StatusData`; ask for `DiagnosticId` (Q6) |
| HTTP 502 `data_agent_query_failed` / "Try rephrasing" | transient agent failure | retry once, then rephrase (Q8) |
| tool timed out after 60 s | window too big, or a load spike (same prompt passed on retry) | retry once; then halve the window (Q8) |
| `freshness: "stale"` + message | window reaches past the data (the `Trip` table lagged ≥ 1 h 44 min); the agent may have answered for another window (Q3) | compare returned min/max to the asked window; re-ask a window it covers; check completeness with `Get` |
| HTTP 502 "Failed to generate a valid query" | future-dated prompt (2/2) | remove future dates; ask "after <past date>" or an open-ended past window (Q8) |
| miles instead of km / `Local_Date` / `VehicleKPI_Daily` in the SQL | pre-aggregated rollup chosen (Q10, Q5) | ask for raw rows in UTC, pin km |
| `DATA` instead of `Data` | case drift (Q9) | key by the CSV header, alias in the derive |
| negative `driving_duration_minutes` | agent-derived `TripDuration − IdlingDuration` (Q4) | ask for raw `TripDuration`/`IdlingDuration`, derive in silver |
| `-32601 … Database '<x>' was not found on my.geotab.com` | wrong DB name (MotherDuck name ≠ Geotab name) or another server | use the MyGeotab login name; pass `server` for gov/other hosts (Q13) |
| `read_csv_auto` 403 / expired | URL older than ~24 h | re-run the ask to mint a fresh URL |
