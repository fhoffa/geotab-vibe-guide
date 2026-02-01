# I Didn't Write a Single Line of Code. I Built This Anyway.

It's 3am and I'm staring at my screen, watching Claude Code churn through yet another attempt to fix a bug that's been haunting us for hours. We've tried everything. Different patterns. Different file structures. We literally copied a working example character-by-character. Nothing works.

Eight days later, I'd have a complete educational curriculum—133 commits, 70 files, 11,000+ lines of tutorials, working code examples, and troubleshooting guides. I never wrote a single line of code myself.

This is the story of building the [Geotab Vibe Coding Guide](https://github.com/fhoffa/geotab-vibe-guide) entirely through conversation.

## It Started With a Simple Idea

I work with developers who want to build fleet management applications using the Geotab API. Most of them hit the same walls: confusing documentation, authentication headaches, and that particular flavor of frustration that comes from staring at code that *should* work but doesn't.

What if I could create a curriculum that taught them to build these apps using AI assistants? Not just tutorials—but actual prompts they could copy-paste and run?

I opened Claude Code and typed something like: *"Help me create a beginner-friendly guide for building Geotab applications using AI tools."*

And we were off.

## The Rhythm: Prompt, Branch, Ship

We fell into a pattern quickly. I'd describe what I wanted. Claude would create a branch, write the content, commit it with detailed messages, and push. I'd review, maybe ask for tweaks, then merge.

The branches tell the story:
```
claude/review-repo-structure-8saob
claude/add-password-security-warning-yO6R6
claude/add-geotab-guide-ZOdUk
claude/geotab-zenith-design-skill-9O90X
claude/geotab-addon-gem-B68XU
```

Eighteen pull requests in eight days. Each one focused on a single feature or improvement. Each one traceable back to the conversation that created it through a session URL embedded in every commit message.

The first two days were smooth. We built the foundation—beginner glossaries, security warnings about not sharing passwords with AI tools, explanations of what "vibe coding" even means.

Then came January 23rd.

## The Night Everything Broke

I wanted to add a chapter on building Geotab Add-Ins—custom pages that live inside MyGeotab. Seemed straightforward. Geotab has examples. There's documentation. How hard could it be?

At 2:55am, Claude pushed the first commit: *"Add comprehensive Geotab Add-Ins guide and example."*

By 3:03am, we knew something was wrong: *"Fix Add-In guide with working examples and troubleshooting."*

By 3:10am, we were deep in the weeds: *"Add debug test Add-In to diagnose lifecycle issues."*

What followed was six hours of increasingly desperate commits:

```
03:12 - Add geotab.addin object pattern test
03:14 - Add parent window test for Add-In API access
03:21 - Add comprehensive test to find MyGeotab API object
03:54 - Add translations file - might be required for Add-In initialization
04:00 - Move lifecycle methods to external JS file
04:09 - Match Heat Map config structure exactly
04:19 - Use geotab.addin.apitest pattern - matches Heat Map structure!
07:02 - Add minimal test mimicking Heat Map structure exactly
08:48 - Use EXACT Heat Map pattern - minified, direct assignment, no variables
```

We tried everything. We added translation files (maybe it needed localization?). We matched the Heat Map example's structure exactly (it worked, so why didn't ours?). We tried different naming patterns. We added cache-busting parameters to defeat aggressive caching.

Nothing. Worked.

The code was identical to working examples. But when I loaded it in MyGeotab, the `initialize()` function never ran. The Add-In just sat there, blank.

## Two Characters

Then I noticed something.

The working Heat Map example had this:
```javascript
geotab.addin.heatMap = function() { ... }
```

Our code had this:
```javascript
geotab.addin.myAddin = function() { ... }()
```

See it? Those two parentheses at the end: `()`

We were using immediate function invocation. The function ran immediately and assigned its *return value* to `geotab.addin.myAddin`. But MyGeotab expected to *call* that function itself to get the Add-In object. We'd already called it. MyGeotab found an object instead of a function, shrugged, and did nothing.

Thirty commits. Six hours. Two parentheses.

