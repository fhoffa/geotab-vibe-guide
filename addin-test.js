// Geotab Add-In - Testing multiple name patterns
console.log('addin-test.js v11.0 loading...');

// Create the addin object structure
var addinImpl = function() {
    let output = '';

    function log(msg) {
        output += msg + '\n';
        console.log(msg);
        try {
            document.getElementById('output').textContent = output;
        } catch(e) {
            // Ignore
        }
    }

    log('v11.0 - Trying multiple name patterns...');

    return {
        initialize: function(api, state, callback) {
            log('🎉🎉🎉 initialize() CALLED!!!');
            log('API: ' + (api ? 'EXISTS' : 'NULL'));

            if (api) {
                log('API type: ' + typeof api);

                api.getSession(function(cred) {
                    log('✅ SUCCESS! User: ' + cred.userName);
                    log('✅ Database: ' + cred.database);
                }, function(err) {
                    log('❌ Session error: ' + err);
                });

                api.call('Get', {
                    typeName: 'Device'
                }, function(devices) {
                    log('✅ Loaded ' + devices.length + ' vehicles!');
                }, function(err) {
                    log('❌ Device error: ' + err);
                });
            }

            callback();
        },

        focus: function(api, state) {
            log('FOCUS called, API: ' + (api ? 'YES' : 'NO'));
        },

        blur: function(api, state) {
            log('BLUR called');
        }
    };
};

// Register under MULTIPLE possible names
geotab.addin.apitest = addinImpl();
geotab.addin['api-test'] = addinImpl();
geotab.addin.addintest = addinImpl();
geotab.addin['addin-test'] = addinImpl();

console.log('v11.0 - Registered as: apitest, api-test, addintest, addin-test');
console.log('Available addins:', Object.keys(geotab.addin));
