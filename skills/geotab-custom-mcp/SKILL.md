---
name: geotab-custom-mcp
description: Build and extend MCP servers for conversational fleet management. Use this skill when setting up MCP integration with Claude Desktop, adding custom tools, or troubleshooting MCP configurations.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "1.0"
---

# Geotab Custom MCP Server Skill

## When to Use This Skill

- Setting up MCP server for Claude Desktop integration
- Adding custom tools to an existing MCP server
- Troubleshooting MCP connection issues
- Extending MCP with write capabilities (create zones, groups, etc.)
- Configuring multi-account access
- Working with DuckDB caching for large datasets

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Desktop │────▶│   MCP Server    │────▶│   Geotab Ace    │
│                 │◀────│  (Python + uv)  │◀────│   (AI Service)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │     DuckDB      │
                        │  (Large Data)   │
                        └─────────────────┘
```

## Prerequisites

```bash
# Required tools
python >= 3.10
uv  # package manager

# Install uv if needed
pip install uv

# Clone the MCP server
git clone https://github.com/fhoffa/geotab-ace-mcp-demo.git
cd geotab-ace-mcp-demo
uv sync
```

## Configuration

### Credentials (.env file)

```bash
# .env - place in project root
GEOTAB_API_USERNAME=your_email@example.com
GEOTAB_API_PASSWORD=your_password
GEOTAB_API_DATABASE=your_database_name
```

### Multi-Account Setup

```bash
# Default account
GEOTAB_API_USERNAME=user@company.com
GEOTAB_API_PASSWORD=password
GEOTAB_API_DATABASE=main_db

# Additional accounts (numbered from 1)
GEOTAB_ACCOUNT_1_NAME=West Fleet
GEOTAB_ACCOUNT_1_USERNAME=west@company.com
GEOTAB_ACCOUNT_1_PASSWORD=password
GEOTAB_ACCOUNT_1_DATABASE=west_db

GEOTAB_ACCOUNT_2_NAME=East Fleet
GEOTAB_ACCOUNT_2_USERNAME=east@company.com
GEOTAB_ACCOUNT_2_PASSWORD=password
GEOTAB_ACCOUNT_2_DATABASE=east_db
```

### Claude Desktop Configuration

Location:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

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

## Core Components

### geotab_ace.py - Ace API Client

```python
import os
from dotenv import load_dotenv

load_dotenv()

class GeotabAceClient:
    """Client for Geotab Ace AI service."""

    def __init__(self):
        self.username = os.getenv('GEOTAB_API_USERNAME')
        self.password = os.getenv('GEOTAB_API_PASSWORD')
        self.database = os.getenv('GEOTAB_API_DATABASE')
        self.session = None

    async def authenticate(self):
        """Authenticate with Geotab and get session token."""
        # Authentication logic here
        pass

    async def ask_question(self, question: str) -> dict:
        """
        Ask a natural language question to Ace.
        Returns answer with optional dataset.
        """
        # Send question, wait for response
        pass

    async def start_async_query(self, question: str) -> str:
        """Start long-running query, return tracking ID."""
        pass

    async def check_status(self, tracking_id: str) -> dict:
        """Check status of async query."""
        pass

    async def get_results(self, tracking_id: str) -> dict:
        """Fetch results of completed query."""
        pass
```

### geotab_mcp_server.py - MCP Server

```python
from mcp import Server
from mcp.types import Tool

server = Server("geotab-ace")

@server.tool()
async def geotab_ask_question(question: str) -> str:
    """
    Ask a natural language question about your fleet.
    Use for quick queries that can complete in under 60 seconds.

    Examples:
    - "How many vehicles are in my fleet?"
    - "What was total fuel consumption last week?"
    - "Which drivers had the most trips yesterday?"
    """
    client = GeotabAceClient()
    await client.authenticate()
    result = await client.ask_question(question)
    return format_response(result)

@server.tool()
async def geotab_start_query_async(question: str) -> str:
    """
    Start a long-running query that may take more than 60 seconds.
    Returns a tracking ID to check status later.

    Use for complex analytics:
    - "Analyze fuel efficiency trends over 6 months"
    - "Compare all driver safety scores with detailed breakdown"
    """
    client = GeotabAceClient()
    await client.authenticate()
    tracking_id = await client.start_async_query(question)
    return f"Query started. Tracking ID: {tracking_id}"

