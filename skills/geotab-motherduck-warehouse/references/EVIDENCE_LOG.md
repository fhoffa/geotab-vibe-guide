# Evidence log — reusable probes + an append-only results ledger

Every empirical claim in this skill is **observed, point-in-time, and re-measurable**. Ace, MotherDuck,
and a given fleet all change, so this file is built to **accumulate runs over time, not be overwritten.**

**How to use / how to add next week's run:**
1. Re-run the **probes** in §1 (stable prompts/SQL — they rarely change).
2. **Append a row** to the §2 ledger for each probe: `date · probe · result · chat_id/artifact · notes`.
   Don't edit old rows — add new ones, so drift is visible over time.
3. If you want the full verbatim prompt+answer+SQL for a run, drop a dated block in §3 (Run archives).
4. If a number changed enough to matter, update the dated figure in the prose docs **and** cite the new
   ledger row. (Claims in SKILL/refs point here; the *latest* ledger row is the current truth.)

> Tool legend: **Ace** = `mcp__Geotab_MCP__GetAceResults`; **Get API** = `mcp__Geotab_MCP__Get` /
> `GetCountOf` / `Add` / `Remove`; **MotherDuck** = `mcp__MotherDuck__query` / `query_rw`.
> `chat_id`s let you continue a past Ace chat *while it's still live*; the prompts are always re-runnable.

---

## 1. Probe catalog (stable — re-run these)

| ID | Tool | What it measures | Prompt / SQL (substitute your DB/dates) | How to read the result |
|----|------|------------------|------------------------------------------|------------------------|
| **P1** | Ace | GPS pipeline lag | "Across all devices, what is the single most recent raw GPS position log timestamp, in UTC? …Also report the current UTC time now. Return just those two values." | now − max = lag (continuous stream) |
| **P2** | Ace | StatusData lag | "…single most recent raw status data (engine/sensor) timestamp, in UTC? …raw, not a rollup." | compare to live `DeviceStatusInfo` |
| **P3** | Ace | Trip arrival (event) | "…most recent trip end timestamp, UTC? Also how many trips ended in the last 15 minutes." | gauge by *count in window*, not max-vs-now |
| **P4** | Ace | source selection (GPS) | "How many distinct devices produced at least one raw GPS position log on calendar day `<D>` UTC …? …do not restrict to active/tracked… Return only the number." | **read the returned `FROM`**; expect stable across identical runs |
| **P5** | Ace | does an attached SQL pin the source? | P4 prompt **+** "Run exactly: `SELECT COUNT(DISTINCT DeviceId) AS n FROM GpsLogs WHERE …`" | check whether the executed `FROM` is actually `GpsLogs` |
| **P6** | Ace | Trip distinct devices (control for P4/P5) | "How many distinct devices had at least one trip that started on `<D>` UTC? Return only the number." | the Trip-population number |
| **P7** | Get API | is `GetCountOf` window-aware? | `GetCountOf LogRecord {deviceSearch, fromDate, toDate}` twice w/ different windows; `GetCountOf Device` | facts → same whole-table count (ignored); Device → exact |
| **P8** | Get API + Ace | dimension write→Ace propagation | `Add Zone {name:'ZZ_ACE_PROBE_<n>', points:[…]}`; poll Ace "is zone ZZ_ACE_PROBE_`<n>` there?" every few min; `Remove Zone` after | latency from add-time to first Ace sighting |
| **P9** | MotherDuck | compute per query | `EXPLAIN ANALYZE <watermark>` / `<silver derive>` / `<read_csv_auto count of a signed URL>` | "Total Time" line = CU-seconds (Pulse) |
| **P10** | MotherDuck | storage footprint | `PRAGMA database_size;` | total ÷ unique pings = bytes/ping |
| **P11** | MotherDuck | dedup-key correctness | `COUNT(*)` of `DISTINCT ON (DeviceId, GpsDateTime)` vs `DISTINCT ON (DeviceId, replace(GpsDateTime,' UTC','')::TIMESTAMP)` over bronze | parsed key must collapse cross-batch dupes |

