// External JavaScript file for Add-In
// Lifecycle methods defined here

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

log('addin-test.js loaded');

// LIFECYCLE METHOD 1: initialize
function initialize(api, state, callback) {
    log('✅✅✅ initialize() CALLED FROM EXTERNAL JS!');
    log('API: ' + (api ? 'EXISTS' : 'NULL'));

    if (api) {
        log('API type: ' + typeof api);
        log('API.getSession: ' + (typeof api.getSession));

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
}

// LIFECYCLE METHOD 2: focus
function focus(api, state) {
    log('FOCUS called, API: ' + (api ? 'YES' : 'NO'));
}

// LIFECYCLE METHOD 3: blur
function blur(api, state) {
    log('BLUR called');
}

log('Lifecycle methods registered in external JS');
