# The Official Geotab MCP Connector

> **New (June 2026):** Geotab now ships an **official MCP Connector** that plugs your live
> MyGeotab data — both the fast direct API and Geotab Ace — straight into ChatGPT, Claude, and
> Microsoft Copilot. No code, no hosting, no MCP server to run yourself. If you just want to *talk to
> your fleet* from an AI tool you already use, **this is the easiest path.**
>
> ### 🎮 Want to feel it right now? [**Play with the free simulator →**](https://fhoffa.github.io/geotab-mcp-simulator/)
> No account, no login, no fleet — a browser demo of the whole experience. ([details below](#try-it-first--no-account-needed))
>
> Official page: **[geotab.com/geotab-mcp-connector](https://www.geotab.com/geotab-mcp-connector/)**

---

## What is it?

**MCP (Model Context Protocol)** is an open standard that lets AI assistants connect to external
tools and data. The Geotab MCP Connector is Geotab's own hosted implementation of that standard: a
governed bridge between your MyGeotab account and any MCP-compatible AI assistant.

Ask your fleet a question in plain English, get a live answer, and take action — all inside the
chat window:

```
You:    "Which vehicles in the Northwest fleet have open maintenance issues?"
Claude: *queries your live MyGeotab data* "3 vehicles have open faults: ..."

You:    "Create a geofence zone around our downtown depot and a rule that
         alerts me when any of them idles more than 15 minutes there."
Claude: *creates the zone and rule in MyGeotab* "Done — zone 'Downtown Depot'
         and rule 'Idle > 15 min' are now active."
```

It's **not just Ace.** Under the hood the connector reaches your fleet two ways:

- **The direct MyGeotab API** — fast, structured reads (often sub-second) *and* **writes**. This is
  what lets it *create things*: geofence zones, rules, alerts, groups, setting changes — not just
  answer questions.
- **Geotab Ace** — the agentic platform you may know from inside MyGeotab, for open-ended
  natural-language analysis over your data.

The AI picks the right one for what you're asking. So you get Ace's flexibility for exploration
*and* the raw API's speed and write access for getting things done — all from the AI tools your team
already lives in. (For how those channels differ on speed and flexibility, see
[Data access: Data Connector vs API vs Ace](./DATA_ACCESS_COMPARISON.md).)

---

## Why this is a big deal

For a long time, connecting an AI assistant to Geotab meant writing code — API calls, an
[Add-In](./GEOTAB_ADDINS.md), or [your own MCP server](./CUSTOM_MCP_GUIDE.md). The official
connector removes all of that for the common case:

| | Before | With the official connector |
|---|---|---|
| **Setup** | Clone a repo, install Python/uv, edit config files | One-click, zero coding |
| **Hosting** | Run a server locally or in the cloud | Nothing to host — Geotab runs it |
| **Auth** | Manage credentials in `.env` | Uses your existing MyGeotab login |
| **Permissions** | You enforce them | Inherits your MyGeotab user permissions automatically |
| **AI tools** | Whatever you wire up | ChatGPT, Claude, Copilot, and other MCP clients |

Because it's built on the **open MCP standard**, you're not locked into one AI ecosystem — connect
the fleet intelligence to whichever approved assistant your organization uses.

---

## Try it first — no account needed

Curious what the experience feels like before you turn anything on? There's a **free, no-setup
simulator** that plays back the Geotab + MCP conversation against real demo-fleet data. Nothing to
install, no login, no fleet to connect.

> ### 🎮 [**Try the Geotab MCP Simulator →**](https://fhoffa.github.io/geotab-mcp-simulator/)
>
> A playable chatbot that previews the connector experience — including the simulated MCP tool
> calls the AI makes behind the scenes. Great for demos, workshops, and deciding whether the real
> connector fits your workflow.
>
> Source: [github.com/fhoffa/geotab-mcp-simulator](https://github.com/fhoffa/geotab-mcp-simulator)

---

## Getting the real connector

The connector is **included at no extra cost with an eligible GO Plan subscription**.

Requirements:

- An eligible **GO Plan** subscription
- Your account must be on **Unified Login** (so permissions sync correctly)
- An MCP-compatible AI tool: **ChatGPT, Claude, or Microsoft Copilot** (plan requirements vary by
  vendor — e.g. ChatGPT connectors need a paid tier)

Setup is a **one-time connection**: you connect once, and data translation and security are handled
automatically. To check eligibility and get the connection details for your organization, log into
**MyGeotab** or contact your **Partner Account Manager (PAM)**.

> Because setup and the exact server endpoint are tied to your MyGeotab organization, the
> authoritative, up-to-date instructions live on Geotab's own page:
> **[geotab.com/geotab-mcp-connector](https://www.geotab.com/geotab-mcp-connector/)**.

### What you can do once connected

- **Ask** — live questions about vehicles, trips, drivers, faults, idling, and more (fast API reads or Ace analysis, whichever fits)
- **Act (write-back)** — **create geofence zones**, rules and alerts, schedule maintenance, organize groups, change settings — real changes in MyGeotab, not just answers
- **Build** — generate reports and dashboards without exporting files or switching apps

All of it respects your existing MyGeotab permissions: a dispatcher sees only what they're allowed
to see.

---

## Official connector vs. building your own

**The official connector is the preferred path — start here.** But MCP is an *open standard*, so
anyone can also build their own **unofficial** server. Roll your own only when you need something the
hosted product doesn't do:

| Use the **official connector** when… (preferred) | Build your **own unofficial MCP** when… |
|---|---|
| You want fleet Q&A + actions in ChatGPT/Claude/Copilot today | You need custom tools, frameworks, or analysis methods |
| Zero setup and Geotab-managed hosting matter | You want local processing (e.g. DuckDB caching, offline work) |
| Your team is on GO Plan + Unified Login | You want to combine Geotab with other data sources your way |
| The built-in API + Ace capabilities are enough | You need multi-account queries or bespoke write logic |

The two can **coexist** — an unofficial MCP for specialized tooling alongside the official connector
for everyday questions. See [**CUSTOM_MCP_GUIDE.md**](./CUSTOM_MCP_GUIDE.md) for the build-your-own path.

---

## Related: get a *copy* of your data, not just answers

The MCP connector *queries* Geotab on demand — perfect for questions and actions. If instead you
want a **copy of the raw data in a database you control** (unlimited history, your own SQL and
joins, dashboards that never hit the API), that's replication, not querying.

Interestingly, MCP can power that too: an AI agent can drive an MCP connection to **build and
maintain a data warehouse** for you.

- **[Replicating Geotab Data into Your Own Warehouse](./MCP_TO_MOTHERDUCK_VS_GETFEED_API_ADAPTER.md)**
  — the AI-driven [MotherDuck warehouse skill](../skills/geotab-motherduck-warehouse/SKILL.md)
  (MCP-driven, zero infrastructure) vs. Geotab's official
  [MyGeotab API Adapter](https://github.com/Geotab/mygeotab-api-adapter) (always-on, self-hosted),
  compared honestly.
- **[Data access: Data Connector vs API vs Ace](./DATA_ACCESS_COMPARISON.md)** — how the query
  channels stack up on speed, flexibility, and cost.

---

## Resources

- **Official connector page:** [geotab.com/geotab-mcp-connector](https://www.geotab.com/geotab-mcp-connector/)
- **Try it live (simulator):** [fhoffa.github.io/geotab-mcp-simulator](https://fhoffa.github.io/geotab-mcp-simulator/)
- **Simulator source:** [github.com/fhoffa/geotab-mcp-simulator](https://github.com/fhoffa/geotab-mcp-simulator)
- **Build your own MCP:** [CUSTOM_MCP_GUIDE.md](./CUSTOM_MCP_GUIDE.md)
- **Your own warehouse:** [MCP_TO_MOTHERDUCK_VS_GETFEED_API_ADAPTER.md](./MCP_TO_MOTHERDUCK_VS_GETFEED_API_ADAPTER.md)
- **MCP standard:** [modelcontextprotocol.io](https://modelcontextprotocol.io/)
