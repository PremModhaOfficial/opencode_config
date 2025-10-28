# MCP Test Plugin - Installation Summary

## ✅ Installation Complete!

The MCP Test & Troubleshoot skill has been successfully installed as an OpenCode plugin.

### What Was Installed

1. **Plugin Package** (`opencode-skills`)
   - Location: `/home/prem-modha/.config/opencode/skills/`
   - Type: ESM module
   - Registered with OpenCode via `plugin` array in `opencode.jsonc`

2. **Tool: `/mcp-test`**
   - Dynamically tests all MCP servers
   - Auto-discovers servers from `opencode.jsonc`
   - Generates detailed reports

### Files Created

```
~/.config/opencode/
├── skills/
│   ├── index.js          # Main plugin implementation (ES module)
│   ├── mcp-test.js       # Legacy standalone script
│   ├── package.json      # Plugin manifest
│   ├── README.md         # Full documentation
│   └── USAGE.md          # Quick start guide
├── node_modules/
│   └── opencode-skills@  # Symlink to ./skills
└── opencode.jsonc        # Updated with plugin reference
```

### How to Use

#### In OpenCode

The skill should now be available as a tool. Try invoking it through the OpenCode interface:

```
Please run the mcp-test tool to check all my MCP servers
```

or

```
Use the mcp-test tool with verbose=true
```

#### Parameters

- `server` (string, optional): Test specific MCP server (e.g., "chroma")
- `verbose` (boolean, optional): Show detailed test results

#### Examples

Test all servers:
```
Run mcp-test tool
```

Test specific server:
```
Run mcp-test tool with server="chroma"
```

Verbose mode:
```
Run mcp-test tool with verbose=true
```

### What It Tests

**Currently Supported MCP Servers:**

1. **Filesystem** (`mcp-server-filesystem`)
   - List allowed directories
   - Search files

2. **Search-Server** (`one-search-mcp`)
   - Basic search functionality
   - (Scraping tests available)

3. **SQLite** (`mcp-server-sqlite`)
   - List tables
   - Full CRUD operations

4. **Chroma** (`chroma-mcp`)
   - Server connection
   - Complete CRUD cycle (create, add, query, delete)

5. **DeepWiki** (`mcp-deepwiki`)
   - Documentation fetching

### Output

The tool:
1. Discovers all enabled MCP servers from `opencode.jsonc`
2. Runs comprehensive tests for each server
3. Reports results with ✅ ⚠️ ❌ indicators
4. Provides troubleshooting tips for failures
5. Generates updated `mcpTest.md` report

### Verification

Plugin loaded successfully: ✅

To verify the tool is available:
1. Start/restart OpenCode
2. Ask OpenCode to "run the mcp-test tool"
3. Check the generated `mcpTest.md` file

### Troubleshooting

**If the tool doesn't appear:**

1. Restart OpenCode to reload plugins
2. Verify plugin is registered:
   ```bash
   cd ~/.config/opencode
   npm list opencode-skills
   ```
   Should show: `opencode-skills@1.0.0 -> ./skills`

3. Check OpenCode config:
   ```bash
   grep -A 2 '"plugin"' opencode.jsonc
   ```
   Should include: `"opencode-skills"`

4. Test plugin loads:
   ```bash
   node -e "import('./skills/index.js').then(m => console.log('OK')).catch(e => console.error(e))"
   ```

**If tests fail:**
- Check the generated `mcpTest.md` for specific errors
- Follow troubleshooting tips for each failed test
- Verify MCP servers are installed and running

### Adding New MCP Servers

The skill automatically adapts! Just add to `opencode.jsonc`:

```jsonc
"mcp": {
  "my-new-server": {
    "type": "local",
    "command": ["my-mcp-command"],
    "enabled": true
  }
}
```

The tool will detect it on the next run.

### Extending Tests

To add custom tests for a new server type, edit `skills/index.js` and add to the `MCP_TESTS` object:

```javascript
'my-server-type': {
  displayName: 'My Server MCP',
  tests: [
    {
      name: 'Test operation',
      test: async (ctx) => {
        const result = await ctx.tool("myserver_operation", {});
        return { success: !!result, details: result };
      }
    }
  ],
  troubleshoot: {
    'connection_error': 'Install with: npm install -g my-mcp-server'
  }
}
```

### Next Steps

1. **Try the tool**: Ask OpenCode to "run the mcp-test tool"
2. **Review results**: Check the generated `mcpTest.md`
3. **Fix issues**: Follow troubleshooting tips for any failures
4. **Add servers**: The tool will auto-detect new MCP servers

---

**Status**: ✅ Ready to use!

**Documentation**: See `skills/README.md` for complete details
