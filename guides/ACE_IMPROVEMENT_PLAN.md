# Building a Better Geotab Ace: 10-Day Improvement Plan

## Executive Summary

Geotab Ace is an AI-powered natural language query interface that translates fleet management questions into SQL against BigQuery. It's genuinely useful — but it has significant, measurable gaps that limit adoption and trust:

| Problem | Current State | Target State |
|---------|--------------|--------------|
| **Speed** | 30–90 seconds per query | <5s for common queries, <15s for complex |
| **Accuracy** | Implicit filters, inconsistent results, no public benchmarks | Validated against ground truth, transparent assumptions |
| **Data freshness** | 20 min to hours behind real-time | Real-time for simple lookups, <5 min for aggregations |
| **Output limits** | 10 rows in preview, CSV download for full data | Streaming results, in-browser SQL on full datasets |
| **Rate limiting** | 8s between queries, no parallelism | Cached common queries bypass limits entirely |
| **Determinism** | Same question can give different answers | Deterministic for structured queries, flagged when probabilistic |

**The core idea:** Don't replace Ace — build a smarter layer around it that routes queries to the fastest correct data channel, caches aggressively, validates results, and falls back gracefully.

---

## What Geotab Ace Actually Does Today

### Architecture (from public sources)

```
User Question (natural language)
        │
        ▼
┌─────────────────────┐
│   Embedding Model   │  → Vector representation of question
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│   Vector Database   │  → Find similar past questions + SQL
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│   Gemini LLM (RAG)  │  → Generate SQL from question + context
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│   BigQuery Tables   │  → Execute SQL, return results
│  (LatestVehicle     │
│   Metadata, Trip,   │
│   VehicleKPI_Daily) │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Reasoning Engine   │  → Natural language explanation
└─────────────────────┘
        │
        ▼
  Response (preview_array, CSV URL, reasoning, SQL)
```

### What Ace Does Well
- Natural language → SQL for fleet data (no code needed)
- Auto-joins tables, converts units, adds device names
- Returns the generated SQL (transparency)
- Provides reasoning/explanations
- Respects user permissions (group/vehicle scoping)
- Filters to active, tracked devices by default (usually what you want)

