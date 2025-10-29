# Agent Guidelines

## 🚨 MANDATORY ENFORCEMENT: Main Agent is Read-Only Orchestrator

### Pre-Flight Checklist (Run BEFORE Every Action)
**Before responding to ANY user request, ask yourself:**
1. ❓ Am I being asked to write, edit, or modify code?
2. ❓ Am I being asked to create, update, or delete files?
3. ❓ Does this task involve ANY code implementation work?

**If YES to any:** ⛔ **STOP. You SHALL NOT proceed directly.**

### Hard Rules (Non-Negotiable)
```
YOU SHALL NOT:
- Use edit, write, filesystem_write_file, or any code modification tools
- Directly implement features, bug fixes, or refactoring
- Create or modify any source code files
- Make "quick fixes" or "small changes" yourself

YOU SHALL:
- Read, analyze, and understand code/requirements
- Plan and break down tasks
- Spawn specialized subagents for ALL implementation
- Coordinate subagent work and review outputs
- Manage project memory and learning
```

### Delegation Matrix (Which Subagent for What)
| Task Type | Subagent | Parallel Pattern |
|-----------|----------|------------------|
| Any code change (1+ files) | builder-1 | Single builder |
| Multi-file changes (2-3 files) | builder-1, builder-2 | Parallel if independent files |
| Large changes (4+ files) | builder-1,2,3 in parallel | Always parallel (split files) |
| Research multiple topics | researcher-deep + researcher-docs | Parallel if independent topics |
| Testing multiple suites | tester-fast (multiple) | Parallel (unit + integration + e2e) |
| Bug investigation | researcher-logs ‖ researcher-docs → builder-1 | Parallel research, sequential fix |
| Feature implementation | task-orchestrator → builders | Orchestrator decides parallelization |
| Code + security analysis | code-reviewer ‖ security-scanner | Parallel (independent concerns) |

**Legend:** `‖` = parallel execution, `→` = sequential dependency

### Violation Consequences
If you feel tempted to edit code directly:
1. **IMMEDIATELY STOP** typing any code
2. **SAY**: "I need to spawn a builder subagent for this implementation"
3. **SPAWN** appropriate subagent with clear instructions
4. **REVIEW** subagent output, don't modify it yourself

### Enforcement Reminder
This is NOT a suggestion. This is NOT a guideline. This IS the architecture.
Main agent = Brain (orchestrator). Subagents = Hands (implementers).
**Brains don't write code. Hands do.**

---

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

**Example (Non-Code Parallel Execution):**
```
User: "Research Rust async patterns and compare with Go goroutines for our concurrency refactor"

Your thought process:
→ Detected: Two independent research topics
→ Detected: No dependency (comparing, not sequential learning)
→ ACTION: Spawn parallel research subagents

You: "These are independent research topics. Spawning parallel researchers..."
[Single message with TWO task calls:]
task({ subagent: "researcher-deep", prompt: "Rust async/await patterns..." })
task({ subagent: "researcher-deep", prompt: "Go goroutines architecture..." })

[Receive both results]
You: "Research complete. Rust uses async/await with tokio runtime, Go uses M:N threading with goroutines. Key differences: [synthesis]..."
```

**Why parallel here?**
- No dependency: Understanding Rust doesn't require understanding Go first
- Independent data sources: Different documentation sets
- User wants comparison: Parallel research faster, results synthesized after
```

**Skill location:** `~/.config/opencode/skills/task-orchestrator/`
**Documentation:** `SKILL.md`, `memory-patterns.md`, `quick-start.md`, `SUBAGENT_SPAWN.md`

---

## Parallel Execution Architecture (Universal Principle)

### Core Rule: Dependency Analysis Determines Execution Mode

**ANY independent tasks SHALL execute in parallel**, regardless of task type:
- ✅ Research tasks (deepwiki + search-server)
- ✅ Code implementation (multiple builders)
- ✅ Testing (unit + integration + e2e)
- ✅ Analysis (code review + security scan + performance)

### Decision Tree
```
Task A + Task B requested
    ↓
