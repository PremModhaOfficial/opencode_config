# OpenCode Advanced Workflow Guide
## Automated Dependency-Tree Task Orchestration with Memory Integration

---

## Overview

This workflow implements an intelligent task orchestration system where the AI:
1. Asks clarifying questions when needed
2. Constructs a dependency tree of tasks
3. Automatically spawns subagents for parallel independent tasks
4. Executes dependent tasks sequentially
5. Integrates with memory MCP servers (Serena, Qdrant, GraphMem) for context
6. Leverages the MCP Agentic Framework for true parallel subagent execution and inter-agent communication

---

## 1. MCP Agentic Framework Integration

The MCP Agentic Framework enables true parallel execution of subagents with bidirectional communication, transforming the workflow from sequential orchestration to collaborative multi-agent systems.

### Framework Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Orchestrator    │     │  Research Agent │     │ Builder Agent   │
│ Agent           │     │                  │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                         │
              ┌──────────┴──────────┐
              │   MCP Agentic       │
              │   Framework         │
              │  ┌──────────────┐   │
              │  │Agent Registry│   │
              │  └──────────────┘   │
              │  ┌──────────────┐   │
              │  │ Message Store│   │
              │  └──────────────┘   │
              │  ┌──────────────┐   │
              │  │Notification  │   │
              │  │  Manager     │   │
              │  └──────────────┘   │
              └─────────────────────┘
                         │
              ┌──────────┴──────────┐
              │ Memory Systems      │
              │ (Serena, Qdrant,    │
              │  GraphMem)          │
              └─────────────────────┘
```

### Key Framework Features for Workflow
- **Dynamic Agent Registration**: Agents register with roles and capabilities
- **Asynchronous Messaging**: Bidirectional communication between agents
- **Broadcast System**: Global announcements and coordination signals
- **Status Tracking**: Real-time agent availability and activity monitoring
- **Message Queues**: Persistent message storage with automatic cleanup

### Integration Points
- **Parallel Execution**: Framework handles spawning and coordinating multiple subagents
- **Dependency Management**: Orchestrator uses framework messaging to enforce task dependencies
- **Memory Coordination**: Agents communicate with memory systems through dedicated interfaces
- **Progress Tracking**: Real-time status updates via broadcast messages

### Parallel Subagent Execution

The framework enables true parallel execution beyond simple SDK spawning:

#### Traditional vs Framework Parallelization
```
Traditional Approach:
AI → SDK Tool → Spawn Subagent A, B, C
     ↓
Subagents work independently → Results aggregated manually

Framework Approach:
Orchestrator Agent → Framework → Register Worker Agents A, B, C
     ↓
Framework manages parallel execution → Bidirectional messaging
     ↓
Workers coordinate via messages → Orchestrator aggregates via broadcasts
```

#### Framework-Enabled Parallel Patterns

**Pattern 1: Independent Task Parallelization**
```
Orchestrator broadcasts: "START_PHASE_1"
    ↓
Worker A: Research API patterns (uses Qdrant)
Worker B: Analyze database schema (uses GraphMem)
Worker C: Review existing components (uses Serena)
    ↓
Workers send completion messages to Orchestrator
    ↓
Orchestrator aggregates results → broadcasts "PHASE_1_COMPLETE"
```

**Pattern 2: Collaborative Parallelization**
```
Task: "Design microservices architecture"
    ↓
Orchestrator spawns 3 agents:
├─ Agent A: Domain expert (focuses on business logic)
├─ Agent B: Infrastructure expert (focuses on scalability)
└─ Agent C: Security expert (focuses on compliance)
    ↓
Agents exchange messages:
A→B: "Business requirements defined"
B→C: "Infrastructure constraints identified"
C→A: "Security requirements added"
    ↓
Consensus reached via messaging → Orchestrator synthesizes final design
```

**Pattern 3: Nested Parallelization**
```
Complex Task → Orchestrator Agent
    ↓ spawns
├─ Research Team (3 agents parallel)
├─ Design Team (2 agents parallel)
└─ Implementation Team (4 agents parallel)
    ↓
Each team has internal messaging
    ↓
Cross-team coordination via broadcasts
    ↓
Results bubble up through framework messaging
```

### Inter-Agent Messaging System

The framework provides rich communication capabilities:

#### Message Types
- **Direct Messages**: Point-to-point communication between specific agents
- **Broadcasts**: One-to-many communication with priority levels (low, normal, high)
- **Status Updates**: Automatic status changes (online, busy, away)
- **Notifications**: Persistent alerts that survive agent restarts

#### Messaging Workflow Example
```
User Request: "Build authentication system"

