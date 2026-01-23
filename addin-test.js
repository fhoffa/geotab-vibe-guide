// External JavaScript file for Add-In
// Lifecycle methods must be GLOBALLY accessible

console.log('addin-test.js v8.0 loaded');

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

log('addin-test.js v8.0 loading...');

// CRITICAL: Make initialize GLOBALLY accessible
window.initialize = function(api, state, callback) {
    log('✅✅✅ initialize() CALLED FROM EXTERNAL JS v8.0!');
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
};

// Make focus and blur global too
window.focus = function(api, state) {
    log('FOCUS called, API: ' + (api ? 'YES' : 'NO'));
};

window.blur = function(api, state) {
    log('BLUR called');
};

log('v8.0 - Lifecycle methods attached to window object');