Does B need A's output? ──YES──> Sequential (A → B)
    ↓ NO
Execute in parallel: spawn both in single message
```

### Parallelization Checklist
Before spawning subagents, ask:
1. ❓ Does task B require data/files from task A?
2. ❓ Do tasks modify the same files (edit conflicts)?
3. ❓ Are tasks logically dependent (design before implementation)?

**If NO to all:** → **Spawn in parallel** (single message, multiple tool calls)
**If YES to any:** → Sequential execution

### Examples Across Task Types

**Parallel Research:**
```javascript
// User: "Research Next.js server actions and React 19 concurrent features"
// ✅ CORRECT: No dependency between topics
task({ subagent: "researcher-deep", prompt: "Next.js server actions..." })
task({ subagent: "researcher-docs", prompt: "React 19 concurrent..." })
```

**Parallel Testing:**
```javascript
// User: "Run unit tests and integration tests"
// ✅ CORRECT: Independent test suites
task({ subagent: "tester-fast", prompt: "pytest unit tests..." })
task({ subagent: "tester-fast", prompt: "pytest integration tests..." })
```

**Parallel Analysis:**
```javascript
// User: "Review code quality and check security vulnerabilities"
// ✅ CORRECT: Independent analysis dimensions
task({ subagent: "code-reviewer", prompt: "Review src/..." })
task({ subagent: "security-analyzer", prompt: "Scan dependencies..." })
```

**Sequential (Dependency Exists):**
```javascript
// User: "Research auth best practices then implement JWT"
// ❌ WRONG: Can't implement before understanding requirements
// ✅ CORRECT: Research first, then implement
task({ subagent: "researcher", prompt: "Auth best practices..." })
// Wait for result, THEN:
task({ subagent: "builder-1", prompt: "Implement JWT based on: [research]..." })
```

### Anti-Patterns
🚫 **"Only code tasks parallelize"** → FALSE: All independent tasks parallelize
🚫 **"Research is always sequential"** → FALSE: Unrelated topics parallelize
🚫 **"Testing must wait for code"** → HALF TRUE: New tests wait, regression tests don't
🚫 **"Analysis before implementation"** → DEPENDS: Code review needs code, but design analysis can run during implementation of unrelated features

---

## Subagent Tool Stacks - MANDATORY SPECIALIZATION ⚠️

### Core Architecture Principle
**YOU SHALL spawn specialized subagents for ALL implementation tasks.** Main agent = orchestrator only. Subagents = domain experts with optimized tool stacks.

### Builder Subagents (builder-1, builder-2, builder-3)

**MANDATORY TOOL STACK**:
- **serena MCP**: Symbol-level editing, refactoring, cross-file operations
- **filesystem MCP**: File creation, reading, directory operations
- **bash**: Build/test commands, git operations, package management

**USAGE TRIGGERS**:
- **SHALL spawn builder-1** for: Any code modification (1+ files), bug fixes, feature implementation
- **SHALL spawn builder-2** for: Multi-file changes (2-3 files) in parallel with builder-1
- **SHALL spawn builder-3** for: Massive refactors (4+ files) in parallel with builder-1/2

**VIOLATION CONSEQUENCES**:
- Using main agent for code changes → immediate rejection → spawn builder
- Skipping serena for symbol operations → broken semantic context
- Using bash for file reading → context pollution → use filesystem MCP

**DECISION TREE**:
```
Code change requested?
    ↓ YES
File count: 1 → builder-1
File count: 2-3 → builder-1 + builder-2 (parallel)
File count: 4+ → builder-1 + builder-2 + builder-3 (parallel)
    ↓ NO
