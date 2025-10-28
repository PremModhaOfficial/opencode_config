# Memory Integration Patterns

This guide details how the task-orchestrator skill uses sqlite, chroma, and serena for learning and optimization.

## Memory Architecture

### 1. SQLite - Structured Execution History

**Purpose:** Queryable task execution data for performance analysis

#### Schema
```sql
CREATE TABLE IF NOT EXISTS task_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_type TEXT NOT NULL,
  task_description TEXT,
  tools_used TEXT NOT NULL,
  agents_spawned INTEGER DEFAULT 0,
  success BOOLEAN,
  execution_time_seconds INTEGER,
  token_cost INTEGER,
  parallelization_benefit_seconds INTEGER,
  error_message TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_type ON task_patterns(task_type);
CREATE INDEX idx_success ON task_patterns(success);
CREATE INDEX idx_timestamp ON task_patterns(timestamp);
```

#### Usage Patterns

**Before Planning - Query Similar Tasks:**
```sql
-- Find successful patterns for similar task types
SELECT tools_used, agents_spawned, execution_time_seconds, token_cost
FROM task_patterns 
WHERE task_type LIKE '%refactor%' 
  AND success = 1
ORDER BY execution_time_seconds ASC
LIMIT 5;

-- Check tool success rates
SELECT tools_used, 
       COUNT(*) as total_uses,
       SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes,
       AVG(execution_time_seconds) as avg_time,
       AVG(token_cost) as avg_tokens
FROM task_patterns
WHERE tools_used LIKE '%serena%'
GROUP BY tools_used;

-- Find fastest parallelization strategies
SELECT task_type, parallelization_benefit_seconds, tools_used
FROM task_patterns
WHERE parallelization_benefit_seconds > 120
ORDER BY parallelization_benefit_seconds DESC;
```

**After Execution - Store Results:**
```sql
-- Store successful execution
INSERT INTO task_patterns 
  (task_type, task_description, tools_used, agents_spawned, success, 
   execution_time_seconds, token_cost, parallelization_benefit_seconds, timestamp)
VALUES 
  ('refactor_auth', 'Refactor auth to JWT', 'serena,builder-1,builder-2,tester-fast', 
   4, 1, 1500, 8300, 900, datetime('now'));

-- Store failure for learning
INSERT INTO task_patterns 
  (task_type, tools_used, success, error_message, timestamp)
VALUES 
  ('large_search', 'grep,read', 0, 'Context overflow - should have used Task subagent', 
   datetime('now'));
```

**Analytics Queries:**
```sql
-- Tool performance comparison
SELECT tools_used, 
       AVG(CASE WHEN success = 1 THEN execution_time_seconds END) as avg_success_time,
       COUNT(CASE WHEN success = 0 THEN 1 END) as failure_count
FROM task_patterns
GROUP BY tools_used
ORDER BY failure_count ASC, avg_success_time ASC;

-- Best parallelization ROI
SELECT task_type, 
       AVG(parallelization_benefit_seconds) as avg_time_saved,
       AVG(token_cost) as avg_cost
FROM task_patterns
WHERE parallelization_benefit_seconds > 0
GROUP BY task_type
ORDER BY avg_time_saved DESC;
```

---

### 2. Chroma - Semantic Pattern Matching

**Purpose:** Find similar tasks and plans using semantic search

#### Collections

**Collection: `successful_plans`**
- Stores detailed execution plans that worked
- Used for semantic similarity matching
- Metadata includes tools, complexity, time saved

**Collection: `failed_approaches`**
- Stores plans that failed with error details
- Prevents repeating mistakes
- Metadata includes failure reason, attempted tools

**Collection: `tool_combinations`**
- Stores effective tool synergies
- Documents tool compatibility issues
- Metadata includes use cases, performance metrics

#### Usage Patterns

**Before Planning - Find Similar Tasks:**
```javascript
// Semantic search for similar successful plans
const similar_plans = await chroma_query_documents({
  collection_name: "successful_plans",
  query_texts: ["refactor authentication to use JWT tokens"],
  n_results: 3,
  where: {"complexity": "complex"}  // Optional filter
});

// Check if similar task failed before
const past_failures = await chroma_query_documents({
  collection_name: "failed_approaches",
  query_texts: ["refactor authentication"],
  n_results: 2
});

// Find effective tool combinations
const tool_synergies = await chroma_query_documents({
  collection_name: "tool_combinations",
  query_texts: ["serena code analysis parallel editing"],
  n_results: 3
});
```

