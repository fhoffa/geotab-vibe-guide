# Masterclass Session Plan: Vibe Coding Demo + ACE
**Connect Europe 2026 — Barcelona Track**
**02:50 PM – 03:50 PM | 60 minutes | Felipe Hoffa**

---

## Precise Timing at a Glance

| Clock | Duration | Block |
|-------|----------|-------|
| 02:50 | 1 min | Opening beat |
| 02:51 | 14 min | **Hackathon showcase** — video + winner + lessons |
| 03:05 | 9 min | **Gem demo** — build with the audience |
| 03:14 | 2 min | **Skills** — what this repo is, how Claude knows Geotab things, how your team does this |
| 03:16 | 15 min | **Claude + official MCP** — live demo |
| 03:31 | 12 min | **ACE in three contexts** — demo + what's next |
| 03:43 | 5 min | Close + Q&A + handoff to Abhinav |
| 03:48 | buffer | *(leave 2 min buffer — Abhinav needs his time)* |

---

## Context Going In

By the time you walk on stage the audience has heard:
- **Abhinav (02:00–02:10):** What vibe coding is. Human as architect, AI as hands.
- **Jorge & Ronald (02:10–02:30):** Real Geotab projects already in production.
- **20 min networking:** Energized and ready to see something real.

**Your job:** Start with proof (the hackathon), involve them (Gem), show the frontier (MCP + ACE).

---

## 02:50 — Opening Beat (1 min)

*[Start the 1-minute summary video immediately as you walk on:]*
**https://www.youtube.com/watch?v=BD0U9Zf-LvY**

While it plays (or right after): "That was the competition. 47 teams. Three weeks. $25,000 in prizes. And Geotab as the API. Let me show you what happened."

---

## 02:51 — Hackathon Showcase (14 min)

### The judging process itself (3 min)

"We got 47 submissions. 43 repos downloaded and code-inspected — not by humans reading READMEs, but by Claude Code reading every source file."

"We used vibe coding to judge vibe coding."

Walk through the judging rubric briefly:
- **Useful (35%)** — would a real fleet team use this?
- **Original (25%)** — clear differentiator?
- **Fun (15%)** — engaging to use?
- **Well-done (25%)** — execution quality AND promise-to-code alignment

**The biggest lesson from judging:**

> "The #1 differentiator across 47 submissions was not the idea. Not the UI. It was whether the project connected to **real fleet data**."

"Project after project had polished demos — dashboards, voice interfaces, AI coaching. And when Claude Code read the actual source files, it found `Math.random()`, `seed-data.ts`, `fakeData.ts`. Beautiful apps. No real data."

"The ones that won: real Geotab API calls. Real driver names. Real trips. Real fault codes."

"This is the 'avoiding pitfalls of unreliable data' problem in action. Vibe coding gives you speed. But speed building on fake data is just a faster fake."

---

### The winner (8 min)

**Slide: FleetShield AI — Vimal Kanagaraj**

"The winner was FleetShield AI, built by Vimal. Here's the interview:"

*[Play excerpt from winner interview — 4–5 minutes:]*
**https://www.youtube.com/watch?v=G3A8PjtovN8**

After the video, narrate what makes it remarkable:

**What it actually does:**
An operator says to the voice AI: *"Run a coaching sweep."* The system:
1. Scores every driver against their 90-day personal baseline
2. Creates action items with training programs in each driver's portal
3. Places actual Twilio phone calls to flagged drivers — the AI calls them

"Operator voice command to driver phone call, automatically. Without a human in the loop."

**What's under the hood (for the developers in the room):**
- 17 Claude agent tools with real Geotab API connections
- 9 industry-grounded scoring engines — insurance formulas, FMCSA safety standards, burnout detection
- Two voice AI surfaces: Operator Tasha (voice assistant for fleet managers) and Driver Mike (actual Twilio calls)
- Full Geotab integration: JSON-RPC API, Ace polling, OData Data Connector

**The architectural detail that won it:**

