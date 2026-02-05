# Persistent Storage (AddInData)

Add-Ins can store custom data in the Geotab database using `AddInData`. This persists across sessions and can store up to 10,000 characters of JSON per record.

## Your AddInId

Each Add-In needs a **unique, fixed AddInId** to isolate its data. This ID must be:
1. Generated **once** during development
2. **Hardcoded** into your Add-In source code
3. Used consistently for all data operations

**Generate your AddInId once** (run in browser console or Node.js):

```javascript
// Run ONCE, then copy the result into your Add-In code
function generateAddInId() {
    var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    return btoa(guid).replace(/=/g, '').substring(0, 22);
}
console.log("Your AddInId:", generateAddInId());
// Example output: "a2C4ABQuLFkepPVf6-4OKAQ"
```

**Then hardcode it in your Add-In:**

```javascript
// This ID is FIXED - same value every time the Add-In runs
var MY_ADDIN_ID = "a2C4ABQuLFkepPVf6-4OKAQ";  // Your generated ID
```

> **Why fixed?** If the ID changes, you create new data instead of retrieving existing data. Each Add-In installation should use the same ID to access its persistent storage.

## Save Data

```javascript
var MY_ADDIN_ID = "a2C4ABQuLFkepPVf6-4OKAQ";  // Your unique ID

api.call("Add", {
    typeName: "AddInData",
    entity: {
        addInId: MY_ADDIN_ID,
        groups: [{ id: "GroupCompanyId" }],  // Access scope
        details: {
            savedAt: new Date().toISOString(),
            settings: { theme: "dark", refreshRate: 30 },
            notes: "User preferences"
        }
    }
}, function(newId) {
    console.log("Saved with ID:", newId);
}, function(error) {
    console.error("Save error:", error);
});
```

## Retrieve Data

```javascript
// Get all data for your Add-In
api.call("Get", {
    typeName: "AddInData",
    search: { addInId: MY_ADDIN_ID }
}, function(results) {
    results.forEach(function(record) {
        console.log("ID:", record.id);
        console.log("Data:", record.details);
    });
});

// Filter with whereClause (object path notation)
api.call("Get", {
    typeName: "AddInData",
    search: {
        addInId: MY_ADDIN_ID,
        selectClause: "settings.theme",
        whereClause: "settings.refreshRate > 20"
    }
}, function(results) {
    // results[].details contains just the selected field
});
```

## Update Data

```javascript
api.call("Set", {
    typeName: "AddInData",
    entity: {
        addInId: MY_ADDIN_ID,
        id: existingRecordId,  // Required for update
        groups: [{ id: "GroupCompanyId" }],
        details: {
            settings: { theme: "light", refreshRate: 60 }
        }
    }
}, function() {
    console.log("Updated!");
});
```

## Delete Data

```javascript
api.call("Remove", {
    typeName: "AddInData",
    entity: { id: recordId }
}, function() {
    console.log("Deleted");
});
```

## Object Path Notation

Use dot notation to query nested JSON. Arrays use `[]`:

| Path | Matches |
|------|---------|
| `settings.theme` | `{ settings: { theme: "dark" } }` -> `"dark"` |
| `items.[].name` | `{ items: [{ name: "A" }, { name: "B" }] }` -> `"A"`, `"B"` |
| `customer.email` | `{ customer: { email: "x@y.com" } }` -> `"x@y.com"` |

## Where Clause Operators

| Operator | Example |
|----------|---------|
| `=` | `settings.theme = "dark"` |
| `<`, `>` | `settings.refreshRate > 30` |
| `<=`, `>=` | `items.[].price <= 100` |

**Note:** String values need escaped quotes: `customer.name = \"joesmith\"`

## Limitations

- **10,000 character limit** per AddInData record
- **No property deletion** - Set merges; to replace, delete then add
- **No LIKE/fuzzy matching** - Exact matches only
- **No AND/OR** in whereClause - Single condition only
- **Case-sensitive** search matching
- Property names cannot start with `geotab` (reserved)

## Practical Pattern: User Settings

```javascript
var MY_ADDIN_ID = "yourUniqueAddInId";
var settingsId = null;

// Load settings on initialize
function loadSettings(callback) {
    api.call("Get", {
        typeName: "AddInData",
        search: { addInId: MY_ADDIN_ID }
    }, function(results) {
        if (results.length > 0) {
            settingsId = results[0].id;
            callback(results[0].details);
        } else {
            callback(null);  // No settings yet
        }
    });
}

// Save settings (create or update)
function saveSettings(settings) {
    var entity = {
        addInId: MY_ADDIN_ID,
        groups: [{ id: "GroupCompanyId" }],
        details: settings
    };

    if (settingsId) {
        entity.id = settingsId;
        api.call("Set", { typeName: "AddInData", entity: entity });
    } else {
        api.call("Add", { typeName: "AddInData", entity: entity }, function(id) {
            settingsId = id;
        });
    }
}

// Usage in Add-In
return {
    initialize: function(api, state, callback) {
        loadSettings(function(settings) {
            if (settings) {
                applySettings(settings);
            }
            callback();
        });
    },
    // ...
};
```

## Security Clearance

| Role | Permissions |
|------|-------------|
| Administrator, Supervisor, Default User, Drive App User | Add, Set, Get, Remove |
| ViewOnly | Get only |
| Nothing | No access |
