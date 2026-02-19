# Geotab API - Instant Start (0 to Working Code in 60 Seconds)

> **For Claude Web Users:** This is the fastest path. No setup, no files, no installation required.

## What You Need

1. **Your Geotab credentials** (demo/test account only!)
2. **Claude with network egress access enabled** for `my.geotab.com`

### Enable Network Access to Geotab

Before Claude can connect to the Geotab API, you need to allow network egress to `my.geotab.com`:

1. Go to **Settings** > **Capabilities** in Claude
2. Find **Network egress** settings
3. Select **"Package managers and specific domains"**
4. Add `my.geotab.com` to your allowed domains list

> **Note:** If you have "All domains" enabled, this step is not needed. If network egress is disabled or set to "Package managers only", Claude won't be able to connect to Geotab.
>
> For more details, see [Claude's file and network capabilities](https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude).

## ⚠️ CRITICAL SECURITY WARNING

**NEVER share your production Geotab account credentials with Claude or any AI tool.**

**ONLY use this guide with:**
- ✅ Demo accounts (create free at https://my.geotab.com/registration.html — click **"Create a Demo Database"**, not "I'm a New Customer")
- ✅ Test/sandbox databases specifically created for development
- ✅ Disposable credentials that you can immediately delete after

**NEVER use:**
- ❌ Your production fleet management account
- ❌ Credentials with access to real company data
- ❌ Any account you can't immediately delete/rotate

**Why this matters:** When you share credentials with an AI tool, those credentials are processed by the AI service. While Claude doesn't intentionally store credentials between sessions, you should treat this the same as sharing your password with any third party - only do it with accounts that contain no sensitive data.

**For learning and hackathons:** Create a separate demo account or ask your IT team for test environment credentials specifically for this purpose.

> [!TIP]
> **See Claude + Geotab in action:** In our [kickoff webinar (22:40)](https://www.youtube.com/watch?v=Zuazi88lBeg&t=1360), Felipe uses Claude Code to rename 50 vehicles and create drivers — all through the Geotab API in real time.

## Step 1: Give Claude the Geotab Skill (10 seconds)

Before asking questions, give Claude the knowledge to work with the Geotab API. Pick the method that matches your setup:

**Claude.ai (quickest)** — Copy-paste two files into your project knowledge:
1. Open your Claude project settings
2. Copy the contents of [`skills/geotab/SKILL.md`](https://github.com/fhoffa/geotab-vibe-guide/blob/main/skills/geotab/SKILL.md) — this is the main skill with navigation and patterns
3. Copy the contents of [`skills/geotab/references/API_QUICKSTART.md`](https://github.com/fhoffa/geotab-vibe-guide/blob/main/skills/geotab/references/API_QUICKSTART.md) — this covers authentication, entity types, and common API calls
4. That's enough to get started! Claude now knows the core Geotab API patterns

> **Want full context?** Clone the repo (`git clone https://github.com/fhoffa/geotab-vibe-guide.git`), then upload all files from `skills/geotab/` (including the `references/` folder) via the Claude.ai project UI. This gives Claude access to Add-In development, Zenith styling, Ace AI queries, and more.

**Claude Code** — Install via the plugin marketplace:
```
/plugin marketplace add fhoffa/geotab-vibe-guide
/plugin install geotab-skills@geotab-vibe-guide
```

**Quick alternative** — Copy-paste [VIBE_CODING_CONTEXT.md](../VIBE_CODING_CONTEXT.md) (~400 tokens) into your first message for a lightweight context boost.

> **Why this matters:** Without the skill, Claude will guess at API patterns and may use wrong endpoints, entity names, or authentication flows. The skill gives it accurate, tested patterns.

## Step 2: Share Your Credentials (10 seconds)

Copy this template, fill in your **demo/test account** details, and paste it to Claude:

```
I want to explore the Geotab API. Here are my credentials:

⚠️ Using DEMO/TEST account only - NOT production credentials

Database: your_demo_database_name
Username: your_demo_email@domain.com
Password: your_demo_password
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

## Step 3: Explore Your Data (20 seconds)

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

## Step 4: Get Project Ideas (15 seconds)

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

## Step 5: Build Something (15 seconds)

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

Database: demo_database          ⚠️ DEMO ACCOUNT ONLY
Username: demo@example.com        ⚠️ NOT PRODUCTION
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

**⚠️ CRITICAL: Only use demo/test accounts with AI tools. NEVER production credentials.**

While sharing credentials with Claude for learning purposes can work:
- Claude doesn't store your credentials between sessions
- All communication is encrypted (HTTPS)
- Claude uses credentials only to help you

**REQUIRED security practices:**
- ✅ **ALWAYS** use a dedicated demo/test account for learning
- ✅ **ALWAYS** use disposable credentials that you can immediately delete
- ✅ Rotate/delete test account passwords after hackathons
- ❌ **NEVER** use production Geotab account credentials
- ❌ **NEVER** share credentials that have access to real company data

**Create a demo account:** https://my.geotab.com/registration.html (takes 2 minutes)
> **Important:** Click **"Create a Demo Database"** (not "I'm a New Customer") to get pre-populated sample data.

## Common Questions

**Q: Do I need to install Python first?**
A: Not for the instant start! Claude explores the API for you in real-time. You only need Python when you want to run the code locally.

**Q: What if I don't have credentials yet?**
A: Create a free demo account at https://my.geotab.com/registration.html (takes 2 minutes). Click **"Create a Demo Database"** (not "I'm a New Customer") to get pre-populated sample data.

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
- Follow the [Enable Network Access to Geotab](#enable-network-access-to-geotab) steps above
- Make sure `my.geotab.com` is in your allowed domains list
- For Teams/Enterprise: Check with your admin if network egress is restricted at the organization level

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

---

## 💡 Hit Your Daily Limit?

**Don't stop coding!** You can rotate between different free AI tools (ChatGPT, Gemini, etc.) and use GitHub to keep your progress synced.

📖 **Full strategy guide**: See [BEGINNER_GUIDE.md](./BEGINNER_GUIDE.md#ai-coding-assistants) for detailed free quotas, tool comparison table, and rotation tips.

## Ready?

⚠️ **Remember:** Only use demo/test account credentials. NEVER production credentials.

Start now with this exact prompt:

```
I want to explore the Geotab API and build something cool.

⚠️ Using DEMO/TEST account only - NOT production credentials

Database: [your_demo_database]
Username: [your_demo_email]
Password: [your_demo_password]
Server: my.geotab.com

Connect to my fleet, show me what data I have, and suggest
3 project ideas I could build in the next hour.
```

Then sit back and watch Claude explore your fleet in real-time!

---

**Want the traditional setup instead?** See [CREDENTIALS.md](./CREDENTIALS.md)

**Teaching a workshop?** See [slides/README.md](../slides/README.md)

**Need more project ideas?** See [HACKATHON_IDEAS.md](./HACKATHON_IDEAS.md)