"The team wrote a 736-line CLAUDE.md. A 736-line engineering guide that taught Claude exactly how their system worked — every API pattern, every Geotab quirk, every scoring formula. They didn't just vibe code. They made Claude an expert in their domain first."

"That's the architect mindset Abhinav described earlier. You can't vibe your way to correct insurance risk formulas. You have to define the intent precisely. Then the AI executes."

---

### The landscape (3 min)

Brief walk through the other categories — show there was genuine range:

**Playlist:** https://www.youtube.com/playlist?list=PLG1fouPFF9lydA6SmkGlZbhDJyaI4MsBG

- **FuelGuard MCP** — fuel theft detection using graph clustering. A developer built an MCP server from scratch to detect when vehicles are losing fuel faster than expected.
- **Attrix vibe challenge** — Attrix is a Geotab reseller since 2015. They used AI to build their *own* Add-In scaffolding tooling and then built "Last Week in Fleet" — a native MyGeotab summary across safety, sustainability, compliance.
- **ActionEngine** — a 6-algorithm GPS data quality validator. Not glamorous, but a fleet tool that would actually save hours of data cleaning.
- **GeoSafe** — AI-suggested geofence zones based on where vehicles actually stop. The Gem could do this today.

"43 projects that weren't the winner taught me something too: the *idea* is almost never the bottleneck. The bottleneck is whether you can connect it to real data and make it actually work."

---

## 03:05 — Gem Demo: Build With the Audience (10 min)

### Setup (30 sec)

"We're going to build a MyGeotab Add-In together, right now, in this room. I need your input."

Open the Gem: **https://gemini.google.com** → Geotab Add-In Architect Gem

### Audience vote (30 sec)

"What fleet problem should we solve? Give me one."

**Backup prompt if the room is quiet:**
> "Safety coaching dashboard — show me my 10 riskiest drivers ranked by speeding and harsh braking events this week. Color code them red/yellow/green."

### Build live (6 min)

Type the audience's description. Narrate while it generates:

- "The Gem knows the Geotab API structure — TypeNames, fields, auth patterns. It's been pre-loaded with the knowledge base."
- "Notice it's writing inline CSS. MyGeotab's embedded Add-In format requires this — no `<style>` tags, no external stylesheets. The Gem handles this automatically."
- "It's generating a complete JSON blob — the HTML, the JavaScript, the Add-In config, all in one file."

When it's done:
1. Copy the JSON
2. MyGeotab → Administration → System Settings → Add-Ins → New Add-In → Configuration → Paste → Save
3. Hard refresh (`Ctrl+Shift+R`)
4. Click the new sidebar item

**Let the data load. Don't fill the pause. Let the audience see their Add-In appear.**

### The "what just happened" beat (1 min)

"That was the Gem. No install. No hosting. No build step. We described a fleet problem and it exists in MyGeotab."

"This is the fastest path to a working Add-In. For many fleet managers, this is the destination."

### The GitHub gap (1 min)

"For developers who want to take this further — the Gem has a ceiling. When you need external API calls, React, or something that runs outside MyGeotab — you need to get this code into a repo and open it in Claude Code."

"We wrote that guide today. It's at `guides/GEM_TO_CLAUDE_CODE.md` in the vibe guide. The short version: copy the JSON out, create a GitHub repo, add a `CLAUDE.md` that explains the Add-In context, open Claude Code. Four steps."

"And Claude Code catches the data pitfalls the Gem doesn't — like the API result cap that silently undercounts your fleet."

---

## 03:14 — Skills: How Claude Knows Geotab (2 min)

> **The bridge between the Gem and everything else.** This is the honest disclosure of what this repo is and why it matters beyond this session.

### What to say

"I want to show you what's actually powering everything we've built today."

"This repo — `github.com/fhoffa/geotab-vibe-guide` — has two layers."

**Slide: The vibe guide repo**

