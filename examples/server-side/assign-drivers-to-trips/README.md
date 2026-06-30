# Assign drivers to trips (Geotab REST API)

Creates driver `User` records and labels real trips with them.

## The key idea

You don't edit a `Trip` to set its driver, and you can't create trips by hand —
Geotab generates them from vehicle data. `Trip.driver` is *derived* from
**`DriverChange`** events. So "assign a driver to a trip" = add a `DriverChange`:

| `type` | Effect |
|---|---|
| `Driver` | Ongoing — driver is logged into the vehicle from `dateTime` onward; later trips resolve to them. |
| `TripDriver` | Labels the single trip that contains `dateTime`. |

Two gotchas the script handles for you:
- `DriverChange` supports **Add** but not **Set**.
- `dateTime` must **not be in the future**.

> Heads up: the **Geotab MCP server blocks `DriverChange`** (it's not in the MCP's
> writable-types allowlist), so this step has to go through the REST API directly.
> Creating the drivers (`User`) works through either the MCP or REST.

## Run it

```bash
pip install requests python-dotenv
```

Create a `.env` in the repo root (already gitignored — never commit it):

```
GEOTAB_DATABASE=Demo_fh_vegas4
GEOTAB_USERNAME=you@example.com
GEOTAB_PASSWORD=your_password
GEOTAB_SERVER=my.geotab.com
```

Edit the `DRIVERS` list at the top of `assign_drivers_to_trips.py` (names +
which vehicle/device id to label a trip for), then:

```bash
python assign_drivers_to_trips.py
```

It authenticates once, ensures each driver exists, labels each one's most recent
trip via a `TripDriver` `DriverChange`, and re-reads the trip to confirm
`Trip.driver` stuck.
