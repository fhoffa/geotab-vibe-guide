# Data-agent quirks — what to be aware of while loading the warehouse

The Geotab data agent (`AskDataAgent`) turns a natural-language ask into **LLM-generated BigQuery SQL**.
That is its strength (flexible, fast, returns the SQL) and the source of every quirk below: the SQL can
differ from run to run, its defaults are tuned for dashboards rather than lossless replication, and some of its
tables are filled on a different schedule than others.

**Lean by design:** each entry is *what to be aware of + why + the one action*, followed by how often it
reproduced. Measurements, SQL and prompts live in [`EVIDENCE_LOG.md`](EVIDENCE_LOG.md) §1b, keyed by the same
`Q#`. Field guide for the tool: [`DATA_AGENT_TO_CSV.md`](DATA_AGENT_TO_CSV.md).

**How this catalog was checked (2026-10-30):** every quirk was re-run with repeats and, where possible, a
control (a pinned prompt, the Get API as ground truth, or a downloaded CSV) on two demo fleets (`demo_fh8`,
`demo_fh_vegas8`, 50 vehicles each, `my.geotab.com`). **Both are demo fleets: all 50 devices have
`IsTracked = false`, all in UTC.** Anything that depends on those facts is flagged *demo-sensitive*; none of it
has been tried on a production fleet. Verdict legend: ✅ reproduced · ◐ reproduced in a narrower form than first
believed · ➖ not reproduced (kept as a cheap precaution) · ❔ not testable here.

> **Assume non-determinism.** Frequencies are observed tendencies from small samples, not guarantees. The safe
> stance is the same for every quirk: **read the returned `sql` on every load, check `row_count` and the
> `freshness` field, land raw rows in bronze, dedup in silver.**

**Ordered by importance — `Q1` matters most.** Rank = how likely the quirk is to put wrong or missing data into the
warehouse *unnoticed* (impact × likelihood × how hard it is to detect). Parts 1–3 are the severity tiers (🔴 / 🟡 / ⚪).
Other files cite quirks as `Q#`; IDs are stable once published — add a new quirk at the next free number and note its
rank in the table below instead of renumbering.

## Part 1 — Wrong or missing data, with no error (Q1–Q7)

- **Q1 — The agent can silently answer for a different window than you asked (and its `Trip` table lags).** Asked
  for trips on **2026-10-30**, it answered for **2026-10-29** (643 trips, latest start 23:24:03) and added
  `freshness: stale` + "Data is still not available for the requested date range despite adjusting…". The Get API
  showed trips starting through 01:07 on 10-30, and ≥ 9 trips starting after 23:24:03 on 10-29 — so the `Trip`
  table was **≥ 1 h 44 min behind** while `GpsLogs` and `StatusData` were **11–23 s** behind. `stale` also appeared
  on correct results and on a genuinely empty window, so it means "your window reaches past what I have", not
  "this answer is wrong". **Action:** on `freshness: stale`, read the message, compare the **returned min/max
  timestamps (or the SQL's date bounds) to the window you asked for**, and keep trips behind a `Get`-based
  completeness check; take watermarks from `max(silver)`. **Seen:** ✅ the `Trip` table was fresh at ≈ 23:45 UTC and ≥ 1 h 44 min behind at 01:08; all 4 trip asks run after
  01:00 that reached past 23:24 were `stale`. *(P34.)*
- **Q2 — `status: success` can be an empty or zero answer, and the envelope can't tell you why.**
  `row_count: 0`, `data_uri: ""`, `turn_id: -1` (or a scalar `0`) look **identical** whether a filter (Q3)
  removed the rows or the window genuinely has no data (control: trips before the data starts). `freshness`
  doesn't separate them: filter-caused empties showed `fresh`, `unknown` or `stale`, the genuine one showed `stale`.
  **Action:** treat `row_count = 0` on a window you believe has data as a **failure**; read `sql` for Q3 filters;
  confirm with a `Get` count; never advance a watermark on an unexplained empty response. **Seen:** ✅ 6 empty/zero
  answers, all filter-caused; 1 genuine-empty control. *(P19, P20, P29.)*
- **Q3 — Roster-based asks get default population filters.** When the ask is about "the fleet / vehicles /
  devices" (or lists by device), the agent builds on `LatestVehicleMetadata` and adds
  `IsTracked = TRUE AND Device_ActiveTo >= CURRENT_DATETIME()`. On these fleets that yields **0 vehicles**.
  Plain GPS ask: it also added `GpsValid = 1`. **Action:** every fact prompt says *"include every device; do not
  filter on IsTracked, GpsValid, speed or ignition."* **Seen:** ✅ roster-based default asks 6/6 (fleet+trips ×2 on two fleets, fleet count,
  "latest GPS of first 5 devices", "engine readings last hour", "status data last 10 min"); 0 of the ≥ 15 asks that
  said "include every device" got an `IsTracked` filter. *Demo-sensitive:* with `IsTracked = true` devices
  the default is harmless, and on a production fleet the filter would only drop untracked/retired assets.
  *(P19, P28.)*