| For humans | For AI tools |
|-----------|-------------|
| `guides/` — tutorials, walkthroughs, prompts | `skills/geotab` — the complete Geotab dev guide |
| The Gem guide, this session's assets | `skills/agentic-n8n` — fleet automation with n8n |
| The Gem→GitHub→Claude Code bridge | `skills/geotab-custom-mcp` — building MCP servers |

"The Gem works because Geotab encoded fleet domain knowledge into it — what the API types are called, how Ace polling works, what the result cap is, every gotcha. That same knowledge is packaged as a *skill* any AI tool can load."

"The format is open — [agentskills.io](https://agentskills.io). Your team can do this for your own domain. Your internal ERP. Your dispatch platform. Your maintenance system. One domain expert writes it once. Every AI in your organization benefits — Claude Code, Codex, Gemini, doesn't matter."

"This is how you escape the generic AI problem. Generic Claude doesn't know your API. A skill fixes that."

**In 30 seconds:**
- This repo: `github.com/fhoffa/geotab-vibe-guide`
- Skills load into Claude Code: `/plugin marketplace add fhoffa/geotab-vibe-guide`
- Your team creates skills the same way: one SKILL.md file, your domain knowledge, committed to GitHub

---

## 03:16 — Official Geotab MCP: Live Demo (15 min)

### The framing (2 min)

**Slide: "AI assistants are becoming a business tool — like email, like a browser."**

"Before I show you this, I want to ask: how many of you are already using Claude, or ChatGPT, or another AI assistant for real work — not experimenting, actually using it?"

[pause for hands]

"That number is going to be everyone in this room in two years. The question isn't whether your employees will have AI assistants. The question is: when they do, what can they do with your fleet?"

"The wrong question to ask about what I'm about to show you is: 'Why is Geotab making me pay for Claude?' Nobody asks why Salesforce integrates with Slack — they ask what they can accomplish with Salesforce in Slack."

"The right question is: **what becomes possible for my business when my AI assistant can talk to my fleet?**"

"That's what MCP enables. It's an open standard — not Geotab-specific — that lets AI assistants connect to external data and tools."

"Here's the frame I want you to take away: Geotab isn't *adopting* AI. Geotab is *ready* for the AI-native world you're already entering. The Gem — ready. Skills in an open format any AI tool can use — ready. The official MCP — almost ready. The message is: bring your AI tools, we'll meet you there."

"I have early access. Let me show you."

---

### What MCP looks like (30 sec)

```
Without MCP:
You ask Claude: "Which vehicles are offline?"
Claude: "I can help you write code to query that..."

With Geotab MCP:
You ask Claude: "Which vehicles are offline?"
Claude: *queries Geotab live* "2 vehicles haven't communicated 
in 24 hours — GVF-1204 (last seen near Lyon 3 days ago) and 
GVF-0891 (last seen near Valencia 5 days ago)."
```

"No code. No dashboard. No separate login. Your fleet is part of the conversation."

---

### The 20 tools — quick pass (2 min)

**Slide: 20 tools, 5 categories**

| Category | What it does |
|----------|-------------|
| **Data Retrieval** | Get (any entity), GetCountOf, GetAceResults (natural language), ListEntities, GetEntity |
| **Fleet Management** | Add, Set, Remove (create/update/delete), DecodeVins |
| **Safety & Compliance** | DismissFaults, GetHosRuleSets, EmissionEnrollDevices, EmissionDeadline, GetPostedRoadSpeeds |
| **Video (Go Focus)** | SearchMedia, GetMediaUrl, GetDevicesInformation, DownloadMediaFile, UploadMediaFile |
| **Reporting** | SendReportProcessingRequest |

"Full read *and* write. This isn't a read-only analytics layer — you can create zones, update rules, manage groups, trigger reports, all from a conversation."

---

### Live demo (10 min)

> Open Claude Desktop with the official Geotab MCP connected.

**Chain 1: Fleet health (2 min)**

