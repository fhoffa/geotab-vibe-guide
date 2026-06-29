---
name: geotab-motherduck-warehouse
description: Replicate Geotab fleet data into a MotherDuck (DuckDB) warehouse and keep it fresh with incremental loads — driven entirely through MCP tools, no Python required. Use when a user wants to "copy/replicate/sync my Geotab data into MotherDuck", build a GPS/trip/fault data warehouse, run a daily update job, set up bronze/silver/gold layers, or backfill history. Covers the Geotab Ace → signed CSV URL → MotherDuck loop, the direct Get → table path for dimensions, live snapshots via DeviceStatusInfo, channel freshness (Ace lags only ~1–2 min), watermarks, dedup, gap detection, and every Ace quirk we hit in testing.
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

## The core loop (≈4 MCP calls per fact table per run)

The "hey MotherDuck / hey Ace / hey MotherDuck" pattern, made robust. **Ace data always lands in
bronze first; silver is derived from bronze** — never loaded straight from the URL (the URL expires in
~24 h and Ace is non-deterministic, so bronze is your only replayable record — see "Layers" below):

```
1. mcp__MotherDuck__query     → SELECT max(event_time) FROM warehouse.silver_table   (the watermark)
2. mcp__Geotab_MCP__GetAceResults → "give me all <entity> rows after <watermark>, columns: ..."
                                     (do NOT ask for a URL — see quirk #8 — Ace returns one anyway)
3. mcp__MotherDuck__query_rw  → INSERT INTO bronze_table SELECT *, provenance
                                 FROM read_csv_auto('<URL>', all_varchar=true)   (append-only, lossless)
4. mcp__MotherDuck__query_rw  → INSERT INTO silver_table SELECT <typed, deduped>
                                 FROM bronze_table WHERE event_time > <watermark>  (derive + idempotent dedup)
```

Worked example we actually ran (GPS, `my_db.bronze_gps_raw` → `my_db.planet_gps_pings`):

```sql
-- 1. Watermark (from silver — the source of truth for "what's already typed")
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
-- 3. Land raw in bronze, append-only, lossless (no dedup, no watermark — keep everything)
INSERT INTO my_db.bronze_gps_raw
SELECT *, 'ace:<chat-uuid>', now(), 'demo_fh4', 'ace_csv', 'gs://…/<uuid>….csv'
FROM read_csv_auto('https://storage.googleapis.com/planet-user-results-prod-eu/<uuid>-000000000000.csv?X-Goog-...',
                   all_varchar=true);
   → 157,419 rows appended. bronze_gps_raw: 522,162 (bootstrap) → 679,581.
```
```sql
-- 4. Derive silver from bronze: type-cast, strip ' UTC', dedup on the NORMALIZED natural key
INSERT INTO my_db.planet_gps_pings
  (DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed)
SELECT DISTINCT ON (DeviceId, replace(GpsDateTime,' UTC','')::TIMESTAMP)
       DeviceId, DeviceName, DeviceTimeZoneId, Latitude::DOUBLE, Longitude::DOUBLE,
       replace(GpsDateTime,' UTC','')::TIMESTAMP, Speed::BIGINT
FROM my_db.bronze_gps_raw
WHERE replace(GpsDateTime,' UTC','')::TIMESTAMP
      > (SELECT coalesce(max(GpsDateTime), TIMESTAMP '1970-01-01') FROM my_db.planet_gps_pings);
   → silver advances to 679,577 (boundary-second dupes collapse on the parsed key).
```

