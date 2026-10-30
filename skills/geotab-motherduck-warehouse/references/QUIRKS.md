# Data-agent quirks — what to be aware of while loading the warehouse

The Geotab data agent (`AskDataAgent`) turns a natural-language ask into **LLM-generated BigQuery SQL**.
That is its strength (flexible, fast, returns the SQL) and the source of every quirk below: the SQL can
differ from run to run, and its defaults are tuned for dashboards, not for lossless replication.

**Lean by design:** each entry is *what to be aware of + why + the one action*. Measurements, SQL and
prompts live in [`EVIDENCE_LOG.md`](EVIDENCE_LOG.md) §1b, keyed by the same `Q#`. Field guide for the tool:
[`DATA_AGENT_TO_CSV.md`](DATA_AGENT_TO_CSV.md). All observations are point-in-time (2026-10-29/30, demo
fleets `demo_fh8` and `demo_fh_vegas8`, 50 vehicles each) — re-verify on your fleet.

> **Assume non-determinism.** Frequencies below are observed tendencies from a small sample, not
> guarantees. The safe stance is the same for every quirk: **read the returned `sql` on every load, check
> `row_count`, land raw rows in bronze, dedup in silver.**

IDs are **stable** (grouped by severity, never renumbered): other files cite them as `Q#`. Add a new quirk
at the next free number.

## 🔴 Critical — silently produces wrong or incomplete data

- **Q1 — Default population/validity filters thin or empty the result.** Unprompted, the agent adds
  `IsTracked = TRUE` and `Device_ActiveTo >= CURRENT_DATETIME()` (fleet counts), joins trips on the device's
  active window, and added `GpsValid = 1` to a plain GPS pull. On a fleet whose devices are all
  `IsTracked = false` the default answer is **0 vehicles / 0 trips**. **Action:** every fact prompt says
  *"include every device; do not filter on IsTracked, GpsValid, speed or ignition."* *(P19, P23.)*
- **Q2 — `status: success` can be an empty or zero answer.** Look for `row_count: 0`, `data_uri: ""`,
  `turn_id: -1`, or a scalar `0`; a `freshness: {status: "stale", message: …}` may accompany it. Nothing
  errors, so a loop would load nothing and advance the watermark. **Action:** `row_count = 0` on a window
  known to have data is a **failure** — read `sql`, forbid the filter (Q1), re-ask; confirm with a `Get`
  count; never advance a watermark on an unexplained empty response. *(P19, P20.)*
- **Q3 — The agent can answer from the wrong table.** "Engine status data readings" was routed to the
  `Diagnostic` **catalog** (120 rows, `success`) instead of `StatusData`; the same question can map to
  different tables on different runs. **Action:** *name the table* (`GpsLogs`, `Trip`, `StatusData`,
  `ExceptionEvent`, `FaultData`) in the prompt and read the `FROM` every load. *(P24.)*
- **Q4 — Metric-flavored asks use pre-aggregated, device-local data.** "Total distance yesterday" came
  from `VehicleKPI_Daily` with `Local_Date` — a rollup, not raw rows. **Action:** for replication ask for
  *raw rows with explicit UTC bounds*, never a KPI question. *(P22.)*
- **Q5 — Units are converted unless pinned.** The unpinned distance ask returned miles
  (`SUM(Distance_Km) * 0.621`). **Action:** say *"in kilometers, do not convert units."* *(P22.)*
- **Q6 — Predicates and joins vary per run.** The agent adds partition guards (so far always *widening*,
  e.g. `DATE(StatusDateTime) BETWEEN d−1 AND today`) and joins `LatestVehicleMetadata` for device names
  (observed: always `LEFT JOIN … ON DeviceId AND <ts> BETWEEN Device_ActiveFrom AND Device_ActiveTo`, so no
  fan-out). A join on `DeviceId` alone would multiply rows for devices with several metadata rows, and a
  *narrowing* guard would drop data — either would be visible only in the SQL. **Action:** read the SQL every
  load; dedup silver on the parsed natural key; in the shape check expect `csv_rows ≥ distinct keys`.
  (0 duplicate rows were found in the two downloaded CSVs — GPS 11,599 rows and StatusData 368,764 rows — the dedup is cheap insurance, not a known cure.)
  *(P21, P25, P27.)*
