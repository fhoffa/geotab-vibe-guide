# Maintaining this skill — read before editing

These are **authoring conventions** for keeping the skill coherent across sessions (separate from the
runtime guidance the skill teaches). They exist because the structure encodes decisions that aren't
obvious from a single file. If you change one of these on purpose, update this doc in the same PR.

## Quirk catalog (the most-edited surface)

The data-agent quirk catalog (**18 quirks, `Q1…Q18`**) lives in [`references/QUIRKS.md`](references/QUIRKS.md);
a lean mirror is in [`SKILL.md`](SKILL.md); the evidence behind it is in
[`references/EVIDENCE_LOG.md`](references/EVIDENCE_LOG.md) §1b.

- **`Q#` are stable IDs**, grouped by severity (🔴 Critical / 🟡 Operational / ⚪ Informational), **never
  renumbered.** Bare `Q#` cross-references appear in several files and must keep resolving.
- **Extend, don't renumber.** Folding a related finding into an existing quirk is preferred. A genuinely new
  quirk takes the **next free number**, a severity bucket, a `§1b` evidence-map row, and a bump of the quirk
  count in `SKILL.md`, `QUIRKS.md` and this file.
- **Keep the catalog lean** = *what to be aware of + why + the one action*. **Measurements, SQL and prompts do
  not belong in the catalog body** — they go in `EVIDENCE_LOG.md` §1b (keyed by the same number) and/or §3 run
  archives. The catalog points there. This keeps the decision-maker context small.
- **`SKILL.md` mirrors the same severity-grouped lean list on the same IDs** — edit both together.
- **State frequency for 🔴 entries** (always / intermittent / "only on X asks"). Honor the blanket caveat at the
  top of the catalog: the agent generates SQL with an LLM, so **frequencies are observed tendencies from a
  small sample, not guarantees**; the safe stance (read the SQL, check `row_count`, land bronze, dedup) is uniform.
- The **"lint the returned SQL"** claim is scoped to **semantic** issues (source table, predicates, units,
  filters, derived columns, window bounds). Data-shape problems — **empty/short results (Q2, Q9) and duplicate
  rows (Q6)** — are *not* visible in the SQL; don't broaden the claim to "catches everything."
- **Archives.** Before a major rewrite, snapshot the live skill to `archive/v<old>/` (rename `SKILL.md` inside it, e.g. `SKILL_v<old>.md`, so skill discovery doesn't see a duplicate), add a row to `archive/README.md`, and never edit archived files. Don't link the archive from the live skill — only from the changes file.
- **Don't narrate history in the live skill.** The skill describes how to work *now*. How it differs from earlier
  versions lives only in [`CHANGES_v1.1_to_v2.0.md`](CHANGES_v1.1_to_v2.0.md); when you do a major rewrite,
  update that file instead of adding "previously…/legacy…" asides to the references.

## Evidence discipline

- Every empirical claim is **dated, point-in-time, and traceable** to a probe (`P#`), a ledger row, or a
  run archive in `EVIDENCE_LOG.md`. **Append, never overwrite** — drift should be visible over time. See
  the header of that file for how to add a run.
- **Non-negotiable #14: mirror real source data only — never fabricate/synthesize tables or rows.** A
  derived/illustrative table goes in `gold`, clearly named, built only from real silver.

## Schema & provenance (don't regress these)

- **No per-row `_source_db`.** Bronze provenance is exactly **4 columns**: `_batch_id`, `_loaded_at`,
  `_source_channel`, `_source_uri`. Source identity is recorded once per database in a **`main.warehouse_meta`**
  table — **not** `COMMENT ON DATABASE` (not implemented in MotherDuck).
- **One MotherDuck database per Geotab source + a schema per medallion layer** (`bronze`/`silver`/`gold`).
  Never co-locate two sources.
- **Bronze is append-only** (the system of record); **silver is a deterministic dedup-on-natural-key
  projection** of bronze. Large facts derive **per `_source_uri` (per shard) or per event-time day — not
  per `_batch_id`** (one export shares one `_batch_id` across all of its files). Prune **per table**
  (`DELETE FROM bronze.<table> …`); there is no `bronze.*` wildcard delete.
- Bronze `INSERT`s should use an **explicit target column list** (or drop a legacy `_source_db` with
  `ALTER TABLE … DROP COLUMN IF EXISTS _source_db`) so appends don't hit a column-count mismatch.

## Reference databases (current state — for live validation)

**Geotab side:** `demo_fh8` and `demo_fh_vegas8` on `my.geotab.com` (50 devices each, `IsTracked=false`) are the
databases the data-agent probes P19–P27 ran on. Geotab DB names are MyGeotab login names — **not** the MotherDuck
`geotab_<source>` names below.

`geotab_demo_fh4` and `geotab_Demo_fh_vegas4` are the live MotherDuck mirrors the MotherDuck-side evidence was measured on (their early batches are tagged `_source_channel='ace_csv'`; new loads use `agent_csv`). As of the
last cleanup: `_source_db` has been dropped from every table; **`silver.status_data`** is canonical (the
`status_data_dedup` *view* was removed); `gold.fleet_daily_operational_summary` reads `silver.status_data`;
and `main.warehouse_meta` holds source identity. **On 2026-07-03 the vegas mirror's ingest log was
consolidated into `main.warehouse_ingest_log` (rebuilt from bronze) and the legacy
`silver.warehouse_ingest_log` mirror was dropped; `main.warehouse_health` (view) was created; and the
vegas bronze provenance column `_source_object` was renamed to the canonical `_source_uri` on all four
raw tables.** So `main` is the sole ingest log in both mirrors now, and both mirrors use the 4-col
provenance names above. Don't reintroduce the removed objects.

## Before pushing

- `bash tests/gem-validation/run.sh` (repo pre-commit).
- Confirm internal `.md` links resolve and every bare `Q#` reference stays within `Q1…Q18`.
- If you touched the live mirrors, append a dated row to `EVIDENCE_LOG.md` §2.
