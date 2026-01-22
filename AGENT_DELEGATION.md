# Agent Delegation Instructions

## Mission Overview

You are tasked with building Python code examples for a Geotab vibe coding tutorial. This repository contains complete design documentation, and now needs working code examples.

## Your Access

You will have access to:
- Geotab API credentials in a `.env` file
- This repository with all documentation
- Internet for installing packages and researching

## What to Build

Build Python examples in the `examples/python/` directory. There are **6 folders** with detailed task instructions:

### 1. `01_authentication/` - Basic authentication scripts
- Read `examples/python/01_authentication/TASK.md`
- Build: basic_auth.py, auth_with_class.py, test_connection.py
- **Start here** - this is the foundation for everything else

### 2. `02_fetch_data/` - Data fetching examples
- Read `examples/python/02_fetch_data/TASK.md`
- Build: get_vehicles.py, get_trips.py, get_locations.py, get_diagnostics.py, get_fault_codes.py

### 3. `03_cli_dashboard/` - Command-line dashboards
- Read `examples/python/03_cli_dashboard/TASK.md`
- Build: dashboard.py, vehicle_detail.py, trip_reporter.py, alerts.py

### 4. `04_web_dashboard/` - Web-based dashboard
- Read `examples/python/04_web_dashboard/TASK.md`
- Build: Flask/FastAPI app with map, trips, vehicle details

### 5. `05_ace_integration/` - Geotab Ace API examples
- Read `examples/python/05_ace_integration/TASK.md`
- Build: ace_client.py, chatbot.py, maintenance_predictor.py, smart_insights.py
- **NOTE:** If Ace API unavailable, create mocks as instructed

### 6. `06_complete_apps/` - Full hackathon-ready applications
- Read `examples/python/06_complete_apps/TASK.md`
- Build: EcoFleet (carbon tracker), SafeDrive (safety coach), FleetBot (chat integration)

## Key Files

- **`examples/python/BUILD_INSTRUCTIONS.md`** - Overall context and standards
- Each folder has a **`TASK.md`** - Specific requirements for that folder
- **`.env`** in root - Your Geotab credentials (will be provided)

## Work Order

**Sequential approach (recommended):**
1. Start with folder 01 (authentication)
2. Test thoroughly
3. Move to folder 02 (fetch data)
4. Continue through folders 03-06

**Why sequential?**
- Later examples depend on earlier ones
- You'll learn the API as you go
- Easier to debug incrementally

## Standards & Requirements

### Code Quality
- ✅ Follow PEP 8 style guide
- ✅ Add type hints where appropriate
- ✅ Include docstrings for functions/classes
- ✅ Add inline comments for complex logic
- ✅ Keep code beginner-friendly (for tutorial use)

### Testing
- ✅ Test every script with real Geotab credentials
- ✅ Verify scripts return actual data
- ✅ Test error handling (invalid inputs, API failures)
- ✅ Ensure examples work end-to-end

### Documentation
- ✅ Create README.md in each folder
- ✅ Include setup instructions
- ✅ Show example usage and output
- ✅ Document any limitations or known issues

### Dependencies
- ✅ Create requirements.txt in each folder
- ✅ Use modern, maintained libraries
- ✅ Pin versions for reproducibility

## Credentials Setup

The `.env` file in the repository root contains:
```
GEOTAB_DATABASE=your_database_name
GEOTAB_USERNAME=your_username
GEOTAB_PASSWORD=your_password
GEOTAB_SERVER=my.geotab.com
```

All scripts should load credentials using:
```python
from dotenv import load_dotenv
import os

load_dotenv()  # Loads from .env in current or parent directories

database = os.getenv('GEOTAB_DATABASE')
username = os.getenv('GEOTAB_USERNAME')
password = os.getenv('GEOTAB_PASSWORD')
server = os.getenv('GEOTAB_SERVER')
```

## When You're Done

### 1. Self-Review Checklist
- [ ] All scripts run without errors
- [ ] Real data is returned from Geotab API
- [ ] Error handling works (try bad credentials, invalid vehicle names)
- [ ] READMEs are clear and complete
- [ ] Code is well-commented
- [ ] requirements.txt files are complete

### 2. Update Main README
Edit `examples/python/README.md` to describe what you built:
- List all examples created
- Show quick start commands
- Note any limitations
- Add screenshots or example output if possible

