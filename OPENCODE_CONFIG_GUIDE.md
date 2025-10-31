# OpenCode Configuration Guide
## Research-Based Best Practices for Context-Efficient Setup

---

## 1. Configuration Hierarchy

### Location Precedence (highest to lowest):
1. `OPENCODE_CONFIG` env var → Custom config file path
2. `./opencode.json` → Project-specific (current/parent/git-root)
3. `~/.config/opencode/opencode.json` → Global config
4. `OPENCODE_CONFIG_DIR` env var → Custom config directory

### When to Use Each:
- **Global** (`~/.config/opencode/`): Personal preferences, themes, keybinds, global agents
- **Project** (`./opencode.json`): Team-shared models, formatters, project-specific commands
- **Env Var**: CI/CD, temporary overrides, multi-config switching

---

## 2. Configuration Format Choice

### JSON vs Markdown Decision Matrix:

| Feature | Recommended Format | Rationale |
|---------|-------------------|-----------|
| **Agents** | JSON (inline prompt) | Clear boundaries, minimal context. Use .md only if prompt >500 chars |
| **Commands** | JSON (inline template) | Single parse, no file overhead. Use .md only if template >500 chars |
| **Tools** | JSON only | Boolean flags, no narrative needed |
| **Instructions** | AGENTS.md | Narrative context, team-shared conventions |
| **LSP/MCP** | JSON only | Configuration data, not instructions |
| **Permissions** | JSON only | Security policy, explicit rules |

### Context Cost Comparison:
```
JSON agent (inline prompt):        ~100-300 tokens
Markdown agent file:               ~500-1000 tokens
JSON command (inline template):    ~50-150 tokens
Markdown command file:             ~300-800 tokens
```

**Rule**: Use markdown ONLY when content exceeds 500 characters AND requires formatting/structure.

---

## 3. Agent Configuration Strategy

### Built-in Agents (Optimal Defaults):
- **build** (primary): Full tool access, standard development
- **plan** (primary): Read-only analysis, permission-gated edits
- **general** (subagent): Complex searches, multi-step research

### Custom Agent Patterns:

#### Minimal Override Principle:
```
Only configure what differs from defaults:
- description (required for subagents)
- mode (if not "all")
- tools (only disabled ones)
- permissions (only non-default restrictions)
- model (only if different from global)
- temperature (only if not default)
```

#### Subagent Clarity Rule:
```
Subagent description = When to invoke it
NOT what it does internally
```

**Good**: `"description": "Search docs and APIs for unfamiliar concepts"`
**Bad**: `"description": "Uses grep and webfetch tools to analyze documentation"`

#### Context-Efficient Agent Design:
- **JSON agents**: Inline prompts <500 chars
- **Markdown agents**: Only for prompts >500 chars with structure
- **Tool restrictions**: Disable, don't just set permissions (lower context)
- **Model selection**: Use fast models for subagents to reduce latency

---

## 4. Instruction Files (AGENTS.md)

### Single Source of Truth:
```
~/.config/opencode/AGENTS.md  → Global personal rules
./AGENTS.md                    → Project conventions (commit to git)
```

### Context Budget Management:
- **Target size**: 200-500 lines (~2-4K tokens)
- **Maximum size**: 1000 lines (~8K tokens)
- **Structure**: Clear markdown sections, no agent-specific boundaries

### Anti-Pattern: Agent-Specific Sections
```
❌ BAD (confuses subagents):
## Instructions for Build Agent
- Use TypeScript
## Instructions for Plan Agent  
- Only suggest changes

✅ GOOD (universal rules):
## Code Standards
- Use TypeScript with strict mode
- Suggest changes before implementing
```

### Referencing External Files:
**Option 1** (Recommended): `opencode.json` instructions array
```json
{
  "instructions": [
    "AGENTS.md",
    "CONTRIBUTING.md",
    "docs/code-style.md"
  ]
}
```

**Option 2**: Manual in AGENTS.md (lazy loading pattern)
```markdown
CRITICAL: Load @docs/typescript-guide.md when working with TypeScript files
```

---

## 5. Tool Management

### Default Philosophy:
```
All built-in tools enabled by default
Disable explicitly when needed
```

