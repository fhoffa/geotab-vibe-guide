# I Didn't Write a Single Line of Code. I Built This Anyway.

It's 3am and I'm staring at my screen, watching Claude Code churn through yet another attempt to fix a bug that's been haunting us for hours. Nothing works.

A week later, I'd have 133 commits, 70 files, and 11,000+ lines of guides and working examples. I never wrote a single line of code myself.

This is the story of building the [Geotab Vibe Coding Guide](https://github.com/fhoffa/geotab-vibe-guide)—and how the project completely inverted itself by the end.

## What We Built (And Why It Matters)

I work with developers who want to build fleet management apps using the Geotab API. Most hit the same walls: confusing docs, authentication headaches, code that *should* work but doesn't.

I wanted to create something that got them unstuck fast. Not documentation to read—prompts they could copy-paste. Examples they could remix. A hackathon kit that made the first hour exciting instead of frustrating.

By the end of the week, we'd built that. But we'd also discovered something better: a way for people to build Add-Ins without writing any code at all.

## The Workflow That Made It Possible

We fell into a rhythm quickly. I'd describe what I wanted. Claude would create a branch, write the content, commit with detailed messages, and push. I'd review, tweak, merge.

Eighteen pull requests in eight days. Each one focused. Each one traceable—every commit message includes a Claude Code session URL, so you can literally replay the conversation that created it.

The pattern was simple: **prompt → branch → ship → repeat.**

The first two days were smooth. Beginner glossaries. Security warnings. Foundation stuff.

Then everything broke.

## When AI Hits a Wall

I wanted to add a guide for building Geotab Add-Ins—custom pages inside MyGeotab. Seemed straightforward.

Thirty commits later, nothing worked. We'd tried every pattern we could find. Matched working examples character-by-character. Added translation files, cache-busting, different naming conventions. The code looked identical to Geotab's own examples, but when I loaded it in MyGeotab, nothing happened.

Exhausted, I asked Claude to summarize everything we'd tried. It wrote a comprehensive debugging guide—every dead end documented. I posted it to our internal forums asking for help.

A teammate replied. He didn't need me to explain anything—Claude's summary had all the context. He looked at our code and spotted it in seconds.

Two characters: `()`

We'd been using immediate function invocation. MyGeotab expected to call the function itself; we'd already called it. The platform found an object instead of a function, shrugged, and did nothing.

Thirty commits. Two parentheses. A teammate with fresh eyes.

**The lesson:** AI can try a hundred approaches in minutes, but some bugs only reveal themselves in the real environment. The magic is in the feedback loop—human testing, AI iteration, and knowing when to ask for help.

## The Pivot Nobody Expected

After the Add-In crisis, we kept building. A design system integration with Zenith components. Technical "skills" documents optimized for AI assistants. Working examples people could deploy.

Then I had a thought: we'd built all this for developers using Claude and ChatGPT. But what about people who don't want to code at all?

I created a Google Gem—a custom Gemini persona loaded with everything we'd learned. You describe the Add-In you want in plain English. It generates the JSON config. You paste it into MyGeotab. Done.

No coding. No hosting. No terminal. Just conversation.

The commits tell the story of the pivot:
- First we added the Gem as an option
- Then we made it the recommended path
- Finally we redirected beginners there instead of to Claude

We started building a developer toolkit. We ended up realizing the easiest path was no code at all. The Gem became the front door.

## What I Actually Did

Let me be honest about my role. I didn't write code. But I wasn't idle.

I was the **product manager**—deciding what to build, what mattered.

I was the **tester**—loading Add-Ins in MyGeotab, reporting what actually happened.

I was the **editor**—pushing back when explanations weren't clear.

I was the **person who asked for help**—posting to forums when we were stuck.

Claude did the heavy lifting. The steering was me.

## What Worked

**Session URLs in every commit.** Six months from now, when someone asks "why did we do it this way?", we can replay the conversation.

**Small, focused PRs.** Eighteen PRs, not one monster. Easy to review, easy to revert.

**Documenting dead ends.** That debugging guide listing every failed approach? More valuable than the fix. The fix is one line. The guide saves someone else twelve hours.

**Letting Claude write context for others.** When I asked for help, I didn't have to summarize—Claude had already written it. My teammate could jump in immediately.

**Asking for help sooner.** The teammate who spotted `()` in seconds had been available the whole time.

## What We'd Do Differently

**Test in the real environment earlier.** We burned thirty commits because we couldn't programmatically test Add-Ins. Manual refresh cycles are slow and error-prone.

**Mark exploratory work clearly.** The debugging session mixed experiments with documentation. A `[WIP]` prefix would help readers understand which commits were serious attempts vs. shots in the dark.

## The Numbers

- **133 commits** across **10 Claude Code sessions**
- **18 pull requests**
- **70 files**, **11,000+ lines**
- **8 days** from first commit to hackathon-ready

## Try It Yourself

The entire repository is open. Every commit links back to the conversation that created it.

**[Start with the Google Gem](./guides/GOOGLE_GEM_USER_GUIDE.md)** if you want the easiest path—describe what you want, paste JSON, done.

Or dive into the code examples if you want to understand how it all works under the hood.

133 commits. Zero lines of code written by hand. One hell of a week.

---

*The git history is at [github.com/fhoffa/geotab-vibe-guide](https://github.com/fhoffa/geotab-vibe-guide). Every commit tells a story.*