1. Orchestrator registers as coordinator
2. Spawns research, design, build agents
3. Broadcasts: "[HIGH] Starting auth system project"

4. Research Agent → Direct message to Orchestrator:
   "Found 3 auth patterns in codebase"

5. Design Agent → Broadcast to all:
   "[NORMAL] JWT vs Session debate - need consensus"

6. Build Agents coordinate:
   Agent B1 → Agent B2: "API endpoints ready for integration"
   Agent B2 → Agent B1: "Frontend components updated"

7. Orchestrator monitors via status updates:
   - Research: busy → online (completed)
   - Design: busy → online (completed)
   - Build: busy → busy (in progress)

8. Final broadcast: "[HIGH] Authentication system complete"
```

### Coordination with Memory Systems

The framework integrates deeply with existing memory MCP servers:

#### Memory-Augmented Agent Communication
```
Agent Workflow:
1. Agent receives task via framework message
2. Agent queries memory systems for context:
   - Serena: Code structure and dependencies
   - Qdrant: Semantic search for similar implementations
   - GraphMem: Project relationships and patterns
3. Agent processes with enriched context
4. Agent shares findings via framework messages
5. Other agents benefit from shared memory insights
```

#### Memory Coordination Patterns

**Pattern 1: Shared Context Distribution**
```
Orchestrator → Broadcast: "Task: Implement user dashboard"
    ↓
Research Agent queries Qdrant → finds similar dashboards
    ↓
Research Agent → Broadcast: "Found 2 dashboard patterns in codebase"
    ↓
Build Agents receive broadcast → query Serena for pattern details
    ↓
Build Agents coordinate implementation via direct messages
```

**Pattern 2: Memory-Driven Consensus**
```
Design Agent A proposes approach → sends to Design Agent B
    ↓
Design Agent B queries GraphMem → finds dependency conflicts
    ↓
Design Agent B → Direct message: "Approach conflicts with payment module"
    ↓
Agents negotiate via messages → query memory for alternatives
    ↓
Consensus reached → broadcast final design
```

**Pattern 3: Progressive Memory Enrichment**
```
Initial task → Agents query memory for patterns
    ↓
Implementation reveals new insights
    ↓
Agents update memory systems:
- Serena: New code structures indexed
- Qdrant: Implementation examples stored
- GraphMem: New relationships recorded
    ↓
Future tasks benefit from enriched memory
```

---

## 2. The "DO A" Workflow Pattern

### User Request Flow:
```
User: "DO A" (any complex task)
    ↓
AI: Clarification Phase
    ↓
AI: Dependency Analysis Phase
    ↓
AI: Execution Phase (Parallel + Sequential)
    ↓
Result: Task completed with optimal efficiency
```

---

## 3. Clarification Phase

### When AI Asks Questions:
```
User: "Add user authentication with social login"

AI Analyzes:
- Is the task specification complete?
- What assumptions need validation?
- Are there multiple valid approaches?
- What constraints exist?

AI Asks:
"Before I proceed, I need to clarify:
1. Which social providers? (Google, GitHub, Facebook?)
2. Should we support email/password as fallback?
3. Do you have existing user database schema?
4. Any specific authentication library preference?"

User Responds → AI has complete context
```

### Best Practices:
- AI asks targeted questions (not exhaustive lists)
- User can say "use your best judgment" to skip
- Questions focus on architectural decisions, not implementation details
- Maximum 3-5 questions per clarification round

---

## 4. Dependency Analysis Phase

### AI Constructs Task Tree:
```
Main Task: "Add user authentication with social login"
    ↓
Dependency Tree:

[Parallel Group 1 - Independent Research]
├─ Task A1: Research OAuth2 best practices
├─ Task A2: Analyze existing database schema
└─ Task A3: Evaluate authentication libraries

[Sequential Task B - Depends on A1, A2, A3]
└─ Task B: Design authentication architecture

[Parallel Group 2 - Independent Implementation]
├─ Task C1: Implement OAuth provider integration
├─ Task C2: Create user model and migrations
└─ Task C3: Build authentication UI components

