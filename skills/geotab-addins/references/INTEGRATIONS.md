# External Integrations & Navigation

Add-Ins can integrate with external services using URL schemes and browser APIs, plus navigate within MyGeotab.

## MyGeotab Navigation

Navigate the parent MyGeotab window using `window.parent.location.hash`:

### Hash Patterns

| Page | Hash Format | Example |
|------|-------------|---------|
| Vehicle detail | `#device,id:{id}` | `#device,id:b3230` |
| Trip history | `#tripsHistory,devices:!({id})` | `#tripsHistory,devices:!(b12)` |
| Exceptions | `#exceptions2,assetsFilter:!({id})` | `#exceptions2,assetsFilter:!(b3306)` |
| Live map | `#map,liveVehicleIds:!({id})` | `#map,liveVehicleIds:!(b3230)` |
| Zone edit | `#zones,edit:{id}` | `#zones,edit:b2F` |

### Clickable Vehicle Link

```javascript
function createVehicleLink(device) {
    var link = document.createElement("a");
    link.textContent = device.name;
    link.href = "#";
    link.style.cssText = "color:#2563eb;cursor:pointer;";
    link.onclick = function(e) {
        e.preventDefault();
        window.parent.location.hash = "device,id:" + device.id;
    };
    return link;
}
```

### Multiple Action Links

```javascript
var actionsCell = document.createElement("td");

// Vehicle details
var vehicleLink = document.createElement("a");
vehicleLink.textContent = "Details";
vehicleLink.href = "#";
vehicleLink.onclick = function(e) {
    e.preventDefault();
    window.parent.location.hash = "device,id:" + device.id;
};
actionsCell.appendChild(vehicleLink);

actionsCell.appendChild(document.createTextNode(" | "));

// Trip history
var tripsLink = document.createElement("a");
tripsLink.textContent = "Trips";
tripsLink.href = "#";
tripsLink.onclick = function(e) {
    e.preventDefault();
    window.parent.location.hash = "tripsHistory,devices:!(" + device.id + ")";
};
actionsCell.appendChild(tripsLink);
```

**Key points:**
- Use `device.id` (internal ID like "b3230"), not `device.name`
- Array parameters use `!(id)` syntax
- Multiple IDs: `devices:!(b12,b13,b14)`
- Always call `e.preventDefault()` in click handlers

---

## Browser-Native Integrations

No API keys needed - just URL schemes and browser APIs.

### Email (mailto:)

```javascript
function createEmailLink(device, recipientEmail) {
    var link = document.createElement("a");
    var subject = encodeURIComponent("Issue with " + device.name);
    var body = encodeURIComponent(
        "Vehicle: " + device.name + "\n" +
        "Serial: " + device.serialNumber + "\n\n" +
        "Describe the issue:\n"
    );
    link.href = "mailto:" + recipientEmail + "?subject=" + subject + "&body=" + body;
    link.textContent = "Report Issue";
    return link;
}
```

### Google Calendar Event

```javascript
function createCalendarLink(device, date) {
    var title = encodeURIComponent("Maintenance: " + device.name);
    var details = encodeURIComponent("Vehicle: " + device.name + "\nSerial: " + device.serialNumber);
    var dateStr = date.toISOString().replace(/-|:|\.\d+/g, "").slice(0, 15) + "Z";
    return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
           "&text=" + title + "&details=" + details + "&dates=" + dateStr + "/" + dateStr;
}
```

### Google Maps

```javascript
function createMapsLink(latitude, longitude, label) {
    var link = document.createElement("a");
    link.href = "https://www.google.com/maps?q=" + latitude + "," + longitude;
    link.textContent = label || "Open in Maps";
    link.target = "_blank";
    return link;
}
```

### Phone Call (tel:)

```javascript
function createCallLink(phoneNumber, label) {
    var link = document.createElement("a");
    link.href = "tel:" + phoneNumber;
    link.textContent = label || "Call";
    return link;
}
```

### SMS (sms:)

```javascript
function createSmsLink(phoneNumber, message, label) {
    var link = document.createElement("a");
    link.href = "sms:" + phoneNumber + "?body=" + encodeURIComponent(message);
    link.textContent = label || "Text";
    return link;
}
```

### WhatsApp

```javascript
function createWhatsAppLink(phoneNumber, message, label) {
    var link = document.createElement("a");
    // Phone number without + or spaces
    link.href = "https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent(message);
    link.textContent = label || "WhatsApp";
    link.target = "_blank";
    return link;
}
```

### Copy to Clipboard

```javascript
function copyToClipboard(text, button) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);

    var originalText = button.textContent;
    button.textContent = "Copied!";
    setTimeout(function() { button.textContent = originalText; }, 2000);
}
```

### Download as CSV

```javascript
function downloadCSV(data, filename) {
    var csv = "Name,Serial Number,Type\n";
    data.forEach(function(d) {
        csv += '"' + (d.name || "") + '","' + (d.serialNumber || "") + '","' + (d.deviceType || "") + '"\n';
    });

    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename || "export.csv";
    link.click();
    URL.revokeObjectURL(url);
}
```

### Print

```javascript
var printBtn = document.createElement("button");
printBtn.textContent = "Print Report";
printBtn.onclick = function() { window.print(); };
```

### Text-to-Speech

```javascript
function speak(text) {
    if ("speechSynthesis" in window) {
        var utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
}
speak("You have " + devices.length + " vehicles.");
```

### Native Share (Mobile)

```javascript
function shareData(title, text) {
    if (navigator.share) {
        navigator.share({ title: title, text: text, url: window.location.href });
    } else {
        copyToClipboard(text);  // Fallback
    }
}
```

---

## External APIs (Free, No Key)

### Weather (Open-Meteo)

Free weather API - no registration or API key needed:

```javascript
function getWeather(latitude, longitude, callback) {
    var url = "https://api.open-meteo.com/v1/forecast" +
              "?latitude=" + latitude +
              "&longitude=" + longitude +
              "&current_weather=true";

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            callback(null, data.current_weather);
        } else {
            callback("Weather API error");
        }
    };
    xhr.onerror = function() { callback("Network error"); };
    xhr.send();
}

// Usage with vehicle location
api.call("Get", { typeName: "DeviceStatusInfo" }, function(statuses) {
    var vehicle = statuses[0];
    if (vehicle.latitude && vehicle.longitude) {
        getWeather(vehicle.latitude, vehicle.longitude, function(err, weather) {
            if (!err) {
                console.log("Temperature:", weather.temperature, "°C");
                console.log("Wind speed:", weather.windspeed, "km/h");
                console.log("Conditions:", weather.weathercode);
            }
        });
    }
});
```

**Weather codes:** 0=Clear, 1-3=Cloudy, 45-48=Fog, 51-55=Drizzle, 61-65=Rain, 71-77=Snow, 95-99=Thunderstorm

### Geocoding (Nominatim/OpenStreetMap)

Free reverse geocoding - get address from coordinates:

```javascript
function getAddress(latitude, longitude, callback) {
    var url = "https://nominatim.openstreetmap.org/reverse" +
              "?lat=" + latitude +
              "&lon=" + longitude +
              "&format=json";

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.setRequestHeader("User-Agent", "MyGeotabAddIn");  // Required by Nominatim
    xhr.onload = function() {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            callback(null, data.display_name);
        } else {
            callback("Geocoding error");
        }
    };
    xhr.send();
}
```

**Note:** Nominatim has a 1 request/second limit. For bulk geocoding, use batching with delays.
