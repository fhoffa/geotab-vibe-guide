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
- **NEVER say "url", "csv", "download", "link", or "export."** Asking for the artifact makes Ace drop
  your column spec and return a degraded default schema (quirk #8). You get a URL regardless.

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

## Step 2 — the response is huge; harvest it from the spilled file

Every `GetAceResults` call here returned **110–192 KB** — even a 3-row answer (110 KB). It exceeds the
tool's token cap and the harness **saves it to a file** and returns the path. **Do not try to read it
inline.** Pull exactly what you need:

```bash
F="<path the tool gave you>"

# The signed CSV URL (this is all you usually need):
grep -oE 'https://[^" ]*storage\.googleapis\.com[^" ]*\.csv[^" ]*' "$F" | head -1

# What Ace ACTUALLY named the columns (reconcile against what you asked for):
grep -oE '"columns":\[[^]]*\]' "$F" | head -1

# Inline rows for small results (≤10):
grep -oE '"preview_array":\[[^]]*\]' "$F" | head -1

# Sanity: every message group should be DONE
grep -oE '"status":"[A-Z]+"' "$F" | sort | uniq -c

# How long Ace took (creation → terminal):
python3 -c "import re,sys; s=open('$F').read(); \
c=re.search(r'creation_date_unix_milli\":\s*([0-9.]+)',s); t=re.search(r'terminal_date_unix_milli\":\s*([0-9.]+)',s); \
print('elapsed %.1fs'%((float(t.group(1))-float(c.group(1)))/1000))"
```

> If the Agent/subagent tool is available and the file is enormous, hand the slicing to a subagent so
> the 192 KB never enters your main context. Ask it to return only the URL, the `columns` array, the
> row count, and the min/max timestamp.

**The signed URL shape** (don't persist the query string — it's a credential):
```
https://storage.googleapis.com/planet-user-results-prod-eu/<uuid>-000000000000.csv
   ?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=daas-project-ace@…&X-Goog-Date=…
   &X-Goog-Expires=86399&X-Goog-SignedHeaders=host&X-Goog-Signature=<sig>
```
`X-Goog-Expires=86399` ≈ **24h**. Load it into MotherDuck the same session.

## Step 3 — reconcile columns, then hand the URL to MotherDuck

Compare the `columns` array to your target table. **If it matches** → straight `INSERT … SELECT FROM
read_csv_auto('<url>') WHERE event_time > watermark`. **If it differs** (renames, dropped/extra cols,
case changes) → either transform in the `SELECT` (alias by position) or re-ask Ace with tighter
wording. See [`MEDALLION_LOADING.md`](MEDALLION_LOADING.md). DuckDB reads the signed URL directly via
the pre-installed `httpfs` extension — no download needed.

## The quirk catalog (with evidence)

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

11. **Pre-aggregated, active-filtered engine.** Leaked SQL for the distance query:
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
