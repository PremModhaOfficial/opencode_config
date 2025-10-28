# MCP Multi-Agent Orchestration System
## Product Requirements Document (PRD)

---

## 1. Executive Summary

**Product Name**: MCP Multi-Agent Orchestrator  
**Version**: 1.0  
**Date**: October 17, 2025  
**Owner**: Prem Modha

### Vision
Build a lightweight, zero-cost multi-agent task execution system where OpenCode/Claude orchestrates free-tier CLI agents (gemini-cli, qwen-cli) via MCP stdio protocol for parallel task execution.

### Key Value Proposition
- ✅ **Zero infrastructure cost** (free-tier APIs only)
- ✅ **Simple architecture** (process spawning, no containers)
- ✅ **Shared filesystem** (no data serialization needed)
- ✅ **Worker agnostic** (workers don't know orchestrator exists)
- ✅ **Fast execution** (10-50ms process spawn, parallel execution)

---

## 2. Problem Statement

### Current Pain Points
1. **Single-agent bottleneck**: Claude/OpenCode processes tasks sequentially, wasting time on parallelizable work
2. **Underutilized free tiers**: Gemini (1500 req/day), Qwen (generous free tier) sit idle
3. **Over-engineered alternatives**: Distributed systems (Docker, Redis, RabbitMQ) add complexity and cost
4. **Tight coupling**: Existing multi-agent systems require workers to know about coordination layer

### Target Users
- Developers using OpenCode for complex, multi-step tasks
- Users with parallelizable workloads (code review, testing, analysis)
- Cost-conscious developers wanting to leverage free-tier APIs

### Market Opportunity
- **Cost savings**: $0 vs $101-770/month for distributed alternatives
- **Performance**: 3-4x speedup for parallelizable tasks
- **Simplicity**: 10x simpler than container-based solutions

---

## 3. Solution Overview

### Architecture
```
┌─────────────────────────────────────┐
│   PRIMARY AGENT (OpenCode/Claude)   │
│         (Orchestrator)              │
└──────────────┬──────────────────────┘
               │
               ├─── Spawns CLI processes
               │
       ┌────────┼────────┬────────┐
       │        │        │        │
┌─────v──┐ ┌──v────┐ ┌─v─────┐ ┌v──────┐
│ gemini │ │ qwen  │ │ qwen  │ │ gemini│
│  -cli  │ │  cli  │ │  cli  │ │  cli  │
│ (free) │ │(free) │ │(free) │ │ (free)│
└────┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
     │         │         │         │
     └─────────┴─────────┴─────────┘
               │
           MCP protocol
      (stdio/JSON-RPC 2.0)
               │
               v
       Coordinator reads results
```

### Core Components
1. **Orchestrator**: OpenCode/Claude with worker pool management
2. **Workers**: Stateless CLI processes (gemini-cli, qwen-cli)
3. **Communication**: MCP JSON-RPC over stdin/stdout pipes
4. **Coordination**: Synchronous request-response pattern

### Key Differentiators
- **Zero cost**: Free-tier APIs only
- **Worker agnostic**: Workers unaware of orchestration
- **Shared filesystem**: No data serialization overhead
- **Process isolation**: Simple, secure, fast

---

## 4. Requirements

### Functional Requirements

#### FR1: Worker Pool Management
- **FR1.1**: Spawn 2-4 long-running worker processes at startup
- **FR1.2**: Support round-robin task assignment across workers
- **FR1.3**: Automatically respawn crashed workers
- **FR1.4**: Graceful shutdown with task draining
- **FR1.5**: Support different worker types (gemini-cli, qwen-cli)

#### FR2: MCP Communication Protocol
- **FR2.1**: Implement MCP JSON-RPC 2.0 over stdio
- **FR2.2**: Handle MCP initialization handshake
- **FR2.3**: Support synchronous request-response pattern
- **FR2.4**: Detect task completion via response receipt
- **FR2.5**: Handle MCP error responses appropriately

#### FR3: Task Execution
- **FR3.1**: Accept tasks from OpenCode/Claude interface
- **FR3.2**: Route tasks to appropriate worker type based on task requirements
- **FR3.3**: Support task timeout (default 30s)
- **FR3.4**: Provide task status updates to orchestrator
- **FR3.5**: Handle task cancellation requests

#### FR4: Error Handling & Recovery
- **FR4.1**: Implement exponential backoff retry (3 attempts)
- **FR4.2**: Handle worker crashes with automatic respawn
- **FR4.3**: Detect and handle rate limit errors
- **FR4.4**: Provide fallback to different worker on failures
- **FR4.5**: Log all errors with sufficient context for debugging

#### FR5: Configuration & Flexibility
- **FR5.1**: Support configurable worker pool size
- **FR5.2**: Allow workers to run in different directories (sandboxing)
- **FR5.3**: Support different MCP server endpoints if needed
- **FR5.4**: Configurable timeouts and retry policies

### Non-Functional Requirements

#### Performance
- **NFR1.1**: Worker spawn time < 50ms
- **NFR1.2**: Task assignment latency < 10ms
- **NFR1.3**: End-to-end task completion < 30s (typical)
- **NFR1.4**: Support 20-30 tasks/minute with 4 workers
- **NFR1.5**: Memory usage < 100MB per worker

#### Reliability
- **NFR2.1**: >95% task success rate
- **NFR2.2**: Automatic recovery from worker crashes
- **NFR2.3**: Graceful degradation with fewer workers
- **NFR2.4**: Comprehensive error logging and monitoring

#### Security
- **NFR3.1**: Workers run with minimal privileges
- **NFR3.2**: No network access for workers (stdio only)
- **NFR3.3**: Shared filesystem access controlled
- **NFR3.4**: No sensitive data in worker processes

#### Usability
- **NFR4.1**: Simple integration with OpenCode
- **NFR4.2**: Clear error messages and debugging info
- **NFR4.3**: Minimal configuration required
- **NFR4.4**: Easy worker type switching

---

## 5. Technical Specifications

### Technology Stack
- **Language**: Python 3.11+
- **Communication**: MCP JSON-RPC 2.0 over stdio
- **Process Management**: `subprocess.Popen` with pipes
- **Async Support**: `asyncio` for concurrent operations
- **CLI Tools**: gemini-cli, qwen-cli (external dependencies)

### Task Format
```json
{
  "jsonrpc": "2.0",
  "id": "task-123",
  "method": "tools/call",
  "params": {
    "name": "code_review",
    "arguments": {
      "file_path": "./src/main.py",
      "language": "python",
      "context": "Review for security issues"
    }
  }
}
```

### Response Format
```json
{
  "jsonrpc": "2.0",
  "id": "task-123",
  "result": {
    "status": "completed",
    "output": {
      "issues_found": 2,
      "review_summary": "Found potential security vulnerabilities..."
    },
    "tokens_used": 1250,
    "execution_time_ms": 8500
  }
}
```

### Worker Types
- **gemini-cli**: Best for long context (1M tokens), code analysis
- **qwen-cli**: Fast for short tasks, general purpose
- **Future**: Support for local models (Qwen2.5-7B)

### Rate Limits & Cost Management
- **Gemini**: 1500 requests/day, 15 RPM (4 keys = 60 RPM)
- **Qwen**: TBD (need to verify actual limits)
- **Strategy**: Rotate API keys, fallback workers, rate limit detection

---

## 6. Implementation Plan

### Phase 1: MVP (1-2 weeks)
1. **Single Worker POC**
   - Spawn single gemini-cli process
   - Implement MCP stdio communication
   - Basic task execution and response handling
   - Unit tests for MCP protocol

2. **Worker Pool Foundation**
   - Multi-worker spawning and management
   - Round-robin task assignment
   - Basic error handling (timeout, crash recovery)

3. **Integration Testing**
   - End-to-end task execution
   - Performance benchmarking
   - Error scenario testing

### Phase 2: Production Ready (2-4 weeks)
1. **Advanced Error Handling**
   - Exponential backoff retry logic
   - Rate limit detection and fallback
   - Circuit breaker pattern
   - Comprehensive logging

2. **Configuration & Flexibility**
   - Configurable worker pools
   - Different working directories
   - Environment-specific settings
   - Monitoring and metrics

3. **OpenCode Integration**
   - Seamless integration with OpenCode interface
   - Task decomposition helpers
   - Progress reporting

### Phase 3: Optimization (Ongoing)
1. **Performance Optimization**
   - Worker pre-warming
   - Smart task routing (context-aware)
   - Memory usage optimization

2. **Advanced Features**
   - Task dependency management
   - Priority queues
   - Cost optimization strategies

---

## 7. Success Metrics

### Performance Metrics
- **Task Throughput**: 20-30 tasks/minute (4 workers)
- **Worker Startup Time**: <50ms
- **Task Assignment Latency**: <10ms
- **End-to-End Latency**: <30s average
- **Memory Usage**: <100MB per worker

### Reliability Metrics
- **Task Success Rate**: >95%
- **Worker Uptime**: >99%
- **Error Recovery Time**: <5s
- **Data Loss**: 0% (stateless design)

### Cost Metrics
- **Infrastructure Cost**: $0/month
- **API Usage**: Within free tier limits
- **Compute Efficiency**: <5% orchestrator CPU usage

### User Experience Metrics
- **Integration Complexity**: <30 minutes setup
- **Debugging Time**: <10 minutes per issue
- **Learning Curve**: <1 hour for basic usage

---

## 8. Risks & Mitigations

### Technical Risks
- **CLI Availability**: gemini-cli/qwen-cli may not exist or support MCP
  - **Mitigation**: Create MCP wrapper if needed, verify CLI capabilities first
- **Rate Limits**: Free tier limits may be insufficient
  - **Mitigation**: Implement rate limit handling, monitor usage, have paid tier fallback
- **Process Stability**: Worker processes may crash unexpectedly
  - **Mitigation**: Comprehensive error handling, automatic respawn, health checks

### Operational Risks
- **API Changes**: Free tier policies may change
  - **Mitigation**: Monitor API documentation, have multiple provider options
- **Performance Degradation**: System may slow under load
  - **Mitigation**: Performance monitoring, load testing, scaling strategies

### Business Risks
- **Scope Creep**: Feature requests may expand beyond MVP
  - **Mitigation**: Strict phase-based development, clear MVP boundaries
- **Integration Issues**: OpenCode integration may be complex
  - **Mitigation**: Early integration testing, close collaboration with OpenCode team

---

## 9. Dependencies & Prerequisites

### External Dependencies
- **gemini-cli**: Google Gemini API CLI tool
- **qwen-cli**: Qwen API CLI tool
- **Python 3.11+**: Runtime environment
- **OpenCode**: Primary orchestrator platform

### Assumptions
- CLI tools support MCP stdio protocol (or can be wrapped)
- Free tier limits are sufficient for target workload
- OpenCode provides task decomposition interface
- Shared filesystem access is available

### Open Questions
1. Do gemini-cli and qwen-cli exist and support MCP?
2. What are the actual rate limits for qwen-cli free tier?
3. How will OpenCode expose the task orchestration interface?
4. What task types will be supported initially?

---

## 10. Testing Strategy

### Unit Testing
- MCP protocol implementation
- Worker pool management
- Error handling logic
- Configuration parsing

### Integration Testing
- End-to-end task execution
- Multi-worker coordination
- Error recovery scenarios
- Performance benchmarking

### Load Testing
- Maximum throughput testing
- Memory usage under load
- Worker crash recovery
- Rate limit handling

### User Acceptance Testing
- OpenCode integration
- Real-world task scenarios
- Error handling in production
- Performance validation

---

## 11. Deployment & Operations

### Deployment Strategy
- **Initial**: Local development environment only
- **Target**: Integrated into OpenCode as optional feature
- **Distribution**: Via OpenCode package manager or pip

### Monitoring & Observability
- **Metrics**: Task throughput, success rates, latency
- **Logging**: Structured logs for all operations
- **Health Checks**: Worker status, API quota monitoring
- **Alerts**: Worker crashes, high error rates, performance degradation

### Maintenance
- **Updates**: CLI tool version compatibility
- **Security**: Dependency updates, vulnerability scanning
- **Performance**: Regular benchmarking and optimization
- **Support**: Error diagnostics, troubleshooting guides

---

## 12. Future Roadmap

### Phase 2 Features
- Task dependency graphs
- Priority-based scheduling
- Cost optimization (API vs local model selection)
- Advanced monitoring dashboard

### Phase 3 Features
- Distributed deployment support
- GPU worker integration
- ML-based task routing
- Multi-language CLI support

### Research Areas
- Local model integration (Qwen2.5-7B)
- Advanced coordination patterns
- Cost-performance optimization
- Enterprise deployment scenarios

---

## 13. Conclusion

This PRD outlines a pragmatic, cost-effective approach to multi-agent task execution that leverages existing free-tier APIs and simple process management. By focusing on MCP stdio communication and stateless workers, we achieve parallel execution without the complexity and cost of distributed systems.

**Key Success Factors**:
- Verify CLI tool availability and MCP support
- Maintain simplicity in architecture
- Comprehensive error handling and monitoring
- Smooth OpenCode integration

**Next Steps**:
1. Verify gemini-cli and qwen-cli availability
2. Build single-worker POC
3. Implement worker pool management
4. Integration testing with OpenCode

---

*Document Version*: 1.0
*Last Updated*: October 17, 2025
*Author*: Prem Modha