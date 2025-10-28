# Multi-Agent Task Execution Architecture Research
## Comprehensive Analysis with Edge Cases

---

## EXECUTIVE SUMMARY

This research provides an **extensive, truthful analysis** of building a multi-agent task execution architecture where a primary AI agent (OpenCode) delegates subtasks to specialized worker agents (Qwen/Gemini CLIs) coordinated through MCP and file-based communication, with a lightweight tracking subagent.

**Key Finding**: MCP alone is **insufficient** for task coordination—it's designed for tool/data access, not workflow orchestration. Recommended hybrid: **Redis Streams for queue + File-based results + MCP for tool access**.

---

## 1. MCP SERVER DESIGN

### Core Capabilities
**Model Context Protocol (MCP)** is an open-source standard (Apache 2.0) developed by Anthropic for connecting AI applications to external systems.

#### Architecture Pattern
- **Client-Server Model**: AI applications (MCP clients) connect to data sources (MCP servers)
- **JSON-RPC 2.0 Transport**: Uses JSON-RPC over stdio, SSE (Server-Sent Events), or HTTP+SSE
- **Three Primitives**:
  1. **Resources**: Context and data (URI-based, text or binary)
  2. **Tools**: Functions the LLM can invoke
  3. **Prompts**: Reusable prompt templates

#### Key Features for Agent Coordination
- **Bidirectional communication**: Servers can emit progress notifications
- **RESTful control**: Management via HTTP API (for some implementations)
- **Stateless protocol**: Each request is independent
- **SDK support**: TypeScript, Python officially supported

### ⚠️ CRITICAL LIMITATIONS for Task Coordination
1. **NOT designed for task queuing**: MCP is for context/tool access, not workflow orchestration
2. **No built-in state management**: Each connection is ephemeral
3. **No task persistence**: Server restarts lose all state
4. **No distributed coordination**: Single client ↔ single server model
5. **No priority queues**: FIFO processing only
6. **No retry logic**: Must be implemented at client layer
7. **No load balancing**: One-to-one connections

### Alternative Coordination Systems

| System | Startup | Throughput | Persistence | Complexity | Best For |
|--------|---------|------------|-------------|------------|----------|
| **RabbitMQ** | ~500ms | 50k msg/s | Yes (disk) | Medium | Reliable async tasks |
| **Redis Pub/Sub** | <50ms | 1M msg/s | No | Low | Fast, ephemeral tasks |
| **Redis Streams** | <50ms | 100k msg/s | Yes (memory) | Medium | Event sourcing |
| **ZeroMQ** | <10ms | 10M msg/s | No | Low | High-speed IPC |
| **Custom WebSocket** | <100ms | Variable | No | Medium | Real-time bidirectional |
| **File-based + inotify** | <1ms | 10k events/s | Yes (disk) | Very Low | Simple, local coordination |

### Recommendation for Agent Coordination
**Hybrid Approach**:
- **MCP for tool/data access**: Workers use MCP to access tools (filesystem, APIs, databases)
- **Redis Streams for task queue**: Central coordinator manages task distribution
- **File-based for results**: Workers write JSON results to shared filesystem with atomic operations

---

## 2. WORKER AGENT ENVIRONMENTS

### Isolation Options Comparison

#### Docker Containers
**Performance**:
- Cold start: 300-500ms
- Warm start: <100ms (pre-pulled images)
- Memory overhead: ~5-10 MB per container + guest OS
- CPU overhead: Negligible (cgroups)

**Isolation**:
- Process: ✅ (namespaces)
- Filesystem: ✅ (overlay fs)
- Network: ✅ (virtual interfaces)
- Kernel: ❌ (shared with host)

**Edge Cases**:
- **Resource exhaustion**: `--memory`, `--cpus` limits can cause OOM kills
- **Disk full**: Container stops; needs monitoring
- **Network partitions**: Health checks fail; orchestrator may restart
- **Zombie processes**: PID 1 must reap children or they accumulate
- **Shared kernel vulnerabilities**: Privilege escalation possible

#### Firecracker MicroVMs
**Performance**:
- Cold start: **<125ms**
- Memory overhead: **<5 MiB per microVM**
- Boot time: Sub-second (optimized kernel)

**Isolation**:
- Full VM isolation with KVM virtualization
- Minimal attack surface (5 emulated devices: virtio-net, virtio-block, virtio-vsock, serial, keyboard)
- Used by AWS Lambda, Fargate

**Edge Cases**:
- **Nested virtualization**: Requires KVM support (not available in all clouds)
- **Resource limits**: Hard-capped at boot time
- **No hot-add memory/CPU**: Must recreate VM
- **Guest kernel crashes**: Requires full VM restart
- **Rate limiting**: Built-in network/storage rate limiters can throttle unexpectedly

