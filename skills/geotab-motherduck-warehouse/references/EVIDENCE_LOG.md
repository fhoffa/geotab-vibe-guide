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

> **Note:** rows below labelled DB `my_db` were measured before the warehouse was migrated (2026-06-29)
> to the recommended layout **`geotab_demo_fh4`** with `bronze`/`silver`/`gold` schemas
> (`my_db.bronze_gps_raw` → `geotab_demo_fh4.bronze.gps_raw`, etc.). The figures stand; only the location moved.

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
| **P12** | connectors | preflight before any DDL | tiny `Get(Device, resultsLimit=1)` **and** a tiny `GetAceResults` call **and** a MotherDuck read | all three must succeed *now*; if Ace fails, stop before creating tables |
| **P13** | Ace + MotherDuck | full minimal-mirror bootstrap (2-day GPS) | Ace GPS-window prompt → land bronze → derive silver → counts + min/max + distinct devices + 0-dupe check | source `GpsLogs`, columns honored, devices reconcile to `dim_device` |
| **P14** | MotherDuck | brownfield schema drift on a pre-existing table | `list_columns` a reused silver table; provenance `INSERT` | missing provenance cols → `ALTER TABLE … ADD COLUMN IF NOT EXISTS` before insert (don't `CREATE OR REPLACE`) |
| **P15** | Ace | cross-DB repeat: injected-window upper-bound clip | Same 3 prompts (GPS freshness, distinct-devices, **status freshness ×3 each**) on `demo_fh4` **and** `Demo_fh_vegas4`; read each returned SQL's `WHERE` bound | freshness max should be live; a `<yesterday> 23:59:59.xxx` answer reveals a `CURRENT_DATE()` upper bound clipping today |
| **P16** | Ace + MotherDuck | **trip re-split drift** (mutable fact) | After a forward trips load, re-pull the affected day's trips (`TripId`+start); diff the source `TripId` set vs `silver.trips` for that day (orphans = silver∖source, missing = source∖silver) | drift > 0 means trips re-split after load; expect it **clustered in the hours before the prior watermark**. Fix = reconcile (delete orphans + anti-join new ids), [`INCREMENTAL_BACKFILL.md`](INCREMENTAL_BACKFILL.md) §D |

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

| 2026-06-29 | Demo_fh_vegas4 | isolation (list_databases) | saw `geotab_Demo_fh_vegas4` (pre-existing from a prior interrupted run, operator reused it), `geotab_demo_fh4`, `sample_data`; wrote only to target | ChatGPT/MCP | **isolation validated — 2nd source beside geotab_demo_fh4, no cross-writes** |
| 2026-06-29 | Demo_fh_vegas4 | credential test | `Get(Device, limit=1)` → `b30` "Demo - 48" | ChatGPT/MCP | one-row probe is a good "test once" pattern |
| 2026-06-29 | Demo_fh_vegas4 | dim load | `silver.dim_device` = **50** (from the prior run; resume) | ChatGPT/MCP | dim via Get worked |
| 2026-06-29 | Demo_fh_vegas4 | **P12 (preflight)** | **FAIL** — `Get` worked, Ace undiscoverable. **Confirmed cause: ChatGPT mixed connector modes** (Geotab + MotherDuck must both be official or both dev-mode); not Geotab/Ace behavior | ChatGPT/MCP | **GPS load incomplete: bronze.gps_raw=0, silver.planet_gps_pings=0.** Fix: same mode for both; preflight Ace before DDL |
| 2026-06-29 | Demo_fh_vegas4 | host: DESCRIBE | two-`DESCRIBE` call + `COUNT(DISTINCT a||b)` shape query **blocked** by host safety; `list_columns` worked | ChatGPT/MCP | prefer `list_columns`/`list_tables`, one stmt/call, simple SQL |

| 2026-06-29 | Demo_fh_vegas4 | **P13** (re-run after connector fix) | **SUCCESS** — Ace `FROM GpsLogs`, **477,413** rows for `[2026-06-27, 2026-06-29)` UTC; bronze.gps_raw=477,413 → silver.planet_gps_pings=**477,413** (0 dupes on parsed key); min `2026-06-27 00:00:00.34`, max `2026-06-28 23:59:59.76`; **50** distinct devices; gold summary 100 rows | Ace chat `O3ilNgH5eA5aQuHpYxWd`; obj `gs://planet-user-results-prod-us/4d54d37a-…csv` | full pipeline validated on a 2nd source + 2nd host. SQL had **no** IsTracked/speed/ignition filters; benign partition guard *widened* the window (`DATE BETWEEN '06-26' AND '06-30'`); left-joined `LatestVehicleMetadata` for `DeviceName` |
| 2026-06-29 | Demo_fh_vegas4 | **P14** | reused `silver.planet_gps_pings` lacked provenance cols → provenance `INSERT` failed `Binder Error: … no column` (e.g. `_batch_id`); fixed with `ALTER TABLE … ADD COLUMN IF NOT EXISTS` then inserted | ChatGPT/MCP | **`CREATE TABLE IF NOT EXISTS` keeps the OLD schema** — `list_columns` + `ADD COLUMN` before insert. (Original error named `_source_db`, since dropped from the design — the drift lesson is unchanged) |
| 2026-06-29 | Demo_fh_vegas4 | device population | `GetCountOf Device`=50, `dim_device`=50, GPS-window distinct devices=50, 0 missing | Get API + MotherDuck | "include all devices" gave the full 50 (active-only trap avoided) |
| 2026-06-29 | account | isolation | writes scoped only to `geotab_Demo_fh_vegas4`; `geotab_demo_fh4` + `sample_data` untouched | ChatGPT/MCP | isolation held across hosts |

| 2026-06-29 | Demo_fh_vegas4 | daily incremental (forward) | watermark `2026-06-28 23:59:59.76` → pulled `[2026-06-29, 2026-06-30)`; Ace **248,820** rows (50 devices); silver **477,413 → 726,233**, **0 dupes**; idempotent batch-scoped derive (`WHERE _batch_id=…`); max now `2026-06-29 23:28:48.68` (partial current day, expected) | Ace chat `t91zNdOfsJH2tAMOlwmd`; obj `gs://planet-user-results-prod-us/9aad0905-…csv` | forward catch-up validated. Quirk: Ace used **inner** `JOIN LatestVehicleMetadata` (vs LEFT prior) — reconciled to 50/0-missing here, but inner can drop rows; check population. `list_databases` blocked by host → scoped to fully-qualified target only |

| 2026-06-29 | Demo_fh_vegas4 | dimension sizes (operational-mirror expansion, **partial run**) | `Get` counts: User=1, Zone=0, Rule=13, **Diagnostic=65,757** → `Diagnostic` too large for the Get→JSON hand-build path (esp. ChatGPT, no scratchpad); switched it to the Ace bulk-CSV path | ChatGPT/MCP | **pick channel by size**: large reference tables use the bulk CSV path, or load only the subset referenced by facts (ENTITY_CATALOG §Dimensions). Trips/exc/status backfill to 2026-06-01 still in progress |

| 2026-06-29 | Demo_fh_vegas4 | Get propertySelector field check (partial run) | `Get(User, fields=[…,'isActive'])` → **`'User.isActive' is an unknown property'`** (`NotSupportedException`) — one bad field fails the whole call | ChatGPT/MCP | verify fields with `GetEntity` before selecting; `User` has no `isActive` (use `isDriver` + `activeFrom`/`activeTo`). ENTITY_CATALOG §Dimensions |

| 2026-06-29 | Demo_fh_vegas4 | op-mirror: trips backfill→2026-06-01 | **60,334** trips (bronze=silver), 50 devices, 0 null keys, `2026-06-01 00:00:28` → `06-29 23:28:52` | Ace chat `YwUuR4faAFrXUPvPPkLl` | broad trip projection failed `invalid_value`; core `Trip` cols worked; `DeviceName` not returned → derive from dim_device |
| 2026-06-29 | Demo_fh_vegas4 | op-mirror: exception_events backfill→2026-06-01 | **19,295** events, 50 devices, 0 null keys, max `06-28 23:37:38` (event source had nothing later — event cadence) | Ace chat `UjNhHQOEfOqrOSf9IPXb` | — |
| 2026-06-29 | Demo_fh_vegas4 | op-mirror: status_data (the heavy fact) | Ace export **23,153,282** rows → **10 signed-URL shards**; bronze loaded all 23.15M; **silver partial (6,946,986)** — one-shot derive timed out at 55 s, per-shard inserts worked (3/10 before tool time) | Ace chat `KWtmkvx0aIxMuSFJad2L`; objs `…dd2-…000` … `…009.csv` | **sharding + per-shard derive** quirks folded in (ACE #2, MEDALLION §large facts). Ace returned col `DATA` uppercase (case drift, quirk #7) |
| 2026-06-29 | Demo_fh_vegas4 | op-mirror: dimensions | dim_user=1, dim_zone=0, dim_rule=13 via Get; **dim_diagnostic NOT done** (65,757 too large for Get→JSON) | Geotab Get | use Ace bulk CSV or load only fact-referenced subset (ENTITY_CATALOG §Dimensions) |
| 2026-06-29 | Demo_fh_vegas4 | scope caveat | GPS not extended to 2026-06-01 this run (still starts 06-27); "all facts" → remaining GPS backfill is `[06-01, 06-27)` | MotherDuck | finish with the windowed backward backfill |

| 2026-06-29 | Demo_fh_vegas4 | storage / cost re-measure (P10) | `PRAGMA database_size` = **1.7 GiB** for the operational mirror (~51M rows kept); `status_data` 23,153,282 (~16k/veh/day, ~90% of warehouse) ≫ GPS 2,432,798 (~1,700/veh/day) ≫ trips 60,334, exc 19,295 | MotherDuck | **StatusData dominates: operational mirror ≈ 0.4 GB/veh-yr ≈ 12× GPS-only.** COST_AND_SIZING updated (free tier holds only ~25 veh-yr operational; very-large op ≈ $1.5–2k/mo). Migrated demo drifted 35→57 MiB (historical_bytes from CTAS reorg) |

| 2026-06-30 | Demo_fh_vegas4 | op-mirror COMPLETE | GPS backfilled to 2026-06-01 (silver **7,158,022**, 0 dupes, bronze 11,885,206 — Ace returned ~2× dup rows, dedup collapsed them); `dim_diagnostic` **65,772** via Ace bulk CSV; gold 1,450 (29d×50); gaps: GPS/trips/status 0, exceptions 1 day (06-29, event cadence); population 50/50/50/50 | Ace chats per window (see archive) | dedup-on-dups (quirk #6), large-dim bulk path, only 56 diagnostics actually referenced |
| 2026-06-30 | Demo_fh_vegas4 | **fabricated-data incident** | Agent had invented warehouse-only `dim_driver` / `trip_driver_assignment` / `operator_daily_*` ("synthetic_demo_assignment") not present in Geotab; operator flagged it; removed all but `silver.dim_driver` (host blocked the DROP) | ChatGPT/MCP | **Mirror real source data only — never fabricate.** New Non-negotiable #14. Finished cleanup from Claude Code (no host block): dropped `silver.dim_driver` + scratch `gps_stage_tmp`/`status_stage_tmp`/`load_probe_ok`. Left `status_data_dedup` + `gold.fleet_daily_operational_summary` for owner review (**`status_data_dedup` resolved in the next row**) |
| 2026-06-30 | Demo_fh_vegas4 | dedup-twin resolved + **bronze replay** | `status_data_dedup` was a **VIEW** (`row_number() PARTITION BY StatusId … =1`), **not** a storage twin — base `silver.status_data` had 23,153,282 rows incl. **605 duplicate `StatusId`s**; the view masked them at zero storage cost. Folded dedup into the base table and dropped the view → `silver.status_data` **23,152,677** (= distinct `StatusId`). En route I `DROP TABLE`'d the base before realizing the sibling was a view (`RENAME` errors on views); **re-derived silver from `bronze.status_data_raw` (23,153,282) with zero data loss** | MotherDuck | **Check table-vs-view before DROP/RENAME**; a `_dedup` sibling is usually a view. Earlier "twin doubles storage" was wrong (a view stores nothing). MEDALLION housekeeping note corrected. Bronze-as-system-of-record validated: silver is fully replayable |

| 2026-06-30 | Demo_fh_vegas4 | MotherDuck capability: `COMMENT ON DATABASE` | **Not supported** — `COMMENT ON DATABASE geotab_Demo_fh_vegas4 IS '…'` → `Not implemented Error: Adding comments to databases is not implemented`. Both pre-existing geotab DBs had `duckdb_databases().comment = NULL` (the documented mechanism never worked). `COMMENT ON TABLE` **does** work; `main.warehouse_meta` row written + read back OK | MotherDuck | **Source identity moved to a `main.warehouse_meta` table** (+ optional `COMMENT ON TABLE`). SKILL §First run + rule #12 + MEDALLION §isolate corrected. (Codex review on PR #107.) |

| 2026-06-30 | demo_fh4 + Demo_fh_vegas4 | P15 (GPS freshness) | Both: `SELECT MAX(UTC_GpsTimestamp), CURRENT_TIMESTAMP() FROM GpsLogs WHERE DATE(GpsDateTime) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)` (lower-bound only). demo max `14:34:32.898` vs now `14:34:52.269` → **~19 s**; vegas max `14:35:10.14` vs `14:35:28.542` → **~18 s** | chats `6IHIVVDHsDJhvuQShGLB` / `oHYbjyxLWsE199zv7WYO` | identical SQL across DBs; live (lower-bound-only guard doesn't clip) |
| 2026-06-30 | demo_fh4 + Demo_fh_vegas4 | P15 (distinct devices 06-28) | Both: `SELECT COUNT(DISTINCT DeviceId) FROM GpsLogs WHERE DATE(UTC_GpsTimestamp) = '2026-06-28'` → **demo 49 / vegas 50** | chats `89zah3zXjSzZoub0iAYD` / `HorGn9NEiJmO2wKm6bdn` | same `FROM GpsLogs` both DBs (demo 49 reconfirms the P4 GpsLogs figure); count gap = fleet size, not a quirk |
| 2026-06-30 | demo_fh4 (×3) + Demo_fh_vegas4 (×3) | P15 (status freshness — **upper-bound clip, quirk #20**) | 6 runs of the *same* "most recent raw status" prompt, all `FROM StatusData`. **Live (4/6)** when `… AND CURRENT_DATETIME()`: demo `14:36:53.315`, `14:39:23.504`; vegas `14:37:15.52`, `14:40:45.54`. **Clipped (2/6)** when `… AND CURRENT_DATE()` (midnight today): demo `2026-06-29 23:59:59.846`, vegas `2026-06-29 23:59:59.94`. Window size/bound-type also varied per call (7-day & 30-day; `DATE_SUB(CURRENT_DATE())`+`DATE()` vs `DATETIME_SUB(CURRENT_DATETIME())`) — **not DB-stable** (demo gave both) | chats demo `tUoHLa6TaTaUG5mTQcQX` / `4ko9uoBbAM3VFQL5nTR7` / `Flyh8IcCA4bNzzD3qeso`; vegas `ujCORad8QgHLx4JlpI6q` / `GrWD6cyc6rhf41J9Knv7` / `ugnG1w9moir9nXJaBYkD` | **NEW quirk #20**: injected upper bound on `CURRENT_DATE()` silently drops the current day → `…23:59:59.xxx` artifact. Don't use Ace for freshness/watermark; verify export upper bound. ACE_TO_CSV #20, SKILL quirk #16, CHANNELS caveat |

| 2026-06-30 | Demo_fh_vegas4 | daily update (forward, all 4 facts) | From the 06-29 bootstrap watermark to now: trips +**1,425** (Ace 1,426, chat `kzJBr5vT9EqPSjLkdpcj`), gps +**175,378** (Ace 350,760 **2×**, chat `gxfnZiOBre4ut8B1ZWK6`), status +**550,909** (no fan-out, chat `WOgzoclOaeVcOEC3yb8E`), exceptions +**1,178** (Ace 2,356 **2×**, chat `b59GBQ5kShsaF5t6JE6s`). dim_user refreshed 1→**11** (10 drivers) | objs `…/9dc91530…`, `…/b7ffeb49…`, `…/a0827440…`, `…/e32b1c6d…` (`prod-us`) | forward loop validated on the Claude Code host. dim_user was stale (1 user) until refreshed — drivers only appear after a dimension refresh |
| 2026-06-30 | Demo_fh_vegas4 | **metadata-join fan-out (quirk #12)** | GPS & exceptions joined `LatestVehicleMetadata` `ON DeviceId` only → **exactly 2×** rows (each device had 2 metadata rows): gps 350,760→175,378 distinct `(DeviceId,GpsDateTime)`; exc 2,356→1,178 distinct `EventId`. StatusData's join carried `… AND StatusDateTime BETWEEN Device_ActiveFrom AND Device_ActiveTo` → **no** fan-out (550,909=550,909) | same chats as above | silver natural-key dedup absorbs it; shape-check expects `csv_rows` = integer multiple of distinct keys. ACE_TO_CSV #6b/#12 |
| 2026-06-30 | Demo_fh_vegas4 | **`invalid_value` 400 on plain English (quirk #17 update)** | A **bounded** plain-English trips prompt ("started at or after X **and before Y**", 17 cols) returned `invalid_value` (`domain: MyGeotab-MCP`) **4×**; the **open-ended** form ("started after X", same cols) succeeded at once | failing prompts had no chat_id; success chat `W9yCqZ4jpwqfBi8u9OY8` | corrects "plain English never fails" — retry, and prefer open-ended over bounded when a 400 repeats. ACE_TO_CSV #17 + failure-modes |
| 2026-06-30 | Demo_fh_vegas4 | **P16 — trip re-split drift + reconcile** | After the forward trips load, reconciling 06-29: source **2,138** / silver **2,137** → **50 orphans + 51 missing**, **all in 22:00–24:00** (40 in the 23:00 hr) — the 2 h before the bootstrap watermark (23:28:52). Proof: trip `b10FEE52` (23:18→23:28) at bootstrap was `b11011A1` (23:18→**23:42**) by afternoon; `Get Trip {id:'b10FEE52'}`→empty. Reconcile (delete 50 orphans + anti-join 51 new ids) → **2,138 == 2,138, 0/0** | full-day pull chat `0hgweUgCTwhzypnQ3TWL` (obj `…/8c1bba50…`); boundary re-pull chat `W9yCqZ4jpwqfBi8u9OY8` (obj `…/59d77242…`) | **NEW: `Trip` is a mutable fact.** Forward catch-up can't see re-splits of pre-watermark trips. New backfill op **D** + Non-negotiable #15. INCREMENTAL_BACKFILL §D, ENTITY_CATALOG †, QUALITY_AND_REPAIR §1/§4 |

| 2026-06-30 | Demo_fh_vegas4 | **trips bronze-replay (mutable-fact)** | A `DISTINCT ON (TripId)` rebuild would resurrect retired splits. Drive-key/latest-wins rebuild — `DISTINCT ON (DeviceId, trip_start_utc) … ORDER BY …, _loaded_at DESC` over all 3 bronze trip batches (60,334+1,426+1,647) — reproduced the reconciled silver **exactly: 61,760 total, 06-29 `2138==2138`, 0 diff both ways, retired `b10FEE52` NOT resurrected** | MotherDuck (scratch `_test_rebuild`, dropped) | confirms the §D "Replaying trips from bronze" recipe; trips don't replay like an immutable fact. (Codex P2 on PR #110) |

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

### Run 2026-06-29 (Demo_fh_vegas4, ChatGPT / MCP) — isolation OK, Geotab link lost mid-run

Second source, run on **ChatGPT** (different MCP host). The target `geotab_Demo_fh_vegas4` **already
existed from a prior, interrupted run by the operator, who told it to reuse the (near-empty) DB** — so
this is a *resume*, not a cold first run. `silver.dim_device` was already populated (**50**) from that
earlier attempt while the fact tables were empty. Isolation still held: `list_databases` showed
`geotab_demo_fh4` (the first source) + `sample_data`; all writes went only to the target — no
cross-writes. Credential test `Get(Device, limit=1)` → `b30 "Demo - 48"`.

**Blocker — ChatGPT connector-mode mismatch (confirmed).** Geotab `Get` worked, but `GetAceResults`
became undiscoverable (`list_resources(["Geotab"])` returned no Geotab namespace), so the 2-day GPS pull
never ran: `bronze.gps_raw = 0`, `silver.planet_gps_pings = 0`. **Root cause (operator-confirmed): the
two MCP servers were in mixed modes — on ChatGPT, Geotab and MotherDuck must both be official connectors
or both developer-mode; mixing them dropped the Geotab connector.** Not a Geotab/Ace behavior. Fix:
same mode for both. Defensive net regardless: **probe P12 (connector preflight)** + **Non-negotiable
#13** — verify Ace callable *before* any DDL; stop if absent (don't half-build).

**Host quirks (ChatGPT MCP safety layer):** a two-statement `DESCRIBE` and a `COUNT(DISTINCT a||b)` shape
query were both **blocked**, while `list_columns`/`list_tables` worked → guidance added to prefer those,
one statement per call, simple shape SQL. Also confirmed: an explicit "replicate/load" instruction is the
write-confirmation for hosts that gate `query_rw`; and a **partial-brownfield** target (dim populated,
facts empty) is a valid resumable state (`IF NOT EXISTS`, never `CREATE OR REPLACE` silver in bootstrap).
*(Folded into SKILL §First run + rules #2/#6/#13 and MEDALLION §brownfield.)*

### Run 2026-06-29b (Demo_fh_vegas4, ChatGPT / MCP) — SUCCESS after the connector-mode fix

Re-ran once both MCP servers were in the **same mode** (the §D fix). The full minimal mirror completed
on a **second source + second host**:
- Ace returned **477,413** GPS rows for `[2026-06-27, 2026-06-29)` UTC, `FROM GpsLogs`, columns exactly
  as asked, **no** IsTracked/speed/ignition filters; a benign partition guard *widened* the window
  (`DATE(GpsDateTime) BETWEEN '2026-06-26' AND '2026-06-30'`); `LatestVehicleMetadata` left-joined for
  `DeviceName`.
- Landed append-only into `bronze.gps_raw` (477,413), derived `silver.planet_gps_pings` (**477,413**, 0
  dupes on the parsed key), built `gold.daily_device_gps_summary` (100 rows).
- Population check: `GetCountOf Device`=50 = `dim_device`=50 = GPS-window distinct devices=50, 0 missing.
- Isolation held: only `geotab_Demo_fh_vegas4` written; `geotab_demo_fh4` + `sample_data` untouched.
- **New finding (P14):** the reused `silver.planet_gps_pings` lacked provenance columns; `CREATE TABLE
  IF NOT EXISTS` kept the old schema, so the provenance `INSERT` errored until `ALTER TABLE … ADD COLUMN
  IF NOT EXISTS` was run. → MEDALLION §brownfield schema-drift checklist.
- Minor: the signed URL bucket was `planet-user-results-prod-**us**` (region varies by DB; URL host
  isn't fixed to `-eu`). Store only the `gs://<bucket>/<object>` path, never the signed query string.