### Global vs Agent-Level:

#### Global Tools (opencode.json):
```json
{
  "tools": {
    "write": true,
    "edit": true,
    "bash": true,
    "webfetch": true
  }
}
```

#### Agent Tool Override:
```json
{
  "agent": {
    "readonly": {
      "tools": {
        "write": false,
        "edit": false,
        "bash": false
      }
    }
  }
}
```

### MCP Tool Strategy (Critical for Context):

#### Context Cost of MCP:
- Each MCP tool: ~200-500 tokens
- Added to EVERY request
- Multiplies with tool count

#### Recommended Pattern:
```json
{
  "tools": {
    "mcp_*": false  // Disable all MCP globally
  },
  "agent": {
    "database-agent": {
      "tools": {
        "mcp_postgres": true  // Enable only where needed
      }
    }
  }
}
```

#### Wildcard Patterns:
- `*` → Zero or more characters
- `?` → Exactly one character
- `mcp_database_*` → All database MCP tools
- `mcp_*` → All MCP tools

---

## 6. Commands

### Format Selection:

#### JSON Commands (Recommended):
```json
{
  "command": {
    "test": {
      "template": "Run tests with !`npm test`. Fix failures.",
      "description": "Run and fix tests",
      "agent": "build"
    }
  }
}
```

**When to use**:
- Template <500 characters
- Simple argument substitution
- No complex formatting needed

#### Markdown Commands:
```
~/.config/opencode/command/complex-task.md
.opencode/command/project-setup.md
```

**When to use**:
- Template >500 characters
- Multi-paragraph instructions
- Requires code blocks/formatting

### Command Features:

#### Argument Substitution:
```
$ARGUMENTS → Replaced with command arguments
```

#### Shell Output Injection:
```
!`command` → Executes and injects output into prompt
```

#### File References:
```
@path/to/file.ts → Includes file content in prompt
```

#### Subagent Invocation:
```json
{
  "command": {
    "analyze": {
      "agent": "general",
      "subtask": true  // Forces subagent invocation
    }
  }
}
```

---

## 7. LSP Configuration

### Default Behavior:
- Auto-detects file extensions
- Starts appropriate LSP server
- Provides diagnostics to LLM

### Configuration Pattern:

#### Disable LSP:
```json
{
  "lsp": {
    "typescript": { "disabled": true }
  }
}
```

#### Custom LSP:
```json
{
  "lsp": {
    "custom-lang": {
      "command": ["custom-lsp", "--stdio"],
      "extensions": [".custom"],
      "env": { "VAR": "value" }
    }
  }
}
```

### Context Impact:
- LSP diagnostics: ~1-3K tokens per open file
- Only active for currently edited files
- Disable if not using type-checked languages

---

## 8. Permission System

### Default Philosophy:
```
"allow" everything by default
Restrict with "ask" or "deny" as needed
```

### Permission Levels:
- `"allow"` → No approval needed
- `"ask"` → Prompt before execution
- `"deny"` → Tool disabled

### Global Permissions:
```json
{
  "permission": {
    "edit": "allow",
    "bash": "allow",
    "webfetch": "allow"
  }
}
```

### Agent Permission Override:
```json
{
  "agent": {
    "plan": {
      "permission": {
        "edit": "deny",
        "bash": "ask"
      }
    }
  }
}
```

### Bash Command Granularity:
```json
{
  "permission": {
    "bash": {
      "git push": "ask",
      "git status": "allow",
      "terraform *": "deny",
      "*": "allow"
    }
  }
}
```

**Wildcard precedence**: Specific rules override `*` wildcard

---

## 9. Model Selection

### Global Models:
```json
{
  "model": "anthropic/claude-sonnet-4-20250514",
  "small_model": "anthropic/claude-3-5-haiku-20241022"
}
```

### Model Strategy:
- **model**: Main conversation, complex reasoning
- **small_model**: Title generation, lightweight tasks
- **agent.model**: Override per agent (subagents use fast models)

### Temperature Guidelines:
- `0.0-0.2`: Analysis, planning, code review (deterministic)
- `0.3-0.5`: Development, implementation (balanced)
- `0.6-1.0`: Brainstorming, creative tasks (varied)

