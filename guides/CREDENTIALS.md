# Geotab Credentials Setup

## For the Human (You)

You need to create a `.env` file in the repository root with your Geotab API credentials.

### Step 1: Get Your Credentials

If you don't have a Geotab account yet:
1. Go to https://my.geotab.com/registration.html
2. **Click "Create a Demo Database"** (not "I'm a New Customer") — this gives you pre-populated sample data
3. Fill out the form to complete registration
4. **Check your email and click the verification link** before trying to log in — you'll get an "Invalid user name or password" error if you skip this step
5. Log in to MyGeotab
6. Note your credentials:
   - **Database name** (shown in URL: my.geotab.com/login.html?database=YOUR_DATABASE)
   - **Username** (your email address)
   - **Password** (what you chose during registration)
   - **Server** (usually `my.geotab.com` for demo accounts)

### Step 2: Create .env File

In the **root** of this repository (`geotab_vibe_draft/`), create a file named `.env`:

```bash
# Option A: Copy from template
cp .env.example .env

# Option B: Create manually
nano .env  # or use any text editor
```

### Step 3: Fill in Your Credentials

Edit the `.env` file and replace the placeholder values:

```env
# Geotab API Credentials
GEOTAB_DATABASE=your_actual_database_name_here
GEOTAB_USERNAME=your_email@example.com
GEOTAB_PASSWORD=your_actual_password_here
GEOTAB_SERVER=my.geotab.com
```

**Important:**
- Database name is **case-sensitive**
- No quotes needed around values
- No spaces around the `=` sign
- This file will NOT be committed to git (it's in .gitignore)

### Step 4: Verify It Works

Test your credentials:

```bash
# Install Python requirements
pip install mygeotab python-dotenv

# Create a quick test script
python3 << 'EOF'
from dotenv import load_dotenv
from mygeotab import API
import os

load_dotenv()

database = os.getenv('GEOTAB_DATABASE')
username = os.getenv('GEOTAB_USERNAME')
password = os.getenv('GEOTAB_PASSWORD')
server = os.getenv('GEOTAB_SERVER')

print(f"Testing connection to {database}...")

api = API(username=username, password=password, database=database, server=server)
api.authenticate()

print("✓ Authentication successful!")
print(f"✓ Connected to: {database}")
print(f"✓ Server: {server}")

# Try fetching vehicle count
devices = api.get('Device')
print(f"✓ Found {len(devices)} vehicles in database")
EOF
```

If you see:
```
✓ Authentication successful!
✓ Connected to: your_database
✓ Server: my.geotab.com
✓ Found 15 vehicles in database
```

**You're all set!** ✅

### Step 5: For the Agent

Once the `.env` file is created and tested, the agent (that will build the Python examples) can access these credentials automatically. All example scripts are designed to load from this `.env` file.

## Troubleshooting

### "Authentication failed"
- ✓ **Did you verify your email?** After creating your account, you must click the verification link in your email before you can log in
- ✓ Check database name (case-sensitive!)
- ✓ Verify username (usually your email)
- ✓ Double-check password (no typos)
- ✓ Ensure server is `my.geotab.com`
- ✓ Try logging into https://my.geotab.com/ manually first

### "Connection timeout"
- ✓ Check your internet connection
- ✓ Verify firewall isn't blocking HTTPS
- ✓ Try again (might be temporary network issue)

### "Module not found"
- ✓ Install required packages: `pip install mygeotab python-dotenv`
- ✓ Check you're using Python 3.8+

### ".env file not found"
- ✓ Ensure `.env` is in the repository root (same folder as README.md)
- ✓ Check filename is exactly `.env` (not `env` or `.env.txt`)
- ✓ Use `ls -la` to verify file exists (it starts with a dot!)

## Security Notes

✅ **The `.env` file is in `.gitignore`** - it will never be committed to git

✅ **Safe to use locally** - credentials stay on your machine

✅ **For demo accounts only** - don't use production credentials

⚠️ **Never commit credentials** - always use environment variables

## Alternative: Direct Credentials (Not Recommended)

If you have trouble with `.env`, you can provide credentials directly to the agent:

```
Database: your_database_name
Username: your_email@example.com
Password: your_password
Server: my.geotab.com
```

But the `.env` approach is better because it's:
- More secure
- Reusable across all examples
- Industry best practice
- Already set up in all example code

---

**Once your `.env` file is working, you're ready to delegate the Python example building to an agent!**