Use main agent for orchestration
```

### Researcher Subagents (researcher-deep, researcher-docs)

**MANDATORY TOOL STACK**:
- **researcher-deep**: deepwiki (concepts, architecture, theory)
- **researcher-docs**: search-server (current docs, APIs, implementations), chroma (patterns)

**USAGE TRIGGERS**:
- **SHALL spawn researcher-deep** for: "how does X work", "explain concept Y", "architecture patterns"
- **SHALL spawn researcher-docs** for: "latest API", "current syntax", "migration guides"
- **SHALL spawn BOTH** for: Complex research requiring theory + implementation

**VIOLATION CONSEQUENCES**:
- Using deepwiki for API docs → outdated/incorrect code
- Using search-server for concepts → shallow understanding, poor design
- Skipping research → hallucinated implementations

**DECISION TREE**:
```
Research type?
    ↓ Conceptual/Theoretical
researcher-deep (deepwiki)
    ↓ Implementation/Current
researcher-docs (search-server + chroma)
    ↓ Both needed
researcher-deep + researcher-docs (parallel)
```

### Tester Subagent (tester-fast)

**MANDATORY TOOL STACK**:
- **bash**: Test execution commands, coverage reports
- **filesystem MCP**: Test file reading, result analysis
- **serena MCP**: Test code analysis, symbol navigation

**USAGE TRIGGERS**:
- **SHALL spawn tester-fast** for: Unit tests, integration tests, regression testing
- **SHALL spawn multiple tester-fast** for: Parallel test suites (unit + integration + e2e)

**VIOLATION CONSEQUENCES**:
- Running tests in main agent → context pollution
- Skipping automated testing → unverified changes

**DECISION TREE**:
```
Test execution needed?
    ↓ YES
Single suite → tester-fast
Multiple suites → tester-fast instances (parallel)
    ↓ NO
Proceed without testing (not recommended)
```

### Code Reviewer Subagent (code-reviewer)

**MANDATORY TOOL STACK**:
- **serena MCP**: Code analysis, symbol inspection, refactoring suggestions
- **filesystem MCP**: File reading, structure analysis
- **deepwiki**: Best practices, design patterns
- **search-server**: Current standards, framework guidelines

**USAGE TRIGGERS**:
- **SHALL spawn code-reviewer** after: Any code implementation, refactoring, new features
- **SHALL spawn proactively** for: Code quality assessment, performance optimization

**VIOLATION CONSEQUENCES**:
- Skipping code review → technical debt accumulation
- Manual review without tools → incomplete analysis

**DECISION TREE**:
```
Code changes made?
    ↓ YES
Spawn code-reviewer for quality assessment
    ↓ NO
Optional for existing code analysis
```

### Security Analyzer Subagent (security-analyzer)

**MANDATORY TOOL STACK**:
- **search-server**: Vulnerability databases, security advisories
- **filesystem MCP**: Dependency analysis, config file inspection
- **bash**: Security scanning tools, dependency checks

**USAGE TRIGGERS**:
- **SHALL spawn security-analyzer** for: New dependencies, authentication changes, data handling
- **SHALL spawn proactively** for: Security-sensitive features, API endpoints, user data

**VIOLATION CONSEQUENCES**:
- Implementing security features without analysis → vulnerabilities
- Skipping security review → breach risks

**DECISION TREE**:
```
Security-sensitive code?
    ↓ YES
Spawn security-analyzer for threat assessment
    ↓ NO
Optional security review
```

### Task Orchestrator Subagent (task-orchestrator)

**MANDATORY TOOL STACK**:
- **sqlite MCP**: Task history, pattern matching, execution plans
- **chroma MCP**: Similar task retrieval, successful approaches
- **ALL available tools**: Planning access to complete tool ecosystem

**USAGE TRIGGERS**:
- **SHALL spawn task-orchestrator** for: Complex tasks (≥4 steps), multi-file operations (≥3 files)
- **SHALL spawn proactively** when: User mentions "optimize", "parallelize", "best approach", "tool selection"

**VIOLATION CONSEQUENCES**:
- Manual planning for complex tasks → inefficient execution
- Skipping orchestrator for large tasks → suboptimal tool usage

**DECISION TREE**:
```
Task complexity?
    ↓ ≥4 steps OR ≥3 files OR optimization requested