```
You: "How many vehicles do I have and which ones haven't 
communicated in the last 24 hours?"

Claude: [GetCountOf + Get] "50 active vehicles. 2 offline:
GVF-1204 (last seen 3 days ago, Lyon area) and GVF-0891 
(last seen 5 days ago, Valencia area). Want their fault history?"
```

*"Two API calls. One question. No MyGeotab tab open."*

**Chain 2: From question to action (4 min)**

```
You: "Which drivers had the most harsh braking events last week?"

Claude: [GetAceResults] "Top 3: Martinez (14 events), Chen (11), 
Okonkwo (9). All in the Southern Region group."

You: "Decode the VINs for their assigned vehicles."

Claude: [DecodeVins] "All three are 2021 diesel vans — 
Mercedes Sprinter, Ford Transit, Renault Master."

You: "Create a group called 'Safety Coaching Q2' and add them."

Claude: [Add + Set] "Done. Group created. All three assigned."
```

*"Query → analyze → act. One conversation. This is what FleetShield AI's operator does with a voice command. You're doing it in a chat."*

**Chain 3: Video (2 min — if Go Focus cameras in the fleet)**

```
You: "Any Go Focus footage from harsh braking events last week?"

Claude: [SearchMedia] "3 video requests. Most recent: Tuesday 
14:23, vehicle GVF-4411, driver Martinez."

You: "Give me the playback link."

Claude: [GetMediaUrl] "Here: [url]"
```

**Chain 4: Report generation (30 sec)**

```
You: "Queue the weekly safety report for the Southern Region 
and send it as a PDF."

Claude: [SendReportProcessingRequest] "Report queued. Storage 
ID returned — I'll let you know when it's ready."
```

*"That's your existing report template, triggered from a conversation."*

---

### Custom MCP — side note (30 sec)

"While we were waiting for the official version, I built a demo at `github.com/fhoffa/geotab-ace-mcp-demo`. It's read-only, Ace-only, but works in 15 minutes if you can't wait for beta access. Treat it as a preview, not a replacement."

---

## 03:30 — ACE in Three Contexts (13 min)

> ACE appeared in the MCP demo as `GetAceResults`. Zoom out now and show the full picture.

**Slide: "Same AI engine. Three places. Different possibilities."**

---

### Context 1: The MyGeotab Web UI (3 min)

"Most of your fleet managers are already using this. There's an AI assistant built into MyGeotab. You ask it questions in plain English and get answers. No code. No Add-In. No setup."

Live demo (or walk through pre-recorded):
- "Which vehicles drove the most distance this week?" → result
- "Which drivers had the most safety events?" → result
- **Show the SQL ACE generated.** "This is the hidden value. ACE shows you the query it ran. This is the fastest way to learn the Geotab data model — you ask questions and read the SQL. It's like having a Geotab database expert explain the schema in real time."

**The data accuracy note:**
"ACE is great for exploration. For mission-critical numbers, cross-check it. ACE added an implicit `IsTracked = TRUE` filter on a distance query we ran — the result was 304,000 km when the actual answer was 490,000 km. It wasn't wrong from ACE's perspective — but it wasn't what we asked for. Read the SQL."

**When to use:** Ad-hoc questions, learning the data model, fleet manager self-service.

---

### Context 2: ACE via MCP — speed vs depth (3 min)

"We just saw `GetAceResults` as one of 20 MCP tools. The important nuance is *when to use it* versus the direct API methods."

**Slide: Speed comparison**

| | GetAceResults (ACE) | Direct API (Get, GetCountOf) |
|--|---------------------|------------------------------|
| Speed | 30–45 seconds | < 1 second |
| Query type | Natural language | Structured |
| Best for | Complex analysis, trend questions, questions you don't know how to structure | Counts, lookups, real-time data |
| Caveat | May add implicit filters | 5K result cap without pagination |

"We ran the same fleet-wide distance question through both. ACE took 41 seconds. The direct API took 1.3 seconds. For a dashboard that loads when a manager clicks a button, that's the difference between feeling fast and feeling broken."