[Sequential Task D - Depends on C1, C2, C3]
└─ Task D: Integration and testing
```

### Dependency Rules:
- **Independent tasks** → Can run in parallel (spawn multiple subagents)
- **Dependent tasks** → Must run sequentially (wait for dependencies)
- **Nested complexity** → Subagent spawns its own subagents (recursive)

---

## 5. Execution Phase Architecture

### Parallel Execution Pattern:
```
AI creates TodoList:
┌─────────────────────────────────────┐
│ [in_progress] Task A1: Research     │ ← Subagent 1
│ [in_progress] Task A2: Analyze DB   │ ← Subagent 2
│ [in_progress] Task A3: Eval libs    │ ← Subagent 3
│ [pending] Task B: Design arch       │ ← Waits for A1-A3
└─────────────────────────────────────┘

Subagents run concurrently (via SDK + custom tool/plugin)
Each reports back when complete
Primary agent aggregates results
```

### Sequential Execution Pattern:
```
After parallel group completes:

[completed] Task A1: Research OAuth2
[completed] Task A2: Analyze DB
[completed] Task A3: Eval libraries
    ↓
[in_progress] Task B: Design architecture
    ↓ (uses results from A1, A2, A3)
[pending] Task C1, C2, C3...
```

### Nested Subagent Pattern:
```
Primary Agent
    ↓ spawns
Orchestrator Subagent
    ↓ spawns
├─ Research Subagent (Task A1)
│  └─ spawns: Doc-Search Sub-subagent
├─ Analysis Subagent (Task A2)
└─ Eval Subagent (Task A3)

Each level has isolated context
Results bubble up through the tree
Prevents context overflow
```

---

## 6. Memory MCP Server Integration

### Three Memory Layers:

#### 1. Serena (LSP-Powered Code Structure)
```
Purpose: Surgical, precise code editing with LSP awareness
When used: During implementation tasks requiring code changes

Configuration:
{
  "mcp": {
    "serena": {
      "type": "local",
      "command": ["npx", "-y", "serena-mcp"],
      "enabled": true
    }
  },
  "tools": {
    "mcp_serena*": false  // Disable globally
  },
  "agent": {
    "build": {
      "tools": {
        "mcp_serena*": true  // Enable for build agent
      }
    }
  }
}

Usage in workflow:
- Task type: Code implementation
- Agent: build mode
- Memory: Serena provides LSP-aware code structure
- Benefit: Precise edits, type-safe refactoring
```

#### 2. Qdrant (Semantic RAG Search)
```
Purpose: Search unstructured docs, chats, logs, past sessions
When used: During research tasks needing context retrieval

Configuration:
{
  "mcp": {
    "qdrant_semantic": {
      "type": "remote",
      "url": "https://your-qdrant.com/mcp",
      "headers": {
        "Authorization": "Bearer {env:QDRANT_API_KEY}"
      },
      "enabled": true
    }
  },
  "tools": {
    "mcp_qdrant*": false  // Disable globally
  },
  "agent": {
    "general": {
      "tools": {
        "mcp_qdrant*": true  // Enable for research subagent
      }
    }
  }
}

Usage in workflow:
- Task type: Research, exploration, finding examples
- Agent: general subagent (research mode)
- Memory: Qdrant searches semantic space
- Benefit: Find relevant past work, documentation, patterns
```

#### 3. GraphMem (Knowledge Graph)
```
Purpose: Structured project knowledge, entity relationships
When used: Understanding dependencies, project structure, relationships

Configuration:
{
  "mcp": {
    "graphmem": {
      "type": "local",
      "command": ["node", "/path/to/graphmem-server.js"],
      "environment": {
        "GRAPH_DB_URL": "{env:GRAPH_DB_URL}"
      },
      "enabled": true
    }
  },
  "tools": {
    "mcp_graphmem*": false  // Disable globally
  },
  "agent": {
    "orchestrator": {
      "description": "Analyze task dependencies and orchestrate execution",
      "mode": "subagent",
      "tools": {
        "mcp_graphmem*": true  // Enable for orchestrator
      }
    }
  }
}

Usage in workflow:
- Task type: Dependency analysis, architecture planning
- Agent: orchestrator subagent
- Memory: GraphMem tracks entity relationships
- Benefit: Understand ripple effects, find dependencies
```

---

## 7. Practical Multi-Agent Workflow Examples

### Example 1: E-commerce Feature Development with Framework

**User Request:** "Build a product recommendation system"

**Framework-Enabled Multi-Agent Execution:**

```
Orchestrator Agent registers and broadcasts: "[HIGH] Starting recommendation system project"