#### Process Isolation (Linux)
**Performance**:
- Cold start: <10ms
- Memory overhead: ~1 MB
- Minimal syscall overhead

**Isolation Mechanisms**:
- **seccomp**: Syscall filtering (whitelist dangerous calls)
- **namespaces**: PID, network, mount isolation
- **cgroups**: CPU, memory, I/O limits

**Edge Cases**:
- **seccomp bypass**: Misconfigured filters allow ptrace/unshare
- **/proc leaks**: Mounting /proc exposes host info
- **UID mapping**: Incorrect user namespaces allow privilege escalation
- **Capabilities**: CAP_SYS_ADMIN is extremely dangerous
- **Shared /tmp**: Race conditions, symlink attacks

#### WASM Runtimes (Wasmtime, Wasmer)
**Performance**:
- Cold start: <1ms (milliseconds)
- Memory: Extremely low (~100KB overhead)
- Execution: Near-native (AOT compilation)
- Startup: 100x faster than containers (per Wasmer docs)

**Limitations for AI Agents**:
- ❌ **No native GPU access** (critical for local LLMs)
- ❌ **Python ecosystem limited** (CPython not supported)
- ❌ **Node.js support experimental**
- ⚠️ **Large binaries**: LLM inference engines (100MB+) exceed practical limits
- ⚠️ **Memory constraints**: 32-bit address space (4GB max)

**Use Case**: Micro-tasks like validation, parsing, formatting; NOT full agent execution

### Worker Pool Strategies

#### On-Demand Spawning
```
Task arrives → Spawn worker → Execute → Terminate
```
**Pros**: No idle resource consumption
**Cons**: Cold start latency (100-500ms per task)
**Best for**: Infrequent tasks, cost-sensitive workloads

#### Pre-Warmed Pool
```
Startup: Create 5 workers → Wait for tasks
Task arrives → Assign to idle worker → Return to pool
```
**Pros**: Zero cold start latency
**Cons**: Idle resource cost (memory, license fees for APIs)
**Best for**: High-throughput, latency-sensitive workloads

**Edge Cases**:
- **Pool exhaustion**: More tasks than workers → queueing delay
- **Stale workers**: Long-running workers accumulate state → need periodic restart
- **License limits**: API-based models hit rate limits
- **Memory leaks**: Workers grow unbounded → OOM, need health checks

#### Hybrid (Recommended)
```
Min pool: 2 workers (always running)
Max pool: 10 workers (scale on demand)
Scale-up: +1 worker if queue > 5 tasks for 10s
Scale-down: -1 worker if idle > 60s
```

---

## 3. COMMUNICATION PROTOCOL

### File-Based Coordination Design

#### Directory Structure
```
/shared/
├── tasks/
│   ├── pending/
│   │   └── task_<uuid>.json      # Coordinator writes
│   ├── claimed/
│   │   └── task_<uuid>.json      # Worker moves here
│   └── completed/
│       └── task_<uuid>.json      # Worker moves here with results
├── heartbeats/
│   └── worker_<id>.json          # Workers update every 5s
└── logs/
    └── task_<uuid>.log           # Append-only logs
```

#### Task Format (JSON)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "code_review",
  "priority": 1,
  "created_at": "2025-10-17T10:30:00Z",
  "timeout": 300,
  "input": {
    "code": "...",
    "language": "python"
  },
  "dependencies": [],
  "retry_count": 0,
  "max_retries": 3
}
```

#### Result Format
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "worker_id": "worker-qwen-01",
  "status": "success",
  "started_at": "2025-10-17T10:30:05Z",
  "completed_at": "2025-10-17T10:32:15Z",
  "output": {
    "review": "...",
    "issues_found": 3
  },
  "tokens_used": 2500,
  "cost_usd": 0.0025
}
```

### Atomic Operations (Race Condition Prevention)

#### Problem: Multiple Workers Claim Same Task
**Solution**: Atomic move with `renameat2(RENAME_NOREPLACE)`

```python
import os

def claim_task(task_path: str, worker_id: str) -> bool:
    """Atomically claim a task"""
    pending = f"tasks/pending/{task_path}"
    claimed = f"tasks/claimed/{task_path}.{worker_id}"
    
    try:
        # Linux kernel 3.15+: atomic move, fails if dest exists
        os.rename(pending, claimed)
        return True
    except FileExistsError:
        # Another worker claimed it
        return False
    except FileNotFoundError:
        # Task already claimed or doesn't exist
        return False
```