### What Ace Does Poorly
1. **Slow**: 30–90s async polling pattern (create-chat → send-prompt → poll get-message-group)
2. **Implicit filters**: Silently applies `IsTracked=TRUE`, `ActiveTo >= NOW()` — counts don't match API
3. **Inconsistent**: Same question can return different column names, different row counts, different units
4. **10-row preview cap**: Must fetch CSV via signed URL for full data
5. **Rate limited**: 8s minimum between queries, no parallelism
6. **Stale data**: BigQuery warehouse lags real-time by 20 min to hours
7. **Unit confusion**: May auto-convert km↔miles without being asked
8. **Timezone confusion**: Uses device-local time by default, not UTC
9. **No writes**: Read-only (can't create zones, update devices, etc.)

### Alternative Data Channels Available

| Channel | Speed | Freshness | Best For |
|---------|-------|-----------|----------|
| **MyGeotab API** | 300–500ms | Real-time | Live data, writes, simple lookups, per-vehicle queries |
| **OData Data Connector** | 5–11s | Hours | Pre-aggregated KPIs, dashboards, fleet-wide reports |
| **Geotab Ace** | 30–90s | 20 min–hours | Complex aggregations, NL exploration, ad-hoc analysis |
| **BigQuery DSP** | Seconds | Daily batch | Custom SQL, data science, ML pipelines |

**Key insight**: No single channel is best for everything. The improvement is a routing layer that picks the right channel per query.

---

## The Plan: Ace+ (Enhanced Ace Wrapper)

### Architecture

```
User Question (natural language)
        │
        ▼
┌───────────────────────────────────┐
│        ACE+ ROUTING LAYER        │
│                                   │
│  1. Cache check (semantic match)  │
│  2. Intent classification         │
│  3. Route to best data channel    │
│  4. Validate & reconcile results  │
│  5. Stream response to user       │
└───────────────────────────────────┘
    │           │           │           │
    ▼           ▼           ▼           ▼
 DuckDB     MyGeotab    Data        Geotab
 Cache      API         Connector   Ace
 (<1s)      (300ms)     (5s)        (30-90s)
```

### Decision Tree

```
User asks a question
    │
    ├─ Is it in the semantic cache? ──────────────► Return cached result (<1s)
    │
    ├─ Is it a simple lookup?
    │   "How many vehicles?" ─────────────────────► Direct API: GetCountOf (~300ms)
    │   "Where is truck 42?" ──────────────────────► Direct API: DeviceStatusInfo (~300ms)
    │   "Last trip for vehicle X?" ────────────────► Direct API: Get Trip (~500ms)
    │
    ├─ Is it a fleet-wide KPI?
    │   "Total distance this month?" ──────────────► Data Connector: VehicleKpi_Monthly (~5s)
    │   "Fleet idle percentage?" ──────────────────► Data Connector: VehicleKpi_Daily (~5s)
    │
    ├─ Is it a complex aggregation?
    │   "Which drivers need coaching?" ────────────► Ace (30-90s) + validate against API spot-check
    │   "Fuel efficiency trend by region?" ────────► Ace (30-90s) + cache result in DuckDB
    │
    └─ Unknown / ambiguous ────────────────────────► Ace (30-90s) as fallback
```

---

## Stages

### Stage 1: Evaluation Framework (Days 1–2)

**Goal**: Before improving anything, measure where Ace stands today. You can't improve what you can't measure.

#### Day 1: Build the Question Bank

Create a curated set of 50–100 question-answer pairs across categories:

| Category | Example Questions | Ground Truth Source |
|----------|-------------------|---------------------|
| **Simple counts** | "How many vehicles in my fleet?" | Direct API `GetCountOf Device` |
| **Single-vehicle lookup** | "Where is vehicle X right now?" | Direct API `DeviceStatusInfo` |
| **Fleet-wide KPI** | "Total distance last 14 days?" | Data Connector `VehicleKpi_Daily` |
| **Top-N ranking** | "Top 5 vehicles by distance yesterday?" | API trips → aggregate → sort |
| **Temporal** | "Most recent trip in fleet?" | API `Get Trip` sorted by stop time |
| **Safety** | "Which drivers had harsh braking events?" | API `ExceptionEvent` |
| **Complex join** | "Vehicles with no trips in 7 days?" | API devices minus active trip devices |
| **Ambiguous** | "How's my fleet doing?" | Subjective — evaluate reasoning quality |

For each question, record:
- The question text (exact phrasing)
- Expected SQL (or equivalent API call)
- Ground truth result (from the most reliable channel)
- Expected columns, units, timezone
- Whether Ace should apply implicit filters or not

#### Day 2: Run Baseline Evaluation

Build an automated eval harness:

```python
# Pseudocode for eval framework
for question in question_bank:
    # Get ground truth from direct API / Data Connector
    ground_truth = get_ground_truth(question)

    # Run through Ace 3 times (test determinism)
    ace_results = [run_ace_query(question) for _ in range(3)]

    # Score each Ace result
    for result in ace_results:
        scores[question] = {
            "sql_valid": validate_sql_syntax(result.sql),
            "result_match": compare_results(result.data, ground_truth),
            "column_match": compare_columns(result.columns, question.expected_columns),
            "unit_correct": check_units(result.data, question.expected_units),
            "filter_transparent": check_implicit_filters(result.sql, question),
            "latency_seconds": result.elapsed,
            "determinism": all_results_match(ace_results),
        }
```

**Metrics to track**:
- **Execution accuracy**: Does the SQL run without errors?
- **Result accuracy**: Do the numbers match ground truth (within 5% tolerance for aggregations)?
- **Semantic accuracy**: Even if numbers differ slightly, does the answer address the question?
- **Determinism**: Do 3 runs of the same question return the same result?
- **Latency**: Time from question to answer
- **Implicit filter rate**: How often does Ace add filters not requested?
- **Unit confusion rate**: How often does Ace convert units without being asked?

**Deliverable**: A baseline scorecard. Example:

```
BASELINE SCORES (50 questions, 3 runs each = 150 evals)
───────────────────────────────────────────────────
Execution accuracy:     92%   (138/150 SQL ran without errors)
Result accuracy:        74%   (111/150 within 5% of ground truth)
Semantic accuracy:      81%   (122/150 addressed the question correctly)
Determinism:            67%   (34/50 questions gave same result 3/3 times)
Median latency:         38s
Implicit filter rate:   44%   (22/50 questions had unexpected filters)
Unit confusion rate:    12%   (6/50 questions had unexpected unit conversion)
```

**Resources needed**:
- 1 engineer (full-time, 2 days)
- Geotab demo database with known data
- Python + requests/aiohttp for API calls
- Local storage for results (SQLite or DuckDB)

---

### Stage 2: Semantic Cache + Query Router (Days 3–4)

**Goal**: Eliminate Ace entirely for queries that don't need it. This is the single biggest improvement — most questions have a faster, more reliable answer via Direct API or Data Connector.

#### Day 3: Intent Classifier

Build an intent classifier that categorizes incoming questions:

```python
INTENT_CATEGORIES = {
    "count":           {"channel": "api",    "method": "GetCountOf",     "speed": "<500ms"},
    "live_location":   {"channel": "api",    "method": "DeviceStatusInfo", "speed": "<500ms"},
    "single_vehicle":  {"channel": "api",    "method": "Get",            "speed": "<1s"},
    "recent_trips":    {"channel": "api",    "method": "Get Trip",       "speed": "<1s"},
    "fleet_kpi":       {"channel": "odata",  "table": "VehicleKpi_*",   "speed": "<10s"},
    "top_n_ranking":   {"channel": "api+agg","method": "Get+aggregate",  "speed": "<2s"},
    "trend_analysis":  {"channel": "ace",    "method": "NL→SQL",         "speed": "30-90s"},
    "complex_join":    {"channel": "ace",    "method": "NL→SQL",         "speed": "30-90s"},
    "subjective":      {"channel": "ace",    "method": "NL→reasoning",   "speed": "30-90s"},
}
```

**Implementation options** (choose one):

| Approach | Pros | Cons |
|----------|------|------|
| **LLM classifier** (Claude Haiku / GPT-4o-mini) | High accuracy, handles edge cases | Adds 300ms–1s latency, API cost |
| **Embedding similarity** (sentence-transformers) | Fast (<50ms), no API cost | Needs training examples, brittle on novel phrasings |
| **Keyword rules + fallback** | Instant, zero cost, transparent | Low accuracy on ambiguous questions |
| **Hybrid**: rules first, LLM for uncertain | Best of both — fast for obvious cases, smart for edge cases | More complex to build |

**Recommendation**: Hybrid approach. Keyword rules catch 60% of queries instantly; LLM classifier handles the rest.

#### Day 4: Semantic Cache

Build a semantic cache using embeddings:

```python
# On each query:
# 1. Embed the question
# 2. Search for similar past questions (cosine similarity > 0.92)
# 3. If match found and result is fresh enough, return cached result
# 4. If no match, route to appropriate channel, cache the result

class SemanticCache:
    def __init__(self):
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')  # ~80MB, runs locally
        self.cache = {}  # question_embedding → {result, timestamp, channel, ttl}

    def get(self, question: str, max_age_seconds: int = 300) -> Optional[CachedResult]:
        embedding = self.embedder.encode(question)
        for cached_emb, cached_result in self.cache.items():
            similarity = cosine_similarity(embedding, cached_emb)
            if similarity > 0.92 and cached_result.age < max_age_seconds:
                return cached_result
        return None

    def put(self, question: str, result: Any, channel: str, ttl: int = 300):
        embedding = self.embedder.encode(question)
        self.cache[embedding] = CachedResult(result, channel, ttl)
```

**TTL strategy** (different freshness requirements):

| Query Type | Cache TTL | Rationale |
|------------|-----------|-----------|
| Vehicle count | 1 hour | Rarely changes |
| Fleet KPIs (daily) | 4 hours | Data Connector updates daily |
| Top-N rankings | 30 min | Trips data flows in continuously |
| Live location | 0 (no cache) | Must be real-time |
| Trend analysis | 1 hour | Historical data doesn't change |

**Deliverable**: A routing layer that resolves 60%+ of queries without touching Ace.

**Resources needed**:
- 1 engineer (full-time, 2 days)
- `sentence-transformers` library (local, no API cost)
- DuckDB for cache storage
- Claude Haiku API access (for LLM classifier fallback — ~$0.01/query)

---

### Stage 3: Accuracy Improvements (Days 5–7)

**Goal**: For queries that do go to Ace, make the results more correct and transparent.

#### Day 5: Prompt Engineering & Guardrails

Systematic prompt improvement for Ace queries:

**Problem 1: Implicit filters**
```
# Before (user sees unexpected filter)
User: "How many vehicles in my fleet?"
Ace SQL: SELECT COUNT(*) FROM LatestVehicleMetadata WHERE IsTracked = TRUE AND ActiveTo >= NOW()
Result: 3161

# After (Ace+ adds transparency)
Ace+: "3161 active, tracked vehicles (Ace excludes retired/untracked devices by default).
       Direct API shows 6538 total devices including inactive."
```

**Solution**: Post-process Ace results. Parse the generated SQL, detect implicit filters, and annotate the response.

```python
KNOWN_IMPLICIT_FILTERS = [
    {"pattern": "IsTracked\\s*=\\s*TRUE", "description": "Only tracked vehicles (excludes test/retired)"},
    {"pattern": "ActiveTo\\s*>=", "description": "Only currently active devices"},
    {"pattern": "Local_Date", "description": "Using device-local timezone (not UTC)"},
]

def annotate_filters(ace_sql: str, ace_result: dict) -> dict:
    annotations = []
    for f in KNOWN_IMPLICIT_FILTERS:
        if re.search(f["pattern"], ace_sql, re.IGNORECASE):
            annotations.append(f["description"])
    ace_result["implicit_filters"] = annotations
    return ace_result
```

**Problem 2: Unit confusion**
```python
def detect_unit_conversion(question: str, ace_sql: str, ace_columns: list) -> Optional[str]:
    asked_for_km = "km" in question.lower() or "kilometer" in question.lower()
    asked_for_miles = "mile" in question.lower()
    returned_miles = any("mile" in c.lower() for c in ace_columns)
    returned_km = any("km" in c.lower() or "kilometer" in c.lower() for c in ace_columns)

    if asked_for_km and returned_miles:
        return "Warning: You asked for km but Ace returned miles"
    if asked_for_miles and returned_km:
        return "Warning: You asked for miles but Ace returned km"
    return None
```

**Problem 3: Question rephrasing for better SQL**

Build a question rewriter that adds explicit constraints:

```python
def improve_question(raw_question: str) -> str:
    improved = raw_question

    # Add column specifications if missing
    if "column" not in improved.lower() and "return" not in improved.lower():
        improved += " Return specific column names in the result."

    # Add timezone if asking about time
    if any(word in improved.lower() for word in ["when", "time", "recent", "latest", "last"]):
        if "utc" not in improved.lower() and "timezone" not in improved.lower():
            improved += " Use UTC timezone."

    # Add explicit date ranges for relative dates
    if "yesterday" in improved.lower():
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        improved = improved.replace("yesterday", f"on {yesterday} (UTC)")

    return improved
```

#### Day 6: Cross-Channel Validation

For high-stakes queries, validate Ace results against a second channel:

```python
async def validated_query(question: str, ace_result: dict) -> dict:
    """Spot-check Ace results against Direct API for key metrics."""

    validations = []

    # If Ace returned a vehicle count, cross-check with API
    if looks_like_count(ace_result):
        api_count = await api.call("GetCountOf", {"typeName": "Device"})
        ace_count = extract_count(ace_result)

        if ace_count != api_count:
            validations.append({
                "metric": "vehicle_count",
                "ace_value": ace_count,
                "api_value": api_count,
                "explanation": f"Ace counts {ace_count} active tracked vehicles; "
                              f"API counts {api_count} total devices (including inactive)"
            })

    # If Ace returned trip data, spot-check one vehicle against API
    if has_trip_data(ace_result):
        sample_device = ace_result.data[0].device_name
        api_trips = await api.call("Get", {
            "typeName": "Trip",
            "search": {"deviceSearch": {"name": sample_device}, ...}
        })
        # Compare trip counts/distances for the sample device
        ...

    ace_result["validations"] = validations
    return ace_result
```

#### Day 7: Determinism & Regression Testing

**Determinism improvement**: For queries where we need consistent results, use a deterministic path:

```python
def deterministic_query(question: str) -> dict:
    """For queries that must return the same result every time,
    bypass Ace's LLM entirely and use a pre-mapped SQL template."""

    # Match question to known query template
    template = match_template(question)
    if template:
        # Execute known-good SQL directly against Data Connector
        return execute_template(template)

    # Fall back to Ace for novel questions
    return ace_query(question)

# Template examples
QUERY_TEMPLATES = {
    "vehicle_count": {
        "patterns": ["how many vehicles", "vehicle count", "fleet size"],
        "sql": "SELECT COUNT(DISTINCT DeviceId) FROM LatestVehicleMetadata WHERE IsTracked = TRUE",
        "channel": "odata",
    },
    "total_distance_period": {
        "patterns": ["total distance", "fleet distance", "miles driven"],
        "sql": "SELECT SUM(DrivingDistanceKm) FROM VehicleKpi_Daily WHERE Date BETWEEN {start} AND {end}",
        "channel": "odata",
    },
}
```

**Regression test suite**: Run the Day 1 question bank nightly:

```python
# nightly_regression.py
async def run_regression():
    results = []
    for question in QUESTION_BANK:
        ace_result = await ace_query(question.text)
        ground_truth = await get_ground_truth(question)

        score = evaluate(ace_result, ground_truth)
        results.append({"question": question.text, "score": score})

    # Alert if accuracy drops below threshold
    avg_accuracy = mean(r["score"] for r in results)
    if avg_accuracy < 0.75:
        send_alert(f"Ace accuracy dropped to {avg_accuracy:.0%}")

    # Store results for trend tracking
    store_regression_results(results)
```

**Deliverable**: Measurably better accuracy. Target: result accuracy from ~74% → 88%+.

**Resources needed**:
- 1 engineer (full-time, 3 days)
- Claude API access for question rewriting (~$0.50/day)
- Geotab API + Data Connector credentials
- CI/CD for nightly regression runs

---

### Stage 4: Speed & UX Layer (Days 8–9)

**Goal**: Make the user experience feel fast even when Ace is slow.

#### Day 8: Streaming & Progressive Results

**Progressive disclosure**: Show what you know immediately, fill in details as Ace responds.

```
User: "Top 5 vehicles by distance yesterday"

[Instant - 0s]    Intent: top-N ranking → routing to Direct API + Ace in parallel
[Fast - 800ms]    API result: "Based on API trip data: 1. Truck-42 (187mi), 2. Van-17 (156mi)..."
[Slow - 35s]      Ace result: "Ace confirms with additional context: includes idle time analysis..."
                   Validation: "API and Ace agree on top 3. Ace shows 5% lower distances (IsTracked filter)."
```

**Implementation**: Fire API query immediately while Ace processes. Show API result first, then enhance/reconcile when Ace completes.

```python
async def parallel_query(question: str) -> AsyncIterator[PartialResult]:
    intent = classify_intent(question)

    # Start all relevant channels simultaneously
    tasks = []
    if intent.api_viable:
        tasks.append(("api", api_query(question)))
    if intent.odata_viable:
        tasks.append(("odata", odata_query(question)))
    if intent.needs_ace:
        tasks.append(("ace", ace_query(question)))

    # Yield results as they arrive
    for completed in asyncio.as_completed([t[1] for t in tasks]):
        channel, result = await completed
        yield PartialResult(channel=channel, data=result)
```

#### Day 9: DuckDB Local Analytics + Pre-computation

**Pre-compute common queries** at startup or on a schedule:

```python
# Pre-computation daemon
PRECOMPUTED_QUERIES = [
    {"name": "fleet_size", "query": "GetCountOf Device", "refresh": "1h"},
    {"name": "daily_kpis", "query": "VehicleKpi_Daily last 30 days", "refresh": "4h"},
    {"name": "active_drivers", "query": "Get User with driver=true", "refresh": "1h"},
    {"name": "recent_exceptions", "query": "Get ExceptionEvent last 24h", "refresh": "15m"},
]

async def precompute_loop():
    while True:
        for pq in PRECOMPUTED_QUERIES:
            if needs_refresh(pq):
                result = await fetch_data(pq)
                await duckdb.execute(f"CREATE OR REPLACE TABLE {pq['name']} AS ...", result)
        await asyncio.sleep(60)
```

**DuckDB as query accelerator**: Once data is cached locally, complex aggregations become instant:

```python
# User asks: "Top 5 vehicles by distance this week"
# Instead of waiting 40s for Ace:

# 1. Check if daily_kpis table is fresh enough
if duckdb.table_fresh("daily_kpis", max_age="4h"):
    # 2. Run SQL locally (<100ms)
    result = duckdb.execute("""
        SELECT DeviceName, SUM(DrivingDistanceKm) * 0.621371 as miles
        FROM daily_kpis
        WHERE Date >= current_date - interval '7 days'
        GROUP BY DeviceName
        ORDER BY miles DESC
        LIMIT 5
    """)
    return result  # <100ms instead of 40s
```

**Deliverable**: 60%+ of queries resolve in <5 seconds. Complex queries show progressive results.

**Resources needed**:
- 1 engineer (full-time, 2 days)
- DuckDB (embedded, no infrastructure cost)
- Frontend work for streaming UI (if building Add-In)

---

### Stage 5: Integration & Polish (Day 10)

**Goal**: Package everything into a deployable system with monitoring.

#### Day 10: Observability, Packaging, Documentation

**Monitoring dashboard** (track improvements over time):

```python
# Metrics to track in production
METRICS = {
    "query_volume": "Total queries per day",
    "cache_hit_rate": "% queries resolved from cache",
    "api_route_rate": "% queries routed to Direct API (bypassing Ace)",
    "ace_route_rate": "% queries that still need Ace",
    "p50_latency": "Median end-to-end latency",
    "p95_latency": "95th percentile latency",
    "accuracy_score": "Weekly regression test accuracy",
    "user_corrections": "Times user said 'that's wrong'",
}
```

**Packaging options**:

| Deployment | Pros | Cons |
|------------|------|------|
| **MCP Server** (extend existing demo) | Works with Claude Desktop, familiar pattern | Python only, local install |
| **MyGeotab Add-In** | Runs inside MyGeotab, no separate install | Browser JS only, CSP constraints |
| **Standalone API** | Any client can use it, scalable | Needs hosting, auth management |
| **All three** | Maximum reach | More maintenance |

**Recommendation**: Start with MCP Server (extend the existing `geotab-ace-mcp-demo`), then port to Add-In.

---

## Resource Budget

### Personnel

| Role | Days | What They Do |
|------|------|-------------|
| **Backend engineer** | 10 | Core routing, caching, validation, eval harness |
| **ML/NLP engineer** | 5 (days 1-2, 5-7) | Intent classifier, semantic cache, prompt engineering |
| **Frontend engineer** | 3 (days 8-10) | Streaming UI, progressive results, monitoring dashboard |
| **Domain expert** (fleet manager) | 2 (days 1, 7) | Curate question bank, validate ground truth, acceptance testing |

**Total**: ~20 person-days across 10 calendar days.

### Infrastructure Costs (10-day sprint)

| Item | Cost | Notes |
|------|------|-------|
| Claude API (Haiku for classifier) | ~$5 | ~500 classifications at $0.01 each |
| Claude API (Sonnet for eval judge) | ~$25 | ~500 eval comparisons |
| Sentence-transformers model | $0 | Runs locally, ~80MB |
| DuckDB | $0 | Embedded, no server |
| Geotab API calls | $0 | Included with account |
| Data Connector queries | $0 | Included with account |
| Ace queries (eval runs) | $0 | Included with account, but rate-limited |
| Compute (dev machines) | $0 | Existing hardware |
| **Total infrastructure** | **~$30** | |

### Ongoing Costs (post-sprint, per month)

| Item | Cost/month | Notes |
|------|------------|-------|
| Claude Haiku (query classification) | ~$15 | ~1500 queries/month |
| Nightly regression runs | ~$10 | 50 questions × 30 nights |
| Hosting (if standalone API) | ~$20 | Small VM or serverless |
| **Total monthly** | **~$45** | |

---

## Success Criteria

### Quantitative (measured by eval framework)

| Metric | Baseline (estimated) | Day 5 Target | Day 10 Target |
|--------|---------------------|--------------|---------------|
| Result accuracy | ~74% | 82% | 88%+ |
| Determinism | ~67% | 80% | 90%+ |
| Median latency | ~38s | 12s | <5s |
| P95 latency | ~85s | 45s | <30s |
| Cache hit rate | 0% | 30% | 60%+ |
| Ace bypass rate | 0% | 40% | 60%+ |
| Implicit filter transparency | 0% | 100% | 100% |

### Qualitative

- Fleet manager can ask "How's my fleet doing?" and get a useful, fast answer
- When Ace and API disagree, the user sees both results with an explanation of why
- Queries that used to take 40s now take <5s for common patterns
- A nightly regression test catches accuracy regressions before users do

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Ace API changes break integration | Medium | High | Abstract Ace behind interface; version-pin; monitor for changes |
| Intent classifier misroutes queries | Medium | Medium | Always fall back to Ace; log misroutes for retraining |
| Semantic cache returns stale results | Medium | Medium | TTL per query type; user can force refresh |
| Rate limiting blocks eval runs | High | Medium | Spread evals over time; cache Ace results; run at off-peak hours |
| Data Connector schema changes | Low | Medium | Test against schema weekly; alert on changes |
| Over-engineering the routing layer | Medium | Medium | Start with 5 simple rules, not 50. Expand based on data. |

---

## What This Does NOT Cover

This plan improves the **consumer experience** of Ace. It does not:

- Modify Ace's internal LLM or SQL generation (that's Geotab's domain)
- Replace BigQuery as the data warehouse
- Add write operations to Ace (though the routing layer could handle writes via Direct API)
- Build a full chatbot with multi-turn memory (though the MCP server supports this naturally)
- Address Ace's internal rate limiting or infrastructure

These would be separate initiatives — but the routing/caching layer built here would make them easier to add later.

---

## Day-by-Day Schedule

| Day | Focus | Key Deliverable |
|-----|-------|-----------------|
| 1 | Question bank curation | 50–100 Q&A pairs with ground truth |
| 2 | Baseline evaluation | Scorecard: accuracy, determinism, latency |
| 3 | Intent classifier | Route 60% of queries away from Ace |
| 4 | Semantic cache | <1s for repeated/similar queries |
| 5 | Prompt engineering | Better questions → better SQL |
| 6 | Cross-channel validation | Spot-check Ace against API |
| 7 | Regression test suite | Nightly automated accuracy tracking |
| 8 | Streaming/progressive UX | Show fast results first, enhance later |
| 9 | DuckDB pre-computation | Common queries resolved locally |
| 10 | Packaging, monitoring, docs | Deployable MCP server + dashboard |

---

## Getting Started

1. **Clone the MCP demo**: `git clone https://github.com/fhoffa/geotab-ace-mcp-demo`
2. **Set up credentials**: Create `.env` with Geotab database access
3. **Run Day 1**: Start curating the question bank (see Stage 1)
4. **Measure first, build second**: The eval framework is the foundation everything else builds on

The most impactful single change? **The intent classifier + routing layer (Stage 2)**. Even without any other improvement, routing simple lookups to the Direct API instead of Ace cuts median latency from 38s to <2s for 60% of queries.
