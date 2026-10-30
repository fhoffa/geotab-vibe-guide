---
name: geotab-motherduck-warehouse
description: Replicate Geotab fleet data into a MotherDuck (DuckDB) warehouse and keep it fresh with incremental loads — driven entirely through MCP tools, no Python required. Use when a user wants to "copy/replicate/sync my Geotab data into MotherDuck", build a GPS/trip/fault data warehouse, run a daily update job, set up bronze/silver/gold layers, or backfill history. Covers the Geotab data agent (AskDataAgent) → signed CSV URL → MotherDuck loop, the direct Get → table path for dimensions, live snapshots via DeviceStatusInfo, channel freshness, watermarks, dedup, gap detection, and every data-agent quirk we hit in testing.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "2.0"
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

> Row counts, timings and quirks here are **observed, not guessed** — and therefore **point-in-time**: the
> Geotab side was measured on `demo_fh8` / `demo_fh_vegas8` on 2026-10-29/30, the MotherDuck side on the
> `geotab_demo_fh4` and `geotab_Demo_fh_vegas4` mirrors in June–July 2026. Every number is dated where it
> appears; treat it as "true as of that date," re-verify against your own database, and update the date.

## Tools you drive

| Job | Tool (this environment) | Notes |
|-----|------------------------|-------|
| Read warehouse | `mcp__MotherDuck__query` | read-only SQL |
| Write warehouse | `mcp__MotherDuck__query_rw` | CREATE / INSERT / CTAS |
| Inspect warehouse | `mcp__MotherDuck__list_databases` / `list_tables` / `list_columns` | cheap, do this first |
| Bulk fleet data (facts) | `mcp__MyGeotab_MCP__AskDataAgent` (the **data agent**) | natural language → generated SQL → `{sql, data_preview[20], row_count, data_uri}`; `data_uri` is a signed GCS CSV |
| Reference data (dimensions) | `mcp__MyGeotab_MCP__Get` / `GetCountOf` / `ListEntities` / `GetEntity` | JSON entities, 52 types |
| Orientation | `mcp__MyGeotab_MCP__GetSkill` | call first on a new MyGeotab task (it returned *no_match* for data-agent questions on 2026-10-29) |

Tool prefixes (`mcp__MotherDuck__`, `mcp__MyGeotab_MCP__`) may differ in another client — match by the
server names the user has connected. **Database names differ across systems:** the Geotab database is the
MyGeotab login name (e.g. `demo_fh8`), *not* the MotherDuck warehouse name (`geotab_<source>`); passing the
wrong one gives `-32601 Database '…' was not found on my.geotab.com` (pass `server` for gov/other hosts).
Ask the user rather than guessing.

> **Two kinds of Geotab calls, never conflated:** the **data agent** (`AskDataAgent`, LLM-generated SQL,
> bulk facts) and the **Get API** (`Get` / `GetCountOf` / `ListEntities`, classic JSON entity calls,
> authoritative and synchronous). They behave differently — e.g. `GetCountOf` ignoring date filters is a
> Get-API quirk; empty-success and the ~60 s timeout are data-agent quirks. Every finding says which.

## The core loop (≈4 MCP calls per fact table per run)

The "hey MotherDuck / hey Geotab / hey MotherDuck" pattern, made robust. **Data-agent output always lands in
bronze first; silver is derived from bronze** — never loaded straight from the URL (the URL expires in ~24 h
and the agent's SQL can vary run to run, so bronze is your only replayable record — see "Layers" below):

```
1. mcp__MotherDuck__query     → SELECT max(event_time) FROM warehouse.silver_table   (the watermark)
2. mcp__MyGeotab_MCP__AskDataAgent → "give me all <entity> rows after <watermark>, columns: ... include
                                     every device; do not filter on IsTracked" → {sql, row_count, data_uri}
                                     (read `sql`; row_count 0 on a busy window = FAILURE, Q2)
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

**Before deriving silver, inspect what came back** (shape + size; `row_count` must equal the CSV's
`COUNT(*)`) and decide: derive as-is, map columns by position, or re-ask the agent. Bronze append is
unconditional (lossless); never derive silver blind. See
[`references/MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md).

## Data-agent quirks — by severity (be aware of these while managing the warehouse)

