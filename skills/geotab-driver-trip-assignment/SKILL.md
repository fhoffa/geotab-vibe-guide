---
name: geotab-driver-trip-assignment
description: Create drivers and assign them to trips in a Geotab (MyGeotab) database, including demo databases. Use when seeding a demo/fleet with drivers, attributing trips to drivers, or when "Trip.driver" shows UnknownDriver. Covers the DriverChange model (TripDriver vs Driver), the MCP-vs-REST split, and safe cleanup.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "1.0"
---

# Geotab Driver & Trip Assignment

How to create drivers and make trips show the right driver — the part that
trips up almost everyone, because the obvious approach ("set the trip's driver")
does not exist.

## When to Use This Skill

- Seeding a demo database with drivers and attributing trips to them
- A trip's `driver` comes back as `UnknownDriverId` and you want to fix it
- You need to assign a driver to **one** specific historical trip
- You need to assign a driver to a vehicle **going forward**
- Cleaning up demo drivers afterward

## The mental model (read this first)

Three facts decide everything:

1. **A driver is a `User`** with `isDriver: true`. Users are creatable.
2. **A `Trip` is read-only and system-generated.** You cannot create, edit, or
   delete a trip, and there is **no way to set `Trip.driver` directly**.
3. **`Trip.driver` is *derived* from `DriverChange` events.** A `DriverChange`
   says "this driver was in this vehicle at this time." The platform resolves
   each trip's driver from these events.

So **"assign a driver to a trip" = add a `DriverChange`.**

```
User (isDriver=true)  ──referenced by──►  DriverChange  ──resolves──►  Trip.driver
                                          (device + driver + dateTime + type)
```

## Step 1 — Create the driver (User)

`User` supports `Add`. Minimum viable driver:

```jsonc
// Add, typeName "User"
{
  "name": "alex.morgan@example.com",   // username (use an email)
  "firstName": "Alex",
  "lastName": "Morgan",
  "isDriver": true,
  "securityGroups": [{ "id": "GroupNothingSecurityId" }], // driver-only, no portal access
  "companyGroups":  [{ "id": "GroupCompanyId" }],
  "driverGroups":   [{ "id": "GroupCompanyId" }],
  "password": "ChangeMe!"               // only needed if they log into Drive app
}
```

