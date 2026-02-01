# Building an Entire Educational Curriculum with Claude Code in 8 Days

*How I drove the creation of 133 commits, 70 files, and 11,000+ lines of documentation using nothing but natural language prompts*

## The Numbers That Tell the Story

| Metric | Value |
|--------|-------|
| Development time | 8 days (Jan 21-29, 2026) |
| Total commits | 133 |
| Files created/modified | 70 |
| Lines added | 11,185+ |
| Claude Code sessions | 10 |
| Pull requests | 18 |
| Debugging commits in one session | 48 (in a single day!) |

## What We Built

The [Geotab Vibe Coding Guide](https://github.com/fhoffa/geotab-vibe-guide) is a complete educational curriculum teaching developers to build fleet management applications using the Geotab API. It includes:

- **Beginner guides** for people who've never coded
- **Ready-to-use AI prompts** for Claude, ChatGPT, and Gemini
- **Working code examples** (vanilla JS, React with Zenith design system)
- **"Agent Skills"** - structured knowledge documents that help AI assistants understand Geotab's ecosystem
- **A Google Gem** that generates complete Add-Ins from natural language descriptions

All of this was created through conversation with Claude Code. I never wrote a line of code myself.

## The Workflow: Prompt → Branch → PR → Merge

Every feature started the same way:

1. **I described what I wanted** in natural language
2. **Claude Code created a branch** (always prefixed `claude/`)
3. **Claude wrote the code/docs**, committed with detailed messages
4. **I reviewed and merged** the PR

Here's what the branch history looks like:
```
claude/review-repo-structure-8saob
claude/beginner-guide-coding-tools-W0Duw
claude/add-password-security-warning-yO6R6
claude/add-geotab-guide-ZOdUk
claude/skills-guide-chapter-OtmQb
claude/document-html-addins-7aca2
claude/add-embed-styles-warning-gtSNi
claude/update-geotab-guide-skill-7S6wM
claude/style-vehicle-app-bZkvy
claude/geotab-zenith-design-skill-9O90X
claude/geotab-network-access-aAJA1
claude/geotab-addon-gem-B68XU
claude/document-geotab-demo-data-jYTot
claude/publish-gem-jJ70F
claude/add-google-gem-guide-GwTSl
claude/reorganize-resources-Zk5nr
claude/redirect-to-gem-jDx0I
```

Every session link was preserved in commit messages - you can literally trace every contribution back to its conversation.

## The Most Dramatic Chapter: The 6-Hour Debugging Marathon

January 23rd was wild. Between 2:55am and 9:11am (UTC), Claude Code and I went through **30+ commits** trying to solve one problem: why wouldn't our Geotab Add-Ins initialize?

The commit messages tell the story of systematic debugging:

```
03:03 - Add corrected embedded Add-In example with url field
03:10 - Add debug test Add-In to diagnose lifecycle issues
03:12 - Add geotab.addin object pattern test
03:14 - Add parent window test for Add-In API access
03:15 - Add test to explore geotab.addin object structure
03:21 - Add comprehensive test to find MyGeotab API object
03:23 - Add event listener test for Add-In initialization
03:54 - Add translations file - might be required for Add-In initialization
03:59 - Test both global and geotab.addin patterns
04:00 - Move lifecycle methods to external JS file
04:09 - Match Heat Map config structure exactly
04:12 - Use window.initialize instead of function initialize
04:13 - Add cache busting parameter to JS file
04:19 - Use geotab.addin.apitest pattern - matches Heat Map structure!
07:02 - Add minimal test mimicking Heat Map structure exactly
07:44 - Change geotab.addin name to match filename pattern
08:25 - Register Add-In under multiple possible names
08:46 - Backup original Heat Map main.js before modifications
08:48 - Use EXACT Heat Map pattern - minified, direct assignment
```

We tried everything. Different patterns. Different file structures. Copying working examples character-by-character. Adding translations files. Cache busting. Nothing worked.

Then, after I tested in the actual MyGeotab interface and reported back, the **BREAKTHROUGH**:

```
Fix Geotab Add-In initialization issue - remove immediate invocation

BREAKTHROUGH: The issue was using immediate function invocation ()!

The problem: We were using geotab.addin.name = function(){...}()
The solution: Use geotab.addin.name = function(){...} (no invocation!)

MyGeotab calls the function itself to get the Add-In object.
With immediate invocation, we were assigning the object directly,
so MyGeotab never called our function and never ran initialize().
```

Two parentheses. That's all it was. `()` at the end of a function assignment. Claude Code tried dozens of approaches, but this was an undocumented behavior that required real-world testing to discover.

**This is the essence of vibe coding**: AI does the heavy lifting, but human testing and feedback close the loop.

## Evolution of the Project

The git history shows clear phases:

### Phase 1: Foundation (Jan 21-22)
- Initial commit with basic guides
- Repository structure refinement
- Beginner-friendly explanations
- Security warnings about credentials

### Phase 2: Add-In Deep Dive (Jan 23-24)
- 48 commits on Jan 23 alone
- Comprehensive debugging of Geotab Add-Ins
- Discovery of critical patterns
- Creation of "Agent Skills" format

### Phase 3: Design Systems (Jan 25-28)
- Geotab Zenith design system integration
- React component examples
- Progressive learning paths (vanilla JS → Zenith)
- Vehicle Manager example app

### Phase 4: Democratization (Jan 28-29)
- Google Gem guides for no-code Add-In creation
- Demo database reference documentation
- Final navigation improvements

## What Made This Work

### 1. Detailed Session Tracking
Every commit includes a Claude Code session URL:
```
https://claude.ai/code/session_014APYkA7BGGCpduvAcFg9as
```

This creates perfect traceability. Anyone can see exactly which conversation produced which code.

### 2. Small, Focused PRs
Instead of one massive PR, we created 18 focused ones:
- `#4: add-geotab-guide`
- `#7: add-embed-styles-warning`
- `#10: geotab-zenith-design-skill`
- `#13: geotab-addon-gem`

Each PR could be reviewed and merged independently.

### 3. Iterative Refinement
The ratio of "Add" to "Fix" commits shows healthy iteration:
- 52 "Add" commits (new features)
- 8 "Fix" commits (corrections)

We didn't try to get things perfect on the first try. We added, tested, fixed, and improved.

### 4. Human-in-the-Loop Testing
Claude Code can write code, but it can't actually *run* a Geotab Add-In in MyGeotab. My role was:
- Testing in real environments
- Reporting what actually happened
- Providing feedback that guided the next iteration

## The "Battle-Tested" Prompt

After the debugging marathon, we created what we called the "battle-tested AI prompt" - a carefully crafted prompt that encodes everything we learned:

```
You are building a Geotab MyGeotab Add-In. Critical rules:
- Use `geotab.addin.name = function(){...}` NOT `function(){...}()`
- MyGeotab calls your function to get the Add-In object
- Never use immediate invocation
- The `api` object is injected by MyGeotab...
```

This prompt can now help any AI assistant avoid the pitfalls we discovered.

## Lines of Code vs Lines of Prompts

Here's something remarkable: I probably wrote fewer than 500 words of prompts total. Claude Code produced 11,000+ lines of content.

That's a **22x amplification factor**.

And the content isn't boilerplate - it's carefully structured educational material, working code examples, and troubleshooting guides informed by real debugging experience.

## Lessons for Vibe Coding

1. **Let the AI drive, but stay in the car**. You're not coding, but you're steering.

2. **Small commits beat big commits**. 133 small, well-documented commits are easier to review than 10 massive ones.

3. **Session links are gold**. Being able to trace every line back to its conversation creates accountability and learning opportunities.

4. **Test in the real environment**. AI can simulate many things, but some bugs only appear in production.

5. **Document the journey, not just the destination**. The debugging guide we created is more valuable than the working code - it saves others from the same struggle.

## Try It Yourself

The entire repository is open: [github.com/fhoffa/geotab-vibe-guide](https://github.com/fhoffa/geotab-vibe-guide)

Start with the [Google Gem User Guide](./guides/GOOGLE_GEM_USER_GUIDE.md) and build your first Geotab Add-In by describing what you want in natural language.

That's vibe coding. That's the future.

---

*Built with Claude Code. Every commit tells a story.*
