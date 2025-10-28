---
name: task-orchestrator
description: Expert in analyzing tasks and creating optimal execution plans using available tools (MCP servers, LSP tools, skills, subagents). Converts serial task lists into parallel dependency trees, suggests tool combinations, and provides orchestration strategies. Designed to run as a spawned subagent to avoid context pollution.
---

# task-orchestrator

## Purpose

This skill enables an agent to become an expert orchestrator that:
- Analyzes task requirements and suggests optimal tool/MCP/LSP/skill combinations
- Converts serial todo lists into parallelized dependency trees
- Recommends subagent spawning strategies for complex workflows
- Provides detailed execution plans with tool sequences and rationale
- Learns from past executions and continuously improves recommendations

**IMPORTANT:** This skill is designed to run as a **spawned subagent** to keep the main agent's context clean and focused on actual work.

## When to Use This Skill

Invoke this skill when you need to:
- Plan how to approach a complex multi-step task
- Determine which tools/MCPs/LSPs are best for a given job
- Convert a linear todo list into a parallel execution strategy
- Decide whether to spawn subagents and how many
- Optimize task execution for speed and resource efficiency
- Get recommendations on tool orchestration sequences
- Analyze task dependencies and create execution graphs

## Core Capabilities

### 1. Task Analysis & Tool Selection
- Analyze task requirements and complexity
- Recommend optimal tools from: MCP servers, LSP tools, skills, CLI tools, subagents
- Provide rationale for each tool selection
- Consider tool compatibility and synergies
- Warn about conflicts or redundant tools

### 2. Dependency Tree Generation
- Convert serial task lists → parallel dependency trees
- Identify tasks that can run concurrently
- Map task dependencies accurately
- Optimize for maximum parallelization
- Output in multiple formats (ASCII tree, tables, JSON)

### 3. Subagent Orchestration
- Recommend when to spawn subagents (builder-1, builder-2, builder-3, etc.)
- Suggest agent types based on task nature
- Consider token budget and resource constraints
- Balance parallel execution vs context sharing
- Provide agent coordination strategies

### 4. Resource Optimization
- Estimate token costs for different approaches
- Consider system load and resource constraints
- Optimize for speed vs accuracy trade-offs
- Suggest cheaper models for simple tasks
- Balance parallelization benefits vs overhead

### 5. Adaptive Decision Making
- **Simple tasks**: Auto-decide optimal approach (fast, opinionated)
- **Medium tasks**: Provide top 2-3 options with pros/cons
- **Complex tasks**: Detailed analysis with multiple strategies

### 6. Memory & Learning
Store and learn from execution patterns using:
- **sqlite**: Queryable execution history (success rates, timings, costs)
- **chroma**: Semantic pattern matching (find similar past tasks)
- **serena**: Project-specific preferences and optimizations

### 7. Error Handling & Replanning
- Detect when execution plans are failing
- Suggest alternative approaches dynamically
- Provide fallback strategies for tool failures
- Auto-adjust parallelization if dependencies fail

## Instructions

### Step 1: Understand the Request
When invoked, first determine:
1. Is there an active todo list to analyze? (check with todoread)
2. Is this a standalone task description?
3. What is the task complexity? (simple/medium/complex)
4. What is the context? (coding, research, debugging, refactoring, etc.)

### Step 2: Query Memory for Similar Tasks
Before planning, check memory:

```bash
# Check sqlite for similar successful patterns
sqlite_read_query("SELECT * FROM task_patterns WHERE task_type LIKE '%<keyword>%' AND success = 1 ORDER BY timestamp DESC LIMIT 5")

# Query chroma for semantically similar tasks
chroma_query_documents(collection_name="successful_plans", query_texts=["<task description>"], n_results=3)

# Check serena memory for project-specific patterns (if project is active)
serena_read_memory(memory_file_name="orchestration_preferences")
```

### Step 3: Analyze Available Tools
Consider ALL available tools:

**MCP Servers:**
- `sqlite`: Task history, structured data storage
- `chroma`: Semantic search, vector embeddings
- `filesystem`: File operations (read, write, list, search)
- `search-server`: Web search, scraping, extraction
- `deepwiki`: Documentation research

**LSP Tools (via serena or direct):**
- `serena`: Semantic code analysis (find_symbol, find_referencing_symbols, etc.)
- Direct LSP: Java (jdtls), Lua (lua-language-server)

**CLI Tools:**
- `bash`: Shell commands, system operations
- `read`: File reading
- `edit`: File editing (exact string replacement)
- `write`: File creation
- `glob`: Pattern-based file search
- `grep`: Content search with regex
- `todowrite/todoread`: Task management

**Subagent Types:**
- `general`: Research, complex searches, multi-step tasks
- `builder-1/2/3`: Parallel file editing (spawn multiple for 3+ files)
- `tester-fast`: Rapid test execution
- `researcher-deep`: Web research
- `researcher-docs`: Documentation reading
- `debugger-logic`: Complex bug analysis
- `architect`: High-level design decisions
- `memory-manager`: Background context/learning management

### Step 4: Create Execution Plan
Based on complexity, output:

**For SIMPLE tasks (1-2 steps, single tool):**
```markdown
## Execution Plan

**Approach:** [Direct/Single-tool]
**Tool:** [tool name]
**Command:** [specific command/sequence]
**Estimated time:** [seconds/minutes]
**Token cost:** [low/medium/high]

## Rationale
[1-2 sentences why this is optimal]
```

**For MEDIUM tasks (3-5 steps, multiple tools):**
```markdown
## Execution Plan

| Step | Action | Tools | Dependencies | Est. Time |
|------|--------|-------|--------------|-----------|
| 1    | ...    | ...   | None         | 30s       |
| 2    | ...    | ...   | Step 1       | 1m        |
| 3    | ...    | ...   | Step 1       | 45s       |

## Parallelization Opportunities
- Steps 2 and 3 can run concurrently after Step 1 completes

## Tool Selection Rationale
- **[Tool 1]**: [Why chosen over alternatives]
- **[Tool 2]**: [Synergy with Tool 1]

## Alternative Approaches
1. [Option B]: [Pros/Cons]
2. [Option C]: [Pros/Cons]
```

**For COMPLEX tasks (6+ steps, subagents needed):**
```markdown
## Execution Plan

### Dependency Tree
```
Main Task
├── Phase 1: Research
│   ├── [researcher-deep] Web API docs (parallel)
│   └── [serena] Analyze codebase structure (parallel)
├── Phase 2: Implementation (after Phase 1)
│   ├── [builder-1] Edit file_a.ts (parallel)
│   ├── [builder-2] Edit file_b.ts (parallel)
│   └── [builder-3] Edit file_c.ts (parallel)
└── Phase 3: Validation (after Phase 2)
    └── [tester-fast] Run test suite
```

### Detailed Step Breakdown
| Phase | Step | Agent/Tool | Action | Dependencies | Est. Time | Tokens |
|-------|------|------------|--------|--------------|-----------|--------|
| 1     | 1a   | researcher-deep | Fetch API docs | None | 2m | 500 |
| 1     | 1b   | serena | Find symbol definitions | None | 1m | 300 |
| 2     | 2a   | builder-1 | Implement feature in file_a | 1a,1b | 3m | 800 |
| 2     | 2b   | builder-2 | Update tests in file_b | 1a,1b | 2m | 600 |
| 2     | 2c   | builder-3 | Add types in file_c | 1a,1b | 2m | 600 |
| 3     | 3a   | tester-fast | Run full test suite | 2a,2b,2c | 5m | 200 |

### Resource Allocation
- **Total agents:** 5 subagents (2 parallel in Phase 1, 3 parallel in Phase 2)
- **Peak parallelization:** 3 concurrent agents (Phase 2)
- **Estimated total time:** ~10 minutes (vs ~15 minutes serial)
- **Token budget:** ~3000 tokens total

### Tool Selection Rationale
- **researcher-deep vs deepwiki**: Real-time API docs needed, not conceptual
- **serena vs grep**: Semantic symbol analysis more accurate than text search
- **3x builders**: 3 files modified, parallel editing saves 5+ minutes
- **tester-fast vs bash**: Optimized for rapid test iteration

### Fallback Strategies
- If serena unavailable → Use grep + read combination
- If builders fail → Main agent sequential editing
- If tests fail → Spawn debugger-logic for analysis

### Parallelization Map
```
Timeline:
0m ────[researcher-deep]────────┐
0m ────[serena]─────────────────┤
                                 ├─→ 2m (Phase 1 complete)