---

## 2. Results ledger (append-only — newest at the bottom)

| Date | DB | Probe | Result | chat_id / artifact | Notes |
|------|----|-------|--------|--------------------|-------|
| 2026-06-29 | demo_fh4 | P1 | GPS max `21:37:15` vs now `21:37:34` → **~19 s** (a separate run ~98 s) | `fLPYaGZErt5woI4dH0cP` | continuous → near-real-time |
| 2026-06-29 | demo_fh4 | P2 | `21:34:48.455` — **identical to live `DeviceStatusInfo`** | `mXdb0QGjzvxehI1CCa7F` | sub-minute |
| 2026-06-29 | demo_fh4 | P3 | last end `21:30:34`; **20 trips ended in last 15 min** | `Aad71Hlt3n0EfjoNggC7` | event cadence, not lag |
| 2026-06-29 | demo_fh4 | P4 | **49** from `GpsLogs`, on **3 identical runs** | `53Li6zrprm7N9NSvcPaE`, `xfRC82AvU9Su4u0BsTYM`, `BC8CnzGtRIwGR02epyiT` | pinned prompt is stable |
| 2026-06-29 | demo_fh4 | P5 | **47** — Ace ran `FROM Trip`, **ignored the supplied `FROM GpsLogs` SQL** | `MbJ6VAoCle52iGd6m0YR` | attached SQL is a hint, not a contract |
| 2026-06-29 | demo_fh4 | P6 | **47** distinct trip devices | `SaV8GtVptocbsPPgKIw1` | confirms 49≠47 is GpsLogs-vs-Trip, not noise |
| 2026-06-29 | demo_fh4 | P7 | LogRecord window = **16,098,152** (twice, window ignored); Trip = 1,388,687; Device = 50 ✓ | Get API | GetCountOf is total-only for facts |
| 2026-06-29 | demo_fh4 | P8 | add `21:41:04`; absent through T0+14 min (`21:55`); present at T0+~29 min (`22:09:42`) → **15–30 min** | poll chat_ids in §3 | dimension sync ≫ telematics |
| 2026-06-29 | my_db | P9 | watermark `0.082 s`; silver derive (679,581) `1.07 s`; read_csv_auto (2,679 rows, 149 KiB) `1.47 s` | EXPLAIN ANALYZE | Pulse per-query, min 1 CU-s |
| 2026-06-29 | my_db | P10 | **35.2 MiB** / 679,577 pings → ~16 B/ping silver, ~54 B bronze+silver | PRAGMA | drives COST_AND_SIZING |
| 2026-06-29 | my_db | P11 | raw-string key → **679,581**; parsed-timestamp key → **679,577** | MotherDuck | dedup on the parsed key |

