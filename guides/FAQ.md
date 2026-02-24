# Frequently Asked Questions

Common questions from hackathons, workshops, and the developer community.

---

## API & Data

### Can I create fuel transaction records through the API?

Yes. `FuelTransaction` is a writable entity — it supports `Add`, `Set`, and `Remove`.

**JavaScript (MyGeotab Add-In):**

```javascript
api.call("Add", {
    typeName: "FuelTransaction",
    entity: {
        "dateTime": "2026-02-21T12:00:00.000Z",
        "volume": 50.5,
        "cost": 75.25,
        "currencyCode": "USD",
        "device": { "id": "b123" },
        "location": { "x": -79.4, "y": 43.6 },
        "sourceFlag": "Manual"
    }
}, function(result) {
    console.log("Fuel Transaction Created:", result);
}, function(e) {
    console.error("Error:", e);
});
```

**Python (mygeotab library):**

```python
from datetime import datetime

fuel_tx = api.add('FuelTransaction', {
    'dateTime': datetime.now().isoformat(),
    'volume': 50.5,            # liters
    'cost': 75.25,
    'currencyCode': 'USD',
    'device': {'id': device_id},
    'location': {'x': -79.4, 'y': 43.6},  # longitude, latitude
    'sourceFlag': 'Manual'
})
print(f"Created fuel transaction: {fuel_tx}")
```

Replace `device_id` / `"b123"` with an actual device ID from your database. You can get device IDs by calling `Get` with `typeName: "Device"`.

**Through the UI:** MyGeotab has had Add-Ins for fuel data import (Fuel Tracker, Fuel Transaction Import). Check the Geotab Marketplace or your MyGeotab Add-Ins page for availability.

> **Source:** [Hackathon Q&A on Reddit](https://www.reddit.com/r/GEOTAB/comments/1r242zb/comment/o6o7o2e/) — confirmed by [Mehant Parkash](https://www.linkedin.com/in/mehantparkash), Geotab PM. See also the [FuelTransaction API reference](https://geotab.github.io/sdk/software/api/reference/#FuelTransaction).

### What about FillUp records — can I create those through the API?

Yes — the [FillUp API reference](https://developers.geotab.com/myGeotab/apiReference/objects/FillUp/index.html) lists `Add`, `Set`, and `Remove` endpoints with rate limits of 100 requests/minute each.

**JavaScript (MyGeotab Add-In):**

```javascript
api.call("Add", {
    typeName: "FillUp",
    entity: {
        "device": { "id": "b123" },
        "driver": { "id": "aDriver1" },
        "dateTime": "2026-02-24T10:30:00.000Z",
        "volume": 45.5,
        "cost": 85.50,
        "currencyCode": "AUD",
        "odometer": 125000,
        "distance": 450000,
        "productType": "Regular",
        "location": { "x": 138.6007, "y": -34.9285 }
    }
}, function(result) {
    console.log("FillUp Created:", result);
}, function(e) {
    console.error("Error:", e);
});
```

**Python (mygeotab library):**

```python
fillup = api.add('FillUp', {
    'device': {'id': device_id},
    'driver': {'id': driver_id},
    'dateTime': '2026-02-24T10:30:00.000Z',
    'volume': 45.5,              # liters
    'cost': 85.50,
    'currencyCode': 'AUD',
    'odometer': 125000,          # meters
    'distance': 450000,          # meters since last fill-up
    'productType': 'Regular',
    'location': {'x': 138.6007, 'y': -34.9285}  # longitude, latitude
})
print(f"Created FillUp: {fillup}")
```

Replace `device_id` / `"b123"` and `driver_id` / `"aDriver1"` with actual IDs from your database.

> **Note:** The system also generates FillUp records automatically by analyzing engine fuel-level data. If you need to inject the underlying **StatusData** records instead, you can use the **Data Intake Gateway (DIG)** — a separate service that requires a **MyAdmin account** with the `DIG-Access` role. Contact your Reseller or [Geotab Support](mailto:integrations@geotab.com) to get set up.
>
> **DIG resources:**
> - [DIG API Endpoint support article](https://support.geotab.com/en-GB/software-integration/doc/dig-api-endpoint)
> - [Data Intake Gateway integrator guide](https://docs.google.com/document/d/15uNuPqwFcPLe6vKs_JgY5nPTy2isQ3WYUu4oyQ3cEfQ/edit)

> **Source:** [FillUp API reference](https://developers.geotab.com/myGeotab/apiReference/objects/FillUp/index.html) — Add/Set/Remove endpoints documented with rate limits. See also [Hackathon Q&A on Reddit](https://www.reddit.com/r/GEOTAB/comments/1r242zb/comment/o6o7o2e/).