2m ────[builder-1]──────────────┐
2m ────[builder-2]──────────────┤
2m ────[builder-3]──────────────┤
                                 ├─→ 5m (Phase 2 complete)
5m ────[tester-fast]────────────┘
                                 └─→ 10m (Complete)
```

## Alternative Approaches
1. **Serial execution**: Simpler, no coordination overhead, but ~15m vs 10m
2. **Fewer agents**: Use 1 builder for all files, saves tokens but slower
3. **More upfront research**: Add deepwiki + researcher-docs, more thorough but adds 3m
```

### Step 5: Store Results to Memory
After providing the plan, store it for future learning:

```javascript
// Store to sqlite
sqlite_write_query(`
  INSERT INTO task_patterns (task_type, tools_used, agents_spawned, success, execution_time_seconds, token_cost, timestamp)
  VALUES ('<type>', '<tools>', <count>, NULL, NULL, NULL, datetime('now'))
`)

// Store to chroma
chroma_add_documents(
  collection_name="orchestration_plans",
  documents=["<detailed plan>"],
  ids=["plan_<timestamp>"],
  metadatas=[{"task_type": "<type>", "complexity": "<level>", "tools": "<list>"}]
)

// Store to serena (if project-specific)
serena_write_memory(
  memory_name="orchestration_patterns",
  content="<append pattern learned>"
)
```

### Step 6: Integration Modes

**Standalone Mode:**
- User provides task description directly
- Analyze and plan from scratch
- Return complete execution strategy

**Todo Integration Mode:**
- Read active todo list with todoread
- Analyze current serial task structure
- Output parallelized dependency tree
- Show before/after comparison

### Step 7: Output Format Selection

Choose format based on complexity:
- **1-2 steps**: Markdown bullet list
- **3-5 steps**: Markdown table
- **6+ steps**: ASCII tree + detailed table + optional JSON

Always include:
- Tool selection rationale
- Dependency information
- Time/token estimates
- Alternative approaches (for medium/complex)
- Fallback strategies (for complex)

## Key Decision Frameworks

### When to Spawn Subagents?
✅ **YES** if:
- 3+ files need editing simultaneously
- Distinct task phases that don't share context
- Research + implementation can happen in parallel
- Task will take >5 minutes and has parallelizable steps

❌ **NO** if:
- Single file edit
- Sequential dependencies throughout
- Token budget is very limited
- Task requires tight context sharing

### Tool Selection Priority
1. **Serena** for semantic code operations (if LSP language)
2. **Chroma** for finding similar patterns/solutions
3. **Filesystem MCP** over bash for file operations
4. **Task subagent** for complex multi-step research
5. **Direct tools** for simple one-off operations

### Parallelization Decision
Calculate: `Parallel_benefit = Serial_time - (Max_parallel_phase_time + Coordination_overhead)`

Parallelize if:
- Benefit > 2 minutes
- Clear dependency boundaries
- No shared state conflicts
- Token budget allows

## Examples

### Example 1: Simple Task
**User Input:** "Read the config.json file and tell me the database host"

