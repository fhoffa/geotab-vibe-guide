# Debugging Geotab Add-Ins: A Journey

This document chronicles our extensive debugging journey attempting to create custom Geotab Add-Ins. We'll cover what worked, what didn't, and the mysteries that remain unsolved.

## Table of Contents
1. [The Goal](#the-goal)
2. [Attempt 1: Embedded Add-Ins](#attempt-1-embedded-add-ins)
3. [Attempt 2: External Hosting with GitHub Pages](#attempt-2-external-hosting-with-github-pages)
4. [Success: Heat Map Replication](#success-heat-map-replication)
5. [The Mystery: Why Our Code Doesn't Work](#the-mystery-why-our-code-doesnt-work)
6. [Key Findings](#key-findings)
7. [Open Questions](#open-questions)

## The Goal

We wanted to create custom Geotab Add-Ins that could:
- Add new pages to MyGeotab's left navigation menu
- Access the MyGeotab JavaScript API to fetch vehicle data
- Display custom UI and functionality

The official documentation at [developers.geotab.com](https://developers.geotab.com/myGeotab/addIns/developingAddIns/) suggests this should be straightforward using the Add-In lifecycle methods (`initialize`, `focus`, `blur`).

## Attempt 1: Embedded Add-Ins

### What We Tried

We first attempted to create Add-Ins with all code embedded directly in the JSON configuration file.

**Configuration (`simple-dashboard-config.json`):**
```json
{
  "name": "Simple Dashboard",
  "supportEmail": "support@example.com",
  "version": "1.0.0",
  "items": [{
    "page": "device",
    "click": function(api, state) {
      // Custom code here
    }
  }],
  "files": {
    "index.html": "<!DOCTYPE html>...",
    "app.js": "window.initialize = function(api, state, callback) { ... }"
  }
}
```

### What Happened

**Issue 1: MyGeotab strips the "files" section**
- The configuration was accepted
- Menu item appeared in the left navigation
- But when clicking it: "Issue Loading This Page" error
- Console showed MyGeotab had stripped out the entire "files" section

**Issue 2: Embedded HTML loads but API never accessible**

We tried using inline HTML in the configuration:
```json
{
  "items": [{
    "url": "dashboard.html",
    "path": "ActivityLink/",
    "menuName": { "en": "My Dashboard" }
  }]
}
```

Result:
- HTML content rendered
- CSS loaded
- JavaScript executed
- **But the API object was always `undefined`**
- `initialize()` was never called by MyGeotab
- `focus()` and `blur()` events fired but with `undefined` event.detail

### Conclusion

**Embedded Add-Ins cannot access the MyGeotab API.** They can display static content but are essentially useless for any real integration.

## Attempt 2: External Hosting with GitHub Pages

After the embedded approach failed, we moved to external hosting using GitHub Pages.

### Setup

1. Enabled GitHub Pages on our repository
2. Created `addin-test.html` and `addin-test.js`
3. Configured Add-In to point to: `https://fhoffa.github.io/geotab-vibe-guide/addin-test.html`

### Test Version 1-5: Window Pattern

**addin-test.js (early version):**
```javascript
console.log("Add-In JS loaded");

window.initialize = function(api, state, callback) {
    console.log("Initialize called!");
    document.body.innerHTML = "<h1>SUCCESS!</h1>";
    callback();
};

window.focus = function(api, state) {
    console.log("Focus called");
};

console.log("Functions registered:", {
    initialize: typeof window.initialize,
    focus: typeof window.focus
});
```

**Configuration:**
```json
{
  "name": "API Test",
  "supportEmail": "test@example.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://fhoffa.github.io/geotab-vibe-guide/addin-test.html",
    "path": "ActivityLink/",
    "menuName": { "en": "API Test" }
  }]
}
```

**Result:**
- JavaScript file loaded (confirmed in Network tab)
- Console showed: "Add-In JS loaded"
- Console showed: "Functions registered: { initialize: 'function', focus: 'function' }"
- **But `initialize()` was never called**
- No "Initialize called!" message ever appeared

### Test Version 6-8: Geotab.addin Pattern

After researching, we found the official pattern uses `geotab.addin`:

```javascript
geotab.addin.apitest = function() {
    console.log("apitest loading");

    return {
        initialize: function(api, state, callback) {
            console.log("🎉 INITIALIZE CALLED!");
            document.body.innerHTML = "<h1>SUCCESS!</h1>";
            callback();
        },
        focus: function(api, state) {
            console.log("focus called");
        }
    };
}();

console.log("apitest registered");
```

**Result:**
- Console showed: "apitest loading"
- Console showed: "apitest registered"
- Console inspection showed: `geotab.addin.apitest` exists with `initialize` and `focus` functions
- **Still, `initialize()` was never called**

### Test Version 9-12: Multiple Naming Variations

We tried registering the Add-In under multiple possible names simultaneously:

```javascript
var addin = {
    initialize: function(api, state, callback) {
        console.log("🎉 INITIALIZE CALLED!");
        document.body.innerHTML = "<h1>SUCCESS!</h1>";
        callback();
    },
    focus: function(api, state) {
        console.log("focus called");
    }
};

// Register under all possible names
geotab.addin.apitest = addin;
geotab.addin["api-test"] = addin;
geotab.addin.addintest = addin;
geotab.addin["addin-test"] = addin;
geotab.addin.APitest = addin;
```

**Result:**
- All five names successfully registered
- All five showed up in `geotab.addin` object
- Each had correct `initialize` and `focus` methods
- **None of them were ever called**

### Caching Issues

We also encountered GitHub Pages caching:
- Changes to JavaScript files didn't appear immediately
- Had to wait 2-3 minutes for deployment
- Added cache-busting query parameters: `addin-test.js?v=12`
- This helped with deployment but didn't solve the initialization problem

## Success: Heat Map Replication

### The Breakthrough

We decided to test an official Geotab Add-In: the Heat Map example from the SDK.

**Heat Map Configuration:**
```json
{
  "name": "Heat Map",
  "supportEmail": "support@geotab.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-heatmap/dist/heatmap.html",
    "path": "ActivityLink/",
    "menuName": { "en": "Heat Map" }
  }]
}
```

**Result: IT WORKED!**
- The Heat Map loaded successfully
- The `initialize()` method was called
- The Add-In fetched vehicles using `api.call("Get", {typeName: "Device"})`
- All API functionality worked perfectly

This proved that:
1. Add-Ins CAN work with external hosting
2. The MyGeotab API IS accessible to Add-Ins
3. Our GitHub Pages setup wasn't the problem

### Replicating Success

We copied the entire Heat Map Add-In to our repository:

1. Downloaded all Heat Map files from the CDN
2. Placed them in `heatmap-copy/` directory
3. Created our own configuration pointing to our GitHub Pages

**Our Configuration (`heatmap-copy/config-our-repo.json`):**
```json
{
  "name": "Heat Map Test",
  "supportEmail": "test@example.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://fhoffa.github.io/geotab-vibe-guide/heatmap-copy/heatmap-local.html",
    "path": "ActivityLink/",
    "menuName": { "en": "Heat Map Test" }
  }]
}
```

**Result: IT WORKED!**
- Loaded successfully from our GitHub Pages
- Displayed vehicles from our MyGeotab account
- Full API access working
- Map functionality working

This confirmed:
- Our GitHub Pages hosting is configured correctly
- HTTPS is working
- CORS is not an issue
- The problem is specific to our custom code

## The Mystery: Why Our Code Doesn't Work

### The Minimal Test

We created a minimal test that exactly mimics the Heat Map structure:

**minimal-test.js (minified, exactly matching Heat Map pattern):**
```javascript
"use strict";
geotab.addin["minimal-test"]=function(){
    console.log("minimal-test loading");
    return{
        initialize:function(api,state,callback){
            console.log("🎉🎉🎉 INITIALIZE CALLED!");
            document.body.innerHTML="<h1>SUCCESS!</h1><pre id='output'></pre>";
            var output=document.getElementById("output");
            output.textContent="Initialize called!\n";
            if(api){
                api.getSession(function(cred){
                    output.textContent+="User: "+cred.userName+"\n";
                    output.textContent+="Database: "+cred.database+"\n";
                });
                api.call("Get",{typeName:"Device"},function(devices){
                    output.textContent+="Vehicles: "+devices.length+"\n";
                });
            }
            callback();
        },
        focus:function(api,state){
            console.log("focus called");
        }
    }
}();
console.log("minimal-test registered");
```

**minimal-test.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>Minimal Test</title>
</head>
<body>
    <h1>Loading...</h1>
    <script src="https://fhoffa.github.io/geotab-vibe-guide/minimal-test.js"></script>
</body>
</html>
```

**Configuration:**
```json
{
  "name": "Minimal Test i",
  "supportEmail": "test@example.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://fhoffa.github.io/geotab-vibe-guide/minimal-test.html",
    "path": "ActivityLink/",
    "menuName": { "en": "Minimal Test i" }
  }]
}
```

### What Happens

**Loading:**
- ✅ HTML loads
- ✅ JavaScript file loads (confirmed in Network tab)
- ✅ Console shows: "minimal-test loading"
- ✅ Console shows: "minimal-test registered"
- ✅ `geotab.addin["minimal-test"]` exists in console
- ✅ `geotab.addin["minimal-test"].initialize` is a function
- ✅ `geotab.addin["minimal-test"].focus` is a function

**But:**
- ❌ `initialize()` is never called
- ❌ No "🎉🎉🎉 INITIALIZE CALLED!" message
- ❌ Body still shows "Loading..." instead of "SUCCESS!"
- ❌ No API calls executed

### URL Pattern Comparison

**Working Heat Map:**
```
https://my.geotab.com/MyAdmin/#addin,addin_id:heat_map_test,page:heatmap
```

**Our Minimal Test:**
```
https://my.geotab.com/MyAdmin/#addin-minimal_test_i-minimal-test
```

Notice:
- Heat Map gets an `addin_id` parameter (auto-generated by MyGeotab)
- Our test doesn't get an `addin_id`
- This suggests MyGeotab may not be fully recognizing our Add-In

### Side-by-Side Comparison

| Feature | Heat Map (Working) | Minimal Test (Not Working) |
|---------|-------------------|---------------------------|
| Hosting | GitHub Pages | GitHub Pages |
| HTTPS | ✅ | ✅ |
| JS Loads | ✅ | ✅ |
| Registration | `geotab.addin.heatmap` | `geotab.addin["minimal-test"]` |
| Initialize method | ✅ Present | ✅ Present |
| Focus method | ✅ Present | ✅ Present |
| Initialize called | ✅ YES | ❌ NO |
| API access | ✅ YES | ❌ N/A (never called) |

### Possible Explanations We've Considered

1. **Vendor.js dependency**: Heat Map includes `scripts/vendor.js` before `scripts/main.js`. Perhaps there's required initialization code?
   - Counter: We tried loading vendor.js in our minimal test - still didn't work

2. **HTML structure**: Heat Map has a complex HTML structure with specific IDs and classes
   - Counter: Our minimal test has basic HTML that should be sufficient

3. **Timing issues**: Maybe there's a race condition in when the script loads?
   - Counter: We've tried various loading patterns, defer, async, etc.

4. **Internal whitelist**: Maybe MyGeotab only calls `initialize()` on "approved" Add-Ins?
   - Counter: That would defeat the purpose of the Add-In system

5. **Special meta tags or headers**: Maybe there's a required header or meta tag?
   - Counter: We've compared HTML headers - nothing obvious

6. **Name formatting**: Maybe the Add-In name format matters?
   - Counter: We've tried dozens of variations

## Key Findings

### What Works ✅

1. **External hosting on GitHub Pages** - HTTPS hosting is properly configured
2. **Official Geotab Add-Ins** - Heat Map from CDN works perfectly
3. **Replicated Geotab Add-Ins** - Heat Map copied to our repo works perfectly
4. **JavaScript loading** - Our custom JS files load and execute
5. **Object registration** - Our Add-Ins properly register in `geotab.addin`

### What Doesn't Work ❌

1. **Embedded Add-Ins** - Cannot access MyGeotab API at all
2. **Custom Add-In code** - Registers but `initialize()` never called
3. **Multiple naming patterns** - Tried dozens of variations, none work
4. **Exact pattern replication** - Even copying Heat Map structure exactly doesn't work

### What We Know 🔍

1. The problem is NOT with our hosting or configuration
2. The problem is NOT with our JavaScript syntax or structure
3. The problem IS specific to custom code vs. official examples
4. MyGeotab IS capable of calling `initialize()` (proven by Heat Map)
5. MyGeotab is NOT calling `initialize()` on our custom Add-Ins

## THE SOLUTION! 🎉

After extensive testing, **the issue was found**: we were using **immediate function invocation** when we shouldn't have been!

### The Wrong Pattern (What We Were Doing)

```javascript
geotab.addin["minimal-test"] = function() {
    return {
        initialize: function(api, state, callback) { ... },
        focus: function(api, state) { ... }
    };
}();  // ❌ IMMEDIATE INVOCATION - This is the problem!
```

The `()` at the end immediately invokes the function and assigns the **returned object** to `geotab.addin["minimal-test"]`.

### The Correct Pattern

```javascript
geotab.addin["minimal-test"] = function() {
    return {
        initialize: function(api, state, callback) { ... },
        focus: function(api, state) { ... }
    };
};  // ✅ NO INVOCATION - Assign the function itself!
```

**Without** the `()` at the end, we assign the **function itself** to `geotab.addin["minimal-test"]`, and MyGeotab calls that function when it's ready.

### Why This Matters

MyGeotab's Add-In system works like this:

1. Your JavaScript file loads and registers: `geotab.addin.yourname = function() { ... }`
2. MyGeotab detects the registered function
3. **MyGeotab calls your function** to get the Add-In object
4. MyGeotab then calls the `initialize()` method on that object

When we used immediate invocation `()`, we were giving MyGeotab the object directly instead of a function. MyGeotab never called our function (because it wasn't a function anymore!), so it never got to the initialization step.

### What We Learned From Heat Map

Looking closely at the working Heat Map code:

```javascript
geotab.addin.heatmap = function() {
    // ... lots of code ...
    return {
        initialize: function(e, t, n) { ... },
        focus: function(e, t) { ... }
    };
};  // Notice: NO () at the end!
```

The Heat Map uses the correct pattern - no immediate invocation!

### The Fix

Simply remove the `()` from the end of your Add-In registration:

**Before:**
```javascript
geotab.addin.myAddin = function() { return {...}; }();  // ❌ Wrong
```

**After:**
```javascript
geotab.addin.myAddin = function() { return {...}; };  // ✅ Correct
```

## Verified Working Example

Here's the corrected minimal-test.js that now works:

```javascript
"use strict";

geotab.addin["minimal-test"] = function() {
    console.log("minimal-test loading");

    return {
        initialize: function(api, state, callback) {
            console.log("🎉🎉🎉 INITIALIZE CALLED!");
            document.body.innerHTML = "<h1>SUCCESS!</h1><pre id='output'></pre>";

            var output = document.getElementById("output");
            output.textContent = "Initialize called!\n";

            if (api) {
                api.getSession(function(cred) {
                    output.textContent += "User: " + cred.userName + "\n";
                    output.textContent += "Database: " + cred.database + "\n";
                });

                api.call("Get", {typeName: "Device"}, function(devices) {
                    output.textContent += "Vehicles: " + devices.length + "\n";
                });
            }

            callback();
        },

        focus: function(api, state) {
            console.log("focus called");
        }
    };
};  // ✅ No () here!

console.log("minimal-test registered");
```

This now successfully:
- ✅ Loads and registers the Add-In
- ✅ Gets `initialize()` called by MyGeotab
- ✅ Receives the API object
- ✅ Can call `api.getSession()` and `api.call()`
- ✅ Displays user info and vehicle count

## Conclusion

We successfully:
- Set up GitHub Pages hosting
- Configured HTTPS properly
- Got official Geotab Add-Ins working
- Replicated the Heat Map to our own hosting
- **Identified and fixed the initialization issue**
- **Created working custom Add-In code!**

The key lesson: **Don't use immediate function invocation** when registering Geotab Add-Ins. Let MyGeotab call your function when it's ready.

## Resources

- **Working example**: [Heat Map on our GitHub Pages](https://fhoffa.github.io/geotab-vibe-guide/heatmap-copy/heatmap-local.html)
- **Non-working example**: [Minimal Test](https://fhoffa.github.io/geotab-vibe-guide/minimal-test.html)
- **All test files**: Available in this repository

---

*Last updated: 2026-01-23*
*If you solve this mystery, please open an issue and share your findings!*
