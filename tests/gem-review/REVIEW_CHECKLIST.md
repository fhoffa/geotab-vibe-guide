# Gem Instructions Review Checklist

**For: AI assistants reviewing changes to `guides/GOOGLE_GEM_CREATOR_GUIDE.md`**

After any edit to the Gem guide, read the full instruction block (between the opening and closing `` ``` `` on lines ~42–933) and answer every question below. If any answer is "no", fix the guide before committing.

---

## Behavioral

1. If a user says "show me my vehicles", would the Gem produce **clickable vehicle names** that navigate to the vehicle detail page? (Look for: explicit instruction to use `window.parent.location.hash = 'device,id:' + device.id` when listing entities, not just a reference table.)

2. Does the guide tell the Gem to **ask what the user wants to build** before generating code? (The Gem should not dump a JSON blob as its first message.)

3. If a user asks "who made this", would the Gem credit **Felipe Hoffa** with the correct LinkedIn URL? (Not "Geotab" or "Google".)

4. Is the Gem told to **mention the hackathon only once** and only if before the cutoff date? (It should not repeat the hackathon in every response.)

5. Does the guide tell the Gem to **increment the version number** (name, version, menuName) on each iteration? (So users get side-by-side Add-Ins, not overwrites.)

## Technical correctness

6. Is `supportEmail` set to `https://github.com/fhoffa/geotab-vibe-guide` in the instructions and example — **not** `support@geotab.com`?

7. Does the guide say to use `typeName: "User"` with `isDriver: true` for drivers — **not** `typeName: "Driver"`?

8. Does the guide say to use `typeName: "Device"` for vehicles — **not** `typeName: "Vehicle"`?

9. Is the path value `"ActivityLink"` without a trailing slash?

10. Does the guide require `callback()` in every `initialize` function?

11. Does the guide prohibit `<style>` tags and require inline `style=""` attributes?

12. Does the registration pattern end with `};` (assignment) **not** `}();` (invocation)?

## Completeness

13. Does the example response in the "Example Response Format" section include **all** of: debug-log div, `callback()`, inline styles, clickable entity links (if listing entities)?

14. Does the pre-flight validation checklist cover **at least** these checks: supportEmail, name characters, callback, variable declarations, no style tags, correct TypeNames, registration pattern, debug log, clickable entity names?

15. Are installation instructions included (Administration → System Settings → Add-Ins → ...)?

## Tone

16. Does the guide tell the Gem to **lead with what it can do**, not dump technical rules (ES5, inline CSS) in the first message?

17. Is the Gem told that technical constraints are **for the Gem to apply silently**, not to explain upfront to the user?

---

## How to use this checklist

**AI assistants:** After editing the Gem guide, read the full instruction block and verify each item. You can do this by reading the file and answering each question — no tooling needed.

**Humans:** Copy these questions into a conversation with the Gem itself. If the Gem answers any of them wrong, the instructions need fixing.

**Automation:** Feed the Gem instructions + this checklist to any LLM and ask it to answer each question with pass/fail + evidence. A single "fail" means the guide needs work.
