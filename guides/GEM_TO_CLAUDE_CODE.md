# From Gem to GitHub to Claude Code

**You built an Add-In with the Gem. Now let's make it yours.**

The Gem gives you a working Add-In in minutes. But it lives inside MyGeotab — a single blob of JSON you paste and paste again every time you want to change something. This guide shows you how to move that Add-In into a proper development workflow: version-controlled on GitHub, iterated with Claude Code, and ready to grow into something the Gem couldn't build alone.

---

## The Two Lanes

Before you continue, pick your lane:

| Lane | You are... | Your next step |
|------|------------|----------------|
| **Gem lane** | Fleet manager or non-developer | Keep using the Gem. The loop of describe → paste → test is fast and correct for your needs. |
| **Code lane** | Developer, reseller, or anyone who wants to extend, version, or share the Add-In | Continue with this guide. |

There's no wrong answer. The Gem produces real, production-quality Add-Ins. The code lane is for when you've hit its limits: you need external API calls, a React component, shared state, CI/CD, or you just want to stop copy-pasting JSON.

---

## Step 1: Get the Code Out of MyGeotab

You already have your Add-In installed. Go get the JSON back out:

1. MyGeotab → User profile icon (top-right) → **Administration → System → System Settings → Add-Ins**
2. Find your Add-In and click it
3. Click the **Configuration** tab
4. **Select all the JSON** and copy it

You should have something like this:

```json
{
  "name": "My Fleet Dashboard",
  "supportEmail": "...",
  "version": "1.0",
  "items": [{ "url": "dashboard.html", ... }],
  "files": {
    "dashboard.html": "<!DOCTYPE html>..."
  }
}
```

---

## Step 2: Create a GitHub Repository

If you don't have a GitHub account, create one at github.com (free). Then:

1. Go to **github.com/new**
2. Name your repo (e.g. `my-fleet-dashboard`)
3. Set it to **Private** if your Add-In contains any database-specific logic
4. Click **Create repository**

---

## Step 3: Create Your File Structure

In the new repo, create two files:

**`addin.json`** — paste your full JSON configuration here. This is the single source of truth.

**`CLAUDE.md`** — this is the context file Claude Code reads. Paste this in:

```markdown
# My Fleet Dashboard Add-In

This is a Geotab MyGeotab Add-In. The entire configuration lives in `addin.json`.
The HTML/JavaScript for the Add-In page is embedded as a string in `addin.json` 
under `files.dashboard.html`.

## How to deploy

Copy the full contents of `addin.json` and paste it into MyGeotab:
Administration → System Settings → Add-Ins → [your Add-In] → Configuration tab → Paste → Save

Then hard refresh the page (Ctrl+Shift+R).

## Geotab API patterns

- The `api` object is available globally in the Add-In (injected by MyGeotab)
- Use `api.call("Get", {...})` to fetch data
- All CSS must be inline (no <style> tags, no external stylesheets)
- No <link> tags — load external libraries from CDN using <script src="...">
- Always call `callback()` in the initialize function

## Key rules

- Never hardcode credentials — the api object handles auth automatically
- Result cap: api.call returns max 5,000 records — paginate for large fleets
- Test with: Administration → System Settings → Add-Ins → [your Add-In]

## How to work on this

When I ask you to change something, edit the HTML string inside 
`files.dashboard.html` in `addin.json`. Keep the surrounding JSON structure intact.
```

---

## Step 4: Open in Claude Code

Install Claude Code if you haven't: [claude.ai/code](https://claude.ai/code)

```bash
# Clone your repo
git clone https://github.com/yourusername/my-fleet-dashboard
cd my-fleet-dashboard

# Open Claude Code
claude
```

Claude Code will automatically read your `CLAUDE.md`. Now you're in an iterative development loop.

---

## Step 5: Iterate with Claude Code

This is where the Gem ends and Claude Code begins. Examples of what you can now ask:

**Things the Gem handles fine:**
```
Add a date range filter — let users pick "last 7 days", "last 30 days", "last 90 days"
```

**Things that need Claude Code:**
```
Add a backend call to our internal ERP system to pull open work orders 
and show them next to each vehicle
```

```
Rewrite this using React so we can share state between the table and the map
```

```
I need this to work as a hosted Add-In (not embedded) so I can include 
heavy chart libraries and a Node.js backend
```

**Debugging loop:**

1. Ask Claude Code to make a change
2. Claude edits `addin.json`
3. Copy the new JSON from `addin.json`
4. Paste into MyGeotab → Configuration → Save
5. Hard refresh (`Ctrl+Shift+R`)
6. Test → back to step 1

**Tip:** Tell Claude Code to add `console.log` statements when debugging. Open the browser console (F12) in MyGeotab to see the output.

---

## Step 6: Version Control Your Changes

```bash
git add addin.json CLAUDE.md
git commit -m "Add date range filter"
git push
```

Now you have a history of every change. You can roll back. You can share it with a teammate. You can open a pull request.

---

## When to Go Further

The embedded Add-In format (the Gem's output) has real limits:

| Limit | Symptom | Solution |
|-------|---------|---------|
| No external auth | Can't call APIs that need server-side keys | Move to hosted Add-In with a backend |
| No heavy libraries | Bundle size limits in embedded mode | Hosted Add-In with bundler |
| No persistent storage | Data resets on reload | Use Geotab's Storage API or an external DB |
| No shared state between pages | Each Add-In page is isolated | Hosted Add-In with shared state layer |

When you hit these limits, see [GEOTAB_ADDINS.md](./GEOTAB_ADDINS.md) for the hosted Add-In path.

---

## Quick Reference: Embedded vs Hosted Add-Ins

| | Embedded (Gem output) | Hosted |
|--|----------------------|--------|
| Setup time | 0 min | 30-60 min |
| Hosting needed | No | Yes (any server) |
| External API calls | No | Yes |
| Complex frameworks | No | Yes |
| CDN libraries | Yes | Yes |
| Data persistence | Geotab Storage API | Anything |
| Best for | Internal tools, quick dashboards | Partner products, complex UX |

---

## The Full Development Loop

```
Gem (describe → JSON → paste)
    ↓ when you want more control
addin.json in GitHub
    ↓ iterate with Claude Code
Claude Code (edit → paste → test → commit)
    ↓ when you hit embedded limits
Hosted Add-In (GEOTAB_ADDINS.md)
```

---

**You just connected the Gem's speed to Claude Code's depth. Everything the Gem built is still there — now you can extend it without limits.**
