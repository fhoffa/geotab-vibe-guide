# Geotab API Reference for AI Coding Tools

> **Complete guide** with setup, troubleshooting, and common mistakes. Perfect for first-time setup or debugging.
>
> **Already know the basics?** Use [VIBE_CODING_CONTEXT.md](../VIBE_CODING_CONTEXT.md) as a quick reference instead.

## Setup (2 minutes)

**1. Create `.env` file in project root:**
```bash
GEOTAB_DATABASE=your_database_name
GEOTAB_USERNAME=your_email@domain.com
GEOTAB_PASSWORD=your_password
GEOTAB_SERVER=my.geotab.com
```

**2. Add to `.gitignore`:**
```bash
echo ".env" >> .gitignore
```

**3. Install dependencies:**
```bash
pip install python-dotenv requests
```

## Code (Copy-Paste Ready)

```python
from dotenv import load_dotenv
import os
import requests

load_dotenv()

# Authenticate
url = f"https://{os.environ.get('GEOTAB_SERVER')}/apiv1"
response = requests.post(url, json={
    "method": "Authenticate",
    "params": {
        "database": os.environ.get('GEOTAB_DATABASE'),
        "userName": os.environ.get('GEOTAB_USERNAME'),
        "password": os.environ.get('GEOTAB_PASSWORD')
    }
})

result = response.json()
credentials = result["result"]["credentials"]

# Get devices
response = requests.post(url, json={
    "method": "Get",
    "params": {
        "typeName": "Device",
        "credentials": credentials
    }
})

devices = response.json()["result"]
print(f"Found {len(devices)} devices")
```

## For AI Tools: Connection Pattern

```python
# STANDARD PATTERN - Use this for all Geotab API calls:
# 1. Load .env
from dotenv import load_dotenv
import os
load_dotenv()

# 2. Authenticate once
auth_response = requests.post(f"https://{os.environ.get('GEOTAB_SERVER')}/apiv1", json={
    "method": "Authenticate",
    "params": {
        "database": os.environ.get('GEOTAB_DATABASE'),
        "userName": os.environ.get('GEOTAB_USERNAME'),
        "password": os.environ.get('GEOTAB_PASSWORD')
    }
})
credentials = auth_response.json()["result"]["credentials"]

# 3. Use credentials for all subsequent calls
response = requests.post(url, json={
    "method": "Get",
    "params": {
        "typeName": "Device",  # or Trip, User, etc.
        "credentials": credentials
    }
})
```

## Test First

Before running any loops or repeated calls, test your credentials once:

```bash
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print('Password length:', len(os.environ.get('GEOTAB_PASSWORD', '')))"
```

Expected: Your actual password length. If `0` or wrong, check `.env` file.

⚠️ **Multiple failed logins lock your account for 15-30 minutes!**

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Hardcoding passwords | Security risk | Use `.env` file |
| Committing `.env` | Exposes credentials | Add to `.gitignore` first |
| Forgetting `load_dotenv()` | Empty env vars | Call before reading vars |
| Using quotes in `.env` | Includes quotes in value | Don't quote values |
| `export PASS="pw$123"` | Shell truncates at `$` | Use `.env` file instead |
| Testing in loop | Account lockout | Test once before loops |

## No Quotes in .env

```bash
# ❌ WRONG
GEOTAB_PASSWORD="mypass123"

# ✅ CORRECT
GEOTAB_PASSWORD=mypass123

# Exception: Only quote if password has spaces
GEOTAB_PASSWORD="my pass 123"
```

## Available API Methods

Common operations (use same credential pattern):

```python
# Get all devices
{"method": "Get", "params": {"typeName": "Device", "credentials": credentials}}

# Get trips for a device
{"method": "Get", "params": {"typeName": "Trip", "credentials": credentials}}

# Get users
{"method": "Get", "params": {"typeName": "User", "credentials": credentials}}

# Add device
{"method": "Add", "params": {"typeName": "Device", "entity": {...}, "credentials": credentials}}
```

## Troubleshooting

**Authentication Failed:**
- Database name is case-sensitive
- Check password has no typos
- Verify you can log in at https://my.geotab.com/

**Account Locked:**
- Wait 15-30 minutes
- Don't retry in a loop
- Test credentials once before automated calls

**Empty Environment Variables:**
- Run `load_dotenv()` before accessing `os.environ`
- Ensure `.env` file is in current working directory
- Check file is named exactly `.env` (not `.env.txt`)

## Next Steps

- **Full API Reference:** https://geotab.github.io/sdk/software/api/reference/
- **SDK Guide:** https://geotab.github.io/sdk/software/guides/concepts/
- **Code Samples:** https://github.com/Geotab/sdk

## For Humans: Get Credentials

Don't have a Geotab account?

1. Visit https://my.geotab.com/registration.html
2. Create a free demo account
3. Check email for confirmation
4. Find your database name in the URL: `my.geotab.com/login.html?database=YOUR_DATABASE`
5. Use your email as username
6. Server is `my.geotab.com`

## Other Data Channels

The API is the fastest and most flexible way to get fleet data, but it's not the only one. See [DATA_ACCESS_COMPARISON.md](./DATA_ACCESS_COMPARISON.md) for a benchmark of the API vs the OData Data Connector (pre-aggregated KPIs) vs Geotab Ace (natural language queries).
