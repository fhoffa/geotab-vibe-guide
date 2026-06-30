"""
Create drivers and assign them to trips in a MyGeotab database.

WHY THIS SCRIPT EXISTS
----------------------
In Geotab you cannot "edit a Trip" to set its driver, and trips are never
created by hand -- the platform generates them from a device's ignition and
GPS data. The driver shown on a Trip (`Trip.driver`) is *derived* from
`DriverChange` events: a record that says "this driver was in this vehicle at
this time".

So "assign a driver to a trip" really means: add a DriverChange.

  * type = "Driver"      -> ongoing assignment. The driver is logged into the
                            vehicle from `dateTime` onward; every trip after
                            that resolves to them until the next change.
  * type = "TripDriver"  -> assigns the driver to the SINGLE trip that contains
                            `dateTime`. This is what you want to label one
                            specific historical trip.

Two rules that bite people (both handled below):
  * `DriverChange` supports Add but NOT Set.
  * `dateTime` must NOT be in the future, or the Add is rejected.

NOTE ON MCP: the Geotab MCP server blocks `DriverChange` in its writable-types
allowlist, so this assignment step must go through the REST API directly --
which is exactly what this script does.

SETUP
-----
Create a `.env` file in the repo root (never commit it):

    GEOTAB_DATABASE=Demo_fh_vegas4
    GEOTAB_USERNAME=you@example.com
    GEOTAB_PASSWORD=your_password
    GEOTAB_SERVER=my.geotab.com

Then:  pip install requests python-dotenv  &&  python assign_drivers_to_trips.py
"""

import os
import sys
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv

# --- Configuration -------------------------------------------------------

# The drivers to ensure exist, and which vehicle (device id) to label a trip
# for. Edit these to match your database. Device ids look like "b2", "b4"...
# (get them with a Device Get if you don't know them).
DRIVERS = [
    {"first": "Alex",   "last": "Morgan", "email": "alex.morgan@demo-fh.example",   "device": "b2"},
    {"first": "Jordan", "last": "Lee",    "email": "jordan.lee@demo-fh.example",    "device": "b4"},
    {"first": "Sam",    "last": "Rivera", "email": "sam.rivera@demo-fh.example",    "device": "b7"},
    {"first": "Taylor", "last": "Brooks", "email": "taylor.brooks@demo-fh.example", "device": "b9"},
    {"first": "Casey",  "last": "Nguyen", "email": "casey.nguyen@demo-fh.example",  "device": "bA"},
]

# Built-in security clearance suitable for a driver who only authenticates by
# key / the Drive app (no MyGeotab portal access).
DRIVER_SECURITY_GROUP = "GroupNothingSecurityId"

# "TripDriver" labels one specific trip; "Driver" is an ongoing assignment.
DRIVER_CHANGE_TYPE = "TripDriver"

# How far back to look for a trip to label.
TRIP_LOOKBACK_DAYS = 30


# --- Tiny API helper -----------------------------------------------------

class GeotabApi:
    def __init__(self, server, credentials):
        self.url = f"https://{server}/apiv1"
        self.credentials = credentials

    def call(self, method, **params):
        params["credentials"] = self.credentials
        resp = requests.post(
            self.url, json={"method": method, "params": params}, timeout=60
        )
        data = resp.json()
        if "error" in data:
            raise RuntimeError(f"{method} failed: {data['error']}")
        return data["result"]


