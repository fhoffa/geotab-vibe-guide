# What changed: v1.1 → v2.0 (Geotab side rebuilt around the MyGeotab MCP data agent)

**Why:** the official MyGeotab MCP now exposes a **data agent** (`AskDataAgent`) — natural language →
BigQuery SQL → `{sql, 20-row preview, row_count, data_uri}` — alongside the classic `Get` API tools. The
warehouse skill's Geotab side (v1.1) was built, measured and hardened around `GetAceResults`. v2.0
re-validated that whole side on `demo_fh8` (2026-10-29, 16 data-agent calls + `Get`/`GetCountOf` ground
truth + two CSV downloads) and rewrote what changed.

**Frozen previous version:** [`archive/v1.1/`](archive/v1.1/) (verbatim). Compare with
`diff -ru archive/v1.1/references references` from this folder.

**Untouched on purpose (MotherDuck side):** bronze/silver/gold layering, `warehouse_ingest_log` log-ahead,
orphan sweep, trip re-split reconcile, health view, dimension-delete handling, ASOF enrichment, cost
model. Those do not depend on which Geotab tool fetches the data and were not re-tested here.

## At a glance

| Area | v1.1 (Ace) | v2.0 (data agent) | Evidence |
|------|------------|-------------------|----------|
| Fact tool | `GetAceResults(new_chat, chat_id, …)` | `AskDataAgent(database, prompt, delegation_context?)` | P19–P27 |
| Response | 110–192 KB chat blob, spilled to a file; parse URL / `columns` / SQL with grep+python | ~5–10 KB structured JSON: `sql`, `data_preview` (20 rows), `row_count`, `data_uri`, `freshness` | all calls |
| Count check | count the CSV yourself | `row_count` returned → must equal CSV `COUNT(*)` (it did: 11,599 / 368,764) | P21, P25 |
| URL(s) | array; large exports shard (8–10 files) | single `data_uri`; 26 MB / 368,764 rows = 1 file | P25 |
| Chat state | `chat_id`, continue-chat | stateless; `delegation_context` for follow-ups | P27 |
| Latency | ~33 s floor per call, "don't parallelize" | no floor evident; **~60 s tool timeout**; 4 parallel calls fine | P25, P27 |
| Timestamps | ` UTC` suffix | `UTC_*` `+00:00`; `GpsDateTime` naive ISO | P21, P25 |
| "CSV/URL" wording | degrades the schema (#8) | no degradation | P23 |
| Joins | `LatestVehicleMetadata` LEFT↔inner flip + fan-out (#12) | always LEFT with active-window `BETWEEN` — no fan-out seen | P21, P24 |
| Duplicates | boundary second + intermittent ~2× (#6) | 0 duplicates in 3 CSVs (dedup kept as free insurance) | P21, P25 |
| Upper-bound clip | ~1/3 of calls (#20) | 0 of 3 | P26 |
| GPS lag | ~19–98 s | ≈16–23 s (2 samples) | P20, P26 |

## Still true (reproduced) — the guard rails stay

- **#11 / #13** unpinned distance → `VehicleKPI_Daily`, `Local_Date`, miles (`×0.621`). Pin units, ask for raw rows.
- **#15** wrong source: "engine status data readings" → `Diagnostic` **catalog**, 120 rows, `success`. Name the table.
- **#14** validity filters: new `GpsValid = 1` injected on a plain GPS ask.
- **#7** column-case drift: `Data` → `DATA`.
- **Predicate guards** are still injected (widening only here) and differ run to run — read the SQL every load.

## New in v2.0

| ID | Sev | What | Rule |
|----|-----|------|------|
| **#21** | 🔴 | `status: success` with an **empty/zero answer**: default `IsTracked = TRUE` + `Device_ActiveTo >= now` → "0 vehicles, 0 trips" on a 50-vehicle fleet (all `IsTracked=false`); empty result = `row_count 0`, `data_uri ""`, `turn_id -1` | Forbid `IsTracked` in every prompt; `row_count = 0` on a window with data is a **failure**; never advance a watermark on it |
| **#22** | 🟡 | Agent-derived columns are the agent's arithmetic: `(TripDuration − IdlingDuration)/60` → **negative** minutes | Ask for raw columns, derive in silver |
| (extends #9) | 🟡 | ~60 s tool timeout: 2-day StatusData failed; 12 h passed; identical trips prompt timed out once then passed | Chunk (½-day status, 1-day GPS/trips); retry once before shrinking |
| (setup) | ⚪ | Geotab DB name ≠ MotherDuck name; wrong name → `-32601 … not found on my.geotab.com` | Ask the user; pass `server` for gov/other hosts |

## File-by-file

| File | Change |
|------|--------|
| `SKILL.md` | v1.1 → **2.0**. Description, tools table (+`GetSkill`, DB-name warning), naming convention (data agent / Ace / Get API), core loop step 2, quirk list (status annotations, #21/#22, timing), channel table, reference table, preflight (#1 First run, rule #13), rules #4/#5/#9 (`IsTracked`/`GpsValid` always forbidden; read `sql` + `row_count`) |
| `references/DATA_AGENT_TO_CSV.md` | **New.** Current field guide: response shape, per-entity prompts (GPS/Trips/StatusData/Exceptions), rules, CSV verification table, delegation, perf/freshness, failure modes |
| `references/ACE_TO_CSV.md` | Banner → data agent is current; **status-on-data-agent table for all 22 quirks**; added **#21, #22**. Remains the canonical numbered catalog and the legacy `GetAceResults` guide |
| `references/CHANNELS_AND_FRESHNESS.md` | Bulk-export row names the data agent; new "Data agent re-measurement" section; tool-prefix notes |
| `references/QUALITY_AND_REPAIR.md` | SQL-lint table gains `GpsValid`/`IsTracked`, catalog-misroute, derived-column, empty-success rows; data-agent `sql` field |
| `references/INCREMENTAL_BACKFILL.md` | Loop pseudocode uses `AskDataAgent` + empty-success guard; timeout note covers the data agent and "retry once" |
| `references/EVIDENCE_LOG.md` | **Appended** probes P19–P27, §1b rows (#21, #22, + status rows), 9 ledger rows, a 2026-10-29 run archive. Nothing overwritten |
| `references/ENTITY_CATALOG.md`, `MEDALLION_LOADING.md` | Get-API tool prefix (`mcp__MyGeotab_MCP__…`, older `mcp__Geotab_MCP__…`) |
| `MAINTAINING.md` | 22-quirk counts, archive convention, reference DB `demo_fh8` |
| `archive/` | **New.** `v1.1/` verbatim snapshot + `README.md` |

## Not verified in v2.0 (be honest in downstream docs)

Exception/Fault prompts · dimension write→visible lag via the agent (#18) · bounded-prompt 400s (#17) ·
exports above 26 MB (sharding may still appear) · wall-clock latency (the MCP gives no timing) ·
other databases/servers (only `demo_fh8` and, for the core #21 probe, `demo_fh_vegas8`, both `my.geotab.com`) · the MotherDuck-side load of a data-agent CSV
(the `read_csv_auto(all_varchar=true)` path is unchanged but was not re-run in this session —
MotherDuck was not connected).
