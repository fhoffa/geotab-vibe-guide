# GitHub Pages Add-In Test Instructions

## For Repo Owner (fhoffa) - First Time Setup

### Step 1: Enable GitHub Pages on YOUR Repo

1. Go to https://github.com/fhoffa/geotab-vibe-guide
2. Click **Settings** (top right)
3. Click **Pages** in the left sidebar
4. Under "Source":
   - Select **Deploy from a branch**
   - Branch: **claude/add-geotab-guide-ZOdUk** (or merge to main first)
   - Folder: **/ (root)**
5. Click **Save**
6. **Wait 2-3 minutes** for GitHub to deploy

You'll see: `Your site is live at https://fhoffa.github.io/geotab-vibe-guide/`

### Step 2: Verify It Deployed

Open in your browser:
```
https://fhoffa.github.io/geotab-vibe-guide/addin-test.html
```

You should see a purple gradient page. If 404, wait another minute.

### Step 3: Test in MyGeotab

Use the config in `addin-test-config.json` and follow the reader instructions below.

---

## For Readers - Testing with the Hosted Example

**Quick test using the example hosted on fhoffa's repo** (no setup needed!)

### Step 1: Copy This Configuration

```json
{
    "name": "GitHubPagesTest",
    "supportEmail": "test@example.com",
    "version": "1.0",
    "items": [{
        "url": "https://fhoffa.github.io/geotab-vibe-guide/addin-test.html",
        "path": "ActivityLink",
        "menuName": {
            "en": "GitHub Test"
        }
    }]
}
```

### Step 2: Install in MyGeotab

1. Go to MyGeotab → **Administration → System → System Settings → Add-Ins**
2. Click **"New Add-In"**
3. Switch to **"Configuration"** tab
4. Paste the JSON above
5. Click **"Save"**
6. **Refresh your browser page** (important!)

### Step 3: Test the Add-In

1. Look for **"GitHub Test"** in the left navigation menu (after Activity)
2. Click it
3. You should see a purple gradient page load inside MyGeotab

### Step 4: Check the Results

**Look at the debug log at the bottom of the page.**

**✅ SUCCESS looks like this:**
```
[time] 📄 Page loaded from GitHub Pages
[time] 🔍 Waiting for MyGeotab to call initialize()...
[time] ✅ initialize() called!
[time] API object: EXISTS
[time] Calling api.getSession()...
[time] ✅ Got session: your.email@example.com
[time] Calling api.call("Get", {typeName: "Device"})...
[time] ✅ Loaded 25 vehicles
```

**And you should see at the top:**
- Your MyGeotab username
- Your database name
- Your vehicle count
- Current time

**❌ FAILURE looks like this:**
```
[time] 📄 Page loaded from GitHub Pages
[time] 🔍 Waiting for MyGeotab to call initialize()...
(nothing else - stuck here forever)
```

---

## For Readers - Setting Up Your Own GitHub Pages Add-In

Once you've confirmed the test works, here's how to create your own:

### Step 1: Create a New GitHub Repository

1. Go to https://github.com/new
2. Name it something like: `geotab-fleet-dashboard`
3. Make it **Public** (required for free GitHub Pages)
4. Check **"Add a README file"**
5. Click **"Create repository"**

### Step 2: Add Your Add-In Files

1. In your new repo, click **"Add file"** → **"Create new file"**
2. Name it: `index.html`
3. Copy the contents from: https://raw.githubusercontent.com/fhoffa/geotab-vibe-guide/main/examples/addins/github-pages-example/index.html
4. Click **"Commit new file"**

Repeat for:
- `styles.css` (from the github-pages-example folder)
- `app.js` (from the github-pages-example folder)

### Step 3: Enable GitHub Pages on YOUR Repo

1. In **your** repository, click **Settings**
2. Click **Pages** in the left sidebar
3. Under "Source":
   - Branch: **main**
   - Folder: **/ (root)**
4. Click **Save**
5. **Wait 2-3 minutes**

You'll see: `Your site is live at https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

### Step 4: Create Your Add-In Config

```json
{
    "name": "MyFleetDashboard",
    "supportEmail": "your.email@example.com",
    "version": "1.0",
    "items": [{
        "url": "https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/",
        "path": "ActivityLink",
        "menuName": {
            "en": "My Fleet Dashboard"
        }
    }]
}
```

**Replace:**
- `YOUR-USERNAME` with your GitHub username
- `YOUR-REPO-NAME` with your repository name

### Step 5: Install in MyGeotab

Same as before:
1. Administration → System → System Settings → Add-Ins
2. New Add-In → Configuration tab
3. Paste your JSON
4. Save and refresh

### Step 6: Make Changes

To update your Add-In:
1. Edit `index.html`, `styles.css`, or `app.js` in GitHub
2. Commit changes
3. Wait 1-2 minutes for GitHub Pages to redeploy
4. Refresh your MyGeotab page

**No need to touch the Add-In config again!** It always loads the latest version from GitHub Pages.

---

## Troubleshooting

**404 Error on GitHub Pages URL**
- Wait 3-5 minutes after enabling GitHub Pages
- Verify your repo is **Public**
- Make sure files are in the root (not in a subfolder)

**Add-In doesn't appear in menu**
- Did you refresh the browser after saving?
- Check browser console for errors (F12)

**Page loads but `initialize()` never called**
- This means GitHub Pages works but MyGeotab isn't calling lifecycle methods
- Check browser console for JavaScript errors
- Verify your `initialize()`, `focus()`, and `blur()` functions are defined

**"Mixed Content" or CORS errors**
- Make sure your GitHub Pages URL uses HTTPS
- Don't try to load HTTP resources (images, scripts) from your page