@server.tool()
async def geotab_check_status(tracking_id: str) -> str:
    """Check the status of an async query."""
    client = GeotabAceClient()
    status = await client.check_status(tracking_id)
    return f"Status: {status['state']} - {status.get('message', '')}"

@server.tool()
async def geotab_get_results(tracking_id: str) -> str:
    """Fetch results of a completed async query."""
    client = GeotabAceClient()
    result = await client.get_results(tracking_id)
    return format_response(result)

@server.tool()
async def geotab_query_duckdb(sql: str) -> str:
    """
    Run SQL query on cached datasets.
    Use after large queries have been cached.
    """
    import duckdb
    conn = duckdb.connect('cache.duckdb')
    result = conn.execute(sql).fetchall()
    return format_sql_result(result)

@server.tool()
async def geotab_list_cached_datasets() -> str:
    """List all datasets currently cached in DuckDB."""
    import duckdb
    conn = duckdb.connect('cache.duckdb')
    tables = conn.execute("SHOW TABLES").fetchall()
    return "\n".join([t[0] for t in tables])

@server.tool()
async def geotab_test_connection() -> str:
    """Test connection to Geotab API."""
    client = GeotabAceClient()
    try:
        await client.authenticate()
        return "Connection successful!"
    except Exception as e:
        return f"Connection failed: {e}"

@server.tool()
async def geotab_list_accounts() -> str:
    """List all configured Geotab accounts."""
    accounts = get_configured_accounts()
    return "\n".join([f"- {a['name']}: {a['database']}" for a in accounts])
```

### duckdb_manager.py - Large Dataset Caching

```python
import duckdb
import pandas as pd

class DuckDBManager:
    """Manages caching of large datasets from Ace."""

    def __init__(self, db_path: str = "cache.duckdb"):
        self.conn = duckdb.connect(db_path)

    def cache_dataset(self, name: str, data: list[dict]):
        """
        Cache a large dataset (>200 rows) in DuckDB.
        Called automatically when Ace returns large results.
        """
        df = pd.DataFrame(data)
        self.conn.execute(f"DROP TABLE IF EXISTS {name}")
        self.conn.execute(f"CREATE TABLE {name} AS SELECT * FROM df")
        return f"Cached {len(data)} rows to table '{name}'"

    def query(self, sql: str) -> list:
        """Run SQL query on cached data."""
        return self.conn.execute(sql).fetchall()

    def list_tables(self) -> list[str]:
        """List all cached tables."""
        result = self.conn.execute("SHOW TABLES").fetchall()
        return [r[0] for r in result]

    def get_schema(self, table: str) -> str:
        """Get schema of a cached table."""
        result = self.conn.execute(f"DESCRIBE {table}").fetchall()
        return "\n".join([f"{r[0]}: {r[1]}" for r in result])
```

## Adding Custom Tools

### Example: Create Geofence Tool

```python
@server.tool()
async def create_geofence(
    name: str,
    latitude: float,
    longitude: float,
    radius_meters: int = 500
) -> str:
    """
    Create a circular geofence zone around a location.

    Args:
        name: Name for the zone
        latitude: Center latitude
        longitude: Center longitude
        radius_meters: Radius in meters (default 500)
    """
    import math

    # Generate circle points
    points = []
    for i in range(36):
        angle = math.radians(i * 10)
        # Approximate meters to degrees
        lat_offset = (radius_meters / 111320) * math.cos(angle)
        lon_offset = (radius_meters / (111320 * math.cos(math.radians(latitude)))) * math.sin(angle)
        points.append({
            'x': longitude + lon_offset,
            'y': latitude + lat_offset
        })

    # Use direct Geotab API (not Ace) for write operations
    zone_data = {
        'name': name,
        'points': points,
        'displayed': True,
        'activeFrom': datetime.now().isoformat(),
        'activeTo': '2099-12-31T00:00:00Z'
    }

    api = get_geotab_api()  # Direct API client
    result = api.add('Zone', zone_data)
    return f"Created zone '{name}' with ID: {result}"