**After Execution - Store Patterns:**
```javascript
// Store successful plan
await chroma_add_documents({
  collection_name: "successful_plans",
  documents: [`
    Task: Refactor authentication to JWT
    Tools: serena (find symbols), builder-1,2,3 (parallel editing), tester-fast
    Approach: 3-phase execution with parallel backend edits
    Time: 25 minutes (saved 15 min vs serial)
    Key insight: Serena symbol finding was critical for accuracy
  `],
  ids: [`plan_${Date.now()}`],
  metadatas: [{
    task_type: "refactor",
    complexity: "complex",
    tools: "serena,builder-1,builder-2,builder-3,tester-fast",
    time_saved_minutes: 15,
    token_cost: 8300,
    parallelization: true
  }]
});

// Store failure to avoid repeating
await chroma_add_documents({
  collection_name: "failed_approaches",
  documents: [`
    Task: Search entire codebase for pattern
    Attempted: grep + read (caused context overflow)
    Error: Too many results, exceeded token limit
    Solution: Should have used Task subagent with general type
  `],
  ids: [`failure_${Date.now()}`],
  metadatas: [{
    task_type: "search",
    failed_tools: "grep,read",
    error_type: "context_overflow",
    recommended_alternative: "Task_subagent"
  }]
});

// Store tool combination insight
await chroma_add_documents({
  collection_name: "tool_combinations",
  documents: [`
    Combination: serena find_symbol + builder agents
    Use case: Multi-file refactoring with semantic accuracy
    Benefit: Serena provides precise locations, builders edit in parallel
    Performance: 40% faster than serial, 95% accuracy
  `],
  ids: [`combo_${Date.now()}`],
  metadatas: [{
    primary_tool: "serena",
    secondary_tools: "builder-1,builder-2,builder-3",
    use_case: "refactoring",
    speedup_factor: 1.4
  }]
});
```

**Advanced Queries:**
```javascript
// Find plans with specific metadata filters
const fast_parallel_plans = await chroma_query_documents({
  collection_name: "successful_plans",
  query_texts: ["parallel execution multiple files"],
  n_results: 5,
  where: {
    "$and": [
      {"parallelization": {"$eq": true}},
      {"time_saved_minutes": {"$gt": 10}}
    ]
  }
});

// Get all failures for a specific tool
const tool_failures = await chroma_get_documents({
  collection_name: "failed_approaches",
  where: {"failed_tools": {"$contains": "grep"}},
  limit: 10
});
```

---

### 3. Serena Memory - Project-Specific Context

**Purpose:** Store project-specific orchestration preferences and learnings

#### Memory Files

**File: `orchestration_preferences.md`**
```markdown
# Project Orchestration Preferences

## Tool Preferences
- Prefer serena over grep for symbol searches (Java codebase, LSP is accurate)
- Use jdtls directly for quick syntax checks
- filesystem_read_multiple_files preferred for batch operations

## Known Patterns
- Auth system refactored to JWT on 2025-10-15
- Test suite runs in ~3 minutes with tester-fast
- Frontend uses TypeScript, backend uses Java

## Parallelization History
- 3+ file edits: Always use builder-1,2,3 (saves 30-40% time)
- Research + implementation: Parallel phases work well

## Failure Learnings
- Don't use grep for interface definitions (missed inherited methods)
- Always activate project with serena before symbol operations
- Integration tests must run after unit tests (database dependencies)
```

**File: `tool_performance.md`**
```markdown
# Tool Performance Metrics

## Serena
- Average symbol search: 45 seconds
- Find referencing symbols: 1.5 minutes
- Accuracy: 98% (better than grep's 85%)

## Builders
- Average file edit: 2-3 minutes
- Parallel speedup: 35% for 3 files
- Token cost: ~800-1000 per file

## Tester-Fast
- Full suite: 3 minutes
- Unit tests only: 1 minute
- Very reliable (99% success rate)
```

#### Usage Patterns

**Before Planning - Read Project Context:**
```javascript
// Check project preferences
const preferences = await serena_read_memory("orchestration_preferences");

// Check tool performance history
const performance = await serena_read_memory("tool_performance");

// Adjust recommendations based on project-specific data
if (preferences.includes("Prefer serena")) {
  // Use serena instead of grep for this project
}
```

**After Execution - Update Project Memory:**
```javascript
// Append new learning
await serena_write_memory({
  memory_name: "orchestration_preferences",
  content: `
## Update 2025-10-28
- New caching layer added: Redis-based, invalidation in cache-service.ts
- Cache operations: Use builder-2 for cache layer, tested with tester-fast
- Performance: Cache reduced API response time by 60%
  `
});

// Update performance metrics
await serena_write_memory({
  memory_name: "tool_performance",
  content: `
## Redis Integration Task (2025-10-28)
- researcher-deep: 5 minutes (Redis patterns)
- builder-1,2: 12 minutes parallel (implementation)
- tester-fast: 10 minutes (comprehensive tests)
- Total: 27 minutes (vs estimated 25 minutes, within 10%)
  `
});
```

---

## Integrated Workflow Example

### Complete Memory-Driven Planning Process

