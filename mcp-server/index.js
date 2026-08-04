/**
 * MCP Server Worker - Supports both SSE and HTTP transports
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // MCP endpoint - GET for SSE, POST for HTTP
    if (url.pathname === '/mcp') {
      if (request.method === 'GET') {
        return handleSSE(env, corsHeaders);
      } else if (request.method === 'POST') {
        return handleHTTP(request, env, corsHeaders);
      }
    }

    // Curl testing endpoint
    if (url.pathname === '/mcp/tools/call' && request.method === 'POST') {
      return handleToolCall(request, env, corsHeaders);
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'healthy' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/' || url.pathname === '/info') {
      return new Response(getInfoHTML(request), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};

// SSE transport for real-time updates
function handleSSE(env, corsHeaders) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send endpoint message
      controller.enqueue(encoder.encode('event: endpoint\n'));
      controller.enqueue(encoder.encode('data: /mcp\n\n'));
      
      // Keep alive with periodic pings
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (e) {
          clearInterval(interval);
        }
      }, 15000);
      
      // Auto-close after 5 minutes
      setTimeout(() => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {}
      }, 300000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...corsHeaders,
    },
  });
}

// HTTP transport for request/response
async function handleHTTP(request, env, corsHeaders) {
  try {
    const req = await request.json();
    const { method, params, id } = req;

    let result;

    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: { 
            tools: {},
            prompts: {}
          },
          serverInfo: { name: 'mcp-demo', version: '1.0.0' },
        };
        break;

      case 'tools/list':
        result = { tools: getTools() };
        break;

      case 'tools/call':
        result = await callTool(env, params.name, params.arguments || {});
        break;

      case 'prompts/list':
        result = { prompts: getPrompts() };
        break;

      case 'prompts/get':
        result = await getPrompt(params.name, params.arguments);
        break;

      default:
        return jsonResponse({ jsonrpc: '2.0', error: { code: -32601, message: 'Method not found' }, id }, corsHeaders);
    }

    return jsonResponse({ jsonrpc: '2.0', result, id }, corsHeaders);
  } catch (error) {
    return jsonResponse({ jsonrpc: '2.0', error: { code: -32603, message: error.message }, id: null }, corsHeaders, 500);
  }
}

function getPrompts() {
  return [
    {
      name: 'dashboard_overview',
      description: 'Get a comprehensive overview of the current dashboard state',
      arguments: [],
    },
    {
      name: 'simulate_incident',
      description: 'Simulate a production incident scenario with automated response',
      arguments: [
        {
          name: 'severity',
          description: 'Incident severity level',
          required: true,
        },
      ],
    },
    {
      name: 'performance_analysis',
      description: 'Analyze system performance and suggest optimizations',
      arguments: [],
    },
    {
      name: 'demo_showcase',
      description: 'Run a full demonstration of MCP capabilities',
      arguments: [],
    },
  ];
}

async function getPrompt(name, args) {
  switch (name) {
    case 'dashboard_overview':
      return {
        description: 'Dashboard Overview Analysis',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Please analyze the current dashboard state and provide a summary. Use the get_state tool to fetch current metrics, then describe the system health, highlight any concerning metrics, and suggest actions if needed.',
            },
          },
        ],
      };

    case 'simulate_incident':
      const severity = args?.severity || 'medium';
      return {
        description: 'Production Incident Simulation',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Simulate a ${severity} severity production incident. First, use simulate_traffic with amount "high" to increase load. Then, update_endpoint_status to mark /api/auth as "down". Finally, describe what happened and what actions an SRE should take. This demonstrates how MCP can be used for incident response training.`,
            },
          },
        ],
      };

    case 'performance_analysis':
      return {
        description: 'System Performance Analysis',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Analyze system performance by checking the current state. Look at response times, error rates, cache hit rates, and CPU usage. Provide specific recommendations based on the metrics. Use get_state to fetch current data.',
            },
          },
        ],
      };

    case 'demo_showcase':
      return {
        description: 'Full MCP Demonstration',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Demonstrate the full capabilities of this MCP server by: 1) Getting the current state, 2) Simulating high traffic, 3) Toggling a feature flag, 4) Updating an endpoint status, and 5) Summarizing what changed. Explain each step as you go to showcase MCP tool calling.',
            },
          },
        ],
      };

    default:
      throw new Error('Unknown prompt: ' + name);
  }
}

function getTools() {
  return [
    {
      name: 'simulate_traffic',
      description: 'Simulate traffic on the dashboard - watch it update live!',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Traffic amount' },
        },
        required: ['amount'],
      },
    },
    {
      name: 'update_stats',
      description: 'Update a specific dashboard metric',
      inputSchema: {
        type: 'object',
        properties: {
          stat: { type: 'string', enum: ['requests', 'errors', 'avgResponseTime', 'uptime', 'activeConnections', 'cacheHitRate', 'bandwidth', 'cpuUsage'] },
          value: { type: 'number' },
        },
        required: ['stat', 'value'],
      },
    },
    {
      name: 'toggle_feature',
      description: 'Toggle a feature flag',
      inputSchema: {
        type: 'object',
        properties: {
          feature: { type: 'string', enum: ['analytics', 'notifications', 'darkMode', 'animations'] },
        },
        required: ['feature'],
      },
    },
    {
      name: 'update_endpoint_status',
      description: 'Change API endpoint health status',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Endpoint path like /api/users' },
          status: { type: 'string', enum: ['healthy', 'degraded', 'down'] },
        },
        required: ['path', 'status'],
      },
    },
    {
      name: 'get_state',
      description: 'Get current dashboard state',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'reset_demo',
      description: 'Reset demo to defaults',
      inputSchema: { type: 'object', properties: {} },
    },
  ];
}

async function callTool(env, name, args) {
  let result;
  
  switch (name) {
    case 'simulate_traffic':
      result = await simulateTraffic(env, args.amount);
      break;
    case 'update_stats':
      result = await updateStats(env, args.stat, args.value);
      break;
    case 'toggle_feature':
      result = await toggleFeature(env, args.feature);
      break;
    case 'update_endpoint_status':
      result = await updateEndpointStatus(env, args.path, args.status);
      break;
    case 'get_state':
      result = await getState(env);
      break;
    case 'reset_demo':
      result = await resetDemo(env);
      break;
    default:
      throw new Error('Unknown tool: ' + name);
  }
  
  await logActivity(env, name, args);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

async function handleToolCall(request, env, corsHeaders) {
  try {
    const { tool, arguments: args } = await request.json();
    const result = await callTool(env, tool, args || {});
    return jsonResponse({ success: true, result }, corsHeaders);
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, corsHeaders, 400);
  }
}

async function getState(env) {
  let state = await env.DEMO_STATE.get('appState', 'json');
  if (!state) {
    state = {
      features: { analytics: true, notifications: true, darkMode: true, animations: true },
      stats: { requests: 42069, errors: 12, avgResponseTime: 23, uptime: 99.98, activeConnections: 847, cacheHitRate: 94.2, bandwidth: 2847.5, cpuUsage: 34.7 },
      endpoints: [
        { path: '/api/users', requests: 15234, avgLatency: 18, errors: 2, status: 'healthy' },
        { path: '/api/orders', requests: 8901, avgLatency: 45, errors: 1, status: 'healthy' },
        { path: '/api/products', requests: 23456, avgLatency: 12, errors: 3, status: 'healthy' },
        { path: '/api/auth', requests: 5678, avgLatency: 89, errors: 4, status: 'degraded' },
        { path: '/api/analytics', requests: 3421, avgLatency: 156, errors: 2, status: 'healthy' },
      ],
      lastUpdate: new Date().toISOString(),
    };
    await env.DEMO_STATE.put('appState', JSON.stringify(state));
  }
  return state;
}

async function simulateTraffic(env, amount) {
  const state = await getState(env);
  const mult = { low: 10, medium: 100, high: 1000 }[amount] || 10;
  state.stats.requests += Math.floor(Math.random() * mult);
  state.stats.activeConnections += Math.floor(Math.random() * (mult / 10));
  state.stats.errors += Math.floor(Math.random() * 3);
  state.stats.avgResponseTime = Math.floor(Math.random() * 50) + 10;
  state.lastUpdate = new Date().toISOString();
  await env.DEMO_STATE.put('appState', JSON.stringify(state));
  return { message: 'Simulated ' + amount + ' traffic', stats: state.stats };
}

async function updateStats(env, stat, value) {
  const state = await getState(env);
  if (state.stats[stat] === undefined) throw new Error('Unknown stat');
  state.stats[stat] = value;
  state.lastUpdate = new Date().toISOString();
  await env.DEMO_STATE.put('appState', JSON.stringify(state));
  return { stat, value };
}

async function toggleFeature(env, feature) {
  const state = await getState(env);
  if (state.features[feature] === undefined) throw new Error('Unknown feature');
  state.features[feature] = !state.features[feature];
  state.lastUpdate = new Date().toISOString();
  await env.DEMO_STATE.put('appState', JSON.stringify(state));
  return { feature, enabled: state.features[feature] };
}

async function updateEndpointStatus(env, path, status) {
  const state = await getState(env);
  const endpoint = state.endpoints.find(ep => ep.path === path);
  if (!endpoint) throw new Error('Endpoint not found');
  endpoint.status = status;
  state.lastUpdate = new Date().toISOString();
  await env.DEMO_STATE.put('appState', JSON.stringify(state));
  return { path, status };
}

async function resetDemo(env) {
  await env.DEMO_STATE.delete('appState');
  await env.DEMO_STATE.delete('activity');
  return { message: 'Reset complete' };
}

async function logActivity(env, action, details) {
  let activity = (await env.DEMO_STATE.get('activity', 'json')) || [];
  activity.push({ action, details, timestamp: new Date().toISOString() });
  if (activity.length > 50) activity = activity.slice(-50);
  await env.DEMO_STATE.put('activity', JSON.stringify(activity));
}

function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getInfoHTML(request) {
  const url = new URL(request.url);
  const mcpServerUrl = url.origin + '/mcp';
  const dashboardUrl = url.origin; // Dashboard at root path
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>MCP Server</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#0C0D0E;color:#FAFAFA;padding:2rem;line-height:1.6}.container{max-width:900px;margin:0 auto;background:#18181A;border:1px solid #27272A;border-radius:12px;padding:2rem}h1{color:#F48120;margin-bottom:1rem;font-size:2rem}.badge{display:inline-block;background:rgba(16,185,129,0.1);color:#10B981;padding:.5rem 1rem;border-radius:6px;font-size:.875rem;font-weight:600;margin-bottom:2rem}h2{color:#F48120;margin-top:2rem;margin-bottom:1rem}pre{background:#0C0D0E;padding:1rem;border-radius:8px;overflow-x:auto;margin:1rem 0}a{color:#F48120;text-decoration:none}a:hover{text-decoration:underline}</style>
</head><body><div class="container">
<h1>MCP Server</h1><div class="badge">Active</div>
<p>Production monitoring dashboard control via MCP</p>
<h2>Cloudflare AI Playground</h2>
<pre>${mcpServerUrl}/mcp</pre>
<h2>Dashboard</h2>
<p><a href="${dashboardUrl}" target="_blank">View Live Dashboard</a></p>
<p style="color:#A1A1AA;margin-top:.5rem">Open dashboard, then use MCP tools to control it in real-time</p>
<h2>Quick Test</h2>
<pre>curl -X POST ${mcpServerUrl}/mcp/tools/call \\
  -H "Content-Type: application/json" \\
  -d '{"tool":"simulate_traffic","arguments":{"amount":"high"}}'</pre>
</div></body></html>`;
}
