# From Gem to Claude Code

**You built a MyGeotab Add-In with the Gem. Now it needs to grow.**

The Gem is fast. You described a problem, it gave you JSON, you pasted it into MyGeotab and it worked. That's a complete workflow — for some Add-Ins, it's all you need. This guide is for when that's not enough.

---

## When Does the Gem Stop Being Enough?

The Gem works inside a conversation. It can't run your Add-In, can't test it, can't hold a diff across 20 revisions, and can't coordinate multiple files. Here's when to move:

| Signal | What's happening |
|--------|-----------------|
| You're copy-pasting JSON repeatedly to fix the same bug | You need version control |
| The Add-In needs to call an external API with secret keys | Embedded Add-Ins can't hold server-side secrets — you need a backend |
| You want tests | Automated testing requires a real dev environment |
| The Gem is losing context across revisions | Long conversation threads drift; Claude Code reads the actual file |
| You need deeper Geotab API knowledge than the Gem has | The Gem carries a curated subset of the skill — Claude Code can load the full skill with all 13 reference files |
| You want teammates to contribute | GitHub gives you collaboration, history, code review |
| The Add-In logic is getting complex enough that it deserves documentation | A proper project can be documented, versioned, and handed off |
| You want to publish to the Geotab Marketplace | Marketplace Add-Ins need to meet quality and hosting requirements |

If none of these apply yet — stay in the Gem. Keep iterating there. There's no reason to add complexity you don't need.

---

## The Handoff: One Prompt

The fastest way to move from Gem to Claude Code isn't a set of steps — it's a prompt.

1. Copy your Add-In JSON out of MyGeotab (Administration → System Settings → Add-Ins → your Add-In → Configuration tab → select all → copy)
2. Open [Claude Code](https://claude.ai/code) in an empty folder
3. Paste this:

```
I have a MyGeotab Add-In I built with the Geotab Gem. Here's the JSON:

[paste your JSON here]

Please:
1. Turn this into a proper project — create addin.json with the current code
2. Create a CLAUDE.md that explains the Geotab Add-In constraints 
   so you can help me develop this further
3. Initialize a git repository
4. Create a GitHub repository called [name] and push this as the first commit
5. Write a short README explaining what this Add-In does

I'll describe what I want to change next.
```

Claude Code handles the git commands, creates the files, pushes to GitHub. You describe; it executes.

---

## Think in Prompts, Not in Code

You don't need to learn git commands, file structures, or JavaScript. Claude Code reads the codebase, understands what's there, and makes changes. Your job is to describe what you want clearly.

**Examples of how to drive this:**

```
Add a date range filter at the top — last 7 days, last 30 days, last 90 days.
Make it affect all the data on the page.
```

```
The table is loading slowly for large fleets. 
The Geotab API returns max 5,000 results — paginate the requests 
and show a progress indicator while loading.
```

```
When a driver's name is clicked, open a panel on the right side 
showing their last 10 trips. Use the Trip API.
```

```
Something's broken — the vehicle count shows 0 after the date filter is applied.
Can you add console.log statements to debug what's happening?
```

After Claude makes changes:
1. Copy the updated `addin.json`
2. Paste into MyGeotab → Configuration → Save
3. Hard refresh (`Ctrl+Shift+R`)
4. Test → describe the next change

When you're happy with a round of changes, tell Claude Code: *"Commit this and push to GitHub."* It handles the rest.

---

## Loading Geotab Knowledge with a Skill

The Gem works because Geotab domain knowledge was embedded into it — but it carries a curated subset. Claude Code can load the full skill:

```
/plugin marketplace add fhoffa/geotab-vibe-guide
```

This gives Claude Code the complete Geotab developer reference — all 13 files covering TypeNames, auth patterns, ACE polling, result caps, zone/group APIs, Add-In constraints, and every known gotcha. The Gem doesn't have all of this; Claude Code with the full skill does. For complex Add-Ins that push into less-common API territory, this matters.

The `CLAUDE.md` in your project still matters for your specific Add-In's context (what it does, what files to edit, how to deploy). The skill handles the Geotab knowledge layer.

---

## What's Possible in an Embedded Add-In

Before assuming you need a backend, here's what works inside the Gem's embedded format:

| Capability | Available in embedded Add-In? |
|------------|------------------------------|
| Geotab API calls (Get, Trip, Device, etc.) | ✅ Yes — `api.call(...)` is injected automatically |
| Geotab Storage API (key-value persistence) | ✅ Yes — `api.call("Set", {typeName: "PropertySet", ...})` |
| CDN libraries (charts, maps, etc.) | ✅ Yes — load via `<script src="https://...">` |
| Geotab ACE (AI fleet queries) | ✅ Yes — via async polling pattern |
| External API calls (public endpoints) | ✅ Yes |
| External API calls requiring secret keys | ❌ No — embedded code is visible in MyGeotab |
| React / bundled frameworks | ❌ Not recommended — no build step available |
| Node.js or server-side logic | ❌ Needs a hosted Add-In |

The Geotab Storage API is particularly underused: it lets your Add-In save user preferences, cached data, or lightweight configuration — without any external database.

---

## When You Need a Hosted Add-In

Some requirements genuinely need a backend:

- External APIs with secret keys (Slack, Salesforce, internal ERP)
- Heavy client-side frameworks with a build step (React with Webpack/Vite)
- Persistent storage beyond what the Storage API offers
- Processing that's too heavy for the browser

When you get there, tell Claude Code:

```
This Add-In needs to call our internal ERP at [url] with an API key. 
I can't expose that key in the browser. 
Convert this to a hosted Add-In with a simple Node.js proxy backend.
```

Claude Code will restructure the project. See [GEOTAB_ADDINS.md](./GEOTAB_ADDINS.md) for the full hosted Add-In architecture.

---

## What GitHub Is (and Why You Want It)

GitHub stores your code online with full history — every change you ever made is recorded and reversible. It also lets you collaborate, review changes before applying them, and recover from mistakes.

You don't need to learn git commands. Tell Claude Code what you want:

```
Save my work and push it to GitHub.
```

```
Create a pull request for the changes I just made so I can review them.
```

```
I made a mistake in the last change — revert to the version before.
```

```
My teammate made changes to the repo. Pull the latest version.
```

Claude Code translates your intent into the right git operations.

---

## The Development Loop

```
Gem  ──────────────────────────────────────────────────────────────────────
  Describe fleet problem → Gem generates JSON → Paste → Test → Iterate
  ↓ when complexity grows
Claude Code  ──────────────────────────────────────────────────────────────
  Paste JSON → "Turn this into a project" → Describe changes → Test → Commit
  ↓ when you hit embedded limits
Hosted Add-In  ────────────────────────────────────────────────────────────
  Claude restructures project → backend added → deploy → connect Marketplace
```

The Gem and Claude Code aren't competing. The Gem builds the first version fast. Claude Code takes it the rest of the way.