- **Q4 — Agent-derived columns are the agent's arithmetic.** Asked for a trip's "driving duration in minutes" it
  computes `(TripDuration − IdlingDuration)/60`, **negative** when `IdlingDuration` (seconds) exceeds
  `TripDuration` (seconds; = end − start). **Action:** request raw source columns (`TripDistance_Km`,
  `TripDuration`, `IdlingDuration`) and derive in silver. **Seen:** ✅ 2/2; in the downloaded 77-trip CSV **10 rows (13%) were negative**, worst −23.87 min. *(P21, P33.)*
- **Q5 — Units convert unless pinned.** The unpinned distance ask returned miles
  (`SUM(Distance_Km) * 0.621`) on **both** runs even though the sampled users' `isMetric` is `true`, so it is
  unlikely to be a user-setting effect. A pinned prompt over raw `Trip` rows returned kilometers. **Action:** say *"in kilometers,
  do not convert units."* **Seen:** ✅ 2/2 unpinned, pinned control OK. *(P22, P31.)*
- **Q6 — A catalog table can answer instead of the fact table.** "List all **engine status data readings**…" was
  answered from the `Diagnostic` catalog twice (120 rows, then 4 rows), `status: success`. The trigger is wording
  that matches a diagnostic's *name*: "engine readings", "status data" and "fault codes" all went to the right
  table (`StatusData`, `FaultData`). **Action:** *name the table* (`GpsLogs`, `Trip`, `StatusData`, `FaultData`,
  `Events` — see Q16) and read the `FROM` every load. **Seen:** ◐ 2/2 for the "engine status" phrasing, 0/4 for
  other phrasings. *(P24, P30.)*
- **Q7 — Predicates and joins vary per run; read them.** Observed guards: `DATE(GpsDateTime) BETWEEN d−1 AND d+1`
  style pads (widening) and the Q1 shift (narrowing). Observed joins: `LEFT JOIN LatestVehicleMetadata … AND <ts>
  BETWEEN Device_ActiveFrom AND Device_ActiveTo` in **every** join seen (≥ 10) — no fan-out, no inner-join drops.
  A join on `DeviceId` alone would multiply rows, and a narrowing guard drops data; either is visible only in the
  SQL. **Action:** read the SQL; dedup silver on the parsed natural key; in the shape check expect
  `csv_rows ≥ distinct keys`. **Seen:** guards ✅ every query; duplicates ➖ **0 in 6 downloaded CSVs (1.29M rows)**;
  fan-out ➖ 0. *(P21, P25, P32.)*

## Part 2 — Operational: derails or misleads the run, usually visibly (Q8–Q15)

- **Q8 — The tool call times out at ~60 s; some asks fail transiently.** StatusData: **1 day (744,965 rows,
  53 MB) passes; 2 days timed out 2/2.** GPS: 2 days (315,780 rows) passed. A small `Trip` aggregation timed out
  once and passed on retry. Two future-dated prompts ("trips in 2030", "after 2029-12-31") failed twice with
  HTTP 502 *"Failed to generate a valid query after multiple attempts"*; one fleet-count ask failed once with
  502 `data_agent_query_failed` and passed on retry. One call during polling returned HTTP 503 `data_agent_rejected` and passed on retry. **Action:** chunk windows (StatusData ≤ 1 day; GPS and
  trips ≤ 1–2 days), **retry once**, then shrink or rephrase; never put future dates in a prompt. *(P25, P27, P35.)*
- **Q9 — One column's case drifts.** Requested `Data`, the CSV header was `DATA` (3/3 StatusData CSVs). Every
  other requested column kept its name (GPS, trips, exceptions). **Action:** key by the CSV header, alias into
  bronze/silver. *(P25, P32.)*
- **Q10 — KPI-flavored asks use a pre-aggregated, device-local rollup.** "Total distance yesterday" came from
  `VehicleKPI_Daily` with `Local_Date`. On these all-UTC fleets the rollup **equaled the raw trip sum exactly**
  (12,454.0 mi = 20,054.7477 km × 0.621), so the numbers did not differ; what differs is the *source, grain and
  date semantics* (device-local days would shift totals on a non-UTC fleet — untested). **Action:** for
  replication ask for raw rows with explicit UTC bounds, never a KPI question. **Seen:** ✅ 2/2 rollup chosen,
  ➖ 0/1 numeric difference. *(P22, P31.)* *Demo-sensitive.*
