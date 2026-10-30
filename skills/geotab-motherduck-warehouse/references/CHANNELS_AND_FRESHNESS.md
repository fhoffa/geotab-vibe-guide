# Channels, freshness, and the loading strategy

Which source gives you data *how fresh*, and how to decide between **live reads**, **bulk windows**,
**historical backfill**, and **settling the gaps**. Pipeline-lag numbers were observed on ~50-vehicle Iberia
demo fleets (2026-06-29 on `demo_fh4`; 2026-10-29 on `demo_fh8`) — point-in-time, re-verify on yours.

## Is the bulk channel "only late data"? No — continuous streams lag tens of seconds to ~2 min

Measured **2026-06-29 on `demo_fh4`** across **four entity types**, comparing the bulk channel's
`max(event_time)` to the true current time (cross-checked against the live `Get` API):

| Table | Cadence | Most-recent in bulk channel | "Now" | Real pipeline lag |
|-------|---------|-----------------------------|-------|-------------------|
| `GpsLogs` | continuous | `21:37:15.035` | `21:37:34.366` | **~19 s** (a separate run measured ~98 s) |
| `StatusData` (engine/sensor) | continuous | `21:34:48.455` | ~`21:35` | **sub-minute** — *identical* to the live `DeviceStatusInfo` API's freshest reading |
| `Trip` | event (on trip end) | `21:30:34` | ~`21:36` | **not lag** — 20 trips ended in the last 15 min; latest end is just the last vehicle that parked |
| `FaultData` | event (rare) | `12:07–12:18` | ~`21:34` | **not lag** — no fault has occurred since noon |

Re-measured through the data agent on **2026-10-29 (`demo_fh8`)**: latest `GpsLogs` point `23:40:48` for a
query at ≈`23:41:11` (**≈23 s**) and `23:47:19` for a query at ≈`23:47:35` (**≈16 s**).
`freshness.status` was `fresh` on every telematics call.

**The takeaway: for *continuous* streams (GPS, StatusData) the bulk channel is near-real-time — tens of
seconds to ~2 minutes behind.** It is *not* batch/"yesterday's data." (Don't confuse pipeline lag with
**load staleness**: a warehouse last refreshed 1.3 h ago is 1.3 h stale because *you* haven't re-run the
load. Measure the two separately.)

> **Don't measure freshness of event-driven tables with `max(timestamp)` vs now (Q10).** Trips, faults, and
> exceptions only get a row *when the event happens*, so a "stale" max just means nothing happened
> recently. `FaultData`'s newest row was 9 h old — yet that's correct, not lagged. To gauge those, count
> **events in a recent window** (e.g. "20 trips ended in the last 15 min" → the pipeline is current);
> reserve max-vs-now for the continuous streams.

> **Don't use the agent as a freshness/watermark oracle (Q11).** Its window bounds are LLM-generated and
> have been seen to vary: on 2026-06-30 an identical "most recent raw status" ask returned the true live
> max on 4 of 6 calls and a `<yesterday> 23:59:59.xxx` artifact on 2 of 6 (the injected upper bound landed
> on `CURRENT_DATE()` instead of `CURRENT_DATETIME()`); three "…and now" windows on 2026-10-29 were all
> bounded by `CURRENT_TIMESTAMP()`. A `…23:59:59.xxx` "latest" is the fingerprint of a clipped window. For a
> true latest reading use **`Get DeviceStatusInfo`** (or a bounded `Get LogRecord`); the warehouse takes its
> watermark from `max(silver)`, never from the agent.

| Channel | Tool | Freshness (observed) | Shape | Best for |
|---------|------|----------------------|-------|----------|
| **Live snapshot** | `Get DeviceStatusInfo` | **~sub-second** (current position/speed/ignition per device) | JSON, one row per device | live map, "where is everything right now" |
| **Raw event read** | `Get LogRecord` (+ window) | **to ~now** (full-resolution raw rows) | JSON, cursor-paginated | a specific device/window, gap-filling, an independent oracle |
| **Bulk export** | `AskDataAgent` → CSV URL | **tens of s – ~2 min** (continuous streams) | signed CSV, whole window in one file | warehouse bulk: daily incremental + historical backfill |

