# Geotab Demo Database Reference

Complete reference for the data available in Geotab demo databases. Use this when building and testing applications against demo accounts.

**Contents:**
- [What is a Demo Database?](#what-is-a-demo-database)
- [Sample Data Profiles](#sample-data-profiles)
- [Data Volume](#data-volume-european-long-distance-fleet-7-day-window)
- [Entity Schemas](#entity-schemas) (Device, Trip, LogRecord, StatusData, DeviceStatusInfo, ExceptionEvent, Rule, FaultData, User, Group, DriverChange, Audit, Diagnostic)
- [Fetching Demo Data](#fetching-demo-data)
- [Resources](#resources)

---

## What is a Demo Database?

Demo databases are fully functional Geotab environments with simulated fleet data. When you [create a free demo account](https://my.geotab.com/registration.html) (click **"Create a Demo Database"**, not "I'm a New Customer"), you configure:

| Option | Choices |
|--------|---------|
| **Vocation** | Daytime tour, Hub and spoke, Long distance, Public works |
| **Location** | Canada, Australia, USA, UK, Italy, Netherlands *(data center region)* |
| **Vehicle Type** | Vans and Trucks, Passenger, Electric Vehicle (EV) |
| **Fleet Size** | 10, 20, 30, 40, or 50 vehicles |
| **Expiration** | 1-7 days, 30 days, or 60 days |

> **Tip:** Choose **60 days** expiration for maximum development time.

> **Important:** After registering, **check your email and click the verification link** before trying to log in. You'll get an "Invalid user name or password" error if you skip this step.

The demo simulates realistic vehicle movement, driver behavior, and telematics data for your selected configuration. The **Location** determines which data center hosts your database, while the simulated vehicle routes are based on the vocation and region.

**Vocation affects data patterns:**
- **Long distance** - Longer trips, more highway driving, fewer stops
- **Daytime tour** - Shorter trips, more stops, urban driving patterns
- **Hub and spoke** - Trips radiating from central location(s)
- **Public works** - Municipal/utility vehicle patterns

> **Note:** The sample data below comes from a European-hosted demo database (50 vehicles, Vans and Trucks, with simulated routes in Spain). **Entity schemas and field names are consistent across all demo databases.** Specific values like IDs, coordinates, and counts will vary - the samples below show the structure and type of data you'll find.

---

## Sample Data Profiles

This guide documents multiple verified demo database profiles:

| Profile | Data Center | Vehicle Type | Vocation | Simulated Routes | Fault Data? | Status |
|---------|-------------|--------------|----------|------------------|-------------|--------|
| European Long Distance | Italy/Netherlands | Vans and Trucks | Long distance | Spain/Portugal | Yes — GoDevice faults | Documented below |
| USA Daytime | USA | Passenger | Daytime tour | Las Vegas, Nevada | None | Tested, schema documented below |
| EV Fleet | USA or UK | Electric Vehicle (EV) | Hub and spoke | TBD | Unknown | TODO |

### What Data Each Profile Has (Tested Feb 2026)

> **TODO:** We've only tested two profiles so far. Other location/vocation/fleet type combinations likely produce different data. Help us fill in the gaps — if you test a new combination, update this table.

The demo you create determines what data you can work with. This matters especially for **fault data** and **exception event variety**:

| | USA Daytime (Passenger, Las Vegas) | European Long Distance (Vans & Trucks, Spain/Portugal) |
|---|---|---|
| **Fleet description** | Light-duty passenger car fleet in Las Vegas, Nevada | Heavy-duty commercial fleet across the Iberian Peninsula |
| **VehicleKpi_Daily/Monthly** | Yes | Yes |
| **Exception events** | 50K — 3 rules firing (speeding, cornering, jackrabbit starts) | 28.5K — 6 rules firing (includes harsh braking and custom rules) |
| **FaultMonitoring (OData)** | None | 10 persistent GoDevice fault cycles |
| **FaultMonitoring_Daily (OData)** | None | 281 daily records |
| **FaultData (API)** | None | 6,962 raw fault events |
| **Fault types** | No DTCs at all | GoDevice faults only (GPS antenna unplugged, engine hours stale) — no engine DTCs |

**Choosing a demo database:**
- **For safety/driving behavior dashboards:** Any demo works — exception events are always available
- **For fault monitoring workflows:** Choose a European/Long Distance/Vans & Trucks configuration — or try other combinations and let us know what you find
- **For engine DTCs (OBD-II/J1939):** No tested demo produces these yet — you'll need a real fleet database or ask Geotab for a specialized demo

See [FAULT_MONITORING.md](./FAULT_MONITORING.md) for the full test results and details on the difference between fault codes and exception events.

---

## Data Volume: European Long Distance Fleet (7-Day Window)

| Entity | Typical Count | Notes |
|--------|---------------|-------|
| Device | 50 | Vehicles/assets in the fleet |
| User | 60+ | Includes drivers and administrators |
| Group | 30+ | Organizational hierarchy |
| Rule | 12 | Safety and compliance rules |
| Trip | 1,000+ | Completed journeys |
| ExceptionEvent | 1,000+ | Rule violations (speeding, harsh braking, etc.) |
| FaultData | 0–7,000 | **Varies by database** — some demos have GoDevice faults (GPS antenna, engine hours), others have none. No engine DTCs in any tested demo. See [FAULT_MONITORING.md](./FAULT_MONITORING.md) TODO |
| DriverChange | 1,000+ | Driver identification events |
| LogRecord | 100,000+ | GPS breadcrumbs |
| StatusData | 100,000+ | Sensor readings |

---

## Entity Schemas

### 1. Device (Vehicle/Asset)

The complete vehicle record with telematics configuration.

**Key Fields for Most Applications:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"b20"` |
| `name` | string | Display name | `"Demo - 32"` |
| `serialNumber` | string | GO device serial | `"G90000000032"` |
| `deviceType` | string | Hardware model | `"GO9"` |
| `licensePlate` | string | Vehicle plate | `"DEMO32"` |
| `vehicleIdentificationNumber` | string | VIN | `"WMAR62ZZ3LT034488"` |
| `groups` | array | Group memberships | `[{"id": "b27AB"}]` |
| `activeFrom` | datetime | Device activation | `"2025-12-29T15:57:02.320Z"` |
| `activeTo` | datetime | Device expiration | `"2050-01-01T00:00:00.000Z"` |

**Configuration Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `devicePlans` | array | Billing plans | `["ProPlus"]` |
| `idleMinutes` | int | Idle threshold | `3` |
| `speedingOn` | int | Speed warning on (km/h) | `100` |
| `speedingOff` | int | Speed warning off (km/h) | `90` |
| `accelerationWarningThreshold` | int | Harsh accel threshold | `22` |
| `brakingWarningThreshold` | int | Harsh brake threshold | `-34` |
| `corneringWarningThreshold` | int | Harsh corner threshold | `26` |
| `odometerOffset` | int | Odometer calibration | `0` |
| `engineHourOffset` | int | Engine hours calibration | `0` |

**Complete Sample Record:**

```json
{
  "id": "b20",
  "name": "Demo - 32",
  "serialNumber": "G90000000032",
  "deviceType": "GO9",
  "licensePlate": "DEMO32",
  "vehicleIdentificationNumber": "WMAR62ZZ3LT034488",
  "engineVehicleIdentificationNumber": "WMAR62ZZ3LT034488",
  "groups": [{"id": "b27AB"}],
  "activeFrom": "2025-12-29T15:57:02.320Z",
  "activeTo": "2050-01-01T00:00:00.000Z",
  "devicePlans": ["ProPlus"],
  "devicePlanBillingInfo": [{"billingLevel": 10, "devicePlanName": "ProPlus"}],
  "deviceFlags": {
    "activeFeatures": ["GoActive"],
    "isActiveTrackingAllowed": true,
    "isContinuousConnectAllowed": true,
    "isEngineAllowed": true,
    "isHOSAllowed": true,
    "isTripDetailAllowed": true,
    "isVINAllowed": true
  },
  "idleMinutes": 3,
  "speedingOn": 100,
  "speedingOff": 90,
  "accelerationWarningThreshold": 22,
  "brakingWarningThreshold": -34,
  "corneringWarningThreshold": 26,
  "minAccidentSpeed": 4,
  "maxSecondsBetweenLogs": 200,
  "isActiveTrackingEnabled": true,
  "isContinuousConnectEnabled": true,
  "workTime": "WorkTimeStandardHoursId",
  "timeZoneId": "Etc/UTC"
}
```

---

### 2. Trip

A completed journey from ignition on to ignition off.

**Key Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"b3440B9"` |
| `device` | object | Vehicle reference | `{"id": "b2D"}` |
| `driver` | object | Driver reference | `{"id": "b2D", "isDriver": true}` |
| `start` | datetime | Trip start time | `"2026-01-21T05:18:21.088Z"` |
| `stop` | datetime | Trip end time | `"2026-01-21T06:46:02.088Z"` |
| `distance` | float | Distance in meters | `113276.75` |
| `drivingDuration` | timespan | Time driving | `"01:27:41"` |
| `idlingDuration` | timespan | Time idling | `"00:07:05"` |
| `averageSpeed` | float | Average speed km/h | `77.51` |
| `maximumSpeed` | float | Max speed km/h | `107` |

**Location Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `stopPoint` | object | End location | `{"x": -0.557, "y": 38.997}` |
| `nextTripStart` | datetime | Next trip time | `"2026-01-21T06:53:07.088Z"` |
| `stopDuration` | timespan | Stop duration | `"00:07:05"` |

**After-Hours Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `afterHoursDistance` | float | Distance after hours | `113276.75` |
| `afterHoursDrivingDuration` | timespan | Driving after hours | `"01:27:41"` |
| `afterHoursStart` | bool | Started after hours | `true` |
| `afterHoursEnd` | bool | Ended after hours | `true` |

**Complete Sample Record:**

```json
{
  "id": "b3440B9",
  "device": {"id": "b2D"},
  "driver": {"id": "b2D", "isDriver": true},
  "start": "2026-01-21T05:18:21.088Z",
  "stop": "2026-01-21T06:46:02.088Z",
  "distance": 113276.75,
  "drivingDuration": "01:27:41",
  "idlingDuration": "00:07:05",
  "stopDuration": "00:07:05",
  "averageSpeed": 77.51,
  "maximumSpeed": 107,
  "stopPoint": {"x": -0.5577985, "y": 38.9977875},
  "nextTripStart": "2026-01-21T06:53:07.088Z",
  "afterHoursDistance": 113276.75,
  "afterHoursDrivingDuration": "01:27:41",
  "afterHoursStart": true,
  "afterHoursEnd": true,
  "workDistance": 0,
  "workDrivingDuration": "00:00:00",
  "engineHours": 16879647.575,
  "isSeatBeltOff": false
}
```

---

### 3. LogRecord (GPS Point)

GPS breadcrumb with timestamp, location, and speed.

**All Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"b72C673"` |
| `device` | object | Vehicle reference | `{"id": "b28"}` |
| `dateTime` | datetime | Timestamp | `"2026-01-27T10:59:54.269Z"` |
| `latitude` | float | Latitude | `42.2348557` |
| `longitude` | float | Longitude | `-8.71324158` |
| `speed` | float | Speed km/h | `1` |

**Sample Record:**

```json
{
  "id": "b72C673",
  "device": {"id": "b28"},
  "dateTime": "2026-01-27T10:59:54.269Z",
  "latitude": 42.2348557,
  "longitude": -8.71324158,
  "speed": 1
}
```

---

### 4. StatusData (Sensor Reading)

Engine and sensor telemetry readings.

**All Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"b21568D6"` |
| `device` | object | Vehicle reference | `{"id": "b2A"}` |
| `diagnostic` | object | Diagnostic type | `{"id": "DiagnosticOdometerId"}` |
| `dateTime` | datetime | Reading timestamp | `"2026-01-27T06:46:00.251Z"` |
| `data` | float | Reading value | `99620700` |
| `controller` | string | ECU source | `"ControllerNoneId"` |

**Diagnostics Available (Tested in USA Daytime Demo):**

| Diagnostic ID | Name | Unit | Sample Values |
|--------------|------|------|---------------|
| `DiagnosticEngineRoadSpeedId` | Engine Road Speed (ECM) | km/h | 0, 3, 6, 23, 24 |
| `DiagnosticEngineSpeedId` | Engine RPM | RPM | 618, 648, 697, 1614, 1841 |
| `DiagnosticOdometerId` | Odometer | meters | ~135,567,000 |
| `DiagnosticDeviceTotalFuelId` | Total Fuel Used | liters | 295–734 |
| `DiagnosticDeviceTotalIdleFuelId` | Idle Fuel Used | liters | 53–54 |
| `DiagnosticEngineCoolantTemperatureId` | Coolant Temp | °C | 29–69 |
| `DiagnosticIgnitionId` | Ignition On/Off | boolean | 0 or 1 |
| `DiagnosticPositionValidId` | GPS Fix Valid | boolean | 0 or 1 |
| `DiagnosticGpsLogReasonId` | GPS Log Metadata | - | 0 |
| `DiagnosticAux1Id` through `DiagnosticAux8Id` | Auxiliary Inputs | boolean | 0 |

**Diagnostics NOT Available (Tested in USA Daytime Demo):**

> **Note:** Availability may vary by demo database type. EV Fleet demos may have different diagnostics (e.g., `DiagnosticStateOfChargeId`).

| Diagnostic ID | Name | Notes |
|--------------|------|-------|
| `DiagnosticSpeedId` | GPS Vehicle Speed | Returns 0 results |
| `DiagnosticPostedRoadSpeedId` | Posted Road Speed Limit | Returns 0 results |
| `DiagnosticAccelerometerForwardBrakingId` | Harsh Braking G-force | Returns 0 results |
| `DiagnosticSeatBeltId` | Seatbelt Status | Returns 0 results |
| `DiagnosticStateOfChargeId` | EV Battery % | Returns 0 results (may be available in EV demos) |

**Important for Speed Data:**

For speeding dashboards in demo databases:
- Use `DiagnosticEngineRoadSpeedId` (ECM-reported speed) instead of `DiagnosticSpeedId` (GPS speed)
- `DiagnosticPostedRoadSpeedId` (posted speed limit) is not available
- See [SPEED_DATA.md](/skills/geotab/references/SPEED_DATA.md) for detection patterns and fallbacks

**Sample Record:**

```json
{
  "id": "b21568D6",
  "device": {"id": "b2A"},
  "diagnostic": {"id": "DiagnosticOdometerId"},
  "dateTime": "2026-01-27T06:46:00.251Z",
  "data": 99620700,
  "controller": "ControllerNoneId",
  "version": "00000000021568d6"
}
```

---

### 5. DeviceStatusInfo (Current State)

Real-time vehicle status snapshot.

**Key Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `device` | object | Vehicle reference | `{"id": "b15"}` |
| `dateTime` | datetime | Status timestamp | `"2026-01-28T06:45:56.584Z"` |
| `latitude` | float | Current latitude | `39.4767609` |
| `longitude` | float | Current longitude | `-2.05665278` |
| `speed` | float | Current speed km/h | `88` |
| `bearing` | int | Heading degrees | `79` |
| `isDriving` | bool | Currently moving | `true` |
| `isDeviceCommunicating` | bool | Device online | `true` |
| `driver` | string | Current driver | `"UnknownDriverId"` |
| `currentStateDuration` | timespan | Time in state | `"02:09:09"` |
| `groups` | array | Vehicle groups | `[{"id": "b27AD"}]` |
| `exceptionEvents` | array | Active exceptions | See below |

**Sample Record:**

```json
{
  "device": {"id": "b15"},
  "dateTime": "2026-01-28T06:45:56.584Z",
  "latitude": 39.4767609,
  "longitude": -2.05665278,
  "speed": 88,
  "bearing": 79,
  "isDriving": true,
  "isDeviceCommunicating": true,
  "driver": "UnknownDriverId",
  "currentStateDuration": "02:09:09",
  "isHistoricLastDriver": false,
  "groups": [{"id": "b27AD"}],
  "exceptionEvents": [{
    "id": "a49yehLtoP0CfXDzUV_3VKQ",
    "rule": {"id": "aVvwIBkjCTk-5tv6s384rUw"},
    "state": "ExceptionEventStateValidId",
    "activeFrom": "2025-12-08T15:57:00.740Z",
    "activeTo": "2026-01-28T06:45:56.584Z"
  }]
}
```

---

### 6. ExceptionEvent (Rule Violation)

Safety rule violation record.

**All Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"aGmtDeB0Ln0abGOKIBAkq2g"` |
| `device` | object | Vehicle reference | `{"id": "b1A"}` |
| `driver` | object | Driver reference | `{"id": "b3A"}` |
| `rule` | object | Rule that was violated | `{"id": "RuleHarshCorneringId"}` |
| `activeFrom` | datetime | Violation start | `"2026-01-24T00:07:02.421Z"` |
| `activeTo` | datetime | Violation end | `"2026-01-24T00:07:02.721Z"` |
| `duration` | timespan | Violation duration | `"00:00:00.3000000"` |
| `distance` | float | Distance during event | `0.001300758` |
| `diagnostic` | string | Associated diagnostic | `"NoDiagnosticId"` |
| `state` | string | Event state | `"ExceptionEventStateValidId"` |
| `details` | object | Speed details (speeding rules only) | See below |

**The `details` Object (Speeding Events Only):**

For speeding rule exceptions (e.g., `RulePostedSpeedingId`), the `details` object may contain:

| Field | Type | Description |
|-------|------|-------------|
| `maxSpeed` | float | Maximum speed during violation (km/h) |
| `speedLimit` | float | Posted speed limit at location (km/h) |

**Demo Database Behavior (Tested in USA Daytime Demo):**

ExceptionEvents in this demo database have these characteristics:
- Speeding events exist for `RulePostedSpeedingId`
- Have `NoDiagnosticId` (not linked to a specific diagnostic)
- **Have no `details` object** (no `maxSpeed`/`speedLimit` pre-calculated)
- All show `UnknownDriverId`
- Synthetic-looking (identical durations)

This means speeding dashboards that rely on `ex.details.maxSpeed` will show 0 or crash in demo databases.

**Always use defensive coding:** `(ex.details && ex.details.maxSpeed) || 0`

See [SPEED_DATA.md](/skills/geotab/references/SPEED_DATA.md) for demo database detection and fallback patterns.

**Sample Record:**

```json
{
  "id": "aGmtDeB0Ln0abGOKIBAkq2g",
  "device": {"id": "b1A"},
  "driver": {"id": "b3A"},
  "rule": {
    "id": "RuleHarshCorneringId",
    "reason": "ExceptionRuleReasonNoneId",
    "state": "ExceptionRuleStateActiveId"
  },
  "activeFrom": "2026-01-24T00:07:02.421Z",
  "activeTo": "2026-01-24T00:07:02.721Z",
  "duration": "00:00:00.3000000",
  "distance": 0.001300758,
  "diagnostic": "NoDiagnosticId",
  "state": "ExceptionEventStateValidId",
  "createdDateTime": "2026-01-24T00:07:15.176Z",
  "lastModifiedDateTime": "2026-01-24T00:07:15.181Z"
}
```

---

### 7. Rule (Exception Rule)

Rule definitions that trigger exception events.

**Key Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Rule identifier | `"RuleHarshBrakingId"` |
| `name` | string | Display name | `"Harsh Braking"` |
| `baseType` | string | Rule category | `"Stock"` |
| `color` | object | Display color | `{"r": 255, "g": 0, "b": 0, "a": 255}` |
| `groups` | array | Applied to groups | `[{"id": "GroupCompanyId"}]` |
| `condition` | object | Rule logic tree | See below |
| `state` | string | Active/Inactive | `"ExceptionRuleStateActiveId"` |

**Common Stock Rules (consistent across databases):**

| Rule ID | Name |
|---------|------|
| `RuleSeatbeltId` | Seat belt |
| `RuleHarshCorneringId` | Harsh Cornering |
| `RulePostedSpeedingId` | Speeding |
| `RuleEnhancedMajorCollisionId` | Major Collision |
| `RuleJackrabbitStartsId` | Hard Acceleration |
| `RuleEnhancedMinorCollisionId` | Minor Collision |
| `RuleAccidentId` | Possible Collision (Legacy) |
| `RuleHarshBrakingId` | Harsh Braking |
| `RuleEngineLightOnId` | Engine Light On |
| `RuleApplicationExceptionId` | Application Exception |

> **Note:** Rules with IDs starting with `Rule...Id` are stock rules available in all databases. Custom rules (like `aVvwIBkjCTk-5tv6s384rUw` for "Max Speed") have generated IDs unique to each database. Query `Rule` entities to discover available rules in your database.

---

### 8. FaultData (Diagnostic Trouble Code)

Engine fault codes from the vehicle ECU.

**All Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"b12AE"` |
| `device` | object | Vehicle reference | `{"id": "b6"}` |
| `diagnostic` | object | Fault type | `{"id": "DiagnosticDeviceHasBeenUnpluggedId"}` |
| `dateTime` | datetime | Fault timestamp | `"2026-01-21T06:58:41.736Z"` |
| `faultState` | string | Current state | `"Active"` |
| `controller` | object | ECU source | `{"id": "ControllerGoDeviceId"}` |
| `failureMode` | string | Failure type | `"NoFailureModeId"` |
| `count` | int | Occurrence count | `1` |
| `malfunctionLamp` | bool | MIL status | `false` |
| `amberWarningLamp` | bool | Amber lamp | `false` |
| `redStopLamp` | bool | Red lamp | `false` |
| `protectWarningLamp` | bool | Protect lamp | `false` |

**Sample Record:**

```json
{
  "id": "b12AE",
  "device": {"id": "b6"},
  "diagnostic": {"id": "DiagnosticDeviceHasBeenUnpluggedId"},
  "dateTime": "2026-01-21T06:58:41.736Z",
  "faultState": "Active",
  "faultStates": {"effectiveStatus": "FaultStatusActiveId"},
  "controller": {"id": "ControllerGoDeviceId"},
  "failureMode": "NoFailureModeId",
  "count": 1,
  "malfunctionLamp": false,
  "amberWarningLamp": false,
  "redStopLamp": false,
  "protectWarningLamp": false
}
```

---

### 9. User (User/Driver)

User profile with driver information.

**Key Fields for Most Applications:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"b12"` |
| `name` | string | Username | `"#EUR00000010301000_12-29-2025"` |
| `firstName` | string | First name | `""` |
| `lastName` | string | Last name | `""` |
| `isDriver` | bool | Is a driver | `true` |
| `companyGroups` | array | Company groups | `[{"id": "GroupCompanyId"}]` |
| `driverGroups` | array | Driver groups | `[{"id": "GroupCompanyId"}]` |
| `securityGroups` | array | Security roles | `[{"id": "GroupNothingSecurityId"}]` |
| `employeeNo` | string | Employee number | `""` |
| `licenseNumber` | string | License number | `""` |

**Driver Key Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `keys` | array | Driver identification keys | See below |
| `hosRuleSet` | string | HOS ruleset | `"None"` |

**Preferences:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `isMetric` | bool | Use metric units | `true` |
| `fuelEconomyUnit` | string | Fuel economy unit | `"LitersPer100Km"` |
| `dateFormat` | string | Date format | `"MM/dd/yy HH:mm:ss"` |
| `timeZoneId` | string | Time zone | `"America/New_York"` |
| `language` | string | Language | `"en"` |

**Sample Record:**

```json
{
  "id": "b12",
  "name": "#EUR00000010301000_12-29-2025_16-06-30.483",
  "firstName": "",
  "lastName": "",
  "isDriver": true,
  "companyGroups": [{"id": "GroupCompanyId"}],
  "driverGroups": [{"id": "GroupCompanyId"}],
  "securityGroups": [{"id": "GroupNothingSecurityId", "name": "**NothingSecurity**"}],
  "keys": [{
    "id": "aLQ7ZDPABw0qXmU2Tyrruog",
    "driverKeyType": "Tachograph",
    "serialNumber": "EUR00000010301000"
  }],
  "isMetric": true,
  "fuelEconomyUnit": "LitersPer100Km",
  "dateFormat": "MM/dd/yy HH:mm:ss",
  "timeZoneId": "America/New_York",
  "language": "en",
  "defaultPage": "map",
  "activeFrom": "2025-12-29T16:06:30.483Z",
  "activeTo": "2050-01-01T00:00:00.000Z"
}
```

---

### 10. Group

Organizational hierarchy node.

**All Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"GroupCompanyId"` |
| `name` | string | Group name | `"Company Group"` |
| `children` | array | Child groups | `[{"id": "GroupAssetInformationId"}]` |
| `color` | object | Display color | `{"r": 0, "g": 0, "b": 0, "a": 255}` |
| `comments` | string | Description | `""` |
| `reference` | string | External reference | `""` |
| `isGlobalReportingGroup` | bool | Global reporting | `false` |

**Sample Record:**

```json
{
  "id": "GroupCompanyId",
  "name": "Company Group",
  "children": [{"id": "GroupAssetInformationId"}],
  "color": {"r": 0, "g": 0, "b": 0, "a": 255},
  "comments": "",
  "reference": "",
  "isGlobalReportingGroup": false
}
```

---

### 11. DriverChange

Driver identification event when a driver logs into a vehicle.

**All Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"a-TrXZlA5KUSeASivVfmw0A"` |
| `device` | object | Vehicle reference | `{"id": "b1"}` |
| `driver` | string | Driver ID | `"UnknownDriverId"` |
| `dateTime` | datetime | Change timestamp | `"2026-01-21T13:13:00.742Z"` |
| `type` | string | Identification method | `"DriverKey"` |

**Sample Record:**

```json
{
  "id": "a-TrXZlA5KUSeASivVfmw0A",
  "device": {"id": "b1"},
  "driver": "UnknownDriverId",
  "dateTime": "2026-01-21T13:13:00.742Z",
  "type": "DriverKey",
  "version": "0000000000001d42"
}
```

---

### 12. Audit

System audit log entry.

**All Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"a-V_OIne280OFXIKLhNG7Fg"` |
| `name` | string | Audit event type | `"UserLogin"` |
| `userName` | string | User who triggered | `"user@example.com"` |
| `comment` | string | Additional info | `"user@example.com"` |
| `dateTime` | datetime | Event timestamp | `"2026-01-28T06:38:22.893Z"` |

**Sample Record:**

```json
{
  "id": "a-V_OIne280OFXIKLhNG7Fg",
  "name": "UserLogin",
  "userName": "user@example.com",
  "comment": "user@example.com",
  "dateTime": "2026-01-28T06:38:22.893Z",
  "version": "00000000000001c6"
}
```

---

### 13. Diagnostic

Diagnostic type definition (metadata about sensor readings).

**Key Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Diagnostic identifier | `"DiagnosticOdometerId"` |
| `name` | string | Display name | `"Odometer"` |
| `code` | int | Diagnostic code | `5` |
| `unitOfMeasure` | string | Unit ID | `"UnitOfMeasureMetersId"` |
| `diagnosticType` | string | Category | `"GoDiagnostic"` |
| `source` | string | Data source | `"SourceGeotabGoId"` |
| `conversion` | float | Raw to unit conversion | `100` |
| `offset` | float | Value offset | `0` |
| `dataLength` | int | Bytes in raw data | `4` |

**Common Diagnostics:**

```json
// Odometer
{
  "id": "DiagnosticOdometerId",
  "name": "Odometer",
  "code": 5,
  "unitOfMeasure": "UnitOfMeasureMetersId",
  "diagnosticType": "GoDiagnostic",
  "source": "SourceGeotabGoId",
  "conversion": 100,
  "dataLength": 4
}

// Engine Speed
{
  "id": "DiagnosticEngineSpeedId",
  "name": "Engine speed",
  "code": 107,
  "unitOfMeasure": "UnitOfMeasureRevolutionsPerMinuteId",
  "diagnosticType": "GoDiagnostic",
  "source": "SourceGeotabGoId",
  "conversion": 0.25,
  "dataLength": 2
}

// Fuel Level
{
  "id": "DiagnosticFuelLevelId",
  "name": "Fuel level (percentage)",
  "code": 98,
  "unitOfMeasure": "UnitOfMeasurePercentageId",
  "diagnosticType": "GoDiagnostic",
  "source": "SourceGeotabGoId",
  "conversion": 0.3921,
  "dataLength": 1
}

// Acceleration
{
  "id": "DiagnosticAccelerationForwardBrakingId",
  "name": "Acceleration forward or braking",
  "code": 1,
  "unitOfMeasure": "UnitOfMeasureMetersPerSecondSquaredId",
  "diagnosticType": "DataDiagnostic",
  "source": "SourceSystemId",
  "conversion": 1,
  "dataLength": 4
}
```

---

## Fetching Demo Data

### Python Examples

```python
import mygeotab
from datetime import datetime, timedelta

api = mygeotab.API(username, password, database, server)
api.authenticate()

# Get all devices
devices = api.get('Device')

# Get trips (last 7 days)
trips = api.get('Trip',
    fromDate=datetime.now() - timedelta(days=7),
    toDate=datetime.now()
)

# Get current vehicle statuses
statuses = api.get('DeviceStatusInfo')

# Get exception events (safety violations)
exceptions = api.get('ExceptionEvent',
    fromDate=datetime.now() - timedelta(days=7),
    toDate=datetime.now()
)

# Get sensor data for a specific diagnostic
status_data = api.get('StatusData',
    search={
        'diagnosticSearch': {'id': 'DiagnosticFuelLevelId'},
        'fromDate': datetime.now() - timedelta(days=1),
        'toDate': datetime.now()
    }
)

# Get drivers (users with isDriver=True)
drivers = api.get('User', search={'isDriver': True})
```

### Important Notes

1. **Always use date ranges** - Querying without date filters can return millions of records
2. **Use `User` not `Driver`** - The `Driver` type causes errors in demo databases; filter `User` by `isDriver: True`
3. **Coordinate format** - Locations use `x` for longitude and `y` for latitude
4. **Time format** - All timestamps are ISO 8601 in UTC
5. **Distances** - All distances are in meters
6. **Speeds** - All speeds are in km/h

---

## Resources

- [Create a Demo Account](https://my.geotab.com/registration.html)
- [Geotab SDK Documentation](https://geotab.github.io/sdk/)
- [API Reference](https://geotab.github.io/sdk/software/api/reference/)
- [geotab skill](../skills/geotab/SKILL.md)
