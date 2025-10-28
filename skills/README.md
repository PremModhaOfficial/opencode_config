# OpenCode MCP Skills

Dynamic skills for testing and troubleshooting MCP (Model Context Protocol) servers in OpenCode.

## Skills

### `/mcp-test` - MCP Test & Troubleshoot

Automatically discovers and tests all MCP servers configured in `opencode.jsonc`. Adapts dynamically to any new MCP tools added in the future.

**Features:**
- ✅ Automatic MCP server discovery from config
- ✅ Dynamic test suite for each server type
- ✅ Comprehensive troubleshooting tips
- ✅ Markdown report generation
- ✅ Support for: filesystem, search-server, sqlite, chroma, deepwiki
- ✅ Generic fallback for unknown MCP servers

**Usage:**

```bash
# Test all MCP servers
/mcp-test

# Test specific server
/mcp-test --server chroma

# Verbose mode with detailed results
/mcp-test --verbose

# Test specific server with details
/mcp-test --server sqlite --verbose
```

**Supported MCP Servers:**

1. **Filesystem MCP** (`mcp-server-filesystem`)
   - Tests: List directories, search files
   - Troubleshoots: Installation, permissions, path issues

2. **Search-Server MCP** (`one-search-mcp`)
   - Tests: Basic search, webpage scraping
   - Troubleshoots: Empty results, timeouts, connectivity

3. **SQLite MCP** (`mcp-server-sqlite`)
   - Tests: List tables, CRUD operations
   - Troubleshoots: Database locks, permissions, empty database

4. **Chroma MCP** (`chroma-mcp`)
   - Tests: Server connection, full CRUD operations
   - Troubleshoots: Server startup, connection issues, systemd service

5. **DeepWiki MCP** (`mcp-deepwiki`)
   - Tests: Documentation fetching
   - Troubleshoots: Connection errors, rate limiting, invalid URLs

6. **Generic MCP** (Any new server)
   - Tests: Generic list/query operations
   - Troubleshoots: Installation, configuration

**Output:**

The skill generates an updated `mcpTest.md` report with:
- Summary of all tests (total, success, warnings, errors)
- Detailed results for each MCP server
- Status indicators (✅ ⚠️ ❌)
- Specific troubleshooting tips for failures

**Example Output:**

```
🔍 MCP Health Check & Troubleshoot Tool

Discovering MCP servers from opencode.jsonc...

Found 5 MCP servers:
  - filesystem (filesystem)
  - search-server (search-server)
  - sqlite (sqlite)
  - chroma (chroma)
  - deepwiki (deepwiki)

## Testing Filesystem MCP (filesystem)
  - Running: List allowed directories...
    ✅ List allowed directories: Success
  - Running: Search files...
    ✅ Search files: Success

## Testing Chroma MCP (chroma)
  - Running: Check Chroma server connection...
    ✅ Check Chroma server connection: Success
  - Running: Full CRUD operations...
    ✅ Full CRUD operations: Success

📄 Report saved to: /home/prem-modha/.config/opencode/mcpTest.md
```

## Adding New MCP Servers

The skill automatically detects new MCP servers added to `opencode.jsonc`. Just add the server to the `mcp` section:

```jsonc
"mcp": {
  "my-new-server": {
    "type": "local",
    "command": ["my-new-mcp-server"],
    "enabled": true
  }
}
```

The skill will:
1. Discover the new server automatically
2. Attempt generic tests (list, query, status operations)
3. Report results and suggest manual verification if needed

## Extending Test Suites

To add custom tests for a new MCP server type, edit `mcp-test.js` and add a new entry to `MCP_TESTS`:

```javascript
'my-server': {
  displayName: 'My Custom MCP',
  tests: [
    {
      name: 'Test operation',
      test: async (tools) => {
        const result = await tools.myserver_operation();
        return { success: !!result, details: result };
      }
    }
  ],
  troubleshoot: {
    'connection_error': 'Install with: npm install -g my-mcp-server',
    'other_error': 'Check configuration in opencode.jsonc'
  }
}
```

## Installation

The skill is automatically loaded when you add `"opencode-skills"` to the `plugin` array in `opencode.jsonc`:

```jsonc
"plugin": [
  "opencode-skills"
]
```

## Requirements

- Node.js (for running the skill)
- OpenCode runtime (for accessing MCP tools)
- Configured MCP servers in `opencode.jsonc`

## Troubleshooting

If the skill doesn't load:
1. Ensure `package.json` exists in the skills directory
2. Check that `opencode.jsonc` has the correct plugin entry
3. Restart OpenCode

If tests fail:
1. Check the generated `mcpTest.md` for specific error messages
2. Follow the troubleshooting tips for each failed test
3. Verify MCP server installation and configuration
4. Check server processes are running (for chroma, etc.)

## License

MIT