"The MCP is smart: use natural language for questions where you need ACE's reasoning. Use the direct API tools when you know exactly what you want."

Reference: [DATA_ACCESS_COMPARISON.md](./DATA_ACCESS_COMPARISON.md) has the full benchmark.

**When to use ACE in MCP:** Complex analytical questions where you can tolerate 30–45 seconds and need the AI's interpretation, not just raw data.

---

### Context 3: ACE Inside an Add-In (4 min)

"The third context is the one you can build right now with the Gem."

**What it looks like:** An Add-In with a text input. Fleet manager types a question. ACE processes it. The answer appears inside MyGeotab.

**The one technical wrinkle:** ACE is async — you can't call it and wait synchronously. You have to poll.

```
1. create-chat → get chat_id
2. send-prompt (chat_id + question) → get message_group_id
3. Wait 10 seconds
4. Poll get-message-group every 8 seconds until status === "DONE"
5. Read answer from message_group.messages[id].preview_array
```

"Tell the Gem this explicitly: 'Use Geotab Ace with the async create-chat → send-prompt → poll pattern. Include a loading spinner.' It knows the rest."

**The Gem prompt that builds this:**

```
Build a "Fleet Insights" Add-In with a text input where managers can ask 
questions about the fleet. Use Geotab Ace (async: create-chat → send-prompt 
→ poll get-message-group until DONE, every 8s). Show a loading spinner 
with "ACE is thinking..." while waiting.

Add preset buttons for common questions:
- "Which drivers need coaching this week?"
- "What's our fuel trend this month?"  
- "Which vehicles might need maintenance?"

Show the AI's reasoning text below the answer.
```

**Why this matters:** "Imagine a fleet manager who opens your custom Add-In and types 'Why is our fuel cost up this month?' — and gets an AI-powered answer from their actual fleet data, inside your interface, without switching apps. FleetShield AI did this with voice. The Gem can give you the text version in minutes."

**Verified:** ACE works from embedded Add-Ins. The auth comes from the MyGeotab session automatically.

---

### What's next (3 min)

"The official MCP is the signal that Geotab is treating AI assistants as a first-class surface for fleet operations."

"The Gem today. Claude Code for depth. Official MCP when beta opens. ACE in all three places."

"The pattern is always the same: you define the intent. The AI handles the syntax. And you make sure it's connecting to real data."

---

## 03:43 — Close + Q&A (5 min)

### Slide: "Three things you can do today"

1. **The Gem** — [Geotab Add-In Architect Gem on Gemini]. Describe a fleet problem to it. You'll have a working Add-In in MyGeotab in 10 minutes. Zero code.

2. **Sign up for MCP beta** — Talk to Geotab before you leave today. When the official MCP opens, you'll be first to connect Claude to your live fleet.

3. **The vibe guide** — `github.com/fhoffa/geotab-vibe-guide`. Everything from today is there: the Gem guide, the Gem → GitHub → Claude Code bridge, the ACE comparison, the hackathon entries and videos.

### Slide: "The shift in one sentence"

> "You used to write instructions. Now you describe outcomes. Bring your AI tools — Geotab is ready for that world."

### Two questions max, then hand to Abhinav.

---

## Demo Environment Checklist

> Run morning of May 18 + again 30 min before 02:50.

- [ ] 1-minute intro video (BD0U9Zf-LvY) queued, full screen, no autoplay interference
- [ ] Winner interview (G3A8PjtovN8) queued to the right spot for your excerpt
- [ ] MyGeotab demo account logged in, on the Add-Ins admin page
- [ ] Gem open in a browser tab (pre-navigated, not cold)
- [ ] Claude Desktop running with official MCP confirmed connected
- [ ] Test: `GetCountOf` returns a number < 5 seconds
- [ ] Test: `GetAceResults` with a simple question end-to-end (allow 60 seconds)
- [ ] Go Focus video chain tested if you're using SearchMedia/GetMediaUrl
- [ ] Backup screen recording ready: Gem build (3 min) + MCP conversation (3 min)
- [ ] Slide deck in presentation mode, clicker in hand
- [ ] Timer visible — 60 minutes runs fast