Full text: [`references/QUIRKS.md`](references/QUIRKS.md) (stable `Q#` IDs). Field guide with copy-paste
prompts: [`references/DATA_AGENT_TO_CSV.md`](references/DATA_AGENT_TO_CSV.md). Measurements/proof:
[`references/EVIDENCE_LOG.md`](references/EVIDENCE_LOG.md) §1b, keyed by the same `Q#`.

**🔴 Wrong or missing data, with no error — ranked by importance (Q1 matters most):**
- **Q1** — The agent can **silently answer for a different window** and its `Trip` table lagged ≥ 1 h 44 min (GPS/Status 11–23 s); the only flag is `freshness: stale` + a message → **on `stale`, compare the returned min/max to the window you asked for; keep trips behind a `Get` completeness check.**
- **Q2** — `status: success` can be an **empty answer** (`row_count 0`, `data_uri ""`, `turn_id -1`, or a scalar 0) and a genuinely empty window looks **identical** → **0 rows on a window with data = failure; read `sql`; never advance a watermark on it; confirm with a `Get` count.**
- **Q3** — Roster-based asks ("fleet", "vehicles", lists by device) get `IsTracked = TRUE` + `Device_ActiveTo >= now`; plain GPS asks got `GpsValid = 1`. Demo fleets (all `IsTracked=false`) came back "0 vehicles, 0 trips" 6/6 → **every prompt: "include every device; do not filter on IsTracked, GpsValid, speed or ignition."** *(demo-sensitive; untested on a production fleet)*
- **Q4** — Agent-derived columns are the agent's arithmetic: `TripDuration − IdlingDuration` gave **negative** minutes (10 of 77 trips) → **ask for raw columns; derive in silver.**
- **Q5** — Units convert km → miles unless pinned (2/2, despite `isMetric: true`) → *"in kilometers, do not convert units."*
- **Q6** — A catalog table can answer instead of the fact table ("engine status data readings" → the `Diagnostic` *catalog*, 2/2) → **name the table; read the `FROM` every load.**
- **Q7** — Predicates and joins vary per run (guards every query; joins always `LEFT … BETWEEN Device_ActiveFrom/To`; 0 duplicate rows in 6 CSVs) → **read the SQL; dedup silver on the parsed natural key; expect `csv_rows ≥ distinct keys`.**

**🟡 Operational — derails or misleads the run (usually visible):**
- **Q8** — **~60 s tool timeout** (StatusData: 1 day passes, 2 days failed 2/2) and transient errors (502; future-dated prompts fail) → chunk windows (status ≤ 1 day, GPS/trips ≤ 1–2 days); **retry once**, then shrink/rephrase; no future dates.
- **Q9** — Column-case drift (`Data` → `DATA`, 3/3) → key by the CSV header.
- **Q10** — KPI-flavored asks use the `VehicleKPI_Daily` rollup and device-local dates (equal to raw on these all-UTC fleets) → **ask for raw rows with explicit UTC bounds.**
- **Q11** — Don't use the agent as a freshness/watermark oracle → watermark from `max(silver)`; live reading from `Get DeviceStatusInfo`; confirm the window's upper bound is *now*.
- **Q12** — Event tables (`Trip`/`FaultData`/`Events`) update only on an event, *or* lag (Q1) → compare with the Get API / count events in a recent window before concluding which.
- **Q13** — Wrong database/server name → ask the user; the Geotab DB is the MyGeotab login name.
- **Q14** — Just-changed config (zones, groups, rules, users, metadata) → **read from `Get`**, not the agent. *(a created zone took 23–29 min to appear in the agent)*
- **Q15** — ChatGPT: **both MCP servers must be the same mode**; **preflight** with a tiny call before any DDL. *(field-reported)*

**⚪ Informational:** **Q16** inline ~5–10 KB envelope, 20-row preview, single `data_uri`, stateless (`delegation_context` for follow-ups); exceptions live in the **`Events`** table · **Q17** `UTC_*` carry `+00:00`, `GpsDateTime` is naive ISO — land `all_varchar`, parse in the derive · **Q18** signed URL lasts 24 h, bucket region varies, one file up to 53 MB; log the `gs://` path not the signature.

