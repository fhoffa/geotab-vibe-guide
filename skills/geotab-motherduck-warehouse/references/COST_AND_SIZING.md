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

`PRAGMA database_size` on the live demo warehouse (`my_db`): **35.2 MiB** total, holding **679,577**
unique GPS pings — kept **twice** (append-only `bronze_gps_raw` as `all_varchar` + typed
`planet_gps_pings`) — plus trips, exceptions, and dimensions. The source CSV was 11.8 MB for 157,419
rows (~75 B/row); DuckDB compresses the typed silver to roughly a quarter of that. Derived rates:

| What you store | Bytes per GPS ping | Per vehicle-year¹ |
|----------------|--------------------|-------------------|
| **Silver only** (raw pruned — see below) | ~16 B | **~10 MB ≈ 0.01 GB** |
| **Bronze + silver** (keep full raw, the default) | ~54 B | **~33 MB ≈ 0.033 GB** |

¹ Assuming **~1,700 GPS pings / vehicle / day** — the observed rate for *active* demo vehicles
(`b3` logged 1,756 on 2026-06-28; fleet average 157,419 ÷ 26 ÷ 3.7 days ≈ 1,636). Parked/idle vehicles
or a different logging cadence scale this down; **cost is linear in ping rate**, so adjust if your fleet
differs. Trips + exceptions are <15% on top of GPS and rounded into the per-vehicle figure.

## How much fits in the free 10 GB?

| Keeping | 10 GB holds | In practice |
|---------|-------------|-------------|
| Silver only | **~1,000 vehicle-years** | 50 vehicles for ~20 yrs · 500 vehicles for ~2 yrs |
| Bronze + silver | **~300 vehicle-years** | 50 vehicles for ~6 yrs · 100 vehicles for ~3 yrs · ~300 vehicles for ~1 yr |

**A small fleet (tens of vehicles) lives in the free tier for years.** A few-hundred-vehicle fleet fits
for months-to-years depending on whether you keep raw.

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

Measured the actual per-query cost with `EXPLAIN ANALYZE` on the live demo warehouse (server-side time):

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

Steady state, retaining **1 year** of history, **keeping full raw** (bronze+silver, ~0.033 GB/veh-yr),
us-east-1. Storage is the only fleet-linear cost; the Business platform fee and analytics compute
dominate the total.

| Fleet | GPS pings/day | Storage @ 1 yr | Storage $/mo | + Platform | + Compute (est.²) | **≈ Total / mo** |
|-------|---------------|----------------|--------------|------------|-------------------|------------------|
| Small — 50 | ~85 K | 1.7 GB | **$0** (free tier) | $0 (Lite) | $0 (incl.) | **$0** |
| Medium — 500 | ~850 K | 16.5 GB | $0.66 | $250 (Business)³ | ~$10 | **~$260** |
| Large — 5,000 | ~8.5 M | 165 GB | $6.60 | $250 | ~$10–40 | **~$270–300** |
| Very large — 50,000 | ~85 M | 1.65 TB | $66 | $250 | ~$50–200 | **~$370–520** |

² **Compute is usage-driven, not fleet-linear.** *Ingestion* is cheap — DuckDB loads millions of
rows/sec, so even 85 M pings/day is minutes of Duckling time. The variable cost is *analytics* (gold
marts, BI, dashboards): light = the low end, heavy interactive dashboards = the high end (and may want a
Standard/Jumbo Duckling at $2.40–$4.80/hr). This skill's pipeline alone stays at the low end.
³ Medium can stay on **Lite silver-only** (5 GB/yr < 10 GB) for **$0** if it prunes raw and skips the
Business features — the $250 is the cost of *choosing* Business, not a fleet requirement.

**Headline:** even a 50,000-vehicle fleet keeping years of history is **a few hundred dollars a month** —
storage at $0.04/GB is almost a rounding error (1.65 TB ≈ $66/mo); the $250 Business platform fee is the
biggest single line. Retain 3 years instead of 1 and very-large storage roughly triples to ~$198/mo
(~$500–650/mo all-in). MotherDuck does not meter the Geotab pulls — those ride the Go plan.

## Cost-control levers

- **Prune stable raw.** Bronze is the non-reproducible system of record, but *old, settled* batches can
  be dropped once you trust them — that drops you from ~54 B/ping toward ~16 B/ping (the silver-only
  column). See [`MEDALLION_LOADING.md`](MEDALLION_LOADING.md) §Storage note. Don't prune recent raw.
- **Mark silver/gold `TRANSIENT`.** They're rebuildable from bronze, so they don't need the 7-day
  point-in-time `historical_bytes` retention Business keeps by default (configurable 0–90 days). Keep
  **bronze standard** (it's irreplaceable). This trims retained-byte overhead on the churny layers.
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
