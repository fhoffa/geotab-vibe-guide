---
name: geotab-ace
description: Query fleet data using Geotab Ace AI. Use when you need natural language queries, trend analysis, or pre-aggregated insights. Ace is slower than direct API but handles complex analytical questions automatically.
license: Apache-2.0
metadata:
  author: Felipe Hoffa (https://www.linkedin.com/in/hoffa/)
  version: "1.0"
---

# Geotab Ace API

Geotab Ace is an AI-powered query interface that lets you ask natural language questions about fleet data. It automatically generates SQL queries, aggregates data, and returns analyzed results.

> **Enable Ace First:** Ace must be enabled by an admin in **Administration → Beta Features**. It's graduating from beta soon but may still require admin activation. With a demo account, you're the admin - just enable it yourself!

## When to Use Ace vs Direct API

| Metric | Direct API | Ace AI |
|--------|-----------|--------|
| **Speed** | 300-500ms | 30-90 seconds |
| **Data freshness** | Real-time | 2-24 hours behind |
| **Query type** | Structured (Get/Set) | Natural language |
| **Best for** | Live data, writes, simple lookups | Trends, insights, complex aggregations |

### Use Direct API When:
- You need real-time data (current location, live status)
- You're writing/updating data (Set, Add, Remove)
- You need specific records by ID
- Speed is critical
- You know exactly what data structure you need

### Use Ace When:
- You want trend analysis ("Which vehicles drove most last month?")
- You need complex aggregations across multiple data types
- You're exploring data with natural language questions
- You want AI-generated insights and reasoning
- Slight data lag is acceptable

## Ace Query Pattern

Ace queries are **asynchronous** and require three steps:

```
1. create-chat    → Get a chat_id
2. send-prompt    → Send question, get message_group_id
3. get-message-group → Poll until status is DONE
```

### Response Structure

Ace wraps responses in a nested structure:

```javascript
// Raw response from GetAceResults
{
  "apiResult": {
    "results": [
      {
        "chat_id": "...",           // from create-chat
        "message_group_id": "...",  // from send-prompt
        "message_group": {          // from get-message-group
          "status": { "status": "DONE" },
          "messages": {
            "msg_id": {
              "preview_array": [...],  // The actual data rows
              "reasoning": "...",      // AI explanation
              "query": "..."           // Generated SQL
            }
          }
        }
      }
    ]
  }
}
```

**Key parsing pattern:**
```javascript
function getAceData(response) {
    if (response && response.apiResult && response.apiResult.results) {
        return response.apiResult.results[0] || {};
    }
    return response || {};
}
```

### message_group_id Variants

The `message_group_id` can appear in two places depending on API version:

```javascript
// Handle both formats
var mgId = data.message_group_id || ((data.message_group || {}).id);
```

### Row Limits (Important!)

Ace typically returns **only 10 rows** in `preview_array`, even if the query matches more data. For complete results:

1. **The response includes a download link** for the full dataset
2. **Design questions for small results** - ask "top 5 vehicles" not "all vehicles"

```javascript
// Response structure with download link
message_group.messages[id].preview_array    // Up to 10 rows
message_group.messages[id].download_url     // Link to full CSV/JSON
message_group.messages[id].total_row_count  // Actual number of matches
```

**Strategies for large results:**

| Approach | When to Use |
|----------|-------------|
| Ask for "top N" or "worst N" | When you only need highlights |
| Download full results | When you need all data for analysis |
| Store in DuckDB | When processing large downloads locally |

> **Example:** The [geotab-ace-mcp-demo](https://github.com/fhoffa/geotab-ace-mcp-demo) shows how to handle full downloads and store them in DuckDB for local querying.

## JavaScript Example (Add-Ins)

```javascript
// Ace uses the SAME api object as direct API calls - no separate auth needed

function askAce(api, question, onSuccess, onError) {
    // Step 1: Create chat
    api.call('GetAceResults', {
        serviceName: 'dna-planet-orchestration',
        functionName: 'create-chat',
        functionParameters: {}
    }, function(r) {
        var d = getAceData(r);
        var chatId = d.chat_id;

        if (!chatId) {
            onError('No chat_id in response');
            return;
        }

        // Step 2: Send prompt
        api.call('GetAceResults', {
            serviceName: 'dna-planet-orchestration',
            functionName: 'send-prompt',
            functionParameters: {
                chat_id: chatId,
                prompt: question
            }
        }, function(r2) {
            var d2 = getAceData(r2);
            var mgId = d2.message_group_id || ((d2.message_group || {}).id);

            if (!mgId) {
                onError('No message_group_id');
                return;
            }

            // Step 3: Poll after initial delay
            setTimeout(function() {
                pollAce(api, chatId, mgId, onSuccess, onError, 0);
            }, 10000);  // Wait 10s before first poll
        }, function(e) {
            onError('send-prompt failed: ' + JSON.stringify(e));
        });
    }, function(e) {
        onError('create-chat failed: ' + JSON.stringify(e));
    });
}

function pollAce(api, chatId, mgId, onSuccess, onError, attempt) {
    if (attempt > 15) {
        onError('Timeout after ' + attempt + ' attempts');
        return;
    }

    api.call('GetAceResults', {
        serviceName: 'dna-planet-orchestration',
        functionName: 'get-message-group',
        functionParameters: {
            chat_id: chatId,
            message_group_id: mgId
        }
    }, function(r) {
        var d = getAceData(r);
        var mg = d.message_group || {};
        var status = mg.status ? mg.status.status : 'UNKNOWN';

        if (status === 'DONE') {
            var msgs = mg.messages || {};
            var result = { data: null, reasoning: null };

            Object.keys(msgs).forEach(function(k) {
                var m = msgs[k];
                if (m.preview_array) result.data = m.preview_array;
                if (m.reasoning) result.reasoning = m.reasoning;
            });

            onSuccess(result);
        } else if (status === 'FAILED') {
            onError('Query failed: ' + (mg.status.message || 'Unknown'));
        } else {
            // Still processing, poll again
            setTimeout(function() {
                pollAce(api, chatId, mgId, onSuccess, onError, attempt + 1);
            }, 8000);  // Poll every 8s
        }
    }, function(e) {
        // Network error, retry
        setTimeout(function() {
            pollAce(api, chatId, mgId, onSuccess, onError, attempt + 1);
        }, 8000);
    });
}

function getAceData(r) {
    if (r && r.apiResult && r.apiResult.results) {
        return r.apiResult.results[0] || {};
    }
    return r || {};
}
```

## Python Example

```python
import time
from mygeotab import API

def ask_ace(api: API, question: str, timeout_seconds: int = 120) -> dict:
    """
    Query Geotab Ace with a natural language question.

    Args:
        api: Authenticated mygeotab API client
        question: Natural language question about fleet data
        timeout_seconds: Max time to wait for response

    Returns:
        dict with 'data' (list of rows) and 'reasoning' (AI explanation)
    """
    # Step 1: Create chat
    result = api.call('GetAceResults',
        serviceName='dna-planet-orchestration',
        functionName='create-chat',
        functionParameters={}
    )
    chat_id = _get_ace_data(result).get('chat_id')
    if not chat_id:
        raise ValueError("No chat_id in response")

    # Step 2: Send prompt
    result = api.call('GetAceResults',
        serviceName='dna-planet-orchestration',
        functionName='send-prompt',
        functionParameters={
            'chat_id': chat_id,
            'prompt': question
        }
    )
    data = _get_ace_data(result)
    mg_id = data.get('message_group_id') or data.get('message_group', {}).get('id')
    if not mg_id:
        raise ValueError("No message_group_id in response")

    # Step 3: Poll for results
    time.sleep(10)  # Initial delay
    start_time = time.time()

    while time.time() - start_time < timeout_seconds:
        result = api.call('GetAceResults',
            serviceName='dna-planet-orchestration',
            functionName='get-message-group',
            functionParameters={
                'chat_id': chat_id,
                'message_group_id': mg_id
            }
        )

        data = _get_ace_data(result)
        mg = data.get('message_group', {})
        status = mg.get('status', {}).get('status', 'UNKNOWN')

        if status == 'DONE':
            return _extract_result(mg)
        elif status == 'FAILED':
            raise RuntimeError(f"Query failed: {mg.get('status', {}).get('message')}")

        time.sleep(8)  # Poll interval

    raise TimeoutError(f"Ace query timed out after {timeout_seconds}s")


def _get_ace_data(response):
    """Extract data from nested Ace response structure."""
    if isinstance(response, dict):
        if 'apiResult' in response and 'results' in response['apiResult']:
            results = response['apiResult']['results']
            return results[0] if results else {}
    return response or {}


def _extract_result(message_group: dict) -> dict:
    """Extract data and reasoning from completed message group."""
    result = {'data': None, 'reasoning': None}
    messages = message_group.get('messages', {})

    for msg in messages.values():
        if 'preview_array' in msg:
            result['data'] = msg['preview_array']
        if 'reasoning' in msg:
            result['reasoning'] = msg['reasoning']

    return result


# Usage example
if __name__ == '__main__':
    from dotenv import load_dotenv
    import os

    load_dotenv()

    api = API(
        username=os.getenv('GEOTAB_USERNAME'),
        password=os.getenv('GEOTAB_PASSWORD'),
        database=os.getenv('GEOTAB_DATABASE'),
        server=os.getenv('GEOTAB_SERVER', 'my.geotab.com')
    )
    api.authenticate()

    result = ask_ace(api, "How many vehicles are in my fleet?")
    print(f"Data: {result['data']}")
    print(f"Reasoning: {result['reasoning']}")
```

## Rate Limiting

Ace has rate limits that can cause 429 errors or empty responses.

**Key timings:**
- **Between queries:** 8+ seconds apart minimum
- **create-chat can fail silently** - returns no `chat_id`
- Add retry logic: 3 attempts with 3s delay

```javascript
// Staggered Ace calls to avoid rate limiting
askAce(api, question1, function(result1) {
    // First query done, wait 8s before next
    setTimeout(function() {
        askAce(api, question2, function(result2) {
            // Second query done
        }, onError);
    }, 8000);  // 8 second delay minimum
}, onError);

// Retry logic for create-chat
function createChatWithRetry(api, callback, attempt) {
    attempt = attempt || 0;
    if (attempt >= 3) {
        callback(null, 'create-chat failed after 3 attempts');
        return;
    }
    api.call('GetAceResults', {
        serviceName: 'dna-planet-orchestration',
        functionName: 'create-chat',
        functionParameters: {}
    }, function(r) {
        var chatId = getAceData(r).chat_id;
        if (!chatId) {
            setTimeout(function() {
                createChatWithRetry(api, callback, attempt + 1);
            }, 3000);
        } else {
            callback(chatId, null);
        }
    }, function(e) {
        setTimeout(function() {
            createChatWithRetry(api, callback, attempt + 1);
        }, 3000);
    });
}
```

## Polling Strategy

Ace needs time to process queries before results are ready.

**Recommended timing:**
- **First poll:** Wait 8 seconds after `send-prompt`
- **Subsequent polls:** Every 5 seconds
- **Max attempts:** ~30 (about 2.5 minutes total)
- **Check:** `status.status` for `"DONE"` or `"FAILED"`

```javascript
// Polling with proper timing
setTimeout(function() {
    pollAce(api, chatId, mgId, onSuccess, onError, 0);
}, 8000);  // Wait 8s before first poll

function pollAce(api, chatId, mgId, onSuccess, onError, attempt) {
    if (attempt > 30) {
        onError('Timeout');
        return;
    }
    // ... poll logic ...
    setTimeout(function() {
        pollAce(api, chatId, mgId, onSuccess, onError, attempt + 1);
    }, 5000);  // Poll every 5s
}
```

## Timestamps

Ace returns timestamps in **UTC** with a specific format:

```javascript
// Ace timestamp format (no Z suffix!)
"2026-02-03 22:03:20.665"

// DeviceTimeZoneId is always UTC
{ "DeviceTimeZoneId": "Etc/UTC" }

// To parse correctly, add 'T' and 'Z':
var utcDate = new Date(timeStr.replace(' ', 'T') + 'Z');
```

## Question Phrasing

How you phrase questions affects results:

**Be explicit with dates:**
```
❌ "trips last month"           // Interpreted loosely
✅ "trips from 2026-01-04 to 2026-02-03"  // Explicit bounds
```

**Ask for limited results:**
```
❌ "all vehicles with trips"    // Could return thousands
✅ "top 10 vehicles by distance" // Limited, fits in preview_array
```

**Note:** Even with explicit bounds, Ace results may differ from direct API due to:
- Different data sources (BigQuery vs live)
- Different aggregation logic
- "Active" vs "all" device filtering

## Data Freshness

Ace data runs **behind** real-time API data:
- Typical lag: 2-24 hours
- New demo accounts: wait ~1 day before Ace has data
- Don't use Ace for "what's happening right now" queries

## Common Issues

### "No chat_id in response"
- **Ace not enabled** - Admin must enable in Administration → Beta Features
- Rate limiting - wait and retry (use retry logic above)
- create-chat can fail silently under load

### Query times out
- Complex queries can take 60-90+ seconds
- Increase timeout or simplify question

### Empty data array
- Question may be too vague
- Data doesn't exist for the time period
- New account - Ace needs time to index data

### Stale results
- Ace data lags real-time by hours
- Use direct API for current data

## Resources

- [Geotab SDK - Ace Documentation](https://geotab.github.io/sdk/)
- [geotab-addins skill](../geotab-addins/SKILL.md) - Building Add-Ins
- [geotab-api-quickstart skill](../geotab-api-quickstart/SKILL.md) - Direct API usage
