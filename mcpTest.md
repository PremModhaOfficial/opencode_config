# MCP Capabilities Test Report

## Overview
This document tracks the testing of MCP (Model Context Protocol) servers configured in `opencode.jsonc` across different instances.

## Configured MCP Servers
- **filesystem**: `mcp-server-filesystem` with path `/home/prem-modha` - Enabled
- **search-server**: `one-search-mcp` - Enabled
- **sqlite**: `mcp-server-sqlite` with db-path `/home/prem-modha/.config/opencode/memory.db` - Enabled
- **chroma**: `chroma-mcp` with HTTP client to localhost:8000 - Enabled
- **deepwiki**: `mcp-deepwiki` for fetching documentation from deepwiki.com - Enabled

## Test Results

### Filesystem MCP
- **Test**: Listed allowed directories
- **Result**: Successfully returned `/home/prem-modha`
- **Status**: ✅ Working

### Search-Server MCP
- **Test**: Performed search query "test"
- **Result**: Returned empty results `[]`
- **Status**: ⚠️ No results returned (may need further investigation)

### SQLite MCP
- **Test**: Listed tables in memory.db
- **Result**: Found table `urlpoller_codebase_index`
- **Status**: ✅ Working (database now populated)

### Chroma MCP
- **Test**: Listed collections
- **Result**: Server started successfully, API v1 deprecated but server running
- **Status**: ✅ Working (Chroma server now running on port 8000)
- **Extended Test**: Created collection, added documents, queried, updated, deleted, and cleaned up
- **Result**: All operations successful - create, add, query, peek, info, count, update, delete, get, delete collection
- **Status**: ✅ Fully functional
- **Issue Resolved**: Server was not running, restarted successfully on 2025-10-15
- **Latest Issue**: MCP server chroma failed to start: Connection closed
- **Resolution**: Created systemd user service to auto-start chroma server on boot
- **Status**: ✅ Fixed - service now running and auto-starts
- **Update 2025-10-27**: Service recreated and restarted, MCP server now active and connecting successfully
- **Latest Test 2025-10-27**: Listed collections - no collections found (expected for empty database)
- **Full Test 2025-10-27**: Created test collection, added documents, queried successfully, deleted - all operations functional

### DeepWiki MCP
- **Package**: `mcp-deepwiki@0.0.10` via npx
- **Purpose**: Fetches documentation from deepwiki.com, converts to Markdown
- **Available Tools**: `deepwiki_fetch` with modes: aggregate (single doc) or pages (structured)
- **Status**: ❌ Failed - fetch request returned no content
- **Integration**: Added on 2025-10-15 for parallel-researcher agent
- **Latest Test 2025-10-27**: Attempted fetch for vercel/next.js - no response

## Next Steps
- Investigate why search-server returns empty results
- Populate SQLite database with sample data for further testing
- Test deepwiki MCP server with actual documentation fetch
- Verify deepwiki.com scraping availability and fallback to official server if needed
- Test more advanced operations on each MCP server
- Verify MCP server processes are running correctly
- Test cross-instance functionality if applicable