Phase 1: Parallel Research (3 agents)
├── Research Agent A: "Analyze user behavior patterns" (Qdrant search)
├── Research Agent B: "Review existing recommendation algorithms" (Qdrant + GraphMem)
└── Research Agent C: "Assess current product catalog structure" (Serena LSP)

Research agents coordinate:
A → B: "Found 3 user segments with different preferences"
B → A: "Collaborative filtering suits segment analysis"
C broadcasts: "[NORMAL] Catalog has category hierarchy available"

Phase 2: Design Consensus (2 agents)
├── Design Agent X: Focus on algorithm design
└── Design Agent Y: Focus on UI/UX integration

Design agents negotiate:
X → Y: "Proposing hybrid content-collaborative approach"
Y → X: "Need to consider mobile performance constraints"
X queries GraphMem → finds performance bottlenecks
Y → X: "Agreed on lightweight client-side filtering"

Phase 3: Parallel Implementation (4 agents)
├── Backend Agent 1: Algorithm implementation
├── Backend Agent 2: API endpoints
├── Frontend Agent 3: Recommendation UI components
└── Integration Agent 4: Testing and optimization

Implementation coordination:
Backend Agent 1 → Backend Agent 2: "Algorithm ready for API integration"
Frontend Agent 3 → Integration Agent 4: "UI components complete"
Integration Agent 4 broadcasts: "[NORMAL] End-to-end testing passed"

Final Orchestrator broadcast: "[HIGH] Recommendation system deployed"
```

**Framework Benefits Demonstrated:**
- **Parallel Research:** 3 agents working simultaneously with different memory systems
- **Inter-Agent Negotiation:** Design agents reached consensus through messaging
- **Dependency Coordination:** Implementation agents coordinated via direct messages
- **Progress Broadcasting:** Real-time status updates to all participants

### Example 2: API Migration with Collaborative Agents

**User Request:** "Migrate from REST to GraphQL"

**Complex Multi-Agent Orchestration:**

```
Orchestrator spawns Migration Coordinator Agent

Coordinator registers team:
- 5 Schema Design Agents (parallel)
- 3 Resolver Implementation Agents (parallel)
- 2 Testing Agents (parallel)
- 1 Documentation Agent (sequential, depends on all others)

Schema Design Phase:
Coordinator broadcasts: "Design GraphQL schemas for 15 REST endpoints"

5 Schema Agents work in parallel:
├── Agent S1: Endpoints 1-3 (products, categories, inventory)
├── Agent S2: Endpoints 4-6 (users, authentication, profiles)
├── Agent S3: Endpoints 7-9 (orders, payments, shipping)
├── Agent S4: Endpoints 10-12 (analytics, reports, notifications)
└── Agent S5: Endpoints 13-15 (admin, settings, maintenance)

Schema agents coordinate relationships:
S1 → S3: "Product schema references order status"
S3 → S2: "Order schema needs user authentication fields"
S5 → Coordinator: "Admin schema complete, no dependencies"

Resolver Implementation Phase (depends on schema completion):
Coordinator broadcasts: "[NORMAL] Schemas approved, start resolvers"

3 Resolver Agents:
├── Agent R1: Business logic resolvers (products, orders)
├── Agent R2: Authentication resolvers (users, permissions)
└── Agent R3: Analytics resolvers (reports, metrics)

Resolver agents query memory:
R1 uses Serena: "Find existing business logic in REST handlers"
R2 uses Qdrant: "Search for authentication patterns"
R3 uses GraphMem: "Understand data relationships for analytics"

Testing Phase (parallel with implementation):
├── Agent T1: Unit tests for resolvers
└── Agent T2: Integration tests for full GraphQL API

Testing agents coordinate:
T1 → R1: "Unit test failures in product resolver"
R1 → T1: "Fixed null handling, retest"
T2 broadcasts: "[HIGH] Integration tests failing - schema mismatch"

Documentation Phase (sequential):
Documentation Agent waits for all others to complete
Queries all agents for implementation details
Generates comprehensive migration guide

Final Coordinator broadcast: "[HIGH] GraphQL migration complete - 15 endpoints, full test coverage"
```

**Advanced Framework Features:**
- **Large-Scale Parallelization:** 11 agents working simultaneously
- **Dependency Enforcement:** Framework ensures proper execution order
- **Memory Integration:** Each agent uses appropriate memory system
- **Error Propagation:** Testing failures communicated instantly via broadcasts
- **Result Aggregation:** Documentation agent collects from all participants

### Example 3: Real-Time Collaboration for Bug Fixes

**User Request:** "Fix memory leak in data processing pipeline"

**Dynamic Agent Collaboration:**

```
Incident Response Coordinator registers

