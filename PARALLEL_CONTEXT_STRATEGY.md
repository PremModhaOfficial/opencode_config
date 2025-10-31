# Parallel Subagent Context Management Strategy
## Comprehensive Guide for Distributed Task Execution in OpenCode

---

## Executive Summary

This strategy defines how parallel subagents in OpenCode share context, coordinate discoveries, avoid redundant work, and maintain coherent understanding across distributed execution using the three-tiered memory system:

1. **Serena Code Agent** (LSP-powered structural memory)
2. **Knowledge Graph** (relational facts and dependencies)
3. **Semantic Memory/Chroma** (vector-based contextual search)

**Key Principle:** Each memory tier serves a distinct purpose in parallel coordination, with specific protocols for read/write operations to prevent conflicts and ensure consistency.

---

## 1. Core Challenges in Parallel Execution

### 1.1 The Five Context Problems

| Problem | Description | Impact |
|---------|-------------|--------|
| **Redundant Discovery** | Multiple agents finding same information | Wasted tokens, time, API costs |
| **Context Fragmentation** | Each agent has isolated knowledge | Inconsistent decisions, duplicated work |
| **Write Conflicts** | Simultaneous edits to same resources | Merge conflicts, lost work |
| **Stale Information** | Agent using outdated context | Incorrect assumptions, breaking changes |
| **Knowledge Loss** | Agent discoveries not propagated | Sub-optimal solutions, missed insights |

### 1.2 Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Primary Orchestrator                      │
│  - Manages task distribution                                 │
│  - Aggregates results                                        │
│  - Coordinates memory writes                                 │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Subagent 1  │    │  Subagent 2  │    │  Subagent 3  │
│  (Research)  │    │  (Analysis)  │    │  (Implement) │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌─────────────────────────────┐    ┌──────────────────────┐
│  Shared Memory Layer        │    │  Coordination Layer  │
│  - Serena (Code)            │    │  - Session Context   │
│  - Knowledge Graph (Facts)  │    │  - Task Queue        │
│  - Chroma (Semantics)       │    │  - Status Registry   │
└─────────────────────────────┘    └──────────────────────┘
```

---

## 2. Three-Tier Memory Strategy for Parallel Agents

### 2.1 Tier 1: Serena Code Agent (Structural Coordination)

**Purpose:** Prevent code-level conflicts, coordinate structural changes

#### Read Operations (All Subagents)
- **Use Case:** Understanding existing code structure
- **Tool:** `serena_code_agent_find_symbol`
- **Concurrency:** Safe - LSP provides read-only snapshots
- **Example:**
```
Subagent 1: find_symbol(name_path="/AuthService")
Subagent 2: find_symbol(name_path="/UserRepository")
Subagent 3: find_symbol(name_path="/AuthService/login")
→ All read same LSP state, no conflicts
```

#### Write Operations (Coordinated)
- **Use Case:** Code modifications
- **Coordination Protocol:** Lock-based (via memory coordination)
- **Tool:** `serena_code_agent_replace_symbol_body`
- **Conflict Prevention:**

```javascript
// Memory coordination record in Knowledge Graph
Entity: "AuthService.ts"
Observations: [
  "LOCKED by subagent_2 at 14:35:22",
  "Modification: Adding OAuth support",
  "Estimated completion: 14:37:00"
]

// Subagent 3 checks before writing
query_knowledge_graph("AuthService.ts lock status")
→ Sees locked by subagent_2
→ Either waits or works on different file
```

#### Coordination Pattern: File-Level Locking

```markdown
BEFORE WRITE (Subagent Protocol):
1. Query Knowledge Graph: "Is {file_path} locked?"
2. If locked:
   - Wait (if high priority)
   - OR work on alternative task
   - OR read-only analysis instead
3. If free:
   - Create lock entity in Knowledge Graph
   - Perform write operation
   - Release lock
   - Write discovery summary to Chroma
```

**Example Implementation:**

```
Subagent 2 wants to modify AuthService.ts:

Step 1: Query KG
└─> open_nodes(["AuthService.ts:lock"])
    Result: No lock found

Step 2: Acquire Lock
└─> create_entities([{
      name: "AuthService.ts:lock",
      entityType: "FileLock",
      observations: [
        "Locked by: subagent_2_session_abc123",
        "Purpose: Adding OAuth2.0 support",
        "Started: 2025-10-29T14:35:22Z",
        "Estimated duration: 2 minutes"
      ]
    }])

Step 3: Perform Modification
└─> replace_symbol_body(
      name_path="/AuthService/authenticate",
      relative_path="src/auth/AuthService.ts",
      body="..." // new OAuth implementation
    )

Step 4: Release Lock & Share Discovery
└─> delete_entities(["AuthService.ts:lock"])
└─> add_documents(
      collection="parallel_discoveries",
      documents=["Added OAuth2.0 support to AuthService with Google and GitHub providers"],
      ids=["discovery_subagent2_001"],
      metadatas=[{
        "agent": "subagent_2",
        "file": "src/auth/AuthService.ts",
        "type": "implementation",
        "timestamp": "2025-10-29T14:37:15Z"
      }]
    )
```

---

### 2.2 Tier 2: Knowledge Graph (Relational Coordination)

**Purpose:** Share facts, track dependencies, coordinate high-level decisions

#### Entity Types for Parallel Coordination

```
1. TaskStatus Entities
   - Name: "task_{task_id}"
   - Type: "TaskStatus"
   - Observations: ["status: in_progress", "assigned_to: subagent_3", "started: {timestamp}"]

2. Discovery Entities
   - Name: "discovery_{topic}"
   - Type: "Discovery"
   - Observations: ["found_pattern: X", "recommendation: Y", "source: subagent_1"]

3. Lock Entities
   - Name: "{resource}:lock"
   - Type: "FileLock" | "APILock" | "DBLock"
   - Observations: ["locked_by: {agent}", "purpose: {reason}", "eta: {time}"]

