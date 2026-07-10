---
name: geotab-motherduck-warehouse
description: Replicate Geotab fleet data into a MotherDuck (DuckDB) warehouse and keep it fresh with incremental loads — driven entirely through MCP tools, no Python required. Use when a user wants to "copy/replicate/sync my Geotab data into MotherDuck", build a GPS/trip/fault data warehouse, run a daily update job, set up bronze/silver/gold layers, or backfill history. Covers the Geotab Ace → signed CSV URL → MotherDuck loop, the direct Get → table path for dimensions, live snapshots via DeviceStatusInfo, channel freshness (Ace lags only ~1–2 min), watermarks, dedup, gap detection, and every Ace quirk we hit in testing.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "1.1"
  channels: [MotherDuck MCP, Geotab MCP]
---

# Geotab → MotherDuck Warehouse (data engineering)

<!-- Editing/extending this skill? Read MAINTAINING.md first (authoring conventions:
     stable severity-grouped quirk IDs, lean catalog + evidence in EVIDENCE_LOG §1b,
     4-col bronze provenance / no _source_db, etc.). -->
> **Editing this skill?** See [`MAINTAINING.md`](MAINTAINING.md) for the authoring conventions first.

Build and maintain a MotherDuck warehouse that mirrors a Geotab database, using **only MCP
tool calls**. This is a **data-engineering** skill: tables, layers, incremental loads, dedup,
watermarks, gap detection, backfill. (Analytics/"cool queries" come *after* the data is solid —
see [`references/MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) for the gold layer idea, but
keep analysis out of the ingestion path.) For how this MCP-driven approach compares to Geotab's
official self-hosted mirror (the [MyGeotab API Adapter](https://github.com/Geotab/mygeotab-api-adapter))
and when to graduate to it, see [`guides/MCP_TO_MOTHERDUCK_VS_GETFEED_API_ADAPTER.md`](../../guides/MCP_TO_MOTHERDUCK_VS_GETFEED_API_ADAPTER.md)
and [`CHANNELS_AND_FRESHNESS.md`](references/CHANNELS_AND_FRESHNESS.md) §Relationship to the adapter.

> Everything below was validated live against MotherDuck + Geotab Ace on `demo_fh4`
> (a 26–50 vehicle Iberia demo fleet), **measured 2026-06-29**. Row counts, timings, and quirks are
> **observed, not guessed** — and therefore **point-in-time**: every number/quirk is dated where it
> appears; treat them as "true as of that date," re-verify against your own database, and update the date.

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

> **Naming convention used throughout this skill — two distinct Geotab MCP tools, never conflated:**
> **"Ace"** = `mcp__Geotab_MCP__GetAceResults` (natural language → generated SQL → signed CSV URL).
> **"Get API"** = `mcp__Geotab_MCP__Get` / `GetCountOf` / `ListEntities` (classic JSON entity calls).
> They have *different* behaviors (e.g. `GetCountOf` ignoring date filters is a **Get API** quirk, not
> an Ace one; the ~33 s floor and non-determinism are **Ace** quirks). Every finding below says which.

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

**Full worked SQL for every step** — bronze/silver DDL, the append, the typed/deduped derive, the
watermark-vs-anti-join variants, and a full rebuild — lives in
[`references/MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md). (Its examples use the short
`my_db.<table>` form; read it as `geotab_<source>.<layer>.<table>` — the live demo is `geotab_demo_fh4`
with `bronze`/`silver`/`gold` schemas. For a new source, create your own `geotab_<source>` first — see
"First run" — and never write to another source's database.)

**Before deriving silver, inspect what came back** (shape + size) and decide: derive as-is, map
columns by position, or re-ask Ace. Bronze append is unconditional (lossless); never derive silver
blind. See [`references/MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md).

## Ace quirks — by severity (be aware of these while managing the warehouse)

Full handling + SQL examples: [`references/ACE_TO_CSV.md`](references/ACE_TO_CSV.md) (canonical, numbered).
Measurements/proof: [`references/EVIDENCE_LOG.md`](references/EVIDENCE_LOG.md) §1b, keyed by the same `#`.
Numbers are **stable IDs** (grouped by severity, never renumbered) so bare `quirk #N` references resolve.

**🔴 Critical — silently produces wrong/incomplete data:**
- **#2** — URL *always* returned; **shards only for large exports** (by *byte size*, not a row threshold — 11.9M-row status → 8 files, 3.7M-row GPS → 1) → when sharded, **load *every* shard** or counts are short (expires ~24 h).
- **#6** — Boundary second re-included (~always, tiny) **and** full ~2× duplication on *some* exports (intermittent, **per-table/per-pull** — one run doubled GPS/status/exceptions but not trips) → **dedup on the parsed natural key every load** (never hard-code "halve it"; the count is whatever survives dedup).
- **#11** — *By default on metric/KPI asks*, engine is pre-aggregated + `IsTracked`-only + device-local dates → counts/distances ≠ raw; for exact replication **ask for raw rows with explicit UTC bounds**.
- **#12** — Predicate injection *common* (partition guards — harmful only when they *narrow*); the `LatestVehicleMetadata` join (only on `DeviceName` asks) flips LEFT↔inner *intermittently* **and can fan rows out N×** when keyed on `DeviceId` alone → **read the SQL; dedup on the natural key; run the device-population check**.
- **#13** — Unit conversion km↔miles, *only on distance/speed asks* → pin *"in kilometers, do not convert units"*.
- **#14** — Activity filters (`Speed != 0`/`Ignition = 1`) *only on motion-flavored asks* → **forbid them in the prompt**.
- **#15** — Source table can change for the "same" question — **treat as non-deterministic** (LLM-generated SQL; we saw per-call variation in #20). Identical English *happened to* stay on `GpsLogs` (49×3) in a small sample and only switched to `Trip`=47 with SQL attached, but **don't bank on it** → **read the `FROM` every load**; loads are append-to-bronze + dedup, repairs re-derive from bronze.
- **#20** — *Intermittent* (~1/3 of calls, unpredictable, not DB-stable): injected **upper bound** clips the current day (`CURRENT_DATE()` → `…23:59:59.xxx` artifact) → **don't use Ace for freshness/watermark** (use `Get`/`DeviceStatusInfo`); on exports verify the upper bound is *now*/your `hi`.

**🟡 Operational — derails or misleads the run (usually visible):**
- **#7** — Column-case drift (`day`→`DAY`) → **key by the returned `columns` array**, not the case you asked for.
- **#8** — Asking for a "URL/CSV/download" **degrades the schema** → ask for **data + exact columns** (the URL comes anyway); never say url/csv/export.
- **#16** — Continuous streams ~real-time; **event tables** (`Trip`/`FaultData`/`ExceptionEvent`) update only on an event → gauge them by **counting events in a recent window**, not `max(ts)` vs now.
- **#17** — `invalid_value` 400 (transient); **plain English isn't immune** — a *bounded* prompt can 400 where **open-ended** succeeds → **retry; prefer open-ended and clip the tail in the derive**.
- **#18** — Config/dimension writes lag Ace ~15–30 min → **read just-changed config from `Get`, not Ace**.
- **#19** — ChatGPT: **both MCP servers must be the same mode**; **preflight Ace** with a tiny call before any DDL.

**⚪ Informational — good to know, no data hazard:**
- **#1** — Response is always huge (the chat object, not the data) and the harness spills it to a file → **parse the file** for the URL, `"columns"`, and the SQL ([`ACE_TO_CSV.md`](references/ACE_TO_CSV.md) §Step 2); if your client returns it inline/truncated, offload to a file first.
- **#3** `preview_array` inline for ≤10 rows · **#4** NULL keys omitted ("missing key = null") · **#5** ` UTC` suffix + variable fraction (`read_csv_auto` handles it; else `replace(…,' UTC','')::TIMESTAMP`) · **#9** ~33 s floor, **don't parallelize** Ace calls · **#10** continue-chat retains context.

**Always:** Ace **returns the SQL it ran** — by design, an approval surface, not a leak. **Lint it before loading** — the SQL exposes the *semantic* 🔴 issues (#11 pre-agg, #12 predicates, #13 units, #14 filters, #15 source table, #20 window bound) while they're still free to fix ([`QUALITY_AND_REPAIR.md`](references/QUALITY_AND_REPAIR.md) §2). The *data-shape* 🔴s aren't in the SQL: **#2** needs you to harvest **every shard URL**, and **#6** needs the **silver dedup** after load — linting won't surface either.

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
| [`ACE_TO_CSV.md`](references/ACE_TO_CSV.md) | Extracting bulk data from Ace: prompt rules, finding the URL in the spilled file, the 20 quirks in depth, timing/volume benchmarks, continue-chat |
| [`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) | The bronze-vs-`Get` decision rule, bronze/silver/gold DDL, append-only bronze + deriving silver from it, the brownfield bootstrap, shape checks, normalized-key dedup, full replay |
| [`INCREMENTAL_BACKFILL.md`](references/INCREMENTAL_BACKFILL.md) | The three backfills (forward catch-up, historical recovery, cross-channel reconciliation), the `warehouse_ingest_log` state table, watermarks, gap detection, the active-only population check, and the settle loop |
| [`ENTITY_CATALOG.md`](references/ENTITY_CATALOG.md) | What to replicate beyond GPS: per-entity channel, natural keys, suggested schemas, the `Get` pagination quirk (cursor vs date-window) |
| [`QUALITY_AND_REPAIR.md`](references/QUALITY_AND_REPAIR.md) | Post-load quality tests, predicting problems by reading Ace's generated SQL, the SQL-vs-results failure split, and repair strategy (re-ask vs. patch the gap) |
| [`CHANNELS_AND_FRESHNESS.md`](references/CHANNELS_AND_FRESHNESS.md) | How fresh each channel is (Ace ~1–2 min, `Get` to now, `DeviceStatusInfo` live), the live/bulk/backfill/settle decision matrix, the active-only coverage trap, and why `GetCountOf` can't reconcile fact windows |
| [`COST_AND_SIZING.md`](references/COST_AND_SIZING.md) | What it costs to run: Ace/MCP are free on the Geotab Go plan; MotherDuck Lite free tier (10 GB); measured ~16–54 B per GPS ping; free-tier capacity in vehicle-years; and small→very-large fleet monthly estimates |
| [`EVIDENCE_LOG.md`](references/EVIDENCE_LOG.md) | **Reproducibility ledger** — reusable probes (stable prompts/SQL, IDs P1–P11) + an **append-only dated results table** + per-run verbatim archives. Re-run a probe, append a row; the latest row is current truth. Start here to rebuild, investigate, or re-measure a claim. |

## First run on a new Geotab database — isolate BEFORE you write

The examples in this skill use **`my_db`**, the demo warehouse for `demo_fh4`. **For a different Geotab
database, never reuse `my_db` or any other source's database** — Geotab IDs (`b1`,`b2`,…) repeat across
databases, so sharing tables silently collides (Non-negotiable #12). Do these steps before any write:

1. **Preflight the connectors — *before* any DDL.** Confirm all three tools you'll need are actually
   callable now: MotherDuck, Geotab **`Get`** (dimensions), and Geotab **`GetAceResults`** (Ace, the bulk
   fact channel). Verify Ace with a tiny call, not just `Get`. **ChatGPT setup gotcha:** the Geotab and
   MotherDuck servers must be in the **same mode** — both official connectors *or* both developer-mode;
   a mixed setup dropped the Geotab connector mid-session (2026-06-29), leaving a warehouse with empty
   bronze. **If Ace isn't callable, fix the connector setup and stop before creating tables** — facts
   need it; don't leave a half-built warehouse.
2. **See what already exists** — `mcp__MotherDuck__list_databases` (or `SHOW DATABASES`). Confirm the
   name you're about to use is new and isn't another source's warehouse. (This account already holds
   **`geotab_demo_fh4`** — the demo, in the recommended `bronze`/`silver`/`gold` layout — plus
   `sample_data`, so a new source needs its own `geotab_<source>` database. Reading other DBs is fine;
   **writing** must be target-only.) **If the host blocks `list_databases`** (some MCP safety layers do —
   seen on ChatGPT), proceed scoped strictly to your fully-qualified `geotab_<source>.*` target, never
   reference another database name, and note the blocked check in the report.
3. **Create an isolated namespace** (recommended: **database per source + schema per layer**) — the
   `CREATE DATABASE`/`SCHEMA` + `main.warehouse_meta` DDL is in
   [`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) §isolate. Use `geotab_<source>` (with
   `bronze`/`silver`/`gold` schemas) everywhere the examples say `my_db`, and stamp `_batch_id` on every
   bronze insert (source DB recorded once at the DB level in `main.warehouse_meta` — rule #12; no per-row
   `_source_db`). **`CREATE TABLE IF NOT EXISTS` only — never `CREATE OR REPLACE` silver during
   bootstrap.** A partial-brownfield target is fine and resumable: a dimension may already be populated
   while bronze/facts are empty — preserve the dim, create bronze, continue the fact bootstrap.
4. **Gate before the first write:** the target database name must encode *this* source and must not be an
   existing other-source DB. `IF NOT EXISTS` keeps a re-run safe. Then proceed to the loop / backfill.

> **Restrictive MCP hosts (e.g. ChatGPT).** Some hosts' safety layer blocks **multi-statement** calls and
> complex read-only SQL. Observed: a two-`DESCRIBE` call and a `COUNT(DISTINCT … || …)` shape query were
> both blocked, but `mcp__MotherDuck__list_columns` / `list_tables` worked. So: **prefer `list_columns` /
> `list_tables` over `DESCRIBE`, run one statement per call, and keep shape-check SQL simple** (split
> concat/parse aggregates into small steps). Same spirit as never reading the spilled Ace payload inline.
> Also seen: a **long signed URL inline in `read_csv_auto('<url>')` was blocked**; concatenating the URL
> from string pieces in SQL got it through. And a one-shot derive over 20M+ rows hit the tool timeout —
> derive **per shard/day** (see [`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) §large facts).

Two sources must never share a database (db-per-source + schema-per-layer is the only supported layout).
Rationale: [`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) §isolate.

## Bootstrap vs daily run vs the three backfills

- **0 → warehouse (first time):** **isolate first** (§First run — create `geotab_<source>` + layer
  schemas, never reuse another source's DB) → **load dimensions via `Get` first** (no bronze —
  `dim_device` is the exact roster that the fact loads' population check and `DeviceName`↔`DeviceId`
  resolution need, so it must exist *before* the first fact lands) → create bronze + silver tables →
  per fact entity, run *bounded historical* Ace pulls (a day at a time) into **bronze**, then derive
  silver. If a silver table already exists without a bronze under it, reconstruct bronze from silver
  once (the brownfield bootstrap) so silver becomes rebuildable.
  See [`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) §Brownfield.
- **Daily update (steady state):** for each fact table run the 4-call loop above (watermark → Ace →
  append bronze → derive silver), bracketed by the two `warehouse_ingest_log` rows — `started` right
  after Ace returns, `completed` after the verify (rule #11). Re-running is safe (the
  `> watermark` derive is idempotent). The user can ask you to "run the warehouse update" on a schedule.
  **Trips need one extra step:** `Trip` is a *derived, mutable* fact — Geotab re-splits trips (a
  `DriverChange`, or late GPS, changes a trip's `TripId` and stop time even for trips that start *before*
  your watermark), so after the forward trips load run the **trip re-split reconcile** (operation D below).
  Forward catch-up alone silently leaves stale orphan trips. Pure event facts
  (`ExceptionEvent`/`FaultData`) don't mutate once fired.

**"Backfill" means four different operations — name which one before you start** (full runbooks in
[`INCREMENTAL_BACKFILL.md`](references/INCREMENTAL_BACKFILL.md)):

| Ask | Operation | Direction |
|-----|-----------|-----------|
| "get me everything missing **forward**" | forward catch-up (= the daily loop / after-downtime) | watermark → now |
| "recover **more past** data" | historical recovery (windowed walk backward + anti-join) | oldest → earlier target |
| "re-check **`Get` + Ace** aren't missing rows" | cross-channel reconciliation (gap detection + population/count cross-checks + settle loop) | interior holes & channel disagreements |
| "trips I **already loaded changed** (DriverChange / late GPS re-split them)" | trip re-split reconcile (delete retired orphans + anti-join new ids) | mutation *in place* — only `Trip` |

## Non-negotiable rules

1. **Ace facts land in bronze first; silver is derived from bronze** — never load a fact silver
   straight from the URL. `Get` dimensions skip bronze (reproducible) and land straight to `dim_*`.
   The source is non-reproducible (URL expires ~24 h, Ace is non-deterministic) so bronze is the only
   replayable record. Bronze is **append-only** (`CREATE TABLE IF NOT EXISTS` + `INSERT`, never
   `CREATE OR REPLACE`); stamp every batch with provenance (`_batch_id`, `_source_channel`, …).
2. **Always check shape & size before deriving.** `DESCRIBE SELECT * FROM read_csv_auto('<url>')` and a
   `COUNT(*)` + `min/max(event_time)`. Confirm columns/types *or* map by position in the derive. (On
   restrictive MCP hosts that block `DESCRIBE`/multi-statement/complex SQL — e.g. ChatGPT — use
   `list_columns`/`list_tables`, one statement per call, and simple staged shape-check SQL.)
3. **Dedup every silver derive** (quirk #6) — `> watermark` filter or natural-key anti-join, and dedup
   on the **parsed/normalized** key (bronze mixes ` UTC`-suffixed and clean timestamps). Never trust Ace's boundary.
4. **Never ask Ace for a URL/CSV/download** (quirk #8). Ask for data + columns. **Specificity beats
   SQL:** name exact columns, pin units ("in km, don't convert"), force "Use UTC," say "raw rows, do
   not aggregate," and "include all devices, not just tracked/active." Tested — explicit English is as
   reliable as feeding Ace the SQL, and attaching SQL adds gateway-rejection risk without fixing
   non-determinism ([`ACE_TO_CSV.md`](references/ACE_TO_CSV.md) §Does adding SQL help).
5. **Never read the raw Ace MCP result inline** (quirk #1) — parse it as a file for the URL, `columns`, and the **SQL** (lint the SQL before loading — it's the approval gate). If your client returns it inline instead of spilling, offload to a file first; never let ~150 KB into context.
6. **`query_rw` is a write** — only on explicit user intent ("load/append/sync"); the warehouse loop counts. An explicit "replicate/load/sync this database" request *is* that intent — it's the confirmation for hosts that gate writes.
7. **Test credentials/queries once**, not in a loop. Load CSVs into bronze **within ~24h** before the URL expires.
8. **Don't store the signed URL's query string** (it carries a signature) — log the `gs://…/<uuid>…csv` object path instead: drop everything from `?` and rewrite the host, `https://storage.googleapis.com/<bucket>/<object>?X-Goog-…` → `gs://<bucket>/<object>`. (The bucket region varies by DB — `…-prod-us`, `…-prod-eu`, … — so match by shape, not a fixed host.)
9. **Read Ace's generated SQL** (it's in the response) as a pre-load gate — most problems are visible there before any row loads. Classify failures: *SQL/semantic* (wrong source, filter, timezone, aggregation) → **re-ask** with sharper wording; *result/data* (suffix, dupes, nulls, schema drift) → **fix in the derive**. See [`QUALITY_AND_REPAIR.md`](references/QUALITY_AND_REPAIR.md).
10. **Run the quality battery after every load** (uniqueness, bounds, nulls, freshness, referential integrity, reconciliation). Reconcile **dimensions** with `GetCountOf` (exact); reconcile **fact windows** with a bounded `Get` read of the same window — **`GetCountOf` ignores date/device filters for facts** and returns the whole-table count. To repair, prefer **asking for the missing window + anti-join** over re-asking the whole question — Ace can answer the same question from a different source table across runs (a "distinct devices" ask resolved to `GpsLogs`=49 vs `Trip`=47), so a full re-ask can replace good data with a differently-shaped answer.
11. **Writes can drop mid-call — and whole runs can die mid-loop.** Keep writes idempotent (silver/gold `CREATE OR REPLACE` or `IF NOT EXISTS` + watermark/anti-join; bronze append-only) and re-check with `list_tables`/`COUNT(*)` before retrying. **Log ahead, not just after:** write a `started` row to `warehouse_ingest_log` the moment Ace returns (persisting the window + `gs://` path), and a `completed` row only after the verify — so an interruption leaves a *visible orphan* to resume from instead of a silent hole (observed 2026-07-02: an interrupted run left 522K GPS rows loaded but unlogged, and the loop's other tables never ran). On session start, sweep for orphaned `started` rows and bronze batches missing from the log, and **finalize each orphan to a terminal `completed` (bronze verifies) or `abandoned` (old + already superseded) row** so it clears — append-only, never `UPDATE` ([`INCREMENTAL_BACKFILL.md`](references/INCREMENTAL_BACKFILL.md) §state table). **Expect a big backfill to pause on the host's per-turn tool-call limit — just say *continue*;** the log-ahead + orphan-sweep design makes resuming across turns safe (chunk windows so each pause lands on a clean boundary).
12. **One MotherDuck database per Geotab source + a schema per medallion layer** (`geotab_<source>.bronze.*` / `.silver.*` / `.gold.*`). Geotab entity IDs (`b1`,`b2`,…) are unique only *within* a database, so two sources in the *same* tables **collide** in silver/dims (append+dedup, not overwrite — worse). Database-level isolation is also where MotherDuck scopes Sharing, retention, access, and cost. **On a new source, `list_databases` FIRST and create a fresh `geotab_<source>`; never write into a database that already holds another source.** **Provenance: keep per-row `_batch_id`; record the source identity once at the DB level** in a `main.warehouse_meta` table (+ optional `COMMENT ON TABLE`, `warehouse_ingest_log`) — **no per-row `_source_db`** (constant in this layout). **Don't use `COMMENT ON DATABASE` — it's *not implemented* in MotherDuck** (verified 2026-06-30: "Not implemented Error: Adding comments to databases is not implemented"); `COMMENT ON TABLE`/`COLUMN` do work. ([`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) §isolate, [`SKILL.md`](SKILL.md) §First run.)
13. **Preflight the connectors before any DDL/write.** Confirm MotherDuck, Geotab `Get`, **and** Geotab `GetAceResults` (Ace) are callable *now* — verify Ace with a tiny call, not just `Get`. **On ChatGPT, use both servers in the same mode** (both official connectors or both developer-mode) — a mixed setup dropped the Geotab connector mid-session (2026-06-29), leaving an empty-bronze warehouse. If Ace is unavailable, fix the setup and **stop before creating tables** — bulk facts need it. Bootstrap is resumable (`IF NOT EXISTS`), so a clean stop is safe to continue later.
14. **Mirror real source data only — never fabricate, synthesize, or infer rows/tables.** Every table must trace to a Geotab pull (Ace or `Get`). Don't invent dimensions or "demo" layers (observed: an agent created `dim_driver` / `trip_driver_assignment` / `operator_*` "synthetic assignments" that didn't exist in the source — they had to be removed). If the source has no drivers, the mirror has no drivers. Need a derived/illustrative table? Put it in **`gold`**, clearly named, built **only** from real silver — never seeded with made-up values. When asked for something the source doesn't contain, say so; don't fill the gap with synthetic data.
15. **`Trip` is a *mutable* fact — forward catch-up alone silently rots it.** Geotab re-splits trips (a `DriverChange`, or late/out-of-order GPS), changing an already-loaded trip's `TripId` and stop time. Because the re-split trip *starts before your watermark*, the forward derive never sees it, leaving a **stale orphan** (retired id) plus a **missing** current split. After every forward trips load, run the **trip re-split reconcile** over a lookback `L` before the prior watermark — **`L` ≥ your longest expected trip** (a few hours urban, ≥24–36 h long-haul; this also catches long trips that *completed* after a later trip advanced the start-watermark): delete silver trips whose `TripId` is no longer in a fresh source pull, then anti-join the new ids in (the one place silver fact rows are `DELETE`d — source-justified, bronze still holds every version). Verify the day's source vs silver `TripId` sets match. This is **not** needed for append-only event facts (`ExceptionEvent`/`FaultData`). Observed 2026-06-30 on `Demo_fh_vegas4`: 50 orphans + 51 missing on a single day, all clustered at the watermark boundary. ([`INCREMENTAL_BACKFILL.md`](references/INCREMENTAL_BACKFILL.md) §D.)