```

### Example: Send Slack Alert Tool

```python
@server.tool()
async def send_fleet_alert(
    channel: str,
    message: str
) -> str:
    """
    Send a fleet alert to a Slack channel.

    Args:
        channel: Slack channel name (e.g., #fleet-alerts)
        message: Alert message to send
    """
    import httpx

    webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    if not webhook_url:
        return "Error: SLACK_WEBHOOK_URL not configured"

    async with httpx.AsyncClient() as client:
        response = await client.post(webhook_url, json={
            'channel': channel,
            'text': message
        })

    if response.status_code == 200:
        return f"Alert sent to {channel}"
    else:
        return f"Failed to send alert: {response.text}"
```

### Example: Export to CSV Tool

```python
@server.tool()
async def export_to_csv(
    table_name: str,
    output_path: str
) -> str:
    """
    Export a cached DuckDB table to CSV file.

    Args:
        table_name: Name of the cached table
        output_path: Where to save the CSV
    """
    db = DuckDBManager()
    db.conn.execute(f"COPY {table_name} TO '{output_path}' (HEADER, DELIMITER ',')")
    return f"Exported {table_name} to {output_path}"
```

## Ace vs Direct API Decision

Use this logic when deciding which to use:

| Query Type | Use | Reason |
|------------|-----|--------|
| "Get vehicle X location" | Direct API | Real-time, simple |
| "Which vehicles need maintenance?" | Ace | AI analysis |
| "Create a zone at X" | Direct API | Write operation |
| "Fuel efficiency trend" | Ace | Complex aggregation |
| "Get all trips today" | Direct API | Simple retrieval |
| "Compare drivers" | Ace | Cross-entity analysis |
| "Update device name" | Direct API | Write operation |
| "Why are costs increasing?" | Ace | Insight generation |

## Error Handling

```python
from mcp.types import McpError

@server.tool()
async def robust_query(question: str) -> str:
    """Query with comprehensive error handling."""
    try:
        client = GeotabAceClient()
        await client.authenticate()
    except AuthenticationError:
        raise McpError("Authentication failed. Check credentials in .env file.")
    except ConnectionError:
        raise McpError("Cannot connect to Geotab. Check network and server address.")

    try:
        result = await client.ask_question(question)
    except TimeoutError:
        raise McpError("Query timed out. Try a simpler question or use async query.")
    except Exception as e:
        raise McpError(f"Query failed: {str(e)}")

    return format_response(result)
```

## Testing

### Test Connection

```bash
uv run python geotab_ace.py --test
```

### Test MCP Server Locally

```bash
# Run server in test mode
uv run python -c "
from geotab_mcp_server import server
import asyncio

async def test():
    result = await server.call_tool('geotab_test_connection', {})
    print(result)

asyncio.run(test())
"
```

### Verify Claude Desktop Integration

1. Restart Claude Desktop after config changes
2. Check MCP tools list shows "geotab-ace"
3. Ask: "Test my Geotab connection"
4. Ask: "How many vehicles do I have?"

## Troubleshooting

### MCP Not Appearing in Claude

1. Verify path in config is absolute
2. Check JSON syntax in config file
3. Fully quit and restart Claude Desktop
4. Check Claude's MCP logs

### Authentication Failures

```python
# Debug authentication
import os
from dotenv import load_dotenv

load_dotenv()

print(f"Username: {os.getenv('GEOTAB_API_USERNAME')}")
print(f"Database: {os.getenv('GEOTAB_API_DATABASE')}")
print(f"Password set: {'Yes' if os.getenv('GEOTAB_API_PASSWORD') else 'No'}")
```

### Query Timeouts

- Ace queries can take 60+ seconds
- Use async queries for complex analysis
- Simplify questions if timing out

### DuckDB Issues

```python
# Reset cache if corrupted
import os
os.remove('cache.duckdb')
```

## Resources

- **Repository:** [github.com/fhoffa/geotab-ace-mcp-demo](https://github.com/fhoffa/geotab-ace-mcp-demo)
- **MCP Specification:** [modelcontextprotocol.io](https://modelcontextprotocol.io/)
- **MCP Server Guide:** [guides/CUSTOM_MCP_GUIDE.md](../../guides/CUSTOM_MCP_GUIDE.md)
- **Geotab API Reference:** [geotab.github.io/sdk/software/api/reference/](https://geotab.github.io/sdk/software/api/reference/)