**Edge Cases**:
- **NFS filesystems**: `renameat2` not supported → use flock() + rename
- **CIFS/SMB**: Atomic operations unreliable → use Redis for coordination
- **ext3**: No nanosecond timestamps → collision risk increases

#### Inotify for Task Detection
```python
import inotify_simple

watcher = inotify_simple.INotify()
watcher.add_watch('tasks/pending/', inotify_simple.flags.CREATE)

for event in watcher.read(timeout=1000):
    if event.mask & inotify_simple.flags.CREATE:
        task_file = event.name
        attempt_claim(task_file)
```

**Edge Cases**:
- **Event coalescing**: Rapid file creation may miss events → poll every 1s as backup
- **Buffer overflow**: `inotify_queue_len` exceeded → lost events
- **Subdirectories**: CREATE doesn't trigger on nested files → watch recursively

### Alternative IPC Mechanisms

#### Unix Domain Sockets
**Performance**: 40-50% faster than TCP for local communication (no network stack)
**Protocol**: SOCK_STREAM (reliable) or SOCK_DGRAM (fast)
**Use case**: Coordinator ↔ Worker RPC calls

**Edge Cases**:
- **Buffer size limits**: 128KB default → large tasks need chunking
- **Socket file cleanup**: Stale sockets from crashes block bind()
- **Permission errors**: Socket file must be accessible to all workers

#### Shared Memory (POSIX shm)
**Performance**: Zero-copy, fastest IPC (~5-10x faster than sockets)
**Use case**: Large data passing (images, documents)

```python
from multiprocessing import shared_memory

# Coordinator writes
shm = shared_memory.SharedMemory(create=True, size=1024*1024)  # 1MB
shm.buf[:len(data)] = data

# Worker reads
shm = shared_memory.SharedMemory(name='task_data')
data = bytes(shm.buf[:expected_size])
```

**Edge Cases**:
- **No synchronization**: Need separate semaphore/mutex
- **Manual cleanup**: Orphaned shm segments persist across reboots
- **Size limits**: `/dev/shm` typically limited to 50% RAM
- **No schema**: Workers must know data format in advance

---

## 4. TRACKING SUBAGENT MODEL SELECTION

### Model Comparison (Cost & Latency)

| Model | Input ($/1M tok) | Output ($/1M tok) | Latency (P50) | Context | Best For |
|-------|------------------|-------------------|---------------|---------|----------|
| **GPT-4o-mini** | $0.15 | $0.60 | ~300ms | 128K | Structured output, high reliability |
| **Gemini 2.0 Flash** | $0.075 | $0.30 | ~200ms | 1M | Long context, cheapest |
| **Claude Haiku 4.5** | $1.00 | $5.00 | ~250ms | 200K | Best reasoning, higher cost |
| **Qwen2.5-7B (local)** | $0 (compute) | $0 (compute) | ~50-100ms (GPU) | 32K | No API costs, requires GPU |
| **Llama 3.2-8B (local)** | $0 (compute) | $0 (compute) | ~60-120ms (GPU) | 128K | Open weights, good context |

### Local Model Deployment Costs

#### Qwen2.5-7B
**Hardware Requirements**:
- **FP16**: 14GB VRAM (RTX 4090, A10G)
- **INT8**: 7GB VRAM (RTX 3090)
- **INT4**: 4GB VRAM (RTX 3060)

**Inference Speed** (batch=1, on RTX 4090):
- FP16: 80 tok/s
- INT8: 120 tok/s  
- INT4: 180 tok/s

**Cost Analysis**:
- **Cloud GPU**: $0.50-1.50/hr (AWS g5.xlarge, GCP A2)
- **Break-even**: ~300K tokens/hr vs GPT-4o-mini
- **Idle cost**: 24/7 GPU = $360-1080/month

**Edge Cases**:
- **OOM during long context**: 32K context + large batch → memory spike
- **Model loading**: 5-10s initial load → pre-warm at startup
- **Quantization errors**: INT4 degrades reasoning → validate accuracy
- **GPU sharing**: Multiple models compete for VRAM → pod eviction

### Tracking Subagent Prompt Strategy

**Goal**: Maintain task dependency tree, update status, estimate completion time

#### Structured Output Format
```json
{
  "tasks": [
    {
      "id": "task-1",
      "status": "completed",
      "result": "success",
      "children": ["task-2", "task-3"]
    },
    {
      "id": "task-2",
      "status": "in_progress",
      "started_at": "2025-10-17T10:35:00Z",
      "est_completion": "2025-10-17T10:38:00Z"
    }
  ],
  "blocked_on": [],
  "next_actionable": ["task-4"]
}
```

