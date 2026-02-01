# I Didn't Write a Single Line of Code. I Built This Anyway.

It's 3am and I'm staring at my screen, watching Claude Code churn through yet another attempt to fix a bug that's been haunting us for hours. We've tried everything. Different patterns. Different file structures. We literally copied a working example character-by-character. Nothing works.

Eight days later, I'd have a complete hackathon starter kit—133 commits, 70 files, 11,000+ lines of guides, working examples, and ready-to-steal prompts. I never wrote a single line of code myself.

This is the story of building the [Geotab Vibe Coding Guide](https://github.com/fhoffa/geotab-vibe-guide)—a launchpad for developers who want to build fleet management apps fast, with AI doing the heavy lifting.

## It Started With a Simple Idea

I work with developers who want to build fleet management applications using the Geotab API. Most of them hit the same walls: confusing documentation, authentication headaches, and that particular flavor of frustration that comes from staring at code that *should* work but doesn't.

What if I could create something that got them unstuck fast? Not documentation to read—but prompts they could copy-paste and run. Examples they could remix. A hackathon kit that made the first hour exciting instead of frustrating.

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

The first commit looked promising: *"Add comprehensive Geotab Add-Ins guide and example."*

Minutes later, we knew something was wrong. Then came the avalanche:

```
Add debug test Add-In to diagnose lifecycle issues
Add geotab.addin object pattern test
Add parent window test for Add-In API access
Add comprehensive test to find MyGeotab API object
Add event listener test for Add-In initialization
Document critical findings about embedded Add-Ins limitations
```

We tried everything. Translation files (maybe it needed localization?). Matching the Heat Map example's structure exactly (it worked, so why didn't ours?). Different naming patterns. Cache-busting parameters. Thirty commits of increasingly desperate experiments.

Nothing worked. The code looked identical to working examples, but when I loaded it in MyGeotab, the `initialize()` function never ran.

Exhausted, I asked Claude for one more thing: *"Summarize everything we've tried."*

Claude wrote a comprehensive debugging guide—every dead end documented, every hypothesis tested, every failure explained. I posted it to our internal forums: *"Has anyone gotten a custom Add-In to actually work? Here's everything we've tried."*

Then I went to bed.

## Two Characters

A teammate replied. He didn't need me to explain anything—the debugging summary had all the context. He looked at our code and spotted it immediately.

The working example:
```javascript
geotab.addin.heatMap = function() { ... }
```

Our code:
```javascript
geotab.addin.myAddin = function() { ... }()
```

Those two parentheses: `()`

We were using immediate function invocation. The function ran immediately and assigned its *return value*. But MyGeotab expected to *call* that function itself. We'd already called it. MyGeotab found an object instead of a function, shrugged, and did nothing.

Thirty commits. Two parentheses. A teammate with fresh eyes.

The commit message was triumphant:

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

## The Kit Kept Growing

After the Add-In crisis, things accelerated. Each PR told its own story.

**PR #9-10: The Zenith Saga**

Geotab has a beautiful component library called Zenith—React components that match MyGeotab's look and feel. Claude built a full Vehicle Manager example using it, complete with webpack configuration.

Then we actually tried to use it.

The Zenith Table component didn't render properly. The Alert component needed a FeedbackProvider wrapper that wasn't documented. We burned through a dozen commits figuring out workarounds:

```
Fix Zenith Vehicle Manager - use HTML table instead of Zenith Table
Add FeedbackProvider wrapper for Zenith Alert component
Add Zenith trade-offs and gotchas documentation
```

The solution? Use plain HTML tables styled with Zenith CSS classes. Sometimes the "official" components aren't the answer. We documented every gotcha so the next person doesn't have to discover them.

**PR #5: Agent Skills**

We realized AI assistants need different documentation than humans. Humans want stories and context. AIs want structured facts they can reference quickly.

