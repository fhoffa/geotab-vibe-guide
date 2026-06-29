# Evidence log — exact prompts, replies & SQL behind the claims

Every empirical claim in this skill traces to a call here. All runs: **Geotab MCP + MotherDuck on
`demo_fh4` / `my_db`, 2026-06-29** (~50-vehicle demo). These are **point-in-time observations** — to
rebuild or investigate, re-run the prompt (or continue the chat via its `chat_id` while it's still
live), and update the dates. "Executed SQL" is what Ace returned in its response (grepped from the
spilled payload — see [`ACE_TO_CSV.md`](ACE_TO_CSV.md) §Step 2); note Ace often injects extra
`DATE(...)` partition guards (quirk #12), preserved verbatim below.

> Tool legend: **Ace** = `mcp__Geotab_MCP__GetAceResults`; **Get API** = `mcp__Geotab_MCP__Get` /
> `GetCountOf` / `Add` / `Remove`; **MotherDuck** = `mcp__MotherDuck__query` / `query_rw`.

---

## A. Source-table selection — the "49 vs 47" (Ace)

**Claim:** the *same question* can be answered from a *different source table* across runs; an attached
SQL is a hint Ace can override; an identical prompt is otherwise stable. (Not numeric non-determinism.)

| Run | chat_id | time (UTC) | Prompt (verbatim) | Answer | Executed `FROM` | Result |
|-----|---------|-----------|-------------------|--------|-----------------|--------|
| 4A | `53Li6zrprm7N9NSvcPaE` | 21:01:15 | "How many distinct devices produced at least one raw GPS position log on calendar day 2026-06-28 UTC …? Count every device … do not restrict to active/tracked/IsTracked … Return only the number." | "49 distinct devices…" | `GpsLogs` | **49** |
| R2 | `xfRC82AvU9Su4u0BsTYM` | 22:04:50 | *(identical to 4A)* | "49 distinct devices…" | `GpsLogs` | **49** |
| R3 | `BC8CnzGtRIwGR02epyiT` | 22:05:29 | *(identical to 4A)* | "…there were 49…" | `GpsLogs` | **49** |
| 4B | `MbJ6VAoCle52iGd6m0YR` | 21:02:11 | *(same question)* **+ "Run exactly: SELECT COUNT(DISTINCT DeviceId) AS n FROM GpsLogs WHERE UTC_GpsTimestamp >= '2026-06-28 00:00:00 UTC' AND UTC_GpsTimestamp < '2026-06-29 00:00:00 UTC'"** | "47 distinct devices…" | **`Trip`** (ignored supplied SQL) | **47** |
| Trip check | `SaV8GtVptocbsPPgKIw1` | 22:07:03 | "How many distinct devices had at least one trip that started on calendar day 2026-06-28 UTC …? Return only the number." | "47 distinct devices…" | `Trip` | **47** |

Exact executed SQL:
- **4A / R2:** `SELECT COUNT(DISTINCT DeviceId) FROM `GpsLogs` WHERE UTC_GpsTimestamp >= '2026-06-28 00:00:00 UTC' AND UTC_GpsTimestamp < '2026-06-29 00:00:00 UTC'`
- **R3** (note injected guard): `… FROM `GpsLogs` WHERE UTC_GpsTimestamp >= TIMESTAMP('2026-06-28 00:00:00 UTC') AND UTC_GpsTimestamp < TIMESTAMP('2026-06-29 00:00:00 UTC') AND DATE(GpsDateTime) = DATE('2026-06-28')`
- **4B** (the supplied SQL said `FROM GpsLogs`; Ace ran): `SELECT COUNT(DISTINCT DeviceId) AS n FROM `Trip` WHERE UTC_TripStartTimestamp >= '2026-06-28 00:00:00 UTC' AND UTC_TripStartTimestamp < '2026-06-29 00:00:00 UTC' AND DATE(TripStartDateTime) BETWEEN DATE('2026-06-27') AND DATE('2026-06-29')`
- **Trip check:** `SELECT COUNT(DISTINCT t_t.DeviceId) FROM `Trip` AS t_t WHERE t_t.UTC_TripStartTimestamp >= TIMESTAMP('2026-06-28 00:00:00 UTC') AND t_t.UTC_TripStartTimestamp < TIMESTAMP('2026-06-29 00:00:00 UTC')`

**Reading:** 49 = devices that logged GPS; 47 = devices that took a trip — both correct. The gap was a
source-table difference, not drift. GpsLogs is stable across 3 identical runs. To investigate, continue
chat `MbJ6VAoCle52iGd6m0YR` and ask why it used `Trip`.

---

## B. Freshness — continuous streams vs event tables (Ace)

`max(event_time)` compared to Ace's own `CURRENT_TIMESTAMP`:

| Entity | chat_id | time | Answer | Executed SQL `FROM` |
|--------|---------|------|--------|---------------------|
| GPS | `fLPYaGZErt5woI4dH0cP` | 21:37:17 | max `21:37:15.035`, now `21:37:34.366` → **~19 s** | `GpsLogs` (`MAX(UTC_GpsTimestamp), CURRENT_TIMESTAMP()`, 7-day guard) |
| StatusData | `mXdb0QGjzvxehI1CCa7F` | 21:35:32 | max `21:34:48.455` (= live `DeviceStatusInfo`) | `StatusData` (`MAX(UTC_StatusTimestamp)`, 30-day guard) |
| Trip | `Aad71Hlt3n0EfjoNggC7` | 21:36:26 | most-recent end `21:30:34.098`; **20 trips ended in last 15 min** | `Trip` (`MAX(UTC_TripEndTimestamp), COUNTIF(... 15 MINUTE)`) |
| FaultData (Get API) | — | ~21:34 | newest fault `12:07–12:18` (no fault since noon — sparsity, not lag) | `Get FaultData` window |

**Reading:** continuous streams (GPS/StatusData) lag tens of seconds; event tables look "old" only when
no event occurred — gauge them by counting events in a window, not max-vs-now.

---

## C. Five paired tests — English vs English+SQL (Ace)

All device `b3`. Result = the reconciled fact; **bold** = the reliability signal.

| # | Arm | chat_id | Answer | Executed SQL (key points) |
|---|-----|---------|--------|---------------------------|
| 1A | English | `mNRpRf7SlRISGtxXohXX` | cols honored `DeviceId,GpsDateTime,…` | `FROM GpsLogs … AND DATE(GpsDateTime) >= DATE('2026-06-27')` ← **injected guard** |
| 1B | +SQL | `fi8B4okL8scSNDc51JPR` | same cols | ran my query **verbatim**, no injection |
| 2A | English | `QguIzUYZktPTMbqx6lRf` | 16 trips, **km kept** | `FROM Trip … TripDistance_Km` (no miles) |
| 2B | +SQL | `jlew0E4tiA9HVDKVDMeA` | 16 trips | verbatim — **but 2 prior attempts failed `invalid_value` 400** (transient) |
| 3A | English | `JwbtKfkJYhY0eTSuwgk7` | **1756** (UTC) | `FROM GpsLogs` UTC bounds + injected `DATE BETWEEN` |
| 3B | +SQL | `fMlPvRdY0JyUTltd3MuJ` | **1756** | verbatim |
| 4A/4B | — | *(see §A)* | 49 / 47 | GpsLogs vs Trip |
| 5A | English | `FrF7EqUPoabUU01X0Sbq` | **955** | `FROM GpsLogs` no speed/ignition filter ✓ |
| 5B | +SQL | `uK609RhO2Ip3bDac72Wv` | **959** (live growth) | verbatim, no filter |

**Reading:** explicit English matched English+SQL on correctness in every test; the only failures
(2× `invalid_value` 400) and the only source-flip (4B) were on SQL-augmented prompts. Specificity beats
attaching SQL.

---

## D. Zone write → Ace propagation (Get API write, Ace read)

- **Add (Get API):** `Add Zone {name:'ZZ_ACE_PROBE_ALPHA', points:[…]}` → id `b1`, at **21:41:04** (clock from a `DeviceStatusInfo` read).
- **Visible via Get API instantly** (`Get Zone` returned it immediately).
- **Ace polls** (each `new_chat=true`, "how many zones / is ZZ_ACE_PROBE_ALPHA there?"):

| Poll time | T0+ | Ace answer | chat_id |
|-----------|-----|-----------|---------|
| 21:41:38 | 0.5 m | 0 zones | `y9F6AR7RZQSV1Sptai9Z` |
| 21:45:04 | 4 m | 0 zones | `mNQPkyHcauLiukdxTDk8` |
| 21:47:13 | 6 m | 0 zones | `uBozVjFuyyoDxNwOTTmM` |
| 21:51:21 | 10 m | 0 zones | `fMlPvRdY0JyUTltd3MuJ`* |
| 21:52:24 | 11 m | not found | `Qr8kNvIbeoxTVPPVoQOL` |
| 21:55:02 | 14 m | not found | `JrEcc5QYtlzcjOUc3qvJ` |
| **22:09:42** | **~29 m** | **"Yes, ZZ_ACE_PROBE_ALPHA exists. 1 zone."** | `5E0H7Un0GPulkcLCzINp` |

- **Remove (Get API):** `Remove Zone {id:'b1'}` after confirmation (cleanup).

**Reading:** dimension/config propagation to Ace took **between 14 and 29 minutes** (vs seconds for
telematics). For freshly-changed reference data, read the Get API, not Ace.

---

## E. `GetCountOf` ignores fact windows (Get API — NOT Ace)

`mcp__Geotab__GetCountOf`, 2026-06-29:

| Call | Search | Result |
|------|--------|--------|
| `LogRecord` | `deviceSearch b3`, `2026-06-28 → 2026-06-29` | **16,098,152** |
| `LogRecord` | `deviceSearch b3`, `2026-06-29 → 2026-06-29T21:00` | **16,098,152** (identical — window ignored) |
| `Trip` | `deviceSearch b3`, `2026-06-28 → 2026-06-29T21:00` | **1,388,687** (all trips) |
| `Device` | (none) | 50 (✓ matches `dim_device`) |

**Reading:** `GetCountOf` returns whole-table totals for facts (ignores date/device search) — useful
only for dimensions. Reconcile fact windows with a bounded `Get` read instead.

---

## F. Compute & storage (MotherDuck, `my_db`, 2026-06-29)

- `PRAGMA database_size` → **35.2 MiB** (679,577 unique GPS pings as bronze `all_varchar` + typed silver, + trips/exc/dims).
- `EXPLAIN ANALYZE` server-side times: watermark `max()` over 679,577 = **0.0822 s**; full silver derive (`DISTINCT ON`, 679,581 rows) = **1.07 s**; `read_csv_auto` count over a signed URL (2,679 rows, 149.3 KiB, 1 HEAD + 1 GET) = **1.47 s**.
- Dedup-key proof: `DISTINCT ON` on **raw string** key → **679,581**; on **parsed timestamp** key → **679,577** (4 boundary dupes collapse).
- Bronze batches: `bootstrap_from_silver` 522,162 + `ace_csv` 157,419 = 679,581 raw → 679,577 silver.
- `MD_INFORMATION_SCHEMA.QUERY_HISTORY` → error "not available on your plan" (Lite); use `EXPLAIN ANALYZE`.

---

## G. Device population — the active-only trap (2026-06-29)

GPS-active devices **49** (Ace `GpsLogs`, §A) · trip-active **47** (Ace `Trip`, §A) · `dim_device` **50**
(Get API) · warehouse silver (built from an `IsTracked=TRUE` Ace pull) **~25–26**. The silver undercount
is the active-only default; lifting it returns the fuller 47–49.