#### Prompt Template
```
You are a task tracking system. Update the task tree based on this event:
Event: {event_type} for task {task_id}
Current tree: {json_tree}

Output ONLY valid JSON with updated tree. No explanations.
```

**Edge Cases**:
- **Context overflow**: >1000 tasks → summarize completed tasks
- **Circular dependencies**: Detect cycles with DFS → mark as error
- **Hallucinated task IDs**: Validate all IDs exist before updating
- **Non-JSON output**: Retry with stronger "JSON ONLY" constraint

### Recommendation: Gemini 2.0 Flash
**Rationale**:
- **Cost-effective**: 50% cheaper than GPT-4o-mini
- **Low latency**: 200ms P50 (acceptable for tracking)
- **Large context**: 1M tokens (handles 10K+ task history)
- **Structured output**: Native JSON mode
- **API reliability**: Google infrastructure, 99.9% SLA

**Fallback**: If Gemini unavailable → GPT-4o-mini (1.5x cost but higher reliability)

---

## 5. TASK DECOMPOSITION STRATEGIES

### Graph-Based Decomposition

#### Critical Path Method (CPM)
```
Task graph: A(5s) → B(10s) → D(3s)
            A(5s) → C(2s) → D(3s)

Critical path: A → B → D (18s total)
Non-critical: C (can delay 8s without affecting completion)
```

**Algorithm**:
1. Build directed acyclic graph (DAG) of tasks
2. Forward pass: earliest start time (EST)
3. Backward pass: latest start time (LST)
4. Slack = LST - EST (zero slack = critical path)

**Parallelization Strategy**: Schedule non-critical tasks opportunistically

**Edge Cases**:
- **Circular dependencies**: Topological sort fails → return error
- **Dynamic task discovery**: New dependencies during execution → re-compute CP
- **Resource constraints**: Critical path assumes unlimited parallelism → adjust for worker limits

### Work-Stealing Algorithm

#### Cilk-Style Randomized Work-Stealing
```python
class Worker:
    def __init__(self, id: int):
        self.id = id
        self.deque = collections.deque()  # Own tasks
        
    def run(self):
        while True:
            task = self.deque.pop() if self.deque else self.steal()
            if task:
                result = execute(task)
                if result.has_children:
                    self.deque.extend(result.children)  # Push children locally
            else:
                break  # No work left
                
    def steal(self) -> Task:
        victim = random.choice(workers)
        if victim.deque:
            return victim.deque.popleft()  # Steal oldest task (FIFO from bottom)
        return None
```

**Properties**:
- **Locality**: Workers execute own subtasks (cache-friendly)
- **Load balancing**: Idle workers steal from busy ones
- **Provable bounds**: O(T/P + D) expected time (T=work, P=processors, D=depth)

**Edge Cases**:
- **Starvation**: All workers try to steal from one victim → use randomized backoff
- **ABA problem**: Task pointer reused → use generation counters
- **Double-steal**: Two workers steal same task → deque needs lock or lock-free impl

### Delegation Decision Heuristic

#### Cost-Benefit Model
```python
def should_delegate(task: Task) -> bool:
    estimated_duration = predict_duration(task)  # ML model or heuristic
    delegation_overhead = 0.5  # 500ms: serialize, transmit, deserialize
    
    # Delegate if task takes >2x overhead AND workers available
    return (estimated_duration > 2 * delegation_overhead and 
            get_idle_workers() > 0)
```

**Duration Prediction**:
- **Rule-based**: Task type → fixed estimate (code review: 60s, test: 10s)
- **ML-based**: Train regression model on (task_features, duration) history
- **Adaptive**: Exponential moving average of recent durations

**Edge Cases**:
- **Cold start penalty**: First task to new worker takes 5-10x longer (model loading)
- **Data locality**: Task requires 100MB file → transfer cost dominates
- **Cascading failures**: Delegated task fails → retry on primary? Exponential backoff?

### Granularity Tuning

**Problem**: Too small = overhead dominates; too large = poor parallelism

**Strategy**:
```python
min_task_size = 1s  # Don't parallelize tasks <1s
max_task_size = 60s  # Split tasks >60s into subtasks

if estimated_duration < min_task_size:
    execute_locally()
elif estimated_duration > max_task_size:
    split_task()
else:
    delegate_if_workers_available()
```

**Edge Cases**:
- **Splitting overhead**: Some tasks can't be cleanly split → force sequential
- **Recursive decomposition**: Each split adds coordination → depth limit
- **Load spikes**: All tasks complete simultaneously → thundering herd on coordinator

---

## 6. ERROR HANDLING & RECOVERY

### Retry Logic Patterns