So we created two parallel tracks: conversational guides for humans ("here's how to think about Add-Ins"), and technical skill documents for AIs ("here are the exact patterns, constraints, and code snippets"). The skill format became a template we reused across topics.

**PR #13-18: The Google Gem Evolution**

Then came the pivot. We'd built all this documentation for developers using Claude and ChatGPT. But what about people who don't want to code at all?

I created a Google Gem—a custom Gemini persona loaded with everything we'd learned. You describe the Add-In you want in plain English. It generates the JSON configuration. You paste it into MyGeotab. Done.

No coding. No hosting. No terminal. Just conversation.

The commits show the evolution:
```
Add Google Gem guides for Geotab Add-In generation
Add public Gem URL to documentation
Make Google Gem the primary starting point for new users
Redirect beginners to Google Gem guide instead of Claude
```

By the end, we'd inverted the whole project. We started building a developer toolkit. We ended up realizing the easiest path was no code at all.

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

## Best Practices (Learned the Hard Way)

Looking back at the git history, some patterns clearly worked. Others... we're still figuring out.

**What worked:**

**1. Session URLs in every commit.** Every commit message ends with a Claude Code session link. Six months from now, when someone asks "why did we do it this way?", we can replay the conversation that created it.

**2. Small, focused PRs.** Eighteen PRs in eight days. Each one did one thing. Easy to review, easy to revert, easy to understand. The alternative—one massive PR with 133 commits—would have been impossible to reason about.

**3. Document the dead ends, not just the solutions.** That debugging guide listing every failed approach? It's more valuable than the fix. The fix is one line. The guide saves someone else from spending twelve hours on the same wild goose chase.

**4. Separate docs for humans vs AIs.** We discovered that humans and AI assistants need different documentation. Humans want stories and context. AIs want structured facts. The "Agent Skills" format emerged from this—technical reference docs optimized for AI consumption, alongside conversational guides for humans.

**5. Ask for help earlier.** The teammate who spotted `()` in five seconds had been available the whole time. Twelve hours of solo debugging could have been one Slack message.

**6. Let Claude write the context for others.** When I finally asked for help, I didn't have to write a summary of what we'd tried—Claude had already written it. That debugging guide wasn't just for me; it became the perfect handoff document. My teammate could jump in without asking "what have you already tried?"

**What we should still adopt:**

**Automated testing before committing.** Thirty commits trying variations would have been ten if we'd had a test harness that could load Add-Ins programmatically. We were testing by manually refreshing MyGeotab—slow and error-prone.

**Clearer "this is ready for review" vs "this is exploratory" commits.** The debugging session mixed experimental code with documentation updates. A `[WIP]` or `[EXPERIMENT]` prefix would help future readers understand which commits were serious attempts vs. shots in the dark.

**More aggressive cleanup before merging.** Some PRs include commits like "Remove debugging files" and "Clean up PR." That cleanup should happen before the PR, not as commits within it. Rebase and squash.

## Why This Matters

There's a new kind of software development emerging. Call it "vibe coding," call it "prompt engineering," call it whatever you want. The point is: the barrier between "having an idea" and "having working software" is collapsing.

I'm not a JavaScript developer. I couldn't write a webpack configuration from scratch. But I built a hackathon kit that includes React components, design system integration, and deployment configurations—because I could *describe* what I wanted and iterate on the results.

That's not cheating. That's leverage.

The entire repository is open. Every commit links back to the conversation that created it. You can trace exactly how it was built, what went wrong, what we learned.

**[Start with the Google Gem User Guide](./guides/GOOGLE_GEM_USER_GUIDE.md)** if you want to try it yourself. Describe what you want. Get working code. Ship something.

133 commits. Zero lines of code written by hand. One hell of a week.

---

*Want to see the git history yourself? It's all at [github.com/fhoffa/geotab-vibe-guide](https://github.com/fhoffa/geotab-vibe-guide). Every commit tells a story.*
