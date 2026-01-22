# Task 04: Web Dashboard

## Goal
Create a web-based dashboard using Flask/FastAPI. This is what students might build in a hackathon. Keep it simple but impressive.

## What to Build

### File 1: `app.py`
**Purpose:** Main Flask/FastAPI web application

**Requirements:**
- Simple web server using Flask or FastAPI
- Home page with fleet overview
- Map page showing vehicle locations
- Trips page with filterable list
- API endpoints for AJAX updates
- Modern, responsive design (Bootstrap or Tailwind)
- Auto-refresh dashboard every 30 seconds

**Routes:**
- `/` - Home dashboard
- `/map` - Interactive map
- `/trips` - Trip history
- `/vehicle/<id>` - Vehicle details
- `/api/vehicles` - JSON endpoint for vehicle data
- `/api/locations` - JSON endpoint for current locations

### File 2: `templates/index.html`
**Purpose:** Main dashboard page

**Requirements:**
- Clean, modern design
- Key metrics cards (total vehicles, active, miles today, alerts)
- Vehicle list with status indicators
- Recent trips table
- Active alerts section
- Auto-refresh using JavaScript

**Design Inspiration:**
```
┌─────────────────────────────────────────────────────────────┐
│  GEOTAB FLEET DASHBOARD                          [Refresh]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 15       │  │ 7        │  │ 487.2    │  │ 2        │   │
│  │ Vehicles │  │ Active   │  │ Miles    │  │ Alerts   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  VEHICLE STATUS                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🟢 Truck 001    45 mph    2 min ago      [Details]   │  │
│  │ 🟢 Van 042      32 mph    1 min ago      [Details]   │  │
│  │ 🟡 Car 103      Idle      5 min ago      [Details]   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  RECENT TRIPS                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Truck 001  |  42.3 mi  |  1h 15m  |  Today 08:30    │  │
│  │ Van 042    |  28.7 mi  |  1h 30m  |  Today 09:00    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### File 3: `templates/map.html`
**Purpose:** Interactive map showing vehicle locations

**Requirements:**
- Use Leaflet.js or Mapbox
- Plot all vehicles on map
- Color-coded markers (green=active, yellow=idle, red=offline)
- Click marker to show vehicle popup with:
  - Vehicle name
  - Current speed
  - Last updated time
  - Link to vehicle details
- Auto-refresh marker positions every 30 seconds
- Optional: Show vehicle trails (historical path)

**Map Features:**
- Zoom controls
- Cluster markers if many vehicles close together
- Filter by vehicle status
- Search for specific vehicle
- Fullscreen mode

### File 4: `templates/trips.html`
**Purpose:** Trip history page with filters

**Requirements:**
- Table of all trips with columns:
  - Vehicle name
  - Start time
  - End time
  - Distance
  - Duration
  - Average speed
- Filters:
  - Date range picker
  - Vehicle selector
  - Minimum distance
- Pagination (show 50 trips per page)
- Export to CSV button
- Sort by any column

### File 5: `static/js/dashboard.js`
**Purpose:** JavaScript for dynamic updates

**Requirements:**
- Fetch data from API endpoints
- Update dashboard without page reload
- Handle auto-refresh
- Show loading indicators
- Error handling (show message if API fails)
- Format dates/times nicely

### File 6: `api_routes.py`
**Purpose:** Separate file for API endpoints

**Requirements:**
- `/api/vehicles` - Return all vehicles with current status
- `/api/locations` - Return current GPS coordinates
- `/api/trips` - Return trips with filters (date, vehicle)
- `/api/alerts` - Return active alerts
- `/api/vehicle/<id>` - Return detailed info for one vehicle

All endpoints return JSON format.

## Additional Files

### `requirements.txt`
```
mygeotab>=0.8.0
python-dotenv>=1.0.0
flask>=3.0.0
# OR
# fastapi>=0.109.0
# uvicorn>=0.27.0

jinja2>=3.1.0
requests>=2.31.0
```

### `static/css/style.css`
**Purpose:** Custom styles for the dashboard

**Requirements:**
- Professional color scheme (blues, greens for fleet theme)
- Responsive design (works on mobile)
- Smooth transitions and animations
- Status indicator colors (green, yellow, red)
- Clean typography

### `README.md`
Include:
- How to run the web app
- Accessing the dashboard (http://localhost:5000)
- Environment variables needed
- How to customize
- Browser compatibility
- Screenshots of each page

## Testing Checklist
- [ ] Web app starts without errors
- [ ] All pages load correctly
- [ ] Map displays vehicle markers
- [ ] Auto-refresh works on dashboard
- [ ] API endpoints return valid JSON
- [ ] Filters work on trips page
- [ ] Responsive design works on mobile
- [ ] No JavaScript console errors

## Success Criteria
Students should:
1. Have a working web dashboard with real data
2. See vehicles on an interactive map
3. Be able to demo this to others
4. Have a foundation to build upon for hackathon

## Deployment Options (Document in README)
- Run locally: `python app.py`
- Deploy to Vercel/Netlify (static parts)
- Deploy to Render/Railway (full app)
- Docker container (bonus)

## Bonus Features (Optional)
- [ ] Dark mode toggle
- [ ] User authentication (if time permits)
- [ ] Email alerts configuration
- [ ] Download reports as PDF
- [ ] Geofence drawing tool
- [ ] Real-time updates using WebSockets
- [ ] Mobile app view

## Notes
- Keep it simple but professional-looking
- Use a CSS framework (Bootstrap or Tailwind) for quick styling
- Focus on functionality over fancy design
- This should be impressive enough to demo at a hackathon
- Add comments in code explaining key concepts
- Make it easy for students to customize colors, layouts, etc.

## UI/UX Tips
- Large, clear metrics at the top
- Color coding for quick visual scanning
- Loading states for all async operations
- Empty states (e.g., "No trips found")
- Error messages that are helpful, not technical
- Mobile-first responsive design