**Always:** the agent **returns the SQL it ran** — by design, an approval surface, not a leak. **Lint it
before loading** — it exposes the *semantic* 🔴 issues (Q1, Q3–Q7) while they're still free to fix
([`QUALITY_AND_REPAIR.md`](references/QUALITY_AND_REPAIR.md) §2). The *data-shape* problems aren't in the
SQL: **Q2/Q8** need you to check `row_count` against the CSV, **Q1** needs the returned min/max compared to your window, and
**Q7** needs the **silver dedup** after load — linting won't surface any of them.

## Three source channels — pick per entity *and* per freshness need

| Channel | Best for | Shape | Freshness (observed) | Reference |
|---------|----------|-------|----------------------|-----------|
| **Data agent → CSV URL** | High-volume **facts**: GPS (`GpsLogs`), trips, status/engine, exceptions, faults | signed CSV, bulk (`row_count` returned) | **GPS/StatusData ~11–23 s behind** (4 samples); **`Trip` ≥ 1 h 44 min behind** at one sample (Q1) | [`DATA_AGENT_TO_CSV.md`](references/DATA_AGENT_TO_CSV.md) |
| **Get → JSON** | **Dimensions** & small/precise sets: `Device`, `User`, `Zone`, `Group`, `Diagnostic`, `Rule`; raw `LogRecord` for a window | JSON, paged | **to ~now** (full-res raw) | [`ENTITY_CATALOG.md`](references/ENTITY_CATALOG.md) |
| **Get `DeviceStatusInfo`** | **Live** position/speed/ignition snapshot per device | JSON, 1 row/device | **~sub-second** | [`CHANNELS_AND_FRESHNESS.md`](references/CHANNELS_AND_FRESHNESS.md) |

Rule of thumb: **dimensions via `Get` (authoritative, exact), facts via the data agent (bulk export), live
map via `Get DeviceStatusInfo`.** Continuous streams lag only tens of seconds; the freshest sliver can be
topped up with a small raw `Get LogRecord` read. A `dim_device` from `Get` also resolves `DeviceName`↔`DeviceId`
and enriches every fact table. **Don't historize `DeviceStatusInfo`** — it's a snapshot, not an event stream.
Full decision matrix (live / bulk window / historical backfill / settle the gaps):
[`CHANNELS_AND_FRESHNESS.md`](references/CHANNELS_AND_FRESHNESS.md).

## Layers (bronze / silver / gold)

| Layer | Purpose | Example | Dedup? |
|-------|---------|---------|--------|
| **Bronze** | Lossless landing, exactly as returned (`all_varchar=true`) + provenance cols | `bronze_gps_raw` | no (append-only) |
| **Silver** | Typed, conformed, deduped on natural key — the queryable table, **a deterministic projection of bronze** | `planet_gps_pings` | yes |
| **Gold** | Business marts/aggregates (built later, for analysis) | `daily_device_km` | n/a |

**The bronze rule (the decision that matters):** bronze is **mandatory for data-agent facts** and
**skipped for `Get`-sourced dimensions.** Why: the agent's output is *not reproducible* — the signed CSV URL
expires in ~24 h and the generated SQL can differ between runs, so bronze is the only durable, replayable
record of what you ingested, and silver is derived from it. `Get` is exact and reproducible any time
(reconciles with `GetCountOf`), so dimensions land straight to a typed `dim_*` with no bronze. Don't load a
fact silver straight from the URL, and don't put bronze under a dimension.

