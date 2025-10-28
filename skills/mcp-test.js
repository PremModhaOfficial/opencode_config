#!/usr/bin/env node
/**
 * MCP Test & Troubleshoot Skill
 * 
 * Dynamically tests and troubleshoots all MCP servers configured in opencode.jsonc
 * Automatically adapts to new MCP tools added in the future
 * 
 * Usage:
 *   - Test all MCP servers: testMCP()
 *   - Test specific server: testMCP("chroma")
 *   - Verbose mode: testMCP("all", true)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// MCP Server Test Definitions - Auto-extensible
const MCP_TESTS = {
  filesystem: {
    displayName: 'Filesystem MCP',
    tests: [
      {
        name: 'List allowed directories',
        test: async (tools) => {
          const result = await tools.filesystem_list_allowed_directories();
          return { success: !!result, details: result };
        }
      },
      {
        name: 'Search files',
        test: async (tools) => {
          const result = await tools.filesystem_search_files({ path: '/home/prem-modha/.config/opencode', pattern: 'opencode.jsonc' });
          return { success: !!result, details: result };
        }
      }
    ],
    troubleshoot: {
      'connection_error': 'Check if mcp-server-filesystem is installed: npm install -g @modelcontextprotocol/server-filesystem',
      'permission_denied': 'Verify the path in opencode.jsonc is readable and writable',
      'no_results': 'Check if the specified path exists and contains files'
    }
  },
  
  'search-server': {
    displayName: 'Search-Server MCP',
    tests: [
      {
        name: 'Perform basic search',
        test: async (tools) => {
          const result = await tools['search-server_one_search']({ query: 'test', limit: 5 });
          return { success: !!result, details: result, warning: !result || result.length === 0 ? 'No results returned' : null };
        }
      },
      {
        name: 'Scrape webpage',
        test: async (tools) => {
          const result = await tools['search-server_one_scrape']({ url: 'https://example.com', formats: ['markdown'] });
          return { success: !!result && result.markdown, details: result };
        }
      }
    ],
    troubleshoot: {
      'connection_error': 'Check if one-search-mcp is running: npm install -g one-search-mcp',
      'no_results': 'Search index may be empty or query too specific',
      'timeout': 'Increase timeout or check network connectivity'
    }
  },
  
  sqlite: {
    displayName: 'SQLite MCP',
    tests: [
      {
        name: 'List tables',
        test: async (tools) => {
          const result = await tools.sqlite_list_tables();
          return { success: !!result, details: result };
        }
      },
      {
        name: 'Create and query test table',
        test: async (tools) => {
          try {
            // Create test table
            await tools.sqlite_create_table({ query: 'CREATE TABLE IF NOT EXISTS mcp_test (id INTEGER PRIMARY KEY, name TEXT)' });
            // Insert test data
            await tools.sqlite_write_query({ query: "INSERT OR REPLACE INTO mcp_test (id, name) VALUES (1, 'test')" });
            // Query test data
            const result = await tools.sqlite_read_query({ query: 'SELECT * FROM mcp_test WHERE id = 1' });
            // Cleanup
            await tools.sqlite_write_query({ query: 'DROP TABLE IF EXISTS mcp_test' });
            return { success: !!result && result.length > 0, details: result };
          } catch (error) {
            return { success: false, details: error.message };
          }
        }
      }
    ],
    troubleshoot: {
      'connection_error': 'Check if mcp-server-sqlite is installed: npm install -g @modelcontextprotocol/server-sqlite',
      'database_locked': 'Another process may be using the database - close other connections',
      'permission_denied': 'Verify db-path in opencode.jsonc is writable',
      'no_tables': 'Database is empty - this is normal for a fresh installation'
    }
  },
  
  chroma: {
    displayName: 'Chroma MCP',
    tests: [
      {
        name: 'Check Chroma server connection',
        test: async (tools) => {
          const result = await tools.chroma_chroma_list_collections();
          return { success: !!result, details: result };
        }
      },
      {
        name: 'Full CRUD operations',
        test: async (tools) => {
          try {
            const testCollection = 'mcp_test_' + Date.now();
            
            // Create collection
            await tools.chroma_chroma_create_collection({ collection_name: testCollection });
            
            // Add documents
            await tools.chroma_chroma_add_documents({
              collection_name: testCollection,
              documents: ['Test document 1', 'Test document 2'],
              ids: ['test1', 'test2'],
              metadatas: [{ type: 'test' }, { type: 'test' }]
            });
            
            // Query documents
            const queryResult = await tools.chroma_chroma_query_documents({
              collection_name: testCollection,
              query_texts: ['Test'],
              n_results: 2
            });
            
            // Delete collection
            await tools.chroma_chroma_delete_collection({ collection_name: testCollection });
            
            return { success: !!queryResult && queryResult.documents, details: 'All CRUD operations successful' };
          } catch (error) {
            return { success: false, details: error.message };
          }
        }
      }
    ],
    troubleshoot: {
      'connection_error': 'Chroma server not running - start with: systemctl --user start chroma',
      'port_in_use': 'Port 8000 is occupied - check with: lsof -i :8000',
      'server_not_installed': 'Install chroma: pip install chromadb && pip install mcp-server-chroma',
      'connection_closed': 'Chroma server crashed - check logs: journalctl --user -u chroma',
      'auto_start': 'Enable auto-start: systemctl --user enable chroma'
    }
  },
  
  deepwiki: {
    displayName: 'DeepWiki MCP',
    tests: [
      {
        name: 'Fetch documentation',
        test: async (tools) => {
          const result = await tools.deepwiki_deepwiki_fetch({ url: 'vercel/next.js', maxDepth: 0, mode: 'aggregate' });
          return { 
            success: !!result && result.length > 0, 
            details: result,
            warning: !result || result.length === 0 ? 'No content fetched' : null 
          };
        }
      }
    ],
    troubleshoot: {
      'connection_error': 'Check if mcp-deepwiki is installed: npx -y mcp-deepwiki@latest',
      'no_content': 'deepwiki.com may be down or blocking requests - try again later',
      'rate_limited': 'Too many requests - wait a few minutes before retrying',
      'invalid_url': 'Use format: owner/repo (e.g., "vercel/next.js")'
    }
  },
  
  // Generic test for unknown MCP servers
  generic: {
    displayName: 'Generic MCP Server',
    tests: [
      {
        name: 'Attempt generic list operation',
        test: async (tools, serverName) => {
          try {
            // Try common list/get operations
            const possibleOps = [
              `${serverName}_list`,
              `${serverName}_get`,
              `${serverName}_query`,
              `${serverName}_status`
            ];
            
            for (const op of possibleOps) {
              if (tools[op]) {
                const result = await tools[op]();
                return { success: !!result, details: result };
              }
            }
            
            return { success: false, details: 'No recognizable operations found', warning: 'Manual testing required' };
          } catch (error) {
            return { success: false, details: error.message };
          }
        }
      }
    ],
    troubleshoot: {
      'connection_error': 'Check if the MCP server is installed and command path is correct',
      'unknown_operations': 'Consult the MCP server documentation for available operations'
    }
  }
};

/**
 * Parse opencode.jsonc to discover configured MCP servers
 */