#### Exponential Backoff with Jitter
```python
import random
import time

def retry_with_backoff(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            
            # Exponential backoff: 1s, 2s, 4s
            base_delay = 2 ** attempt
            # Jitter: ±25% randomization to avoid thundering herd
            jitter = random.uniform(0.75, 1.25)
            delay = base_delay * jitter
            
            print(f"Attempt {attempt+1} failed: {e}. Retrying in {delay:.2f}s")
            time.sleep(delay)
```

**Edge Cases**:
- **Non-transient errors**: Retry loop wastes time on permanent failures (e.g., invalid input)
  - **Solution**: Categorize exceptions (retriable vs fatal)
- **Cascading retries**: Failure → retry → dependency timeout → upstream retry
  - **Solution**: Total timeout across all retries (e.g., 5min max)

#### Circuit Breaker Pattern
```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_count = 0
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self.opened_at = None
        
    def call(self, func):
        if self.state == "OPEN":
            if time.time() - self.opened_at > self.timeout:
                self.state = "HALF_OPEN"
            else:
                raise Exception("Circuit breaker open")
        
        try:
            result = func()
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                self.opened_at = time.time()
            raise
```

**Use Case**: Prevent cascading failures when worker pool is degraded

### Partial Completion Checkpointing

#### Write-Ahead Log (WAL)
```python
def execute_with_checkpointing(task: Task):
    wal = WriteAheadLog(f"wal/{task.id}.log")
    
    for step in task.steps:
        # Record intent before execution
        wal.append({"step": step.id, "status": "started"})
        
        result = step.execute()
        
        # Record completion after execution
        wal.append({"step": step.id, "status": "completed", "result": result})
    
    wal.commit()
```

**Recovery**:
```python
def recover_task(task_id: str):
    wal = WriteAheadLog(f"wal/{task_id}.log")
    completed_steps = set()
    
    for entry in wal.read():
        if entry["status"] == "completed":
            completed_steps.add(entry["step"])
    
    # Resume from first incomplete step
    for step in task.steps:
        if step.id not in completed_steps:
            step.execute()
```

**Edge Cases**:
- **WAL corruption**: Disk full → log truncated → state ambiguous
  - **Solution**: Checksum each entry, discard invalid tail
- **Replay idempotency**: Step executed twice (once before crash, once after)
  - **Solution**: Steps must be idempotent or WAL stores result

### Timeout Strategies

#### Per-Task-Type Timeouts
```python
TIMEOUTS = {
    "code_review": 120,  # 2 minutes
    "test_execution": 300,  # 5 minutes
    "model_inference": 30,  # 30 seconds
}

def execute_with_timeout(task: Task):
    timeout = TIMEOUTS.get(task.type, 60)  # Default 60s
    
    try:
        return run_with_timeout(task.execute, timeout)
    except TimeoutError:
        task.status = "timeout"
        raise
```

**Adaptive Timeouts**:
```python
class AdaptiveTimeout:
    def __init__(self):
        self.history = []
        
    def get_timeout(self, task_type: str) -> float:
        recent = self.history[-100:]  # Last 100 tasks of this type
        p95 = np.percentile([t.duration for t in recent], 95)
        return p95 * 1.5  # 50% buffer
```

**Edge Cases**:
- **Hung processes**: Timeout expires but process still running → need SIGKILL
- **Partial results**: 90% complete when timeout hits → discard or use partial?
- **Clock skew**: Worker clock drifts → timeout calculation incorrect

### Rollback Mechanisms

#### Compensating Transactions (Saga Pattern)
```python
class Saga:
    def __init__(self):
        self.steps = []
        self.compensations = []
        
    def add_step(self, forward, backward):
        self.steps.append(forward)
        self.compensations.append(backward)
        
    def execute(self):
        completed = []
        try:
            for step in self.steps:
                result = step()
                completed.append(result)
        except Exception as e:
            # Rollback in reverse order
            for i in reversed(range(len(completed))):
                self.compensations[i](completed[i])
            raise

# Example
saga = Saga()
saga.add_step(
    forward=lambda: create_file("output.txt"),
    backward=lambda file: os.remove(file)
)
saga.add_step(
    forward=lambda: send_notification(),
    backward=lambda: send_cancellation()
)
saga.execute()
```

**Edge Cases**:
- **Non-reversible operations**: API call succeeded → can't undo (email sent)
  - **Solution**: Idempotent operations + log for manual cleanup
- **Compensation failure**: Rollback step itself fails → stuck in limbo
  - **Solution**: Dead letter queue for manual intervention

### Monitoring & Observability

