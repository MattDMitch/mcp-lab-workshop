/**
 * MCP Demo App - Interactive Dark Dashboard
 * A fun, reactive dashboard that responds to MCP server commands
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle SSE endpoint for real-time updates
    if (url.pathname === '/events') {
      return handleSSE(request, env);
    }

    // API endpoints
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, url);
    }

    // Serve the main dashboard
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(getHTML(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

// Server-Sent Events for real-time updates
async function handleSSE(request, env) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connection message
  await writer.write(encoder.encode('data: {"type":"connected"}\n\n'));

  // Poll KV for changes every 2 seconds
  const intervalId = setInterval(async () => {
    try {
      const state = await env.DEMO_STATE.get('appState', 'json');
      if (state) {
        await writer.write(encoder.encode(`data: ${JSON.stringify(state)}\n\n`));
      }
    } catch (err) {
      console.error('SSE error:', err);
    }
  }, 2000);

  // Cleanup after 60 seconds
  setTimeout(() => {
    clearInterval(intervalId);
    writer.close();
  }, 60000);

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// API handlers
async function handleAPI(request, env, url) {
  const path = url.pathname;

  if (path === '/api/state' && request.method === 'GET') {
    const state = await getState(env);
    return jsonResponse(state);
  }

  if (path === '/api/activity' && request.method === 'GET') {
    const activity = await env.DEMO_STATE.get('activity', 'json') || [];
    return jsonResponse(activity);
  }

  return new Response('Not Found', { status: 404 });
}

// Get or initialize app state
async function getState(env) {
  let state = await env.DEMO_STATE.get('appState', 'json');
  
  if (!state) {
    state = {
      theme: 'dark',
      features: {
        analytics: true,
        notifications: true,
        darkMode: true,
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
    await env.DEMO_STATE.put('appState', JSON.stringify(state));
  }
  
  return state;
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Lab - Demo Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --cf-orange: #F48120;
      --cf-orange-bright: #FF8C00;
      --bg-primary: #0A0A0A;
      --bg-secondary: #141414;
      --bg-tertiary: #1E1E1E;
      --text-primary: #FFFFFF;
      --text-secondary: #A0A0A0;
      --border: #2A2A2A;
      --glow: rgba(244, 129, 32, 0.3);
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 3rem 2rem;
      background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
      border-radius: 20px;
      border: 1px solid var(--border);
      position: relative;
      overflow: hidden;
    }

    header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--cf-orange) 0%, var(--cf-orange-bright) 100%);
    }

    h1 {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, var(--cf-orange) 0%, var(--cf-orange-bright) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: slideDown 0.6s ease;
    }

    .subtitle {
      font-size: 1.3rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: rgba(244, 129, 32, 0.1);
      border: 1px solid var(--cf-orange);
      border-radius: 50px;
      color: var(--cf-orange);
      font-weight: 600;
      font-size: 0.9rem;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--cf-orange);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2rem;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--cf-orange), var(--cf-orange-bright));
    }

    .stat-card:hover {
      transform: translateY(-5px);
      border-color: var(--cf-orange);
      box-shadow: 0 10px 40px var(--glow);
    }

    .stat-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .stat-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 0.75rem;
      font-weight: 600;
    }

    .stat-value {
      font-size: 3rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--cf-orange) 0%, var(--cf-orange-bright) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: countUp 1s ease;
    }

    .message-banner {
      background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
      color: white;
      padding: 2rem;
      border-radius: 16px;
      margin-bottom: 2rem;
      text-align: center;
      font-size: 1.3rem;
      font-weight: 600;
      box-shadow: 0 10px 40px rgba(139, 92, 246, 0.3);
      animation: pulse 3s infinite;
    }

    .features-section {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2.5rem;
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.75rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-primary);
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      background: var(--bg-tertiary);
      border-radius: 12px;
      border: 1px solid var(--border);
      transition: all 0.3s;
    }

    .feature-item:hover {
      border-color: var(--cf-orange);
      box-shadow: 0 5px 20px var(--glow);
    }

    .feature-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .feature-icon {
      font-size: 1.5rem;
    }

    .feature-toggle {
      width: 56px;
      height: 30px;
      background: #3A3A3A;
      border-radius: 50px;
      position: relative;
      cursor: pointer;
      transition: background 0.3s;
      flex-shrink: 0;
    }

    .feature-toggle.active {
      background: var(--cf-orange);
      box-shadow: 0 0 20px var(--glow);
    }

    .feature-toggle::after {
      content: '';
      position: absolute;
      width: 24px;
      height: 24px;
      background: white;
      border-radius: 50%;
      top: 3px;
      left: 3px;
      transition: left 0.3s;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    .feature-toggle.active::after {
      left: 29px;
    }

    .activity-feed {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2.5rem;
      max-height: 500px;
      overflow-y: auto;
    }

    .activity-feed::-webkit-scrollbar {
      width: 8px;
    }

    .activity-feed::-webkit-scrollbar-track {
      background: var(--bg-tertiary);
      border-radius: 4px;
    }

    .activity-feed::-webkit-scrollbar-thumb {
      background: var(--cf-orange);
      border-radius: 4px;
    }

    .activity-item {
      padding: 1.25rem;
      border-left: 3px solid var(--cf-orange);
      margin-bottom: 1rem;
      background: var(--bg-tertiary);
      border-radius: 0 8px 8px 0;
      animation: slideIn 0.3s ease;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .activity-content {
      flex: 1;
    }

    .activity-time {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .mcp-badge {
      display: inline-block;
      background: var(--cf-orange);
      color: white;
      padding: 0.35rem 0.85rem;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .connection-status {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem 1.5rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      z-index: 1000;
    }

    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #10B981;
      animation: blink 2s infinite;
      box-shadow: 0 0 10px #10B981;
    }

    footer {
      text-align: center;
      padding: 3rem 2rem;
      color: var(--text-secondary);
      font-size: 0.95rem;
      border-top: 1px solid var(--border);
      margin-top: 3rem;
    }

    footer a {
      color: var(--cf-orange);
      text-decoration: none;
    }

    footer a:hover {
      text-decoration: underline;
    }

    @keyframes slideDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes slideIn {
      from { transform: translateX(-20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes countUp {
      from { opacity: 0; transform: scale(0.5); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    @media (max-width: 768px) {
      h1 { font-size: 2.5rem; }
      .container { padding: 1rem; }
      .stats-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 MCP Lab Dashboard</h1>
      <p class="subtitle">Control this app via MCP Server • Real-time updates</p>
      <div class="status-badge">
        <div class="pulse-dot"></div>
        <span>Live Demo</span>
      </div>
    </header>

    <div class="message-banner" id="messageBanner">
      <span id="message">Welcome to the MCP Lab! 🚀</span>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-label">Visitors</div>
        <div class="stat-value" id="visitors">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-label">Requests</div>
        <div class="stat-value" id="requests">0</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-label">Uptime</div>
        <div class="stat-value" id="uptime">0%</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-label">Response</div>
        <div class="stat-value" id="responseTime">0<span style="font-size:1rem">ms</span></div>
      </div>
    </div>

    <div class="features-section">
      <h2 class="section-title">🎛️ Feature Toggles</h2>
      <div class="feature-grid">
        <div class="feature-item">
          <div class="feature-info">
            <div class="feature-icon">📊</div>
            <span>Analytics</span>
          </div>
          <div class="feature-toggle" id="toggle-analytics"></div>
        </div>
        <div class="feature-item">
          <div class="feature-info">
            <div class="feature-icon">🔔</div>
            <span>Notifications</span>
          </div>
          <div class="feature-toggle" id="toggle-notifications"></div>
        </div>
        <div class="feature-item">
          <div class="feature-info">
            <div class="feature-icon">🌙</div>
            <span>Dark Mode</span>
          </div>
          <div class="feature-toggle" id="toggle-darkMode"></div>
        </div>
        <div class="feature-item">
          <div class="feature-info">
            <div class="feature-icon">✨</div>
            <span>Animations</span>
          </div>
          <div class="feature-toggle" id="toggle-animations"></div>
        </div>
      </div>
    </div>

    <div class="activity-feed">
      <h2 class="section-title">📡 Activity Feed</h2>
      <div id="activityFeed">
        <div class="activity-item">
          <div class="activity-content">
            <div>App initialized</div>
            <div class="activity-time">Just now</div>
          </div>
          <span class="mcp-badge">SYSTEM</span>
        </div>
      </div>
    </div>

    <div class="connection-status">
      <div class="status-dot"></div>
      <span>Connected to MCP</span>
    </div>

    <footer>
      <p><strong>🔧 Control this dashboard using the MCP Server</strong></p>
      <p style="margin-top: 0.5rem;">Built for Cloudflare SE Intern Workshop</p>
      <p style="margin-top: 1rem; font-size: 0.85rem;">⚡ Powered by <a href="https://workers.cloudflare.com" target="_blank">Cloudflare Workers</a></p>
    </footer>
  </div>

  <script>
    let currentState = null;

    // Connect to SSE for real-time updates
    const eventSource = new EventSource('/events');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'connected') {
        console.log('✅ Connected to SSE');
        loadInitialState();
      } else {
        updateUI(data);
      }
    };

    eventSource.onerror = () => {
      console.error('❌ SSE connection error');
    };

    // Load initial state
    async function loadInitialState() {
      try {
        const response = await fetch('/api/state');
        const state = await response.json();
        updateUI(state);
      } catch (err) {
        console.error('Failed to load state:', err);
      }
    }

    // Update UI with new state
    function updateUI(state) {
      if (!state) return;
      currentState = state;

      // Update stats with animation
      document.getElementById('visitors').textContent = state.stats.visitors.toLocaleString();
      document.getElementById('requests').textContent = state.stats.requests.toLocaleString();
      document.getElementById('uptime').textContent = state.stats.uptime + '%';
      document.getElementById('responseTime').innerHTML = state.stats.responseTime + '<span style="font-size:1rem">ms</span>';

      // Update message
      document.getElementById('message').textContent = state.message;

      // Update features
      Object.keys(state.features).forEach(feature => {
        const toggle = document.getElementById('toggle-' + feature);
        if (toggle) {
          if (state.features[feature]) {
            toggle.classList.add('active');
          } else {
            toggle.classList.remove('active');
          }
        }
      });
    }

    // Load initial state on page load
    loadInitialState();
    
    // Poll for activity feed updates
    setInterval(async () => {
      try {
        const response = await fetch('/api/activity');
        const activities = await response.json();
        updateActivityFeed(activities);
      } catch (err) {
        console.error('Failed to load activity:', err);
      }
    }, 5000);

    function updateActivityFeed(activities) {
      const feed = document.getElementById('activityFeed');
      if (!activities || activities.length === 0) return;
      
      feed.innerHTML = activities.slice(-10).reverse().map(activity => \`
        <div class="activity-item">
          <div class="activity-content">
            <div>\${activity.action}</div>
            <div class="activity-time">\${new Date(activity.timestamp).toLocaleTimeString()}</div>
          </div>
          <span class="mcp-badge">MCP</span>
        </div>
      \`).join('');
    }
  </script>
</body>
</html>`;
}
