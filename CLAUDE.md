# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an educational curriculum and starter kit for teaching developers to build fleet management applications using the Geotab API with "vibe coding" (AI-assisted development). It provides tutorials, code examples, and ready-made prompts for hackathons and developer onboarding.

**Primary languages:** JavaScript (Add-Ins), API-first workflows

## Repository Structure

- `guides/` - Human-readable documentation, tutorials, and prompts
- `examples/addins/` - Geotab Add-In templates (HTML/JS for MyGeotab)
- `skills/` - Code patterns for AI implementation
- `AGENT_SUMMARY.md` - Canonical orientation for AI assistants
- `VIBE_CODING_CONTEXT.md` - Quick reference for AI assistants (~400 tokens)

## Key Entry Points

| Audience | Start Here |
|----------|-----------|
| AI assistants needing repo orientation | `AGENT_SUMMARY.md` |
| AI assistants choosing implementation skill | `skills/README.md` |
| AI assistants needing API context | `VIBE_CODING_CONTEXT.md` |
| Building dashboard workflows | `guides/ANTIGRAVITY_QUICKSTART.md` |
| Understanding Add-Ins | `guides/GEOTAB_ADDINS.md` |
| Human learners | `README.md` → choose a path |

### Credentials
All scripts load credentials from `.env` in the repository root:
```
GEOTAB_DATABASE=database_name
GEOTAB_USERNAME=email@domain.com
GEOTAB_PASSWORD=password
GEOTAB_SERVER=my.geotab.com
```

**Critical rules:**
- Never hardcode credentials
- Add `.env` to `.gitignore`
- Call `load_dotenv()` before any `os.getenv()`
- No quotes in .env values unless password has spaces
- Test credentials ONCE before loops (failed auth locks account 15-30min)

## Geotab API Pattern

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

# Subsequent calls
resp = requests.post(url, json={"method": "Get", "params": {
    "typeName": "Device", "credentials": creds
}})
```

Common TypeNames: `Device`, `Trip`, `User`, `StatusData`, `LogRecord`, `FuelTransaction`, `Route`, `Zone`, `Group`, `Diagnostic`

API Reference: https://geotab.github.io/sdk/software/api/reference/

## Code Standards

When writing code examples or snippets:
- Follow language style guides and keep Add-In snippets ES5-compatible
- Add clear comments and error handling
- Keep examples beginner-friendly

## Documentation Style

This is educational content. When writing documentation:
- Use narrative, conversational tone
- Target beginners who may be new to coding
- Explain concepts, don't assume knowledge
- Include ready-made prompts users can copy-paste to AI tools
