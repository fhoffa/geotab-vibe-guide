# Beta Tester Guide

**Thank you for being an early tester!**

We're building something new here - a set of guides that teach developers to build fleet apps using AI assistance ("vibe coding"). You're among the first to try it, and your feedback will directly shape what hackathon participants experience.

This guide will evolve based on what you tell us. Found something confusing? We'll fix it. Hit a dead end? We want to know. Have an idea? Share it.

This is also a fun opportunity for you: you get early access to play with these tools, build something cool, and help shape how others will learn. Enjoy the exploration!

---

## Quick Start (5 minutes)

### Step 1: Get the Code

**Option A: Clone (Recommended)**
```bash
git clone https://github.com/fhoffa/geotab-vibe-guide.git
cd geotab-vibe-guide
```

**Option B: Fork First (if you want to submit PRs)**
1. Click "Fork" on https://github.com/fhoffa/geotab-vibe-guide
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/geotab-vibe-guide.git
cd geotab-vibe-guide
```

**Option C: Download ZIP (no git required)**
1. Go to https://github.com/fhoffa/geotab-vibe-guide
2. Click "Code" > "Download ZIP"
3. Extract to a folder on your desktop

### Step 2: Get Geotab Demo Credentials

If you don't have a Geotab account yet:

1. Go to https://my.geotab.com/registration.html
2. Fill in your details (takes ~2 minutes)
3. You'll get instant access to a demo database with sample vehicles and data

> [!NOTE]
> **Geotab employees:** Use a personal Gmail or other external email address to create your demo account. Internal Geotab accounts may have different permissions that could affect these tutorials.

Save your credentials - you'll need them for the tutorials.

### Step 3: Set Up Your Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your credentials
# GEOTAB_DATABASE=your_database
# GEOTAB_USERNAME=your_email
# GEOTAB_PASSWORD=your_password
# GEOTAB_SERVER=my.geotab.com
```

---

## Your Sandbox Folder

**Keep your experiments separate from the guides!**

Create a `sandbox/` folder for your own projects:

```
geotab-vibe-guide/
├── guides/           # Don't modify - tutorial content
├── examples/         # Don't modify - reference examples
├── skills/           # Don't modify - AI patterns
├── sandbox/          # YOUR SPACE - experiment here!
│   ├── my-first-addin/
│   ├── dashboard-experiments/
│   └── notes.md
└── ...
```

The `sandbox/` folder is gitignored, so your experiments won't interfere with git operations or accidentally get committed.

```bash
# Create your sandbox folder (it's gitignored!)
mkdir sandbox
```

> [!TIP]
> **Safety First:** The `sandbox/` folder is already included in `.gitignore`. This means you can create as many files and experiment as much as you want without accidentally polluting the repository or committing your private credentials.

**Folder structure suggestion for your projects:**

```
sandbox/
├── addins/              # Your Add-In experiments
│   └── my-fleet-view/
├── python/              # Your Python scripts
│   └── trip-analyzer/
├── notes/               # Your learning notes
│   └── feedback.md
└── README.md            # Track what you're building
```

---

## What to Test

### Path A: No-Code Add-In (5 min) - **Recommended for ALL!**
**Test the Google Gem experience:**
1. Read `guides/GOOGLE_GEM_USER_GUIDE.md`
2. Try the Gem at https://gemini.google.com/gem/geotab-add-in-architect
3. Generate an Add-In and install it in MyGeotab

**Questions to consider:**
- Was the guide clear?
- Did the Gem produce working JSON?
- Any confusing steps?

### Path B: Claude Instant Start (15 min)
**Test AI-assisted coding:**
1. Read `guides/INSTANT_START_WITH_CLAUDE.md`
2. Open Claude (web, desktop, or Claude Code)
3. Share `VIBE_CODING_CONTEXT.md` with Claude
4. Follow the prompts to fetch your first data

**Questions to consider:**
- Did the prompts work as expected?
- Was the context file helpful?
- What would you add or change?

### Path C: Python Examples (30-60 min)
**Test the step-by-step examples:**
1. Start with `examples/python/01_authentication/TASK.md`
2. Use your preferred AI tool to complete the task
3. Move through 02, 03, etc.

**Questions to consider:**
- Is the difficulty progression right?
- Are the vibe prompts effective?
- Did you get stuck anywhere?

### Path D: Add-In Development (30 min)
**Test the Add-In workflow:**
1. Read `guides/GEOTAB_ADDINS.md`
2. Try the embedded Add-In examples
3. Optionally try `guides/TRANSFORM_ADDIN_ZENITH.md`

**Questions to consider:**
- Is the MyGeotab Add-In process clear?
- Did the examples work?
- Was the Zenith transformation guide useful?

### Path E: Agentic Systems (Optional)
**For advanced testers:**
1. Read `guides/AGENTIC_OVERVIEW.md`
2. Review `guides/AGENTIC_QUICKSTART_N8N.md`