So all three are effectively current; they differ in **shape and volume**, not in being "live vs late."
`DeviceStatusInfo` is a *snapshot* (it has no history — don't historize it). `Get LogRecord` is full
history but **paginates** (cursor for reference entities; window-splitting for time-series — see
[`ENTITY_CATALOG.md`](ENTITY_CATALOG.md)), so it's painful for bulk. The data agent streams an entire window
to one CSV, which is why it's the bulk workhorse despite the generated-SQL variability.

## Write→agent propagation: changes may lag behind reads (Q12)

Read-freshness (above) is one axis; **how fast a *change* becomes visible** is another — and for
**dimension/config data they differ.** Measured 2026-06-29 on the bulk channel: a new geofence (`Zone`
"ZZ_PROBE_ALPHA") created via the **Get API** write (`mcp__MyGeotab_MCP__Add`) at `21:41:04` was visible
**instantly** through `Get` (the write is synchronous), but the bulk channel reported 0 zones at every poll up
to T0+14 min and first returned the zone at T0+~29 min — its dimension/config tables sync on a slow periodic
cadence (**between 14 and 29 minutes**), while telematics streams land in seconds. The data agent's own
propagation delay was **not re-measured** — assume the same until you test it (probe P8).

> **Engineering consequence:** for anything you **just created or changed** in MyGeotab — zones, device
> metadata, groups, rules, users — **read it from `Get`.** `Get` is authoritative and immediate. This is a
> second, stronger reason for the "dimensions via `Get`" rule (the first being exactness / `IsTracked`). Use
> the agent for *telematics volume*, `Get` for *current truth*.

## The four loading modes — pick by question, not by habit

```
                      how much?  →   one row / device        a window of rows         all of history
   how fresh? ↓
   "right now"                       Get DeviceStatusInfo     Get LogRecord (small win) —
   "last few min … today"            Get LogRecord            Agent window (4-call loop) —
   "settled past"                    —                        Agent window + anti-join   Agent windowed backfill
```

1. **Live (sub-second): `Get DeviceStatusInfo`.** Current position/speed/ignition for the whole fleet
   in one fast call. Serve it straight to a live map/dashboard. **Don't write it to silver** — it's a
   snapshot, not an event stream; persisting it creates a fake "history" full of duplicated current
   points. If you want the live tail *in* the warehouse, read raw `Get LogRecord` for the last few
   minutes instead.
2. **Recent bulk / daily incremental: a data-agent window** (the 4-call loop in [`SKILL.md`](../SKILL.md)).
   Seconds to ~2 min behind, one CSV, cheap. This is steady-state warehouse loading. Because the generated
   SQL can vary, it lands in **append-only bronze** and silver dedups — see
   [`MEDALLION_LOADING.md`](MEDALLION_LOADING.md).
3. **Historical / past: windowed backfill.** Walk backwards in bounded windows (a day each; half a day for
   StatusData), append each to bronze, derive silver with the anti-join. Runbook:
   [`INCREMENTAL_BACKFILL.md`](INCREMENTAL_BACKFILL.md) §Historical backfill.
4. **Settle the missing data (make it whole):** detect holes (per-device time gaps, thin/empty
   `(device, day)` cells, calendar holes — [`INCREMENTAL_BACKFILL.md`](INCREMENTAL_BACKFILL.md)
   §Gap detection), then re-pull **only** each missing window and anti-join it in. Repeat until gap
   detection comes back clean. This is the convergence loop that turns "mostly mirrored" into
   "provably complete."

### Combining live + bulk for a complete *and* fresh mirror

The bulk channel lags tens of seconds to ~2 min, so the newest sliver of time is always missing from a
pure-agent warehouse. If you need both completeness and true real-time, layer them: **the agent for the
bulk/settled body**, and a small **`Get LogRecord` read for the last few minutes**. Land both in bronze and
let the natural-key dedup merge them — the overlap collapses on the natural key.

## The active-only trap (why a warehouse can undercount the fleet) — Q1

The original `planet_gps_pings` was built from a pull that defaulted to `IsTracked = TRUE`. Result: silver
held **~25–26 devices**, but the fleet has **50**. A GPS pull for 2026-06-28 that explicitly said *"do not
restrict to active/tracked devices"* returned **47–49 distinct devices**, vs **25** in the active-filtered
silver. On 2026-10-29/30 the same default returned **0 vehicles** on two demo fleets whose devices are all
`IsTracked = false`. **Lesson:** the agent's default population is *tracked/active only*. If you want the
whole fleet, say so explicitly (and verify device count against `dim_device` from `Get`, which is the exact
roster). This is a coverage bug that no amount of dedup fixes — it's upstream of the load. See the prompting
rules in [`DATA_AGENT_TO_CSV.md`](DATA_AGENT_TO_CSV.md).

## `GetCountOf` (Get API) is not a windowed oracle for facts

> This is a **Get API** quirk — the classic `mcp__MyGeotab_MCP__GetCountOf` method — not a data-agent behavior.

`GetCountOf` ignores the `fromDate`/`toDate`/`deviceSearch` in the search for high-volume entities:
two different `LogRecord` windows for one device both returned **16,098,152** (the whole table), and a
`Trip` window returned **1,388,687** (all trips). So `GetCountOf` answers "how many of this type exist
in total," **not** "how many in my window." Use it only for **dimensions** (`GetCountOf Device = 50`
reconciles exactly with `dim_device`). For fact reconciliation, count rows from a bounded `Get`
read of the same window, or cross-check the agent against the warehouse — never against `GetCountOf`.