function discoverMCPServers(configPath) {
  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    // Remove comments from JSONC - handle single and multi-line comments
    let jsonContent = configContent
      .split('\n')
      .map(line => {
        // Remove single-line comments but preserve URLs
        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1) {
          // Check if it's not part of a URL (http://)
          const beforeComment = line.substring(0, commentIndex);
          if (!beforeComment.trim().endsWith(':') && !beforeComment.includes('http:') && !beforeComment.includes('https:')) {
            return line.substring(0, commentIndex);
          }
        }
        return line;
      })
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    // Remove trailing commas before closing braces/brackets
    jsonContent = jsonContent.replace(/,(\s*[}\]])/g, '$1');
    
    const config = JSON.parse(jsonContent);
    
    const servers = [];
    if (config.mcp) {
      for (const [name, serverConfig] of Object.entries(config.mcp)) {
        if (serverConfig.enabled !== false) {
          servers.push({
            name,
            config: serverConfig,
            type: name.toLowerCase().includes('docker') ? 'docker' : 
                  name.toLowerCase().includes('filesystem') ? 'filesystem' :
                  name.toLowerCase().includes('search') ? 'search-server' :
                  name.toLowerCase().includes('sqlite') ? 'sqlite' :
                  name.toLowerCase().includes('chroma') ? 'chroma' :
                  name.toLowerCase().includes('deepwiki') ? 'deepwiki' :
                  'generic'
          });
        }
      }
    }
    
    return servers;
  } catch (error) {
    console.error('Error reading config:', error.message);
    return [];
  }
}

/**
 * Run tests for a specific MCP server
 */