**Output:**
```markdown
## Execution Plan

**Approach:** Single-tool direct read
**Tool:** filesystem_read_text_file
**Command:** `filesystem_read_text_file(path="./config.json")`
**Estimated time:** 5 seconds
**Token cost:** Low (~50 tokens)

## Rationale
Direct file read is fastest. No parsing needed, user will extract host manually. Alternative (bash cat) is slower and less integrated.
```

---

### Example 2: Medium Task
**User Input:** "Find all TODO comments in the codebase and create a summary report"

**Output:**
```markdown
## Execution Plan

| Step | Action | Tools | Dependencies | Est. Time |
|------|--------|-------|--------------|-----------|
| 1    | Search for TODO comments | grep | None | 30s |
| 2    | Read matching files | filesystem_read_multiple_files | Step 1 | 45s |
| 3    | Generate summary report | (main agent logic) | Step 2 | 1m |

## Tool Selection Rationale
- **grep over bash**: Integrated, regex support, file filtering
- **read_multiple_files**: Batch read for efficiency vs sequential reads
- **No subagent needed**: Simple aggregation, main agent can handle

## Alternative Approaches
1. **bash find + xargs**: Faster for huge codebases (1000+ files) but less integrated
2. **Task subagent**: Overkill for this simple search-and-summarize task

## Estimated Total Time: ~2 minutes
## Token Cost: Medium (~300 tokens)
```

---

### Example 3: Complex Task
**User Input:** "Refactor the authentication system to use JWT tokens instead of sessions. There are 8 files involved across frontend and backend."

**Output:**
```markdown
## Execution Plan

### Dependency Tree
```
JWT Refactor
├── Phase 1: Research & Planning
│   ├── [researcher-deep] JWT best practices (parallel)
│   ├── [serena] Find all auth-related symbols (parallel)
│   └── [serena] Find referencing code (parallel)
├── Phase 2: Backend Implementation
│   ├── [builder-1] auth-service.ts (parallel)
│   ├── [builder-2] middleware.ts (parallel)
│   └── [builder-3] user-controller.ts (parallel)
├── Phase 3: Frontend Implementation (after Phase 2)
│   ├── [builder-1] auth-context.tsx (parallel)
│   ├── [builder-2] api-client.ts (parallel)
│   └── [general] Update remaining 3 UI files
└── Phase 4: Testing & Validation
    ├── [tester-fast] Backend tests
    └── [tester-fast] Integration tests
```

### Detailed Step Breakdown
| Phase | Step | Agent/Tool | Action | Dependencies | Est. Time | Tokens |
|-------|------|------------|--------|--------------|-----------|--------|
| 1     | 1a   | researcher-deep | Research JWT patterns | None | 3m | 600 |
| 1     | 1b   | serena | find_symbol("auth") | None | 1m | 200 |
| 1     | 1c   | serena | find_referencing_symbols | 1b | 2m | 400 |
| 2     | 2a   | builder-1 | Refactor auth service | 1a,1b,1c | 5m | 1200 |
| 2     | 2b   | builder-2 | Update middleware | 1a,1b,1c | 4m | 1000 |
| 2     | 2c   | builder-3 | Update controller | 1a,1b,1c | 4m | 1000 |
| 3     | 3a   | builder-1 | Update React context | 2a,2b,2c | 4m | 900 |
| 3     | 3b   | builder-2 | Update API client | 2a,2b,2c | 3m | 800 |
| 3     | 3c   | general | Update UI components | 2a,2b,2c | 6m | 1500 |
| 4     | 4a   | tester-fast | Run backend tests | 2a,2b,2c | 3m | 300 |
| 4     | 4b   | tester-fast | Run integration tests | 3a,3b,3c | 5m | 400 |

### Resource Allocation
- **Total agents:** 6 subagents (3 in Phase 1, 3 in Phase 2/3, 2 in Phase 4)
- **Peak parallelization:** 3 concurrent agents (Phases 2 & 3)
- **Estimated total time:** ~25 minutes (vs ~40 minutes serial)
- **Token budget:** ~8300 tokens total

### Tool Selection Rationale
- **serena vs grep**: Auth code needs semantic understanding (class hierarchies, method calls)
- **researcher-deep vs deepwiki**: Need current JWT security best practices, not just concepts
- **3x builders (Phase 2)**: Backend files are independent, safe to edit in parallel
- **2x builders + general (Phase 3)**: Frontend has shared types, use general for coordinated UI updates
- **tester-fast**: Optimized for rapid test execution

### Fallback Strategies
- If serena unavailable → Use grep with pattern matching (slower, less accurate)
- If builders conflict → Serialize Phase 2 editing
- If tests fail Phase 4a → Don't proceed to 4b, spawn debugger-logic

### Parallelization Map
```
Timeline:
0m ────[researcher-deep]────────┐
0m ────[serena 1b]──────────────┤
0m ────[serena 1c]──────────────┤
                                 ├─→ 3m (Phase 1 complete)