```javascript
// STEP 1: Query all memory sources
async function planWithMemory(taskDescription) {
  
  // A. Check sqlite for similar task history
  const sqlHistory = await sqlite_read_query(`
    SELECT * FROM task_patterns 
    WHERE task_type LIKE '%${extractKeywords(taskDescription)}%'
    ORDER BY success DESC, execution_time_seconds ASC
    LIMIT 5
  `);
  
  // B. Semantic search in chroma
  const similarPlans = await chroma_query_documents({
    collection_name: "successful_plans",
    query_texts: [taskDescription],
    n_results: 3
  });
  
  const pastFailures = await chroma_query_documents({
    collection_name: "failed_approaches",
    query_texts: [taskDescription],
    n_results: 2
  });
  
  // C. Check project-specific context (if serena project is active)
  let projectPrefs = null;
  try {
    projectPrefs = await serena_read_memory("orchestration_preferences");
  } catch (e) {
    // No project active or no memory yet
  }
  
  // STEP 2: Synthesize insights
  const insights = {
    successfulTools: extractTools(sqlHistory.filter(t => t.success)),
    failedTools: extractTools(pastFailures),
    avgExecutionTime: average(sqlHistory.map(t => t.execution_time_seconds)),
    projectSpecificPrefs: parsePreferences(projectPrefs),
    similarPlanDetails: similarPlans.documents
  };
  
  // STEP 3: Generate optimized plan based on historical data
  const plan = generatePlan(taskDescription, insights);
  
  // STEP 4: Return plan with confidence score
  return {
    plan: plan,
    confidence: calculateConfidence(insights),
    basedOn: {
      historicalTasks: sqlHistory.length,
      similarPlans: similarPlans.documents.length,
      projectContext: projectPrefs ? true : false
    }
  };
}

// STEP 5: After execution, store to all memory systems
async function storeExecutionResults(task, plan, results) {
  
  // A. Store to sqlite
  await sqlite_write_query(`
    INSERT INTO task_patterns 
    (task_type, task_description, tools_used, agents_spawned, success, 
     execution_time_seconds, token_cost, parallelization_benefit_seconds)
    VALUES 
    ('${task.type}', '${task.description}', '${plan.tools.join(',')}', 
     ${plan.agentCount}, ${results.success}, ${results.actualTime}, 
     ${results.tokenCost}, ${results.timeSaved})
  `);
  
  // B. Store to chroma
  if (results.success) {
    await chroma_add_documents({
      collection_name: "successful_plans",
      documents: [formatPlanForStorage(task, plan, results)],
      ids: [`plan_${Date.now()}`],
      metadatas: [extractMetadata(task, plan, results)]
    });
  } else {
    await chroma_add_documents({
      collection_name: "failed_approaches",
      documents: [formatFailureForStorage(task, plan, results)],
      ids: [`failure_${Date.now()}`],
      metadatas: [{
        error: results.error,
        attempted_tools: plan.tools.join(',')
      }]
    });
  }
  
  // C. Update serena project memory (if applicable)
  if (isProjectActive()) {
    await serena_write_memory({
      memory_name: "orchestration_preferences",
      content: generateProjectUpdate(task, plan, results)
    });
  }
}
```

---

## Memory Maintenance

### Periodic Cleanup
```sql
-- Archive old failed attempts (keep last 100)
DELETE FROM task_patterns 
WHERE success = 0 
  AND id NOT IN (
    SELECT id FROM task_patterns WHERE success = 0 
    ORDER BY timestamp DESC LIMIT 100
  );

-- Remove duplicate patterns (keep best performing)
DELETE FROM task_patterns 
WHERE id NOT IN (
  SELECT MIN(id) FROM task_patterns 
  GROUP BY task_type, tools_used
  HAVING MIN(execution_time_seconds)
);
```

### Chroma Collection Management
```javascript
// Limit collection sizes (keep most relevant)
const count = await chroma_get_collection_count("successful_plans");
if (count > 500) {
  // Archive or delete oldest documents
  // Keep documents with high usage frequency
}
```

### Serena Memory Updates
```javascript
// Periodically summarize project learnings
// Prevent memory files from growing too large
// Archive old patterns, keep recent insights
```

---

## Best Practices

1. **Always query before planning** - Use all three memory systems
2. **Store both successes and failures** - Learn from mistakes
3. **Update incrementally** - Add learnings after each execution
4. **Clean periodically** - Prevent memory bloat
5. **Project-specific optimization** - Use serena memory for per-project tuning
6. **Confidence scoring** - Indicate plan reliability based on historical data
7. **Semantic + structured** - Combine chroma's semantic search with sqlite's structured queries

---

## Performance Benefits

With full memory integration:
- **Planning speed**: 40% faster (leverage past patterns)
- **Accuracy**: 30% improvement (avoid known failures)
- **Optimization**: Continuous improvement over time
- **Project adaptation**: Better recommendations for familiar codebases

---

**Last Updated:** 2025-10-28  
**Version:** 1.0
