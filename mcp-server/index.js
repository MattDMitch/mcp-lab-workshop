/**
 * MCP Server Worker
 * Implements Model Context Protocol for controlling the demo app
 * No authentication required - perfect for educational purposes
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // MCP Protocol endpoints
    if (url.pathname === '/mcp/tools/list') {
      return handleToolsList(corsHeaders);
    }

    if (url.pathname === '/mcp/tools/call' && request.method === 'POST') {
      return handleToolCall(request, env, corsHeaders);
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'healthy', version: '1.0.0' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // MCP Server info
    if (url.pathname === '/' || url.pathname === '/info') {
      return new Response(getInfoHTML(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};

// List all available MCP tools
function handleToolsList(corsHeaders) {
  const tools = [
    {
      name: 'toggle_feature',
      description: 'Toggle a feature flag on/off',
      inputSchema: {
        type: 'object',
        properties: {
          feature: {
            type: 'string',
            description: 'Feature name (analytics, notifications, darkMode, animations)',
            enum: ['analytics', 'notifications', 'darkMode', 'animations'],
          },
        },
        required: ['feature'],
      },
    },
    {
      name: 'update_stats',
      description: 'Update dashboard statistics',
      inputSchema: {
        type: 'object',
        properties: {
          stat: {
            type: 'string',
            description: 'Stat to update',
            enum: ['visitors', 'requests', 'uptime', 'responseTime'],
          },
          value: {
            type: 'number',
            description: 'New value for the stat',
          },
        },
        required: ['stat', 'value'],
      },
    },
    {
      name: 'set_message',
      description: 'Set the banner message on the dashboard',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Message to display',
          },
        },
        required: ['message'],
      },
    },
    {
      name: 'get_state',
      description: 'Get current app state',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'reset_demo',
      description: 'Reset the demo to default state',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'simulate_traffic',
      description: 'Simulate traffic by incrementing stats',
      inputSchema: {
        type: 'object',
        properties: {
          amount: {
            type: 'string',
            description: 'Traffic amount',
            enum: ['low', 'medium', 'high'],
          },
        },
        required: ['amount'],
      },
    },
    {
      name: 'enable_all_features',
      description: 'Enable all feature flags',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'disable_all_features',
      description: 'Disable all feature flags',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  return new Response(JSON.stringify({ tools }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handle tool execution
async function handleToolCall(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { tool, arguments: args } = body;

    let result;
    switch (tool) {
      case 'toggle_feature':
        result = await toggleFeature(env, args.feature);
        break;
      case 'update_stats':
        result = await updateStats(env, args.stat, args.value);
        break;
      case 'set_message':
        result = await setMessage(env, args.message);
        break;
      case 'get_state':
        result = await getState(env);
        break;
      case 'reset_demo':
        result = await resetDemo(env);
        break;
      case 'simulate_traffic':
        result = await simulateTraffic(env, args.amount);
        break;
      case 'enable_all_features':
        result = await enableAllFeatures(env);
        break;
      case 'disable_all_features':
        result = await disableAllFeatures(env);
        break;
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }

    // Log activity
    await logActivity(env, `Called ${tool}`, args);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Tool implementations
async function getState(env) {
  let state = await env.DEMO_STATE.get('appState', 'json');
  if (!state) {
    state = getDefaultState();
    await env.DEMO_STATE.put('appState', JSON.stringify(state));
  }
  return state;
}

async function toggleFeature(env, feature) {
  const state = await getState(env);
  if (!state.features[feature] === undefined) {
    throw new Error(`Unknown feature: ${feature}`);
  }
  state.features[feature] = !state.features[feature];
  state.lastUpdate = new Date().toISOString();
  await env.DEMO_STATE.put('appState', JSON.stringify(state));
  return { feature, enabled: state.features[feature] };
}

async function updateStats(env, stat, value) {
  const state = await getState(env);
  if (state.stats[stat] === undefined) {
    throw new Error(`Unknown stat: ${stat}`);
  }
  state.stats[stat] = value;
  state.lastUpdate = new Date().toISOString();
  await env.DEMO_STATE.put('appState', JSON.stringify(state));
  return { stat, value };
}

async function setMessage(env, message) {
  const state = await getState(env);
  state.message = message;
  state.lastUpdate = new Date().toISOString();
  await env.DEMO_STATE.put('appState', JSON.stringify(state));
  return { message };
}

async function resetDemo(env) {
  const state = getDefaultState();
  await env.DEMO_STATE.put('appState', JSON.stringify(state));
  await env.DEMO_STATE.delete('activity');
  return { message: 'Demo reset to defaults' };
}

async function simulateTraffic(env, amount) {
  const state = await getState(env);
  const multipliers = { low: 10, medium: 100, high: 1000 };
  const mult = multipliers[amount] || 10;
  
  state.stats.visitors += Math.floor(Math.random() * mult);
  state.stats.requests += Math.floor(Math.random() * mult * 5);
  state.stats.responseTime = Math.floor(Math.random() * 50) + 10;
  state.lastUpdate = new Date().toISOString();
  
  await env.DEMO_STATE.put('appState', JSON.stringify(state));
  return { message: `Simulated ${amount} traffic`, stats: state.stats };
}

async function enableAllFeatures(env) {
  const state = await getState(env);
  Object.keys(state.features).forEach(key => {
    state.features[key] = true;
  });
  state.lastUpdate = new Date().toISOString();
  await env.DEMO_STATE.put('appState', JSON.stringify(state));
  return { message: 'All features enabled', features: state.features };
}

async function disableAllFeatures(env) {
  const state = await getState(env);
  Object.keys(state.features).forEach(key => {
    state.features[key] = false;
  });
  state.lastUpdate = new Date().toISOString();
  await env.DEMO_STATE.put('appState', JSON.stringify(state));
  return { message: 'All features disabled', features: state.features };
}

// Activity logging
async function logActivity(env, action, details) {
  let activity = await env.DEMO_STATE.get('activity', 'json') || [];
  activity.push({
    action,
    details,
    timestamp: new Date().toISOString(),
  });
  // Keep only last 50 activities
  if (activity.length > 50) {
    activity = activity.slice(-50);
  }
  await env.DEMO_STATE.put('activity', JSON.stringify(activity));
}

function getDefaultState() {
  return {
    theme: 'light',
    features: {
      analytics: true,
      notifications: true,
      darkMode: false,
      animations: true,
    },
    stats: {
      visitors: 1337,
      requests: 42069,
      uptime: 99.9,
      responseTime: 23,
    },
    message: 'Welcome to the MCP Lab! 🚀',
    lastUpdate: new Date().toISOString(),
  };
}

function getInfoHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Server - Info</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0F0F0F;
      color: #F9FAFB;
      padding: 2rem;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #1C1C1C;
      border-radius: 16px;
      padding: 2rem;
      border: 2px solid #374151;
    }
    h1 {
      color: #F48120;
      margin-bottom: 1rem;
      font-size: 2.5rem;
    }
    h2 {
      color: #F48120;
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    .badge {
      display: inline-block;
      background: #F48120;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 2rem;
    }
    .endpoint {
      background: #0F0F0F;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #F48120;
      margin-bottom: 1rem;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9rem;
    }
    .method {
      display: inline-block;
      background: #10B981;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 0.5rem;
    }
    .method.post { background: #3B82F6; }
    code {
      background: #0F0F0F;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .tool-list {
      list-style: none;
      margin-left: 1rem;
    }
    .tool-list li {
      padding: 0.75rem;
      background: #0F0F0F;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      border-left: 3px solid #F48120;
    }
    .tool-name {
      color: #F48120;
      font-weight: 600;
    }
    a {
      color: #F48120;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .status-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      background: #10B981;
      border-radius: 50%;
      margin-right: 0.5rem;
      animation: blink 2s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔧 MCP Server</h1>
    <div class="badge"><span class="status-indicator"></span>Server Active</div>
    
    <p>This is an MCP (Model Context Protocol) server that controls the demo dashboard app. It provides tools that can be called from any MCP client.</p>

    <h2>📡 API Endpoints</h2>
    
    <div class="endpoint">
      <span class="method">GET</span>
      <code>/health</code> - Health check
    </div>
    
    <div class="endpoint">
      <span class="method">GET</span>
      <code>/mcp/tools/list</code> - List all available tools
    </div>
    
    <div class="endpoint">
      <span class="method post">POST</span>
      <code>/mcp/tools/call</code> - Execute a tool
    </div>

    <h2>🛠️ Available Tools</h2>
    <ul class="tool-list">
      <li><span class="tool-name">toggle_feature</span> - Toggle feature flags (analytics, notifications, darkMode, animations)</li>
      <li><span class="tool-name">update_stats</span> - Update dashboard statistics</li>
      <li><span class="tool-name">set_message</span> - Set the banner message</li>
      <li><span class="tool-name">get_state</span> - Get current app state</li>
      <li><span class="tool-name">reset_demo</span> - Reset to default state</li>
      <li><span class="tool-name">simulate_traffic</span> - Simulate traffic (low/medium/high)</li>
      <li><span class="tool-name">enable_all_features</span> - Enable all features</li>
      <li><span class="tool-name">disable_all_features</span> - Disable all features</li>
    </ul>

    <h2>🚀 Usage Example</h2>
    <div class="endpoint">
      <pre>curl -X POST https://your-mcp-server.workers.dev/mcp/tools/call \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "toggle_feature",
    "arguments": {"feature": "darkMode"}
  }'</pre>
    </div>

    <h2>📚 MCP Client Setup</h2>
    <p>To connect from OpenCode or another MCP client:</p>
    <ol style="margin-left: 2rem; margin-top: 1rem;">
      <li>Add this server URL to your MCP client configuration</li>
      <li>No authentication required - this is a demo server</li>
      <li>Use the tools to control the dashboard in real-time</li>
    </ol>

    <h2>🎓 Workshop Info</h2>
    <p>This MCP server is part of the Cloudflare SE Intern Workshop. It demonstrates how MCP servers can control applications and provide programmatic interfaces.</p>
    
    <p style="margin-top: 2rem; text-align: center; color: #6B7280;">
      Built with ❤️ for Cloudflare Workshops
    </p>
  </div>
</body>
</html>`;
}