Notes:
- `securityGroups` needs **at least one** entry. `GroupNothingSecurityId` is the
  right choice for a driver who only authenticates by key / the Drive app and
  should have no MyGeotab portal access. (`GroupDriveId` is **not** a valid id —
  don't use it.) For portal access, copy an existing user's clearance instead.
- Make it **idempotent**: `Get` `User` by `{ "name": "<email>" }` first; only
  `Add` if it returns nothing.

## Step 2 — Assign to a trip (DriverChange)

`DriverChange` supports **`Add` only** (no `Set`). Required fields: `device`,
`driver`, `dateTime`. The `type` decides the meaning:

| `type`        | Effect |
|---------------|--------|
| `TripDriver`  | Labels the **single trip** that contains `dateTime`. |
| `Driver`      | **Ongoing** assignment: driver is logged into the vehicle from `dateTime` onward; later trips resolve to them until the next change. |

Other valid `DriverChangeType` values: `DriverKey`, `DriverVehicleChange`,
`None`, `ResetDriver`.

To label one existing trip, use that trip's `start` timestamp:

```jsonc
// Add, typeName "DriverChange"
{
  "dateTime": "2026-06-30T04:23:59.540Z", // the target trip's start; MUST be in the past
  "device":   { "id": "b2" },
  "driver":   { "id": "b60" },
  "type":     "TripDriver"
}
```

**Two rules that cause silent failures:**
- `dateTime` **must not be in the future** — the Add is rejected otherwise.
- Adding a `DriverChange` makes Geotab **asynchronously re-process and re-split
  trips**, so the trip's **`id` can change** and `Trip.driver` may take seconds
  to a few minutes to reflect the change. Verify by re-querying the device's
  trips over the same time window, not by caching the old trip id.

## Step 3 — Verify

Re-`Get` `Trip` for the device over the window and confirm `driver` resolved:

```jsonc
// Get, typeName "Trip"
{ "search": { "deviceSearch": { "id": "b2" },
              "fromDate": "2026-06-30T04:00:00Z",
              "toDate":   "2026-06-30T05:30:00Z" },
  "propertySelector": { "fields": ["id", "start", "stop", "driver"] } }
// driver -> { "id": "b60", "isDriver": true }  ✅  (UnknownDriverId = not yet resolved)
```

## ⚠️ MCP vs REST — this matters

The **Geotab MCP server blocks `DriverChange`** (it's not in the MCP's
writable-types allowlist; the Add is rejected as "read-only or
system-generated"). So:

| Operation                     | MCP            | REST API (`/apiv1`) |
|-------------------------------|----------------|---------------------|
| Create driver (`User` Add)    | ✅              | ✅ |
| Deactivate driver (`User` Set)| ✅ (see below) | ✅ |
| Assign to trip (`DriverChange` Add) | ❌ blocked | ✅ **required** |

**Do the `DriverChange` step over the REST API.** See the runnable example:
`examples/server-side/assign-drivers-to-trips/`.

REST pattern (authenticate **once** — repeated bad auth locks the account
15–30 min):

```python
import requests
url = "https://my.geotab.com/apiv1"
cred = requests.post(url, json={"method": "Authenticate", "params": {
    "database": DB, "userName": USER, "password": PW}}).json()["result"]
creds, server = cred["credentials"], cred.get("path") or "my.geotab.com"
api = f"https://{server}/apiv1"   # honor the federation redirect in result.path

requests.post(api, json={"method": "Add", "params": {
    "typeName": "DriverChange",
    "entity": {"dateTime": trip_start, "device": {"id": dev},
               "driver": {"id": drv}, "type": "TripDriver"},
    "credentials": creds}})
```

## Cleanup — deactivate, don't delete

**`User` does not support `Remove`.** The correct way to retire a demo driver is
to set `activeTo` to a timestamp in the past (after the user's `activeFrom`).
Deactivated users drop out of MyGeotab's active driver lists.

```jsonc
// Set, typeName "User"
{
  "id": "b5B",
  "activeTo": "2026-06-30T02:00:00.000Z",          // in the past = retired
  "userModifiedInfo": { "modifiedUserName": "you@example.com" }
}
```

**Gotcha:** `User.Set` records an audit "modified by" user. If the calling
session has no associated username (common with MCP/service tokens) you get
`UserModifiedInfo.ModifiedUserName cannot be null or empty`. Fix: pass
`userModifiedInfo.modifiedUserName` explicitly, as above. (Reverting a trip's
label is a separate step: add a `DriverChange` of `type: "ResetDriver"` at the
same `dateTime`.)

## Quick checklist

- [ ] Driver = `User` + `isDriver:true` + `securityGroups:[{id:"GroupNothingSecurityId"}]`
- [ ] Idempotent: `Get` by name before `Add`
- [ ] Assign via `DriverChange` Add — `TripDriver` (one trip) or `Driver` (ongoing)
- [ ] `dateTime` in the past; use the trip's `start` for a specific trip
- [ ] `DriverChange` over **REST**, not MCP
- [ ] Authenticate once; honor `result.path` federation redirect
- [ ] Expect async trip re-split (ids change); verify by re-query
- [ ] Cleanup = deactivate via `activeTo` (+ `userModifiedInfo.modifiedUserName`), not delete

## References

- DriverChange object — https://developers.geotab.com/myGeotab/apiReference/objects/DriverChange/
- Add method — https://developers.geotab.com/myGeotab/apiReference/methods/Add/
- "How to Assign a Driver for a single Trip" — https://community.geotab.com/s/article/How-to-Assign-a-Driver-for-a-single-Trip
- Runnable example in this repo — `examples/server-side/assign-drivers-to-trips/`
