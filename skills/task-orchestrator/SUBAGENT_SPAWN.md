# How to Spawn task-orchestrator Subagent

## Overview

The **task-orchestrator** skill is designed to run as a spawned subagent to keep your main agent's context clean. This document explains how to spawn and use it effectively.

---

## Method 1: Spawn with General Agent (Recommended)

The `general` agent type already has access to all skills and research capabilities needed for orchestration.

### Basic Spawn

```javascript
task({
  description: "Plan task execution",
  subagent_type: "general",
  prompt: `Use your task-orchestrator skill to analyze this task and create an optimal execution plan:

[TASK DESCRIPTION]

Provide:
1. Optimal tool/MCP/LSP/skill combinations
2. Dependency tree for parallel execution
3. Subagent spawning recommendations
4. Time and token cost estimates
5. Fallback strategies`
});
```

### Advanced Spawn (with specific requirements)

```javascript
task({
  description: "Create parallelized execution strategy",
  subagent_type: "general",
  prompt: `Use your task-orchestrator skill.

TASK: Refactor authentication system across 8 files to use JWT tokens

REQUIREMENTS:
- Optimize for speed (parallel execution preferred)
- Token budget: ~10,000 tokens
- Must include testing phase
- Need fallback strategies

PROVIDE:
1. Complete dependency tree (ASCII format)
2. Detailed step-by-step breakdown (table format)
3. Resource allocation (agents, tools, timing)
4. Tool selection rationale
5. Alternative approaches with pros/cons

Check memory first for similar authentication refactoring patterns.`
});
```

---

## Method 2: Todo List Parallelization

When you have an active todo list that needs optimization:

```javascript
task({
  description: "Parallelize todo list",
  subagent_type: "general",
  prompt: `Use your task-orchestrator skill to optimize my current todo list.

ACTIONS NEEDED:
1. Read my active todo list with todoread
2. Analyze dependencies between tasks
3. Create parallelized execution tree
4. Show before/after comparison (serial vs parallel time)
5. Recommend which agents should handle which tasks
6. Provide revised todo list with proper priorities

Output both visual tree and detailed table format.`
});
```

---

## Method 3: Tool Selection Advisory

For specific tool selection questions:

```javascript
task({
  description: "Get tool recommendations",
  subagent_type: "general",
  prompt: `Use your task-orchestrator skill.

QUESTION: What's the best way to find all authentication-related code in a large Java codebase (500+ files)?

ANALYZE:
- Compare: serena vs grep vs Task subagent vs direct search
- Consider: accuracy, speed, token cost
- Check memory for past successful approaches
- Provide exact tool sequences with commands
- Include fallback options

Context: Java Spring Boot application, LSP available via serena.`
});
```

---

## Method 4: Learning from Failures

When an approach fails and you need alternatives:

```javascript
task({
  description: "Analyze failure and suggest alternatives",
  subagent_type: "general",
  prompt: `Use your task-orchestrator skill.

FAILURE REPORT:
Task: Search entire codebase for TODO comments
Attempted approach: Used grep + read multiple files
Result: Context overflow, exceeded token limit

ANALYZE:
1. Why did this approach fail?
2. What should have been used instead?
3. Store this failure pattern to memory
4. Provide corrected execution plan
5. Update recommendations for similar future tasks`
});
```

---

## Response Format Expectations

Based on task complexity, expect:

### Simple Task Response
```markdown
## Execution Plan
**Tool:** [single tool]
**Command:** [exact command]
**Time:** [estimate]
**Cost:** [tokens]

## Rationale
[1-2 sentences]
```

### Medium Task Response
```markdown
## Execution Plan
[Table with steps, tools, dependencies, timing]

## Parallelization Opportunities
[Description of what can run concurrently]

## Alternative Approaches
[2-3 options with pros/cons]
```

### Complex Task Response
```markdown
## Dependency Tree
[ASCII tree visualization]

## Detailed Breakdown
[Comprehensive table with all phases]

## Resource Allocation
[Agents, timing, token budget]

## Tool Selection Rationale
[Why each tool was chosen]

## Parallelization Map
[Timeline visualization]

## Fallback Strategies
[What to do if plan fails]

## Alternative Approaches
[Multiple options compared]
```

---

## Integration Patterns

### Pattern 1: Pre-work Planning

Before starting a complex task, spawn orchestrator first:

```javascript
// STEP 1: Get the plan
const plan = task({
  description: "Plan refactoring work",
  subagent_type: "general",
  prompt: `Use task-orchestrator skill to plan: [TASK]`
});

// STEP 2: Review the plan
// (Agent waits for subagent response)

// STEP 3: Execute based on plan
// Main agent or spawn additional subagents based on recommendations
```

### Pattern 2: Mid-execution Replanning

If a plan is failing mid-execution:

