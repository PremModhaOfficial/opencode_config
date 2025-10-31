# Parallel Task Execution System

## Overview
A hierarchical agent system leveraging opencode's built-in plan agent and the Agentic Framework for efficient parallel task execution. The system generates a nested ASCII todo-tree and spawns sub-agents recursively up to 5 levels deep to handle complex tasks without blocking.

## Key Components

### 1. Plan Agent (opencode built-in)
- **Role**: Generates nested ASCII todo-tree with dependencies and parallelization hints
- **Features**:
  - Indented hierarchy showing parallel (sibling branches) vs sequential (nested) tasks
  - Estimated times/resources (refinable by sub-agents)
  - Resolves priorities and prevents resource conflicts
  - Maximum depth: 5 levels
- **Example Tree Structure**:
```
project_root/
├── parallel_branch_1/
│   ├── task_a (est: 5min)
│   └── task_b (est: 3min)
├── parallel_branch_2/
│   └── sequential_nested/
│       ├── subtask_c (est: 2min)
│       └── subtask_d (est: 4min, depends on c)
└── final_task_e (est: 1min, depends on branch_1 and branch_2 complete)
```

### 2. Manager Sub-Agent (spawned via Agentic Framework)
- **Role**: Coordinates execution based on todo-tree
- **Interface**: Uses Agentic Framework MCP tools directly for spawning workers
- **Responsibilities**:
  - Parses todo-tree and spawns parallel workers
  - Monitors dependencies and spawns next level when prerequisites complete
  - Coordinates via framework messaging

### 3. Worker Sub-Agents (recursive spawning)
- **Role**: Execute specific tasks from todo-tree branches
- **Communication**: Progress updates via serena memory MCP, real-time coordination via framework messages
- **Lifecycle**: Send final status message to manager, then auto-unregister

## Research Findings

### Interface for Spawning Workers
- **Best Approach**: Agentic Framework MCP tools directly
- **Rationale**: Framework purpose-built for agent lifecycle management vs opencode's coding-focused tools
- **Implementation**: Manager uses `register-agent` to spawn workers with task-specific descriptions

### Progress Updates and Communication
- **Best Approach**: Serena MCP memory servers + framework messaging
- **Rationale**: Serena provides persistent shared state for todo-tree updates; framework handles real-time coordination
- **Implementation**: Todo-tree in knowledge graph, updates via memory tools, messages for coordination

### Sub-Agent Completion Handling
- **Smart Approach**: Send final status message to manager, then auto-unregister
- **Rationale**: Ensures completion confirmation before cleanup, prevents orphaned agents
- **Implementation**: Workers call `send-message` with status, then `unregister-agent`

## Workflow Steps

1. User describes task to plan agent
2. Plan agent generates todo-tree (ASCII, nested, with estimates)
3. Manager sub-agent spawned via framework
4. Manager parses tree and spawns parallel workers for branches
5. Workers execute tasks, update progress in memory, communicate via messages
6. On branch completion: Send status, unregister, manager spawns next level if dependencies met
7. Process continues recursively until sequential tasks remain
8. Final results consolidated in main chat

## Benefits
- **Parallel Execution**: Multiple tasks run simultaneously without waiting
- **Clean Context**: Main chat remains uncluttered, sub-agents handle details
- **Resource Efficiency**: Agents collapse after work, minimal context usage
- **Dependency Management**: Tree structure ensures proper sequencing
- **Conflict Prevention**: Tree creation resolves resource conflicts upfront

## Usage
1. Describe complex task to opencode
2. Plan agent generates todo-tree
3. System automatically spawns manager and workers
4. Monitor progress through main chat updates
5. Receive final results when complete