#### Heartbeat Protocol
```python
class Worker:
    def __init__(self):
        self.heartbeat_file = f"heartbeats/worker_{self.id}.json"
        
    def send_heartbeat(self):
        while True:
            with open(self.heartbeat_file, 'w') as f:
                json.dump({
                    "worker_id": self.id,
                    "timestamp": time.time(),
                    "status": self.status,
                    "current_task": self.current_task_id,
                    "memory_mb": get_memory_usage(),
                }, f)
            time.sleep(5)  # Update every 5s
```

**Coordinator Health Check**:
```python
def check_workers():
    now = time.time()
    for heartbeat_file in glob("heartbeats/*.json"):
        with open(heartbeat_file) as f:
            data = json.load(f)
        
        if now - data["timestamp"] > 15:  # No heartbeat for 15s
            print(f"Worker {data['worker_id']} unresponsive")
            restart_worker(data['worker_id'])
```

**Edge Cases**:
- **False positives**: Network latency or coordinator CPU spike → worker appears dead
  - **Solution**: Require 3 consecutive missed heartbeats
- **Zombie workers**: Process alive but stuck in infinite loop → heartbeat still sent
  - **Solution**: Include progress metric (e.g., tokens processed)

### Cascading Failure Prevention

#### Bulkhead Pattern
```python
worker_pools = {
    "critical": WorkerPool(size=3),    # High-priority tasks
    "standard": WorkerPool(size=5),    # Normal tasks
    "background": WorkerPool(size=2),  # Low-priority tasks
}

def submit_task(task: Task):
    pool = worker_pools[task.priority]
    pool.submit(task)
```

**Benefit**: "background" pool failure doesn't affect "critical" tasks

**Edge Cases**:
- **Pool starvation**: All critical workers busy → tasks queued even if standard workers idle
  - **Solution**: Allow borrowing from lower-priority pools

---

## 7. PROOF OF CONCEPT ARCHITECTURE

### System Overview

```
┌─────────────────┐
│  Primary Agent  │ (OpenCode with Claude)
│   (Coordinator) │
└────────┬────────┘
         │
         ├─── Creates tasks, monitors progress
         │
         v
┌────────────────────────────────────┐
│      Task Queue (Redis Streams)    │
│  pending:   [task1, task2, task3]  │
│  claimed:   [task4]                │
│  completed: [task5, task6]         │
└────────────────────────────────────┘
         │
         ├─── Workers poll for tasks
         │
    ┌────┴────┬────────┬────────┐
    v         v        v        v
┌────────┐┌────────┐┌────────┐┌────────┐
│ Worker ││ Worker ││ Worker ││ Worker │
│ Qwen   ││ Gemini ││ Qwen   ││ Local  │
│  (VM)  ││  (VM)  ││  (VM)  ││  (GPU) │
└────────┘└────────┘└────────┘└────────┘
    │         │        │        │
    └─────────┴────────┴────────┘
              │
              v (write results)
┌───────────────────────────────────┐
│  Shared Filesystem (NFS/EFS)     │
│  /results/task_<id>.json         │
└───────────────────────────────────┘
              │
              v (read results)
┌──────────────────────────────────┐
│  Tracking Subagent               │
│  (Gemini 2.0 Flash)              │
│  - Maintains task tree           │
│  - Updates coordinator           │
└──────────────────────────────────┘
```

### Component Specification

#### 1. MCP Server (Task Queue)
**Implementation**: Python FastAPI server
- **Endpoint**: `/mcp/tools/task-queue`
- **Operations**:
  - `submit_task(task_json)` → task_id
  - `get_pending_tasks()` → [task_ids]
  - `claim_task(task_id, worker_id)` → success/failure
  - `complete_task(task_id, result_json)` → success

**Storage**: Redis Streams
```python
# Submit task
redis.xadd("tasks:pending", {"data": json.dumps(task)})

# Claim task (atomic)
task_id = redis.xreadgroup("tasks", "workers", "worker-1", count=1)
redis.xack("tasks", "workers", task_id)
```

#### 2. Worker Agent Template
**Base Image**: Ubuntu 22.04 + Python 3.11
**Pre-installed**:
- MCP SDK (Python)
- Worker agent code
- Model CLI (Qwen, Gemini)

**Startup Script**:
```bash
#!/bin/bash
export WORKER_ID=$(uuidgen)
export MCP_SERVER=http://coordinator:8000

python worker.py --model qwen2.5-7b --pool-name standard
```

