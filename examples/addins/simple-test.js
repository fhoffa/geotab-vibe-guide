"use strict";

geotab.addin["simple-test"] = function() {
    console.log("Simple test Add-In loading...");

    return {
        initialize: function(api, state, callback) {
            console.log("✅ Initialize called!");

            var statusEl = document.getElementById("status");
            var infoEl = document.getElementById("info");

            statusEl.className = "success";
            statusEl.textContent = "✅ Connected to MyGeotab!";

            // Get user info
            api.getSession(function(session) {
                var html = '<div class="info">';
                html += '<strong>User:</strong> ' + session.userName + '<br>';
                html += '<strong>Database:</strong> ' + session.database;
                html += '</div>';

                // Get vehicle count
                api.call("Get", {
                    typeName: "Device"
                }, function(vehicles) {
                    html += '<div class="info">';
                    html += '<strong>Total Vehicles:</strong> ' + vehicles.length;
                    html += '</div>';

                    infoEl.innerHTML = html;
                    console.log("✅ Loaded " + vehicles.length + " vehicles");
                }, function(error) {
                    infoEl.innerHTML = '<div class="info" style="background:#fee;">Error loading vehicles: ' + error + '</div>';
                });

                infoEl.innerHTML = html;
            });

            callback();
        },

        focus: function(api, state) {
            console.log("✅ Focus called - page is now visible");
        },

        blur: function(api, state) {
            console.log("✅ Blur called - user navigating away");
        }
    };
};

console.log("Simple test Add-In registered");
