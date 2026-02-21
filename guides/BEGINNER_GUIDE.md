# Beginner's Guide: Your First Steps in Vibe Coding

**Welcome!** If you're new to coding, APIs, or fleet management, this guide is for you. Don't worry if these terms sound unfamiliar—by the end of this glossary, you'll understand everything you need to start building with Geotab.

> [!TIP]
> **Start here:** Watch the kickoff webinar where Felipe and Aaron walk through the Geotab API and vibe coding tools — everything you need to get going: [YouTube](https://www.youtube.com/watch?v=Zuazi88lBeg) | [LinkedIn](https://www.linkedin.com/posts/hoffa_from-idea-to-25k-kickstarting-the-geotab-activity-7429763308112732161-vzZA)
> Jump to: [Live data demo](https://www.youtube.com/watch?v=Zuazi88lBeg&t=17) · [Build an add-in with Gem](https://www.youtube.com/watch?v=Zuazi88lBeg&t=155) · [Claude + API](https://www.youtube.com/watch?v=Zuazi88lBeg&t=1360) · [Safety tips](https://www.youtube.com/watch?v=Zuazi88lBeg&t=1696)

---

## Table of Contents
- [What is Vibe Coding?](#what-is-vibe-coding)
- [Essential Development Tools](#essential-development-tools)
- [AI Coding Assistants](#ai-coding-assistants)
- [Programming Basics](#programming-basics)
- [Geotab Platform Terms](#geotab-platform-terms)
- [Fleet Management Concepts](#fleet-management-concepts)
- [Web Development Terms](#web-development-terms)
- [Automation & Agentic Systems](#automation--agentic-systems)

---

## What is Vibe Coding?

**Vibe Coding** is a modern approach to programming where you use AI as your co-pilot. Instead of memorizing syntax or reading hundreds of pages of documentation, you:

1. **Ask** the AI to connect to data sources and explore
2. **Vibe** with the results—see what the data looks like
3. **Iterate** on your ideas ("Make it a dashboard," "Add a map")

Think of it like having a conversation with a coding partner who handles the technical details while you focus on *what* you want to build.

### Key Principles
- **Flow over Syntax**: Focus on your ideas, not memorizing code
- **Fail Fast, Learn Faster**: Errors are just feedback—iterate quickly
- **Start Simple, Scale Smart**: Get something working in 5 minutes, then improve it
- **AI as Co-Pilot**: The AI writes code, but you guide the direction and understand the results

**Who can do vibe coding?** Anyone! Whether you're a complete beginner or an experienced developer, AI tools help you build faster and learn along the way.

---

## Essential Development Tools

### GitHub
**What it is**: A website where developers store and share code projects.

Think of GitHub like Google Drive, but specifically designed for code. It:
- Stores your code online (so you don't lose it)
- Tracks every change you make (like "track changes" in Word)
- Lets multiple people work on the same project
- Shares code with others

**For vibe coding**: GitHub is your "home base" that lets you switch between different AI tools seamlessly. Your code lives in GitHub, and every AI assistant can read it and continue building.

**In this repo**: All our tutorials, examples, and guides live on GitHub so you can access them anytime.

### Git
**What it is**: The underlying tool that tracks changes to your code.

GitHub (the website) uses Git (the tool).

**You don't need to learn Git commands!** Just tell your AI assistant:
- "Create a GitHub repo for this project"
- "Save my code to GitHub"
- "Push my changes"
- "Show me what changed since last commit"

The AI knows all the Git commands and will handle them for you. Focus on what you want to build, not on technical commands.

**You also don't need to understand branches!** When rotating between AI tools, just work on the main branch (the default). The AI will handle everything. Branches are for advanced workflows—skip them for now.

### IDE (Integrated Development Environment)
**What it is**: A special text editor designed for writing code.

Like Microsoft Word is for documents, an IDE is for code. Popular IDEs include:
- **VS Code** (Visual Studio Code) - Free, beginner-friendly
- **PyCharm** - Great for Python
- **Google Antigravity IDE** - AI-native IDE you install on your computer

**Why use an IDE?** It color-codes your code, catches typos, and helps you run your programs.

### Terminal / Command Line
**What it is**: A text-based way to control your computer.

Instead of clicking icons, you type commands. For example:
- `python app.py` - Runs your Python program
- `pip install mygeotab` - Installs a Python library

**Don't panic!** AI assistants can write these commands for you. You just copy and paste.

### Browser
**What it is**: The program you use to access websites (Chrome, Firefox, Safari, Edge).

Many of our tutorials run entirely in a browser—no downloads required!

---

## AI Coding Assistants

**Pro Tip**: Don't limit yourself to just one tool! Each AI coding assistant offers free usage quotas. When you hit the limit on one, simply switch to another—your GitHub repo acts as the common workspace where all your progress is saved. This strategy lets you keep coding without interruption!

### The Multi-Tool Strategy 🔄

Here's how to maximize your free coding time:

1. **Start with any tool** (pick your favorite below)
2. **Code until you hit the free quota limit**
3. **Commit and push your work to GitHub** (your safety net!)
4. **Switch to a different tool** and continue from where you left off
5. **Repeat** as needed—your GitHub repo keeps everything in sync

**Why this works**: Your code lives in GitHub, not in any single AI tool. Each tool can read your repo, understand your project, and continue building. Think of GitHub as your project's "home base" and the AI tools as interchangeable helpers.

---

### Claude
**What it is**: An AI assistant made by Anthropic that can write code, explain concepts, and help debug.

**Access options**:
- **claude.ai** (web chat) - Great for beginners, no setup needed
- **Claude Code** (command line tool) - Advanced option for experienced developers

**Free quota**:
- Free tier includes daily message limits that reset every 24 hours
- Generous context window for understanding large codebases

**Best for**: Complex reasoning, understanding existing code, multi-step tasks

**In this repo**: We provide ready-to-use prompts for Claude to build Geotab applications.

---

### ChatGPT
**What it is**: An AI assistant by OpenAI that can write code and answer questions.

**Access options**:
- **chat.openai.com** (web chat)
- **ChatGPT API** (for programmatic access)

**Free quota**:
- GPT-3.5: Generous free access with higher limits
- GPT-4: Limited free messages per day (varies by account)

**Best for**: Quick iterations, web searches (with browsing enabled), general programming

---

### GitHub Copilot
**What it is**: An AI tool that lives inside your IDE and suggests code as you type.

**Access options**:
- Built into VS Code, Visual Studio, and other popular editors
- Works inline as you type

**Free quota**:
- Free for students, teachers, and open-source maintainers
- 30-day free trial for everyone else

**Best for**: Real-time code completion, writing boilerplate code, autocomplete on steroids

**Note**: Works best alongside other tools (use ChatGPT/Claude for planning, Copilot for typing)

---

### Gemini
**What it is**: Google's AI assistant that can help with coding tasks.

**Access options**:
- **gemini.google.com** (web chat)
- Integrated into Google Workspace tools

**Free quota**:
- Generous free tier with high message limits
- Access to latest Gemini models in free tier

**Best for**: Integration with Google services, multimodal tasks (code + images)

---

### Google Antigravity IDE
**What it is**: An AI-native IDE you install on your computer that helps you build full applications.

**Access options**:
- Desktop application for Windows, Mac, Linux

**Free quota**:
- Currently free during beta period
- Check their website for current offerings

**Best for**: Building complete Streamlit dashboards, Python applications with visual interfaces

**In this repo**: See [ANTIGRAVITY_QUICKSTART.md](ANTIGRAVITY_QUICKSTART.md) for setup instructions

---

### Cursor
**What it is**: An AI-first code editor (fork of VS Code) with built-in AI pair programming.

**Access options**:
- Desktop application for Windows, Mac, Linux

**Free quota**:
- 2 weeks free trial with pro features
- Limited free tier after trial

**Best for**: Editing existing code, codebase-aware AI assistance, refactoring

---

### Replit AI
**What it is**: Browser-based coding environment with integrated AI assistant.

**Access options**:
- **replit.com** - Code entirely in your browser, no installation needed

**Free quota**:
- Free tier includes basic AI features
- Runs code in the cloud (no local setup!)

**Best for**: Quick prototypes, learning, no-install coding sessions

---

## Making the Most of Free Quotas

### Daily Rotation Strategy

Here's a sample rotation to maximize free usage:

**Morning**: Start with Claude (complex design and architecture)
- "Build a Geotab fleet dashboard with vehicle tracking"
- Plan your app structure
- Write core logic
- "Save my work to GitHub"

**Afternoon**: Switch to ChatGPT (rapid iteration)
- "My project is at github.com/me/fleet-dash. Continue adding features"
- Implement features
- Debug issues
- "Commit these changes to GitHub"

**Evening**: Use Gemini or Replit (finishing touches)
- "Continue my project at github.com/me/fleet-dash"
- Add UI improvements
- Test edge cases
- "Push final changes to GitHub"

**Key insight**: You never need to learn Git commands. Just ask each AI to save your work!

### GitHub as Your Safety Net 🛡️

**Critical habit**: Save your work to GitHub frequently!

**Instead of learning Git commands, just ask your AI**:

```
"Save my current code to GitHub with a meaningful commit message"
```

or

```
"I need to push my changes to GitHub. Help me commit and push everything."
```

**The AI will handle all the Git commands for you!** This ensures:
- ✅ Your work is never lost
- ✅ Any AI tool can pick up where you left off
- ✅ You can switch tools mid-project seamlessly
- ✅ You have a history of all your changes

### When Switching Tools

When you hit a quota limit on one tool:

1. **Ask the AI to save your work**:
   ```
   "Save all my code to GitHub before I switch tools"
   ```

2. **Open a different tool** (ChatGPT, Gemini, etc.)

3. **Give context to the new AI**:
   ```
   I'm building a Geotab fleet dashboard. My code is at [your-github-url].
   I was just working on adding a map view. Can you help me continue?
   ```

4. **Keep coding** - The new AI reads your repo and picks up where you left off!

**Don't worry about Git commands** - each AI assistant knows how to use Git. Just tell them what you want ("save my work", "create a repo", "push to GitHub") and they'll handle the technical details.

### Real Example: Let the AI Handle GitHub

**Your first session with Claude**:
```
You: "I built this fleet dashboard. Save it to GitHub for me."

Claude: "I'll create a GitHub repo and commit your code..."
[Creates repo, commits code, provides you the URL]

Claude: "✓ Code saved to: github.com/yourname/fleet-dashboard"
```

**Later, switching to ChatGPT**:
```
You: "Continue my project at github.com/yourname/fleet-dashboard.
      Add a fuel efficiency chart."

ChatGPT: [Reads your repo]
         "I see your dashboard code. I'll add the fuel chart..."
         [Writes code, commits changes]

ChatGPT: "✓ Fuel chart added and pushed to GitHub"
```

**Even later, switching to Gemini**:
```
You: "My project is at github.com/yourname/fleet-dashboard.
      Make the map interactive."

Gemini: [Reads your repo]
        "I'll add interactive map features..."
        [Updates code, saves to GitHub]
```

**See the pattern?** You never typed a single Git command. You just told each AI what you wanted, and they handled all the GitHub operations.

**Note**: All of this happens on the "main" branch automatically. You don't need to know what branches are or how they work. Just ask the AI to save your code, and everything is handled for you on the default main branch.

---

## Quick Comparison Table

| Tool | Best For | Free Quota | Setup Required |
|------|----------|------------|----------------|
| **Claude** | Complex reasoning, architecture | Daily limit (resets) | None (web) |
| **ChatGPT** | Quick iterations, general coding | High (GPT-3.5) / Limited (GPT-4) | None (web) |
| **Gemini** | Google integration, high limits | Very generous | None (web) |
| **GitHub Copilot** | Real-time autocomplete | 30-day trial | IDE setup |
| **Antigravity IDE** | Full dashboards, Streamlit | Beta free access | Install app |
| **Cursor** | Code editing, refactoring | 2-week trial | Install app |
| **Replit AI** | No-install, browser-based | Basic free tier | None (web) |

**Bottom line**: These are all AI tools that can write code for you. Use them strategically, rotate when needed, and let GitHub be your central hub!

---

## Programming Basics

### Python
**What it is**: A beginner-friendly programming language.

Python is popular because:
- It reads almost like English
- It's powerful (used by Google, Netflix, NASA)
- It has tons of free libraries (pre-written code)

**Example Python code**:
```python
print("Hello, World!")  # This prints text to the screen
```

### JavaScript
**What it is**: The programming language that runs in web browsers.

Every website uses JavaScript to make things interactive (buttons, animations, maps). You'll use it for web dashboards.

### Library / Package
**What it is**: Pre-written code you can use in your projects.

Like using a recipe instead of inventing one from scratch. For example:
- `mygeotab` - Connects to Geotab's API (ready to use!)
- `streamlit` - Creates web dashboards easily

**How to use**: AI tools can install and use libraries for you automatically.

### API (Application Programming Interface)
**What it is**: A way for programs to talk to each other.

Think of an API like a menu at a restaurant:
- The menu lists what you can order (available data)
- You make a request ("I'll have the vehicle locations")
- The kitchen prepares it (server processes your request)
- You receive your order (data comes back)

**Geotab API**: Lets you request vehicle data, trips, fuel usage, and more from Geotab's fleet management system.

### Code
**What it is**: Instructions written in a programming language that tell computers what to do.

Code is just text! When you "run" code, the computer reads it and follows the instructions.

### Variable
**What it is**: A container for storing information in your code.

**Example**:
```python
vehicle_name = "Truck 47"  # Stores text
speed = 65                  # Stores a number
```

Think of variables like labeled boxes where you keep data.

### Function
**What it is**: A reusable block of code that performs a specific task.

**Example**:
```python
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")  # Outputs: Hello, Alice!
```

Functions let you avoid repeating code. Write it once, use it many times.

### JSON (JavaScript Object Notation)
**What it is**: A way to format data so computers can easily read it.

**Example JSON**:
```json
{
  "vehicle": "Truck 47",
  "speed": 65,
  "location": "Austin, TX"
}
```

APIs send data in JSON format. It's just a structured way to organize information.

---

## Geotab Platform Terms

### Geotab
**What it is**: A company that provides fleet management and vehicle tracking solutions.

Geotab makes:
- **Hardware** (devices that plug into vehicles to collect data)
- **Software** (MyGeotab platform for viewing and managing fleet data)
- **APIs** (ways for developers to build custom applications using Geotab data)

### MyGeotab
**What it is**: Geotab's web-based fleet management platform.

This is where fleet managers:
- Track vehicle locations in real-time
- View fuel usage, trips, and driver behavior
- Generate reports and manage their fleet

**For developers**: You can pull data from MyGeotab using the API to build custom apps.

### Database
**What it is**: In Geotab's context, your organization's collection of fleet data.

When you connect to the Geotab API, you specify which database (which company's fleet) you want to access.

**Example**: `my.geotab.com` is a server URL.

### Credentials
**What it is**: Your username, password, and database URL needed to access Geotab data.

Like a key to unlock your data. You'll store these securely in an `.env` file.

**First step**: [Create a free demo database](https://my.geotab.com/registration.html) (takes 2 minutes).
> **Important:** Click **"Create a Demo Database"** (not "I'm a New Customer") to get pre-populated sample data.

### Device
**What it is**: A vehicle or asset being tracked in Geotab.

Could be a truck, car, trailer, or any equipment with a Geotab tracking device installed.

### Trip
**What it is**: A recorded journey from start to stop.

Contains data like:
- Distance traveled
- Duration
- Route taken
- Stops made

### StatusData
**What it is**: Real-time diagnostic information from vehicles.

Examples:
- Fuel level
- Engine RPM
- Battery voltage
- Odometer reading

### LogRecord
**What it is**: GPS breadcrumbs—individual location points recorded during a trip.

When you see a route on a map, it's made up of thousands of LogRecords (latitude/longitude points).

### Zone / Geofence
**What it is**: A virtual boundary around a real-world location.

**Example**: Draw a zone around your warehouse. Get alerts when vehicles enter or leave.

### Geotab Ace
**What it is**: Geotab's AI-powered assistant for asking questions about your fleet in plain English.

Instead of writing API calls, you ask: *"Which vehicle drove the most miles last month?"*

Ace understands your question and retrieves the answer using AI.

### Add-Ins
**What it is**: Custom pages and buttons that extend MyGeotab's functionality.

Add-Ins are like plugins for MyGeotab. You can create:
- **Page Add-Ins**: Full custom pages that appear in the navigation menu
- **Button Add-Ins**: Custom buttons that automate tasks or navigate between areas

**Example**: Build a custom dashboard that combines your fleet data with local weather, or add a one-click report generator button.

**For developers**: See [GEOTAB_ADDINS.md](GEOTAB_ADDINS.md) to learn how to build Add-Ins using vibe coding.

---

## Fleet Management Concepts

### Fleet
**What it is**: A group of vehicles managed by an organization.

Could be delivery trucks, sales cars, construction equipment, or any commercial vehicles.

### Telematics
**What it is**: Technology that combines GPS tracking with vehicle diagnostics.

Telematics devices (like Geotab's GO devices) collect data from vehicles and send it to the cloud for analysis.

### HOS (Hours of Service)
**What it is**: Regulations limiting how long truck drivers can work without rest.

Important for compliance in the transportation industry. Geotab tracks HOS automatically.

### DVIR (Driver Vehicle Inspection Report)
**What it is**: A safety checklist drivers complete before/after trips.

Digital DVIRs replace paper forms. Drivers report issues like brake problems or tire damage.

### Idle Time
**What it is**: When a vehicle's engine is running but it's not moving.

Excessive idling wastes fuel and money. Fleet managers track this to improve efficiency.

### MPG (Miles Per Gallon)
**What it is**: A measure of fuel efficiency.

Higher MPG = less fuel used = lower costs. Electric vehicles use MPGe (miles per gallon equivalent).

### Carbon Footprint
**What it is**: The total greenhouse gas emissions produced by a fleet.

Many companies track this for sustainability reporting.

---

## Web Development Terms

### Dashboard
**What it is**: A visual interface showing key data and metrics.

Like a car's dashboard shows speed and fuel, a web dashboard shows fleet metrics (total miles, fuel costs, vehicle locations).

### Frontend
**What it is**: The part of an application users see and interact with.

The visual interface—buttons, maps, charts. Usually built with HTML, CSS, and JavaScript.

### Backend
**What it is**: The behind-the-scenes code that processes data and logic.

The backend talks to APIs, processes data, and sends results to the frontend. Users don't see this part.

### Localhost
**What it is**: Your own computer acting as a web server.

When testing apps, you run them at `localhost:8501` (or similar). Only you can access it—it's not on the internet yet.

### Deployment
**What it is**: Making your application available on the internet.

Moving from "only works on my computer" to "anyone can use it." Common platforms:
- **Streamlit Cloud** (free for Python dashboards)
- **Heroku**, **Vercel**, **Netlify** (general web apps)

### Framework
**What it is**: Pre-built code structure that helps you build apps faster.

**Examples**:
- **Streamlit** (Python) - Build data dashboards quickly
- **Flask** (Python) - Build general web applications
- **React** (JavaScript) - Build interactive user interfaces

Think of frameworks like IKEA furniture: the hard work is done, you just assemble the pieces.

---

## Automation & Agentic Systems

### Agentic System
**What it is**: Software that runs autonomously, monitoring data and taking action without you clicking buttons.

Instead of you checking a dashboard, an agentic system watches your data 24/7 and alerts you (or takes action) when something important happens.

**Example**: "If any vehicle speeds over 80 mph, send me a Slack message."

### Workflow Automation
**What it is**: Connecting multiple steps together so they run automatically.

**Example workflow**:
```
Fault code detected → Create maintenance ticket → Alert driver → Notify manager
```

Each step triggers the next. No human needed in between.

### n8n
**What it is**: A visual workflow automation tool where you connect nodes to build automations.

Think of it like a flowchart that actually runs. You drag and drop boxes (nodes) and connect them:
- Trigger node (when to start)
- Action nodes (what to do)
- Logic nodes (decisions and filters)

**Why use it**: Build automations without writing code. Free tier available.

### Webhook
**What it is**: A URL that receives data when something happens.

Like a doorbell for your application. When someone "rings" the webhook (sends data to the URL), your code wakes up and does something.

**Example**: Slack webhooks let you send messages by POSTing to a URL.

### Polling
**What it is**: Repeatedly checking for new data at regular intervals.

Like refreshing your email every 5 minutes to see if anything new arrived.

**Example**: "Check Geotab API every 15 minutes for speeding events."

**Trade-off**: Simple to build, but there's a delay between when something happens and when you notice.

### Cron Job
**What it is**: A scheduled task that runs automatically at set times.

**Example**: "Run this script every day at 9 AM" or "Check for alerts every 5 minutes."

The name comes from Unix systems, but the concept is just "scheduled automation."

### Slack Webhook
**What it is**: A special URL that lets you send messages to a Slack channel.

You POST a message to the webhook URL, and it appears in Slack. No need to build a full Slack app.

### Discord Webhook
**What it is**: Same concept as Slack webhooks, but for Discord.

If your team uses Discord instead of Slack, webhooks work almost identically.

### Integration
**What it is**: Connecting two different systems so they can share data.

**Examples**:
- Geotab + Slack (send alerts to chat)
- Geotab + Google Sheets (log events to spreadsheet)
- Geotab + ServiceNow (create maintenance tickets)

### Trigger
**What it is**: The event that starts a workflow.

**Common triggers**:
- **Schedule**: "Every 15 minutes"
- **Webhook**: "When data arrives at this URL"
- **Event**: "When a vehicle enters a zone"

### Node (in workflow tools)
**What it is**: A single step in a workflow.

In tools like n8n, you build workflows by connecting nodes:
- HTTP Request node (call an API)
- Filter node (only continue if condition is met)
- Slack node (send a message)

---

## Getting Started

Now that you understand the basics, here's where to go next:

1. **Get credentials:** [Create a free demo database](https://my.geotab.com/registration.html) (takes 2 minutes)
   > **Important:** Click **"Create a Demo Database"** (not "I'm a New Customer") to get pre-populated sample data. After registering, **check your email and click the verification link** before trying to log in — you'll get a login error if you skip this.

2. **Brand new to coding?**
   - Start with [GOOGLE_GEM_USER_GUIDE.md](GOOGLE_GEM_USER_GUIDE.md) - Build a MyGeotab Add-In in minutes using Google Gemini's Gem

4. **Want to build something specific?**
   - Check [HACKATHON_IDEAS.md](HACKATHON_IDEAS.md) for 20+ project ideas with difficulty ratings

5. **Need help with setup?**
   - Read [CREDENTIALS.md](CREDENTIALS.md) for Geotab account setup

6. **Want copy-paste prompts for AI?**
   - Use [CLAUDE_PROMPTS.md](CLAUDE_PROMPTS.md) for ready-to-use prompts

7. **Teaching others?**
   - See [TUTORIAL_DESIGN.md](TUTORIAL_DESIGN.md) for a full 60-minute curriculum

---

## Still Have Questions?

That's normal! The beauty of vibe coding is you don't need to understand everything before starting. Pick a project idea, open Claude or ChatGPT, and start building. The AI will guide you through the technical details.

**Remember**: Every expert started as a beginner. The difference is they started. You've got this! 🚀

---

**Next Step**: Head to [GOOGLE_GEM_USER_GUIDE.md](GOOGLE_GEM_USER_GUIDE.md) and build your first MyGeotab Add-In right now—no installation required!
