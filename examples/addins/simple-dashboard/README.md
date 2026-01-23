# Simple Fleet Dashboard Add-In

A beginner-friendly Geotab Add-In that displays fleet statistics and vehicle information.

## Features

- Displays total vehicle count
- Shows active vehicles today
- Lists trips from the past week
- Auto-refreshes every 60 seconds
- Click vehicles to view details in MyGeotab

## Installation Options

### Option 1: GitHub Pages Hosting (Recommended)

1. **Fork or copy these files** to a new GitHub repository
2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "main" branch
   - Save
3. **Get your URL**: GitHub will provide a URL like `https://yourusername.github.io/my-fleet-addin/`
4. **Update config-github.json**:
   - Replace `yourusername` with your GitHub username
   - Replace `my-fleet-addin` with your repository name
5. **Install in MyGeotab**:
   - Administration → System → System Settings → Add-Ins
   - New Add-In → Configuration tab
   - Paste the contents of `config-github.json`
   - Save and refresh

### Option 2: Embedded Source Code

This option embeds all code in the JSON configuration (no hosting needed).

**Using Claude or another AI assistant:**

```text
Take the HTML, CSS, and JavaScript files from this Add-In and create
an embedded JSON configuration I can paste into MyGeotab.

Files:
- index.html
- styles.css
- app.js

Make sure to:
1. Minify the HTML/CSS/JS
2. Escape special characters for JSON
3. Use the structure from config-embedded.json
```

The AI will generate a complete JSON file you can paste directly into MyGeotab.

## How It Works

### Lifecycle Methods

This Add-In implements the three required MyGeotab lifecycle methods:

1. **initialize(api, state, callback)**
   - Called once when the Add-In loads
   - Stores the API reference
   - Loads initial data
   - **Must call `callback()` when done!**

2. **focus(api, state)**
   - Called when user navigates to this Add-In
   - Refreshes the dashboard data

3. **blur(api, state)**
   - Called when user leaves this Add-In
   - Can save state or clean up resources

### API Calls Used

- `api.getSession()` - Gets current user info
- `api.call("Get", {typeName: "Device"})` - Fetches all vehicles
- `api.call("Get", {typeName: "Trip"})` - Fetches trips
- `api.call("Get", {typeName: "LogRecord"})` - Fetches GPS logs

## Customization Ideas

Ask Claude to modify this Add-In:

### Add a Map
```text
Add a Leaflet.js map to this Add-In that shows all vehicle locations.
Use the LogRecord data to get the latest position for each vehicle.
```

### Filter by Group
```text
Add a dropdown to filter vehicles by group.
Fetch Group data from the API and update the dashboard when selected.
```

### Export to CSV
```text
Add an "Export to CSV" button that downloads the vehicle list
with columns: Name, Serial Number, VIN, Last Active Date.
```

### Show Fuel Levels
```text
Modify this to show current fuel levels for each vehicle.
Fetch StatusData for fuel tank and display a progress bar.
```

## File Structure

```
simple-dashboard/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling (prefixed to avoid conflicts)
├── app.js              # JavaScript with lifecycle methods
├── config-github.json  # Configuration for GitHub-hosted version
├── config-embedded.json # Template for embedded version
└── README.md           # This file
```

## Debugging

1. **Open browser console** (F12 or Ctrl+Shift+J)
2. **Check for errors** in the Console tab
3. **Add logging**:
   ```javascript
   console.log("Devices loaded:", devices);
   ```
4. **Test API calls**:
   ```javascript
   geotabApi.call("Get", {typeName: "Device"},
       result => console.log("Success:", result),
       error => console.error("Error:", error)
   );
   ```

## Common Issues

**Add-In doesn't appear in menu**
- Did you save the configuration?
- Did you refresh the browser page?
- Check browser console for errors

**"geotabApi is not defined"**
- Make sure you're using the API inside the lifecycle methods
- Check that `initialize()` was called and `callback()` was executed

**Data not loading**
- Check browser console for API errors
- Verify you have permissions to access the data
- Check date ranges (old data might not exist)

## Learn More

- [Geotab Add-Ins Guide](../../../guides/GEOTAB_ADDINS.md)
- [MyGeotab API Reference](https://geotab.github.io/sdk/software/api/reference/)
- [Geotab SDK Documentation](https://geotab.github.io/sdk/)

## Next Steps

1. **Deploy this example** to see how it works
2. **Modify it** to add your own features
3. **Build something custom** for your fleet's specific needs

**Remember**: You don't need to understand every line! Use Claude or another AI assistant to make changes. Just describe what you want, and let the AI handle the code.
