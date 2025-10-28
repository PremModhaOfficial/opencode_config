import { tool } from "@opencode-ai/plugin/tool";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MCP Server Test Definitions - Auto-extensible
const MCP_TESTS = {
  filesystem: {
    displayName: 'Filesystem MCP',
    tests: [
      {
        name: 'List allowed directories',
        test: async (ctx) => {
          try {
            const result = await ctx.tool("filesystem_list_allowed_directories", {});
            return { success: !!result, details: result };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'Search files',
        test: async (ctx) => {
          try {
            const result = await ctx.tool("filesystem_search_files", { 
              path: '/home/prem-modha/.config/opencode', 
              pattern: 'opencode.jsonc' 
            });
            return { success: !!result, details: result };
          } catch (error) {
            return { success: false, error: error.message };
          }
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
        test: async (ctx) => {
          try {
            const result = await ctx.tool("search-server_one_search", { query: 'test', limit: 5 });
            return { success: !!result, details: result, warning: !result || result.length === 0 ? 'No results returned' : null };
          } catch (error) {
            return { success: false, error: error.message };
          }
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
        test: async (ctx) => {
          try {
            const result = await ctx.tool("sqlite_list_tables", {});
            return { success: !!result, details: result };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'Create and query test table',
        test: async (ctx) => {
          try {
            await ctx.tool("sqlite_create_table", { 
              query: 'CREATE TABLE IF NOT EXISTS mcp_test (id INTEGER PRIMARY KEY, name TEXT)' 
            });
            await ctx.tool("sqlite_write_query", { 
              query: "INSERT OR REPLACE INTO mcp_test (id, name) VALUES (1, 'test')" 
            });
            const result = await ctx.tool("sqlite_read_query", { 
              query: 'SELECT * FROM mcp_test WHERE id = 1' 
            });
            await ctx.tool("sqlite_write_query", { query: 'DROP TABLE IF EXISTS mcp_test' });
            return { success: !!result && result.length > 0, details: result };
          } catch (error) {
            return { success: false, error: error.message };
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
        test: async (ctx) => {
          try {
            const result = await ctx.tool("chroma_chroma_list_collections", {});
            return { success: !!result, details: result };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      },
      {
        name: 'Full CRUD operations',
        test: async (ctx) => {
          try {
            const testCollection = 'mcp_test_' + Date.now();
            
            await ctx.tool("chroma_chroma_create_collection", { collection_name: testCollection });
            await ctx.tool("chroma_chroma_add_documents", {
              collection_name: testCollection,
              documents: ['Test document 1', 'Test document 2'],
              ids: ['test1', 'test2'],
              metadatas: [{ type: 'test' }, { type: 'test' }]
            });
            const queryResult = await ctx.tool("chroma_chroma_query_documents", {
              collection_name: testCollection,
              query_texts: ['Test'],
              n_results: 2
            });
            await ctx.tool("chroma_chroma_delete_collection", { collection_name: testCollection });
            
            return { success: !!queryResult && queryResult.documents, details: 'All CRUD operations successful' };
          } catch (error) {
            return { success: false, error: error.message };
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
        test: async (ctx) => {
          try {
            const result = await ctx.tool("deepwiki_deepwiki_fetch", { 
              url: 'vercel/next.js', 
              maxDepth: 0, 
              mode: 'aggregate' 
            });
            return { 
              success: !!result && result.length > 0, 
              details: result,
              warning: !result || result.length === 0 ? 'No content fetched' : null 
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      }
    ],
    troubleshoot: {
      'connection_error': 'Check if mcp-deepwiki is installed: npx -y mcp-deepwiki@latest',
      'no_content': 'deepwiki.com may be down or blocking requests - try again later',
      'rate_limited': 'Too many requests - wait a few minutes before retrying',
      'invalid_url': 'Use format: owner/repo (e.g., "vercel/next.js")'
    }
  }
};

/**
 * Parse opencode.jsonc to discover configured MCP servers
 */
function discoverMCPServers(configPath) {
  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    let jsonContent = configContent
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1) {
          const beforeComment = line.substring(0, commentIndex);
          if (!beforeComment.trim().endsWith(':') && !beforeComment.includes('http:') && !beforeComment.includes('https:')) {
            return line.substring(0, commentIndex);
          }
        }
        return line;
      })
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    
    jsonContent = jsonContent.replace(/,(\s*[}\]])/g, '$1');
    const config = JSON.parse(jsonContent);
    
    const servers = [];
    if (config.mcp) {
      for (const [name, serverConfig] of Object.entries(config.mcp)) {
        if (serverConfig.enabled !== false) {
          servers.push({
            name,
            config: serverConfig,
            type: name.toLowerCase().includes('filesystem') ? 'filesystem' :
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
    throw new Error(`Error reading config: ${error.message}`);
  }
}

/**
 * Run tests for a specific MCP server
 */
async function testMCPServer(serverName, serverType, ctx, verbose = false) {
  const testSuite = MCP_TESTS[serverType];
  if (!testSuite) {
    return {
      server: serverName,
      displayName: 'Unknown MCP Server',
      tests: [],
      status: 'skipped',
      troubleshooting: ['No test suite available for this server type']
    };
  }
  
  const results = {
    server: serverName,
    displayName: testSuite.displayName,
    tests: [],
    status: 'success',
    troubleshooting: []
  };
  
  let output = `\n## Testing ${testSuite.displayName} (${serverName})\n`;
  
  for (const testCase of testSuite.tests) {
    output += `  - Running: ${testCase.name}...\n`;
    
    try {
      const result = await testCase.test(ctx);
      
      results.tests.push({
        name: testCase.name,
        success: result.success,
        warning: result.warning,
        error: result.error,
        details: verbose ? result.details : null
      });
      
      if (result.success && !result.warning) {
        output += `    ✅ ${testCase.name}: Success\n`;
      } else if (result.warning) {
        output += `    ⚠️  ${testCase.name}: ${result.warning}\n`;
        results.status = 'warning';
      } else {
        output += `    ❌ ${testCase.name}: Failed${result.error ? ' - ' + result.error : ''}\n`;
        results.status = 'error';
        
        const troubleshootKey = result.error && result.error.toLowerCase().includes('connection') ? 'connection_error' :
                               result.error && result.error.toLowerCase().includes('permission') ? 'permission_denied' :
                               'connection_error';
        
        if (testSuite.troubleshoot[troubleshootKey]) {
          results.troubleshooting.push(testSuite.troubleshoot[troubleshootKey]);
        }
      }
      
      if (verbose && result.details) {
        output += `    Details: ${JSON.stringify(result.details, null, 2)}\n`;
      }
    } catch (error) {
      output += `    ❌ ${testCase.name}: Error - ${error.message}\n`;
      results.tests.push({
        name: testCase.name,
        success: false,
        error: error.message
      });
      results.status = 'error';
    }
  }
  
  if (results.troubleshooting.length > 0 || verbose) {
    output += `\n  Troubleshooting Tips:\n`;
    Object.entries(testSuite.troubleshoot).forEach(([key, tip]) => {
      output += `    - ${tip}\n`;
    });
  }
  
  return { results, output };
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
    error: allResults.filter(r => r.status === 'error').length,
    skipped: allResults.filter(r => r.status === 'skipped').length
  };
  
  report += `- Total MCP Servers: ${summary.total}\n`;
  report += `- ✅ Success: ${summary.success}\n`;
  report += `- ⚠️  Warning: ${summary.warning}\n`;
  report += `- ❌ Error: ${summary.error}\n`;
  if (summary.skipped > 0) report += `- ⏭️  Skipped: ${summary.skipped}\n`;
  report += `\n`;
  
  report += `## Detailed Results\n\n`;
  
  for (const result of allResults) {
    const statusEmoji = result.status === 'success' ? '✅' : 
                       result.status === 'warning' ? '⚠️' : 
                       result.status === 'skipped' ? '⏭️' : '❌';
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
  return report;
}

/**
 * OpenCode Skills Plugin
 */
export default async function mcpTestPlugin(ctx) {
  return {
    permission: {},
    tool: {
      "mcp-test": tool({
        description: "Test and troubleshoot all MCP servers configured in opencode.jsonc",
        args: {
          server: tool.schema.string().optional().describe("Specific MCP server to test (default: all)"),
          verbose: tool.schema.boolean().optional().describe("Show detailed test results"),
        },
        async execute(args) {
          try {
            const configPath = path.join(__dirname, '..', 'opencode.jsonc');
            const outputPath = path.join(__dirname, '..', 'mcpTest.md');
            
            let output = '🔍 MCP Health Check & Troubleshoot Tool\n\n';
            output += 'Discovering MCP servers from opencode.jsonc...\n\n';
            
            const servers = discoverMCPServers(configPath);
            
            if (servers.length === 0) {
              return '❌ No MCP servers found in configuration';
            }
            
            const serverFilter = args.server || 'all';
            let serversToTest = servers;
            
            if (serverFilter !== 'all') {
              serversToTest = servers.filter(s => s.name === serverFilter);
              if (serversToTest.length === 0) {
                return `❌ Server '${serverFilter}' not found in configuration`;
              }
            }
            
            output += `Found ${serversToTest.length} MCP server(s) to test:\n`;
            serversToTest.forEach(s => output += `  - ${s.name} (${s.type})\n`);
            output += '\n';
            
            const allResults = [];
            for (const server of serversToTest) {
              const { results, output: testOutput } = await testMCPServer(
                server.name, 
                server.type, 
                ctx, 
                args.verbose || false
              );
              allResults.push(results);
              output += testOutput;
            }
            
            const report = generateReport(allResults, outputPath);
            
            output += `\n📄 Report saved to: ${outputPath}\n`;
            output += `\nSummary:\n`;
            output += `- Total: ${allResults.length} servers\n`;
            output += `- Success: ${allResults.filter(r => r.status === 'success').length}\n`;
            output += `- Warning: ${allResults.filter(r => r.status === 'warning').length}\n`;
            output += `- Error: ${allResults.filter(r => r.status === 'error').length}\n`;
            
            return output;
          } catch (error) {
            return `❌ Error running MCP tests: ${error.message}`;
          }
        },
      }),
    },
  };
}