## Same question, different *source table* — read the SQL (Q3)

The agent's variability is **source-table selection, not numeric noise on a pinned query.** Observed
2026-06-29: *"how many distinct devices produced a raw GPS log on 2026-06-28 (no tracked filter)?"* asked four
times.

- **Three identical plain-English runs → `49` every time, from `GpsLogs`.** A pinned prompt can be **stable**.
- **A fourth run — the *same* English question with `Run exactly: SELECT COUNT(DISTINCT DeviceId) … FROM
  GpsLogs …` appended — returned `47`, answered from the `Trip` table.** The agent picked a *different
  source* and **ignored the GpsLogs SQL we supplied.** A clean Trip query confirms **47** devices took a trip
  that day, vs **49** that logged GPS — *both numbers are correct for their table.*

So "49 vs 47" was **two different sources answering one question**, not a count that drifts. And on
2026-10-29 "engine status data readings" was answered from the `Diagnostic` catalog instead of `StatusData`.
The consequences: **read the returned SQL every time** (a differing count across runs is almost always a
different `FROM` or filter, diagnosable — not noise), **name the table** in the prompt, and don't assume an
attached SQL forces the source. This variability is *why* a full re-ask can replace good data with a
differently-shaped answer — so every fact load is append-to-bronze + dedup, every backfill is anti-join, and
every repair prefers re-deriving from bronze over re-asking.

## Relationship to the official MyGeotab API Adapter (and the `GetFeed` gap)

Geotab publishes an official, production-grade mirror-builder: the
[MyGeotab API Adapter](https://github.com/Geotab/mygeotab-api-adapter) — a self-hosted .NET service
that continuously replicates a MyGeotab database into SQL Server/PostgreSQL. It's the right tool for
**24/7, sub-minute-freshness mirrors with real infrastructure**; this skill is the **zero-infra,
MCP-only, agent-cadence** analog. Human-facing comparison:
[`guides/MCP_TO_MOTHERDUCK_VS_GETFEED_API_ADAPTER.md`](../../../guides/MCP_TO_MOTHERDUCK_VS_GETFEED_API_ADAPTER.md).

**Why this skill doesn't use `GetFeed`.** The adapter's incremental engine is the official
[`GetFeed`](https://developers.geotab.com/myGeotab/apiReference/methods/GetFeed/) API: an exact
version-token cursor per entity — no time-boundary math, no boundary dupes, resumable after restart.
**The Geotab MCP server does not expose it** (verified 2026-07-02, three ways, and the current MyGeotab MCP tool list still has no feed tool on 2026-10-30: the tool list has no
feed tool; the `Get` tool's schema has no `fromVersion`/feed-token parameter and there's no generic
method passthrough; the server's sole resource is `mygeotab://entities`). Watermarks + natural-key
dedup are the MCP-compatible substitute — and the bronze layer is what makes the substitute safe
(every pull is kept raw and replayable). If the MCP ever grows a `GetFeed` tool, adopt it as the
**watermark replacement only** — bronze/silver and the dedup discipline stay exactly as they are
(generated-SQL variability, not watermarking, is why they exist).

One `GetFeed` behavior worth borrowing even without the API: the adapter treats a **full feed page as
"I'm behind — poll again immediately"** and a partial page as "current — wait for the next interval."
The same signal applies to this skill's `Get` **pagination** (a page hitting `resultsLimit` means more
pages). It does **not** transfer to time-chunked agent walks — a sparse window can end early while later
windows still hold data, so those stop only when the window cursor reaches the target — see
[`INCREMENTAL_BACKFILL.md`](INCREMENTAL_BACKFILL.md) §A.
