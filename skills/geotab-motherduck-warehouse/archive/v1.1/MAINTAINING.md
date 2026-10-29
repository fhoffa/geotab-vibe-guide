# Maintaining this skill — read before editing

These are **authoring conventions** for keeping the skill coherent across sessions (separate from the
runtime guidance the skill teaches). They exist because the structure encodes decisions that aren't
obvious from a single file. If you change one of these on purpose, update this doc in the same PR.

## Quirk catalog (the most-edited surface)

The Ace quirk catalog lives in [`references/ACE_TO_CSV.md`](references/ACE_TO_CSV.md); a lean mirror is in
[`SKILL.md`](SKILL.md); the evidence behind it is in [`references/EVIDENCE_LOG.md`](references/EVIDENCE_LOG.md) §1b.

- **Numbers (`#1…#N`) are stable IDs.** They are *grouped by severity* (🔴 Critical / 🟡 Operational /
  ⚪ Informational), **never renumbered.** Bare `quirk #N` cross-references appear in several files and
  must keep resolving.
- **Extend, don't renumber.** Folding a related finding into an existing quirk (e.g. fan-out → #12) is
  preferred. A genuinely new quirk takes the **next free number**, a severity bucket, a `§1b` evidence-map
  row, and a bump of the `N-quirk` count in both `SKILL.md` and `ACE_TO_CSV.md`.
- **Keep the catalog lean** = *what to be aware of + why + the one action*. **Measurements, SQL, and
  `chat_id`s do not belong in the catalog body** — they go in `EVIDENCE_LOG.md` §1b (keyed by the same
  number) and/or §3 run archives. The catalog points there. This keeps the decision-maker context small.
- **`SKILL.md` mirrors the same severity-grouped lean list on canonical numbers** — edit both together.
- **State frequency for 🔴 entries** (always / intermittent / "only on X asks"). Honor the blanket caveat
  at the top of the catalog: Ace generates SQL with an LLM, so **frequencies are observed tendencies from
  a small sample, not guarantees**; the safe stance (read the SQL, land bronze, dedup) is uniform.
- The **"lint the returned SQL"** claim is scoped to **semantic** issues (source table, predicates, units,
  filters, window bounds). Data-shape quirks — **#2 sharded URLs, #6 duplicate rows** — are *not* visible
  in the SQL; don't broaden the claim to "catches everything."

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
  per `_batch_id`** (one Ace export shares one `_batch_id` across all shards). Prune **per table**
  (`DELETE FROM bronze.<table> …`); there is no `bronze.*` wildcard delete.
- Bronze `INSERT`s should use an **explicit target column list** (or drop a legacy `_source_db` with
  `ALTER TABLE … DROP COLUMN IF EXISTS _source_db`) so appends don't hit a column-count mismatch.

## Reference databases (current state — for live validation)

`geotab_demo_fh4` and `geotab_Demo_fh_vegas4` are the live mirrors the evidence was measured on. As of the
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
- Confirm internal `.md` links resolve and every bare `quirk #N` reference stays within `1…N`.
- If you touched the live mirrors, append a dated row to `EVIDENCE_LOG.md` §2.
