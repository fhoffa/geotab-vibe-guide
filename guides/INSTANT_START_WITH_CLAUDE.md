# Geotab API - Instant Start (0 to Working Code in 60 Seconds)

> **For Claude Web Users:** This is the fastest path. No setup, no files, no installation required.

## What You Need

Just your Geotab credentials. That's it.

## Step 1: Share Your Credentials (10 seconds)

Copy this template, fill in your details, and paste it to Claude:

```
I want to explore the Geotab API. Here are my credentials:

Database: your_database_name
Username: your_email@domain.com
Password: your_password
Server: my.geotab.com

Help me connect and show me what data is available.
```

**What Claude will do:**
- Connect directly to your Geotab account
- Authenticate with the API
- Show you all available devices/vehicles
- Display summary statistics

**Expected output in 10 seconds:**
```
✓ Connected to Geotab
✓ Found 50 devices in your fleet
✓ Recent activity: 14,985 trips in last 7 days
✓ Total distance: 249 km
✓ Current status: 29 vehicles stationary, 21 in motion
```

## Step 2: Explore Your Data (20 seconds)

Ask Claude:

```
Show me specific examples from my fleet:
- 3 sample vehicles with their details
- Recent trip data for one vehicle
- Current GPS locations
```

**What you'll see:**
- Real vehicle names from your fleet
- Actual trip data with timestamps
- GPS coordinates and addresses
- Speed, distance, fuel data

## Step 3: Get Project Ideas (15 seconds)

Ask Claude:

```
Based on my actual fleet data, what are 3 compelling
projects I could build right now? Focus on what would
have the most business impact.
```

**Claude will suggest projects tailored to YOUR data:**
- If you have lots of trips → Route optimization
- If you have engine data → Predictive maintenance
- If you have driver behavior → Safety scoring
- Real estimates based on your data volume

## Step 4: Build Something (15 seconds)

Pick a project and say:

```
Let's build [PROJECT NAME]. Give me the complete code
that I can run locally. Include all authentication,
error handling, and comments.
```

**You'll get:**
- Complete Python/JavaScript file ready to run
- All API calls pre-configured
- Your credentials integrated securely
- Instructions to run it locally

## Complete Example Session

**You (10 sec):**
```
I want to explore Geotab API.

Database: demo_database
Username: demo@example.com
Password: Demo123!
Server: my.geotab.com

Show me what's available.
```

**Claude (responds in 10 sec):**
```
Connected! Your fleet overview:
- 47 vehicles across 3 groups
- 1,234 trips this week
- Top vehicle: "Truck-203" (43 trips)
- Fleet utilization: 67%
```

**You (5 sec):**
```
What should I build with this data?
```

**Claude (responds in 10 sec):**
```
Based on your fleet, I recommend:

1. Real-time Fleet Dashboard (High Impact)
   - Show live vehicle locations on map
   - Alert on idle vehicles > 30 min
   - Est. time: 30 min

2. Weekly Utilization Report (Quick Win)
   - Email report every Monday
   - Show most/least used vehicles
   - Est. time: 15 min

3. Fuel Efficiency Tracker (Cost Savings)
   - Track MPG per vehicle
   - Identify fuel wasters
   - Est. time: 45 min

Which interests you?
```

**You (5 sec):**
```
Build #1 - the real-time dashboard
```

**Claude (responds in 10 sec):**
```python
# fleet_dashboard.py - Complete working code
from dotenv import load_dotenv
import requests
import os
from datetime import datetime

# [Complete 60-line working script with your credentials,
#  map generation, live updates, error handling]
```

## Why This Is Faster

**Traditional approach:**
1. Create .env file (2 min)
2. Install dependencies (1 min)
3. Copy code example (30 sec)
4. Debug setup issues (5 min)
5. Test authentication (30 sec)
6. Start exploring data (finally!)

**Instant start approach:**
1. Paste credentials → Done in 60 seconds
2. Claude explores your data live
3. Get personalized project ideas
4. Receive complete working code

