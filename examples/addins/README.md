# Geotab Add-In Examples

This directory contains example Geotab Add-Ins that demonstrate how to extend MyGeotab with custom pages and functionality.

## What Are Add-Ins?

Geotab Add-Ins are custom pages and buttons that integrate directly into the MyGeotab interface. They let you build specialized tools, dashboards, and automations for your fleet.

**Learn more**: [Geotab Add-Ins Guide](../../guides/GEOTAB_ADDINS.md)

## Examples

### [Simple Dashboard](./simple-dashboard/)
**Difficulty**: Beginner

A complete Add-In that displays:
- Total vehicle count
- Active vehicles today
- Recent trips
- Vehicle list with click-to-details

**Features**:
- Full lifecycle implementation (initialize, focus, blur)
- Auto-refresh every 60 seconds
- Clean, modern UI
- GitHub Pages deployment instructions
- Embedded source code option

**Use this as a template** for your own Add-Ins!

## How to Use These Examples

### Option 1: GitHub Pages (Recommended)

1. Copy an example to your own GitHub repository
2. Enable GitHub Pages in repository settings
3. Update the configuration JSON with your GitHub Pages URL
4. Install in MyGeotab

### Option 2: Embedded Source Code

1. Use Claude or another AI to convert the files to embedded JSON:
   ```text
   Convert these Add-In files (index.html, styles.css, app.js)
   into an embedded Geotab Add-In JSON configuration.
   ```
2. Paste the generated JSON into MyGeotab

## Vibe Coding with Add-Ins

Instead of manually editing code, use AI assistants to build and modify Add-Ins:

### Start from an Example
```text
I want to modify the simple-dashboard Add-In to show a map
of vehicle locations. Add Leaflet.js and plot each vehicle.
```

### Build from Scratch
```text
Create a Geotab Add-In that:
1. Shows a list of drivers
2. Displays their safety scores
3. Highlights drivers with recent violations
4. Includes a "Generate Report" button

Use the simple-dashboard example as a reference for structure.
```

### Debug Issues
```text
My Add-In is showing this error in the console:
[paste error]

Here's my code:
[paste code]

What's wrong and how do I fix it?
```

## Add-In Ideas to Build

### Beginner
- **Vehicle Status Board**: Real-time grid of all vehicles with status indicators
- **Quick Report Generator**: One-click buttons to generate common reports
- **Fleet Summary**: Daily statistics dashboard

### Intermediate
- **Route Optimizer**: Display trips on a map with suggestions for efficiency
- **Maintenance Tracker**: Custom alerts for upcoming maintenance
- **Zone Manager**: Interactive map to create and edit geofences

### Advanced
- **Custom Analytics**: Integration with external data sources
- **Driver Scorecards**: Gamification and leaderboards
- **Predictive Maintenance**: ML-based alerts using historical data

## Resources

- [Geotab Add-Ins Guide](../../guides/GEOTAB_ADDINS.md) - Complete tutorial
- [Official Geotab Documentation](https://developers.geotab.com/myGeotab/addIns/developingAddIns/)
- [MyGeotab API Reference](https://geotab.github.io/sdk/software/api/reference/)
- [Add-In Generator Tool](https://github.com/Geotab/generator-addin)

## Contributing

Have you built a cool Add-In? Consider sharing it!

1. Add it to this examples directory
2. Include a clear README
3. Document what it does and how to install it
4. Include customization ideas for others

**Remember**: Vibe coding means you don't need to be an expert. Use AI tools to build, modify, and understand these examples. Focus on what you want to create, not on memorizing syntax!
