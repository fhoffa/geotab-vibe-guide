# Python Examples - Build Instructions for Agent

## Context
You are building Python code examples for a Geotab vibe coding tutorial. You have access to Geotab API credentials stored in `.env` file at the root of this repository.

## Prerequisites
- Python 3.8+
- Access to `.env` file with Geotab credentials
- Install required packages: `pip install mygeotab python-dotenv requests`

## Your Mission
Build working Python examples in each numbered folder. Each folder has a `TASK.md` file with specific instructions.

## Order of Work
1. Start with `01_authentication` - get this working first
2. Then `02_fetch_data` - build on authentication
3. Then `03_cli_dashboard` - more complex
4. Then `04_web_dashboard` - web-based
5. Then `05_ace_integration` - if Ace API is available
6. Finally `06_complete_apps` - full applications

## Testing Requirements
- Test every script with the actual Geotab credentials from `.env`
- Verify scripts work and return real data
- Add error handling for common issues
- Include example output in comments or README

## Code Standards
- Use type hints where appropriate
- Add docstrings to functions
- Include inline comments for complex logic
- Follow PEP 8 style guide
- Keep code beginner-friendly (this is for tutorials)

## What to Create in Each Folder
Each folder should have:
- Working Python script(s)
- `README.md` with usage instructions
- `requirements.txt` with dependencies
- Example output or screenshots (as comments if CLI)

## Credentials Location
The `.env` file in the root directory contains:
```
GEOTAB_DATABASE=...
GEOTAB_USERNAME=...
GEOTAB_PASSWORD=...
GEOTAB_SERVER=my.geotab.com
```

All scripts should load credentials from this file using `python-dotenv`.

## When You're Done
- Test all scripts work end-to-end
- Verify error handling
- Update the main `examples/python/README.md` with what you built
- Document any issues or limitations you encountered

## Questions?
If something is unclear in a TASK.md file, make reasonable assumptions and document them in your README.

---

**Start with folder 01_authentication and work your way through sequentially.**