---

## Available Skills

The `skills/` folder contains reusable patterns that teach AI tools how to build Geotab integrations. These are structured knowledge bases your AI assistant can reference.

| Skill | What it teaches | When to use |
|-------|-----------------|-------------|
| `geotab-api-quickstart` | API authentication, data fetching, trip analysis | Python scripts, data analysis |
| `geotab-addins` | Add-In structure, embedded configs, troubleshooting | Building MyGeotab custom pages |
| `geotab-addin-zenith-styling` | Modern UI components, Zenith design system | Making Add-Ins look professional |
| `agentic-n8n` | Workflow automation with n8n | Building autonomous systems |

Each skill has a `SKILL.md` file (the main entry point) and a `references/` folder with detailed examples.

---

## Loading Skills in Your AI Tool

### Claude Code (CLI)
Skills are automatically available when you run Claude Code from this repo:
```bash
cd geotab-vibe-guide
claude
```
Claude reads `CLAUDE.md` and can access all skills. Ask it to use a specific skill:
> "Use the geotab skill to help me build a vehicle list Add-In"

### Claude Desktop/Web
1. Start with `VIBE_CODING_CONTEXT.md` (paste or upload)
2. For specific tasks, also share the relevant skill file:
   - Building Add-Ins? Upload `skills/geotab/SKILL.md`
   - Styling? Upload `skills/geotab/references/ZENITH_STYLING.md`
   - Python API work? Upload `skills/geotab/SKILL.md`

### Cursor / Windsurf / Other IDEs
1. Open the `geotab-vibe-guide` folder as your project
2. The AI has access to all files automatically
3. Reference skills explicitly: "Look at skills/geotab and help me..."

### ChatGPT / Other Tools
1. Upload `VIBE_CODING_CONTEXT.md` for general context
2. Upload specific `SKILL.md` files for the task at hand
3. For complex tasks, upload the skill's `references/` files too

---

## How to Give Feedback

We want to hear from you! Choose whatever method works best:

### Option 1: GitHub Issue (Preferred)
Create an issue at https://github.com/fhoffa/geotab-vibe-guide/issues

Use this template:
```
**What I tested:** [Path A/B/C/D/E]
**What worked well:**
**What was confusing:**
**Suggestions:**
**Environment:** [Claude Code / Claude Web / Cursor / etc.]
```

### Option 2: Pull Request
If you spot a typo or have a fix:
1. Fork the repo (if you haven't)
2. Create a branch: `git checkout -b fix/your-fix-name`
3. Make your changes
4. Submit a PR

### Option 3: Direct Message
Reach out to **Felipe Hoffa**:
- **Geotab employees**: DM at work
- **External**: [LinkedIn](https://www.linkedin.com/in/hoffa/)

### What We're Looking For

**Clarity feedback:**
- Were any instructions confusing?
- Did you get stuck? Where?
- What assumptions did we make that weren't true?

**Technical feedback:**
- Did the code examples work?
- Any errors or edge cases?
- Missing dependencies?

**Content feedback:**
- What's missing?
- What should be removed?
- What order makes more sense?

**AI tool feedback:**
- Which AI tools did you try?
- Did the prompts work across different tools?
- Any tool-specific issues?

---

## Troubleshooting

### "Authentication failed"
- Double-check your `.env` file (no quotes around values)
- Verify credentials at my.geotab.com
- Wait 15-30 min if you got locked out from too many attempts

### "Module not found"
```bash
pip install python-dotenv requests mygeotab
```

### Add-In doesn't appear in MyGeotab
- Make sure you're in Admin mode
- Check that JSON is valid (use a JSON validator)
- Try refreshing the page

### Claude doesn't understand the Geotab API
- Share `VIBE_CODING_CONTEXT.md` at the start
- For deeper context, share the specific guide file too
- Try: "Read the GEOTAB_ADDINS.md guide and then help me..."

---

## Timeline

- **Now - [Hackathon Date]**: Beta testing period
- **Feedback deadline**: [TBD]
- **Hackathon**: [Date]

Your feedback directly shapes what hackathon participants will experience. Thank you for helping make this better!

---

## Quick Links

| Resource | Link |
|----------|------|
| Main README | `README.md` |
| Quick AI Context | `VIBE_CODING_CONTEXT.md` |
| Beginner Glossary | `guides/BEGINNER_GLOSSARY.md` |
| All Guides | `guides/README.md` |
| Python Examples | `examples/python/` |
| Add-In Examples | `examples/addins/` |
| Hackathon Ideas | `guides/HACKATHON_IDEAS.md` |
| Create Demo Account | https://my.geotab.com/registration.html |
| GitHub Issues | https://github.com/fhoffa/geotab-vibe-guide/issues |