- **Q11 — Don't use the agent as a freshness or watermark oracle.** Its window bounds are LLM-generated. Of 7
  open-ended or "…and now" windows, none was clipped, but a previous-generation run clipped 2 of 6 to
  `<yesterday> 23:59:59`. **Action:** take the watermark from `max(silver)`; for a true latest reading use
  `Get DeviceStatusInfo` or a bounded `Get LogRecord`; confirm an export's upper bound is *now*/your `hi`.
  **Seen:** ➖ 0/7 clipped. *(P26.)*
- **Q12 — Event tables don't look "fresh" from `max(ts)`.** `Trip`/`FaultData`/`Events` get a row only when an
  event fires, so `max(ts)` can look old for a benign reason — but see Q1, where it was a real lag.
  **Action:** compare against the Get API or count events in a recent window before deciding which it is.
  GPS/StatusData are continuous (lag 11–23 s measured, 4 samples). *(P26, P34.)*
- **Q13 — Wrong database or server name.** The Geotab database is the MyGeotab login name (e.g. `demo_fh8`),
  **not** the MotherDuck `geotab_<source>` name. A wrong name gives `-32601 Database '…' was not found on
  my.geotab.com`. **Action:** ask the user; pass `server` for `gov.geotab.com` and other hosts. **Seen:** ✅ 3/3
  wrong names, 2/2 right names. *(ledger 2026-10-29.)*
- **Q14 — Just-changed configuration reaches the agent about 25 minutes after the Get API.** A zone created with
  `Add` was visible to `Get` immediately and to the agent's `Zones` table **between 23 and 29 minutes later**
  (absent at 01:59:55, present at 02:05:06; created ≈ 01:36:30; 10 polls in between). **Action:**
  read anything you just created or changed (zones, groups, rules, users, device metadata) from the **Get API**,
  which is synchronous and authoritative. **Seen:** ✅ 1/1 (n = 1; an earlier run on the previous channel measured
  14–29 min). *(P36.)*
- **Q15 — Connector setup (ChatGPT).** ❔ Not testable from this session; field-reported. Both MCP servers (Geotab,
  MotherDuck) must be in the **same mode** — both official connectors or both developer-mode — or the Geotab
  connector can drop mid-session and leave a warehouse with empty bronze. **Action:** preflight with a tiny call
  before any DDL (rule #13).

## Part 3 — Informational: good to know, no data hazard (Q16–Q18)

- **Q16 — The response envelope and table names.** `{status, sql, data_preview[20], row_count, data_uri, turn_id,
  freshness{status,message}}`, ~5–10 KB, inline, consistent across ~45 calls. Full result = CSV at `data_uri`
  (one file every time, up to 53 MB). Calls are **stateless** — rephrase a follow-up in full, or pass the previous
  SQL + the change in `delegation_context` (the agent re-derives its own guards, so re-read the SQL). Four
  parallel calls succeeded repeatedly. Table names are the agent's, not the Get API's: exceptions live in
  **`Events`** (not `ExceptionEvent`), GPS in `GpsLogs`, trips in `Trip`, readings in `StatusData`, faults in
  `FaultData`.
- **Q17 — CSV text formats.** `UTC_*` columns carry a `+00:00` offset (`2026-10-28T00:00:00.151000+00:00`);
  `GpsDateTime`/`TripStartDateTime` are naive ISO (`2026-10-29T22:00:05.617000`). Land everything as
  `all_varchar` in bronze and parse with `TRY_CAST`/`replace` in the derive.
- **Q18 — The signed URL lasts 24 h** (`X-Goog-Expires=86400`) and the bucket region varies by database
  (`…-prod-us`, `…-prod-eu`). Load promptly; log the `gs://bucket/object` path, never the signature (rule #8).
  If a client ever returns several URLs for one answer, load **every** one.

## Defensive habits (always on — cheap, uniform)

1. Read `sql` → lint it ([`QUALITY_AND_REPAIR.md`](QUALITY_AND_REPAIR.md) §2). It exposes the *semantic*
   issues (Q1, Q3–Q7, Q10, Q11). It does **not** expose data-shape issues, which need their own checks:
   `row_count` vs CSV `COUNT(*)` (Q2, Q8), min/max of the returned window vs the asked window (Q1), and
   natural-key dedup in silver (Q7).
2. Bronze append-only, silver derived and deduped, quality battery after every load.
3. A differing count between two runs of "the same" question usually means a different `FROM`, filter or window,
   not noise — diff the SQL before suspecting the data.
