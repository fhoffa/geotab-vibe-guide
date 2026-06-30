# Channels, freshness, and the loading strategy

Which source gives you data *how fresh*, and how to decide between **live reads**, **bulk windows**,
**historical backfill**, and **settling the gaps**. All numbers observed live on `demo_fh4`
(2026-06-29, ~50-vehicle Iberia demo fleet).

## Is Ace "only late data"? No — continuous streams lag tens of seconds to ~2 min

Measured **2026-06-29 on `demo_fh4`** across **four entity types** (point-in-time — re-verify and
update the date), comparing Ace's `max(event_time)` to the true current time (Ace's own
`CURRENT_TIMESTAMP`, cross-checked against the live `Get` API):

| Ace table | Cadence | Most-recent in Ace | "Now" | Real pipeline lag |
|-----------|---------|--------------------|-------|-------------------|
| `GpsLogs` | continuous | `21:37:15.035` | `21:37:34.366` | **~19 s** (a separate run measured ~98 s) |
| `StatusData` (engine/sensor) | continuous | `21:34:48.455` | ~`21:35` | **sub-minute** — *identical* to the live `DeviceStatusInfo` API's freshest reading |
| `Trip` | event (on trip end) | `21:30:34` | ~`21:36` | **not lag** — 20 trips ended in the last 15 min; latest end is just the last vehicle that parked |
| `FaultData` | event (rare) | `12:07–12:18` | ~`21:34` | **not lag** — no fault has occurred since noon |

**The takeaway, refined: for *continuous* streams (GPS, StatusData) Ace is near-real-time — tens of
seconds to ~2 minutes behind.** It is *not* batch/"yesterday's data." (Don't confuse Ace's lag with
**load staleness**: a warehouse last refreshed 1.3 h ago is 1.3 h stale because *you* haven't re-run the
load, not because Ace is slow. Measure the two separately.)

> **Don't measure freshness of event-driven tables with `max(timestamp)` vs now.** Trips, faults, and
> exceptions only get a row *when the event happens*, so a "stale" max just means nothing happened
> recently. `FaultData`'s newest row was 9 h old — yet that's correct, not lagged. To gauge those, count
> **events in a recent window** (e.g. "20 trips ended in the last 15 min" → the pipeline is current);
> reserve max-vs-now for the continuous streams.

| Channel | Tool | Freshness (observed) | Shape | Best for |
|---------|------|----------------------|-------|----------|
| **Live snapshot** | `Get DeviceStatusInfo` | **~sub-second** (current position/speed/ignition per device) | JSON, one row per device | live map, "where is everything right now" |
| **Raw event read** | `Get LogRecord` (+ window) | **to ~now** (full-resolution raw rows; b3 to `20:40+` at `~20:48`) | JSON, cursor-paginated | a specific device/window, gap-filling, an independent oracle |
| **Bulk export** | `GetAceResults` → CSV URL | **tens of s – ~2 min** (continuous streams) | signed CSV, whole window in one file | warehouse bulk: daily incremental + historical backfill |