---

## 10. MCP Server Configuration

### Server Types:

#### Local MCP:
```json
{
  "mcp": {
    "server-name": {
      "type": "local",
      "command": ["npx", "-y", "package-name"],
      "environment": { "API_KEY": "{env:KEY}" },
      "enabled": true
    }
  }
}
```

#### Remote MCP:
```json
{
  "mcp": {
    "server-name": {
      "type": "remote",
      "url": "https://mcp-server.com",
      "headers": { "Authorization": "Bearer {env:TOKEN}" },
      "enabled": true
    }
  }
}
```

### Context Optimization:
- Set `"enabled": false` by default
- Enable per-agent via tools config
- Use wildcard patterns to bulk disable

---

## 11. Custom Tools

### File Location:
```
~/.config/opencode/tool/         → Global tools
.opencode/tool/                   → Project tools
```

### Format:
- TypeScript/JavaScript files
- Filename becomes tool name
- Export default or named exports

### Tool Naming:
- Single export: `database.ts` → `database` tool
- Named exports: `math.ts` with `add`, `multiply` → `math_add`, `math_multiply`

### Context Impact:
- Tool schema: ~100-300 tokens per tool
- Added to every request where tool is enabled
- Disable unused tools per-agent

---

## 12. Context Optimization Summary

### Token Budget Breakdown:
```
Base OpenCode system prompt:      ~8,000 tokens
AGENTS.md (optimal):              ~2,000-4,000 tokens
LSP diagnostics per file:        ~1,000-3,000 tokens
Each MCP tool:                    ~200-500 tokens
Each custom tool:                 ~100-300 tokens
Each markdown agent file:         ~500-1,000 tokens
Each markdown command file:       ~300-800 tokens
```

### Target Context Usage:
- **200K context models**: Keep baseline <15K tokens (7.5% context)
- **100K context models**: Keep baseline <10K tokens (10% context)
- Leaves 90%+ context for actual code/conversation

### Optimization Checklist:
- [ ] Use JSON for agents with prompts <500 chars
- [ ] Use JSON for commands with templates <500 chars
- [ ] Keep AGENTS.md under 500 lines
- [ ] Disable unused MCP tools globally
- [ ] Enable MCP tools per-agent only
- [ ] Disable LSP for non-type-checked languages
- [ ] Use `instructions` array instead of file references in AGENTS.md
- [ ] Minimize custom tools in global scope
- [ ] Set subagents to fast models
- [ ] Use temperature 0.1 for plan-mode agents

---

## 13. File Structure Conventions

### Global Configuration:
```
~/.config/opencode/
├── opencode.json              # Core config (all JSON-based settings)
├── AGENTS.md                  # Project conventions and rules
├── agent/                     # Markdown agents (prompts >500 chars only)
│   └── long-prompt-agent.md
├── command/                   # Markdown commands (templates >500 chars only)
│   └── complex-workflow.md
└── tool/                      # Custom tools
    ├── database.ts
    └── api-client.ts
```

### Project Configuration:
```
./
├── opencode.json              # Project overrides (formatters, models, commands)
├── AGENTS.md                  # Team-shared conventions (commit to git)
└── .opencode/                 # Project-specific extensions
    ├── agent/                 # Project agents
    ├── command/               # Project commands
    └── tool/                  # Project tools
```

### Configuration Loading Order:
1. Load global `~/.config/opencode/opencode.json`
2. Merge project `./opencode.json` (overrides global)
3. Load global `~/.config/opencode/AGENTS.md`
4. Merge project `./AGENTS.md` (appends to global)
5. Load agents from `~/.config/opencode/agent/` and `.opencode/agent/`
6. Load commands from `~/.config/opencode/command/` and `.opencode/command/`
7. Load tools from `~/.config/opencode/tool/` and `.opencode/tool/`

---

## 14. Variable Substitution

