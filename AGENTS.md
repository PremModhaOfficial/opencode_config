# Agent Guidelines

## Task Orchestrator (Auto-Spawn for Complex Tasks) ⭐

**PROACTIVELY spawn task-orchestrator subagent when:**
- User describes ≥4 sequential steps
- User mentions "N files" where N ≥ 3
- User says: "parallelize", "optimize", "fastest way", "best approach", "what tools should I use"
- Active todo list with ≥5 items and user mentions time/speed/efficiency
- User asks for tool/approach comparisons
- Task involves multiple subsystems (frontend + backend, testing + implementation, etc.)

**Auto-spawn pattern:**
```javascript
task({
  description: "Plan optimal execution strategy",
  subagent_type: "general",
  prompt: `Use your task-orchestrator skill to create an optimal execution plan.

TASK: [extracted task from user request]

CONTEXT: [codebase info, language, file count, constraints]

PROVIDE:
1. Tool/MCP/LSP/skill recommendations with rationale
2. Dependency tree for parallel execution
3. Subagent spawning strategy
4. Time and token estimates
5. Fallback strategies (for complex tasks)

Check memory first for similar patterns.`
});
```

**After receiving plan:**
- Briefly summarize: tools, timeline, parallelization strategy
- If plan has >5 steps OR spawns ≥3 subagents → **show plan and ask approval**
- Otherwise → **proceed with execution immediately**
- Store results after completion for learning

**Key benefits:**
- Keeps your context focused on execution, not planning
- Learns from past executions (sqlite + chroma + serena memory)
- Optimizes for parallel execution automatically
- Prevents inefficient tool choices

**Example auto-detection:**
```
User: "I need to refactor authentication across 8 files to use JWT"

Your thought process:
→ Detected: "8 files" (≥3 files trigger)
→ Detected: "refactor" (multi-step complexity)
→ ACTION: Auto-spawn task-orchestrator

You: "This looks like a complex multi-file refactor. Let me get an optimal execution plan..."
[Spawn task-orchestrator subagent]
[Receive plan with parallel builders, serena, testing phases]
You: "Plan received: 3-phase execution with parallel file editing, ~25 minutes. Proceeding..."
```

**Skill location:** `~/.config/opencode/skills/task-orchestrator/`
**Documentation:** `SKILL.md`, `memory-patterns.md`, `quick-start.md`, `SUBAGENT_SPAWN.md`

---

## Memory (sqlite MCP)
- **ALWAYS check sqlite before starting any task** to see if similar work exists
- Query format: `SELECT * FROM tasks WHERE description LIKE '%keyword%'`
- Save completed work: `INSERT INTO tasks (description, solution, timestamp)`
- **task-orchestrator uses specialized schema** - see `skills/task-orchestrator/memory-patterns.md`

## Semantic Search (chroma MCP)
- Use for finding similar code patterns or error solutions
- Good for: "Find similar bug fixes", "Search past implementations"
- **task-orchestrator collections:** `successful_plans`, `failed_approaches`, `tool_combinations`

## Code Intelligence (serena MCP)
- **Semantic code analysis** using Language Server Protocol (LSP)
- **Symbol-level operations** for precise code navigation and editing
- **MUST activate project first**: Ask to "Activate the project /path/to/project" or use project name
- **ALWAYS auto-activate current directory**: When user requests Serena operations, automatically activate the current working directory as the project using `serena_activate_project($PWD)` - don't wait for user to specify
- **Key capabilities**:
  - Navigate code by symbols (classes, functions, variables) not just files
  - Find all references to a symbol across the entire codebase
  - Intelligent code editing at symbol level (not line-based)
  - Project memory system for context retention
- **Best for**:
  - Large codebases where finding the right code is difficult
  - Refactoring across multiple files
  - Understanding code structure and dependencies
  - Precise code modifications without breaking context
- **Available tools**:
  - `find_symbol`: Search for functions, classes, methods globally
  - `find_referencing_symbols`: Find where code is used/called
  - `get_symbols_overview`: Get file structure and top-level definitions
  - `replace_symbol_body`: Replace entire function/class definition
  - `insert_after_symbol`/`insert_before_symbol`: Precise insertions
  - `replace_regex`: Regex-based replacement (USE THIS for deleting symbols)
  - `read_memory`/`write_memory`: Project-specific memory storage
  - `onboarding`: Learn project structure on first use
- **IMPORTANT - Deleting code**:
  - **ALWAYS use `replace_regex` for symbol deletion**, not basic `edit` tool
  - Pattern: Match entire symbol including javadoc/comments with `.*?` for body
  - Example: `r"\s*/\*\*.*?Symbol signature.*?}\s*"` → `""`
  - Benefits: LSP-aware, safer, maintains semantic understanding
  - Avoid: Line-based `edit` tool for structural changes
- **Supported languages**: Python, TypeScript/JavaScript, Java, Go, Rust, PHP, C/C++, Ruby, Swift, Kotlin, and 20+ more
- **Pro tip**: For large projects, run `uv run --directory /home/prem-modha/serena serena project index /path/to/project` for faster initial tool usage

## Language Servers (Direct LSP)
- **Available**: Java (jdtls via Eclipse JDT LS), Lua (lua-language-server)
- **When to use vs Serena**:
  - Use **Serena** for: Symbol search, refactoring, semantic operations, cross-file analysis
  - Use **Direct LSP** for: Quick syntax checks, basic completions (if needed)
  - **Prefer Serena** - it wraps LSP with better MCP integration and project memory
- **Java LSP location**: `/home/prem-modha/.local/share/opencode/bin/jdtls/bin/jdtls`
- **Note**: Serena already uses these LSP servers internally, so direct access rarely needed

## Research (deepwiki, search-server)
- deepwiki: Conceptual understanding (algorithms, technologies)
- search-server: Current docs, package versions, API changes

## Filesystem
- Prefer filesystem MCP over bash `cat` for reading files
- Better context awareness and error handling

## Multi-file edits
- When editing 3+ files, suggest spawning builder-2 and builder-3
- Each builder takes different files to work in parallel
