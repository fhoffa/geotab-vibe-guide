# Cost & sizing: what this warehouse actually costs to run

What's free, what scales, and roughly what a small vs. very large Geotab fleet should expect to pay.
Storage numbers are **measured live** on the demo warehouse; rates are MotherDuck's published prices
(us-east-1, June 2026 — always re-check [the pricing page](https://motherduck.com/docs/about-motherduck/billing/pricing/),
and add ~9% for the EU regions).

## The two bills are separate — and one of them is already paid

| Layer | Who charges | This use case |
|-------|-------------|---------------|
| **Geotab Ace + MCP + the Get/Ace API** | Geotab | **Included in the Geotab Go plan** — the bulk Ace pulls and `Get` calls add no incremental Geotab cost. |
| **MotherDuck warehouse** (storage + compute) | MotherDuck | The only new spend. Modeled below. |

So the question is purely "what does the MotherDuck side cost," and for most fleets the answer is
**very little** — storage is $0.04/GB and DuckDB compresses GPS hard.

## MotherDuck plans (self-serve)

| | **Lite (free tier)** | **Business** |
|--|----------------------|--------------|
| Platform fee | **$0/mo** | **$250/mo** |
| Storage included | **10 GB** then $0.04/GB | pay-as-you-go $0.04/GB |
| Compute included | **10 Compute-Unit-hours/mo** on Pulse, then $0.60/CU-hr | pay-as-you-go |
| Duckling sizes | Pulse only | Pulse → Giga ($0.60 → $36/hr) |
| Users | 3 users / 2 service accounts | 10 users / unlimited SAs |

A warehouse pipeline needs **one service account**, so Lite's limits are fine for a small mirror. You
move to Business when you blow past 10 GB of storage, need bigger Ducklings for heavy analytics, or want
the 99.9% SLA / point-in-time restore.

## Measured storage (the anchor — not guessed)

`PRAGMA database_size` on the live demo warehouse (`my_db`), **measured 2026-06-29**: **35.2 MiB**
total, holding **679,577**
unique GPS pings — kept **twice** (append-only `bronze_gps_raw` as `all_varchar` + typed
`planet_gps_pings`) — plus trips, exceptions, and dimensions. The source CSV was 11.8 MB for 157,419
rows (~75 B/row); DuckDB compresses the typed silver to roughly a quarter of that. Derived rates:

| What you store | Bytes per GPS ping | Per vehicle-year¹ |
|----------------|--------------------|-------------------|
| **Silver only** (raw pruned — see below) | ~16 B | **~10 MB ≈ 0.01 GB** |
| **Bronze + silver** (keep full raw, the default) | ~54 B | **~33 MB ≈ 0.033 GB** |

¹ Assuming **~1,700 GPS pings / vehicle / day** — the observed rate for *active* demo vehicles
(`b3` logged 1,756 on 2026-06-28; fleet averages 157,419 ÷ 26 ÷ 3.7 ≈ 1,636 and, on the Vegas fleet,
2,432,798 ÷ 50 ÷ 29 ≈ 1,678). Parked/idle vehicles or a different cadence scale this down; **cost is
linear in ping rate.** The above is **GPS-only (a minimal mirror)** — trips + exceptions add <15%.

### …but an operational mirror is ~10× bigger — StatusData dominates

Measured **2026-06-29 on `geotab_Demo_fh_vegas4`** (50 vehicles, ~1 month, full operational mirror):
`PRAGMA database_size` = **1.7 GiB** for **~51 M rows kept** (bronze + silver) — ~36 B/row average. The
breakdown is the point:

| Fact | silver rows | ≈ rows / veh / day | share of the warehouse |
|------|-------------|--------------------|------------------------|
| **`status_data`** (engine/sensor) | **23,152,677** | **~16,000** | **~90%** |
| GPS | 2,432,798 | ~1,700 | ~9% |
| trips | 60,334 | ~42 | <1% |
| exception_events | 19,295 | ~14 | <1% |

**`StatusData` is ~10× GPS** and swamps everything else. So:

| Mirror | ≈ per vehicle-year (bronze+silver) |
|--------|-----------------------------------|
| **Minimal** (GPS + dims) | ~0.033 GB |
| **Operational** (GPS + trips + exceptions + **StatusData**) | **~0.4 GB** (1.7 GiB ÷ 50 veh ÷ ~1 mo × 12) |

Caveats: StatusData volume swings hugely with how many diagnostics a device reports — re-measure for your
fleet. And that 1.7 GiB includes some `historical_bytes` retention churn from a messy multi-attempt load
(the migrated demo similarly drifted 35 → 57 MiB after its CTAS reorg) — steady-state is somewhat lower.
If you don't need engine/sensor data, **skip `status_data`** and you're back to the ~0.033 GB/veh-yr row.

## How much fits in the free 10 GB?

| Mirror / keeping | 10 GB holds | In practice |
|------------------|-------------|-------------|
| **Minimal** (GPS), silver only | **~1,000 vehicle-years** | 50 vehicles for ~20 yrs · 500 for ~2 yrs |
| **Minimal** (GPS), bronze + silver | **~300 vehicle-years** | 50 vehicles for ~6 yrs · ~300 for ~1 yr |
| **Operational** (incl. StatusData), bronze + silver | **~25 vehicle-years** | 50 vehicles for ~6 **months** · 25 for ~1 yr |

**A small GPS-only mirror lives in the free tier for years; an *operational* mirror (with StatusData)
fills 10 GB in months** even for a small fleet (the Vegas one-month operational mirror was already
1.7 GiB). For operational mirrors, plan on Business storage early, prune stable raw, or skip StatusData.

## Compute: how cheap a refresh is, and how often you can run it free

Pulse (the only Lite Duckling) is metered **per query, minimum 1 CU-second each**, and on Pulse
1 CU-second ≈ 1 second of query time. The free tier includes **10 CU-hours/month = 36,000 CU-seconds**.

> **Do you pay only for query time, or for idle keep-warm?** On **Pulse: query time only.** Pulse has
> **no cooldown** — you're billed for execution (min 1 CU-sec/query) and nothing while idle, which is
> exactly right for a bursty/periodic warehouse refresh. The "keep it warm and bill the idle" behavior
> applies **only to the non-Pulse Ducklings** (Standard/Jumbo/Mega/Giga on Business), whose pricing
> examples literally add `+ 60s cooldown` (default 1–10 min, configurable up to 24 h) to each session's
> bill. So the free tier never charges you for sitting idle between updates — the 10 CU-hr math below is
> pure execution and is, if anything, conservative.

Measured the actual per-query cost with `EXPLAIN ANALYZE` on the live demo warehouse (server-side time,
**2026-06-29**; re-measure as data volume grows):

| Query in the loop | What it does | Measured time → billed CU-sec |
|-------------------|--------------|-------------------------------|
| `SELECT max(event_time)` (watermark) | scans 680 K-row silver | 0.08 s → **1** (floor) |
| `read_csv_auto(url)` count / probe | HTTP fetch + parse a daily CSV | 1.47 s (≈1.5 s fetch floor, 1 HEAD+1 GET; parse grows with rows) → **~1.5** |
| bronze `INSERT … read_csv_auto` | fetch + land raw, append-only | ~1.5–3 s → **~2–3** |
| silver derive (`DISTINCT ON` over all bronze) | type+dedup 680 K rows | 1.07 s → **~1** |

So **one fact table ≈ 4 queries ≈ ~5 CU-seconds**, and a **full 4-table update cycle ≈ ~25–30
CU-seconds** (incl. logging/verify). Against 36,000 CU-sec/month that is:

> **~1,200 full update cycles per month on the free tier — roughly every ~35 minutes, around the clock,
> for $0.** Even tripling the estimate for safety leaves ~400/month (~every 2 hours).

**Compute is not the free-tier constraint — storage (10 GB) and Ace's wall-clock are.** The Ace pull
itself is ~33 s/call (× number of tables), but that runs on Geotab's side, is included in the Go plan,
and is **not** metered by MotherDuck — it only bounds how *fast* a cycle finishes (~2–3 min for 4
tables), not what it costs. So **small fleets effectively run for $0**, and you can refresh as often as
every ~15–30 min without leaving the free tier.

**Caveats:** compute scales with data volume — a large fleet's daily CSV is bigger to parse, and the
silver derive rescans all of bronze each cycle (~1 s at 680 K rows, more as bronze grows; switch to an
incremental/clustered derive for very large bronze). One-time **backfill** is heavier (many windows ×
CSV fetches) but bounded. And **query-history observability is Business-only** — on Lite,
`MD_INFORMATION_SCHEMA.QUERY_HISTORY` errors with "not available on your plan," so meter compute with
`EXPLAIN ANALYZE` as done here.

For small fleets, this all stays inside the 10 CU-hr free allotment, so **the bill is $0.**

## What a large / very large customer should expect

Steady state, retaining **1 year** of history, **keeping full raw** (bronze+silver), us-east-1. Storage
is the only fleet-linear cost; the Business platform fee and analytics compute dominate the total. Two
storage columns: **minimal** (GPS, ~0.033 GB/veh-yr) vs **operational** (incl. StatusData, ~0.4 GB/veh-yr
— ~12×, measured on Vegas).

| Fleet | Storage @ 1 yr — minimal (GPS) | Storage @ 1 yr — **operational (StatusData)** | Storage $/mo (min → op) | + Platform | + Compute² | **≈ Total/mo (min → op)** |
|-------|------|------|------|------|------|------|
| Small — 50 | 1.7 GB (free) | **20 GB** | $0 → $0.80 | $0 Lite / $250 Biz³ | ~$0–10 | **$0 → ~$260** |
| Medium — 500 | 16.5 GB | **200 GB** | $0.66 → $8 | $250 | ~$10–40 | **~$260 → ~$300** |
| Large — 5,000 | 165 GB | **2 TB** | $6.60 → $80 | $250 | ~$40–200 | **~$300 → ~$530** |
| Very large — 50,000 | 1.65 TB | **20 TB** | $66 → **$800** | $250 | ~$200–800 | **~$520 → ~$1,850** |

² **Compute is usage-driven, not fleet-linear.** *Ingestion* is cheap — DuckDB loads millions of
rows/sec, so even 85 M pings/day is minutes of Duckling time. The variable cost is *analytics* (gold
marts, BI, dashboards): light = the low end, heavy interactive dashboards = the high end (and may want a
Standard/Jumbo Duckling at $2.40–$4.80/hr). This skill's pipeline alone stays at the low end.
³ Medium can stay on **Lite silver-only** (5 GB/yr < 10 GB) for **$0** if it prunes raw and skips the
Business features — the $250 is the cost of *choosing* Business, not a fleet requirement.

**Headline:** a **minimal (GPS) mirror** is cheap at any size — even 50,000 vehicles for a year is
~$520/mo, storage a rounding error (1.65 TB ≈ $66/mo) and the $250 platform fee the biggest line. An
**operational mirror with StatusData is ~12× the storage** and pushes very-large into the **~$1.5–2k/mo**
range (20 TB ≈ $800/mo storage + heavier ingest/analytics compute). Retaining 3 years instead of 1
roughly triples the storage line. Levers: **skip StatusData if you don't need it**, prune stable raw,
cap retention. MotherDuck does not meter the Geotab pulls — those ride the Go plan.

## With good bronze cleanup (the recommended steady state)

**Policy:** keep **silver for the full retention** (it's the queryable history, deterministically derived
and dedup'd), but keep **bronze only for a rolling recent window** — long enough to replay/re-derive or
re-pull a suspect load (7–30 days is plenty; the signed URL expires in 24 h anyway) — and **prune bronze
older than that.** Bronze stays the system of record for *recent* data; old raw is dropped once its silver
is verified.

**Why it's the biggest lever:** bronze (`all_varchar`) is ~**70%** of the full-raw footprint, silver only
~**30%** (16 B/ping vs 54 B/ping, measured). So pruning stable bronze drops storage toward **silver +
a thin rolling slice** — and the saving *grows* with retention, because the bronze window is a fixed size
while silver accumulates.

Effective per-vehicle-year (silver kept + a 30-day rolling bronze window):

| Mirror | full raw (current) | **good cleanup** | saving |
|--------|--------------------|------------------|--------|
| Minimal (GPS) | ~0.033 GB/veh-yr | **~0.012 GB/veh-yr** | ~65% |
| Operational (StatusData) | ~0.4 GB/veh-yr | **~0.14 GB/veh-yr** (1 yr) → ~0.12 at the silver-only floor | ~65–70% |

Fleet storage, **operational mirror, good cleanup, 1-yr silver + 30-day bronze** (us-east-1, $0.04/GB):

| Fleet | storage | storage $/mo | vs full-raw op |
|-------|---------|--------------|----------------|
| Small — 50 | **~7 GB** (fits free tier) | $0 | was 20 GB |
| Medium — 500 | ~70 GB | ~$2.80 | was 200 GB |
| Large — 5,000 | ~700 GB | ~$28 | was 2 TB ($80) |
| Very large — 50,000 | ~7 TB | **~$280** | was 20 TB ($800) |

So with cleanup a **50-vehicle operational mirror lives in the free 10 GB for ~1.5 years** (vs ~6 months
full-raw), the free tier holds **~70 operational vehicle-years** (vs ~25), and **very-large operational
storage drops from ~$800 to ~$280/mo**. Longer retention widens the gap further (silver-only is the floor
at ~30% of full-raw). Shrink the bronze window to ~7 days and you're essentially at the silver-only floor.

## Cost-control levers

- **Prune stable raw — the biggest lever** (see §With good bronze cleanup above). Keep bronze for a
  rolling 7–30 day window, drop older raw once its silver is verified: ~65–70% off, growing with
  retention. Prune **per table** (`bronze.*` is not a valid delete target — there's no wildcard `DELETE`):
  run one `DELETE FROM bronze.<table> WHERE _loaded_at < now() - INTERVAL 30 DAY` per bronze table (or
  generate them from `information_schema.tables WHERE table_schema='bronze'`). See also
  [`MEDALLION_LOADING.md`](MEDALLION_LOADING.md) §Storage note. Don't prune recent raw.
- **Don't pay to protect silver/gold — they re-derive from bronze.** Keep retention/backup effort on
  **bronze** (the irreplaceable system of record) and simply drop+rebuild silver/gold when needed rather
  than retaining their time-travel history. (Note: DuckDB/MotherDuck has **no `TRANSIENT` table** — that's
  Snowflake; `CREATE TRANSIENT TABLE` is a parser error, verified 2026-06-30. `TEMPORARY` is session-only,
  so it's not for persistent layers either.)
- **Right-size history.** Cap retention to what the use case needs; storage is linear in
  vehicle-*years*, so 1 yr vs 5 yr is a 5× swing.
- **Don't historize live snapshots.** `DeviceStatusInfo` is a snapshot, not an event stream — persisting
  it manufactures storage. See [`CHANNELS_AND_FRESHNESS.md`](CHANNELS_AND_FRESHNESS.md).
- **Compute hygiene.** Build gold marts on a schedule, not per-dashboard-load; let Ducklings cool down;
  Pulse auto-scales for ad-hoc reads so you pay per query, not for idle.

## Caveats

- Rates and plan limits change — this reflects the June 2026 us-east-1 page; verify before quoting.
- The per-vehicle storage figure rides on the ~1,700 pings/veh/day assumption; re-measure for your
  fleet with `PRAGMA database_size` after a representative load and rescale.
- Numbers are MotherDuck-only. Any downstream BI tool, reverse-ETL, or app compute is separate.
