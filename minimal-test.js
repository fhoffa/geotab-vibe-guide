// Minimal test mimicking Heat Map structure
"use strict";

geotab.addin.minimaltesti = function() {
    console.log('minimaltesti Add-In loading...');

    return {
        initialize: function(api, state, callback) {
            console.log('🎉 minimaltesti initialize() called!');

            document.body.innerHTML = '<h1>SUCCESS!</h1><pre id="output"></pre>';
            var output = document.getElementById('output');

            output.textContent = 'Initialize called!\n';

            if (api) {
                api.getSession(function(cred) {
                    output.textContent += 'User: ' + cred.userName + '\n';
                    output.textContent += 'Database: ' + cred.database + '\n';
                });

                api.call('Get', { typeName: 'Device' }, function(devices) {
                    output.textContent += 'Vehicles: ' + devices.length + '\n';
                });
            }

            callback();
        },

        focus: function(api, state) {
            console.log('minimaltesti focus() called');
        }
    };
}();

console.log('minimaltesti registered');
