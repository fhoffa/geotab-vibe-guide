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

If you need to inject the underlying **StatusData** records (engine fuel-level readings that the system uses to detect fill-ups), you can use the **Data Intake Gateway (DIG)**. DIG is Geotab's REST API for ingesting custom telematics device data — including StatusData records — into MyGeotab.

**Key points about DIG:**

- DIG accepts bulk `StatusData` records via its `/records` HTTPS endpoint.
- Each record targets a specific device by its Geotab **serial number** (not the MyGeotab device ID).
- You need a **MyAdmin account** with the `DIG-Access` role.
- Records must include UTC timestamps in ISO 8601 zulu format (`yyyy-MM-ddTHH:mm:ss.ffffffZ`).

**Getting started with DIG:**

1. Read the [DIG API Endpoint support article](https://support.geotab.com/en-GB/software-integration/doc/dig-api-endpoint).
2. Review the [Data Intake Gateway integrator guide](https://docs.google.com/document/d/15uNuPqwFcPLe6vKs_JgY5nPTy2isQ3WYUu4oyQ3cEfQ/edit) for authentication workflows, record formats, and best practices.
3. Use the [DIG OpenAPI specification on GitHub](https://github.com/Geotab/mg-media/tree/master/DIG) and the [DIG Sample Calls Colab notebook](https://colab.research.google.com/) to explore the API.

**For testing:** If you just want to simulate fill-up data for development, consider generating synthetic StatusData on your own side rather than pushing to the production DIG endpoint. DIG is designed for real integrations with custom telematics devices — not for casual testing.

> **Source:** [Hackathon Q&A on Reddit](https://www.reddit.com/r/GEOTAB/comments/1r242zb/comment/o6o7o2e/) — community follow-up confirmed by Geotab support.