Coordinator broadcasts: "[HIGH] Memory leak detected in pipeline"

Diagnostic Phase (parallel investigation):
├── Memory Analysis Agent: Heap dump analysis
├── Code Review Agent: Pipeline code inspection (Serena)
├── Performance Agent: System metrics review
└── Log Analysis Agent: Error pattern identification (Qdrant)

Diagnostic agents share findings:
Memory Agent → All: "Leak in connection pooling, 500MB growth/hour"
Code Review Agent → Memory Agent: "Found unclosed DB connections in processor.js:142"
Performance Agent → Coordinator: "CPU usage normal, confirms memory issue"

Fix Design Phase (collaborative):
Coordinator spawns Fix Design Agent
Design Agent queries GraphMem: "Find all components using connection pooling"

Design Agent → Broadcast: "Need consensus on fix approach"
├── Option A: Connection pool timeout configuration
├── Option B: Explicit connection cleanup
└── Option C: Switch to connectionless processing

Agents vote via messages:
Memory Agent: "Option B - explicit cleanup most reliable"
Code Review Agent: "Option B - matches existing patterns"
Performance Agent: "Option B - minimal performance impact"

Implementation Phase:
Coordinator spawns Implementation Agent
Implementation Agent uses Serena: "Apply explicit cleanup to processor.js"

Testing Phase:
Coordinator spawns Test Agent
Test Agent runs memory profiling tests
Test Agent → Coordinator: "Memory leak eliminated, stable at 200MB"

