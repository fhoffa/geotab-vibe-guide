# Masterclass Slide Tracker
**21 slides | vibe_coding_masterclass.pptx**

Status key: `[x]` planned · `[x]` generated · `[v]` visually verified

---

## Color Palette

| Role | Hex | Use |
|------|-----|-----|
| Background (deep) | `0D1321` | Title, close slides |
| Background (dark) | `152238` | Content slides |
| Card / panel | `1E3A5F` | Info boxes, columns |
| Accent orange | `F5A623` | Headlines, callouts, numbers |
| Accent blue | `4A90D9` | Table headers, secondary |
| Text white | `FFFFFF` | All body text |
| Text muted | `A0B4C8` | Footers, captions |
| Warning | `E05A2B` | Risk/warning callouts |

Font: **Trebuchet MS** titles · **Calibri** body

---

## Slide List

### BLOCK 1 — Hackathon (slides 1–7)

---

**Slide 1** `[x]` — Session Title *(holding slide / plays during 1-min video)*
- Background: `0D1321` (deepest dark)
- Large centered: **"Vibe Coding Demo + ACE"** (white, 48pt bold)
- Smaller: "Felipe Hoffa · Connect Europe 2026 · Barcelona" (muted, 20pt)
- No other elements — clean

---

**Slide 2** `[x]` — The Competition
- Title: **"47 teams. 3 weeks. $25,000."** (orange, 40pt)
- 5 bullets (white, 18pt):
  - February 12 – March 2, 2026
  - Open to any developer — not just Geotab employees
  - Tools: any AI assistant (Claude, Gemini, ChatGPT, Cursor, Copilot)
  - Data: Geotab fleet API
  - 43 repos cloned and code-reviewed — by AI
- Footer (muted, italic): *"We used vibe coding to judge vibe coding."*

---

**Slide 3** `[x]` — The Judging Rubric
- Title: **"What actually matters in a fleet tool"**
- Table (4 rows, 3 cols):
  - Header row: Criterion | Weight | Question
  - Useful | 35% | Would a real fleet team use this?
  - Original | 25% | Clear differentiator?
  - Fun | 15% | Engaging to use?
  - Well-done | 25% | Does the code match the promise?
- Footer (warning color): *"Well-done was capped at 6 for mock data projects."*

---

**Slide 4** `[x]` — The #1 Lesson
- Title: **"The #1 differentiator wasn't the idea. It wasn't the UI."**
- Large centered statement (orange, 28pt bold):
  *"It was whether the project connected to real fleet data."*
- Two card columns below:
  - Left (card): **"Projects that advanced"** / Real API calls · Real driver names · Real fault codes
  - Right (card, warning tint): **"Projects that didn't"** / Math.random() · seed-data.ts · fakeData.ts
- Footer (muted): *"Polished demos. No real data. The code inspection caught them all."*

---

**Slide 5** `[x]` — Winner Reveal
- Background: `0D1321`
- Trophy + large name: **"🏆 FleetShield AI — Vimal Kanagaraj"** (orange, 36pt)
- Score row (large numbers, orange): **8.35**
- Score breakdown (white, 18pt): Useful: 9 · Original: 9 · Fun: 8 · Well-done: 7
- Tagline (muted, 16pt italic): *"Predictive Fleet Safety and Insurance Intelligence — powered by Claude, real Geotab data, and actual Twilio phone calls."*

---

**Slide 6** `[x]` — FleetShield AI: The Closed Loop
- Title: **"One voice command. Automatic driver calls."**
- Three-box flow diagram (left→right, orange arrows):
  - Box 1: "Operator says: 'Run a coaching sweep'"
  - Box 2: "Scores every driver vs 90-day baseline · generates action items"
  - Box 3: "Driver portal updated · Twilio phone call placed"
- Stats bar below (orange numbers on dark):
  25,000 lines · 17 Claude agent tools · 9 scoring engines · 2 voice AI surfaces

---