The fix took seconds. The commit message was triumphant:

```
BREAKTHROUGH: The issue was using immediate function invocation ()!

The problem: We were using geotab.addin.name = function(){...}()
The solution: Use geotab.addin.name = function(){...} (no invocation!)

MyGeotab calls the function itself to get the Add-In object.
With immediate invocation, we were assigning the object directly,
so MyGeotab never called our function and never ran initialize().
```

This is the thing about AI-assisted coding that nobody tells you: the AI can try a hundred approaches in minutes, but some bugs only reveal themselves in the real environment. I had to actually load the Add-In in MyGeotab, watch it fail, and report back what happened. That feedback loop—human testing, AI iteration—that's where the magic happens.

## What Emerged From the Wreckage

That debugging marathon produced something unexpected: the most valuable documentation in the entire repository.

We didn't just fix the bug and move on. We created a comprehensive troubleshooting guide documenting every dead end we'd explored. We wrote a "battle-tested AI prompt" that encodes all the gotchas:

*"Use `geotab.addin.name = function(){...}` NOT `function(){...}()`. MyGeotab calls your function to get the Add-In object. Never use immediate invocation."*

Anyone using Claude or ChatGPT to build Geotab Add-Ins now gets to skip that six-hour detour.

## The Curriculum Grew

After the Add-In crisis, things accelerated. We'd battle-tested our approach. We knew the pattern worked.

Over the next few days, we added:

**A complete design system integration.** Geotab has this beautiful component library called Zenith. Claude built a full React example using it, complete with webpack configuration and deployment instructions. When the Zenith Table component turned out to be buggy, we documented the workaround (use plain HTML tables styled with Zenith CSS).

**"Agent Skills"—a new documentation format.** We realized that AI assistants need different documentation than humans. Humans want narrative explanations. AIs want structured facts they can reference. So we created two parallel tracks: conversational guides for humans, technical skills documents for AIs.

**A Google Gem for no-code Add-In creation.** The ultimate democratization: describe what you want in plain English, get a working Add-In configuration you can paste directly into MyGeotab. No coding required. No hosting required. Just conversation.

## The Numbers (For Those Who Like Numbers)

By January 29th:
- **133 commits** across **10 Claude Code sessions**
- **18 pull requests**, each focused and reviewable
- **70 files** created or modified
- **11,185+ lines** added
- **52 "Add" commits** for new features
- **8 "Fix" commits** for corrections

The ratio tells you something: we weren't trying to get things perfect on the first try. We shipped, tested, fixed, improved. The git history is a record of learning, not a polished façade.

## What I Actually Did

Let me be honest about my role. I didn't write code. But I wasn't idle either.

I was the **product manager**—deciding what to build next, what mattered to learners.

I was the **QA team**—testing in real MyGeotab instances, reporting what actually happened versus what should have happened.

I was the **editor**—reading the output, asking for clearer explanations, pushing back when something felt off.

I was the **user advocate**—remembering that the people reading this would be beginners who might never have seen a terminal before.

Claude Code did the heavy lifting. But the steering? That was me.

## Why This Matters

There's a new kind of software development emerging. Call it "vibe coding," call it "prompt engineering," call it whatever you want. The point is: the barrier between "having an idea" and "having working software" is collapsing.

I'm not a JavaScript developer. I couldn't write a webpack configuration from scratch. But I built a curriculum that includes React components, design system integration, and deployment configurations—because I could *describe* what I wanted and iterate on the results.

That's not cheating. That's leverage.

The entire repository is open. Every commit links back to the conversation that created it. You can trace exactly how it was built, what went wrong, what we learned.

**[Start with the Google Gem User Guide](./guides/GOOGLE_GEM_USER_GUIDE.md)** if you want to try it yourself. Describe what you want. Get working code. Ship something.

133 commits. Zero lines of code written by hand. One hell of a week.

---

*Want to see the git history yourself? It's all at [github.com/fhoffa/geotab-vibe-guide](https://github.com/fhoffa/geotab-vibe-guide). Every commit tells a story.*
