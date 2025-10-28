# Quick Start Guide

## Setup Instructions

### 1. Initialize SQLite Database

First time using the skill? Initialize the database schema:

```javascript
// Run this once to create the task_patterns table
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

// Create indexes for faster queries
sqlite_write_query("CREATE INDEX IF NOT EXISTS idx_task_type ON task_patterns(task_type)");
sqlite_write_query("CREATE INDEX IF NOT EXISTS idx_success ON task_patterns(success)");
sqlite_write_query("CREATE INDEX IF NOT EXISTS idx_timestamp ON task_patterns(timestamp)");
```

### 2. Initialize Chroma Collections

```javascript
// Create collection for successful plans
chroma_create_collection({
  collection_name: "successful_plans",
  embedding_function_name: "default",
  metadata: {
    description: "Proven orchestration plans that worked",
    created: new Date().toISOString()
  }
});

// Create collection for failed approaches
chroma_create_collection({
  collection_name: "failed_approaches",
  embedding_function_name: "default",
  metadata: {
    description: "Failed attempts to learn from",
    created: new Date().toISOString()
  }
});

// Create collection for tool combinations
chroma_create_collection({
  collection_name: "tool_combinations",
  embedding_function_name: "default",
  metadata: {
    description: "Effective tool synergies and compatibility",
    created: new Date().toISOString()
  }
});
```

### 3. Activate Serena Project (Optional)

For project-specific optimizations:

```bash
# Activate your project
serena_activate_project("/path/to/your/project")

# Or use project name if registered
serena_activate_project("my-project")
```

---

## How to Use the Skill

### Method 1: Spawn as Subagent (Recommended)

```javascript
// From your main agent, spawn task-orchestrator subagent
task({
  description: "Plan task execution strategy",
  subagent_type: "general",  // Or appropriate type
  prompt: `
    I need help planning the optimal execution strategy for this task:
    
    [YOUR TASK DESCRIPTION HERE]
    
    Use your task-orchestrator skill to:
    1. Analyze the task and suggest optimal tools
    2. Create a dependency tree for parallel execution
    3. Recommend subagent spawning strategy
    4. Provide detailed execution plan with time/token estimates
  `
});
```

### Method 2: Direct Invocation (if skill is active)

Simply describe your planning need:

```
"I need to refactor 8 files to use JWT authentication. What's the optimal execution strategy?"

"Convert my current todo list into a parallelized execution tree"

"What's the best way to search the entire codebase for authentication patterns?"
```

---

## Example Usage Scenarios

### Scenario 1: Planning a Complex Task

**User:**
```
Plan how to implement a new caching layer with Redis across frontend and backend
```

**task-orchestrator will:**
1. Query memory for similar caching implementations
2. Analyze available tools (serena, builders, researcher-deep, etc.)
3. Create dependency tree with parallel execution phases
4. Estimate time and token costs
5. Provide detailed step-by-step plan
6. Store plan for future reference

---

### Scenario 2: Optimizing a Serial Todo List

**User:**
```
I have these tasks:
1. Research Redis patterns
2. Implement cache layer
3. Add invalidation logic
4. Write tests
5. Update docs

Can you parallelize this?
```

**task-orchestrator will:**
1. Analyze dependencies between tasks
2. Identify parallelization opportunities
3. Create visual dependency tree
4. Show time savings (serial vs parallel)
5. Recommend agents for each phase
6. Provide revised todo list with priorities

---

### Scenario 3: Tool Selection Advice

**User:**
```
I need to find all authentication-related code in a large Java codebase. What's the best approach?
```

**task-orchestrator will:**
1. Compare tools: serena vs grep vs Task subagent
2. Consider codebase size and language
3. Check memory for past successful approaches
4. Recommend: serena for semantic accuracy
5. Provide exact tool sequence with commands
6. Suggest fallbacks if primary tool fails

---

## Testing the Skill

### Test 1: Simple Task
```
Prompt: "What's the fastest way to read a config.json file?"
Expected: Single-tool recommendation (filesystem_read_text_file)
```

### Test 2: Medium Complexity
```
Prompt: "Find all TODO comments and create a summary"
Expected: Multi-step plan with grep + filesystem_read_multiple_files
```

### Test 3: Complex Task
```
Prompt: "Refactor authentication across 8 files to use JWT"
Expected: Full dependency tree, multiple builders, time estimates, phases
```

### Test 4: Todo Parallelization
```
Prompt with active todos: "Parallelize my current todo list"
Expected: Dependency tree, revised priorities, time savings analysis
```

---

## Verification Commands

Check if setup is complete:

```javascript
// Verify sqlite table
sqlite_read_query("SELECT name FROM sqlite_master WHERE type='table' AND name='task_patterns'");

// List chroma collections
chroma_list_collections();

// Check serena memories (if project active)
serena_list_memories();
```

---

## Troubleshooting

### Issue: "Collection not found"
**Solution:** Run chroma_create_collection for missing collections

### Issue: "Table doesn't exist"
**Solution:** Run sqlite_create_table with schema from setup

### Issue: No project-specific recommendations
**Solution:** Activate serena project with serena_activate_project

### Issue: Plans seem generic
**Solution:** Use the skill more - it learns over time from stored patterns

---

## Best Practices

1. **Spawn as subagent** - Keeps main context clean
2. **Provide context** - Mention codebase size, language, constraints
3. **Store results** - Always record execution outcomes for learning
4. **Query memory first** - Check past patterns before planning
5. **Update preferences** - Keep serena memory current with project changes

---

## Advanced Usage

### Custom Tool Preferences

Tell the orchestrator your preferences:

```
"For this project, prefer filesystem MCP over bash commands"
"Always use serena for Java code, it's more accurate than grep"
"Token budget is limited, optimize for cost over speed"
```

### Learning from Failures

Report failures to improve future recommendations:

```
"The grep approach you suggested caused context overflow. What should I have used instead?"
```

The skill will:
1. Store the failure pattern
2. Suggest the correct alternative
3. Update memory to avoid repeating the mistake

---

## Skill Evolution

This skill gets smarter over time:

- **Week 1:** Basic recommendations based on tool capabilities
- **Week 2:** Starts learning project preferences
- **Month 1:** Accurate time/cost estimates based on your codebase
- **Month 3:** Highly optimized, project-specific recommendations

The more you use it, the better it gets!

---

**Quick Reference Card**

| Need | Spawn with Prompt |
|------|-------------------|
| Plan complex task | "Create execution plan for [task]" |
| Parallelize todos | "Convert my todos to parallel execution tree" |
| Tool selection | "What's the best tool for [specific need]?" |
| Optimize strategy | "Optimize this plan for speed/cost" |
| Learn from failure | "This approach failed: [details]. What should I do?" |

---

**Need Help?**

Read the full documentation:
- `SKILL.md` - Complete capability reference
- `memory-patterns.md` - Deep dive into memory integration
- This file - Quick start and common scenarios

**Created:** 2025-10-28  
**Version:** 1.0
