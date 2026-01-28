# Embedded Add-Ins (No Hosting Required)

Instead of hosting files externally, you can embed everything directly in the JSON configuration using the `files` property. This eliminates the need for GitHub Pages or HTTPS hosting.

## Critical: CSS Must Be Inline

**IMPORTANT:** When creating embedded add-ins, you CANNOT use `<style>` tags in the `<head>`. MyGeotab may strip or ignore these styles. Instead, you MUST use inline styles directly on each element.

**This will NOT work:**
```html
<head>
  <style>
    .card { background: white; padding: 20px; }
  </style>
</head>
<body>
  <div class="card">Content</div>
</body>
```

**This WILL work:**
```html
<body>
  <div style="background:white;padding:20px;">Content</div>
</body>
```

## Basic Structure

```json
{
  "name": "Embedded Add-In",
  "supportEmail": "you@example.com",
  "version": "1.0",
  "items": [{
    "url": "page.html",
    "path": "ActivityLink",
    "menuName": {
      "en": "My Add-In"
    }
  }],
  "files": {
    "page.html": "<html>...</html>"
  }
}
```

**Critical Points:**
- Use `"url": "page.html"` in items (NOT `"page"`)
- Remove trailing slash from path: `"ActivityLink"` not `"ActivityLink/"`
- **All CSS and JavaScript MUST be inlined** in the HTML
- **Cannot use separate file references** like `<script src="app.js">` - they cause 404 errors

## Complete Working Example

This embedded add-in shows vehicle count with inline styles:

```json
{
  "name": "Embedded Fleet Stats",
  "supportEmail": "test@example.com",
  "version": "1.0",
  "items": [{
    "url": "fleet-stats.html",
    "path": "ActivityLink",
    "menuName": {
      "en": "Fleet Stats"
    }
  }],
  "files": {
    "fleet-stats.html": "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Fleet Stats</title></head><body style='margin:0;padding:20px;font-family:Arial,sans-serif;background:#f5f5f5;'><h1 style='color:#333;'>Fleet Statistics</h1><div id='status' style='margin:15px 0;'>Initializing...</div><div id='info'></div><script>geotab.addin['embedded-fleet']=function(){return{initialize:function(api,state,callback){var statusEl=document.getElementById('status');var infoEl=document.getElementById('info');statusEl.textContent='Connected to MyGeotab!';api.getSession(function(session){var html='<div style=\"margin:15px 0;padding:10px;background:#e8f4f8;border-radius:4px;\"><strong>User:</strong> '+session.userName+'<br><strong>Database:</strong> '+session.database+'</div>';infoEl.innerHTML=html;api.call('Get',{typeName:'Device'},function(vehicles){html+='<div style=\"margin:15px 0;padding:10px;background:#e8f4f8;border-radius:4px;\"><div style=\"font-size:2em;font-weight:bold;color:#2c3e50;margin:10px 0;\">'+vehicles.length+'</div><strong>Total Vehicles</strong></div>';infoEl.innerHTML=html;},function(error){html+='<div style=\"color:#d9534f;padding:10px;background:#f8d7da;border-radius:4px;\">Error: '+error+'</div>';infoEl.innerHTML=html;});});callback();},focus:function(api,state){},blur:function(api,state){}};};console.log('Embedded fleet stats registered');</script></body></html>"
  }
}
```

## JSON String Escaping

When embedding HTML in JSON:
- Double quotes must be escaped: `\"` instead of `"`
- Single quotes are safer for HTML attributes: `<div class='card'>` instead of `<div class="card">`
- Newlines should be removed (use minified code)
- Backslashes must be escaped: `\\` instead of `\`

**Example escaping:**
```javascript
// Original JavaScript
var message = "Hello \"World\"";

// In JSON string
"var message=\"Hello \\\"World\\\"\";"
```

## React and Modern Frameworks

**Warning:** React and modern JavaScript frameworks can have issues in embedded add-ins due to:
1. State management not working properly in the MyGeotab iframe context
2. External library loading failures (CDN blocking)
3. CSS-in-JS not applying correctly

**Recommendation:** For embedded add-ins, use **vanilla JavaScript** with inline styles for maximum compatibility. Save React/frameworks for externally-hosted add-ins.

If you must use React in embedded add-ins:
- Expect state updates to be unreliable
- Use inline styles exclusively, not Tailwind or CSS-in-JS
- Test extensively in the actual MyGeotab environment

## When to Use Embedded vs External

**Use Embedded When:**
- Quick prototypes and demos
- Simple add-ins that won't change often
- Easy sharing (just copy-paste JSON)
- No access to hosting or GitHub
- Educational examples
- Self-contained tools

**Use External Hosting When:**
- Active development (easier debugging)
- Frequent updates needed
- Large add-ins with many files
- Team collaboration
- Version control desired

## Development Workflow

1. Develop with external hosting first (easier to debug)
2. When ready, convert to embedded format
3. Minify JavaScript to reduce size
4. Escape quotes and special characters
5. Test in MyGeotab
