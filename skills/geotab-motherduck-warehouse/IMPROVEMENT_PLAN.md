# Improvement plan: lessons from the official MyGeotab API Adapter

**Status: IMPLEMENTED 2026-07-02** (same branch). What landed, by theme:

- **Theme 1** ✅ — `guides/DATA_WAREHOUSE_COMPARISON.md` (human-facing comparison),
  `CHANNELS_AND_FRESHNESS.md` §Relationship to the adapter (+ the three-way `GetFeed` verification,
  ledger row 2026-07-02), SKILL.md intro pointer, `COST_AND_SIZING.md` adapter sizing corroboration.
- **Theme 2** ✅ — `ENTITY_CATALOG.md` §Deletions (full-refresh-only visibility, subset caveat,
  `activeTo` handling); SKILL.md bootstrap reordered dims-before-facts (now consistent with
  `INCREMENTAL_BACKFILL.md` §A, which already said so).
- **Theme 3** ✅ — `MEDALLION_LOADING.md` §Gold ASOF pattern, **validated live** (probe **P17**:
  822,203 events, 100% matched, median gap 2 s, p95 23 s — ledger 2026-07-02).
- **Theme 4** ✅ (validated subset) — catalog rows for `DriverChange`/`FuelUsed`/`Audit`/
  `Controller`/`FailureMode` (all counted live 2026-07-02), the **Mutates?** column, the
  `Audit`-not-`AuditLog` gotcha, DVIR/HOS/fuel-card/EV marked **empty on demos — unvalidated**
  (revisit on a fleet that has them). `BinaryData`: excluded, media tools instead.