4. Dependency Entities
   - Name: "module_{name}"
   - Type: "CodeModule"
   - Observations: ["depends_on: [X, Y]", "used_by: [A, B]", "status: refactoring"]

5. Decision Entities
   - Name: "decision_{topic}"
   - Type: "ArchitecturalDecision"
   - Observations: ["chosen_approach: X", "rationale: Y", "decided_by: orchestrator"]
```

#### Relations for Coordination

```
TaskStatus --[depends_on]--> TaskStatus
TaskStatus --[assigned_to]--> SubagentID
Discovery --[relevant_to]--> TaskStatus
Discovery --[conflicts_with]--> Discovery
CodeModule --[being_modified_by]--> SubagentID
Decision --[impacts]--> CodeModule
FileLock --[held_by]--> SubagentID
```

#### Usage Pattern: Dependency Checking

**Scenario:** Subagent 3 wants to modify UserRepository, needs to know if AuthService refactor affects it

```
Query:
search_nodes("UserRepository dependencies")

Result:
{
  entities: [
    {
      name: "UserRepository",
      type: "CodeModule",
      observations: [
        "depends_on: [DatabaseConnection, Logger]",
        "used_by: [AuthService, ProfileService]"
      ]
    },
    {
      name: "AuthService",
      type: "CodeModule",
      observations: [
        "status: being_refactored",
        "assigned_to: subagent_2",
        "modification: Adding OAuth, affects UserRepository.findByEmail()"
      ]
    }
  ],
  relations: [
    { from: "AuthService", to: "UserRepository", type: "depends_on" }
  ]
}

Decision:
→ Subagent 3 sees AuthService is being modified
→ Check if changes affect planned work
→ Either: Wait for subagent_2 to complete
→ Or: Coordinate with orchestrator for sequencing
```

#### Usage Pattern: Avoiding Redundant Research

**Scenario:** Subagent 4 needs OAuth best practices, already researched by Subagent 1

```
Query:
search_nodes("OAuth best practices")

Result:
{
  entities: [
    {
      name: "discovery_oauth_research",
      type: "Discovery",
      observations: [
        "Best practice: Use Authorization Code Flow for web apps",
        "Recommended library: passport.js with passport-google-oauth20",
        "Security: Store tokens in httpOnly cookies",
        "Source: Researched by subagent_1 at 14:30:00"
      ]
    }
  ]
}

Decision:
→ Subagent 4 uses existing research
→ Avoids re-researching (saves tokens/time)
→ Adds observation: "Reused by subagent_4 for implementation"
```

---

### 2.3 Tier 3: Semantic Memory/Chroma (Contextual Coordination)

**Purpose:** Share conceptual understanding, code patterns, design decisions through vector similarity

#### Collection Structure for Parallel Work

```
Collection: "parallel_discoveries"
Purpose: Share findings across subagents during execution

Collection: "code_patterns"
Purpose: Reusable implementation patterns found during work

Collection: "architectural_context"
Purpose: High-level design decisions and rationale

Collection: "session_learnings"
Purpose: Long-term learnings from completed parallel sessions
```

#### Document Schema

```json
{
  "id": "discovery_{agent}_{sequence}",
  "document": "Detailed finding or pattern description",
  "metadata": {
    "agent_id": "subagent_2",
    "session_id": "session_abc123",
    "task_id": "implement_oauth",
    "type": "implementation_pattern | research_finding | architectural_decision",
    "timestamp": "2025-10-29T14:35:00Z",
    "file_path": "src/auth/AuthService.ts",  // if applicable
    "relevance_tags": ["authentication", "oauth", "security"],
    "confidence": 0.95,  // agent's confidence in this finding
    "status": "active | superseded | deprecated"
  }
}
```

#### Usage Pattern: Pattern Reuse

**Scenario:** Subagent 3 implementing pagination, Subagent 1 found pattern earlier

```
Subagent 3 Query:
query_documents(
  collection="code_patterns",
  query_texts=["pagination implementation with infinite scroll"],
  n_results=3,
  where={"relevance_tags": {"$contains": "pagination"}}
)

Result:
{
  ids: ["pattern_subagent1_005"],
  documents: [
    "Pagination pattern found in OrderList.tsx: Uses react-infinite-scroll-component 
     with custom useInfiniteQuery hook. Backend supports ?page=X&limit=Y. 
     Implementation maintains scroll position on navigation. 
     Includes loading skeleton and error boundary."
  ],
  metadatas: [{
    "agent_id": "subagent_1",
    "file_path": "src/components/OrderList.tsx",
    "type": "implementation_pattern",
    "relevance_tags": ["pagination", "infinite-scroll", "react"],
    "timestamp": "2025-10-29T14:25:00Z"
  }],
  distances: [0.12]  // highly relevant
}

Subagent 3 Action:
→ Reuses pattern from OrderList.tsx
→ Adapts for UserList.tsx
→ Adds new discovery about adaptations
```

#### Usage Pattern: Conflicting Approaches

**Scenario:** Two subagents discover different solutions, need to resolve

```
Subagent 2 adds:
add_documents(
  collection="parallel_discoveries",
  documents=["For API authentication, use JWT with short expiry (15min) and refresh tokens"],
  ids=["approach_subagent2_auth"],
  metadatas=[{
    "type": "architectural_decision",
    "topic": "authentication_strategy",
    "confidence": 0.85
  }]
)

Subagent 5 adds:
add_documents(
  collection="parallel_discoveries",
  documents=["For API authentication, use session-based auth with Redis for high performance"],
  ids=["approach_subagent5_auth"],
  metadatas=[{
    "type": "architectural_decision",
    "topic": "authentication_strategy",
    "confidence": 0.78
  }]
)

Orchestrator Detects Conflict:
query_documents(
  collection="parallel_discoveries",
  query_texts=["authentication strategy"],
  where={"type": "architectural_decision", "topic": "authentication_strategy"}
)