**Slide 7** `[x]` — The Architect's Secret
- Title: **"They wrote a 736-line CLAUDE.md."**
- Two columns:
  - Left (list): Every Geotab API pattern · Every Geotab quirk · FMCSA-grounded insurance formulas · Scoring methodology · Deployment verification
  - Right (callout card): *"Claude wasn't guessing at fleet insurance math. It was given the domain knowledge first. Then it executed."*
- Full-width quote at bottom (orange, italic, 20pt):
  *"You are the architect. AI is the hands. But the architect has to know the domain."*

---

### BLOCK 2 — Gem Demo (slides 8–9)

---

**Slide 8** `[x]` — The Gem: Build With the Audience
- Title: **"Let's build one. Right now. Your idea."**
- Subtitle (muted): "Geotab Add-In Architect Gem → Google Gemini → MyGeotab → done."
- Three-step flow (numbered circles, orange):
  - 1 · You describe it
  - 2 · Gem writes the JSON
  - 3 · Paste into MyGeotab
- Footer: *"No install. No hosting. No build step."*

---

**Slide 9** `[x]` — Two Lanes Forward
- Title: **"Where do you go from here?"**
- Two columns (card style):
  - Left — **Fleet Manager**: The Gem is your tool · Describe → paste → done · Complete solution · Zero code
  - Right — **Developer / Reseller**: The Gem is your scaffold · Copy JSON → GitHub → Claude Code · Unlimited extension
- Footer (muted, small): `guides/GEM_TO_CLAUDE_CODE.md`

---

### BLOCK 3 — Skills (slide 10)

---

**Slide 10** `[x]` — How Claude Knows Geotab
- Title: **"The repo that powers this session"**
- Two columns (card style):
  - Left — **For humans** (`guides/`): Tutorials · Walkthroughs · Prompts to copy-paste · This session's assets
  - Right — **For AI tools** (`skills/`): `geotab` — complete dev guide · `agentic-n8n` — fleet automation · `geotab-custom-mcp` — MCP servers
- Center divider line (accent blue)
- Footer (orange, bold): *"Your team can do this for your own domain. agentskills.io"*
- Sub-footer (muted): `github.com/fhoffa/geotab-vibe-guide`

---

### BLOCK 4 — MCP (slides 11–15)

---

**Slide 11** `[x]` — The Business Framing
- Title: **"AI assistants are becoming a business tool — like email, like a browser."**
- Large question (white, 24pt centered):
  *"When your employees have an AI assistant — what can it do for your fleet?"*
- Large centered question (white, 24pt):
  *"What becomes possible when my fleet is part of the AI conversation?"*
- Footer (orange): *"Bring your AI tools. Geotab is ready for that world."*

---

**Slide 12** `[x]` — Without MCP vs With MCP
- Title: **"Your AI assistant, connected to your fleet"**
- Two large cards side by side:
  - Left (dark card, muted header): **Without MCP** / `You: "Which vehicles are offline?"` / `Claude: "I can help you write code to query that..."`
  - Right (card with orange top border): **With Geotab MCP** / `You: "Which vehicles are offline?"` / `Claude: [queries live] "2 vehicles — GVF-1204 (Lyon, 3 days), GVF-0891 (Valencia, 5 days)"`

---

**Slide 13** `[x]` — The Announcement
- Background: `0D1321`
- Title (centered): **"The Official Geotab MCP"**
- Three large stat blocks (orange numbers, white labels):
  - **20** tools
  - **Full** read + write
  - **Beta** opening soon
- Sub (muted, italic): *"Not a roadmap item. I have early access. Let me show you."*

---

**Slide 14** `[x]` — The 20 Tools
- Title: **"20 tools across 5 categories"**
- Table (5 data rows + header):
  - Data Retrieval | Get, GetCountOf, GetAceResults, ListEntities, GetEntity
  - Fleet Management | Add, Set, Remove, DecodeVins
  - Safety & Compliance | DismissFaults, GetHosRuleSets, EmissionEnrollDevices, EmissionDeadline, GetPostedRoadSpeeds
  - Video — Go Focus | SearchMedia, GetMediaUrl, GetDevicesInformation, DownloadMediaFile, UploadMediaFile
  - Reporting | SendReportProcessingRequest
