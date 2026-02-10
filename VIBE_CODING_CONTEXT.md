# Geotab API - Vibe Coding Context

> **Quick reference card** for experienced developers and AI assistants. Minimal tokens, maximum clarity.
>
> **Need more details?** See [API_REFERENCE_FOR_AI.md](./guides/API_REFERENCE_FOR_AI.md) for setup instructions, troubleshooting, and common mistakes.

## Documentation Structure

| `guides/` | `skills/` |
|-----------|-----------|
| Prompts & concepts (for humans) | Code patterns (for AI implementation) |

**Guides = conversational, prompt-focused.** **Skills = technical, code-focused.**

## Connection Pattern (Required)

```python
from dotenv import load_dotenv
import os, requests
load_dotenv()

url = f"https://{os.getenv('GEOTAB_SERVER')}/apiv1"
auth = requests.post(url, json={"method": "Authenticate", "params": {
    "database": os.getenv('GEOTAB_DATABASE'),
    "userName": os.getenv('GEOTAB_USERNAME'),
    "password": os.getenv('GEOTAB_PASSWORD')
}})
creds = auth.json()["result"]["credentials"]

# All subsequent calls
resp = requests.post(url, json={"method": "Get", "params": {
    "typeName": "Device", "credentials": creds
}})
data = resp.json()["result"]
```

## .env File (Root Directory)

```
GEOTAB_DATABASE=database_name
GEOTAB_USERNAME=email@domain.com
GEOTAB_PASSWORD=password
GEOTAB_SERVER=my.geotab.com
```

## API Methods

- `Get` - Retrieve entities: `{"method": "Get", "params": {"typeName": "Device", "credentials": creds}}`
- `Add` - Create entity: `{"method": "Add", "params": {"typeName": "Device", "entity": {...}, "credentials": creds}}`
- `Set` - Update entity: `{"method": "Set", "params": {"typeName": "Device", "entity": {...}, "credentials": creds}}`
- `Remove` - Delete entity: `{"method": "Remove", "params": {"typeName": "Device", "entity": {...}, "credentials": creds}}`

## Common TypeNames

`Device` `Trip` `User` `StatusData` `LogRecord` `FuelTransaction` `Route` `Zone` `Group` `Diagnostic`

## Geotab Ace (AI-Powered Queries)

For complex questions ("Which drivers need coaching?", "Fuel efficiency trend"), use **Geotab Ace** instead of direct API. Ace takes 10-60 seconds but provides AI-powered analysis.

**MCP Integration:** For conversational fleet access via Claude Desktop, see [CUSTOM_MCP_GUIDE.md](./guides/CUSTOM_MCP_GUIDE.md)

## Data Connector (OData Analytics)

For pre-aggregated fleet KPIs (daily/monthly distance, fuel, idle time, safety scores), use the **Data Connector** OData endpoint instead of raw API calls. HTTP Basic Auth, no SDK needed.

**Skill reference:** [skills/geotab/references/DATA_CONNECTOR.md](./skills/geotab/references/DATA_CONNECTOR.md) | **Human guide:** [guides/DATA_CONNECTOR.md](./guides/DATA_CONNECTOR.md)

## Critical Rules

1. **NEVER hardcode credentials** - Always use .env with python-dotenv
2. **Test credentials ONCE** - Failed auth locks account 15-30min
3. **Add .env to .gitignore** - Security first
4. **No quotes in .env values** - Unless password has spaces
5. **Call load_dotenv() first** - Before any os.getenv()

## Dependencies

```bash
pip install python-dotenv requests
```

## Quick Test

```python
# Verify .env loaded correctly (run ONCE before loops)
print(f"DB: {os.getenv('GEOTAB_DATABASE')}, User: {os.getenv('GEOTAB_USERNAME')}")
```

## API Docs

https://geotab.github.io/sdk/software/api/reference/