→ Finds 2 conflicting approaches
→ Evaluates based on project context (stored in KG)
→ Makes decision: JWT (better for microservices architecture)
→ Updates both subagents with unified decision
→ Marks conflicting approach as "superseded"
```

---

## 3. Coordination Protocols

### 3.1 Protocol A: Pre-Task Context Injection

**When:** Before subagent starts work
**Purpose:** Provide relevant context to avoid redundant discovery

```
Orchestrator prepares context package:

1. Query Knowledge Graph for relevant entities
   └─> search_nodes("{task_topic}")
   
2. Query Chroma for similar past work
   └─> query_documents(
         collection="session_learnings",
         query_texts=["{task_description}"],
         n_results=5
       )

3. Check Serena for related code structures
   └─> find_symbol(name_path="{relevant_module}")

4. Inject into subagent session as system context
   └─> "Based on previous work in this session:
        - OAuth research completed (see discovery_oauth_research in KG)
        - Pagination pattern available in OrderList.tsx (see pattern_subagent1_005 in Chroma)
        - AuthService currently being modified by subagent_2 (check KG lock status)"
```

**Implementation:**

```typescript
async function injectContextToSubagent(
  subagentSessionId: string,
  taskDescription: string
) {
  // 1. Get relevant KG entities
  const kgContext = await knowledgeGraph.searchNodes(taskDescription)
  
  // 2. Get similar patterns from Chroma
  const patterns = await chroma.queryDocuments({
    collection: "code_patterns",
    queryTexts: [taskDescription],
    nResults: 3
  })
  
  // 3. Get recent discoveries from parallel agents
  const discoveries = await chroma.queryDocuments({
    collection: "parallel_discoveries",
    queryTexts: [taskDescription],
    where: { status: "active" },
    nResults: 5
  })
  
  // 4. Compile context message
  const contextMessage = `
# Context from Parallel Execution

## Relevant Discoveries:
${discoveries.documents.map((d, i) => 
  `- ${d} (by ${discoveries.metadatas[i].agent_id})`
).join('\n')}

## Available Patterns:
${patterns.documents.map((p, i) => 
  `- ${p} (in ${patterns.metadatas[i].file_path})`
).join('\n')}

## Active Work (check before modifying):
${kgContext.entities
  .filter(e => e.observations.some(o => o.includes('locked')))
  .map(e => `- ${e.name}: ${e.observations.find(o => o.includes('locked'))}`)
  .join('\n')}
`
  
  // 5. Send to subagent session
  await opencodeClient.session.prompt({
    path: { id: subagentSessionId },
    body: {
      noReply: true,
      parts: [{ type: "text", text: contextMessage }]
    }
  })
}
```

---

### 3.2 Protocol B: Real-Time Discovery Sharing

**When:** During subagent execution
**Purpose:** Propagate important discoveries immediately

```
Subagent discovers something significant:

1. Assess if discovery is "share-worthy"
   ├─ High impact on other tasks?
   ├─ Contradicts existing assumptions?
   ├─ Unblocks blocked subagents?
   └─ Critical security/performance finding?

2. If yes, immediately write to Chroma
   └─> add_documents(
         collection="parallel_discoveries",
         documents=["Critical finding: ..."],
         metadatas=[{
           "priority": "high",
           "impacts_tasks": ["task_3", "task_7"],
           "type": "blocker" | "optimization" | "pattern"
         }]
       )

3. Update Knowledge Graph if affects dependencies
   └─> add_observations([{
         entityName: "{affected_module}",
         contents: ["New constraint: ...", "Impact: ..."]
       }])

4. Orchestrator polls or is notified
   └─> Queries Chroma for priority=high discoveries
   └─> Notifies affected subagents
   └─> May pause/redirect subagents if critical
```

**Example:**

```
Subagent 2 discovers while implementing OAuth:

"The current User model lacks an 'oauthProvider' field, 
 which is critical for OAuth implementation. 
 This affects database schema and impacts any subagent 
 working on user-related features."

Immediate actions:
1. Add to Chroma:
   add_documents(
     collection="parallel_discoveries",
     documents=["CRITICAL: User model needs oauthProvider field..."],
     metadatas=[{
       "priority": "high",
       "type": "blocker",
       "impacts_tasks": ["task_3_user_profile", "task_5_user_list"],
       "requires_action": "database_migration"
     }]
   )

2. Update Knowledge Graph:
   add_observations([{
     entityName: "UserModel",
     contents: [
       "Missing field: oauthProvider (string, nullable)",
       "Migration required before OAuth completion",
       "Blocks: profile display, user listing features"
     ]
   }])

3. Orchestrator response:
   - Pauses subagent_3 (working on user profile)
   - Creates new task: "Add oauthProvider migration"
   - Assigns to subagent_2 (already in context)
   - Resumes subagent_3 after migration complete
```

---

### 3.3 Protocol C: Result Aggregation & Deduplication

**When:** Subagent completes task
**Purpose:** Merge findings without duplication

```
Subagent completion checklist:

1. Write final results to Chroma
   └─> add_documents(
         collection="parallel_discoveries",
         documents=["Task completed: {summary}"],
         metadatas=[{
           "status": "completed",
           "task_id": "{id}",
           "result_type": "implementation | research | analysis"
         }]
       )

2. Update Knowledge Graph task status
   └─> update_observations([{
         entityName: "task_{id}",
         contents: ["status: completed", "result: {summary}"]
       }])

3. Release any locks
   └─> delete_entities(["{resource}:lock"])

4. Mark conflicting/obsolete discoveries as superseded
   └─> update_documents(
         collection="parallel_discoveries",
         ids=["{obsolete_discovery_ids}"],
         metadatas=[{ "status": "superseded" }]
       )
