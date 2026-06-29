# Ace → CSV: extracting bulk Geotab data for the warehouse

Geotab **Ace** is the bulk-export channel. You ask a natural-language question; Ace generates SQL,
runs it, and **always materializes the result to a signed CSV on Google Cloud Storage**. You feed
that URL straight into MotherDuck. This file is the field guide to doing that reliably.

Tool: `mcp__Geotab_MCP__GetAceResults(database, prompt, new_chat, chat_id?)`.

> All numbers below are **measured** against `demo_fh4` on 2026-06-29. Re-measure on your fleet;
> Ace's floor is fixed but volume scales with your row counts.

## Mental model

```
GetAceResults(new_chat=true, prompt="<data request with explicit columns, UTC, precise lower bound>")
   → returns a giant JSON blob (you won't read it inline)
   → it contains a signed GCS CSV URL  ➜  hand to MotherDuck read_csv_auto()
   → it also contains "columns":[...]  ➜  the ground truth of what Ace actually named the columns
   → for ≤10 rows it also contains preview_array (inline rows)
```

## Step 1 — write the prompt (this is where pipelines live or die)

A good extraction prompt is **explicit and data-only**:

```
List every GPS position log recorded after 2026-06-26 01:42:40 UTC, across all devices.
Return these exact columns: DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude,
GpsDateTime, Speed. Use UTC timezone. Do not summarize or aggregate — return the raw position rows.
```

Rules, each tied to an observed quirk:

- **Name the columns** you want, in order. Ace usually honors them (it honored `DeviceId…Speed`,
  `vehicle_label`, `distance_km`), but **not always** — it uppercased `day`→`DAY`. So always
  reconcile against the returned `columns` array (Step 3).
- **Say "Use UTC timezone."** Ace defaults to **device-local** dates (`Local_Date`). Without UTC your
  watermarks drift across timezones.