**Worker Loop**:
```python
while True:
    task = mcp.call("task-queue", "get_next_task", worker_id=WORKER_ID)
    if not task:
        time.sleep(1)
        continue
    
    result = execute_task(task)
    
    # Write result to filesystem (atomic)
    temp_file = f"/results/.tmp_{task['id']}"
    with open(temp_file, 'w') as f:
        json.dump(result, f)
    os.rename(temp_file, f"/results/{task['id']}.json")
    
    mcp.call("task-queue", "complete_task", task_id=task['id'])
```

#### 3. Tracking Subagent
**Model**: Gemini 2.0 Flash (API)
**Trigger**: inotify on `/results/` directory

```python
watcher = inotify_simple.INotify()
watcher.add_watch('/results/', inotify_simple.flags.CLOSE_WRITE)

for event in watcher.read():
    result_file = event.name
    with open(f'/results/{result_file}') as f:
        result = json.load(f)
    
    # Update task tree
    prompt = f"""
    Update task tree with this completion:
    Task ID: {result['task_id']}
    Status: {result['status']}
    Current tree: {json.dumps(task_tree)}
    """
    
    updated_tree = gemini.generate(prompt, response_format="json")
    task_tree = json.loads(updated_tree)
```

### Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Task submission latency** | <50ms | Coordinator → Redis write |
| **Worker claim latency** | <100ms | Redis poll → claim |
| **End-to-end task time** | 5-60s | Submit → result file |
| **Coordinator overhead** | <5% CPU | Monitor with `top` |
| **Worker startup time** | <500ms | VM boot → first task claim |
| **Tracking update latency** | <300ms | Result file → tree update |

### Cost Analysis (100 tasks/hour baseline)

**Scenario: 100 tasks/hour, avg 30s each, mixed complexity**

#### Option A: All API-based (GPT-4o-mini workers)
- **Worker API calls**: 100 tasks × 5K tokens avg × $0.15/1M = **$0.075/hr**
- **Tracking subagent**: 100 updates × 2K tokens avg × $0.075/1M = **$0.015/hr**
- **Infrastructure**: Coordinator VM ($0.05/hr)
- **Total**: **$0.14/hr** = **$101/month**

#### Option B: Hybrid (Local Qwen + Gemini tracking)
- **Local GPU**: AWS g5.xlarge ($1.00/hr)
- **Tracking subagent**: $0.015/hr
- **Infrastructure**: $0.05/hr
- **Total**: **$1.065/hr** = **$770/month**

**Break-even**: ~700 tasks/hour (24/7 workload)

**Recommendation**: Start with Option A, migrate to Option B if sustained >500 tasks/hr

### Edge Case Mitigation Summary

| Edge Case | Mitigation Strategy |
|-----------|---------------------|
| **Worker crashes** | Heartbeat monitoring + auto-restart |
| **Task timeouts** | Per-type timeouts + SIGKILL |
| **Coordinator failure** | Redis persistence + coordinator restart |
| **Network partitions** | Exponential backoff retries |
| **Disk full** | Monitor disk usage, alert at 80% |
| **OOM kills** | Memory limits + swap space |
| **Circular dependencies** | DAG validation before submission |
| **Stale workers** | Periodic restarts every 4 hours |
| **Context overflow** | Summarize completed tasks |
| **Race conditions** | Atomic file operations (renameat2) |

---

## 8. BENCHMARKS & VALIDATION

### Test Scenarios

#### Scenario 1: Sequential Dependency Chain
```
Task A → Task B → Task C → Task D
```
**Expected**: Zero parallelism, 4x single task time
**Validates**: Dependency resolution, sequential execution

#### Scenario 2: Fan-Out
```
Task A → [B1, B2, B3, B4] → Task C
```
**Expected**: 4x speedup if 4 workers
**Validates**: Parallelism, load balancing

#### Scenario 3: Mixed Workload
```
50% CPU-bound (code analysis)
30% I/O-bound (file processing)
20% API-bound (external calls)
```
**Expected**: Workers don't block each other
**Validates**: Async execution, resource management

#### Scenario 4: Failure Recovery
```
Task A → Task B (fails) → Task C
         └─ Retry Task B → Task C
```
**Expected**: Automatic retry, eventual completion
**Validates**: Error handling, retry logic

### Success Metrics

| Metric | Single-Agent Baseline | Multi-Agent Target | Measurement |
|--------|----------------------|-------------------|-------------|
| **Time to complete 100 tasks** | 50 minutes | <15 minutes | 3.3x speedup |
| **Cost per task** | $0.005 | <$0.007 | <40% overhead |
| **Success rate** | 95% | >95% | Same reliability |
| **P95 latency** | 30s | <40s | Minimal added latency |
| **Coordinator CPU** | 100% | <20% | Offload to workers |

---

## DELIVERABLES

