# Task 01: Authentication Examples

## Goal
Create basic authentication examples that students will use in the first 15 minutes of the tutorial.

## What to Build

### File 1: `basic_auth.py`
**Purpose:** Simplest possible authentication script

**Requirements:**
- Load credentials from root `.env` file using python-dotenv
- Use the `mygeotab` library to authenticate
- Print success message with database name
- Handle authentication errors gracefully
- Show session information if available

**Example Output:**
```
✓ Successfully authenticated to database: demo_database
✓ Session ID: abc123...
✓ Server: my.geotab.com
```

**Vibe Prompt to Use:**
```
Create a Python script that:
1. Loads Geotab credentials from a .env file in the parent directory
2. Uses the mygeotab library to authenticate
3. Prints a success message with database name and session info
4. Handles authentication errors with helpful messages
5. Follows best practices for credential management
```

### File 2: `auth_with_class.py`
**Purpose:** Reusable authentication class for other examples

**Requirements:**
- Create a `GeotabClient` class that handles authentication
- Store authenticated session for reuse
- Implement auto-reconnect if session expires
- Add methods: `connect()`, `is_connected()`, `disconnect()`
- Include docstrings and type hints

**Example Usage:**
```python
from auth_with_class import GeotabClient

client = GeotabClient()
client.connect()
print(f"Connected: {client.is_connected()}")
```

### File 3: `test_connection.py`
**Purpose:** Diagnostic script to verify credentials and connection

**Requirements:**
- Test authentication
- Try a simple API call (like Get Device count)
- Report connection speed/latency
- Verify API is responding correctly
- Provide troubleshooting tips if connection fails

**Example Output:**
```
Testing Geotab Connection...
✓ Credentials loaded from .env
✓ Authentication successful (124ms)
✓ API responding correctly
✓ Found 15 devices in database
✓ Connection test passed!
```

## Additional Files Needed

### `requirements.txt`
```
mygeotab>=0.8.0
python-dotenv>=1.0.0
```

### `README.md`
Include:
- What these scripts do
- How to install dependencies
- How to run each script
- Expected output
- Common troubleshooting (wrong credentials, network issues)
- Link to Geotab authentication docs

## Testing Checklist
- [ ] Scripts work with actual credentials from `.env`
- [ ] Error messages are helpful for beginners
- [ ] Code is well-commented
- [ ] All scripts handle common errors (wrong password, network timeout)
- [ ] README has clear setup instructions

## Success Criteria
A complete beginner should be able to:
1. Read the README
2. Install requirements
3. Run `basic_auth.py`
4. See successful authentication
5. Understand what happened

## Notes
- This is the foundation for all other examples
- Keep it VERY simple and beginner-friendly
- Over-explain in comments - assume students are new to APIs
- Test with actual Geotab demo account