### 3. Document Issues
If you encountered any problems:
- Document in ISSUES.md at `examples/python/ISSUES.md`
- Include: what didn't work, why, potential solutions
- Note any API limitations discovered

### 4. Commit Your Work
```bash
git add examples/python/
git commit -m "Add Python examples for Geotab tutorial

- Authentication examples (basic, class-based, testing)
- Data fetching (vehicles, trips, locations, diagnostics, faults)
- CLI dashboard with real-time monitoring
- Web dashboard with Flask and interactive map
- Ace API integration (or mocks if unavailable)
- Complete apps: EcoFleet, SafeDrive, FleetBot

All examples tested with real Geotab demo account.
"
git push
```

## Tips for Success

### 1. Start Simple
- Get basic auth working first
- Test with simplest API call (Get Device)
- Build complexity incrementally

### 2. Use Vibe Coding
- Each TASK.md includes "Vibe Prompts"
- Use these with your AI assistant
- Iterate on generated code until it works

### 3. Test Frequently
- Run each script as you write it
- Don't move to next script until current one works
- Verify output makes sense

### 4. Read Geotab Docs
- API Reference: https://geotab.github.io/sdk/software/api/reference/
- Python SDK: https://github.com/geotab/mygeotab-python
- Use docs to understand data structures

### 5. Handle Errors Gracefully
- Network failures
- Invalid credentials
- API rate limiting
- Empty results (no vehicles, no trips)
- Invalid input parameters

### 6. Make It Tutorial-Friendly
- Over-comment rather than under-comment
- Use clear variable names
- Show example output in comments
- Provide helpful error messages

## Example Workflow

Here's how you might approach folder 01:

```bash
# 1. Read the task
cd examples/python/01_authentication
cat TASK.md

# 2. Create basic_auth.py
# Use vibe prompt from TASK.md with your AI assistant
# Test it:
python basic_auth.py

# 3. If errors, debug and fix
# Verify credentials, check API endpoint, etc.

# 4. Once working, move to auth_with_class.py
# Build on what you learned

# 5. Create test_connection.py
# Use the class from step 4

# 6. Write README.md
# Document what you built and how to use it

# 7. Create requirements.txt
# List all dependencies with versions

# 8. Move to next folder
cd ../02_fetch_data
cat TASK.md
# Repeat process...
```

## Questions or Stuck?

### If Credentials Don't Work
- Verify .env file exists in repository root
- Check database name is case-sensitive
- Ensure server is "my.geotab.com" for demo accounts
- Try manual authentication in Python REPL first

### If API Calls Fail
- Check network connectivity
- Verify API method names (case-sensitive)
- Read error messages carefully
- Check Geotab SDK docs for correct parameters

### If Ace API Unavailable
- Create mock responses as instructed in Task 05
- Document that real implementation needs separate credentials
- Focus on structure and UX, not real AI features

### If You Need Clarification
- Make reasonable assumptions
- Document your assumptions in README
- Proceed with what makes sense
- Note questions in ISSUES.md

## Success Criteria

You'll know you're successful when:
1. ✅ A beginner can follow README and run every example
2. ✅ All examples return real data from Geotab
3. ✅ Error handling prevents confusing crashes
4. ✅ Code is clean, commented, and tutorial-appropriate
5. ✅ You'd be proud to demo these examples yourself

## Time Estimate

- Folder 01: 1-2 hours
- Folder 02: 2-3 hours
- Folder 03: 3-4 hours
- Folder 04: 4-6 hours
- Folder 05: 2-3 hours (or 1 hour if mocking)
- Folder 06: 6-8 hours

**Total: 18-26 hours** for all examples

You can prioritize:
- **Minimum viable:** Folders 01, 02, 03 (core functionality)
- **Recommended:** Add folder 04 (web dashboard)
- **Complete:** All 6 folders (hackathon-ready)

## Final Notes

- This is high-impact work - these examples will teach many developers
- Quality over speed - make it work correctly
- Think like a teacher - explain, don't just code
- Have fun! You're building cool stuff with real APIs

**Good luck! The Geotab API is powerful and well-designed. You've got this! 🚀**

---

*Questions? Issues? Document them in `examples/python/ISSUES.md`*
