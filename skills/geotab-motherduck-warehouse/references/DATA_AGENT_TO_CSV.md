# Data agent → CSV: extracting bulk Geotab data for the warehouse

The official MyGeotab MCP now exposes a **data agent**: you ask a fleet question in natural language, it
generates **BigQuery SQL**, runs it, returns the SQL + a 20-row preview + a **signed CSV URL** for the
full result. It is the successor to the `GetAceResults` flow documented in [`ACE_TO_CSV.md`](ACE_TO_CSV.md)
(same engine family — same table vocabulary, same LLM-generated-SQL caveats — much slimmer envelope).

Tool: `mcp__MyGeotab_MCP__AskDataAgent(database, prompt, delegation_context?, server?)`.

> **Measured 2026-10-29 on `demo_fh8`** (Geotab DB; 50-vehicle Iberia demo fleet, `my.geotab.com`), 16
> calls — probes P19–P27 in [`EVIDENCE_LOG.md`](EVIDENCE_LOG.md). Point-in-time; re-measure on your fleet.
> Which MCP exposes which tool varies by client — in the connector tested, `GetAceResults` was **not**
> listed; if your client still has it, [`ACE_TO_CSV.md`](ACE_TO_CSV.md) applies unchanged.

## Mental model

```
AskDataAgent(database, prompt)            ← stateless: no chat_id, no new_chat
   → {status, sql, data_preview[≤20 rows], row_count, data_uri, turn_id, freshness{status,message}}   (~5–10 KB)
   → data_uri  ➜ signed GCS CSV (one file, 24 h)  ➜ hand to MotherDuck read_csv_auto()
   → sql       ➜ the query that ran: your pre-load approval gate (read it EVERY load)
   → row_count ➜ reconcile against COUNT(*) of the CSV before deriving silver
```

What changed vs the Ace envelope (all observed): **no 110–190 KB blob** (nothing to spill, grep, or
offload — the SQL, columns and URL are plain top-level JSON fields); the preview is **20 rows**, not 10;
`row_count` is returned (Ace made you count the CSV); the URL is a single string field `data_uri`, not an
array; there is **no `chat_id`** — every call is standalone, so a follow-up is rephrased in full or passed
the previous SQL via `delegation_context`.

## Step 1 — write the prompt

The explicit-English rules from Ace still win; the data agent obeyed every one below on first try.

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
  # RAW columns only (verified 2026-10-30, 20 rows): TripDuration = trip_end − trip_start in SECONDS
  # (1208.937 s for 20:02:14.7→20:22:23.7); IdlingDuration is SECONDS and can EXCEED TripDuration (1062 s vs
  # 132 s) — so the agent's own `(TripDuration − IdlingDuration)/60` went NEGATIVE (quirk #22). Join
  # device_name from dim_device in silver; derive minutes there, deciding what idling means for you.
  # Watermark on start with the lookback L from INCREMENTAL_BACKFILL §D (trips are re-split).

Engine/sensor (StatusData):
  From the StatusData table (raw readings, not the Diagnostic catalog), list all readings between <LO> UTC
  and <HI> UTC. Return exactly: DeviceId, DiagnosticId, Data, UTC_StatusTimestamp. Raw rows, no aggregation,
  no joins. Include every device; do not filter on IsTracked.
  # Name the TABLE. "engine status data readings" was routed to the Diagnostic CATALOG (120 rows, success).
  # Ask for DiagnosticId and join names from dim_diagnostic (Get Diagnostic) in the warehouse.

Safety (ExceptionEvent):
  List exception events that occurred after <WATERMARK> UTC. Return these exact columns: DeviceId,
  device_name, rule_name, active_from_utc, active_to_utc, duration_seconds. Use UTC. Raw rows.
  # not re-probed 2026-10-29 — still the v1.1 prompt; read the returned SQL and reconcile.
```

Rules (each tied to a quirk in the catalog):
- **Name the table** when the topic is ambiguous (`StatusData`, `GpsLogs`, `Trip`) — quirk #15.
- **Always forbid the default population/validity filters** in the prompt: `IsTracked` (#11), `GpsValid` (#14).
  Unprompted, `IsTracked = TRUE` zeroed a demo fleet whose devices are all `IsTracked = false`.
- **Pin units** ("in kilometers, do not convert units") — unpinned distance came back in **miles** from the
  pre-aggregated rollup (#11 + #13).
- **Say "UTC", "raw rows", "do not aggregate"** — as before.
- **Don't fear the word "CSV"/"download link"** — unlike Ace (#8), asking for a link did **not** degrade the
  schema (exact columns honored). You still get the same `data_uri`; just don't rely on it.
- **Bound the window.** The tool call has a **~60 s timeout**: a 2-day StatusData pull and (once) an
  identical trips pull timed out; 12 h of StatusData (368,764 rows, 26 MB) returned fine. Chunk by
  half-day (status) / day (GPS, trips) and retry once on timeout — see
  [`INCREMENTAL_BACKFILL.md`](INCREMENTAL_BACKFILL.md) §timeouts.

## Step 2 — read the response (three fields, no parsing)

```
sql        → lint it (QUALITY_AND_REPAIR §2): FROM table, IsTracked/GpsValid/Speed filters, Local_Date,
             VehicleKPI_Daily, GROUP BY, unit factors, upper bound = now (not CURRENT_DATE()).
