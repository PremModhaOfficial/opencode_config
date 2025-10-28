# MCP Test Skill - Quick Start Guide

## Installation Complete! ✅

Your dynamic MCP testing and troubleshooting skill is now installed and ready to use.

**Status:** Plugin installed at `/home/prem-modha/.config/opencode/skills` and registered with OpenCode.

## What Was Created

1. **`skills/mcp-test.js`** - Main skill file with dynamic testing logic
2. **`skills/package.json`** - Skill manifest and metadata
3. **`skills/README.md`** - Complete documentation

## How to Use

### In OpenCode CLI

```bash
# Test all MCP servers
/mcp-test

# Test specific server
/mcp-test --server chroma

# Verbose output
/mcp-test --verbose
```

### What It Does

1. **Discovers** all MCP servers from your `opencode.jsonc`
2. **Tests** each server with appropriate operations:
   - Filesystem: List directories, search files
   - SQLite: List tables, CRUD operations
   - Chroma: Connection, full CRUD cycle
   - Search-Server: Search and scrape tests
   - DeepWiki: Documentation fetching
   - Generic: Auto-detect operations for unknown servers

3. **Reports** results with status indicators:
   - ✅ Success
   - ⚠️ Warning (works but has issues)
   - ❌ Error (failed)

4. **Troubleshoots** automatically providing fix suggestions for common issues

5. **Generates** updated `mcpTest.md` report

## Current MCP Servers Detected

- ✅ filesystem (mcp-server-filesystem)
- ✅ search-server (one-search-mcp)
- ✅ sqlite (mcp-server-sqlite)
- ✅ chroma (chroma-mcp)
- ✅ deepwiki (mcp-deepwiki)
- ⚠️ MCP_DOCKER (docker gateway)

## Adding New MCP Servers

Just add to `opencode.jsonc`:

```jsonc
"mcp": {
  "my-new-server": {
    "type": "local",
    "command": ["my-mcp-server", "--args"],
    "enabled": true
  }
}
```

The skill will automatically detect and test it!

## Extending Tests

To add custom tests for a specific MCP type, edit `mcp-test.js`:

```javascript
// In MCP_TESTS object:
'my-server-type': {
  displayName: 'My Server MCP',
  tests: [
    {
      name: 'My custom test',
      test: async (tools) => {
        const result = await tools.myserver_operation();
        return { success: !!result, details: result };
      }
    }
  ],
  troubleshoot: {
    'error_type': 'Fix suggestion here'
  }
}
```

## Troubleshooting the Skill

### Skill not loading?
- Check `"opencode-skills"` is in `plugin` array in `opencode.jsonc`
- Restart OpenCode

### Tests failing?
- Run `/mcp-test --verbose` for details
- Check generated `mcpTest.md` for specific errors
- Follow troubleshooting tips in the report

### Want to test manually?
```bash
cd ~/.config/opencode/skills
node mcp-test.js
```
(Note: Actual MCP tools only work within OpenCode runtime)

## Example Output

```
🔍 MCP Health Check & Troubleshoot Tool

Found 5 MCP servers:
  - filesystem (filesystem)
  - chroma (chroma)
  ...

## Testing Filesystem MCP (filesystem)
  - Running: List allowed directories...
    ✅ List allowed directories: Success

## Testing Chroma MCP (chroma)
  - Running: Check Chroma server connection...
    ✅ Check Chroma server connection: Success
  - Running: Full CRUD operations...
    ✅ Full CRUD operations: Success

📄 Report saved to: mcpTest.md

Summary:
- Total: 5 servers
- Success: 4
- Warning: 1
- Error: 0
```

## Next Steps

1. Try running `/mcp-test` in OpenCode
2. Check the generated report in `mcpTest.md`
3. Fix any issues using the troubleshooting tips
4. Add new MCP servers and watch them auto-test!

## Benefits

✅ **Dynamic** - Adapts to any new MCP servers automatically
✅ **Comprehensive** - Tests all operations (list, create, query, update, delete)
✅ **Smart** - Provides specific troubleshooting for each error
✅ **Automated** - Run one command to check all servers
✅ **Extensible** - Easy to add custom tests for new server types

---

**Need help?** Check `skills/README.md` for full documentation.
