# Geotab API Reference Card

> **Quick reference for AI coding assistants**

## Authentication Pattern (Use This Always)

```python
from dotenv import load_dotenv
import os
import requests

load_dotenv()

url = f"https://{os.environ.get('GEOTAB_SERVER')}/apiv1"
auth = requests.post(url, json={
    "method": "Authenticate",
    "params": {
        "database": os.environ.get('GEOTAB_DATABASE'),
        "userName": os.environ.get('GEOTAB_USERNAME'),
        "password": os.environ.get('GEOTAB_PASSWORD')
    }
})
creds = auth.json()["result"]["credentials"]
```

## API Call Pattern

```python
response = requests.post(url, json={
    "method": "Get",  # or Add, Set, Remove
    "params": {
        "typeName": "Device",  # or Trip, User, etc.
        "credentials": creds
    }
})
data = response.json()["result"]
```

## Required .env File

```bash
GEOTAB_DATABASE=database_name
GEOTAB_USERNAME=email@domain.com
GEOTAB_PASSWORD=password
GEOTAB_SERVER=my.geotab.com
```

## Dependencies

```bash
pip install python-dotenv requests
```

## Common Type Names

- `Device` - Vehicles/assets
- `Trip` - Journey records
- `User` - System users
- `StatusData` - Diagnostic data
- `LogRecord` - GPS breadcrumbs
- `FuelTransaction` - Fuel events

## Full Reference

https://geotab.github.io/sdk/software/api/reference/