**Before deriving silver, inspect what came back** (shape + size) and decide: derive as-is, map
columns by position, or re-ask Ace. Bronze append is unconditional (lossless); never derive silver
blind. See [`references/MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md).

## Critical quirks (all observed in testing)

The single most important file is [`references/ACE_TO_CSV.md`](references/ACE_TO_CSV.md), which holds
the **full 17-quirk catalog with evidence**. The decision-critical ones:

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
| 12 | **Injects unrequested predicates** — partition `DATE(...)` guards, `Speed != 0`/`Ignition = 1`, unit conversions (km↔miles) — even when handed exact SQL | **Read the returned SQL every time.** Pin units, say "include stationary points," forbid the active filter. "Ace ran my query verbatim" is rare. |
| 13 | **Non-deterministic** — the same settled-day `COUNT(DISTINCT DeviceId)` returned **49 then 47**; forcing SQL didn't help | Treat Ace counts as ±a few %; this is *why* every load is append-to-bronze + dedup and repairs re-derive from bronze. |
| 14 | **Near-real-time for continuous streams** (GPS ~19–98 s; StatusData = live API's exact freshest), not batch. **Event tables** (`Trip`/`FaultData`/`ExceptionEvent`) only update when an event fires | Ace is fine for fresh loads. Gauge event tables by **counting events in a recent window**, not `max(ts)` vs now (a 9 h-old fault ≠ lag). ([`CHANNELS_AND_FRESHNESS.md`](references/CHANNELS_AND_FRESHNESS.md)) |
| 15 | **Ace returns the SQL it ran, by design** — a transparency/approval surface, not a leak | **Lint it before loading** — it catches every Class-A semantic problem while it's free to fix ([`QUALITY_AND_REPAIR.md`](references/QUALITY_AND_REPAIR.md) §2). |

## Three source channels — pick per entity *and* per freshness need

| Channel | Best for | Shape | Freshness (observed) | Reference |
|---------|----------|-------|----------------------|-----------|
| **Ace → CSV URL** | High-volume **facts**: GPS (`LogRecord`), trips, status/engine, exceptions, faults | signed CSV, bulk | **~1–2 min behind** | [`ACE_TO_CSV.md`](references/ACE_TO_CSV.md) |
| **Get → JSON** | **Dimensions** & small/precise sets: `Device`, `User`, `Zone`, `Group`, `Diagnostic`, `Rule`; raw `LogRecord` for a window | JSON, paged | **to ~now** (full-res raw) | [`ENTITY_CATALOG.md`](references/ENTITY_CATALOG.md) |
| **Get `DeviceStatusInfo`** | **Live** position/speed/ignition snapshot per device | JSON, 1 row/device | **~sub-second** | [`CHANNELS_AND_FRESHNESS.md`](references/CHANNELS_AND_FRESHNESS.md) |

Rule of thumb: **dimensions via `Get` (authoritative, exact), facts via Ace (bulk export), live map via
`Get DeviceStatusInfo`.** Ace is **not** "late data" — it lags only ~1–2 min; the freshest sliver Ace
hasn't caught up to can be topped up with a small raw `Get LogRecord` read. A `dim_device` from `Get`
also resolves Ace's `DeviceName`↔`DeviceId` and enriches every fact table. **Don't historize
`DeviceStatusInfo`** — it's a snapshot, not an event stream. Full decision matrix (live / bulk window /
historical backfill / settle the gaps): [`CHANNELS_AND_FRESHNESS.md`](references/CHANNELS_AND_FRESHNESS.md).

## Layers (bronze / silver / gold)

| Layer | Purpose | Example | Dedup? |
|-------|---------|---------|--------|
| **Bronze** | Lossless landing, exactly as returned (`all_varchar=true`) + provenance cols | `bronze_gps_raw` | no (append-only) |
| **Silver** | Typed, conformed, deduped on natural key — the queryable table, **a deterministic projection of bronze** | `planet_gps_pings` | yes |
| **Gold** | Business marts/aggregates (built later, for analysis) | `daily_device_km` | n/a |

**The bronze rule (the decision that matters):** bronze is **mandatory for Ace-sourced facts** and
**skipped for `Get`-sourced dimensions.** Why: Ace's output is *not reproducible* — the signed CSV URL
expires in ~24 h and Ace is non-deterministic, so bronze is the only durable, replayable record of what
you ingested, and silver is derived from it. `Get` is exact and reproducible any time (reconciles with
`GetCountOf`), so dimensions land straight to a typed `dim_*` with no bronze. Don't load a fact silver
straight from the URL, and don't put bronze under a dimension.

DDL, the bronze→silver derive, and the brownfield bootstrap: [`references/MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md).

## Reference files

| Reference | When to read |
|-----------|--------------|
| [`ACE_TO_CSV.md`](references/ACE_TO_CSV.md) | Extracting bulk data from Ace: prompt rules, finding the URL in the spilled file, the 11 quirks in depth, timing/volume benchmarks, continue-chat |
| [`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) | The bronze-vs-`Get` decision rule, bronze/silver/gold DDL, append-only bronze + deriving silver from it, the brownfield bootstrap, shape checks, normalized-key dedup, full replay |
| [`INCREMENTAL_BACKFILL.md`](references/INCREMENTAL_BACKFILL.md) | The three backfills (forward catch-up, historical recovery, cross-channel reconciliation), the `warehouse_ingest_log` state table, watermarks, gap detection, the active-only population check, and the settle loop |
| [`ENTITY_CATALOG.md`](references/ENTITY_CATALOG.md) | What to replicate beyond GPS: per-entity channel, natural keys, suggested schemas, the `Get` pagination quirk (cursor vs date-window) |
| [`QUALITY_AND_REPAIR.md`](references/QUALITY_AND_REPAIR.md) | Post-load quality tests, predicting problems by reading Ace's generated SQL, the SQL-vs-results failure split, and repair strategy (re-ask vs. patch the gap) |
| [`CHANNELS_AND_FRESHNESS.md`](references/CHANNELS_AND_FRESHNESS.md) | How fresh each channel is (Ace ~1–2 min, `Get` to now, `DeviceStatusInfo` live), the live/bulk/backfill/settle decision matrix, the active-only coverage trap, and why `GetCountOf` can't reconcile fact windows |
| [`COST_AND_SIZING.md`](references/COST_AND_SIZING.md) | What it costs to run: Ace/MCP are free on the Geotab Go plan; MotherDuck Lite free tier (10 GB); measured ~16–54 B per GPS ping; free-tier capacity in vehicle-years; and small→very-large fleet monthly estimates |

## Bootstrap vs daily run vs the three backfills

- **0 → warehouse (first time):** create the warehouse db → create bronze + silver tables → per fact
  entity, run *bounded historical* Ace pulls (a day at a time) into **bronze**, then derive silver →
  load dimensions via `Get` (no bronze). If a silver table already exists without a bronze under it,
  reconstruct bronze from silver once (the brownfield bootstrap) so silver becomes rebuildable.
  See [`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) §Brownfield.
