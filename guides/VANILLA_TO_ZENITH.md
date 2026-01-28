# Transforming a Vanilla Add-In to Zenith

You have a working Add-In with vanilla JS/CSS. Now you want the polished MyGeotab look. This guide shows you how to transform it using AI.

---

## Before You Start

**Make sure your vanilla version works first!** Don't try to build with Zenith from scratch - it's much harder to debug.

**You'll need:**
- Node.js installed
- Your working vanilla Add-In code
- 10-15 minutes for the build setup

---

## The Transformation Prompt

Give your AI this prompt along with your vanilla code:

```
Transform this vanilla JavaScript Geotab Add-In to use React + Zenith.

Here's my current working code:
[paste your HTML/JS here]

Requirements:
1. Use @geotab/zenith components
2. Keep the same functionality
3. Set up webpack to build a single bundle
4. The output should work in MyGeotab's iframe

Create:
- package.json with dependencies
- webpack.config.js
- src/index.jsx (entry point)
- src/[ComponentName].jsx (main component)
- Instructions to build
```

---

## What the AI Will Generate

### 1. package.json

```json
{
  "name": "vehicle-manager-zenith",
  "version": "1.0.0",
  "scripts": {
    "build": "webpack --mode production"
  },
  "dependencies": {
    "@geotab/zenith": "^50.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@babel/core": "^7.23.0",
    "@babel/preset-env": "^7.23.0",
    "@babel/preset-react": "^7.23.0",
    "babel-loader": "^9.1.0",
    "css-loader": "^6.8.0",
    "file-loader": "^6.2.0",
    "html-webpack-plugin": "^5.5.0",
    "style-loader": "^3.3.0",
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.0"
  }
}
```

### 2. webpack.config.js

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'your-addin.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(woff|woff2|otf|ttf|eot)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'your-addin.html',
    }),
  ],
};
```

### 3. src/index.jsx (Entry Point)

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import '@geotab/zenith/dist/index.css';
import YourComponent from './YourComponent';

// Store React root globally
let root = null;

geotab.addin['your-addin-name'] = function() {
  return {
    initialize: function(api, state, callback) {
      const container = document.getElementById('app');
      root = createRoot(container);
      root.render(<YourComponent api={api} />);
      callback();
    },
    focus: function(api, state) {
      // Re-render if needed
    },
    blur: function(api, state) {
      // Cleanup if needed
    }
  };
};
```

### 4. src/YourComponent.jsx (Main Component)

The AI will transform your vanilla logic into React:

```jsx
import React, { useState, useEffect } from 'react';
import { Button, TextInput, FeedbackProvider, Alert, Waiting } from '@geotab/zenith';

function YourComponent({ api }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    api.call('Get', { typeName: 'Device' },
      (result) => {
        setData(result);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  };

  if (loading) return <Waiting />;

  return (
    <FeedbackProvider>
      <div style={{ padding: '20px' }}>
        {error && <Alert variant="error">{error}</Alert>}
        {/* Your UI here */}
      </div>
    </FeedbackProvider>
  );
}

export default YourComponent;
```

---

## Build and Test

```bash
# Install dependencies
npm install

# Build the bundle
npm run build

# Output will be in dist/
# - your-addin.html
# - your-addin.js
# - font files (woff, woff2)
```

Host the `dist/` folder on GitHub Pages or your server.

---

## Common Issues and Fixes

### "FeedbackProvider is not initialized"

Wrap your component with `FeedbackProvider`:

```jsx
// WRONG
<Alert variant="error">Error!</Alert>

// CORRECT
<FeedbackProvider>
  <Alert variant="error">Error!</Alert>
</FeedbackProvider>
```

### "TextField is not exported" / "Spinner is not exported"

Zenith uses different names:
- `TextField` → `TextInput`
- `Spinner` → `Waiting`

### Zenith Table breaks with custom render functions

Use HTML table with Zenith colors instead:

```jsx
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead>
    <tr>
      <th style={{
        padding: '12px',
        borderBottom: '1px solid #EDEBE9',
        color: '#605E5C',
        textAlign: 'left'
      }}>
        Name
      </th>
    </tr>
  </thead>
  <tbody>
    {items.map(item => (
      <tr key={item.id}>
        <td style={{ padding: '12px', borderBottom: '1px solid #EDEBE9' }}>
          {item.name}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Minified errors are hard to read

Add source maps for development:

```javascript
// webpack.config.js
module.exports = {
  // ... other config
  devtool: 'source-map',  // Add this for readable errors
};
```

Build with: `webpack --mode development` for debugging.

---

## Working Example

Compare the before and after:

**Vanilla version:**
`https://fhoffa.github.io/geotab-vibe-guide/examples/addins/vehicle-manager/vehicle-manager.html`

**Zenith version:**
`https://fhoffa.github.io/geotab-vibe-guide/examples/addins/vehicle-manager-zenith/dist/vehicle-manager.html`

**Source code:**
- [Vanilla source](https://github.com/fhoffa/geotab-vibe-guide/tree/main/examples/addins/vehicle-manager)
- [Zenith source](https://github.com/fhoffa/geotab-vibe-guide/tree/main/examples/addins/vehicle-manager-zenith)

---

## Is It Worth It?

| Vanilla | Zenith |
|---------|--------|
| Edit file, refresh browser | Edit, rebuild, refresh |
| ~5 KB total | ~2.3 MB bundle |
| Clear error messages | Minified stack traces |
| Looks custom | Looks like MyGeotab |

**Transform to Zenith when:**
- Professional appearance matters
- Your Add-In will be used by many people
- You want consistency with MyGeotab UI

**Stay vanilla when:**
- Quick prototype or internal tool
- You're still iterating on features
- Bundle size matters

---

## Quick Reference: Zenith Components

| Need | Zenith Component |
|------|-----------------|
| Button | `<Button>Click</Button>` |
| Text input | `<TextInput value={val} onChange={setVal} />` |
| Loading spinner | `<Waiting />` |
| Alert/notification | `<Alert variant="error">Message</Alert>` |
| Checkbox | `<Checkbox checked={val} onChange={setVal} />` |
| Dropdown | `<Select options={opts} value={val} onChange={setVal} />` |

Always wrap with `<FeedbackProvider>` if using Alert components.

---

**Start simple, transform when ready. A working vanilla Add-In beats a broken Zenith one.**