- Footer: *"GetAceResults = natural language → fleet answer. Add/Set/Remove = full write access."*

---

**Slide 15** `[x]` — After the Demo: Query → Analyze → Act
- Title: **"Query → Analyze → Act. One conversation."**
- Three rows with monospace tool labels (right-aligned, orange):
  - `"Which drivers had the most harsh braking?"` → **GetAceResults**
  - `"Decode the VINs for their vehicles."` → **DecodeVins**
  - `"Create a group and add them."` → **Add + Set**
- Footer (muted): *"Custom demo (Ace-only): github.com/fhoffa/geotab-ace-mcp-demo — works today, 15-min setup."*

---

### BLOCK 5 — ACE (slides 16–19)

---

**Slide 16** `[x]` — ACE in Three Contexts
- Title: **"Same AI engine. Three places. Different possibilities."**
- Three columns (card style, equal width):
  - **MyGeotab Web UI**: Just ask questions · Fleet manager self-service · No code, no setup
  - **Via MCP**: One tool of 20 · Chain with other tools · 30–45 sec, natural language
  - **Inside an Add-In**: Embedded in your page · Your custom interface · The Gem builds this

---

**Slide 17** `[x]` — Context 1: Web UI + SQL Insight
- Title: **"The intelligence layer that's already there"**
- Main callout card (blue border):
  *"Read the SQL ACE generated. Fastest way to learn the Geotab data model — ACE explains the schema through every query it runs."*

---

**Slide 18** `[x]` — Context 2: Speed Comparison
- Title: **"ACE is deep. The direct API is fast. Use both."**
- Table (4 rows, 3 cols — blank | GetAceResults | Direct API):
  - Speed | 30–45 seconds | < 1 second
  - Query type | Natural language | Structured
  - Best for | Complex analysis, trends | Counts, lookups, real-time
  - Risk | Implicit filters | 5K cap without pagination
- Large callout (orange): **"41 seconds vs 1.3 seconds. Same question."**
- Footer: *"Use ACE when you need the reasoning. Use the API when you need the speed."*

---

**Slide 19** `[x]` — Context 3: ACE in an Add-In
- Title: **"ACE inside your Add-In — the Gem builds this"**
- Left panel (code/monospace, dark card):
  ```
  1. create-chat → chat_id
  2. send-prompt → message_group_id
  3. Wait 10 seconds
  4. Poll every 8s → until DONE
  5. Read from preview_array
  ```
- Right panel (copy-paste prompt card):
  *"Build a 'Fleet Insights' Add-In with a text input. Use Geotab Ace (async: create-chat → send-prompt → poll until DONE every 8s). Spinner: 'ACE is thinking...' Presets: 'Which drivers need coaching?', 'Fuel trend?', 'Maintenance alerts?'"*

---

### BLOCK 6 — Close (slides 20–21)

---

**Slide 20** `[x]` — Three Things Today
- Title: **"Three things. Today."**
- Three numbered blocks (large orange numbers):
  - **1** · Try the Gem — Geotab Add-In Architect on Gemini. Fleet problem → working Add-In in 10 minutes.
  - **2** · Sign up for MCP beta — Talk to Geotab before you leave.
  - **3** · Explore the guide — `github.com/fhoffa/geotab-vibe-guide` — everything from today.

---

**Slide 21** `[x]` — Closing Line
- Background: `0D1321`
- No title
- Full-slide quote (white, 32pt, centered):
  *"You used to write instructions.*
  *Now you describe outcomes.*
  *Bring your AI tools —*
  *Geotab is ready for that world."*
- Bottom-right (muted, small): *— Felipe Hoffa, Connect Europe 2026*
