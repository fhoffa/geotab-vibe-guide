# Channels, freshness, and the loading strategy

Which source gives you data *how fresh*, and how to decide between **live reads**, **bulk windows**,
**historical backfill**, and **settling the gaps**. All numbers observed live on `demo_fh4`
(2026-06-29, ~50-vehicle Iberia demo fleet).

## Is Ace "only late data"? No — it lags ~1–2 minutes

Measured directly: an Ace GPS pull whose signed URL was minted at **20:49:54 UTC** returned data with
`max(UTC_GpsTimestamp) = 20:48:16` → **~98 s behind real time.** Ace is *near*-real-time, not a
batch-only/hours-late source. (The skill's earlier "1.3 h freshness" was **load staleness** — the
warehouse simply hadn't been refreshed in 1.3 h — *not* Ace's intrinsic lag. Don't conflate the two.)

| Channel | Tool | Freshness (observed) | Shape | Best for |
|---------|------|----------------------|-------|----------|
| **Live snapshot** | `Get DeviceStatusInfo` | **~sub-second** (current position/speed/ignition per device) | JSON, one row per device | live map, "where is everything right now" |
| **Raw event read** | `Get LogRecord` (+ window) | **to ~now** (full-resolution raw rows; b3 to `20:40+` at `~20:48`) | JSON, cursor-paginated | a specific device/window, gap-filling, an independent oracle |
| **Bulk export** | `GetAceResults` → CSV URL | **~1–2 min behind** | signed CSV, whole window in one file | warehouse bulk: daily incremental + historical backfill |

So all three are effectively current; they differ in **shape and volume**, not in being "live vs late."
`DeviceStatusInfo` is a *snapshot* (it has no history — don't historize it). `Get LogRecord` is full
history but **paginates** (cursor for reference entities; window-splitting for time-series — see
[`ENTITY_CATALOG.md`](ENTITY_CATALOG.md)), so it's painful for bulk. Ace streams an entire window to
one CSV, which is why it's the bulk workhorse despite the ~2-min lag and non-determinism.

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

## `GetCountOf` is **not** a windowed oracle for facts

`GetCountOf` ignores the `fromDate`/`toDate`/`deviceSearch` in the search for high-volume entities:
two different `LogRecord` windows for one device both returned **16,098,152** (the whole table), and a
`Trip` window returned **1,388,687** (all trips). So `GetCountOf` answers "how many of this type exist
in total," **not** "how many in my window." Use it only for **dimensions** (`GetCountOf Device = 50`
reconciles exactly with `dim_device`). For fact reconciliation, count rows from a bounded `Get`
read of the same window, or cross-check Ace against the warehouse — never against `GetCountOf`.

## Non-determinism is real even for settled days

The same logical query — `COUNT(DISTINCT DeviceId)` over a *fixed, past* UTC day — returned **49** one
run and **47** the next. Over a settled window that should be constant. This is why every fact load is
append-to-bronze + dedup, every backfill is anti-join, and every repair prefers re-deriving from bronze
over re-asking Ace. Treat Ace counts as ~±a few %, not exact.