- **Q7 — Agent-derived columns are the agent's arithmetic.** Asked for `driving_duration_minutes` it
  computed `(TripDuration − IdlingDuration)/60`, **negative** on short trips because `IdlingDuration` (seconds)
  can exceed `TripDuration` (seconds; = end − start). **Action:** request raw source columns
  (`TripDistance_Km`, `TripDuration`, `IdlingDuration`) and derive in silver. *(P21.)*

## 🟡 Operational — derails or misleads the run (usually visible)

- **Q8 — Column-name case drifts.** Requested `Data`, the CSV header was `DATA`. **Action:** key by the CSV
  header, alias on the way into bronze/silver. *(P25.)*
- **Q9 — The tool call times out at ~60 s; transient errors happen.** A 2-day StatusData pull timed out;
  12 h (368,764 rows, 26 MB, one file) returned; one identical trips prompt timed out once and passed on
  retry; one call returned HTTP 502 `data_agent_query_failed` and passed on retry. **Action:** chunk windows
  (½-day StatusData, 1-day GPS/trips), **retry once**, then shrink or rephrase. *(P25, P27.)*
- **Q10 — Event tables don't look "fresh".** `Trip`/`FaultData`/`ExceptionEvent` get a row only when an event
  fires, so `max(ts)` looks old when nothing happened. **Action:** gauge them by *counting events in a recent
  window*, not max-vs-now. GPS/StatusData are continuous (lag ≈ 16–25 s measured).
- **Q11 — Don't use the agent as a freshness or watermark oracle.** Its window bounds are LLM-generated
  (all observed "…and now" windows ended at `CURRENT_TIMESTAMP()`, n = 3). **Action:** take the watermark
  from `max(silver)`; for a true latest reading use `Get DeviceStatusInfo` or a bounded `Get LogRecord`; on
  windowed exports confirm the upper bound is *now*/your `hi`. *(P26.)*
- **Q12 — Just-changed configuration may not be visible to the agent yet.** (Propagation delay for the
  agent was not measured.) **Action:** read anything you just created or changed (zones, groups, rules,
  users, device metadata) from the **Get API**, which is synchronous.
- **Q13 — Wrong database or server name.** The Geotab database is the MyGeotab login name (e.g. `demo_fh8`),
  **not** the MotherDuck `geotab_<source>` name. A wrong name gives `-32601 Database '…' was not found on
  my.geotab.com`. **Action:** ask the user; pass `server` for `gov.geotab.com` and other hosts. Never guess —
  failed lookups are cheap but repeated auth failures lock accounts.
- **Q14 — Connector setup (ChatGPT).** Both MCP servers (Geotab, MotherDuck) must be in the **same mode** —
  both official connectors or both developer-mode — or the Geotab connector can drop mid-session and leave a
  warehouse with empty bronze. **Action:** preflight with a tiny call before any DDL (rule #13).

## ⚪ Informational — good to know, no data hazard

- **Q15 — The response envelope.** `{status, sql, data_preview[20], row_count, data_uri, turn_id,
  freshness{status,message}}`, ~5–10 KB, inline. `data_preview` is the first 20 rows; the full result is the
  CSV at `data_uri` (one file in every test, up to 26 MB). Calls are **stateless**: no chat id — rephrase a
  follow-up in full, or pass the previous SQL + the change in `delegation_context` (the agent re-derives its
  own guards, so re-read the SQL). Four parallel calls all succeeded.
- **Q16 — CSV text formats.** `UTC_*` columns carry a `+00:00` offset (`2026-10-28T00:00:00.151000+00:00`);
  `GpsDateTime` is naive ISO (`2026-10-29T22:00:05.617000`). Land everything as `all_varchar` in bronze and
  parse with `TRY_CAST`/`replace` in the derive.
- **Q17 — The signed URL lasts 24 h** (`X-Goog-Expires=86400`) and the bucket region varies by database
  (`…-prod-us`, `…-prod-eu`). Load promptly; log the `gs://bucket/object` path, never the signature (rule #8).
  If a client ever returns several URLs for one answer, load **every** one.

## Defensive habits (always on — cheap, uniform)

1. Read `sql` → lint it ([`QUALITY_AND_REPAIR.md`](QUALITY_AND_REPAIR.md) §2). It exposes the *semantic*
   issues (Q1, Q3–Q7, Q11). It does **not** expose data-shape issues, which need their own checks:
   `row_count` vs CSV `COUNT(*)` (Q2, Q9) and natural-key dedup in silver (Q6).
2. Bronze append-only, silver derived and deduped, quality battery after every load.
3. A differing count between two runs of "the same" question usually means a different `FROM` or filter, not
   noise — diff the SQL before suspecting the data.