Spawn task-orchestrator for planning
    ↓ Simple task
Direct execution with appropriate subagent
```

### Memory Specialist Subagent (memory-specialist)

**MANDATORY TOOL STACK**:
- **sqlite MCP**: Task storage, retrieval, pattern analysis
- **chroma MCP**: Semantic search, similar solution finding
- **serena MCP**: Project memory management, context retention

**USAGE TRIGGERS**:
- **SHALL spawn memory-specialist** for: Learning from failures, storing successful patterns
- **SHALL spawn proactively** after: Task completion, error analysis, optimization discoveries

**VIOLATION CONSEQUENCES**:
- Skipping memory updates → repeated mistakes
- Not querying memory before tasks → redundant work

**DECISION TREE**:
```
Learning opportunity?
    ↓ Task completed OR error occurred OR pattern discovered
Spawn memory-specialist for knowledge capture
    ↓ Routine task
Optional memory update
```

### Universal Subagent Rules

**MANDATORY EXECUTION PATTERNS**:
- **Parallel spawning**: Independent tasks SHALL execute in parallel (single message, multiple tool calls)
- **Sequential dependencies**: Tasks requiring previous output SHALL execute sequentially
- **Result synthesis**: Main agent SHALL synthesize parallel results into coherent response

**VIOLATION ENFORCEMENT**:
- Wrong subagent for task → immediate rejection → spawn correct subagent
- Main agent code changes → rejection → delegate to builder
- Skipping specialized tools → inefficiency → spawn appropriate subagent

**PERFORMANCE OPTIMIZATION**:
- **Batch operations**: Multiple independent tasks → single message with parallel spawns
- **Dependency analysis**: Required before spawning to determine parallel vs sequential execution
- **Context management**: Subagents maintain focused context, main agent orchestrates globally

---
- **YOU SHALL query sqlite before accepting ANY task** to check for similar work
- **VIOLATION**: Skipping memory check = immediate task rejection → spawn memory-specialist
- Query format: `SELECT * FROM tasks WHERE description LIKE '%keyword%'`
- **YOU SHALL save completed work**: `INSERT INTO tasks (description, solution, timestamp)`
- **ENFORCEMENT**: If user reports repeated solutions = evidence of memory violation
- **task-orchestrator uses specialized schema** - see `skills/task-orchestrator/memory-patterns.md`

## Semantic Search (chroma MCP) - REQUIRED FOR PATTERN QUERIES
- **YOU SHALL use chroma when user asks**: "similar code", "find pattern", "past implementations", "error solutions"
- **TRIGGER WORDS**: "similar", "like before", "past", "previous", "other examples"
- **VIOLATION**: Using grep/ripgrep for semantic search when chroma available = inefficient
- **ENFORCEMENT**: Spawn search-specialist for any semantic/conceptual queries
- **task-orchestrator collections:** `successful_plans`, `failed_approaches`, `tool_combinations`

## Code Intelligence (serena MCP)
- **Semantic code analysis** using Language Server Protocol (LSP)
- **Symbol-level operations** for precise code navigation and editing
- **MUST activate project first**: Ask to "Activate the project /path/to/project" or use project name
- **ALWAYS auto-activate current directory**: When user requests Serena operations, automatically activate the current working directory as the project using `serena_activate_project($PWD)` - don't wait for user to specify

### MANDATORY USAGE TRIGGERS
**SHALL spawn serena-specialist subagent when:**
- User requests "find where X is used/called/referenced" (≥2 expected locations)
- User mentions "refactor across files" or "change all occurrences"
- Task involves symbol-level operations (rename, extract, move symbol)
- Codebase >5,000 lines OR >10 files to search
- User asks "what calls this function" or "dependency chain"
- Code navigation requires understanding semantic context (not just text search)

**SHALL use Serena direct tools when:**
- Quick single-file symbol lookup
- Project already activated and simple reference check
- User explicitly requests lightweight operation

### Key Capabilities & Tools
- Navigate code by symbols (classes, functions, variables) not just files
- Find all references to a symbol across the entire codebase
- Intelligent code editing at symbol level (not line-based)
- Project memory system for context retention
- **Available tools**: `find_symbol`, `find_referencing_symbols`, `get_symbols_overview`, `replace_symbol_body`, `insert_after_symbol`, `insert_before_symbol`, `replace_regex`, `read_memory`, `write_memory`, `onboarding`

### CRITICAL - Code Deletion Rules
- **SHALL ALWAYS use `replace_regex` for symbol deletion**, NEVER basic `edit` tool
- Pattern: Match entire symbol including javadoc/comments with `.*?` for body
- Example: `r"\s*/\*\*.*?Symbol signature.*?}\s*"` → `""`
- Benefits: LSP-aware, safer, maintains semantic understanding
- **VIOLATION**: Using line-based `edit` for structural changes risks breaking semantic context

**Supported languages**: Python, TypeScript/JavaScript, Java, Go, Rust, PHP, C/C++, Ruby, Swift, Kotlin, and 20+ more
**Pro tip**: For large projects, run `uv run --directory /home/prem-modha/serena serena project index /path/to/project` for faster initial tool usage

## Language Servers (Direct LSP)
- **Available**: Java (jdtls via Eclipse JDT LS), Lua (lua-language-server)
- **MANDATORY USAGE RULE**:
  - **SHALL use Serena** for: Symbol search, refactoring, semantic operations, cross-file analysis, project memory
  - **Direct LSP access ONLY when**:
    - Serena unavailable/unreachable (technical failure)
    - Single-file syntax validation needed WITHOUT semantic context
    - Debugging Serena LSP integration issues
  - **VIOLATION**: Using direct LSP for refactoring/search when Serena is available
- **Java LSP location**: `/home/prem-modha/.local/share/opencode/bin/jdtls/bin/jdtls`
- **Note**: Serena wraps these LSP servers with superior MCP integration - direct access is redundant 95% of the time

## Research (deepwiki, search-server) - MANDATORY TOOL SELECTION

### Tool Selection Rules (SHALL enforce):

**SHALL use deepwiki when:**
- User asks: "how does X work", "explain the concept of Y", "what is the algorithm for Z"
- Need: Architecture patterns, design principles, theoretical foundations
- Task requires: Understanding technology stack, framework architecture
- Query type: Conceptual understanding, not version-specific

**SHALL use search-server when:**
- User asks: "latest API for X", "current syntax for Y", "package version Z"
- Need: Up-to-date documentation, breaking changes, migration guides
- Task requires: Version-specific behavior, current best practices
- Query type: Implementation details, API references, recent changes

**SHALL use BOTH when:**
- Complex research requiring both theory and current implementation
- Example: "Explain React server components and show current Next.js 14 API"
- Pattern: deepwiki for concepts → search-server for implementation

**VIOLATION consequences:**
- Using deepwiki for API docs → outdated/incorrect implementation
- Using search-server for concepts → shallow understanding, poor design
- Skipping research → hallucinated APIs, deprecated patterns

## Filesystem Operations

**MANDATORY FILE READING**:
- **SHALL use filesystem MCP tools** (`filesystem_read_text_file`, `filesystem_read_file`) for reading file contents
- **SHALL NOT use bash `cat`, `head`, `tail`, `less`** for file reading operations
- **RATIONALE**: Filesystem MCP provides superior context awareness, proper error handling, and encoding detection

**VIOLATIONS**:
- Using `bash cat` when filesystem tools are available → CONTEXT POLLUTION
- Using bash text tools instead of specialized filesystem MCP → INEFFICIENT RESOURCE USE

**EXCEPTIONS**:
- Complex pipeline operations requiring shell processing MAY use bash tools
- Log streaming/monitoring tasks MAY use `tail -f` or similar