- **Daily update (steady state):** for each fact table run the 4-call loop above (watermark → Ace →
  append bronze → derive silver), then append a row to `warehouse_ingest_log`. Re-running is safe (the
  `> watermark` derive is idempotent). The user can ask you to "run the warehouse update" on a schedule.

**"Backfill" means three different operations — name which one before you start** (full runbooks in
[`INCREMENTAL_BACKFILL.md`](references/INCREMENTAL_BACKFILL.md)):

| Ask | Operation | Direction |
|-----|-----------|-----------|
| "get me everything missing **forward**" | forward catch-up (= the daily loop / after-downtime) | watermark → now |
| "recover **more past** data" | historical recovery (windowed walk backward + anti-join) | oldest → earlier target |
| "re-check **`Get` + Ace** aren't missing rows" | cross-channel reconciliation (gap detection + population/count cross-checks + settle loop) | interior holes & channel disagreements |

## Non-negotiable rules

1. **Ace facts land in bronze first; silver is derived from bronze** — never load a fact silver
   straight from the URL. `Get` dimensions skip bronze (reproducible) and land straight to `dim_*`.
   The source is non-reproducible (URL expires ~24 h, Ace is non-deterministic) so bronze is the only
   replayable record. Bronze is **append-only** (`CREATE TABLE IF NOT EXISTS` + `INSERT`, never
   `CREATE OR REPLACE`); stamp every batch with provenance (`_batch_id`, `_source_channel`, …).
2. **Always check shape & size before deriving.** `DESCRIBE SELECT * FROM read_csv_auto('<url>')` and a
   `COUNT(*)` + `min/max(event_time)`. Confirm columns/types *or* map by position in the derive.
3. **Dedup every silver derive** (quirk #6) — `> watermark` filter or natural-key anti-join, and dedup
   on the **parsed/normalized** key (bronze mixes ` UTC`-suffixed and clean timestamps). Never trust Ace's boundary.
4. **Never ask Ace for a URL/CSV/download** (quirk #8). Ask for data + columns. **Specificity beats
   SQL:** name exact columns, pin units ("in km, don't convert"), force "Use UTC," say "raw rows, do
   not aggregate," and "include all devices, not just tracked/active." Tested — explicit English is as
   reliable as feeding Ace the SQL, and attaching SQL adds gateway-rejection risk without fixing
   non-determinism ([`ACE_TO_CSV.md`](references/ACE_TO_CSV.md) §Does adding SQL help).
5. **Never read the raw Ace MCP result inline** (quirk #1) — grep the spilled file.
6. **`query_rw` is a write** — only on explicit user intent ("load/append/sync"); the warehouse loop counts.
7. **Test credentials/queries once**, not in a loop. Load CSVs into bronze **within ~24h** before the URL expires.
8. **Don't store the signed URL's query string** (it carries a signature) — log the `gs://…/<uuid>…csv` object path instead.
9. **Read Ace's generated SQL** (it's in the response) as a pre-load gate — most problems are visible there before any row loads. Classify failures: *SQL/semantic* (wrong source, filter, timezone, aggregation) → **re-ask** with sharper wording; *result/data* (suffix, dupes, nulls, schema drift) → **fix in the derive**. See [`QUALITY_AND_REPAIR.md`](references/QUALITY_AND_REPAIR.md).
10. **Run the quality battery after every load** (uniqueness, bounds, nulls, freshness, referential integrity, reconciliation). Reconcile **dimensions** with `GetCountOf` (exact); reconcile **fact windows** with a bounded `Get` read of the same window — **`GetCountOf` ignores date/device filters for facts** and returns the whole-table count. To repair, prefer **asking for the missing window + anti-join** over re-asking the whole question — Ace is non-deterministic (the same settled query returned 49 then 47), so a full re-ask can replace good data with a differently-shaped answer.
11. **Writes can drop mid-call** — keep them idempotent (silver/gold `CREATE OR REPLACE` or `IF NOT EXISTS` + watermark/anti-join; bronze append-only) and re-check with `list_tables`/`COUNT(*)` before retrying.
