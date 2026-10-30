# What changed: v1.1 → v2.0 (history only — not needed to run the skill)

**Why:** v1.1 was built, measured and hardened around the `GetAceResults` tool. The MyGeotab MCP now exposes
a **data agent** (`AskDataAgent`: natural language → BigQuery SQL → `{sql, 20-row preview, row_count,
data_uri}`) alongside the classic `Get` API tools. v2.0 re-validated the whole Geotab side on `demo_fh8` and
`demo_fh_vegas8` (2026-10-29/30: ~20 data-agent calls + `Get`/`GetCountOf` ground truth + two CSV downloads)
and rewrote the skill so it only knows the data agent. **This file is the only place the earlier version is
described.**

**Where the earlier version lives:** a frozen snapshot in [`archive/v1.1/`](archive/v1.1/) (see [`archive/README.md`](archive/README.md)) and, equivalently, git history. The last v1.1 tree is commit
[`35a8a05`](https://github.com/fhoffa/geotab-vibe-guide/commit/35a8a054108700869ff4787f913971643648067d)
(`main` after [PR #113](https://github.com/fhoffa/geotab-vibe-guide/pull/113) and the field-test follow-ups).
Read any old file with `git show 35a8a05:skills/geotab-motherduck-warehouse/<path>`, or compare with
`git diff 35a8a05 -- skills/geotab-motherduck-warehouse`.

**Untouched on purpose (MotherDuck side):** bronze/silver/gold layering, `warehouse_ingest_log` log-ahead,
orphan sweep, trip re-split reconcile, health view, dimension-delete handling, ASOF enrichment, cost model.
These don't depend on which Geotab tool fetches the data and were not re-tested here.

## At a glance

| Area | v1.1 (`GetAceResults`) | v2.0 (`AskDataAgent`) | Evidence |
|------|------------------------|-----------------------|----------|
| Fact tool | `GetAceResults(new_chat, chat_id, …)` | `AskDataAgent(database, prompt, delegation_context?)` | P19–P27 |
| Response | 110–192 KB chat blob, spilled to a file; grep the URL / `columns` / SQL out of it | ~5–10 KB structured JSON: `sql`, `data_preview` (20 rows), `row_count`, `data_uri`, `freshness` | all calls |
| Count check | count the CSV yourself | `row_count` returned → must equal CSV `COUNT(*)` (it did: 11,599 / 368,764) | P21, P25 |
| URL(s) | array; large exports shard (8–10 files) | single `data_uri`; 26 MB / 368,764 rows = 1 file | P25 |
| Chat state | `chat_id`, continue-chat | stateless; `delegation_context` for follow-ups | P27 |
| Latency | ~33 s floor per call, "don't parallelize" | no floor evident; **~60 s tool timeout**; 4 parallel calls fine | P25, P27 |
| Timestamps | ` UTC` suffix | `UTC_*` `+00:00`; `GpsDateTime` naive ISO | P21, P25 |
| "CSV/URL" wording | degrades the schema | no degradation | P23 |
| Joins | `LatestVehicleMetadata` LEFT↔inner flip + fan-out | always LEFT with active-window `BETWEEN` — no fan-out seen | P21, P24 |
| Duplicates | boundary second + intermittent ~2× | 0 duplicates in the 2 downloaded CSVs (dedup kept as insurance) | P21, P25 |
| Upper-bound clip | ~1/3 of calls | 0 of 3 | P26 |
| GPS lag | ~19–98 s | ≈16–23 s (2 samples) | P20, P26 |

## Quirk renumbering (v1.1 `#N` → v2.0 `Q#`)

v1.1 had a 20-quirk catalog (`#1…#20`); v2.0 replaces it with `Q1…Q17` in [`references/QUIRKS.md`](references/QUIRKS.md).

| v1.1 | v2.0 | Note |
|------|------|------|
| #11 pre-aggregated rollup, #13 units | **Q4**, **Q5** | reproduced |
| #14 activity filters | **Q1** | broadened: `IsTracked`, `Device_ActiveTo`, `GpsValid` |
| — | **Q2** | **new:** `success` with an empty/zero answer |
| #15 source table varies | **Q3** | reproduced (StatusData → `Diagnostic` catalog) |
| #12 predicate injection / join flip / fan-out, #6 duplicates | **Q6** | guards still vary; fan-out and duplicates *not* reproduced |
| — | **Q7** | **new:** agent-derived columns (negative minutes) |
| #7 column-case drift | **Q8** | reproduced (`Data`→`DATA`) |
| #17 `invalid_value` 400s, tool timeouts | **Q9** | now a ~60 s timeout + transient 502 |
| #16 event vs continuous freshness | **Q10** | unchanged |
| #20 injected upper bound clips today | **Q11** | not reproduced (n=3), guard kept |
| #18 config writes lag | **Q12** | not re-measured on the agent |
| — | **Q13** | **new:** wrong DB/server name |
| #19 ChatGPT mixed mode | **Q14** | unchanged |
| #1, #3, #10 envelope / preview / chat | **Q15** | changed shape |
| #4, #5 nulls / timestamp text | **Q16** | changed shape |
| #2 sharded URLs, URL lifetime | **Q17** | one file observed up to 26 MB |
| #8 "ask for a URL" degrades schema | — | not reproduced; dropped |
| #9 ~33 s floor | — | replaced by Q9 |

## File-by-file

| File | Change |
|------|--------|
| `SKILL.md` | Version 2.0. Tools table (`AskDataAgent`, `GetSkill`, DB-name warning), core loop step 2, `Q#` quirk list, channel table, preflight, rules #4/#5/#9/#13 (always forbid `IsTracked`/`GpsValid`; read `sql` + `row_count`) |
| `references/DATA_AGENT_TO_CSV.md` | **New** field guide: response shape, per-entity prompts, CSV verification table, delegation, failure modes |
| `references/QUIRKS.md` | **New** `Q1…Q17` catalog (replaces `ACE_TO_CSV.md`, deleted) |
| `references/CHANNELS_AND_FRESHNESS.md`, `QUALITY_AND_REPAIR.md`, `INCREMENTAL_BACKFILL.md`, `MEDALLION_LOADING.md`, `ENTITY_CATALOG.md`, `COST_AND_SIZING.md` | Tool names, `Q#` references, `agent_csv`/`agent:<uuid>` provenance values, empty-success guard, timeout/chunking and "retry once" guidance; shard-only advice reduced to "load every file if a client returns several" |
| `references/EVIDENCE_LOG.md` | Rebuilt: probes P1–P27, §1b keyed by `Q#`, ledger (all MotherDuck-side rows kept; Geotab-side rows condensed; Ace chat ids dropped), 2026-10-29/30 run archive |
| `MAINTAINING.md` | `Q#` conventions, "don't narrate history in the live skill" |
| `archive/` | Frozen v1.1 snapshot (`SKILL.md` renamed `SKILL_v1.1.md` so it isn't discovered as a second skill); not linked from the live skill |
| Deleted | `references/ACE_TO_CSV.md` (→ `QUIRKS.md` + `DATA_AGENT_TO_CSV.md`); `IMPROVEMENT_PLAN.md` (an implementation record of PR #113's adapter-derived work — see that PR and git history) |
| Outside the skill | `guides/MCP_TO_MOTHERDUCK_VS_GETFEED_API_ADAPTER.md`, `skills/README.md`, `skills/SKILLS_TODO.md`: wording and links |

## Not verified in v2.0 (be honest in downstream docs)

Exception/Fault prompts · dimension write→visible lag via the agent (Q12) · exports above 26 MB (sharding may
reappear) · wall-clock latency (the MCP gives no timing) · other databases/servers (only `demo_fh8`, and for the
core `IsTracked` probe `demo_fh_vegas8`, both `my.geotab.com`) · the MotherDuck load of a data-agent CSV (the
`read_csv_auto(all_varchar=true)` path is unchanged, but the `+00:00` timestamp cast in the derive was not run —
MotherDuck was not connected in the session that wrote v2.0).