3m ────[builder-1: backend]─────┐
3m ────[builder-2: backend]─────┤
3m ────[builder-3: backend]─────┤
                                 ├─→ 8m (Phase 2 complete)
8m ────[builder-1: frontend]────┐
8m ────[builder-2: frontend]────┤
8m ────[general: UI updates]────┤
                                 ├─→ 14m (Phase 3 complete)
14m ───[tester-fast: backend]───┐
19m ───[tester-fast: integration]
                                 └─→ 24m (Complete)
```

### Memory Storage Plan
After execution, store:
- **sqlite**: JWT refactor pattern, 8 files, 6 agents, ~25m, ~8300 tokens
- **chroma**: Detailed plan + tools used for semantic lookup
- **serena**: "Project prefers JWT over sessions, auth system refactored YYYY-MM-DD"

## Alternative Approaches
1. **Serial execution**: Main agent does all, simpler but ~40m vs ~25m (15m slower)
2. **Fewer agents (2 builders)**: Less coordination, but ~30m execution time
3. **More research phase**: Add deepwiki + researcher-docs for comprehensive JWT study, adds 5m but more thorough
4. **Architect consultation**: Spawn architect first for design review, adds 10m but reduces risk of major refactor issues
```

---

### Example 4: Todo List Parallelization
**User Input (with active todos):**
```
[Current Todo List - Serial]
1. Research Redis caching strategies
2. Implement cache layer in API
3. Add cache invalidation logic
4. Update API documentation
5. Write unit tests for cache
6. Write integration tests
7. Update README
```

**Output:**
```markdown
## Parallelized Dependency Tree

### Current Structure (Serial): ~40 minutes
```
1 → 2 → 3 → 4 → 5 → 6 → 7
```

### Optimized Structure (Parallel): ~25 minutes
```
Root
├── Phase 1: Research (0-5m)
│   └── [1] Research Redis strategies
│
├── Phase 2: Implementation (5-15m) [depends on Phase 1]
│   ├── [2] Implement cache layer ────┐
│   └── [3] Add invalidation logic ────┤ (parallel)
│
├── Phase 3: Testing (15-25m) [depends on Phase 2]
│   ├── [5] Unit tests ────┐
│   └── [6] Integration tests ────┤ (parallel)
│
└── Phase 4: Documentation (15-25m) [depends on Phase 2, parallel with Phase 3]
    ├── [4] API docs ────┐
    └── [7] README ────┤ (parallel)