def authenticate():
    """Authenticate ONCE. Geotab locks the account on repeated bad auth, so we
    never loop this -- we reuse the returned credentials for every call."""
    load_dotenv()
    database = os.getenv("GEOTAB_DATABASE")
    username = os.getenv("GEOTAB_USERNAME")
    password = os.getenv("GEOTAB_PASSWORD")
    server = os.getenv("GEOTAB_SERVER", "my.geotab.com")

    if not all([database, username, password]):
        sys.exit("Missing GEOTAB_DATABASE / GEOTAB_USERNAME / GEOTAB_PASSWORD in .env")

    resp = requests.post(
        f"https://{server}/apiv1",
        json={"method": "Authenticate", "params": {
            "database": database, "userName": username, "password": password,
        }},
        timeout=60,
    )
    data = resp.json()
    if "error" in data:
        sys.exit(f"Authentication failed: {data['error']}")

    result = data["result"]
    # Big databases live on a specific federation server; honor the redirect.
    real_server = result.get("path") or server
    if real_server in ("ThisServer", "", None):
        real_server = server
    print(f"Authenticated to {database} on {real_server}")
    return GeotabApi(real_server, result["credentials"])


# --- Steps ---------------------------------------------------------------

def ensure_driver(api, spec):
    """Return the id of the driver User, creating it if it doesn't exist."""
    existing = api.call("Get", typeName="User", search={"name": spec["email"]})
    if existing:
        print(f"  driver exists: {spec['email']} -> {existing[0]['id']}")
        return existing[0]["id"]

    new_id = api.call("Add", typeName="User", entity={
        "name": spec["email"],
        "firstName": spec["first"],
        "lastName": spec["last"],
        "isDriver": True,
        "securityGroups": [{"id": DRIVER_SECURITY_GROUP}],
        "companyGroups": [{"id": "GroupCompanyId"}],
        "driverGroups": [{"id": "GroupCompanyId"}],
        # A password is only needed if the driver will log into the Drive app.
        "password": "ChangeMe!" + spec["first"],
    })
    print(f"  driver created: {spec['email']} -> {new_id}")
    return new_id


def latest_trip(api, device_id):
    """Most recent completed trip for a device within the lookback window."""
    now = datetime.now(timezone.utc)
    from_date = (now - timedelta(days=TRIP_LOOKBACK_DAYS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    to_date = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    trips = api.call("Get", typeName="Trip", resultsLimit=5000, search={
        "deviceSearch": {"id": device_id},
        "fromDate": from_date,
        "toDate": to_date,
    })
    if not trips:
        return None
    # Trips come back chronologically; the last one is the most recent.
    return max(trips, key=lambda t: t.get("start", ""))


def assign_driver_to_trip(api, driver_id, device_id, trip):
    """Label `trip` with `driver_id` via a TripDriver DriverChange.

    The DriverChange.dateTime must fall inside the trip and must not be in the
    future, so we use the trip's start time."""
    when = trip["start"]  # already an ISO8601 string in the past
    api.call("Add", typeName="DriverChange", entity={
        "dateTime": when,
        "device": {"id": device_id},
        "driver": {"id": driver_id},
        "type": DRIVER_CHANGE_TYPE,
    })
    return when


def verify(api, trip_id):
    """Re-fetch the trip and report who its driver resolved to."""
    trips = api.call("Get", typeName="Trip", search={"id": trip_id})
    if not trips:
        return "(trip not found on re-fetch)"
    driver = trips[0].get("driver")
    if not driver or driver.get("id") in (None, "UnknownDriverId"):
        return "UnknownDriver"
    return driver.get("id")


def main():
    api = authenticate()

    for spec in DRIVERS:
        print(f"\n{spec['first']} {spec['last']}  (vehicle {spec['device']})")
        driver_id = ensure_driver(api, spec)

        trip = latest_trip(api, spec["device"])
        if not trip:
            print(f"  no trip found for device {spec['device']} in the last "
                  f"{TRIP_LOOKBACK_DAYS} days -- skipping assignment")
            continue

        when = assign_driver_to_trip(api, driver_id, spec["device"], trip)
        resolved = verify(api, trip["id"])
        ok = "OK" if resolved == driver_id else "check"
        print(f"  trip {trip['id']} @ {when}")
        print(f"  Trip.driver now -> {resolved}  [{ok}]")

    print("\nDone.")


if __name__ == "__main__":
    main()
