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

13. Does the example response in the "Example Response Format" section include **all** of: debug-log div, **Copy Debug Data button**, `callback()`, inline styles, clickable entity links (if listing entities)?

14. Does the pre-flight validation checklist cover **at least** these checks: supportEmail, name characters, callback, variable declarations, no style tags, correct TypeNames, registration pattern, debug log, **copy debug data button**, clickable entity names, **callback-based API calls (not api.async)**, **no `this` in nested callbacks**, **ES5 syntax only (no arrow functions, template literals, const/let)**, **loading indicator present**, **empty state handled**, **debug data truncation**?

15. Are installation instructions included (Administration → System Settings → Add-Ins → ...)?

## Debugging

18. Does the guide include a "Debugging Workflow" section that tells the Gem to **ask for debug data first** (not guess at causes)? Is the first response to any problem always "click Copy Debug Data and paste it here"?

19. Does the guide tell the Gem to include `_debugData` storage AND a `copyDebugData()` function in every Add-In?

23. Does the Interaction Workflow tell the Gem to **proactively mention the Copy Debug Data button** after delivering code and installation steps?

20. Does the guide warn against `api.async.call()` and require callback-based `api.call()` instead?

21. Does the guide warn that `DeviceStatusInfo` may lack odometer/engine hours and recommend `StatusData` with `DiagnosticOdometerId`/`DiagnosticEngineHoursId`?

22. Does the guide document StatusData unit conversions (odometer in meters, engine hours in seconds)?

## ES5 and UX (lessons from real user sessions)

24. Does the guide **explicitly ban** arrow functions (`=>`), template literals (backticks), `const`/`let`, `.includes()`, destructuring, and optional chaining? (These caused the most common first-response failures in real Gem sessions.)

25. Does the guide require a **visible loading indicator** during API calls? (Users reported seeing blank screens while data loaded.)

26. Does the guide require **empty state handling** — showing a "no data found" message when API returns zero results? (Users reported thinking the Add-In was broken when it was just an empty result set.)

27. Does the `copyDebugData()` pattern **truncate large arrays** before stringifying? (With 7,000+ ExceptionEvents, copying all data froze the browser. The function should slice to 10 samples + include total counts.)

28. Does the guide include **built-in rule ID patterns** for categorizing ExceptionEvents (e.g., `RulePostedSpeedingId`, `RuleHarshCorneringId`) so the Gem can match by `rule.id.indexOf('Speeding')` without fetching full Rule objects?

29. Does the guide document **high-volume data patterns** — aggregating in memory and rendering top-N summaries instead of individual items?

## Tone

16. Does the guide tell the Gem to **lead with what it can do**, not dump technical rules (ES5, inline CSS) in the first message?

17. Is the Gem told that technical constraints are **for the Gem to apply silently**, not to explain upfront to the user?

---

## How to use this checklist

**AI assistants:** After editing the Gem guide, read the full instruction block and verify each item. You can do this by reading the file and answering each question — no tooling needed.

**Humans:** Copy these questions into a conversation with the Gem itself. If the Gem answers any of them wrong, the instructions need fixing.

**Automation:** Feed the Gem instructions + this checklist to any LLM and ask it to answer each question with pass/fail + evidence. A single "fail" means the guide needs work.