- **Give a precise lower bound** ("after 2026-06-26 01:42:40 UTC"). But know Ace honors it only to the
  **second** (quirk #6) — you will get the boundary second back, so dedup on load.
- **Say "raw rows, do not aggregate"** when you want entity-level data; otherwise Ace may roll up.
- **Pin units** ("distance in kilometers, do not convert units"). Ace will silently convert km↔miles
  otherwise. With the unit pinned it kept `TripDistance_Km` correctly in testing.
- **Forbid the active-only filter** when you want the whole fleet: *"include every device with data; do
  not restrict to active, tracked, or IsTracked devices."* Ace's **default population is tracked-only**
  — the reason a naive GPS pull saw ~25 devices when the fleet has 50. See
  [`CHANNELS_AND_FRESHNESS.md`](CHANNELS_AND_FRESHNESS.md) §active-only trap.
- **NEVER say "url", "csv", "download", "link", or "export."** Asking for the artifact makes Ace drop
  your column spec and return a degraded default schema (quirk #8). You get a URL regardless.

### Does adding the expected SQL to the prompt help? (5 paired tests, 2026-06-29)

_Measured 2026-06-29 on `demo_fh4`._ We ran 5 scenarios twice each — **plain explicit English** vs **the same English + the exact SQL to
run** — and scored the generated SQL, columns, and counts against the warehouse. Result:

| Scenario | English only | English + SQL |
|----------|-------------|---------------|
| GPS columns + 2-day window | ✓ right cols/table; injected harmless `DATE(...) >= ...` prune | ✓ ran verbatim, no injection |
| Raw trips, no unit conversion | ✓ km kept, right cols/table | **2 transient `invalid_value` 400s**, then ✓ verbatim |
| UTC day count | ✓ UTC bounds, exact (1756) | ✓ verbatim (1756) |
| Distinct devices, no IsTracked | ✓ no filter, `GpsLogs` → **49** | answered **47** from `Trip` — **ignored the GpsLogs SQL** we supplied (source-selection, not noise; see below) |
| No speed/ignition filter | ✓ no filter (955) | ✓ (959 — live growth) |

**Conclusion: well-specified English is as reliable as English+SQL on correctness.** Every documented
quirk (miles conversion, `IsTracked`, `Speed!=0`/`Ignition`, `Local_Date`, column rename) was
suppressed by *explicit English* in both arms — naming exact columns, pinning units, forbidding the
filters, forcing UTC. What moves reliability is **prompt specificity, not attaching SQL.**

Attaching SQL has one upside and two downsides:
- **+** Ace runs it near-verbatim, so it skips the small (harmless) partition-prune predicates it adds
  in English-only mode.
- **−** It is **not even guaranteed to run** — the "distinct devices" test *supplied* `…FROM GpsLogs`
  SQL, yet Ace answered **47 from the `Trip` table** (the plain-English run used `GpsLogs` → 49, stable
  across 3 identical runs). An attached SQL is a hint Ace can override; it does not pin the source.
- **−** It correlated with **more failures** — the only `invalid_value` HTTP 400 gateway rejections we
  saw (2 of them) were on SQL-augmented calls; plain English never failed.

So: **write emphatic English; treat any SQL you add as a hint, not a contract; always reconcile the
returned `columns` array and counts regardless.** Reading Ace's *returned* SQL as a pre-load gate
(see [`QUALITY_AND_REPAIR.md`](QUALITY_AND_REPAIR.md)) catches far more than feeding SQL in ever did.

### Copy-paste prompts per fact entity

```
GPS (LogRecord):
  List every GPS position log recorded after <WATERMARK> UTC, across all devices. Return these exact
  columns: DeviceId, DeviceName, DeviceTimeZoneId, Latitude, Longitude, GpsDateTime, Speed. Use UTC
  timezone. Do not aggregate.

Trips:
  List individual trips that ended after <WATERMARK> UTC. Return these exact columns: DeviceId,
  device_name, trip_start_utc, trip_end_utc, distance_km, driving_duration_minutes. Use UTC. Raw rows.

Engine/sensor (StatusData):
  List status data readings recorded after <WATERMARK> UTC. Return these exact columns: DeviceId,
  device_name, diagnostic_name, value, status_datetime_utc. Use UTC timezone. Do not aggregate.

Safety (ExceptionEvent):
  List exception events that occurred after <WATERMARK> UTC. Return these exact columns: DeviceId,
  device_name, rule_name, active_from_utc, active_to_utc, duration_seconds. Use UTC. Raw rows.
```

Adjust column names to your target table; Ace will compute derived fields (it converted miles→km and
produced `driving_duration_minutes` for trips).

## Step 2 — the response is huge; harvest 3 things from it (never read it whole)

Every `GetAceResults` call here returned **110–192 KB** — even a 3-row answer (110 KB), because the
payload is the whole chat object (reasoning, message history, schema context, generated SQL, a preview)
— **the data itself is not inline, it's at the signed URL.** In *this* harness the oversized result is
**spilled to a file** and you get a path. **Treat the blob as data to parse with a tool, never as text
to read into context.** You need exactly **three** things — the **URL** (to load), the **`columns`**
(to reconcile), and the **SQL Ace ran** (to verify before loading — quirks #11/#15):

```bash
F="<path the tool gave you>"

# 1. The signed CSV URL (what you load from):
grep -oE 'https://[^" ]*storage\.googleapis\.com[^" ]*\.csv[^" ]*' "$F" | head -1

# 2. What Ace ACTUALLY named the columns (reconcile vs what you asked):
grep -oE '"columns":\[[^]]*\]' "$F" | head -1

# 3. The SQL Ace actually ran — your pre-load APPROVAL GATE (lint it before any INSERT):
python3 - "$F" <<'PY'
import re, sys
blob = open(sys.argv[1]).read()
# the executed query is a JSON string value under "query"/"validated_query"/"masked_query"
qs = re.findall(r'"(?:query|validated_query|masked_query|sql)":"((?:[^"\\]|\\.)*?SELECT(?:[^"\\]|\\.)*?)"', blob, re.I)
for q in sorted(set(qs), key=len)[-2:]:          # longest match = the real executed query
    print(q.encode().decode('unicode_escape', 'ignore')); print('-'*60)
PY

# Bonus: inline rows for tiny results (≤10); message-group health; elapsed time
grep -oE '"preview_array":\[[^]]*\]' "$F" | head -1
grep -oE '"status":"[A-Z]+"' "$F" | sort | uniq -c
python3 -c "import re; s=open('$F').read(); c=re.search(r'creation_date_unix_milli\":\s*([0-9.]+)',s); t=re.search(r'terminal_date_unix_milli\":\s*([0-9.]+)',s); print('elapsed %.1fs'%((float(t.group(1))-float(c.group(1)))/1000))"
```

Lint the extracted SQL against the checklist in [`QUALITY_AND_REPAIR.md`](QUALITY_AND_REPAIR.md) §2
(wrong source table? injected `IsTracked`/`Speed!=0`/`Local_Date`/`GROUP BY`/unit factor?) **before** you
load — it's free to fix now, expensive after. This is the whole point of Ace returning its SQL (it's a
designed approval surface, not a leak — see the quirk catalog).

> If the Agent/subagent tool is available and the file is enormous, hand the slicing to a subagent so
> the 192 KB never enters your main context. Ask it to return only the URL, the `columns` array, the
> SQL, the row count, and the min/max timestamp.

### What if your client *doesn't* spill to a file?

Spill-to-a-file is **this harness's** way of handling an oversized tool result; another MCP client may
return the whole 110–192 KB **inline**, or **truncate** it. The blob is identical — only your access to
it changes. Rules, in order of preference:

- **Inline and you can run code → offload, then parse.** Write the string to a scratch file (or pipe it
  straight to the `python`/`grep` above) and extract the three fields. **Never let the 150 KB sit in the
  model context** — it's data, not reasoning.
- **Inline, no code execution → scan, don't ingest.** Visually pull just the
  `storage.googleapis.com/…​.csv?…` URL, the `"columns":[…]`, and the `"query":"SELECT …"`. Ignore the
  rest.
- **Truncated (worst case — the tail holding the URL may be cut):** don't trust a partial parse. Fall
  back to:
  1. **Continue-chat for a terse restatement of the SQL.** `new_chat=false` + the `chat_id`:
     *"Reply with only the exact SQL you ran, nothing else."* The follow-up answer is tiny and fits —
     this is the portable way to **get the SQL for verification** when you can't parse the blob. (Asking
     about the *prior* turn's SQL is metadata; it does not re-run or degrade the query.)
  2. **For the URL, prefer the small-result path:** if the result is ≤10 rows, `preview_array` carries
     the rows inline — skip the URL entirely. Otherwise re-issue the pull in a client that can offload.
     **Don't** ask Ace to "give me the URL" as a fresh request — that triggers quirk #8 (degraded
     schema). The URL is a fixed-size string; the blob bloat is reasoning overhead, so shrinking the
     window barely helps.

**The signed URL shape** (don't persist the query string — it's a credential):
```
https://storage.googleapis.com/planet-user-results-prod-eu/<uuid>-000000000000.csv
   ?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=daas-project-ace@…&X-Goog-Date=…
   &X-Goog-Expires=86399&X-Goog-SignedHeaders=host&X-Goog-Signature=<sig>
```
`X-Goog-Expires=86399` ≈ **24h**. Load it into MotherDuck the same session.

## Step 3 — land the URL in bronze, then derive silver

Hand the signed URL to MotherDuck as an **append-only bronze load** (`read_csv_auto('<url>',
all_varchar=true)` + provenance) — never straight into silver. The URL expires in ~24 h and Ace is
non-deterministic, so bronze is your only replayable record. Then compare the `columns` array to your
silver target and **derive**: if it matches, a typed/deduped `INSERT … FROM bronze WHERE event_time >
watermark`; if it differs (renames, dropped/extra cols, case changes), map by position in the derive
or re-ask Ace with tighter wording. See [`MEDALLION_LOADING.md`](MEDALLION_LOADING.md). DuckDB reads the
signed URL directly via the pre-installed `httpfs` extension — no download needed.

## The quirk catalog (with evidence)

> **All quirks below are point-in-time observations, measured 2026-06-29 on `demo_fh4`** (a ~50-vehicle
> demo) via the Geotab MCP. Ace is an evolving product — treat these as "true as of that date," re-verify
> periodically, and update the date when you do. Each dated number is an observation, not a guarantee.

1. **Always-huge response.** 166 KB (157K-row GPS), 192 KB (trips), 110 KB (top-3 aggregation). The
   payload is the whole chat object (reasoning, generated SQL, message history) — not the data.
   → Grep the file; never inline.

2. **A signed CSV URL is always present** — even for the 3-row top-N query. So your loader can always
   rely on the URL path. (`preview_array` is a bonus for small sets.)

3. **`preview_array` = inline rows for ≤10.** Example (top-3 distance):
   `[{"distance_km":2624.65,"vehicle_label":"Demo - 22"}, …]`. Beyond 10 rows, use the URL.

4. **NULLs vanish from the JSON.** A per-day breakdown returned `{"DAY":"2026-06-27"}` with **no**
   `distance_km` key (that day's value was null). Geotab's MCP also documents "missing key = null."
   → Object-parse defensively; in CSV the column is simply empty (DuckDB → NULL).

5. **` UTC` suffix + variable fractional digits.** CSV values look like `2026-06-26 01:42:40.423 UTC`,
   `…23.55 UTC`, `…25.685 UTC`. `read_csv_auto` still infers `TIMESTAMP` (it strips the suffix). If you
   ever force VARCHAR or hand-parse, use `replace(col,' UTC','')::TIMESTAMP` — **not** a fixed
   `strptime` (the fraction width varies).

6. **Second-precision boundary.** Asked for "after 2026-06-26 01:42:40.779"-equivalent; the CSV's min
   was `…40.423` — 4 rows in that second sat at/below our watermark. → **Dedup mandatory.** The
   `WHERE event_time > (SELECT max(event_time) …)` filter skipped exactly those 4.

7. **Inconsistent column honoring.** Honored: `DeviceId,DeviceName,…,Speed`; `vehicle_label`;
   `distance_km`; `trip_start_utc`,`trip_end_utc`,`driving_duration_minutes`. **Not** honored:
   `day` came back as `DAY`. → Trust the `columns` array; alias on the way in if needed.

8. **Don't ask for the artifact.** Prompt "Give me a downloadable signed URL to a CSV of all GPS after
   X" → Ace **ignored the request framing**, returned its **default** schema
   `["DeviceId","UTC_GpsTimestamp","Latitude","Longitude"]` (timestamp column renamed, `DeviceName`/
   `Speed`/`DeviceTimeZoneId` dropped) — which would silently break an append. Ask for **data**.

9. **~33 s floor, size-independent.** Observed: 31.1 s, 32.8 s, 33.6 s, 38.6 s, ~40 s (the 157K-row
   GPS pull). Budget 30–60 s; for a multi-table daily run, expect ~minutes. Don't run Ace calls in
   parallel; the underlying service is rate-limited.

10. **Continue-chat retains context.** `new_chat=false` + the prior `chat_id`: asked "for the number
    one vehicle in that result, break its distance down by day" → Ace correctly filtered
    `DeviceName = 'Demo - 22'` (the #1 from the previous turn). Use this to refine a pull without
    re-stating context. A new `new_chat=true` starts fresh.

11. **Pre-aggregated, active-filtered engine.** Ace **shows the SQL it ran** (see "Ace's SQL is a
    feature" below) — for the distance query it was:
    ```sql
    FROM `VehicleKPI_Daily` t_vehicle
    JOIN `LatestVehicleMetadata` t_meta ON t_vehicle.DeviceId = t_meta.DeviceId
    WHERE t_vehicle.Local_Date BETWEEN '2026-06-26' AND '2026-06-29'   -- inclusive, device-local
      AND t_meta.IsTracked = TRUE                                       -- active devices only
    ```
    So: distances come from a daily rollup (≠ haversine on raw GPS); date ranges are **inclusive** and
    **device-local**; inactive/untracked devices are excluded. For exact GPS replication, ask for raw
    position rows with explicit **UTC** and a precise lower bound (Ace then uses a positions source,
    not the rollup).

12. **It injects unrequested partition-prune predicates.** Even in plain-English mode and even when
    handed exact SQL, Ace tends to add a `DATE(<ts>) >= DATE('…')` / `DATE(<ts>) BETWEEN …` guard it
    wasn't asked for (BigQuery partition pruning). Harmless when it's a *superset* of your range (we saw
    `DATE(GpsDateTime) >= DATE('2026-06-27')` on a `>= 2026-06-28` ask), but it means "Ace ran my query
    verbatim" is rare — **always read the returned SQL and confirm the guard doesn't clip your window.**

13. **It converts units unless you pin them.** Distances/speeds silently flip km↔miles
    (`ROUND(TripDistance_Km * 0.621, 2) AS Distance_Miles`). Say "in kilometers, do not convert units"
    and it keeps `TripDistance_Km`.

14. **It injects activity filters (`Speed != 0`, `Ignition = 1`) on motion-flavored asks.** A naive
    "GPS / trips / activity" request can silently drop stationary points. Say "include stationary points
    (speed 0, ignition off); do not filter on speed, ignition, or motion" to get raw completeness.

15. **Source-table selection varies for the same question — and an explicit SQL doesn't pin it.** This
    is *not* numeric noise on a fixed query. The question "distinct devices with a raw GPS log on
    2026-06-28" returned **49** (from `GpsLogs`) on **three identical plain-English runs** — stable. The
    *same* question with `Run exactly: …FROM GpsLogs` appended returned **47**, answered from the `Trip`
    table (a clean Trip query confirms 47 devices took a trip vs 49 that logged GPS — both correct for
    their table). So a count that differs across runs is almost always a **different `FROM`**, not
    randomness — **read the returned SQL**, pin the table, and don't trust an attached SQL to force the
    source. This source-selection variability is why every fact load is append-to-bronze + dedup and
    every repair prefers re-deriving from bronze over re-asking. *(Re-confirmed 2026-06-29; n=4 — probes
    P4/P5/P6 with exact prompts/SQL/chat_ids in [`EVIDENCE_LOG.md`](EVIDENCE_LOG.md).)*

16. **It is near-real-time for continuous streams (tens of s – ~2 min), not batch.** Measured across
    four tables: `GpsLogs` max `21:37:15` vs now `21:37:34` → **~19 s** (a separate run: ~98 s);
    `StatusData` max `21:34:48.455` — **identical** to the live `DeviceStatusInfo` API's freshest reading.
    Don't treat Ace as "yesterday's data." **But event-driven tables (`Trip`, `FaultData`,
    `ExceptionEvent`) are different:** they only get a row when the event fires, so `max(timestamp)`
    looks old when nothing happened recently (FaultData's newest was 9 h old; trips' newest end was 6 min
    old *but 20 trips ended in the last 15 min*). Gauge those by **counting events in a recent window**,
    not max-vs-now. Top up the last sliver with a small `Get LogRecord` read if you need true real-time —
    [`CHANNELS_AND_FRESHNESS.md`](CHANNELS_AND_FRESHNESS.md).

17. **Pasting SQL into the prompt can trip the gateway.** The only `invalid_value` HTTP 400 rejections
    we saw (`domain: MyGeotab-MCP`) were on SQL-augmented prompts; they were transient (retry succeeded).
    Plain English never failed. Another reason specificity-in-English beats feeding SQL.

18. **Dimension/config writes lag Ace by many minutes; telematics doesn't.** A new `Zone` created via
    the **Get API** (`Add`) was visible instantly through the **Get API** (`Get`) but **took ~15–30 min to
    appear in Ace (`GetAceResults`)** — absent at T0+14 min, present by T0+29 min (Ace's reference/config
    tables sync on a slow periodic cadence).
    Telematics (`GpsLogs`, `StatusData`) lands in seconds. → **For anything you just created/changed
    (zones, device metadata, groups, rules, users) read it from the Get API, not Ace.** See
    [`CHANNELS_AND_FRESHNESS.md`](CHANNELS_AND_FRESHNESS.md).

### Ace's SQL is a feature, not a leak — use it as an approval gate

Ace **deliberately returns the SQL it generated and ran**, so you can examine, approve, and learn from
it. That transparency is the single best quality tool in this skill: reading it *before* loading catches
every Class-A semantic problem (wrong source table, injected filter, unit/timezone, aggregation) while
it's still free to fix. Treat the returned SQL as the contract you're accepting — grep it from the
spilled file (next section) and lint it against the checklist in
[`QUALITY_AND_REPAIR.md`](QUALITY_AND_REPAIR.md) §2.

**Ace's table vocabulary (handy when reading its SQL).** Raw positions: `` `GpsLogs` `` (`DeviceId,
UTC_GpsTimestamp, GpsDateTime, Latitude, Longitude, Speed, Ignition`). Trips: `` `Trip` `` /
`t_trip_details` (`UTC_TripStartTimestamp`, `UTC_TripEndTimestamp`, `TripDistance_Km`, …). Rollup:
`` `VehicleKPI_Daily` `` (pre-aggregated, **avoid for raw**). Metadata/roster: `` `LatestVehicleMetadata` ``
(`Device_ActiveFrom/To`, `IsTracked`, `DeviceTimeZoneId`). Geofences: `` `Zones` ``. Reverse-geocode:
`ReverseGeocoding_Geohash5/8/9`. Seeing `VehicleKPI_Daily`, `Local_Date`, `IsTracked`, `GROUP BY`, or a
unit factor in the SQL is your cue to re-ask for raw rows in UTC.

## Timing & volume benchmarks (observed)

| Query | Rows | MCP payload | CSV size | Ace time | Download |
|-------|------|-------------|----------|----------|----------|
| GPS after watermark (~3.7 days, 26 devices) | 157,419 | 166 KB | 11.8 MB | ~40 s | ~2 s |
| Trips ended in 1-day window | many | 192 KB | — | 33.6 s | — |
| Top-3 devices by distance (agg) | 3 | 110 KB | tiny | 32.8 s | — |
| Ask-for-URL (degraded) | many | 187 KB | — | 38.6 s | — |
| Continue-chat per-day breakdown | 4 | 135 KB | tiny | 31.1 s | — |

Takeaways: **payload size ≠ result size**; **time is ~constant ~33 s**; **download is trivial** (DuckDB
streams it). The cost of a daily run is `~33 s × (number of fact tables)`.

## Small-result fast path (skip the URL)

For ≤10 rows you can parse `preview_array` directly and `INSERT … VALUES`, or just read it for a
lookup. But for warehouse loads, prefer the URL path uniformly — it's always present and handles any
size, so your loader has one code path.

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| No URL / no `chat_id` | Ace not enabled, or transient | Retry once; verify Ace is on (Admin → Beta Features) |
| Degraded/wrong columns | You mentioned url/csv/download, or were vague | Re-ask for **data** with explicit columns |
| `read_csv_auto` 403/expired | URL older than ~24h | Re-run the Ace call to mint a fresh URL |
| Counts disagree with API | Pre-agg + `IsTracked` + local dates (quirk #11) | Expected; for exact replication pull raw rows in UTC |
| Duplicate rows after load | Skipped dedup (quirk #6) | Always `WHERE event_time > watermark` or anti-join |

See also: the JS/Add-In Ace patterns in [`../../geotab/references/ACE_API.md`](../../geotab/references/ACE_API.md)
(polling, `customerData:true`, recursive URL search) — relevant if you call Ace *outside* this MCP tool.
