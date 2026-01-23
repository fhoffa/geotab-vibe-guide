/**
 * Simple Geotab Add-In Dashboard
 * Demonstrates the basic Add-In lifecycle and API usage
 */

// Global reference to the MyGeotab API
let geotabApi = null;

/**
 * LIFECYCLE METHOD 1: initialize
 * Called once when the Add-In first loads
 * Must call callback() when done!
 */
function initialize(api, state, callback) {
    console.log("Add-In initializing...");

    // Store the API reference globally
    geotabApi = api;

    // Fetch initial data
    loadDashboard();

    // IMPORTANT: Signal that initialization is complete
    callback();
}

/**
 * LIFECYCLE METHOD 2: focus
 * Called when the user navigates to this Add-In
 */
function focus(api, state) {
    console.log("Add-In is now active");

    // Refresh data when user comes back to this page
    loadDashboard();
}

/**
 * LIFECYCLE METHOD 3: blur
 * Called when user navigates away from this Add-In
 */
function blur(api, state) {
    console.log("User is leaving Add-In");

    // Clean up or save state here if needed
}

/**
 * Main function to load all dashboard data
 */
function loadDashboard() {
    if (!geotabApi) {
        showError("API not initialized");
        return;
    }

    updateTimestamp();
    loadUserInfo();
    loadVehicles();
}

/**
 * Load and display current user information
 */
function loadUserInfo() {
    geotabApi.getSession(function(credentials, server) {
        const userInfo = document.getElementById("user-info");
        userInfo.textContent = `Welcome, ${credentials.userName} | Database: ${credentials.database}`;
    });
}

/**
 * Load and display vehicle data
 */
function loadVehicles() {
    geotabApi.call("Get", {
        typeName: "Device"
    }, function(devices) {
        console.log(`Loaded ${devices.length} vehicles`);

        // Update vehicle count
        document.getElementById("vehicle-count").textContent = devices.length;

        // Display vehicle list (first 10)
        displayVehicles(devices.slice(0, 10));

        // Load additional stats
        loadTripStats();
        loadActiveVehicles();
    }, function(error) {
        showError("Failed to load vehicles: " + error);
    });
}

/**
 * Display vehicles in the UI
 */
function displayVehicles(devices) {
    const container = document.getElementById("vehicles-container");

    if (devices.length === 0) {
        container.innerHTML = '<p class="loading">No vehicles found</p>';
        return;
    }

    container.innerHTML = devices.map(device => `
        <div class="vehicle-item" onclick="viewVehicleDetails('${device.id}')">
            <div class="vehicle-name">${device.name || 'Unknown Vehicle'}</div>
            <div class="vehicle-serial">Serial: ${device.serialNumber || 'N/A'}</div>
        </div>
    `).join('');
}

/**
 * Load trip statistics for the current week
 */
function loadTripStats() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    geotabApi.call("Get", {
        typeName: "Trip",
        search: {
            fromDate: oneWeekAgo.toISOString()
        }
    }, function(trips) {
        document.getElementById("trip-count").textContent = trips.length;
    }, function(error) {
        console.error("Failed to load trips:", error);
        document.getElementById("trip-count").textContent = "--";
    });
}

/**
 * Load count of active vehicles today
 */
function loadActiveVehicles() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    geotabApi.call("Get", {
        typeName: "LogRecord",
        search: {
            fromDate: today.toISOString()
        }
    }, function(logs) {
        // Count unique devices
        const uniqueDevices = new Set(logs.map(log => log.device.id));
        document.getElementById("active-count").textContent = uniqueDevices.size;
    }, function(error) {
        console.error("Failed to load active vehicles:", error);
        document.getElementById("active-count").textContent = "--";
    });
}

/**
 * Navigate to vehicle details page in MyGeotab
 */
function viewVehicleDetails(deviceId) {
    // Use MyGeotab's built-in navigation
    // This will navigate within MyGeotab to the vehicle's detail page
    window.location.hash = `#device,details,deviceId:${deviceId}`;
}

/**
 * Update the timestamp
 */
function updateTimestamp() {
    const now = new Date();
    document.getElementById("last-update").textContent = now.toLocaleTimeString();
}

/**
 * Display error message
 */
function showError(message) {
    console.error(message);

    const container = document.getElementById("vehicles-container");
    container.innerHTML = `<div class="error">⚠️ ${message}</div>`;
}

/**
 * Auto-refresh every 60 seconds
 */
setInterval(function() {
    if (geotabApi) {
        console.log("Auto-refreshing dashboard...");
        loadDashboard();
    }
}, 60000);