DDL, the bronze→silver derive, and the brownfield bootstrap: [`references/MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md).

## Reference files

| Reference | When to read |
|-----------|--------------|
| [`DATA_AGENT_TO_CSV.md`](references/DATA_AGENT_TO_CSV.md) | **Start here for Geotab facts.** `AskDataAgent`: response shape, copy-paste prompts per entity, CSV checks, timeout/chunking, failure modes |
| [`QUIRKS.md`](references/QUIRKS.md) | The numbered `Q1…Q18` quirk catalog (what to be aware of, why, the one action) |
| [`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) | The bronze-vs-`Get` decision rule, bronze/silver/gold DDL, append-only bronze + deriving silver from it, the brownfield bootstrap, shape checks, normalized-key dedup, full replay |
| [`INCREMENTAL_BACKFILL.md`](references/INCREMENTAL_BACKFILL.md) | The backfills (forward catch-up, historical recovery, cross-channel reconciliation, trip re-split), the `warehouse_ingest_log` state table, watermarks, gap detection, the active-only population check, and the settle loop |
| [`ENTITY_CATALOG.md`](references/ENTITY_CATALOG.md) | What to replicate beyond GPS: per-entity channel, natural keys, suggested schemas, the `Get` pagination quirk (cursor vs date-window) |
| [`QUALITY_AND_REPAIR.md`](references/QUALITY_AND_REPAIR.md) | Post-load quality tests, predicting problems by reading the agent's generated SQL, the SQL-vs-results failure split, and repair strategy (re-ask vs. patch the gap) |
| [`CHANNELS_AND_FRESHNESS.md`](references/CHANNELS_AND_FRESHNESS.md) | How fresh each channel is, the live/bulk/backfill/settle decision matrix, the active-only coverage trap, and why `GetCountOf` can't reconcile fact windows |
| [`COST_AND_SIZING.md`](references/COST_AND_SIZING.md) | What it costs to run: the Geotab side is free on the Go plan; MotherDuck Lite free tier (10 GB); measured ~16–54 B per GPS ping; free-tier capacity in vehicle-years; and small→very-large fleet monthly estimates |
| [`EVIDENCE_LOG.md`](references/EVIDENCE_LOG.md) | **Reproducibility ledger** — reusable probes (stable prompts/SQL) + an **append-only dated results table** + per-run archives. Re-run a probe, append a row; the latest row is current truth. Start here to rebuild, investigate, or re-measure a claim. |
| [`CHANGES_v1.1_to_v2.0.md`](CHANGES_v1.1_to_v2.0.md) | History only: how this skill differs from the earlier Ace-based version. **Not needed to run the skill.** |

## First run on a new Geotab database — isolate BEFORE you write

