# Replicating Geotab Data into Your Own Warehouse: the MotherDuck Skill vs. the Official MyGeotab API Adapter

> **What is this about?** Sometimes querying the Geotab API isn't enough — you want a *copy* of your
> fleet data in your own database. Your own SQL, your own joins with business data, history kept as
> long as you like, dashboards that don't hit the API on every refresh. That's a **data warehouse
> mirror**, and there are two very different ways to build one.

> **Who is this for?** Anyone asking "how do I get my Geotab data into a database I control?" One
> path needs zero infrastructure and works from a chat window; the other is a production-grade
> service you install and run. This guide compares them honestly so you pick the right one.

The two options:

1. **The [Geotab → MotherDuck warehouse skill](../skills/geotab-motherduck-warehouse/SKILL.md)**
   (this repo) — an AI agent builds and maintains a [MotherDuck](https://motherduck.com/) (DuckDB)
   warehouse for you, driven entirely through MCP tool calls. No servers, no code to deploy.
2. **The official [MyGeotab API Adapter](https://github.com/Geotab/mygeotab-api-adapter)**
   (Geotab's open-source project on GitHub) — a .NET service that continuously downloads your
   MyGeotab data into SQL Server or PostgreSQL. Battle-tested, near-real-time, runs 24/7.

They solve the same problem with opposite philosophies: **agent-driven and zero-infra** versus
**always-on and self-hosted**.

## The Short Version

| | MotherDuck warehouse skill | MyGeotab API Adapter |
|---|---|---|
| **What it is** | An [Agent Skill](./CREATING_AGENT_SKILLS.md): instructions an AI assistant follows to build/refresh a warehouse | Open-source .NET application you download and run |
| **Runs where** | Inside an AI chat session (Claude, or any MCP client) | Your server/VM — Windows service, Linux systemd, or manual |
| **Infrastructure you manage** | None | A host machine + SQL Server 2019+ or PostgreSQL 16+ |
| **Target database** | MotherDuck (cloud DuckDB) | SQL Server or PostgreSQL |
| **How it syncs** | Watermark-based incremental loads via Geotab MCP (Ace bulk CSV for facts, `Get` for dimensions) | Official `GetFeed` API — exact version-token cursors per entity |
| **Freshness** | As fresh as your last run (typically daily or on-demand); the Ace source itself lags only ~1–2 min | Near-real-time — continuous polling, intervals down to 2 seconds |
| **Coverage** | Curated catalog: GPS, trips, engine status, exceptions, faults + device/user/zone/rule dimensions (extensible to any of the 52 entity types) | 14 feed types (GPS, trips, faults, DVIR, HOS logs, charge events…) + ~10 reference caches, chosen in a config file |
| **Setup effort** | Minutes — connect two MCP servers, say "replicate my Geotab data" | Hours — provision database, configure `appsettings.json`, deploy the service |
| **Cost** | Free tiers go far: MotherDuck Lite includes 10 GB (~70 operational vehicle-years with cleanup, measured June 2026); Geotab MCP/Ace ride the standard plan | Software is free; you pay for the host + database (Geotab's own estimate: ~20,000 devices ≈ 40 GB of PostgreSQL in 7 days) |
| **Extras** | Bronze/silver/gold layers, replayable raw history, quality checks, natural-language operation | Location interpolation for faults/status, DVIR write-back to MyGeotab, automated partitioning & index maintenance |
| **Best for** | Analytics, BI, data science, demos, small-to-large fleets without a data team | Production integrations, minute-level SLAs, enterprise fleets with ops staff |

---

## Option 1: The MotherDuck Warehouse Skill

**Link:** [`skills/geotab-motherduck-warehouse/`](../skills/geotab-motherduck-warehouse/SKILL.md)

This is warehousing the vibe-coding way. You connect two MCP servers to your AI assistant — the
Geotab MCP and the MotherDuck MCP — and ask for what you want in plain English:

> *"Replicate my Geotab database into MotherDuck and keep it fresh with a daily update."*

The skill teaches the agent everything else: how to pull bulk GPS/trip/status data through Geotab
Ace (which returns a CSV download link), how to load dimensions like devices and zones through the
classic API, how to organize the warehouse in **bronze** (raw, append-only), **silver** (typed,
deduplicated), and **gold** (business summaries) layers, and how to run incremental updates with
watermarks so re-runs never duplicate data.

What makes it more than a toy: the skill encodes **20+ documented quirks** of the Ace export path
(duplicated rows, silently injected filters, unit conversions, sharded downloads…) with the
defensive pattern for each — all measured on live databases, with the evidence logged. Your agent
doesn't rediscover these the hard way.

**See it run (a real, independent test):** someone replicated a multi-million-row fleet with the
skill and shared the entire conversation —
[read the transcript](https://claude.ai/share/7bafaf73-8018-4312-a16b-5052cca6ef77). It's an honest
look at the skill handling those quirks on live data: the ~2× row doubling collapsing in dedup,
sharded exports, a requested column coming back renamed, a transient `invalid_value` cleared on
retry, and a trip re-split reconcile that matched the skill's own worked example. It also surfaced a
couple of rough edges — stale `started` log rows left by an earlier crashed session, and a long
backfill that hit the AI tool's per-turn tool-call limit and needed a nudge to *continue*.
**Both are now addressed in the skill's guidance** (a start-of-session sweep that finalizes or
abandons stale rows, and an explicit "expect to say *continue*, resuming is safe by design") —
see the [improvement plan](../skills/geotab-motherduck-warehouse/IMPROVEMENT_PLAN.md) and
[evidence log](../skills/geotab-motherduck-warehouse/references/EVIDENCE_LOG.md) for the full record.

**Honest limits:** the warehouse is only as fresh as the last time an agent ran the update loop.
It's ideal for analytics that tolerate "updated this morning," not for feeding a dispatch screen
that needs this minute's positions. (For live views, query the API directly — see
[DATA_ACCESS_COMPARISON.md](./DATA_ACCESS_COMPARISON.md).) And it's agent-operated: there's no
supervised daemon watching it 24/7 unless you schedule one.

## Option 2: The Official MyGeotab API Adapter

**Link:** [github.com/Geotab/mygeotab-api-adapter](https://github.com/Geotab/mygeotab-api-adapter)
([README](https://github.com/Geotab/mygeotab-api-adapter/blob/master/MyGeotabAPIAdapter/README.md))

This is Geotab's own answer to the same problem, and it's seriously engineered: **29 coordinated
background services** that continuously pull data feeds and reference caches from your MyGeotab
database into SQL Server or PostgreSQL. It's both a production tool and a reference implementation
of correct API usage.

Highlights worth knowing about even if you never run it:

- **`GetFeed` syncing.** Each data type is tracked with an exact version cursor, persisted in the
  database, resumed on restart. No time-window math, no boundary duplicates. If a feed page comes
  back full (≥1,000 records), the adapter knows it's behind and polls again immediately.
- **Two-tier reference caching.** Devices, users, zones, and diagnostics get frequent incremental
  updates *plus* periodic full refreshes — because deletions never show up in incremental results.
- **Location interpolation.** Fault and engine-status records carry no coordinates; dedicated
  services interpolate lat/lon/speed/bearing from surrounding GPS records.
- **Write-back.** A DVIR workflow lets an external maintenance system push repair statuses *back*
  into MyGeotab — the adapter isn't read-only.
- **Production hardening.** State machine for connectivity loss, retry policies, transactional
  writes, automated table partitioning and index maintenance at fleet scale.

**Honest limits:** you're running infrastructure. Provisioning a database server, editing a large
`appsettings.json`, deploying a service, monitoring it. Entirely reasonable for an enterprise
integration; heavy for "I want to analyze my fleet in SQL this afternoon."

---

## Under the Hood: Why the Sync Mechanisms Differ

The adapter uses **`GetFeed`**, the officially supported incremental API: ask with a version token,
get everything since that token, store the new token. It's exact — nothing missed, nothing
duplicated.

The skill instead uses **watermarks**: check the newest timestamp already in the warehouse, ask for
everything after it, then deduplicate on each record's natural key. Why not `GetFeed`? Because the
Geotab MCP server doesn't expose it (verified July 2026 — no feed tool, and no feed-token parameter
on the `Get` tool). Watermarks + dedup are the MCP-compatible substitute, and the skill's
bronze-layer design makes them safe: every raw pull is kept append-only, so any load can be
replayed and verified.

This difference explains most of the freshness gap: a daemon holding an exact cursor can poll every
few seconds forever; an agent computing watermarks runs when invoked.

## Which Should You Pick?

**Choose the MotherDuck skill when…**
- You want results today, with nothing to install or host
- The use case is analytics, BI, reporting, or data science — "fresh as of the last run" is fine
- You (or your team) live in AI-assisted workflows already
- You want free-tier economics — a 50-vehicle operational mirror fits MotherDuck's free 10 GB for
  over a year with cleanup (measured June 2026 — see the skill's
  [cost guide](../skills/geotab-motherduck-warehouse/references/COST_AND_SIZING.md))

**Choose the MyGeotab API Adapter when…**
- Downstream systems need data within seconds-to-minutes, around the clock
- You need entities the skill's catalog doesn't cover yet — DVIR inspections, Hours-of-Service duty
  status logs, driver changes
- You need write-back (the DVIR repair-status loop)
- Your organization already runs SQL Server/PostgreSQL and has ops staff to own a service
- You want the officially supported, Geotab-maintained path

**A perfectly good journey:** prototype with the skill this week — prove the value of a warehouse
with zero commitment — then graduate to the adapter if you find yourself needing 24/7 sub-minute
freshness. The concepts transfer directly: the skill's silver tables and the adapter's feed tables
mirror the same source entities, and DuckDB can even attach to PostgreSQL if you later want to
query the adapter's database with the same tools.

## What About the Data Connector?

The [OData Data Connector](./DATA_CONNECTOR.md) is a third thing that sounds similar but isn't a
replica: it serves **pre-aggregated KPIs** (daily distance, idle time, safety scores) from Geotab's
own pipeline. You don't get raw GPS points or the ability to define your own transformations — but
if daily fleet KPIs are all you need, it's less work than either option here. See
[DATA_ACCESS_COMPARISON.md](./DATA_ACCESS_COMPARISON.md) for how it stacks up against the raw API
and Ace for *querying* (rather than replicating) your data.

## Try It: Copy-Paste Prompt

With the Geotab and MotherDuck MCP servers connected in Claude (and this repo's skills available),
start with:

```
Using the geotab-motherduck-warehouse skill, replicate my Geotab database
<your-database-name> into a new MotherDuck warehouse. Start with GPS, trips,
and the device dimension. Show me the row counts and freshness when done.
```

## Links

- **The skill:** [`skills/geotab-motherduck-warehouse/SKILL.md`](../skills/geotab-motherduck-warehouse/SKILL.md)
- **The adapter:** [github.com/Geotab/mygeotab-api-adapter](https://github.com/Geotab/mygeotab-api-adapter) · [README](https://github.com/Geotab/mygeotab-api-adapter/blob/master/MyGeotabAPIAdapter/README.md)
- **MotherDuck:** [motherduck.com](https://motherduck.com/) · [MCP server docs](https://motherduck.com/docs/sql-assistant/mcp/)
- **Querying (not replicating) comparison:** [DATA_ACCESS_COMPARISON.md](./DATA_ACCESS_COMPARISON.md)
- **Pre-aggregated KPIs:** [DATA_CONNECTOR.md](./DATA_CONNECTOR.md)