async function testMCPServer(serverName, serverType, tools, verbose = false) {
  const testSuite = MCP_TESTS[serverType] || MCP_TESTS.generic;
  const results = {
    server: serverName,
    displayName: testSuite.displayName,
    tests: [],
    status: 'success',
    troubleshooting: []
  };
  
  console.log(`\n## Testing ${testSuite.displayName} (${serverName})`);
  
  for (const testCase of testSuite.tests) {
    console.log(`  - Running: ${testCase.name}...`);
    
    try {
      const result = await testCase.test(tools, serverName);
      
      results.tests.push({
        name: testCase.name,
        success: result.success,
        warning: result.warning,
        details: verbose ? result.details : null
      });
      
      if (result.success && !result.warning) {
        console.log(`    ✅ ${testCase.name}: Success`);
      } else if (result.warning) {
        console.log(`    ⚠️  ${testCase.name}: ${result.warning}`);
        results.status = 'warning';
      } else {
        console.log(`    ❌ ${testCase.name}: Failed`);
        results.status = 'error';
      }
      
      if (verbose && result.details) {
        console.log(`    Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    } catch (error) {
      console.log(`    ❌ ${testCase.name}: Error - ${error.message}`);
      results.tests.push({
        name: testCase.name,
        success: false,
        error: error.message
      });
      results.status = 'error';
      
      // Add troubleshooting tips
      const troubleshootKey = error.message.toLowerCase().includes('connection') ? 'connection_error' :
                             error.message.toLowerCase().includes('permission') ? 'permission_denied' :
                             error.message.toLowerCase().includes('timeout') ? 'timeout' :
                             'connection_error';
      
      if (testSuite.troubleshoot[troubleshootKey]) {
        results.troubleshooting.push(testSuite.troubleshoot[troubleshootKey]);
      }
    }
  }
  
  // Display troubleshooting tips if any errors
  if (results.troubleshooting.length > 0 || verbose) {
    console.log(`\n  Troubleshooting Tips:`);
    Object.entries(testSuite.troubleshoot).forEach(([key, tip]) => {
      console.log(`    - ${tip}`);
    });
  }
  
  return results;
}

/**
 * Generate markdown report
 */
function generateReport(allResults, outputPath) {
  let report = `# MCP Health Check Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  
  const summary = {
    total: allResults.length,
    success: allResults.filter(r => r.status === 'success').length,
    warning: allResults.filter(r => r.status === 'warning').length,
    error: allResults.filter(r => r.status === 'error').length
  };
  
  report += `- Total MCP Servers: ${summary.total}\n`;
  report += `- ✅ Success: ${summary.success}\n`;
  report += `- ⚠️  Warning: ${summary.warning}\n`;
  report += `- ❌ Error: ${summary.error}\n\n`;
  
  report += `## Detailed Results\n\n`;
  
  for (const result of allResults) {
    const statusEmoji = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    report += `### ${statusEmoji} ${result.displayName} (${result.server})\n\n`;
    
    for (const test of result.tests) {
      const testEmoji = test.success ? '✅' : test.warning ? '⚠️' : '❌';
      report += `- ${testEmoji} ${test.name}\n`;
      if (test.warning) report += `  - Warning: ${test.warning}\n`;
      if (test.error) report += `  - Error: ${test.error}\n`;
    }
    
    if (result.troubleshooting.length > 0) {
      report += `\n**Troubleshooting:**\n`;
      result.troubleshooting.forEach(tip => {
        report += `- ${tip}\n`;
      });
    }
    
    report += `\n`;
  }
  
  fs.writeFileSync(outputPath, report);
  console.log(`\n📄 Report saved to: ${outputPath}`);
}

/**
 * Main entry point
 */
async function main() {
  const configPath = path.join(__dirname, '..', 'opencode.jsonc');
  const outputPath = path.join(__dirname, '..', 'mcpTest.md');
  
  console.log('🔍 MCP Health Check & Troubleshoot Tool\n');
  console.log('Discovering MCP servers from opencode.jsonc...\n');
  
  const servers = discoverMCPServers(configPath);
  
  if (servers.length === 0) {
    console.log('❌ No MCP servers found in configuration');
    return;
  }
  
  console.log(`Found ${servers.length} MCP servers:`);
  servers.forEach(s => console.log(`  - ${s.name} (${s.type})`));
  
  // Note: This is a mock implementation
  // In a real OpenCode skill, you would have access to the actual MCP tools
  console.log('\n⚠️  This skill requires OpenCode runtime to access MCP tools');
  console.log('Run this skill through OpenCode to perform actual tests\n');
  
  // Example of what would happen in OpenCode runtime:
  // const allResults = [];
  // for (const server of servers) {
  //   const result = await testMCPServer(server.name, server.type, context.tools, verbose);
  //   allResults.push(result);
  // }
  // generateReport(allResults, outputPath);
}

// Export for OpenCode skill usage
module.exports = {
  name: 'mcp-test',
  description: 'Dynamically test and troubleshoot all MCP servers',
  async execute(context) {
    const { tools, args } = context;
    const serverFilter = args.server || 'all';
    const verbose = args.verbose || false;
    
    const configPath = path.join(__dirname, '..', 'opencode.jsonc');
    const outputPath = path.join(__dirname, '..', 'mcpTest.md');
    
    const servers = discoverMCPServers(configPath);
    
    if (serverFilter !== 'all') {
      const filtered = servers.filter(s => s.name === serverFilter);
      if (filtered.length === 0) {
        return { error: `Server '${serverFilter}' not found` };
      }
      servers.length = 0;
      servers.push(...filtered);
    }
    
    const allResults = [];
    for (const server of servers) {
      const result = await testMCPServer(server.name, server.type, tools, verbose);
      allResults.push(result);
    }
    
    generateReport(allResults, outputPath);
    
    return { 
      success: true, 
      summary: {
        total: allResults.length,
        success: allResults.filter(r => r.status === 'success').length,
        warning: allResults.filter(r => r.status === 'warning').length,
        error: allResults.filter(r => r.status === 'error').length
      },
      results: allResults 
    };
  }
};

// Allow standalone execution for testing
if (require.main === module) {
  main().catch(console.error);
}