_(append the next run's rows here)_

---

## 3. Run archives (verbatim, per session)

### Run 2026-06-29 (demo_fh4 / my_db) — full detail

**P4/P5/P6 — source-table selection (the "49 vs 47").** Same English question; only P5 adds the SQL.
- **P4 4A** `53Li6zrprm7N9NSvcPaE`: *"How many distinct devices produced at least one raw GPS position log on calendar day 2026-06-28 UTC … do not restrict to active/tracked/IsTracked … Return only the number."* → **49**. SQL: `SELECT COUNT(DISTINCT DeviceId) FROM \`GpsLogs\` WHERE UTC_GpsTimestamp >= '2026-06-28 00:00:00 UTC' AND UTC_GpsTimestamp < '2026-06-29 00:00:00 UTC'`
- **P4 R2/R3** `xfRC82AvU9Su4u0BsTYM`, `BC8CnzGtRIwGR02epyiT`: identical prompt → **49**, **49** (R3 injected `AND DATE(GpsDateTime)=DATE('2026-06-28')`).
- **P5 4B** `MbJ6VAoCle52iGd6m0YR`: P4 prompt **+** *"Run exactly: SELECT COUNT(DISTINCT DeviceId) AS n FROM GpsLogs WHERE UTC_GpsTimestamp >= '2026-06-28 00:00:00 UTC' AND UTC_GpsTimestamp < '2026-06-29 00:00:00 UTC'"* → **47**, executed `SELECT COUNT(DISTINCT DeviceId) AS n FROM \`Trip\` WHERE UTC_TripStartTimestamp >= '2026-06-28 00:00:00 UTC' AND UTC_TripStartTimestamp < '2026-06-29 00:00:00 UTC' AND DATE(TripStartDateTime) BETWEEN DATE('2026-06-27') AND DATE('2026-06-29')`.
- **P6** `SaV8GtVptocbsPPgKIw1`: *"How many distinct devices had at least one trip that started on calendar day 2026-06-28 UTC? …Return only the number."* → **47** from `Trip`.

**P1/P2/P3 — freshness.**
- P1 `fLPYaGZErt5woI4dH0cP`: max `2026-06-29 21:37:15.035`, now `21:37:34.366`. SQL `SELECT MAX(UTC_GpsTimestamp), CURRENT_TIMESTAMP() FROM \`GpsLogs\` WHERE GpsDateTime >= DATETIME_SUB(CURRENT_DATETIME(), INTERVAL 7 DAY)`.
- P2 `mXdb0QGjzvxehI1CCa7F`: `2026-06-29 21:34:48.455 UTC`. SQL `SELECT MAX(UTC_StatusTimestamp) FROM \`StatusData\` WHERE StatusDateTime BETWEEN DATETIME_SUB(CURRENT_DATETIME(), INTERVAL 30 DAY) AND CURRENT_DATETIME()`.
- P3 `Aad71Hlt3n0EfjoNggC7`: end `21:30:34.098`; 20 in last 15 min. SQL uses `MAX(UTC_TripEndTimestamp), COUNTIF(... INTERVAL 15 MINUTE) FROM \`Trip\``.

**P8 — zone propagation poll timeline** (add via Get `Add Zone` id `b1` at `21:41:04`; removed after):
`21:41:38` 0 (`y9F6AR7RZQSV1Sptai9Z`) · `21:45:04` 0 (`mNQPkyHcauLiukdxTDk8`) · `21:47:13` 0 (`uBozVjFuyyoDxNwOTTmM`) · `21:52:24` not found (`Qr8kNvIbeoxTVPPVoQOL`) · `21:55:02` not found (`JrEcc5QYtlzcjOUc3qvJ`) · **`22:09:42` present** (`5E0H7Un0GPulkcLCzINp`).

**Five paired tests (English vs English+SQL), device b3** — `chat_id`s: 1A `mNRpRf7SlRISGtxXohXX` (cols honored; injected `DATE>=`), 1B `fi8B4okL8scSNDc51JPR` (verbatim), 2A `QguIzUYZktPTMbqx6lRf` (16 trips, km kept), 2B `jlew0E4tiA9HVDKVDMeA` (verbatim; **2 prior `invalid_value` 400s**), 3A `JwbtKfkJYhY0eTSuwgk7` (**1756**, UTC + injected `DATE BETWEEN`), 3B `fMlPvRdY0JyUTltd3MuJ` (**1756**), 5A `FrF7EqUPoabUU01X0Sbq` (**955**, no speed/ignition filter), 5B `uK609RhO2Ip3bDac72Wv` (**959**). Probe (response-size + schema discovery) `5GHBDuynCYAFTIVGCO6E` (577 rows; revealed `GpsLogs`, `Trip`, `VehicleKPI_Daily`, `LatestVehicleMetadata`, `Zones`).

**Device population (active-only trap):** GPS-active **49** (P4) · trip-active **47** (P6) · `dim_device` **50** (Get) · warehouse silver (built from an `IsTracked=TRUE` pull) **~25–26**.

_(add the next session as "### Run YYYY-MM-DD" below)_
