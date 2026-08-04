/**
 * Combined MCP Lab Workshop Worker
 * Serves both Dashboard and MCP Server from a single worker
 */

// Import dashboard code
import dashboardWorker from './demo-app/index.js';
// Import MCP server code  
import mcpWorker from './mcp-server/index.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Route /mcp/* to MCP Server
    if (url.pathname.startsWith('/mcp')) {
      return mcpWorker.fetch(request, env, ctx);
    }
    
    // Route everything else to Dashboard
    return dashboardWorker.fetch(request, env, ctx);
  }
};