So all three are effectively current; they differ in **shape and volume**, not in being "live vs late."
`DeviceStatusInfo` is a *snapshot* (it has no history — don't historize it). `Get LogRecord` is full
history but **paginates** (cursor for reference entities; window-splitting for time-series — see
[`ENTITY_CATALOG.md`](ENTITY_CATALOG.md)), so it's painful for bulk. Ace streams an entire window to
one CSV, which is why it's the bulk workhorse despite the sub-2-min lag and non-determinism.

## Write→Ace propagation: changes lag *far* behind reads

Read-freshness (above) is one axis; **how fast a *change* reaches Ace** is another — and for
**dimension/config data they are wildly different.** Measured 2026-06-29: created a new geofence
(`Zone` "ZZ_ACE_PROBE_ALPHA") via the **Get API** write (`mcp__Geotab_MCP__Add`) at `21:41:04`. It was
visible **instantly** through the **Get API** (`Get` — the write is synchronous), but **Ace**
(`GetAceResults`) **lagged ~15–30 min**: it reported 0 zones at every poll up to T0+14 min (`21:55`) and
first returned the zone at T0+~29 min (`22:09`). So **Ace's** dimension/config tables sync on a slow,
periodic cadence (here **between 14 and 29 minutes**), while telematics streams (`GpsLogs`,
`StatusData`) land in seconds.

> **Engineering consequence:** for anything you **just created or changed** in MyGeotab — zones, device
> metadata, groups, rules, users — **read it from `Get`, never Ace.** `Get` is authoritative and
> immediate; Ace will show stale reference data for many minutes. This is a second, stronger reason for
> the "dimensions via `Get`" rule (the first being exactness/`IsTracked`). Use Ace for *telematics
> volume*, `Get` for *current truth*. (Telematics history in Ace is fine — that pipeline is near-real-time;
> it's the reference/config tables that lag.)

## The four loading modes — pick by question, not by habit

```
                      how much?  →   one row / device        a window of rows         all of history
   how fresh? ↓
   "right now"                       Get DeviceStatusInfo     Get LogRecord (small win) —
   "last few min … today"            Get LogRecord            Ace window (4-call loop)  —
   "settled past"                    —                        Ace window + anti-join     Ace windowed backfill
```

1. **Live (sub-second): `Get DeviceStatusInfo`.** Current position/speed/ignition for the whole fleet
   in one fast call. Serve it straight to a live map/dashboard. **Don't write it to silver** — it's a
   snapshot, not an event stream; persisting it creates a fake "history" full of duplicated current
   points. If you want the live tail *in* the warehouse, read raw `Get LogRecord` for the last few
   minutes instead.
2. **Recent bulk / daily incremental: Ace large window** (the 4-call loop in [`SKILL.md`](../SKILL.md)).
   ~1–2 min behind, one CSV, cheap. This is steady-state warehouse loading. Because Ace is
   non-deterministic, it lands in **append-only bronze** and silver dedups — see
   [`MEDALLION_LOADING.md`](MEDALLION_LOADING.md).
3. **Historical / past: Ace windowed backfill.** Walk backwards in bounded windows (a day each),
   append each to bronze, derive silver with the anti-join. Runbook:
   [`INCREMENTAL_BACKFILL.md`](INCREMENTAL_BACKFILL.md) §Historical backfill.
4. **Settle the missing data (make it whole):** detect holes (per-device time gaps, thin/empty
   `(device, day)` cells, calendar holes — [`INCREMENTAL_BACKFILL.md`](INCREMENTAL_BACKFILL.md)
   §Gap detection), then re-pull **only** each missing window and anti-join it in. Repeat until gap
   detection comes back clean. This is the convergence loop that turns "mostly mirrored" into
   "provably complete."

### Combining live + bulk for a complete *and* fresh mirror

Ace lags ~1–2 min, so the newest sliver of time is always missing from a pure-Ace warehouse. If you
need both completeness and true real-time, layer them: **Ace for the bulk/settled body**, and a small
**`Get LogRecord` read for the last few minutes** (the tail Ace hasn't caught up to). Land both in
bronze and let the natural-key dedup merge them — the boundary overlap collapses exactly like the Ace
boundary-second dupes do.

## The active-only trap (why the warehouse undercounted the fleet)

The original `planet_gps_pings` was built from an Ace pull that defaulted to `IsTracked = TRUE`. Result:
silver held **~25–26 devices**, but the fleet has **50**. Measured: a GPS pull for 2026-06-28 that
explicitly said *"do not restrict to active/tracked devices"* returned **47–49 distinct devices**, vs
**25** in the active-filtered silver. **Lesson:** Ace's default population is *tracked/active only*. If
you want the whole fleet, say so explicitly (and verify device count against `dim_device` from `Get`,
which is the exact roster). This is a coverage bug that no amount of dedup fixes — it's upstream of the
load. See the prompting rules in [`ACE_TO_CSV.md`](ACE_TO_CSV.md).

## `GetCountOf` (Get API, **not** Ace) is not a windowed oracle for facts

> This is a **Get API** quirk — the classic `mcp__Geotab_MCP__GetCountOf` method — **not** an
> Ace/`GetAceResults` behavior. (Ace's own count caveat — source-table *selection* — is two sections down.)

`GetCountOf` ignores the `fromDate`/`toDate`/`deviceSearch` in the search for high-volume entities:
two different `LogRecord` windows for one device both returned **16,098,152** (the whole table), and a
`Trip` window returned **1,388,687** (all trips). So `GetCountOf` answers "how many of this type exist
in total," **not** "how many in my window." Use it only for **dimensions** (`GetCountOf Device = 50`
reconciles exactly with `dim_device`). For fact reconciliation, count rows from a bounded `Get`
read of the same window, or cross-check Ace against the warehouse — never against `GetCountOf`.

## Same question, different *source table* — read the SQL (2026-06-29)

Ace's variability is **source-table selection, not numeric noise on a pinned query.** Measured: the
question *"how many distinct devices produced a raw GPS log on 2026-06-28 (no tracked filter)?"* was
asked four times.

- **Three identical plain-English runs → `49` every time, from `GpsLogs`.** A pinned prompt is **stable**,
  not random.
- **A fourth run — the *same* English question but with `Run exactly: SELECT COUNT(DISTINCT DeviceId) …
  FROM GpsLogs …` appended — returned `47`, answered from the `Trip` table.** Ace picked a *different
  source* and **ignored the GpsLogs SQL we supplied.** A clean Trip query confirms **47** devices took a
  trip that day, vs **49** that logged GPS — *both numbers are correct for their table.*

So the "49 vs 47" was **two different sources answering one question**, not a count that drifts. The
engineering consequences are the same and still hold: **read the returned SQL every time** (a differing
count across runs is almost always a different `FROM`, diagnosable — not noise), **pin the table** in the
prompt, and don't assume an attached SQL forces the source. This source-selection variability is *why* a
full re-ask can replace good data with a differently-shaped answer — so every fact load is
append-to-bronze + dedup, every backfill is anti-join, and every repair prefers re-deriving from bronze
over re-asking Ace.