```javascript
task({
  description: "Replan due to failure",
  subagent_type: "general",
  prompt: `Use task-orchestrator skill.

SITUATION: Currently executing task X, but Step 3 failed.
FAILURE: [error details]
COMPLETED: Steps 1, 2
REMAINING: Steps 4, 5, 6

Provide revised plan that:
1. Works around the Step 3 failure
2. Suggests alternative approach
3. Adjusts remaining steps
4. Updates time/resource estimates`
});
```

### Pattern 3: Continuous Learning

After completing a task, report results for learning:

```javascript
task({
  description: "Store execution results",
  subagent_type: "general",
  prompt: `Use task-orchestrator skill to store these execution results:

TASK: [description]
PLAN USED: [tool sequence]
ACTUAL TIME: [minutes]
ACTUAL TOKENS: [count]
SUCCESS: [true/false]
NOTES: [any learnings]

Store to:
1. sqlite (structured history)
2. chroma (semantic patterns)
3. serena memory (if project-specific)`
});
```

---

## Memory Initialization

**First-time use only:** Initialize memory systems before spawning orchestrator:

```javascript
// Initialize sqlite schema
sqlite_create_table(`
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
  )
`);

// Create chroma collections
chroma_create_collection({
  collection_name: "successful_plans",
  embedding_function_name: "default"
});

chroma_create_collection({
  collection_name: "failed_approaches",
  embedding_function_name: "default"
});

chroma_create_collection({
  collection_name: "tool_combinations",
  embedding_function_name: "default"
});
```

---

## Best Practices

### DO ✅
- Spawn as subagent for complex planning (keeps context clean)
- Provide context: codebase size, language, constraints
- Request specific output format if needed
- Report execution results back for learning
- Use for todo list optimization

### DON'T ❌
- Use for trivial single-step tasks (overhead not worth it)
- Spawn without providing task context
- Ignore the recommendations (they improve with usage)
- Forget to initialize memory on first use
- Skip storing execution results (prevents learning)

---

## Example Conversations

### Example 1: Full Workflow

**Main Agent:**
```javascript
task({
  description: "Plan JWT authentication refactor",
  subagent_type: "general",
  prompt: `Use task-orchestrator skill.

Task: Refactor authentication across frontend and backend (8 files total) to use JWT instead of sessions.

Requirements:
- Speed optimized
- Must include testing
- Token budget: 10k

Provide complete execution plan with dependency tree.`
});
```

**Orchestrator Subagent Returns:**
```
## Execution Plan

### Dependency Tree
[Complete tree with 3 phases, parallel execution in Phase 2]

### Detailed Breakdown
[Table showing: researcher-deep, serena, builder-1,2,3, tester-fast]

### Resource Allocation
- 6 subagents, ~25 minutes, ~8300 tokens

### Recommendation: Proceed with 3-phase parallel execution
```

**Main Agent:**
```
Plan received. Executing:
- Spawning researcher-deep for JWT patterns
- Spawning serena for symbol analysis
- (continues execution...)
```

---

### Example 2: Quick Tool Selection

**Main Agent:**
```javascript
task({
  description: "Tool advice",
  subagent_type: "general",
  prompt: `task-orchestrator skill: What's fastest way to find all uses of 'authenticate' function in 200-file TypeScript codebase?`
});
```

**Orchestrator Subagent Returns:**
```
## Tool Recommendation: serena

Command: serena_find_referencing_symbols("authenticate", "path/to/file/with/function.ts")

Rationale:
- serena: Semantic accuracy, finds all true references (95% accurate)
- vs grep: Faster but less accurate (85%), misses indirect calls
- vs Task: Overkill for this focused search

Estimated time: 1-2 minutes
Token cost: ~400 tokens
```

---

## Troubleshooting

### Issue: Subagent doesn't use the skill

**Solution:** Be explicit in the prompt:
```
"Use your task-orchestrator skill to..."
```

### Issue: Too generic recommendations

**Cause:** Not enough context provided
**Solution:** Include codebase size, language, constraints, preferences

### Issue: No memory/learning happening

**Cause:** Memory not initialized or results not stored
**Solution:** Run initialization commands, report execution results

### Issue: Plans seem slow

**Cause:** Not checking memory first
**Solution:** Add "Check memory for similar tasks" to prompt

---

## Quick Reference

| Use Case | Spawn Prompt |
|----------|--------------|
| Complex planning | "Use task-orchestrator: Create plan for [task]" |
| Todo optimization | "Use task-orchestrator: Parallelize my todos" |
| Tool selection | "Use task-orchestrator: Best tool for [need]?" |
| Failure recovery | "Use task-orchestrator: Plan failed at [step], alternatives?" |
| Learning storage | "Use task-orchestrator: Store these results [details]" |

---

**Created:** 2025-10-28  
**Version:** 1.0  
**Skill Location:** `~/.config/opencode/skills/task-orchestrator/`