```

**Orchestrator Aggregation:**

```typescript
async function aggregateResults(taskGroup: Task[]) {
  const results = []
  
  for (const task of taskGroup) {
    // Get task results from Chroma
    const taskResults = await chroma.getDocuments({
      collection: "parallel_discoveries",
      where: {
        task_id: task.id,
        status: "completed"
      }
    })
    
    // Get final code changes from KG
    const codeChanges = await knowledgeGraph.openNodes([
      `task_${task.id}_changes`
    ])
    
    results.push({
      taskId: task.id,
      agent: task.assignedAgent,
      summary: taskResults.documents[0],
      codeChanges: codeChanges.entities[0].observations,
      metrics: {
        duration: calculateDuration(task),
        filesModified: extractFileCount(codeChanges)
      }
    })
  }
  
  // Deduplicate findings
  const deduplicated = deduplicateFindings(results)
  
  // Identify conflicts
  const conflicts = findConflicts(results)
  
  if (conflicts.length > 0) {
    // Resolve conflicts or escalate to user
    await resolveConflicts(conflicts)
  }
  
  return {
    summary: generateSummary(deduplicated),
    details: deduplicated,
    conflicts: conflicts
  }
}

function deduplicateFindings(results: TaskResult[]) {
  // Use semantic similarity to find duplicate discoveries
  const allFindings = results.flatMap(r => r.summary)
  
  // Query Chroma for similarity within findings
  // If similarity > 0.9, consider duplicate
  // Keep highest confidence version
  
  return uniqueFindings
}
```

---

### 3.4 Protocol D: Conflict Resolution

**When:** Conflicting changes detected
**Purpose:** Resolve without losing work

#### Conflict Detection

```
Types of conflicts:

1. Code Conflicts
   - Two agents modified same file/symbol
   - Detected by: Serena (file change events) + KG (modification records)

2. Architectural Conflicts
   - Different design decisions for same problem
   - Detected by: Chroma semantic similarity + metadata matching

3. Dependency Conflicts
   - Agent A's changes break Agent B's assumptions
   - Detected by: KG relationship queries

4. Resource Conflicts
   - Multiple agents claim same resource
   - Detected by: KG lock entities
```

#### Resolution Strategy

```
Conflict Resolution Priority:

1. Preventive (Best):
   - Lock-based coordination (Protocol 3.1)
   - Pre-task context injection (Protocol 3.1)
   └─> Prevents 80% of conflicts

2. Automatic (Good):
   - Non-overlapping code changes → Auto-merge
   - Compatible architectural decisions → Both keep
   - Superseded discoveries → Mark old as deprecated
   └─> Resolves 15% of remaining conflicts

3. Escalation (Last Resort):
   - True conflicts requiring judgment → Orchestrator decides
   - Critical architectural choices → User input
   └─> Handles final 5%
```

**Example: Code Conflict Resolution**

```
Scenario:
- Subagent 2: Modified AuthService.authenticate() → Added OAuth
- Subagent 5: Modified AuthService.authenticate() → Added rate limiting

Conflict Detected:
orchestrator checks KG:
search_nodes("AuthService.authenticate modifications")

Result: 2 agents modified same method

Resolution Steps:

1. Get both versions from session history
2. Analyze if changes are compatible
   ├─ OAuth: Adds new auth flow (extends functionality)
   └─ Rate limit: Adds decorator/wrapper (orthogonal concern)
3. Determine: Compatible → Merge possible

4. Orchestrator spawns merge subagent:
   Task: "Merge OAuth implementation with rate limiting for AuthService.authenticate()"
   Context: [
     {subagent_2_changes},
     {subagent_5_changes},
     {original_code}
   ]

5. Merge subagent creates unified version
6. Update Chroma with merged pattern
7. Mark both original changes as "merged_into_unified_implementation"
```

---

## 4. Practical Examples

### Example 1: Feature Development with 4 Parallel Subagents

**Task:** "Add real-time notifications with WebSocket"

#### Setup Phase

```
Orchestrator creates execution plan:

PARALLEL GROUP 1 (Research):
├─ Subagent 1: Research WebSocket libraries
├─ Subagent 2: Analyze existing notification code
└─ Subagent 3: Design database schema for notifications

SEQUENTIAL (Design):
└─ Orchestrator: Synthesize research into architecture plan

PARALLEL GROUP 2 (Implementation):
├─ Subagent 4: Backend WebSocket server
├─ Subagent 5: Database migrations
├─ Subagent 6: Frontend notification component
└─ Subagent 7: State management for notifications

Knowledge Graph initialization:
create_entities([
  { name: "task_research_ws_libs", type: "TaskStatus", observations: ["status: pending", "assigned_to: subagent_1"] },
  { name: "task_analyze_notifications", type: "TaskStatus", observations: ["status: pending", "assigned_to: subagent_2"] },
  { name: "task_design_schema", type: "TaskStatus", observations: ["status: pending", "assigned_to: subagent_3"] }
])

create_relations([
  { from: "task_backend_ws", to: "task_research_ws_libs", relationType: "depends_on" },
  { from: "task_frontend_component", to: "task_design_schema", relationType: "depends_on" }
])
```

#### Execution: Parallel Group 1

**Subagent 1 (WebSocket Libraries):**

```
Step 1: Check for existing research
└─> query_documents(
      collection="session_learnings",
      query_texts=["WebSocket library recommendations Node.js"],
      n_results=3
    )
    Result: No prior research in this session

Step 2: Research and document
└─> [performs research]

Step 3: Share findings
└─> add_documents(
      collection="parallel_discoveries",
      documents=[
        "WebSocket library comparison: 
         - ws: Most popular, lightweight, 15M weekly downloads
         - socket.io: Full-featured, 3M downloads, better for beginners
         - uWebSockets.js: Fastest performance, more complex
         
         Recommendation: socket.io for this project (needs room support, reconnection)"
      ],
      ids=["discovery_subagent1_ws_libs"],
      metadatas=[{
        "agent_id": "subagent_1",
        "type": "research_finding",
        "topic": "websocket_libraries",
        "confidence": 0.9,
        "relevance_tags": ["websocket", "backend", "library-selection"]
      }]
    )

Step 4: Update task status
└─> add_observations([{
      entityName: "task_research_ws_libs",
      contents: ["status: completed", "recommendation: socket.io", "rationale: needs room support"]
    }])
```

**Subagent 2 (Analyze Existing Code):**

```
Step 1: Check what's being worked on
└─> search_nodes("notification lock")
    Result: No locks, safe to analyze