Final broadcast: "[HIGH] Memory leak fixed - explicit connection cleanup implemented"
```

**Collaborative Intelligence:**
- **Rapid Diagnosis:** Multiple specialized agents investigate simultaneously
- **Consensus Building:** Agents discuss and vote on solutions
- **Integrated Memory:** Code analysis combined with system metrics
- **Immediate Feedback:** Real-time status updates during crisis

---

## 8. Complete Workflow Example

### User Request:
```
User: "Add pagination to the user list with infinite scroll"
```

### Phase 1: Clarification
```
AI: "I'll add pagination with infinite scroll. Quick clarifications:
1. Backend already supports pagination? (I'll check the API)
2. Preferred library: react-infinite-scroll or custom implementation?
3. How many items per page?"

User: "Backend has ?page=X&limit=Y. Use react-infinite-scroll. 20 items per page."
```

### Phase 2: Dependency Analysis
```
AI constructs tree:

PARALLEL GROUP 1 (Independent Research):
├─ [A1] @general: Find existing pagination patterns in codebase (uses Qdrant)
├─ [A2] @general: Research react-infinite-scroll best practices (uses Qdrant)
└─ [A3] Analyze current UserList component structure (uses Serena)

SEQUENTIAL TASK B (Depends on A1, A2, A3):
└─ [B] Design pagination implementation strategy (uses GraphMem for impact)

PARALLEL GROUP 2 (Independent Implementation):
├─ [C1] Update API client with pagination params
├─ [C2] Modify UserList component for infinite scroll
└─ [C3] Add loading states and error handling

SEQUENTIAL TASK D (Depends on C1, C2, C3):
└─ [D] Integration testing and refinement
```

### Phase 3: Execution
```
AI uses TodoWrite tool:

✓ [completed] A1: Found 3 pagination patterns (Qdrant search: 2 relevant examples)
✓ [completed] A2: Best practices documented (Qdrant: React docs + Stack Overflow)
✓ [completed] A3: UserList analysis complete (Serena: LSP structure mapped)

⚙ [in_progress] B: Designing implementation (GraphMem: checking component dependencies)

Results aggregated → Strategy: Use pattern from OrderList.tsx, maintain existing state

✓ [completed] B: Strategy complete

⚙ [in_progress] C1: API client (build agent with Serena)
⚙ [in_progress] C2: UserList component (build agent with Serena)  
⚙ [in_progress] C3: Loading states (build agent with Serena)

All C tasks complete → Results aggregated

⚙ [in_progress] D: Integration testing

✓ [completed] All tasks finished!
```

---

## 8. Agent Configuration for This Workflow

### Required Agents:

```json
{
  "$schema": "https://opencode.ai/config.json",
  
  "instructions": ["AGENTS.md"],
  
  "plugin": ["opencode-sessions"],  // For future manual parallel exploration
  
   "mcp": {
     "agentic-framework": {
       "type": "http",
       "url": "http://127.0.0.1:3113/mcp",
       "enabled": true
     },
     "serena": {
       "type": "local",
       "command": ["npx", "-y", "serena-mcp"],
       "enabled": true
     },
     "qdrant_semantic": {
       "type": "remote",
       "url": "https://your-qdrant.com/mcp",
       "enabled": true
     },
     "graphmem": {
       "type": "local",
       "command": ["node", "./graphmem-server.js"],
       "enabled": true
     }
   },
  
  "tools": {
    "mcp_*": false  // Disable all MCP globally to save context
  },
  
  "agent": {
    "build": {
      "mode": "primary",
      "description": "Standard development with code editing",
      "tools": {
        "mcp_serena*": true
      }
    },
    
    "plan": {
      "mode": "primary",
      "description": "Read-only analysis and planning",
      "permission": {
        "edit": "ask",
        "bash": "ask"
      }
    },
    
    "general": {
      "mode": "subagent",
      "description": "Research and exploration with semantic search",
      "tools": {
        "mcp_qdrant*": true
      }
    },
    
     "orchestrator": {
       "mode": "subagent",
       "description": "Analyze task dependencies, construct execution tree, spawn parallel subagents",
       "prompt": "{file:./agent/orchestrator-prompt.txt}",
       "tools": {
         "mcp_graphmem*": true,
         "mcp_agentic-framework*": true
       }
     },

     "research-agent": {
       "mode": "subagent",
       "description": "Specialized research agent with framework messaging capabilities",
       "tools": {
         "mcp_qdrant*": true,
         "mcp_agentic-framework*": true
       }
     },

     "builder-agent": {
       "mode": "subagent",
       "description": "Implementation agent with code editing and framework coordination",
       "tools": {
         "mcp_serena*": true,
         "mcp_agentic-framework*": true
       }
     },

     "coordinator-agent": {
       "mode": "subagent",
       "description": "Multi-agent coordination using MCP Agentic Framework",
       "tools": {
         "mcp_agentic-framework*": true,
         "mcp_graphmem*": true
       }
     }
  }
}
```

---

## 9. AGENTS.md Instructions

Add to your AGENTS.md:

```markdown
## Automated Dependency-Tree Workflow

When given a complex task:

### 1. Clarification Phase
- Ask 3-5 targeted questions if task is ambiguous
- Focus on architectural decisions, not implementation details
- Allow user to say "use your judgment" to skip

### 2. Dependency Analysis Phase
- Construct a task dependency tree
- Identify independent tasks (can run in parallel)
- Identify dependent tasks (must run sequentially)
- Use GraphMem to understand code relationships and impact

### 3. Execution Phase
- Use TodoWrite to create hierarchical task list
- For independent tasks: Spawn multiple subagents (via custom tool/SDK)
- For dependent tasks: Execute sequentially after dependencies complete
- Aggregate results automatically
- If a task is complex, subagent spawns its own subagents (nested)

### 4. MCP Agentic Framework Usage
- **Agent Registration**: Register specialized agents for different roles (research, build, coordinate)
- **Parallel Execution**: Use framework tools to spawn and coordinate multiple agents simultaneously
- **Inter-Agent Communication**: Leverage direct messages and broadcasts for real-time coordination
- **Status Tracking**: Monitor agent availability and progress through framework status updates
- **Memory Coordination**: Agents communicate findings and coordinate memory system queries

### 5. Memory Server Usage
- **Serena**: Use during code implementation for LSP-aware edits
- **Qdrant**: Use during research for semantic search of docs/examples
- **GraphMem**: Use during planning to understand dependencies and relationships

### 6. Context Management
- Each subagent has isolated context
- Results are aggregated by parent
- Prevents context overflow through nesting
- Long-running tasks use new sessions

## Task Decomposition Guidelines

**Parallel-Safe Tasks:**
- Independent code modules
- Separate documentation sections
- Unrelated test suites
- Different research topics
- Non-conflicting file edits

**Sequential-Required Tasks:**
- Database migrations before code using new schema
- API changes before frontend consuming it
- Core utilities before dependent modules
- Design decisions before implementation
- Integration after all components complete

**Nested Delegation:**
- If a subtask requires >5 steps, spawn a subagent for it
- Subagent breaks it down further if needed
- Results bubble up through agent hierarchy
```

---

## 10. Implementation: Custom Parallel Coordinator Tool

### What Needs to Be Built:

Since automatic parallel execution isn't built-in, you'll need a custom tool:

```typescript
// ~/.config/opencode/tool/parallel-coordinator.ts

import { tool } from "@opencode-ai/plugin"
import { createOpencodeClient } from "@opencode-ai/sdk"

export default tool({
  description: "Spawn multiple subagents in parallel and aggregate results automatically",
  args: {
    tasks: tool.schema.array(tool.schema.object({
      id: tool.schema.string(),
      agent: tool.schema.string(),
      prompt: tool.schema.string(),
      dependencies: tool.schema.array(tool.schema.string()).optional()
    }))
  },
  async execute(args, context) {
    const client = createOpencodeClient({ baseUrl: "http://localhost:4096" })
    
    // Build dependency graph
    const graph = buildDependencyGraph(args.tasks)
    
    // Execute tasks respecting dependencies
    const results = new Map()
    
    for (const level of graph.levels) {
      // Parallel execution for tasks at same level
      const levelResults = await Promise.all(
        level.tasks.map(async (task) => {
          // Create child session
          const session = await client.session.create({
            body: {
              parentID: context.sessionID,
              title: `Task ${task.id}: ${task.agent}`
            }
          })
          
          // Inject dependency results as context
          const depContext = task.dependencies
            .map(depId => results.get(depId))
            .join("\n\n")
          
          if (depContext) {
            await client.session.prompt({
              path: { id: session.id },
              body: {
                noReply: true,
                parts: [{ type: "text", text: `Context from dependencies:\n${depContext}` }]
              }
            })
          }
          
          // Execute task
          const response = await client.session.prompt({
            path: { id: session.id },
            body: {
              parts: [{ type: "text", text: task.prompt }],
              agent: task.agent
            }
          })
          
          return { id: task.id, result: response }
        })
      )
      
      // Store results for dependent tasks
      levelResults.forEach(({ id, result }) => results.set(id, result))
    }
    
    // Aggregate and return
    return {
      summary: "All tasks completed",
      results: Array.from(results.entries()).map(([id, result]) => ({
        taskId: id,
        output: result
      }))
    }
  }
})

function buildDependencyGraph(tasks) {
  // Topological sort to create execution levels
  // Level 0: No dependencies
  // Level 1: Depends only on Level 0
  // Level N: Depends only on Level 0..N-1
  
  const levels = []
  const processed = new Set()
  
  while (processed.size < tasks.length) {
    const currentLevel = tasks.filter(task => 
      !processed.has(task.id) &&
      (task.dependencies || []).every(dep => processed.has(dep))
    )
    
    if (currentLevel.length === 0) {
      throw new Error("Circular dependency detected")
    }
    
    levels.push({ tasks: currentLevel })
    currentLevel.forEach(task => processed.add(task.id))
  }
  
  return { levels }
}
```

---

## 11. Usage Examples

### Example 1: Simple Feature
```
User: "Add dark mode toggle"

AI: (No clarification needed)

Dependency Tree:
├─ [A] Research dark mode patterns (general + Qdrant)
├─ [B] Design toggle component (plan + GraphMem)
└─ [C] Implement toggle (build + Serena)

Sequential execution → Done in 3 steps
```

### Example 2: Complex Feature
```
User: "Build a real-time notification system"

AI Clarifies:
"1. WebSocket or Server-Sent Events?
 2. Notification types needed?
 3. Persistence requirements?"

User: "WebSockets, support chat/system/alerts, store last 100 per user"

Dependency Tree:
PARALLEL [Research]
├─ A1: WebSocket library research (Qdrant)
├─ A2: Database schema design (GraphMem)
└─ A3: Existing notification code (Qdrant)

SEQUENTIAL [Design]
└─ B: Architecture design (GraphMem)

PARALLEL [Implementation]
├─ C1: Backend WebSocket server
├─ C2: Database migrations
├─ C3: Frontend notification component
└─ C4: Notification store/state management

SEQUENTIAL [Integration]
└─ D: End-to-end testing

AI automatically spawns 3 parallel subagents for research
Then 4 parallel subagents for implementation
Aggregates all results
Presents final working system
```

### Example 3: Nested Complexity
```
User: "Migrate from REST API to GraphQL"

This is massive → Orchestrator subagent spawned

Orchestrator analyzes:
- 47 REST endpoints to migrate
- 12 data models involved
- 8 frontend components consuming API

Orchestrator creates:
LEVEL 1 [Research] - 3 parallel subagents
LEVEL 2 [Design] - 1 sequential subagent
LEVEL 3 [Implementation] - 5 parallel subagents, each spawns 3-5 sub-subagents
LEVEL 4 [Testing] - 3 parallel subagents
LEVEL 5 [Migration] - 1 sequential subagent

Each implementation subagent handles 8-10 endpoints
Those subagents spawn sub-subagents for individual endpoints
Results bubble up through the tree

Total: ~40 agents working in coordination
User just sees progress updates
Final result: Complete GraphQL migration
```

---

## 12. Workflow Best Practices

### DO:
✅ Trust the AI to ask clarifying questions
✅ Let AI construct the dependency tree
✅ Use TodoWrite to track progress visually
✅ Enable memory MCP servers per-agent (not globally)
✅ Allow nested subagent spawning for complex tasks
✅ Use GraphMem for dependency analysis
✅ Use Qdrant for finding relevant past work
✅ Use Serena for precise code edits

### DON'T:
❌ Micromanage individual task execution
❌ Enable all MCP servers globally (context bloat)
❌ Manually split tasks into parallel groups
❌ Skip the clarification phase on complex tasks
❌ Force sequential execution when tasks are independent
❌ Interrupt subagent work to check progress

### Context Management:
- Start new session if baseline >15K tokens
- Each subagent has isolated context
- Results aggregated without full context transfer
- Long tasks use session compression
- Monitor with `opencode --debug`

---

## 13. Troubleshooting

### Issue: "Too many parallel subagents"
**Solution:** Orchestrator should limit to 5-10 parallel agents at once. Use batching for larger parallelization.

### Issue: "Circular dependencies detected"
**Solution:** AI analyzes dependencies incorrectly. Manual override: specify order explicitly.

### Issue: "Result aggregation takes too long"
**Solution:** Use streaming results instead of waiting for all. Update TodoList as each completes.

### Issue: "Context overflow in subagent"
**Solution:** Subagent should spawn its own subagents (nested). Never let single agent context exceed 50K tokens.

### Issue: "Memory MCP servers slow"
**Solution:** 
- Cache Qdrant queries
- Use GraphMem incrementally (not full graph each time)
- Serena LSP should be local (fast)

---

## 14. Future Enhancements

### Planned Improvements:

1. **Visual Dependency Graph UI**
   - See task tree in real-time
   - Click nodes to view subagent progress
   - Color-coded status (pending/running/complete)

2. **Automatic Quality Scoring**
   - When parallel approaches explored
   - AI scores each based on criteria
   - Presents ranked recommendations

3. **Learning from Past Sessions**
   - Store dependency patterns in GraphMem
   - Improve tree construction over time
   - Suggest similar past solutions via Qdrant

4. **Cost Optimization**
   - Use fast models for research subagents
   - Use capable models for implementation
   - Parallel execution reduces wall-clock time

5. **Rollback and Recovery**
   - Each level can rollback independently
   - Failed subagent retries automatically
   - Partial progress preserved

---

## Summary

This workflow transforms OpenCode into an intelligent multi-agent orchestration system:

1. **User describes task** → AI clarifies if needed
2. **AI analyzes dependencies** → Constructs optimal execution tree
3. **Framework enables parallel execution** → Multiple agents collaborate via MCP Agentic Framework
4. **Inter-agent communication** → Direct messages and broadcasts coordinate complex workflows
5. **Memory integration** → Serena (code), Qdrant (search), GraphMem (relationships) with agent coordination
6. **Automatic aggregation** → Results collected and synthesized through framework messaging
7. **Nested delegation** → Complex tasks spawn sub-subagents with full framework support
8. **Progress tracking** → Real-time status updates via agent broadcasts and notifications

**Result:** Complex multi-day tasks completed in hours through intelligent parallelization, collaborative intelligence, and memory-augmented decision making.

---

*Workflow Version: 3.0*
*Last Updated: 2025-10-29*
*Requires: OpenCode ≥ 0.15.18, MCP Agentic Framework, Custom parallel-coordinator tool, MCP servers (Agentic Framework, Serena, Qdrant, GraphMem)*
