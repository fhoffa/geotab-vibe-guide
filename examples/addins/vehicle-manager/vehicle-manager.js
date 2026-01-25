"use strict";

geotab.addin["vehicle-manager"] = function() {
    var apiRef = null;
    var elUsername = document.getElementById("username");
    var elDatabase = document.getElementById("database-name");
    var elVehiclesCount = document.getElementById("vehicle-count");
    var elDriversCount = document.getElementById("driver-count");
    var elVehicleTableBody = document.getElementById("vehicle-table-body");

    function updateStats() {
        if (!apiRef) return;

        // Get session info
        apiRef.getSession(function(session) {
            elUsername.textContent = session.userName;
            elDatabase.textContent = session.database;
        });

        // Get all vehicles
        apiRef.call("Get", {
            typeName: "Device"
        }, function(devices) {
            if (devices) {
                elVehiclesCount.className = "card-value";
                elVehiclesCount.textContent = devices.length;
                renderVehicleList(devices);
            }
        }, function(err) {
            elVehiclesCount.className = "card-value error";
            elVehiclesCount.textContent = "Error";
            console.error("Vehicle error:", err);
        });

        // Get drivers (use User with isDriver filter, not Driver type!)
        apiRef.call("Get", {
            typeName: "User",
            search: { isDriver: true }
        }, function(drivers) {
            if (drivers) {
                elDriversCount.className = "card-value";
                elDriversCount.textContent = drivers.length;
            }
        }, function(err) {
            elDriversCount.className = "card-value error";
            elDriversCount.textContent = "Error";
            console.error("Driver error:", err);
        });
    }

    function renderVehicleList(devices) {
        elVehicleTableBody.innerHTML = "";

        devices.forEach(function(device) {
            var tr = document.createElement("tr");

            // Serial number column
            var tdSerial = document.createElement("td");
            tdSerial.textContent = device.serialNumber || "N/A";
            tr.appendChild(tdSerial);

            // Editable name column
            var tdName = document.createElement("td");
            var input = document.createElement("input");
            input.type = "text";
            input.className = "vehicle-name-input";
            input.value = device.name || "";
            input.id = "input-" + device.id;
            tdName.appendChild(input);
            tr.appendChild(tdName);

            // Save button column
            var tdAction = document.createElement("td");
            var btn = document.createElement("button");
            btn.textContent = "Save";
            btn.className = "save-btn";
            btn.onclick = function() {
                var newName = document.getElementById("input-" + device.id).value;
                saveVehicleName(device.id, newName, btn);
            };
            tdAction.appendChild(btn);
            tr.appendChild(tdAction);

            elVehicleTableBody.appendChild(tr);
        });
    }

    function saveVehicleName(deviceId, newName, btn) {
        if (!apiRef) return;

        btn.disabled = true;
        btn.textContent = "Saving...";

        apiRef.call("Set", {
            typeName: "Device",
            entity: {
                id: deviceId,
                name: newName
            }
        }, function() {
            btn.disabled = false;
            btn.textContent = "Saved!";
            setTimeout(function() { btn.textContent = "Save"; }, 2000);
        }, function(err) {
            btn.disabled = false;
            btn.textContent = "Retry";
            alert("Error updating vehicle name: " + (err.message || err));
        });
    }

    return {
        initialize: function(api, state, callback) {
            apiRef = api;
            updateStats();
            callback();
        },
        focus: function(api, state) {
            apiRef = api;
            updateStats();
        },
        blur: function(api, state) {
            // Cleanup if needed
        }
    };
};

console.log("Vehicle Manager Add-In registered");