Step 2: Use Serena to find existing patterns
└─> find_symbol(
      name_path="notification",
      substring_matching=true
    )
    Result: Found legacy AlertService.ts

Step 3: Share discovery
└─> add_documents(
      collection="parallel_discoveries",
      documents=[
        "Existing notification system found: AlertService.ts
         - Currently uses polling (inefficient)
         - Has NotificationModel in database
         - Frontend uses AlertContext for state
         
         Migration path: Can reuse NotificationModel, replace polling with WebSocket"
      ],
      ids=["discovery_subagent2_existing_code"],
      metadatas=[{
        "agent_id": "subagent_2",
        "file_path": "src/services/AlertService.ts",
        "type": "code_analysis",
        "confidence": 1.0
      }]
    )

Step 4: Update KG with dependencies
└─> create_entities([{
      name: "AlertService",
      type: "CodeModule",
      observations: [
        "Current implementation: polling-based",
        "Uses: NotificationModel",
        "Will be refactored to WebSocket"
      ]
    }])
    
    create_relations([
      { from: "task_backend_ws", to: "AlertService", relationType: "refactors" }
    ])
```

**Subagent 3 (Database Schema):**

```
Step 1: Check if NotificationModel exists (from Subagent 2's discovery)
└─> Wait briefly for discoveries...
└─> query_documents(
      collection="parallel_discoveries",
      query_texts=["notification database model"],
      n_results=1
    )
    Result: Subagent 2 found existing NotificationModel!

Step 2: Read existing model
└─> find_symbol(
      name_path="/NotificationModel",
      include_body=true
    )

Step 3: Determine changes needed
└─> add_documents(
      collection="parallel_discoveries",
      documents=[
        "Database schema analysis:
         - Existing NotificationModel has: id, userId, message, createdAt, read
         - Needs additions: type (chat|system|alert), metadata (JSON), expiresAt
         - Migration: Add 3 columns, backfill type='system' for existing"
      ],
      ids=["discovery_subagent3_schema"],
      metadatas=[{
        "type": "implementation_plan",
        "impacts": ["database", "migrations"],
        "priority": "high"
      }]
    )

Step 4: Update KG
└─> add_observations([{
      entityName: "NotificationModel",
      contents: [
        "New fields required: type, metadata, expiresAt",
        "Migration strategy: Additive (backwards compatible)"
      ]
    }])
```

#### Orchestrator Synthesis

```
After Group 1 completes:

1. Query all discoveries:
   query_documents(
     collection="parallel_discoveries",
     where={"status": "active"},
     n_results=10
   )

2. Synthesize into architecture plan:
   "Architecture Decision:
    - Backend: socket.io server (from Subagent 1)
    - Reuse: Existing NotificationModel + AlertContext (from Subagent 2)
    - Database: Add 3 fields with migration (from Subagent 3)
    - Pattern: Replace AlertService polling with socket.io events"

3. Store decision:
   create_entities([{
     name: "decision_notification_architecture",
     type: "ArchitecturalDecision",
     observations: [
       "Library: socket.io",
       "Reuse: NotificationModel, AlertContext",
       "Migration: Add type, metadata, expiresAt fields",
       "Rationale: Leverage existing code, minimize breaking changes"
     ]
   }])
```

#### Execution: Parallel Group 2

**Subagent 4 (Backend WebSocket):**

```
Step 1: Get context from orchestrator decision
└─> open_nodes(["decision_notification_architecture"])
    Result: Use socket.io, integrate with NotificationModel

Step 2: Acquire lock
└─> create_entities([{
      name: "AlertService.ts:lock",
      type: "FileLock",
      observations: [
        "locked_by: subagent_4",
        "purpose: Converting to WebSocket",
        "eta: 3 minutes"
      ]
    }])

Step 3: Implement
└─> replace_symbol_body(...)
    [implementation details]

Step 4: Share implementation pattern
└─> add_documents(
      collection="code_patterns",
      documents=[
        "WebSocket notification pattern:
         - Server: socket.io with room-based targeting (userId rooms)
         - Events: 'notification:new', 'notification:read', 'notification:delete'
         - Auth: JWT token in handshake
         - Error handling: Automatic reconnection with exponential backoff"
      ],
      ids=["pattern_subagent4_websocket"],
      metadatas=[{
        "file_path": "src/services/WebSocketService.ts",
        "type": "implementation_pattern",
        "reusable": true
      }]
    )

Step 5: Release lock
└─> delete_entities(["AlertService.ts:lock"])
```

**Subagent 5 (Database Migration):**

```
Step 1: Get schema requirements
└─> open_nodes(["NotificationModel"])
    Result: Add type, metadata, expiresAt

Step 2: Check for conflicts
└─> search_nodes("NotificationModel lock")
    Result: No lock (Subagent 4 working on different file)

Step 3: Create migration file (no conflict with code changes)
└─> [creates migration]

Step 4: Update KG
└─> add_observations([{
      entityName: "NotificationModel",
      contents: ["migration_created: 20251029_add_notification_fields.sql"]
    }])
```

**Subagent 6 & 7 (Frontend) - Similar patterns...**

#### Result Aggregation

```
Orchestrator aggregates:

1. Query completed tasks:
   get_documents(
     collection="parallel_discoveries",
     where={"status": "completed"}
   )

2. Check for conflicts:
   search_nodes("lock")
   Result: All locks released, no conflicts

3. Compile summary:
   {
     "feature": "Real-time notifications",
     "subagents_used": 7,
     "duration": "12 minutes",
     "files_modified": 6,
     "discoveries": [
       "Reused existing NotificationModel (saved implementation time)",
       "socket.io chosen for room support",
       "Backwards-compatible migration strategy"
     ],
     "patterns_created": [
       "WebSocket authentication pattern",
       "Room-based notification targeting",
       "Frontend reconnection handling"
     ]
   }

4. Store learnings for future:
   add_documents(
     collection="session_learnings",
     documents=["Real-time notification implementation..."],
     metadatas=[{
       "type": "completed_feature",
       "tags": ["websocket", "notifications", "real-time"],
       "success": true
     }]
   )
```

---

### Example 2: Bug Hunt with 6 Parallel Investigators

**Task:** "Users report intermittent 500 errors on checkout"

#### Investigation Strategy

```
Orchestrator plan:

PARALLEL GROUP (Investigation):
├─ Subagent 1: Analyze error logs
├─ Subagent 2: Review checkout code path
├─ Subagent 3: Check database query performance
├─ Subagent 4: Analyze payment gateway integration
├─ Subagent 5: Review recent deployments
└─ Subagent 6: Test reproduction scenarios

Knowledge Graph setup:
create_entities([
  { name: "bug_checkout_500", type: "BugInvestigation", observations: ["priority: high", "status: investigating"] }
])
```

#### Critical Finding Propagation

**Subagent 3 finds root cause:**

```
Step 1: Discovers issue
└─> Database query timeout on inventory check when >100 items in cart

Step 2: IMMEDIATELY share (high priority)
└─> add_documents(
      collection="parallel_discoveries",
      documents=[
        "ROOT CAUSE FOUND: CheckoutService.verifyInventory() has O(n²) query 
         when cart has many items. Times out at ~100 items. 
         
         Affected query: src/services/CheckoutService.ts:145
         Fix: Batch query instead of individual lookups
         
         This invalidates other investigation paths - likely the only issue."
      ],
      ids=["finding_subagent3_root_cause"],
      metadatas=[{
        "priority": "critical",
        "type": "root_cause",
        "impacts_tasks": ["all_investigation_tasks"],
        "requires_action": "stop_other_investigations"
      }]
    )

Step 3: Update bug entity
└─> add_observations([{
      entityName: "bug_checkout_500",
      contents: [
        "root_cause: O(n²) query in verifyInventory()",
        "found_by: subagent_3",
        "fix: Batch database query",
        "status: root_cause_identified"
      ]
    }])
```

**Orchestrator responds immediately:**

```
1. Detects critical finding (polling or webhook)
   └─> query_documents(
         collection="parallel_discoveries",
         where={"priority": "critical"},
         n_results=1
       )

2. Notifies all other subagents
   └─> For each active subagent:
         - Send context update: "Root cause found by Subagent 3"
         - Redirect to new task: "Validate root cause" or "Stop work"

3. Spawns fix subagent
   └─> Task: "Implement batch query fix for CheckoutService.verifyInventory()"
       Context: [root cause analysis from Subagent 3]

Result: Other 5 subagents stop redundant work, focus shifts to fix
```

---

### Example 3: Refactoring with Dependency Coordination

**Task:** "Refactor authentication system to support SSO"

#### Complex Dependency Management

```
Orchestrator analyzes (using Knowledge Graph):

search_nodes("AuthService")

Result:
{
  entities: [
    { name: "AuthService", type: "CodeModule", observations: ["used_by: 15 components"] }
  ],
  relations: [
    { from: "LoginPage", to: "AuthService", type: "depends_on" },
    { from: "ProfilePage", to: "AuthService", type: "depends_on" },
    { from: "AdminDashboard", to: "AuthService", type: "depends_on" },
    // ... 12 more
  ]
}

Plan:
SEQUENTIAL (High-risk, can't parallelize):
├─ Step 1: Create new SSOAuthService (parallel to old AuthService)
├─ Step 2: Migrate 15 dependents in 3 parallel groups
│  ├─ Group A (5 components): Subagents 1-5
│  ├─ Group B (5 components): Subagents 6-10
│  └─ Group C (5 components): Subagents 11-15
└─ Step 3: Deprecate old AuthService
```

**Coordination during Group A migration:**

```
All subagents check before modifying:

Subagent 1 (migrating LoginPage):
└─> search_nodes("LoginPage dependencies")
    Result: Depends on AuthService, UserContext
    
└─> search_nodes("AuthService lock")
    Result: No lock (new SSOAuthService is separate)
    
└─> Lock component:
    create_entities([{
      name: "LoginPage.tsx:lock",
      type: "FileLock",
      observations: ["locked_by: subagent_1", "purpose: Migrating to SSOAuthService"]
    }])

Subagent 2 (migrating ProfilePage):
└─> Similar checks, locks ProfilePage.tsx

No conflicts because each component is independent!

Shared learning:
└─> Subagent 1 finishes first, shares migration pattern:
    add_documents(
      collection="code_patterns",
      documents=[
        "SSO migration pattern:
         1. Import SSOAuthService instead of AuthService
         2. Replace login() call with ssoLogin()
         3. Update user state to include ssoProvider field
         4. Add conditional rendering for SSO button"
      ],
      ids=["pattern_sso_migration"],
      metadatas=[{ "reusable": true, "applies_to": ["all_auth_dependents"] }]
    )

└─> Subagents 2-5 query this pattern and reuse!
```

---

## 5. Best Practices & Anti-Patterns

### ✅ Best Practices

#### 1. **Proactive Context Injection**
```
DO:
- Inject relevant context before subagent starts
- Query all three memory tiers for context
- Include "what's being worked on" status

DON'T:
- Let subagents discover context reactively
- Assume subagents know session history
```

#### 2. **Immediate High-Priority Sharing**
```
DO:
- Share blocking discoveries immediately (priority=critical)
- Update KG for dependency-affecting changes
- Notify orchestrator of architectural decisions

DON'T:
- Wait until task completion to share findings
- Keep critical discoveries isolated in subagent
```

#### 3. **Lock Everything That Might Conflict**
```
DO:
- Lock files before editing (file-level granularity)
- Lock shared resources (database, APIs)
- Check lock status before acquiring

DON'T:
- Optimistically edit and hope for no conflicts
- Use overly broad locks (lock whole directories)
```

#### 4. **Semantic Deduplication**
```
DO:
- Query Chroma before researching (find existing work)
- Use vector similarity to detect duplicate discoveries
- Mark superseded findings as deprecated

DON'T:
- Assume each subagent needs fresh research
- Keep conflicting discoveries both marked "active"
```

#### 5. **Structured Metadata**
```
DO:
- Use consistent metadata schema across subagents
- Include priority, type, impacts_tasks fields
- Tag with relevance_tags for easy filtering

DON'T:
- Use free-form metadata
- Omit critical fields like agent_id, timestamp
```

---

### ❌ Anti-Patterns

#### 1. **Context Hoarding**
```
PROBLEM:
Subagent discovers important pattern but doesn't share.
Other subagents reinvent the wheel.

SOLUTION:
Mandate sharing via protocol (Protocol B: Real-Time Discovery Sharing).
Orchestrator monitors for discoveries and redistributes.
```

#### 2. **Lock Forgetting**
```
PROBLEM:
Subagent acquires lock, crashes, never releases.
Other subagents blocked indefinitely.

SOLUTION:
- Implement lock timeouts (auto-release after ETA + buffer)
- Orchestrator monitors lock age, force-releases stale locks
- Include lock duration in metadata
```

#### 3. **Assumption Propagation**
```
PROBLEM:
Subagent 1 makes assumption, writes to KG.
Subagent 2 treats it as fact, builds on it.
Assumption was wrong → cascading failure.

SOLUTION:
- Tag assumptions with confidence score
- Orchestrator validates critical assumptions
- Subagents query confidence before trusting
```

#### 4. **Narrow Context Windows**
```
PROBLEM:
Subagent only checks Chroma, misses critical KG lock.
Creates conflicting change.

SOLUTION:
- Always query all three tiers before starting
- Orchestrator enforces checklist
- Pre-task context injection (Protocol A)
```

#### 5. **Result Duplication**
```
PROBLEM:
Three subagents independently implement pagination.
Orchestrator receives 3 implementations.

SOLUTION:
- Semantic similarity check in Chroma (detect similar documents)
- Orchestrator consolidates before final result
- Early sharing prevents late-stage duplication
```

---

## 6. Implementation Checklist

### For Orchestrator Agent

```markdown
□ Initialize memory structures:
  □ Create Chroma collections: parallel_discoveries, code_patterns, session_learnings
  □ Initialize KG with task entities
  □ Set up lock management system

□ Before spawning subagents:
  □ Query all three tiers for relevant context
  □ Inject context into subagent session (Protocol A)
  □ Provide task-specific instructions (include memory usage guidelines)

□ During execution:
  □ Poll Chroma for priority=critical discoveries every 30s
  □ Monitor KG for lock timeouts
  □ Check for conflicting discoveries (semantic similarity)

□ After subagent completion:
  □ Query final results from Chroma + KG
  □ Verify all locks released
  □ Deduplicate findings
  □ Resolve conflicts
  □ Aggregate into coherent result

□ Post-execution:
  □ Move valuable discoveries to session_learnings collection
  □ Update KG with final relationships
  □ Clean up temporary entities (locks, task statuses)
```

### For Subagent Protocol

```markdown
□ On spawn:
  □ Receive context injection from orchestrator
  □ Query Chroma for similar past work
  □ Check KG for relevant dependencies

□ Before modifying code:
  □ Query KG for locks on target file
  □ If locked: wait or work on alternative
  □ If free: acquire lock with ETA

□ During work:
  □ If discovering important pattern: immediately share to Chroma
  □ If affecting dependencies: update KG
  □ If finding blocker: mark priority=critical

□ On completion:
  □ Write final results to Chroma (status=completed)
  □ Update KG task status entity
  □ Release all locks
  □ Mark superseded discoveries as deprecated

□ On error:
  □ Release locks
  □ Write error details to Chroma for debugging
  □ Update KG with failure state
```

---

## 7. Monitoring & Debugging

### Orchestrator Dashboard Queries

```javascript
// Check active subagents
const activeAgents = await knowledgeGraph.searchNodes("status: in_progress")

// Find blocking issues
const criticalFindings = await chroma.queryDocuments({
  collection: "parallel_discoveries",
  where: { priority: "critical", status: "active" },
  nResults: 10
})

// Identify stale locks
const locks = await knowledgeGraph.searchNodes("lock")
const staleLocks = locks.entities.filter(entity => {
  const eta = extractETA(entity.observations)
  return Date.now() > eta + BUFFER
})

// Detect conflicts
const recentChanges = await chroma.queryDocuments({
  collection: "parallel_discoveries",
  where: { status: "completed", timestamp: { $gt: sessionStartTime } },
  nResults: 50
})
const conflicts = detectSemanticConflicts(recentChanges)
```

### Debug Trace Example

```
Session: implement_notification_system
Parallel Agents: 7

Timeline:
14:30:00 │ Orchestrator spawns 3 research agents
14:30:05 │ Subagent 1 queries Chroma for "WebSocket libraries" → 0 results
14:31:22 │ Subagent 1 completes research, writes to Chroma
14:31:30 │ Subagent 2 queries Chroma for "existing notification code" → 0 results
14:32:45 │ Subagent 2 completes analysis, writes to Chroma + updates KG
14:32:50 │ Subagent 3 queries Chroma for "notification database" → HITS Subagent 2's discovery!
14:32:51 │ Subagent 3 reuses finding, saves 2 minutes
14:33:15 │ All research complete, Orchestrator synthesizes
14:33:30 │ Orchestrator spawns 4 implementation agents with context
14:33:35 │ Subagent 4 acquires lock on AlertService.ts
14:33:40 │ Subagent 5 checks lock on AlertService.ts → sees locked, works on migration instead
14:36:22 │ Subagent 4 completes, releases lock, shares pattern to Chroma
14:36:30 │ Subagent 6 queries Chroma for "WebSocket pattern" → HITS Subagent 4's pattern!
14:36:31 │ Subagent 6 reuses pattern for frontend
14:38:00 │ All implementation complete
14:38:10 │ Orchestrator aggregates results → 0 conflicts detected
14:38:15 │ Session complete

Metrics:
- Total time: 8 minutes 15 seconds
- Subagents: 7
- Context reuse events: 2 (saved ~4 minutes)
- Conflicts: 0
- Lock contentions: 1 (handled correctly)
```

---

## 8. Advanced Scenarios

### Scenario A: Adaptive Parallelization

**Situation:** Orchestrator discovers more subtasks than initially planned

```
Initial plan: 5 parallel subagents
During execution: Realizes module has 15 components needing migration

Adaptive response:
1. Query knowledge graph for component dependencies
2. Group into 3 batches of 5 (based on dependency clusters)
3. Spawn 5 subagents for Batch 1
4. After Batch 1 completes, spawn 5 for Batch 2
5. Reuse patterns discovered in Batch 1 for Batch 2+
```

### Scenario B: Cascading Discoveries

**Situation:** Discovery by one subagent invalidates assumptions of others

```
Subagent 3 discovers: "API v2 is being deprecated, must use v3"

Orchestrator response:
1. Detect impact:
   search_nodes("depends_on: API v2")
   Result: Subagents 5, 7, 9 are building features on v2

2. Immediate broadcast:
   - Pause affected subagents
   - Inject new context: "API v2 deprecated, use v3"
   - Update KG with new constraint

3. Restart affected work:
   - Subagents 5, 7, 9 use v3 instead
   - Pattern shared: "v3 authentication flow"
```

### Scenario C: Speculative Parallelization

**Situation:** Two possible approaches, unclear which is better

```
Orchestrator spawns:
├─ Subagent 1: Implement Approach A (Redis-based caching)
└─ Subagent 2: Implement Approach B (PostgreSQL materialized views)

Both complete implementations.

Evaluation phase:
- Compare performance, complexity, maintenance
- Orchestrator chooses Approach A
- Mark Approach B work as "exploratory_rejected"
- Store both in session_learnings for future reference

Cost: 2x work
Benefit: High confidence in chosen approach, exploration for future
```

---

## 9. Future Enhancements

### Vision: Fully Autonomous Coordination

```
Current state: Orchestrator-mediated coordination
Future state: Peer-to-peer subagent coordination

Mechanism:
- Subagents subscribe to relevant Chroma collections
- Automatic notifications on new discoveries
- Negotiation protocol for lock contention
- Distributed consensus for architectural decisions

Example:
Subagent 5 wants to modify AuthService.ts:

1. Broadcasts intention to peer subagents
2. Checks if any peer is working on AuthService
3. Subagent 2 responds: "I'm refactoring AuthService"
4. Negotiation:
   - Option A: Subagent 5 waits
   - Option B: Coordinate simultaneous edits (different methods)
   - Option C: Subagent 2 includes Subagent 5's changes in refactor
5. Choose Option C (most efficient)
6. Subagent 5 sends requirements to Subagent 2
7. Subagent 2 incorporates and completes

No orchestrator involved → faster, more scalable
```

### Vision: Predictive Context Loading

```
Current: React to discoveries
Future: Predict what will be needed

Mechanism:
- Analyze past sessions from session_learnings
- Identify patterns: "When implementing X, always need Y"
- Preemptively load context for subagents

Example:
Task: "Add pagination to UserList"

Traditional:
1. Subagent starts
2. Searches for pagination patterns
3. Finds OrderList example
4. Implements

Predictive:
1. Orchestrator sees "pagination" in task
2. Queries session_learnings: "Past pagination tasks"
3. Loads OrderList pattern BEFORE spawning subagent
4. Subagent receives pattern in initial context
5. Immediately implements (no search phase needed)

Result: 30% faster task completion
```

---

## 10. Summary

### Key Principles

1. **Three-Tier Specialization**
   - Serena: Code structure & surgical edits
   - Knowledge Graph: Facts, dependencies, coordination state
   - Chroma: Semantic search, pattern reuse, conceptual similarity

2. **Proactive Over Reactive**
   - Inject context before starting
   - Share discoveries immediately
   - Lock before editing

3. **Coordination Through Memory**
   - KG for state coordination (locks, task status)
   - Chroma for knowledge sharing (patterns, findings)
   - Serena for code structure queries (read-only mostly)

4. **Conflict Prevention Over Resolution**
   - Locks prevent 80% of conflicts
   - Context injection prevents 15%
   - Only 5% require resolution

5. **Optimize for Common Case**
   - Most parallel work is independent
   - Share discoveries to maximize reuse
   - Escalate only true conflicts

### Quick Reference: When to Use Each Tier

| Situation | Use | Why |
|-----------|-----|-----|
| Before editing code | Serena (`find_symbol`) + KG (check locks) | Find exact location, verify not locked |
| Found useful pattern | Chroma (`add_documents` to code_patterns) | Share for reuse by other subagents |
| Architectural decision | KG (`create_entity` type=Decision) | Create single source of truth |
| Need past similar work | Chroma (`query_documents` with similarity) | Vector search finds conceptual matches |
| Check task dependencies | KG (`search_nodes`, `read_graph`) | Graph traversal reveals relationships |
| Coordinate file access | KG (lock entities) + Serena (edits) | Prevent conflicts, precise changes |
| Share urgent discovery | Chroma (priority=critical) + KG (update entity) | Immediate propagation to affected agents |

---

## 11. Conclusion

Parallel subagent execution in OpenCode is **viable and powerful** when memory coordination is done correctly. The three-tier system provides:

- **Serena**: Precise, conflict-free code operations
- **Knowledge Graph**: Structured coordination state
- **Chroma**: Semantic knowledge sharing

By following the protocols in this guide:
- ✅ Redundant work is eliminated
- ✅ Conflicts are prevented (not just resolved)
- ✅ Discoveries propagate immediately
- ✅ Context remains coherent across agents
- ✅ Scaling to 10+ parallel agents is feasible

**Result:** Complex tasks that take hours serially can complete in minutes through intelligent parallelization with proper memory coordination.

---

*Strategy Version: 1.0*  
*Last Updated: 2025-10-29*  
*Compatible with: OpenCode ≥ 0.15.18, Serena MCP, Chroma MCP, Knowledge Graph MCP*