row_count  → compare with SELECT count(*) FROM read_csv_auto('<data_uri>') after landing bronze.
data_uri   → read_csv_auto(..., all_varchar=true) into bronze. Log the gs:// path, never the signature.
status/turn_id/data_uri == "" → EMPTY result: row_count 0 and no URL. Treat as a failure to investigate,
             not as "no data" (see quirk #21).
```

`freshness.status` is `fresh` / `unknown` — informational; `unknown` appeared on a catalog lookup.
Signed URL shape: `https://storage.googleapis.com/ace-cli-sessions-prod-us/query-results/<uuid>/turn_0.csv?X-Goog-…&X-Goog-Expires=86400`
(**24 h**; bucket region varies — match by shape).

## Step 3 — what the CSV looks like (checked by download, 2026-10-29)

| Check | GPS 11,599 rows | StatusData 368,764 rows (26.2 MB) |
|-------|-----------------|-----------------------------------|
| Files | 1 | 1 (no sharding at 26 MB) |
| Header vs requested | exact | `Data` → **`DATA`** (case drift, quirk #7) |
| `row_count` vs CSV rows | equal | equal |
| Duplicate rows / dup `(Device, ts)` | 0 / 0 | 0 |
| Timestamp text | `GpsDateTime`: naive ISO `2026-10-29T22:00:05.617000` | `UTC_*`: ISO **with `+00:00`** `2026-10-28T00:00:00.151000+00:00` |
| Upper bound of "…and now" | max 23:47:19 vs asked 23:47:35 (≈16 s) | n/a |

So: **no ` UTC` suffix** any more (quirk #5 changed shape — `read_csv_auto` still parses both forms; keep
parsing via `TRY_CAST` on `all_varchar` bronze). Keep the natural-key dedup anyway — it is free insurance.

## Delegation (follow-ups)

`delegation_context` takes "the previous SQL + what should change" or output-shaping notes. It worked, but
the agent also re-derived its own partition guards (a wider `GpsDateTime >= DATETIME('2026-10-28')`), so
the follow-up's SQL is **not** the previous SQL with your edit — read it again. Prefer restating the whole
prompt; use `delegation_context` for output shaping.

## Performance & freshness (observed)

- Envelope ~5–10 KB (vs 110–190 KB). Wall time per call was not instrumented (the MCP gives no timing);
  all calls except two returned inside the 60 s tool limit — no ~33 s floor was apparent but **don't assume
  there isn't one**; use the same budget as Ace until you measure.
- GPS pipeline lag ≈ **16–25 s** on two samples (latest point vs wall-clock at query time) — in line with
  the "tens of seconds" figure for continuous streams in [`CHANNELS_AND_FRESHNESS.md`](CHANNELS_AND_FRESHNESS.md).
- Parallel calls: 4 simultaneous calls all succeeded (Ace's "don't parallelize" rule not reproduced at n=4;
  stay modest).

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `status: success`, `row_count: 0`, `data_uri: ""`, `turn_id: -1` | injected filter (`IsTracked`) or wrong source — NOT "no data" | read `sql`; re-ask forbidding the filter (#21) |
| 0 vehicles / 0 trips on a demo fleet | `IsTracked = TRUE` + `Device_ActiveTo >= now` | forbid `IsTracked`, don't restrict by ActiveFrom/To |
| catalog-looking rows (diagnostic names) instead of readings | intent routed to `Diagnostic` | name the table `StatusData`; ask for `DiagnosticId` (#15) |
| HTTP 502 `data_agent_query_failed` / "Try rephrasing" | transient agent failure (seen once, passed on identical retry) | retry once, then rephrase |
| `freshness.status: "stale"` + message | agent could not cover the requested range | read the message, narrow/shift the window, tell the user the available range |
| tool timed out after 60 s | window too big, or load spike (same prompt passed on retry) | halve the window; retry once |
| miles instead of km / `Local_Date` / `VehicleKPI_Daily` in SQL | pre-aggregated rollup chosen (#11/#13) | ask for raw rows in UTC, pin km |
| `DATA` instead of `Data` | case drift (#7) | key by the CSV header, alias in derive |
| `-32601 … Database '<x>' was not found on my.geotab.com` | wrong DB name (MotherDuck name ≠ Geotab name) or another server | use the Geotab login DB name; pass `server` for gov/other |
| negative `driving_duration_minutes` | agent-derived `TripDuration − IdlingDuration`; `IdlingDuration` can exceed `TripDuration` (#22) | ask for raw `TripDuration`/`IdlingDuration` (seconds), derive in silver |
