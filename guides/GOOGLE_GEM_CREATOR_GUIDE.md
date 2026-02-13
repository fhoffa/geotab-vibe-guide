# How to Create a Google Gem for Geotab Add-Ins

<!-- AI MAINTAINER NOTE: When editing the Gem instructions, update the
     "last updated" date inside resources/GEM_INSTRUCTIONS.txt (not this file).
     Look for: **These instructions were last updated on: ...** -->

This guide shows you how to create a **Google Gem** (a custom AI assistant in Google Gemini) that generates MyGeotab Add-In configurations users can copy-paste directly into their Geotab system.

---

## What You're Building

A Google Gem called **"Geotab Add-In Architect"** that:
- Generates complete `configuration.json` files for MyGeotab
- Creates embedded Add-Ins (no hosting required)
- Produces ready-to-paste JSON that works immediately
- Follows Geotab's technical requirements and best practices

**Why a Gem?** Google Gemini can output well-formatted JSON that users can copy directly. Combined with the right instructions, it becomes a powerful Add-In generator.

---

## Creating the Gem

### Step 1: Open Google Gemini

1. Go to [gemini.google.com](https://gemini.google.com)
2. Click on **Gem manager** (in the left sidebar)
3. Click **New Gem**

### Step 2: Configure the Gem

**Name:** `Geotab Add-In Architect`

**Instructions:** Copy the entire contents of [`resources/GEM_INSTRUCTIONS.txt`](../resources/resources/GEM_INSTRUCTIONS.txt) and paste them into the Gem's instruction field.

> **The complete instructions live in a separate file so you can copy them easily.**
> Open [`resources/GEM_INSTRUCTIONS.txt`](../resources/resources/GEM_INSTRUCTIONS.txt) in the repository root, select all (Ctrl+A), copy (Ctrl+C), and paste into the Gem's instruction field.

---

## What's in the Instructions

The instruction file (`resources/GEM_INSTRUCTIONS.txt`) teaches the Gem to:

- Generate complete, ready-to-paste JSON Add-In configurations
- Follow all MyGeotab embedded Add-In constraints (inline CSS, ES5 syntax, etc.)
- Include debug tooling in every Add-In (Toggle Debug Log + Copy Debug Data)
- Use the Geotab API correctly (proper TypeNames, reference object resolution, unit conversions)
- Integrate with Geotab Ace for AI-powered fleet analysis
- Navigate within MyGeotab using `window.parent.location.hash`
- Run a pre-flight validation checklist before every response
- Version Add-Ins progressively so users can compare iterations side-by-side

### Key Sections in the Instructions

| Section | What It Covers |
|---------|---------------|
| Tone and Personality | Conversational, beginner-friendly, technical rules applied silently |
| JSON Structure Requirements | Required fields, name rules, supportEmail |
| Critical Embedded Add-In Rules | Inline CSS, CDN libraries, ES5 syntax, registration pattern, debug tools |
| Geotab API Integration | Available methods, TypeNames, reference objects, StatusData diagnostics |
| Geotab Ace | AI-powered queries with 3-step polling pattern |
| Navigation | Clickable entity links using `window.parent.location.hash` |
| Debugging Workflow | "Copy Debug Data first" — no guessing |
| Pre-flight Validation | 18-point checklist the Gem runs before every response |
| Version Tracking | Auto-increment name/version/menuName on each iteration |

For the full details, read [`resources/GEM_INSTRUCTIONS.txt`](../resources/resources/GEM_INSTRUCTIONS.txt) directly.

---

## Editing the Instructions

When you need to update the Gem's behavior, edit `resources/GEM_INSTRUCTIONS.txt` in the repository root (not this guide). Then:

1. Update the "last updated" date at the top of the instructions
2. Re-paste the updated instructions into your Gem in Gemini
3. Run `bash tests/gem-validation/run.sh` to validate
4. Review against `tests/gem-review/REVIEW_CHECKLIST.md`

---

## Step 3: Save and Test

1. Click **Save** in the Gem manager
2. Start a conversation with your new Gem
3. Test with: "Create an Add-In that shows my vehicle count and driver count"
4. Verify the JSON is properly formatted and complete

---

## Making the Gem Public

### Option 1: Share Link
1. In Gem manager, find your Gem
2. Click the share icon
3. Choose "Anyone with the link"
4. Share the URL

### Option 2: Publish to Gem Store (if available)
Follow Google's guidelines for publishing Gems publicly.

---

## Testing Your Gem

Test these prompts to ensure the Gem works correctly:

**Basic test:**
```
Create an Add-In that shows a welcome message with the current user's name
```

**Data display test:**
```
Build an Add-In that shows:
- Total vehicles
- Total drivers
- Current database name
```

**Styling test:**
```
Create an Add-In with a modern dashboard showing vehicle count in a card with shadow effects
```

**API operations test:**
```
Build an Add-In with a list of vehicles and a button to refresh the data
```

---

## Maintenance Tips

1. **Update instructions** when Geotab changes their API
2. **Add common patterns** users request frequently
3. **Include error examples** so users know what to expect
4. **Test regularly** with the actual MyGeotab interface

---

## Resources

- [Geotab Add-In Development Guide](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)
- [Geotab API Reference](https://geotab.github.io/sdk/software/api/reference/)
- [Building Add-Ins (Vibe Guide)](GEOTAB_ADDINS.md)
- [Embedded Add-Ins Reference](/skills/geotab/references/EMBEDDED.md)
