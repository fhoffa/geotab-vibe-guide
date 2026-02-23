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

No — not through the standard MyGeotab API. `FillUp` is a **read-only** entity. The system generates FillUp records automatically by analyzing engine fuel-level data over time; you cannot insert them directly via `Add`.

If you need to inject the underlying **StatusData** records (engine fuel-level readings that the system uses to detect fill-ups), you can use the **Data Intake Gateway (DIG)**.

**Important:** DIG is a separate service that requires a **MyAdmin account** with the `DIG-Access` role — your regular MyGeotab credentials won't work. Contact your Reseller or [Geotab Support](mailto:integrations@geotab.com) to get set up.

**DIG resources:**

- [DIG API Endpoint support article](https://support.geotab.com/en-GB/software-integration/doc/dig-api-endpoint)
- [Data Intake Gateway integrator guide](https://docs.google.com/document/d/15uNuPqwFcPLe6vKs_JgY5nPTy2isQ3WYUu4oyQ3cEfQ/edit)

> **Source:** [Hackathon Q&A on Reddit](https://www.reddit.com/r/GEOTAB/comments/1r242zb/comment/o6o7o2e/) — community follow-up confirmed by Geotab support.
