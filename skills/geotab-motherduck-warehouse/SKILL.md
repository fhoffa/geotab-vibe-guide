---
name: geotab-motherduck-warehouse
description: Replicate Geotab fleet data into a MotherDuck (DuckDB) warehouse and keep it fresh with incremental loads — driven entirely through MCP tools, no Python required. Use when a user wants to "copy/replicate/sync my Geotab data into MotherDuck", build a GPS/trip/fault data warehouse, run a daily update job, set up bronze/silver/gold layers, or backfill history. Covers the Geotab Ace → signed CSV URL → MotherDuck loop, the direct Get → table path for dimensions, watermarks, dedup, gap detection, and every Ace quirk we hit in testing.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "1.0"
  channels: [MotherDuck MCP, Geotab MCP]
---

# Geotab → MotherDuck Warehouse (data engineering)

Build and maintain a MotherDuck warehouse that mirrors a Geotab database, using **only MCP
tool calls**. This is a **data-engineering** skill: tables, layers, incremental loads, dedup,
watermarks, gap detection, backfill. (Analytics/"cool queries" come *after* the data is solid —
see [`references/MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) for the gold layer idea, but
keep analysis out of the ingestion path.)

> Everything below was validated live against MotherDuck + Geotab Ace on `demo_fh4`
> (a 26–50 vehicle Iberia demo fleet). Row counts, timings, and quirks are **observed, not guessed.**

## Tools you drive

| Job | Tool (this environment) | Notes |
|-----|------------------------|-------|
| Read warehouse | `mcp__MotherDuck__query` | read-only SQL |
| Write warehouse | `mcp__MotherDuck__query_rw` | CREATE / INSERT / CTAS |
| Inspect warehouse | `mcp__MotherDuck__list_databases` / `list_tables` / `list_columns` | cheap, do this first |
| Bulk fleet data (facts) | `mcp__Geotab_MCP__GetAceResults` | natural language → **always returns a signed GCS CSV URL** |
| Reference data (dimensions) | `mcp__Geotab_MCP__Get` / `GetCountOf` / `ListEntities` | JSON entities, 52 types |

Tool prefixes (`mcp__MotherDuck__`, `mcp__Geotab_MCP__`) may differ in another client — match by the
server names the user has connected.

## The core loop (≈3 MCP calls per table per run)

This is the "hey MotherDuck / hey Ace / hey MotherDuck" pattern, made robust:

```
1. mcp__MotherDuck__query     → SELECT max(event_time) FROM warehouse.table   (the watermark)
2. mcp__Geotab_MCP__GetAceResults → "give me all <entity> rows after <watermark>, columns: ..."
                                     (do NOT ask for a URL — see quirk #8 — Ace returns one anyway)
3. mcp__MotherDuck__query_rw  → INSERT ... SELECT FROM read_csv_auto('<signed URL>')
                                 WHERE event_time > <watermark>   (idempotent dedup)
```

Worked example we actually ran (GPS, `my_db.planet_gps_pings`):

```sql
-- 1. Watermark
SELECT max(GpsDateTime) FROM my_db.planet_gps_pings;          -- 2026-06-26 01:42:40.779
```
```
-- 2. Ace (new_chat=true, database=demo_fh4):
"List every GPS position log recorded after 2026-06-26 01:42:40 UTC, across all devices.
 Return these exact columns: DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude,
 GpsDateTime, Speed. Use UTC timezone. Do not summarize or aggregate."
   → ~40 s, response 166 KB (spilled to file), signed CSV URL inside, 157,419 rows.
```
```sql
-- 3. Append, idempotently (excludes the boundary-second overlap automatically)
INSERT INTO my_db.planet_gps_pings
  (DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed)
SELECT DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed
FROM read_csv_auto('https://storage.googleapis.com/planet-user-results-prod-eu/<uuid>-000000000000.csv?X-Goog-...')
WHERE GpsDateTime > (SELECT max(GpsDateTime) FROM my_db.planet_gps_pings);
   → 157,415 rows inserted (4 boundary-second rows correctly skipped). Table: 522,258 → 679,673.
```

**Before every load, inspect what came back** (shape + size) and decide: append as-is, transform
first, or re-ask Ace. Never pipe Ace straight into `INSERT` blind. See
[`references/MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md).

## Critical quirks (all observed in testing)

The single most important file is [`references/ACE_TO_CSV.md`](references/ACE_TO_CSV.md). Summary:

| # | Quirk | Engineering consequence |
|---|-------|------------------------|
| 1 | **Ace MCP response is always huge** (110–192 KB even for 3 rows) and exceeds the tool token cap → spilled to a file | **Never read it inline.** `grep`/`python` the saved file for the URL + `"columns"`. |
| 2 | **A signed GCS CSV URL is always returned** (`storage.googleapis.com/planet-user-results-prod-eu/<uuid>-…csv`), even for tiny results; expires in ~24h (`X-Goog-Expires=86399`) | Load via `read_csv_auto('<url>')` directly from MotherDuck — no local download. Load **within 24h**. |
| 3 | `preview_array` holds the rows **inline for ≤10 rows**; bigger sets need the URL | Small lookups can skip the URL; bulk loads always use it. |
| 4 | **NULLs are omitted** from the JSON (the key disappears) | "Missing key = null." Don't positional-parse assuming all keys exist. |
| 5 | **Timestamps carry a literal ` UTC` suffix** (`2026-06-26 01:42:40.423 UTC`) with **variable fractional digits** (`.423`, `.55`, `.685`) | `read_csv_auto` coerces to `TIMESTAMP` automatically; if you parse by hand, strip ` UTC` + `::TIMESTAMP` — **never a fixed `strptime`**. |
| 6 | **"after HH:MM:SS.mmm" is honored only to the second** → results re-include the boundary second (we saw 4 overlap rows ≤ watermark) | **Dedup is mandatory.** Filter `WHERE event_time > watermark` or anti-join on the natural key. |
| 7 | **Column-name honoring is inconsistent** — it honored `vehicle_label`/`distance_km`/the GPS set exactly, but uppercased `day`→`DAY` | **Key by the returned `columns` array**, never by the name/case you asked for. |
| 8 | **Asking for a URL/CSV/download in the prompt degrades the result** — it drops your column spec and returns a default schema (`UTC_GpsTimestamp`, no `DeviceName`/`Speed`) | **Never say url/csv/download/export.** Just ask for the data + exact columns; the URL comes anyway. |
| 9 | **~33 s fixed floor per Ace call** (31–40 s observed), independent of result size | Budget ~30–60 s/call; space calls ≥ a few seconds; **don't parallelize Ace calls**. |
| 10 | **Continue-chat works** (`new_chat=false` + `chat_id`) and **retains context** | Use for iterative refinement; a fresh `new_chat=true` forgets everything. |
| 11 | Ace's engine uses **pre-aggregated, active-filtered sources** (`VehicleKPI_Daily`, `LatestVehicleMetadata`, `IsTracked=TRUE`, inclusive **device-local** `Local_Date BETWEEN`) | Ace counts/distances ≠ raw API/haversine; date ranges are inclusive & local unless you force UTC. For exact replication, request raw rows with explicit UTC bounds. |

## Two source channels — pick per entity

| Channel | Best for | Shape | Speed | Reference |
|---------|----------|-------|-------|-----------|
| **Ace → CSV URL** | High-volume **facts**: GPS (`LogRecord`), trips, status/engine, exceptions, faults | signed CSV, bulk | ~30–60 s | [`ACE_TO_CSV.md`](references/ACE_TO_CSV.md) |
| **Get → JSON** | **Dimensions** & small/precise sets: `Device`, `User`, `Zone`, `Group`, `Diagnostic`, `Rule` | JSON, paged | ~0.5–2 s | [`ENTITY_CATALOG.md`](references/ENTITY_CATALOG.md) |

Rule of thumb: **dimensions via `Get` (authoritative, real-time, exact), facts via Ace (bulk export).**
A `dim_device` from `Get` also resolves Ace's `DeviceName`↔`DeviceId` and enriches every fact table.

## Layers (bronze / silver / gold)

| Layer | Purpose | Example | Dedup? |
|-------|---------|---------|--------|
| **Bronze** | Lossless landing, exactly as returned (`all_varchar=true`) + provenance cols | `bronze_gps_raw` | no (append-only) |
| **Silver** | Typed, conformed, deduped on natural key — the queryable table | `planet_gps_pings` | yes |
| **Gold** | Business marts/aggregates (built later, for analysis) | `daily_device_km` | n/a |

DDL + the conditional bronze→silver flow: [`references/MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md).

## Reference files

| Reference | When to read |
|-----------|--------------|
| [`ACE_TO_CSV.md`](references/ACE_TO_CSV.md) | Extracting bulk data from Ace: prompt rules, finding the URL in the spilled file, the 11 quirks in depth, timing/volume benchmarks, continue-chat |
| [`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) | Creating tables from zero, bronze/silver/gold DDL, pre-load shape & size checks, conditional transforms, idempotent inserts, dedup anti-join |
| [`INCREMENTAL_BACKFILL.md`](references/INCREMENTAL_BACKFILL.md) | The daily-run runbook, the `warehouse_ingest_log` state table, watermarks, gap detection ("missing spots"), windowed historical backfill |
| [`ENTITY_CATALOG.md`](references/ENTITY_CATALOG.md) | What to replicate beyond GPS: per-entity channel, natural keys, suggested schemas, the `Get` pagination quirk (cursor vs date-window) |

## Bootstrap vs daily run

- **0 → warehouse (first time):** create the warehouse db → create bronze + silver tables → do one
  *bounded historical* Ace pull per fact entity (e.g. one day at a time) → load dimensions via `Get`.
  See [`INCREMENTAL_BACKFILL.md`](references/INCREMENTAL_BACKFILL.md) §Backfill.
- **Daily update (steady state):** for each table run the 3-call loop above, then append a row to
  `warehouse_ingest_log`. Re-running is safe (the `> watermark` filter makes it idempotent). The user
  can ask you to "run the warehouse update" on a schedule.

## Non-negotiable rules

1. **Always check shape & size before loading.** `DESCRIBE SELECT * FROM read_csv_auto('<url>')` and a
   `COUNT(*)` + `min/max(event_time)`. Confirm columns/types match the target *or* transform.
2. **Dedup every load** (quirk #6) — `> watermark` filter or natural-key anti-join. Never trust Ace's boundary.
3. **Never ask Ace for a URL/CSV/download** (quirk #8). Ask for data + columns.
4. **Never read the raw Ace MCP result inline** (quirk #1) — grep the spilled file.
5. **`query_rw` is a write** — only on explicit user intent ("load/append/sync"); the warehouse loop counts.
6. **Test credentials/queries once**, not in a loop. Load CSVs **within ~24h** before the URL expires.
7. **Don't store the signed URL's query string** (it carries a signature) — log the `gs://…/<uuid>…csv` object path instead.