- **Theme 5** ✅ — §A full-page stop-condition; `warehouse_health` query documented + **validated
  read-only** (probe **P18** — it immediately surfaced a real unlogged GPS load on the vegas mirror);
  one-writer-at-a-time caution. The view itself is *not created* on the live mirrors (that's a write;
  create it at the next load session's bootstrap).
- **Theme 6** ✅ — `COST_AND_SIZING.md` downsample-in-the-derive lever with the reversibility caveat.

The original proposal follows for context. Source studied:
[MyGeotab API Adapter README](https://github.com/Geotab/mygeotab-api-adapter/blob/master/MyGeotabAPIAdapter/README.md)
(read 2026-07-02). The adapter is Geotab's official, production-grade .NET service that mirrors a
MyGeotab database into SQL Server/PostgreSQL — i.e., the battle-tested daemon version of exactly what
this skill does agent-driven through MCP. It encodes years of production lessons; this plan mines them
and adapts (not copies) the ones that fit our constraints: MCP tools instead of direct API, DuckDB
instead of Postgres, on-demand agent runs instead of a 24/7 service.

Conventions: follow [`MAINTAINING.md`](MAINTAINING.md). Adapter-derived claims are *documentation-sourced*
(cite the README + date); anything about live behavior must be validated on the reference databases and
logged in [`references/EVIDENCE_LOG.md`](references/EVIDENCE_LOG.md) before it lands as a skill claim.

---

## Theme 1 — Positioning + the `GetFeed` gap *(doc-only, cheap, do first)*

**Adapter lesson.** The adapter's incremental engine is **`GetFeed`**: a version-token cursor per entity
type, persisted in `OServiceTracking2`, resumed on restart. No time-boundary dedup problem — the token is
exact. It also has a built-in "behind" signal: a feed page of ≥1,000 results means poll again immediately;
<1,000 means you're current.

**Skill changes.**
1. Add a short **"Relationship to the official MyGeotab API Adapter"** note (SKILL.md or
   `CHANNELS_AND_FRESHNESS.md`): the adapter is the right tool for 24/7 sub-minute-freshness mirrors with
   real infra (self-hosted .NET service + Postgres/SQL Server); this skill is the zero-infra, MCP-only,
   agent-cadence analog. Users who outgrow the daily loop should know the graduation path exists.
   *Partially done 2026-07-02:* the human-facing comparison now lives in
   [`guides/DATA_WAREHOUSE_COMPARISON.md`](../../guides/DATA_WAREHOUSE_COMPARISON.md); what remains is a
   one-line pointer to it from the skill itself so agents running the skill know the guide exists.
2. **Acknowledge `GetFeed` explicitly and say why we don't use it**: the Geotab MCP server has **no
   `GetFeed` capability** — verified 2026-07-02 three ways against the live server: (a) the full tool
   list (20 tools: `Get`/`GetCountOf`/`GetAceResults`/`GetEntity`/`ListEntities`/`Add`/`Set`/`Remove` +
   media/EV/HOS helpers) contains no feed tool; (b) the `Get` tool's schema takes only
   `database`/`typeName`/`search`/`propertySelector`/`resultsLimit`/`sort`/`server` — no
   `fromVersion`/feed-token parameter, and no generic method passthrough exists that could reach
   `GetFeed`; (c) the server's sole MCP resource is `mygeotab://entities` (entity schemas, not methods).
   Watermarks + natural-key dedup are therefore the MCP-compatible substitute for the feed token. This
   preempts the obvious "why not the official feed API?" question, and defines what to adopt if the MCP
   ever grows a `GetFeed` tool (it would replace the watermark, not bronze/silver).
3. `COST_AND_SIZING.md`: cite the adapter's sizing datapoint (~20,000 devices → ~40 GB PostgreSQL in
   7 days, per README) as external corroboration next to our measured numbers.

## Theme 2 — Dimension lifecycle: deletions don't flow through incremental pulls *(correctness, high priority)*

**Adapter lesson.** Reference data uses a **two-tier cache**: frequent incremental *updates* (every
1–10 min) plus periodic **full refreshes** (every 1–24 days) — the full refresh exists *specifically
because deletions never appear in incremental results*. The adapter also enforces **dependency
ordering**: entity caches (Device, Diagnostic) must be loaded before the feeds that reference them.

**Skill changes.**
1. `ENTITY_CATALOG.md` §Dimensions: our delete-then-insert / `CREATE OR REPLACE` dim refresh is already
   implicitly delete-safe — **make the why explicit** ("a full re-pull is the only way to see deletions;
   never switch dims to incremental-only updates"). Add a suggested full-refresh cadence column.
2. **The large-dim subset path is NOT delete-safe.** For the "load only the `DiagnosticId`s your facts
   reference" strategy (65K diagnostics → ~56 referenced), state that the subset must also be *fully*
   re-pulled on refresh, and stale ids flagged.
3. For `dim_device`/`dim_user`, prefer surfacing `activeFrom`/`activeTo` (archival, the common case) and
   note that a row present in the dim but absent from a fresh `Get` pull means a hard delete — flag it,
   don't silently keep it.
4. **Flip bootstrap order in SKILL.md: dimensions before facts.** Currently the bootstrap runs fact pulls
   first, dims last. The adapter's ordering is the reverse, for good reason that applies to us too: the
   device-population check and `DeviceName`↔`DeviceId` resolution during fact loads need `dim_device` to
   exist. Cheap edit, real workflow improvement.

## Theme 3 — Location enrichment for StatusData/FaultData via ASOF JOIN *(new gold pattern, highest user value)*

**Adapter lesson.** `FaultData` and `StatusData` records carry **no coordinates**. The adapter dedicates
2 of its 29 services to interpolating lat/lon/speed/bearing from surrounding `LogRecords` — and delays
processing by a configurable buffer (default 24 h) so late-arriving GPS is present before enriching.

**Skill changes.**
1. Add a **gold-layer enrichment pattern** (likely in `MEDALLION_LOADING.md` §gold, cross-linked from
   `ENTITY_CATALOG.md`): what takes the adapter two background services is roughly **one DuckDB `ASOF JOIN`**
   between `silver.status_data`/`fault_data` and `silver.planet_gps_pings` (nearest ping at-or-before the
   event, per device; optionally linear interpolation between bracketing pings). This is a showcase-grade
   DuckDB feature and a very common user ask ("where did this fault happen?").
2. Adopt the **buffer insight**: only enrich events older than a small buffer, or simply rebuild the gold
   mart on schedule — our own evidence (late-GPS trip re-splits, `INCREMENTAL_BACKFILL.md` §D) already
   proves GPS arrives late; say the same hazard applies to enrichment near the watermark.
3. **Validate live before landing** (evidence discipline): confirm on the reference mirrors that
   status/fault silver has no coordinates; run the ASOF join over a real day; measure match rate and the
   event↔ping time-delta distribution; add a probe (next free `P#`) + dated EVIDENCE_LOG rows.

## Theme 4 — Entity catalog expansion, with a mutability column *(medium)*

**Adapter lesson.** The adapter feeds 14 entity types and caches ~10 reference types. Not yet in our
catalog: `DriverChange`, `DVIRLog` (+ defects), `DutyStatusLog` / `DutyStatusAvailability` (HOS),
`FuelAndEnergyUsed`, `AuditLog`, `BinaryData`, and the fault-decoding dims `Controller` / `FailureMode` /
`UnitOfMeasure`. It also treats mutability seriously (DVIR defects get *updated* with repair status).

**Skill changes.**
1. Add catalog rows for the missing entities — channel by size, natural key, cadence — **each validated**
   on the demo databases with `GetCountOf`/`GetEntity` before the row lands (many will be empty on demo
   fleets; say so rather than guessing schemas).
2. **`DriverChange` is doubly valuable and deserves emphasis**: it's the driver-assignment fact *and* the
   primary cause of trip re-splits — fresh `DriverChange` rows in the lookback window are a cheap signal
   that operation D (trip re-split reconcile) will find drift. Cross-link to `INCREMENTAL_BACKFILL.md` §D.
3. Add a **"mutates after creation?"** column to the catalog table. We learned the hard way that `Trip`
   mutates (rule #15); the adapter's DVIR write-back shows `DVIRLog` mutates too (repair status). Making
   mutability a first-class per-entity property tells the reader which entities need a D-style reconcile
   vs. plain append — instead of rediscovering it per entity.
4. `Controller`/`FailureMode` as dims: without them DTC `FaultData` is not human-readable. Small `Get`
   dims, same pattern as `dim_diagnostic`.
5. `BinaryData`: likely **exclude** with a pointer to the media tools (`SearchMedia`/`GetMediaUrl`) —
   blobs don't belong in the warehouse. Decide after a live look.

## Theme 5 — Catch-up pacing + a warehouse health view *(ops, small)*

**Adapter lessons.** (a) The ≥1,000-results "I'm behind, poll immediately" heuristic. (b) Health is
observable in one place: `OServiceTracking2` (per-service last-processed time + cursor) plus `vwStats*`
views. (c) A machine-name guard prevents two instances writing concurrently.

**Skill changes.**
1. `INCREMENTAL_BACKFILL.md`: encode a **stop-condition rule** for catch-up loops — if a window's pull
   returns rows right up to the `hi` bound (or a `Get` page fills `resultsLimit`), you're behind: continue
   immediately; a partial window means current: stop. (Verify how much of this §A already implies; make
   it explicit either way.)
2. Propose a **`main.warehouse_health` view** per warehouse: one query joining `warehouse_ingest_log`
   with per-table `max(event_time)` + row counts → "is every table fresh, and when did each last load?"
   This is the first question every session asks; today it takes N ad-hoc queries. Validate on the live
   mirror; document the DDL in `INCREMENTAL_BACKFILL.md` (which owns `warehouse_ingest_log`).
3. Add a short **concurrent-writer caution**: two agent sessions running the loop simultaneously is
   mostly safe (bronze double-appends collapse in the silver dedup) **except** interleaved operation-D
   reconciles, which can delete each other's fresh rows. One writer per warehouse at a time.

## Theme 6 — Downsampling as a cost lever, done better than the adapter *(small)*

**Adapter lesson.** Minimum-interval sampling for LogRecords/StatusData (per-device, or
per-device-per-diagnostic, 1–3600 s) — with a hard warning: it discards at ingest, **can never backfill**.

**Skill change.** Add a `COST_AND_SIZING.md` lever: for StatusData-heavy mirrors (the 12× storage
multiplier), downsample **in the silver derive or a gold mart, never at ingest** — bronze keeps every
row, so unlike the adapter's sampling ours is reversible… *while bronze is retained*. State the caveat
plainly: once bronze is pruned (the 7–30 day rolling window), downsampling becomes permanent for pruned
windows — pick the interval before pruning catches up to it.

---

## Explicitly not adopting

- **Partition management** (`spManagePartitions`, monthly/weekly/daily partitions): DuckDB's columnar
  storage doesn't need it; the per-shard/per-day derive already covers the operational analog.
- **DVIR write-back manipulator**: out of scope — this skill is a read-only mirror. (MCP `Set`/`Add`
  exist, but write-back is a different skill with different safety rules.)
- **Staging-table merge** (`stg_*` → main): bronze→silver already provides staged, transactional-enough
  loading with better replayability.
- **Historizing `DeviceStatusInfo`**: the adapter does feed it; our stance holds — `LogRecord`/`StatusData`
  carry the history, the snapshot is derivable. Worth one FAQ-style sentence acknowledging the adapter
  differs and why.

## Sequencing & process

| Phase | Themes | Validation needed | Est. size |
|-------|--------|-------------------|-----------|
| **1 — doc-only** | 1, 2 (items 1–3), 5.3, 6 | none (cite adapter README, dated) | 1 PR, small |
| **2 — bootstrap-order + pacing** | 2.4, 5.1 | re-read affected runbooks for consistency | 1 PR, small |
| **3 — live-validated patterns** | 3 (ASOF enrichment), 5.2 (health view) | probes + EVIDENCE_LOG rows on reference mirrors | 1 PR each |
| **4 — catalog expansion** | 4 | per-entity `GetCountOf`/`GetEntity` on demo DBs | 1 PR |

Priority if picking two: **Theme 2** (silent-staleness correctness) and **Theme 3** (biggest user value,
shows off DuckDB). Theme 1 is nearly free and adds context that pays off in every session.

Per `MAINTAINING.md`: no quirk renumbering is needed (these are patterns, not new quirks); every live
measurement gets a dated EVIDENCE_LOG row; run `bash tests/gem-validation/run.sh` and check internal
links before each push; if the live mirrors are touched, append to EVIDENCE_LOG §2.