The examples in this skill use **`my_db`**, the demo warehouse for `demo_fh4`. **For a different Geotab
database, never reuse `my_db` or any other source's database** — Geotab IDs (`b1`,`b2`,…) repeat across
databases, so sharing tables silently collides (Non-negotiable #12). Do these steps before any write:

1. **Preflight the connectors — *before* any DDL.** Confirm all three tools you'll need are actually
   callable now: MotherDuck, Geotab **`Get`** (dimensions), and Geotab **`AskDataAgent`** (the bulk fact
   channel). Verify the agent with a tiny call (e.g. "how many devices exist?", expect a non-zero count),
   not just `Get`. **ChatGPT setup gotcha:** the Geotab and MotherDuck servers must be in the **same mode** —
   both official connectors *or* both developer-mode; a mixed setup dropped the Geotab connector mid-session
   (2026-06-29), leaving a warehouse with empty bronze. **If the agent isn't callable, fix the connector
   setup and stop before creating tables** — facts need it; don't leave a half-built warehouse.
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
> concat/parse aggregates into small steps). Also seen: a **long signed URL inline in
> `read_csv_auto('<url>')` was blocked**; concatenating the URL from string pieces in SQL got it through.
> And a one-shot derive over 20M+ rows hit the tool timeout — derive **per day** (see
> [`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) §large facts).

Two sources must never share a database (db-per-source + schema-per-layer is the only supported layout).
Rationale: [`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) §isolate.

## Bootstrap vs daily run vs the backfills

- **0 → warehouse (first time):** **isolate first** (§First run — create `geotab_<source>` + layer
  schemas, never reuse another source's DB) → **load dimensions via `Get` first** (no bronze —
  `dim_device` is the exact roster that the fact loads' population check and `DeviceName`↔`DeviceId`
  resolution need, so it must exist *before* the first fact lands) → create bronze + silver tables →
  per fact entity, run *bounded historical* agent pulls (a day at a time) into **bronze**, then derive
  silver. If a silver table already exists without a bronze under it, reconstruct bronze from silver
  once (the brownfield bootstrap) so silver becomes rebuildable.
  See [`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) §Brownfield.
- **Daily update (steady state):** for each fact table run the 4-call loop above (watermark → agent →
  append bronze → derive silver), bracketed by the two `warehouse_ingest_log` rows — `started` right
  after the agent returns, `completed` after the verify (rule #11). Re-running is safe (the
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
| "re-check **`Get` + the agent** aren't missing rows" | cross-channel reconciliation (gap detection + population/count cross-checks + settle loop) | interior holes & channel disagreements |
| "trips I **already loaded changed** (DriverChange / late GPS re-split them)" | trip re-split reconcile (delete retired orphans + anti-join new ids) | mutation *in place* — only `Trip` |

## Non-negotiable rules

1. **Data-agent facts land in bronze first; silver is derived from bronze** — never load a fact silver
   straight from the URL. `Get` dimensions skip bronze (reproducible) and land straight to `dim_*`.
   The source is non-reproducible (URL expires ~24 h, the generated SQL can vary) so bronze is the only
   replayable record. Bronze is **append-only** (`CREATE TABLE IF NOT EXISTS` + `INSERT`, never
   `CREATE OR REPLACE`); stamp every batch with provenance (`_batch_id`, `_source_channel`, …).
2. **Always check shape & size before deriving.** `DESCRIBE SELECT * FROM read_csv_auto('<url>')` and a
   `COUNT(*)` + `min/max(event_time)`; the count must equal the response's `row_count`. Confirm
   columns/types *or* map by position in the derive. (On restrictive MCP hosts that block
   `DESCRIBE`/multi-statement/complex SQL — e.g. ChatGPT — use `list_columns`/`list_tables`, one statement
   per call, and simple staged shape-check SQL.)
3. **Dedup every silver derive** (Q7) — `> watermark` filter or natural-key anti-join, and dedup on the
   **parsed/normalized** key (bronze keeps timestamp text as returned). Never trust the window boundary.
4. **Ask the agent for data + exact columns.** **Specificity beats attached SQL:** name exact columns, pin
   units ("in km, don't convert"), force "Use UTC," say "raw rows, do not aggregate," and "include every
   device; do not filter on IsTracked, GpsValid, speed or ignition" (**always** — the default filters
   silently empty or thin results, Q3/Q2). Request raw source columns and derive in silver (Q4).
5. **Read the agent's `sql` before every load** (it's the approval gate) and check `row_count` against the
   CSV. The response is small and inline — there is nothing to parse out of a file.
6. **`query_rw` is a write** — only on explicit user intent ("load/append/sync"); the warehouse loop counts. An explicit "replicate/load/sync this database" request *is* that intent — it's the confirmation for hosts that gate writes.
7. **Test credentials/queries once**, not in a loop. Load CSVs into bronze **within ~24h** before the URL expires.
8. **Don't store the signed URL's query string** (it carries a signature) — log the `gs://…/<uuid>…csv` object path instead: drop everything from `?` and rewrite the host, `https://storage.googleapis.com/<bucket>/<object>?X-Goog-…` → `gs://<bucket>/<object>`. (The bucket region varies by DB — `…-prod-us`, `…-prod-eu`, … — so match by shape, not a fixed host.)
9. **Read the generated SQL** (it's in the response) as a pre-load gate — most problems are visible there before any row loads. Classify failures: *SQL/semantic* (wrong source, filter, timezone, aggregation) → **re-ask** with sharper wording; *result/data* (dupes, nulls, schema drift) → **fix in the derive**. See [`QUALITY_AND_REPAIR.md`](references/QUALITY_AND_REPAIR.md).
10. **Run the quality battery after every load** (uniqueness, bounds, nulls, freshness, referential integrity, reconciliation). Reconcile **dimensions** with `GetCountOf` (exact); reconcile **fact windows** with a bounded `Get` read of the same window — **`GetCountOf` ignores date/device filters for facts** and returns the whole-table count. To repair, prefer **asking for the missing window + anti-join** over re-asking the whole question — the agent can answer the same question from a different source table across runs (Q6), so a full re-ask can replace good data with a differently-shaped answer.
11. **Writes can drop mid-call — and whole runs can die mid-loop.** Keep writes idempotent (silver/gold `CREATE OR REPLACE` or `IF NOT EXISTS` + watermark/anti-join; bronze append-only) and re-check with `list_tables`/`COUNT(*)` before retrying. **Log ahead, not just after:** write a `started` row to `warehouse_ingest_log` the moment the agent returns (persisting the window + `gs://` path), and a `completed` row only after the verify — so an interruption leaves a *visible orphan* to resume from instead of a silent hole (observed 2026-07-02: an interrupted run left 522K GPS rows loaded but unlogged, and the loop's other tables never ran). On session start, sweep for orphaned `started` rows and bronze batches missing from the log, and **finalize each orphan to a terminal row** so it clears — append-only, never `UPDATE`: `completed` when bronze verifies; otherwise re-ask the saved window (safe default). Only mark `abandoned` with **proof the window already landed another way** (a later `completed` row spanning it, or a gap-scan showing no hole) — never on age alone, or you'd bury a real gap ([`INCREMENTAL_BACKFILL.md`](references/INCREMENTAL_BACKFILL.md) §state table). **Expect a big backfill to pause on the host's per-turn tool-call limit — just say *continue*;** the log-ahead + orphan-sweep design makes resuming across turns safe (chunk windows so each pause lands on a clean boundary).
12. **One MotherDuck database per Geotab source + a schema per medallion layer** (`geotab_<source>.bronze.*` / `.silver.*` / `.gold.*`). Geotab entity IDs (`b1`,`b2`,…) are unique only *within* a database, so two sources in the *same* tables **collide** in silver/dims (append+dedup, not overwrite — worse). Database-level isolation is also where MotherDuck scopes Sharing, retention, access, and cost. **On a new source, `list_databases` FIRST and create a fresh `geotab_<source>`; never write into a database that already holds another source.** **Provenance: keep per-row `_batch_id`; record the source identity once at the DB level** in a `main.warehouse_meta` table (+ optional `COMMENT ON TABLE`, `warehouse_ingest_log`) — **no per-row `_source_db`** (constant in this layout). **Don't use `COMMENT ON DATABASE` — it's *not implemented* in MotherDuck** (verified 2026-06-30: "Not implemented Error: Adding comments to databases is not implemented"); `COMMENT ON TABLE`/`COLUMN` do work. ([`MEDALLION_LOADING.md`](references/MEDALLION_LOADING.md) §isolate, [`SKILL.md`](SKILL.md) §First run.)
13. **Preflight the connectors before any DDL/write.** Confirm MotherDuck, Geotab `Get`, **and** Geotab `AskDataAgent` are callable *now* — verify the agent with a tiny call, not just `Get`. **On ChatGPT, use both servers in the same mode** (both official connectors or both developer-mode) — a mixed setup dropped the Geotab connector mid-session (2026-06-29), leaving an empty-bronze warehouse. If the agent is unavailable, fix the setup and **stop before creating tables** — bulk facts need it. Bootstrap is resumable (`IF NOT EXISTS`), so a clean stop is safe to continue later.
14. **Mirror real source data only — never fabricate, synthesize, or infer rows/tables.** Every table must trace to a Geotab pull (data agent or `Get`). Don't invent dimensions or "demo" layers (observed: an agent created `dim_driver` / `trip_driver_assignment` / `operator_*` "synthetic assignments" that didn't exist in the source — they had to be removed). If the source has no drivers, the mirror has no drivers. Need a derived/illustrative table? Put it in **`gold`**, clearly named, built **only** from real silver — never seeded with made-up values. When asked for something the source doesn't contain, say so; don't fill the gap with synthetic data.
15. **`Trip` is a *mutable* fact — forward catch-up alone silently rots it.** Geotab re-splits trips (a `DriverChange`, or late/out-of-order GPS), changing an already-loaded trip's `TripId` and stop time. Because the re-split trip *starts before your watermark*, the forward derive never sees it, leaving a **stale orphan** (retired id) plus a **missing** current split. After every forward trips load, run the **trip re-split reconcile** over a lookback `L` before the prior watermark — **`L` ≥ your longest expected trip** (a few hours urban, ≥24–36 h long-haul; this also catches long trips that *completed* after a later trip advanced the start-watermark): delete silver trips whose `TripId` is no longer in a fresh source pull **and is confirmed gone by a bounded `Get Trip` read** (the agent's `Trip` table can lag, Q1), then anti-join the confirmed new ids in (the one place silver fact rows are `DELETE`d — source-justified, bronze still holds every version). Verify the day's source vs silver `TripId` sets match. This is **not** needed for append-only event facts (`ExceptionEvent`/`FaultData`). Observed 2026-06-30 on `Demo_fh_vegas4`: 50 orphans + 51 missing on a single day, all clustered at the watermark boundary. ([`INCREMENTAL_BACKFILL.md`](references/INCREMENTAL_BACKFILL.md) §D.)
