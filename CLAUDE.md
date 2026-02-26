# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an educational curriculum and starter kit for teaching developers to build fleet management applications using the Geotab API with "vibe coding" (AI-assisted development). It provides tutorials, code examples, and ready-made prompts for hackathons and developer onboarding.

**Primary languages:** JavaScript (Add-Ins), API-first workflows

## Repository Structure

- `guides/` - Human-readable documentation, tutorials, and prompts
- `examples/addins/` - Geotab Add-In templates (HTML/JS for MyGeotab)
- `skills/` - Code patterns for AI implementation
- `tests/` - Validation test suites (run before committing)
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

## Pre-Commit Tests

Before committing changes, run the relevant test suites:

```bash
# Gem validation — run after any change to resources/GEM_INSTRUCTIONS.txt,
# guides/GOOGLE_GEM_CREATOR_GUIDE.md, or Add-In example configs
bash tests/gem-validation/run.sh
```

All tests must pass before pushing. If a test fails, fix the issue and re-run.

### LLM review checklist

After editing `resources/GEM_INSTRUCTIONS.txt`, also read `tests/gem-review/REVIEW_CHECKLIST.md` and verify each question against the instructions. The checklist covers behavioral, correctness, completeness, and tone — things a regex can't catch.

## Verifying API Examples

When editing or debugging Geotab API code examples, check whether credentials are available as environment variables (`GEOTAB_DATABASE`, `GEOTAB_USERNAME`, `GEOTAB_PASSWORD`, `GEOTAB_SERVER`). If they are, **test the API call against the live API** before committing. This catches silent failures — the Geotab API often ignores invalid search parameters without returning an error, so the only way to verify correctness is to check the actual response (e.g., record count, expected fields).

Quick smoke-test pattern:
```bash
# Check if credentials are available
env | grep -q GEOTAB_DATABASE && echo "Credentials available" || echo "No credentials"
```

```python
import json, requests, os
url = f"https://{os.environ['GEOTAB_SERVER']}/apiv1"
auth = requests.post(url, json={"method": "Authenticate", "params": {
    "database": os.environ["GEOTAB_DATABASE"],
    "userName": os.environ["GEOTAB_USERNAME"],
    "password": os.environ["GEOTAB_PASSWORD"]
}})
creds = auth.json()["result"]["credentials"]

# Then test the specific API call and verify the response makes sense
resp = requests.post(url, json={"method": "Get", "params": {
    "typeName": "Device", "credentials": creds, "search": {"resultsLimit": 1}
}})
print(json.dumps(resp.json()["result"][0], indent=2))
```

## Code Standards

When writing code examples or snippets:
- Follow language style guides
- Add clear comments and error handling
- Keep examples beginner-friendly

## Documentation Style

This is educational content. When writing documentation:
- Use narrative, conversational tone
- Target beginners who may be new to coding
- Explain concepts, don't assume knowledge
- Include ready-made prompts users can copy-paste to AI tools