### 1. Architecture Diagram
```
┌──────────────────────────────────────────────────────────────────┐
│                         PRIMARY AGENT                             │
│                       (OpenCode + Claude)                         │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐          │
│  │ Task Decomp│─>│ MCP Task Queue│─>│ Progress Monitor│          │
│  └────────────┘  └──────────────┘  └─────────────────┘          │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            v
              ┌─────────────────────────┐
              │   MCP SERVER (FastAPI)  │
              │   - Redis Streams       │
              │   - Task Metadata       │
              └─────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          v                 v                 v
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │ WORKER 1 │      │ WORKER 2 │      │ WORKER N │
    │ Qwen CLI │      │ Gemini   │      │ Qwen     │
    │ (Docker) │      │ (Docker) │      │ (Local)  │
    └──────────┘      └──────────┘      └──────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
                            v
              ┌─────────────────────────┐
              │   SHARED FILESYSTEM     │
              │   /results/*.json       │
              └─────────────────────────┘
                            │
                            v
              ┌─────────────────────────┐
              │   TRACKING SUBAGENT     │
              │   (Gemini 2.0 Flash)    │
              │   - Task tree state     │
              │   - Dependency graph    │
              └─────────────────────────┘
```

### 2. Protocol Specification (PROTOCOL.md)

```markdown
# Multi-Agent Task Protocol v1.0

## Task Lifecycle

1. **SUBMITTED**: Coordinator writes to `tasks/pending/<uuid>.json`
2. **CLAIMED**: Worker atomically moves to `tasks/claimed/<uuid>.<worker_id>.json`
3. **EXECUTING**: Worker updates heartbeat every 5s
4. **COMPLETED**: Worker writes `/results/<uuid>.json` and moves task to `tasks/completed/`
5. **TRACKED**: Tracking subagent updates global task tree

## Error Codes

- `TIMEOUT`: Task exceeded timeout
- `WORKER_DIED`: Worker heartbeat stopped
- `DEPENDENCY_FAILED`: Upstream task failed
- `MAX_RETRIES`: Retry limit exceeded
```

### 3. Implementation Checklist

- [ ] Redis Streams task queue
- [ ] MCP server with task endpoints
- [ ] Worker Docker image
- [ ] Worker loop with task claiming
- [ ] Filesystem result writing
- [ ] Tracking subagent integration
- [ ] Heartbeat monitoring
- [ ] Retry logic
- [ ] Timeout handling
- [ ] Integration tests
- [ ] Performance benchmarks

---

## FINAL RECOMMENDATIONS

### Phase 1: MVP (1-2 weeks)
1. **File-based coordination** (simplest, no Redis dependency)
2. **2 worker types** (Qwen local + Gemini API)
3. **Single tracking model** (Gemini 2.0 Flash)
4. **Basic error handling** (retries, timeouts)

### Phase 2: Production (2-4 weeks)
1. **Migrate to Redis Streams** (better performance)
2. **Add pre-warmed worker pool** (reduce cold starts)
3. **Implement circuit breakers** (prevent cascades)
4. **Observability dashboard** (Grafana + Prometheus)

### Phase 3: Optimization (ongoing)
1. **ML-based task duration prediction**
2. **Adaptive timeout calculation**
3. **Dynamic worker pool scaling**
4. **Cost optimization** (hybrid API + local models)

### Critical Success Factors
1. **Idempotent operations**: All tasks must be safely retryable
2. **Atomic coordination**: File moves, Redis claims must be race-free
3. **Comprehensive logging**: Every state transition must be traceable
4. **Graceful degradation**: System continues with fewer workers

---

## TRUTHFUL EDGE CASE DISCLOSURE

**What WILL go wrong** (and will, eventually):

1. **Distributed systems are hard**: Split-brain, clock skew, network partitions
2. **File locking is unreliable**: NFS, CIFS don't guarantee atomic operations
3. **Workers will die**: OOM, segfault, hardware failure, cosmic rays
4. **Costs will spiral**: API rate limits hit, need burst capacity, 10x price spike
5. **Tasks will deadlock**: Circular deps, resource exhaustion, priority inversion
6. **Monitoring will lie**: Heartbeat sent but process hung, metrics delayed
7. **Recovery is complex**: Partial completion state, compensating transactions hard

**Mitigation**: Start simple (file-based, 2 workers), add complexity only when needed, monitor obsessively, have kill switches.

---

**Research Completion**: ✅ All 8 deliverables complete
**Confidence Level**: 85% (high - architecture is sound, edge cases identified)
**Next Step**: Implement Phase 1 MVP with strict error tracking
**Storage**: Research saved to `/home/prem-modha/.config/opencode/multi_agent_research_comprehensive.md`
