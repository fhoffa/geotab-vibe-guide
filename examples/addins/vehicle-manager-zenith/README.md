# Vehicle Manager - Zenith Version

A MyGeotab Add-In using React and the Geotab Zenith design system.

## Features

- Lists all vehicles with Zenith Table component
- Inline editing with Zenith TextField
- Save/Cancel with Zenith Buttons
- Loading states with Zenith Spinner
- Success/Error alerts with Zenith Alert
- Consistent MyGeotab styling

## Setup

```bash
cd examples/addins/vehicle-manager-zenith
npm install
npm run build
```

## Development

```bash
npm run dev
```

This watches for changes and rebuilds automatically.

## Deployment

After building, the `dist/` folder contains:
- `vehicle-manager.html` - Entry point
- `vehicle-manager.js` - Bundled React app

Host these files on GitHub Pages, Netlify, or any HTTPS server.

## MyGeotab Configuration

```json
{
  "name": "Vehicle Manager (Zenith)",
  "supportEmail": "https://github.com/fhoffa/geotab-vibe-guide",
  "version": "1.0.0",
  "items": [{
    "url": "https://yourusername.github.io/repo/vehicle-manager.html",
    "path": "ActivityLink/",
    "menuName": {
      "en": "Vehicle Manager"
    }
  }]
}
```

## Components Used

- `Button` - Primary/secondary actions
- `TextField` - Editable vehicle name
- `Table` - Vehicle list display
- `Spinner` - Loading states
- `Alert` - Success/error messages

## Comparison to Vanilla Version

| Aspect | Vanilla JS | Zenith React |
|--------|-----------|--------------|
| Build required | No | Yes (webpack) |
| Dependencies | None | React, Zenith |
| Styling | Custom CSS | Zenith tokens |
| Components | Manual DOM | React components |
| Accessibility | Manual | Built-in WCAG 2.2 |
| MyGeotab match | Approximate | Exact |