```

### Revised Todo List
| Priority | Task | Dependencies | Agent/Tool | Est. Time |
|----------|------|--------------|------------|-----------|
| 1        | Research Redis strategies | None | researcher-deep | 5m |
| 2        | Implement cache layer | Task 1 | builder-1 | 7m |
| 3        | Add invalidation logic | Task 1 | builder-2 | 5m |
| 4        | Write unit tests | Tasks 2,3 | builder-1 (reuse) | 6m |
| 5        | Write integration tests | Tasks 2,3 | builder-2 (reuse) | 8m |
| 6        | Update API docs | Tasks 2,3 | general | 4m |
| 7        | Update README | Tasks 2,3 | general | 3m |

### Execution Strategy
**Phase 1 (0-5m):**
- Spawn researcher-deep for Redis research

**Phase 2 (5-15m):**
- Spawn builder-1 for cache layer implementation
- Spawn builder-2 for invalidation logic (parallel)

**Phase 3 & 4 (15-25m):**
- builder-1 continues with unit tests
- builder-2 continues with integration tests
- general agent handles docs (parallel with testing)

### Time Savings
- **Serial**: 40 minutes
- **Parallel**: 25 minutes
- **Savings**: 15 minutes (37.5% faster)

### Tool Justification
- **researcher-deep**: Real-world Redis patterns, not just concepts
- **2x builders**: Implementation files are independent
- **general for docs**: Low complexity, doesn't need specialist
```

## Memory Integration Examples

### Querying Past Patterns
```javascript
// Before planning a "refactor authentication" task
const similar = await chroma_query_documents({
  collection_name: "successful_plans",
  query_texts: ["refactor authentication system"],
  n_results: 3
});

// Check what worked before
const history = await sqlite_read_query(`
  SELECT tools_used, agents_spawned, execution_time_seconds 
  FROM task_patterns 
  WHERE task_type LIKE '%refactor%' AND success = 1
  ORDER BY execution_time_seconds ASC
  LIMIT 5
`);
```

### Storing New Patterns
```javascript
// After successful execution
await sqlite_write_query(`
  INSERT INTO task_patterns 
  (task_type, tools_used, agents_spawned, success, execution_time_seconds, token_cost, timestamp)
  VALUES 
  ('refactor_auth', 'serena,builder-1,builder-2,tester-fast', 4, 1, 1500, 8300, datetime('now'))
`);

await chroma_add_documents({
  collection_name: "successful_plans",
  documents: [detailed_plan_text],
  ids: [`plan_${Date.now()}`],
  metadatas: [{
    task_type: "refactor",
    complexity: "complex",
    tools: "serena,builder-1,builder-2,tester-fast",
    time_saved_minutes: 15
  }]
});
```

## Advanced Techniques

### Dynamic Replanning
If during execution a plan fails:
1. Detect failure signal (error message, timeout, etc.)
2. Query memory for alternative approaches
3. Suggest modified plan with fallback tools
4. Store failure pattern to avoid repeating

### Context-Aware Recommendations
```javascript
// Check project context
const project_prefs = await serena_read_memory("orchestration_preferences");

// Adjust recommendations based on:
// - Language (prefer serena for Java, direct jdtls less useful via MCP)
// - Codebase size (prefer Task for large codebases)
// - Past tool success rates in this project
```

### Token Budget Optimization
```javascript
// If token budget is constrained:
// - Use tester-fast instead of builder for testing
// - Use grep instead of Task subagent for simple searches
// - Reduce parallelization to save agent spawn overhead
// - Prefer filesystem MCP over bash (more efficient)
```

## Notes

- **Always check memory first** before planning (sqlite + chroma + serena)
- **Prefer adaptive output** - match detail level to task complexity
- **Store all plans** for continuous learning
- **Consider token costs** in all recommendations
- **Balance speed vs accuracy** based on task criticality
- **Update memory** after every execution (success or failure)
- **This skill runs as a subagent** - keep recommendations focused on orchestration, not implementation details

## Continuous Improvement

This skill gets better over time by:
1. Learning which tool combinations work best
2. Identifying patterns in successful parallelizations
3. Building project-specific optimization knowledge
4. Refining time/token cost estimates
5. Discovering tool synergies and conflicts

The more it's used, the more accurate and efficient its recommendations become.

---

**Created:** 2025-10-28  
**Version:** 1.0  
**Designed for:** OpenCode CLI subagent orchestration