### Environment Variables:
```json
{
  "provider": {
    "anthropic": {
      "options": {
        "apiKey": "{env:ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

### File Contents:
```json
{
  "instructions": ["./custom-instructions.md"],
  "provider": {
    "openai": {
      "options": {
        "apiKey": "{file:~/.secrets/openai-key}"
      }
    }
  }
}
```

### Use Cases:
- Keep secrets out of config files
- Share configs across environments
- Include large instruction files without bloat

---

## 15. Schema Validation

### Enable Schema in Config:
```json
{
  "$schema": "https://opencode.ai/config.json"
}
```

### Benefits:
- Editor autocomplete
- Validation on save
- Prevents configuration errors
- Documents available options

---

## 16. Common Anti-Patterns

### ❌ Context Bloat:
- Multiple markdown agent files when JSON would suffice
- Enabling all MCP tools globally
- Verbose AGENTS.md with redundant instructions
- Agent-specific sections in AGENTS.md

### ❌ Subagent Confusion:
- Agent-specific instructions in AGENTS.md
- Using markdown headers like "## For Plan Agent"
- Mixing universal rules with agent-specific rules

### ❌ Configuration Sprawl:
- Commands split between JSON and markdown unnecessarily
- Duplicate instructions across files
- Custom tools that replicate built-in functionality

### ❌ Permission Overhead:
- Setting permissions when disabling tool would suffice
- Asking for approval on low-risk commands
- Not using bash command wildcards efficiently

---

## 17. Migration Path

### From Cursor/Claude.md:
1. Rename `CLAUDE.md` or `.cursorrules` to `AGENTS.md`
2. Move to project root or `~/.config/opencode/`
3. Remove agent-specific sections
4. Keep universal coding conventions only

### From Verbose Configs:
1. Identify agents/commands with prompts <500 chars
2. Migrate to JSON inline format
3. Remove markdown files
4. Consolidate instructions into single AGENTS.md

### From MCP-Heavy Setup:
1. Audit MCP tool usage in conversations
2. Disable all MCP globally: `"mcp_*": false`
3. Enable per-agent basis only
4. Monitor context usage reduction

---

## 18. Testing Configuration

### Verify Context Usage:
```bash
# Check baseline context (no conversation)
opencode --debug

# Monitor context per message
# Look for token counts in debug output
```

### Validate Agent Boundaries:
1. Start conversation with primary agent
2. Invoke subagent with @mention
3. Verify subagent doesn't confuse instructions
4. Check that subagent completes and returns

### Test Tool Restrictions:
1. Set tool to `"ask"` permission
2. Trigger tool usage
3. Verify approval prompt appears
4. Test `"deny"` blocks tool completely

---

## 19. Maintenance Best Practices

### Regular Audits:
- Review AGENTS.md for scope creep (every 2-3 months)
- Check MCP tool usage and disable unused servers
- Consolidate duplicate instructions
- Remove outdated conventions

### Version Control:
- Commit project `opencode.json` and `AGENTS.md`
- `.gitignore` personal overrides
- Document config changes in commit messages
- Share config updates with team

### Team Collaboration:
- Use project configs for shared standards
- Keep personal preferences in global config
- Document "why" for non-obvious settings
- Review config PRs like code PRs

---

## 20. Performance Optimization

### Startup Time:
- Minimize custom tools in global scope
- Disable unused LSP servers
- Set MCP `enabled: false` until needed

### Request Latency:
- Keep baseline context <15K tokens
- Use fast models for subagents
- Disable verbose MCP tools
- Cache file contents when possible

### Context Window Usage:
- Monitor token counts in debug mode
- Profile AGENTS.md contribution
- Measure before/after config changes
- Target <10% baseline context usage

---

## Summary: Optimal Configuration Principles

1. **JSON First**: Use JSON for structure, markdown for narrative
2. **Minimal Override**: Only configure what differs from defaults
3. **Context Budget**: Every config item has token cost
4. **Clear Boundaries**: No agent-specific sections in shared files
5. **Selective Tools**: Enable MCP per-agent, not globally
6. **Single Source**: One AGENTS.md, not fragmented instructions
7. **Lazy Loading**: Reference files instead of embedding
8. **Schema Validation**: Always use `$schema` for safety
9. **Measure Impact**: Profile context usage regularly
10. **Team First**: Project configs for shared, global for personal

---

*Generated from OpenCode official documentation research*
*Last updated: 2025-10-29*