## What's Happening Behind the Scenes

When you share credentials with Claude on the web:

1. **Claude authenticates** directly with my.geotab.com
2. **Explores your data** - devices, trips, users, etc.
3. **Analyzes patterns** - what data you have most of
4. **Suggests projects** - tailored to your specific fleet
5. **Generates code** - with your credentials pre-configured

All without you installing anything or creating any files.

## After You Get the Code

Claude will give you complete code like this:

```python
# fleet_dashboard.py
from dotenv import load_dotenv
import requests
import os

# Your credentials (securely loaded)
load_dotenv()

# [Complete working code with authentication,
#  data fetching, visualization, error handling]
```

**To run it locally:**

```bash
# Create .env file
echo "GEOTAB_DATABASE=your_database" > .env
echo "GEOTAB_USERNAME=your_email" >> .env
echo "GEOTAB_PASSWORD=your_password" >> .env
echo "GEOTAB_SERVER=my.geotab.com" >> .env

# Install dependencies
pip install python-dotenv requests

# Run
python fleet_dashboard.py
```

## Security Note

**Sharing credentials with Claude is safe** because:
- Claude doesn't store your credentials between sessions
- All communication is encrypted (HTTPS)
- Claude uses credentials only to help you
- You can rotate passwords anytime at my.geotab.com

**Best practice:**
- Use a demo/test account for learning
- Rotate passwords after hackathons
- Use production credentials only when needed

## Common Questions

**Q: Do I need to install Python first?**
A: Not for the instant start! Claude explores the API for you in real-time. You only need Python when you want to run the code locally.

**Q: What if I don't have credentials yet?**
A: Create a free demo account at https://my.geotab.com/registration.html (takes 2 minutes)

**Q: Can I use this for Node.js instead of Python?**
A: Yes! Just ask Claude: "Give me the code in JavaScript/Node.js instead"

**Q: Will this work with other AI tools?**
A: This instant approach is designed for Claude on the web. For other tools, use [API_REFERENCE_FOR_AI.md](./API_REFERENCE_FOR_AI.md)

## Next Steps

After your instant start:

1. **Explore more data**: Ask Claude to show trips, diagnostics, fuel data, etc.
2. **Try different visualizations**: Request maps, charts, dashboards
3. **Build something unique**: Use [HACKATHON_IDEAS.md](./HACKATHON_IDEAS.md) for inspiration
4. **Learn the patterns**: Check [VIBE_CODING_CONTEXT.md](./VIBE_CODING_CONTEXT.md) for prompting tips

## Troubleshooting

**Claude says "I can't connect to external URLs":**
- Enable network access in Claude's settings
- Allow connection to my.geotab.com
- Try again

**Authentication fails:**
- Verify credentials at https://my.geotab.com/
- Database name is case-sensitive
- No quotes around password

**No data showing:**
- Your account might be brand new (no vehicles yet)
- Ask Claude to create sample/mock data to learn with
- Or use a demo account with pre-populated data

## More Copy-Paste Prompts

Want more prompts for specific use cases? Check out [CLAUDE_PROMPTS.md](./CLAUDE_PROMPTS.md) for:
- 10+ ready-to-use prompts
- Deep data exploration prompts
- Project building prompts
- Troubleshooting prompts
- Advanced use cases

## Ready?

Start now with this exact prompt:

```
I want to explore the Geotab API and build something cool.

Database: [your_database]
Username: [your_email]
Password: [your_password]
Server: my.geotab.com

Connect to my fleet, show me what data I have, and suggest
3 project ideas I could build in the next hour.
```

Then sit back and watch Claude explore your fleet in real-time!

---

**Want the traditional setup instead?** See [CREDENTIALS.md](./CREDENTIALS.md)

**Teaching a workshop?** See [MINUTE_BY_MINUTE.md](./MINUTE_BY_MINUTE.md)

**Need more project ideas?** See [HACKATHON_IDEAS.md](./HACKATHON_IDEAS.md)
