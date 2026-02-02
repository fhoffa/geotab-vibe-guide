# I Didn't Write a Single Line of Code. I Built This Anyway.

I spent a week building a [hackathon starter kit](https://github.com/fhoffa/geotab-vibe-guide) with Claude Code—mostly from my phone. I never wrote a single line of code myself.

Here's what I learned about using AI to build something real.

- **The workflow**: prompt → branch → ship → repeat
- **Where AI hits a wall**: some bugs only reveal themselves when you test in the real environment
- **How to hand off effectively**: Claude can write the context for you, so teammates don't ask "what have you tried?"
- **The surprise pivot**: we built a developer toolkit, then realized beginners didn't need code at all

If you're thinking about using AI to build something substantial—not just one-off scripts, but a real project with commits and PRs and collaboration—this is what I wish I'd known.

## The Goal

I work with developers who want to build fleet management apps using the Geotab API. Most hit the same walls: confusing docs, authentication headaches, code that *should* work but doesn't.

I wanted to create something that got them unstuck fast. Not documentation to read—prompts they could copy-paste. Examples they could remix. A hackathon kit that made the first hour exciting instead of frustrating.

By the end of the week, we'd built that. But we'd also discovered something better: a way for people to build Add-Ins without writing any code at all.

## The Workflow

We fell into a rhythm quickly. I'd describe what I wanted—often typing on my phone during a commute or waiting for coffee. Claude would create a branch, write the content, commit, and push. I'd review, tweak, merge.

The first two days were smooth. Beginner glossaries. Security warnings. Foundation stuff.

Then everything broke.

## When AI Hits a Wall

I wanted to add a guide for building Geotab Add-Ins—custom pages inside MyGeotab. Seemed straightforward.

Dozens of commits later, nothing worked. We'd tried every pattern we could find. Matched working examples character-by-character. Added translation files, cache-busting, different naming conventions. The code looked identical to Geotab's own examples, but when I loaded it in MyGeotab, nothing happened.

Exhausted, I asked Claude to summarize everything we'd tried. It wrote a comprehensive debugging guide—every dead end documented. I posted it to our internal forums asking for help.

A teammate replied. He didn't need me to explain anything—Claude's summary had all the context. He looked at our code and spotted it in seconds.

Two characters: `()`

We'd been using immediate function invocation. MyGeotab expected to call the function itself; we'd already called it. The platform found an object instead of a function, shrugged, and did nothing.

Dozens of commits. Two parentheses. A teammate with fresh eyes.

**The lesson:** AI can try a hundred approaches in minutes, but some bugs only reveal themselves in the real environment. The magic is in the feedback loop—human testing, AI iteration, and knowing when to ask for help.

## The Pivot Nobody Expected

After the Add-In crisis, we kept building. A design system integration with Zenith components. Technical "skills" documents optimized for AI assistants. Working examples people could deploy.

Then I had a thought: we'd built all this for developers using Claude and ChatGPT. But what about people who don't want to code at all?

I created a Google Gem—a custom Gemini persona loaded with everything we'd learned. You describe the Add-In you want in plain English. It generates the JSON config. You paste it into MyGeotab. Done.

No coding. No hosting. No terminal. Just conversation.

We added it as an option. Then it became the recommended path. Then we redirected all beginners there. The Gem became the front door, and the developer toolkit became the basement for power users who wanted to peek under the hood.

## What I Actually Did

I didn't write code. But I made decisions Claude couldn't.

Which feature matters more to a beginner? Is this explanation clear or just technically correct? Should we prioritize the happy path or document the edge cases? When the Add-In failed silently, I was the one loading it in a real browser and watching nothing happen. When we were stuck, I was the one who decided to post to the forums instead of burning more hours alone.

Claude generated the code and docs. I decided what was worth generating, what was good enough to ship, and when to ask for help.

## Lessons

**Document dead ends, not just solutions.** The debugging guide listing every failed approach? More valuable than the fix. The fix is one line. The guide saves someone else hours of pain.

**Let Claude write context for others.** When I asked for help, I didn't have to summarize—Claude had already written it. My teammate jumped in immediately. This is underrated: AI can document your debugging session *as you go*, so handoffs are effortless.

**Ask for help sooner.** The teammate who spotted `()` in seconds had been available the whole time. I could have saved myself a night of frustration with one forum post.

**Test in the real environment earlier.** We burned through iterations because we couldn't programmatically test Add-Ins. If your feedback loop is "change code, refresh browser, click around, see nothing happen," you're going to move slowly.

## Try It Yourself

The [repository is open](https://github.com/fhoffa/geotab-vibe-guide).

**[Start with the Google Gem](./guides/GOOGLE_GEM_USER_GUIDE.md)** if you want the easiest path—describe what you want, paste the config, you're live.

If you want to see how this was actually built—what worked, what didn't, how the conversations evolved—the git history has it all. Every commit links back to its Claude Code session.