### If demos break

| What breaks | Do this |
|-------------|---------|
| Gem output looks wrong | Iterate once: "Fix the JSON syntax error and regenerate." If still broken, paste pre-built JSON directly into MyGeotab. |
| MyGeotab paste fails | Show the JSON on screen, narrate what it contains. Move on in under 60 seconds. |
| MCP not connecting | Switch to the screen recording. "Here's what this looked like when I ran it this morning." Be honest. Audiences forgive recorded demos. |
| Any demo broken > 90 seconds | Cut it. Move to the next block. The talking points are enough. |

---

## Key Messages (One Per Block)

| Block | The One Sentence |
|-------|-----------------|
| Opening | "47 teams. 3 weeks. We used AI to judge AI. Let me show you what won." |
| Hackathon | "The winner connected to real data. The losers ran on Math.random()." |
| Gem | "You described it — it exists in MyGeotab." |
| Skills | "Geotab encoded their knowledge once. Your team can do the same." |
| MCP | "Geotab isn't adopting AI — it's ready for the AI-native world you're already entering." |
| ACE | "Same engine. Web UI, MCP tool, or Add-In widget — you pick the context." |
| Close | "Three things you can do today." |

---

## Q&A Prep

**Q: Does my team need to pay for Claude to use the MCP?**
The MCP requires a Claude subscription (~$20/month for Pro, or enterprise). But flip the question: are you evaluating AI assistants for your business? That's the right starting point. When your employees have Claude for general work, Geotab being connected to it is a value-add on something you're already buying — not a new cost Geotab is adding. You're not buying Claude for Geotab. You're buying Claude for your business, and Geotab comes along for the ride.

**Q: How do I get into the MCP beta?**
Talk to Geotab before you leave today. Beta is opening soon. The custom demo at `github.com/fhoffa/geotab-ace-mcp-demo` works today — read-only, Ace-only, 15-minute setup with Claude Desktop.

**Q: Does the Gem work with production accounts?**
Yes. For learning, use a demo account (free at my.geotab.com/registration.html). For production: the embedded Add-In only reads data via the Geotab API — no writes unless you specifically build them in.

**Q: What about driver privacy with the MCP?**
The MCP runs against your Geotab account with the same permission model — users only see vehicles and drivers they have access to. Fleet data goes from Geotab to your machine, not to Anthropic's servers (unless you explicitly paste data into the chat).

**Q: Does ACE work inside embedded Add-Ins?**
Yes, verified. It uses the same session auth as the rest of the Add-In. The async polling pattern is the critical part — the Gem handles it if you ask explicitly.

**Q: The winner had 17 AI agent tools and 736 lines of CLAUDE.md — is that what it takes to win a hackathon?**
Scope isn't the point. Several high-scoring projects were small and focused. What FleetShield AI's CLAUDE.md shows is intentionality — they defined their domain precisely before asking AI to execute. You can do that with a 50-line CLAUDE.md if your problem is tight. The architect's clarity matters more than the project's size.

---

## Supporting Materials

| Resource | URL |
|----------|-----|
| Intro video | https://www.youtube.com/watch?v=BD0U9Zf-LvY |
| Winner interview (FleetShield AI) | https://www.youtube.com/watch?v=G3A8PjtovN8 |
| Full playlist | https://www.youtube.com/playlist?list=PLG1fouPFF9lydA6SmkGlZbhDJyaI4MsBG |
| Vibe guide | https://github.com/fhoffa/geotab-vibe-guide |
| Gem | https://gemini.google.com → Geotab Add-In Architect |
| Custom MCP demo | https://github.com/fhoffa/geotab-ace-mcp-demo |
| Gem → Claude Code guide | guides/GEM_TO_CLAUDE_CODE.md |
| Data accuracy comparison | guides/DATA_ACCESS_COMPARISON.md |
