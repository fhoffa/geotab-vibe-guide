# Geotab Add-Ins: What Actually Works

## Critical Finding from Testing

After extensive testing with embedded Add-Ins (code embedded in JSON), we discovered:

### ❌ Embedded Add-Ins CANNOT Access MyGeotab API

**What we tested:**
1. ✅ HTML/CSS renders correctly
2. ✅ JavaScript executes
3. ✅ Focus/blur DOM events fire
4. ❌ **No API object is ever available**
5. ❌ Lifecycle functions (`initialize`, `focus`, `blur`) never receive API parameter
6. ❌ No `window.parent.api` exists
7. ❌ No API passed in `event.detail`
8. ❌ `window.parent.geotab` exists but has no API methods

**Conclusion:** Embedded Add-Ins are **only suitable for static content**. You cannot fetch fleet data, make API calls, or interact with MyGeotab data in any way.

### ✅ GitHub Pages (External Hosting) DOES Work

**For Add-Ins that need API access, you MUST use external hosting:**
- GitHub Pages (free, HTTPS)
- Your own web server (HTTPS required)
- Any other HTTPS hosting

When externally hosted:
- ✅ Lifecycle methods work correctly
- ✅ API object is passed to `initialize(api, state, callback)`
- ✅ Full access to MyGeotab JavaScript API
- ✅ Can fetch devices, trips, users, etc.

## Recommendation

**Always use GitHub Pages for real Add-Ins.** The embedded approach is a dead end for anything beyond static HTML.

The guide should be restructured to:
1. **Start with GitHub Pages** as the primary method
2. Provide working example that users can deploy immediately
3. Mention embedded Add-Ins only for completeness (static content only)

## Working Example

See `/examples/addins/github-pages-example/` for a complete, tested, working Add-In that:
- Displays user info from API
- Shows vehicle count
- Lists vehicles
- Has proper lifecycle methods
- Includes deployment instructions

This example is **proven to work** when deployed to GitHub Pages.
