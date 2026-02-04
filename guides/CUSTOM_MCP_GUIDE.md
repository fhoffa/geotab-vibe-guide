# Build Your Own Custom MCP Server

**Turn Claude into a conversational fleet management assistant.**

This guide shows you how to set up and extend a custom MCP (Model Context Protocol) server for Geotab, **starting from Felipe Hoffa's reference implementation**.

> **Starting Point:** [github.com/fhoffa/geotab-ace-mcp-demo](https://github.com/fhoffa/geotab-ace-mcp-demo)
>
> This guide walks you through setting up, understanding, and extending this working implementation.

> **Video Demo:** See it in action (3 min)
>
> [![Geotab Ace MCP Demo](https://img.youtube.com/vi/-eID1rXS1p8/0.jpg)](https://www.youtube.com/watch?v=-eID1rXS1p8)

---

## What is MCP?

**Model Context Protocol (MCP)** is an open standard that lets AI assistants like Claude connect to external tools and data sources. Instead of manually writing API calls, you can simply ask questions in natural language.

**Without MCP:**
```
You: "What's my fleet's fuel efficiency?"
Claude: "I can help you write code to query that..."
```

**With MCP:**
```
You: "What's my fleet's fuel efficiency?"
Claude: *queries your actual fleet data* "Your fleet averaged 8.2 MPG last week..."
```

---

## Why Build Your Own MCP Server?

### Current Landscape

| MCP Option | Capabilities | Limitations |
|------------|--------------|-------------|
| **Official Geotab (coming)** | API + Ace, read/write, cloud-hosted | No local processing, standard tools only |
| **Felipe's demo** | Ace queries, DuckDB caching | Ace-only (no direct API calls yet) |
| **Your custom MCP** | Whatever you need | You build it |

### Reasons to Build Custom

| Reason | Details |
|--------|---------|
| **Available Now** | Official Geotab MCP is coming, but you can start today |
| **Local Processing** | DuckDB caching, offline analysis - official is cloud-only |
| **Custom Tools** | Build specialized skills, frameworks, analysis methods |
| **Direct API + Ace** | Felipe's demo is Ace-only - add direct API for real-time data |
| **Composability** | Design tools that work with other MCPs (Maps, Slack, Calendar) |
| **Multi-Account** | Query multiple Geotab databases in one conversation |

---

## Prerequisites

Before starting, make sure you have:

- [ ] **Python 3.10+** installed
- [ ] **uv package manager** (`pip install uv` or [install uv](https://github.com/astral-sh/uv))
- [ ] **Claude Desktop** application ([download](https://claude.ai/download))
- [ ] **Geotab credentials** (database, username, password)

**Skill level:** Intermediate - you should be comfortable running Python scripts and editing configuration files.

---

## Quick Start (15 minutes)

### Step 1: Clone the Repository

```bash
git clone https://github.com/fhoffa/geotab-ace-mcp-demo.git
cd geotab-ace-mcp-demo
```

### Step 2: Set Up Environment

```bash
# Install dependencies with uv
uv sync
```

### Step 3: Configure Credentials

Create a `.env` file in the project root:

```bash
# .env - NEVER commit this file
GEOTAB_API_USERNAME=your_email@example.com
GEOTAB_API_PASSWORD=your_password
GEOTAB_API_DATABASE=your_database_name
```

### Step 4: Test the Connection

```bash
uv run python geotab_ace.py --test
```

You should see a successful connection message.

### Step 5: Configure Claude Desktop

Find your Claude Desktop config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Add the MCP server configuration:

```json
{
  "mcpServers": {
    "geotab-ace": {
      "command": "uv",
      "args": [
        "--directory",
        "/absolute/path/to/geotab-ace-mcp-demo",
        "run",
        "python",
        "geotab_mcp_server.py"
      ]
    }
  }
}
```

**Important:** Replace `/absolute/path/to/geotab-ace-mcp-demo` with the actual path where you cloned the repo.

### Step 6: Restart Claude Desktop

Quit and reopen Claude Desktop. You should see "geotab-ace" in the MCP tools list.

### Step 7: Try It Out

Ask Claude something like:
- "How many vehicles are in my fleet?"
- "Which drivers had the most trips last week?"
- "What's my fleet's fuel consumption trend?"

---

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Desktop │────▶│   MCP Server    │────▶│   Geotab Ace    │
│                 │     │ (Python + uv)   │     │   (AI Service)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         │                      ▼                       │
         │              ┌─────────────────┐             │
         │              │     DuckDB      │             │
         │              │ (Local Cache)   │             │
         │              └─────────────────┘             │
         │                      │                       │
         └──────────────────────┴───────────────────────┘
                    Natural Language Flow
```

### Architecture Components

1. **geotab_ace.py** - Core client that authenticates and communicates with Geotab's Ace AI
2. **geotab_mcp_server.py** - MCP server that exposes tools to Claude
3. **duckdb_manager.py** - Caches large datasets (>200 rows) locally for SQL analysis

### The Ask-Wait-Fetch Pattern

Geotab Ace uses an asynchronous pattern for complex queries:

1. **Ask** - Submit your question, receive a tracking ID
2. **Wait** - Ace processes the query (can take 10-60 seconds)
3. **Fetch** - Retrieve results when ready

The MCP server handles this automatically - you just ask and wait for the answer.

---

## Available MCP Tools

Once configured, Claude has access to these tools:

| Tool | Description | Use Case |
|------|-------------|----------|
| `geotab_ask_question` | Synchronous queries (≤60s) | Simple questions |
| `geotab_start_query_async` | Start long-running query | Complex analytics |
| `geotab_check_status` | Check async query progress | Monitor long queries |
| `geotab_get_results` | Fetch completed results | Get async answers |
| `geotab_query_duckdb` | SQL on cached data | Analyze large datasets |
| `geotab_list_cached_datasets` | View cached data | See what's available |
| `geotab_test_connection` | Verify API access | Troubleshooting |
| `geotab_list_accounts` | Show configured accounts | Multi-account setups |

---

> **When to use Ace vs Direct API:** See [ADVANCED_INTEGRATIONS.md](./ADVANCED_INTEGRATIONS.md#geotab-ace-when-to-use-ai-vs-direct-api) for guidance on when to use Ace (complex analysis, insights) vs direct API (real-time data, writes).

---

## Multi-Account Setup

Query multiple Geotab databases in a single Claude conversation.

### Configure Multiple Accounts

In your `.env` file:

```bash
# Account 1 (default)
GEOTAB_API_USERNAME=user1@company.com
GEOTAB_API_PASSWORD=password1
GEOTAB_API_DATABASE=database1

# Account 2
GEOTAB_ACCOUNT_1_NAME=West Region
GEOTAB_ACCOUNT_1_USERNAME=user2@company.com
GEOTAB_ACCOUNT_1_PASSWORD=password2
GEOTAB_ACCOUNT_1_DATABASE=west_database

# Account 3
GEOTAB_ACCOUNT_2_NAME=East Region
GEOTAB_ACCOUNT_2_USERNAME=user3@company.com
GEOTAB_ACCOUNT_2_PASSWORD=password3
GEOTAB_ACCOUNT_2_DATABASE=east_database
```

### Usage

```
You: "List my available Geotab accounts"
Claude: "You have access to: Default, West Region, East Region"

You: "Compare fuel efficiency between West Region and East Region"
Claude: *queries both accounts* "West Region averages 7.8 MPG while East Region averages 8.4 MPG..."
```

---

## DuckDB Caching

When Ace returns large datasets (>200 rows), the MCP server automatically caches them in DuckDB for efficient analysis.

### How It Works

1. You ask: "Show me all trips from last month"
2. Ace returns 5,000 trips
3. MCP server caches to DuckDB (instead of overwhelming Claude's context)
4. Claude can then run SQL queries on the cached data

### Example SQL Queries

```
You: "What datasets do I have cached?"
Claude: *lists cached tables*

You: "Run this SQL: SELECT vehicle_name, COUNT(*) as trip_count FROM trips_march GROUP BY vehicle_name ORDER BY trip_count DESC LIMIT 10"
Claude: *executes SQL on cached data*
```

---

## Extending the MCP Server

### Adding Custom Tools

Edit `geotab_mcp_server.py` to add new capabilities:

```python
@server.tool()
async def my_custom_tool(question: str) -> str:
    """
    Description of what this tool does.
    Claude will see this description when deciding which tool to use.
    """
    # Your implementation here
    result = await some_async_operation(question)
    return result
```

### Ideas for Custom Tools

- **Write operations:** Create zones, update device names, add groups
- **Alerts:** Set up notifications when conditions are met
- **Reports:** Generate formatted reports on demand
- **Integrations:** Connect to Slack, email, or other systems

### Adding Write Capabilities

The base MCP server is read-only. To add write operations:

```python
@server.tool()
async def create_zone(name: str, lat: float, lon: float, radius_meters: int) -> str:
    """Create a circular geofence zone around a location."""
    # Use direct Geotab API for write operations
    zone_data = {
        "name": name,
        "points": generate_circle_points(lat, lon, radius_meters),
        # ... other zone properties
    }
    result = await geotab_api.add("Zone", zone_data)
    return f"Created zone '{name}' with ID: {result}"
```

**Important:** Add confirmation prompts for destructive operations.

---

## Privacy and Security

### Automatic Redaction

The MCP server automatically redacts sensitive driver information by default. This protects driver privacy while still enabling fleet analysis.

### Best Practices

1. **Never commit `.env`** - Add to `.gitignore`
2. **Use separate accounts** - Don't use admin credentials for MCP
3. **Audit access** - Review what Claude has queried
4. **Network security** - MCP runs locally, but be careful with logs

---

## Troubleshooting

### "Connection failed" error

1. Verify credentials in `.env`
2. Run `uv run python geotab_ace.py --test`
3. Check your network connection to Geotab

### Claude doesn't see the MCP server

1. Check the path in `claude_desktop_config.json` is absolute
2. Restart Claude Desktop completely (quit, not just close)
3. Check Claude's MCP logs for errors

### Queries timing out

- Ace can take 60+ seconds for complex queries
- Try simpler questions first
- Check if your Geotab database has data for the requested time period

### "No data returned"

- Verify your database has data
- Try a broader date range
- Check if you're querying the right account (multi-account setups)

---

## Resources

- **MCP Server Repository:** [github.com/fhoffa/geotab-ace-mcp-demo](https://github.com/fhoffa/geotab-ace-mcp-demo)
- **MCP Specification:** [modelcontextprotocol.io](https://modelcontextprotocol.io/)
- **Video Demo:** [YouTube - Geotab Ace MCP Demo](https://www.youtube.com/watch?v=-eID1rXS1p8)
- **Geotab API Reference:** [geotab.github.io/sdk/software/api/reference/](https://geotab.github.io/sdk/software/api/reference/)

---

## MCP Composability

Multiple MCP servers can work together in the same conversation.

### Example: Multi-MCP Workflow

```
You: "Find vehicles with high idle time last week,
      check weather at their locations,
      and post a summary to Slack."

Claude uses:
  → Geotab MCP: Query idle time data
  → Weather MCP: Get conditions at locations
  → Slack MCP: Post the summary
```

### Designing for Composability

When building your Geotab MCP, design tools that work well with others:

```python
@server.tool()
async def get_vehicle_locations() -> str:
    """
    Get current locations for all vehicles.
    Returns: List of {vehicle_id, name, lat, lon}

    Composable: Output format works with mapping MCPs.
    """
    # Return clean data other MCPs can use
    return json.dumps([
        {"vehicle_id": v.id, "name": v.name, "lat": v.lat, "lon": v.lon}
        for v in vehicles
    ])
```

### Popular MCPs to Combine With

- **Google Maps MCP** - Route optimization, place search
- **Slack MCP** - Post alerts and reports
- **Calendar MCP** - Schedule maintenance, deliveries
- **Weather MCP** - Check conditions for routes
- **Database MCPs** - Store and query historical data

---

## What's Next?

Once you have the basic MCP server running:

1. **Add direct API calls** - Felipe's demo is Ace-only; add real-time data + writes
2. **Try composability** - Install other MCPs and combine with Geotab
3. **Multi-account setup** - Connect all your Geotab databases
4. **Build integrations** - Connect MCP responses to Slack, email, dashboards

---

**Note:** Geotab is developing an official MCP implementation. Building your own now lets you start immediately and creates capabilities the official version may not include. Your custom MCP can coexist with the official one when it launches.
