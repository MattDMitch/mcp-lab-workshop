/**
 * MCP Demo App - Professional Dashboard
 * A professional, reactive dashboard controlled by MCP server
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/events') {
      return handleSSE(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, url);
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(getHTML(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleSSE(request, env) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  await writer.write(encoder.encode('data: {"type":"connected"}\n\n'));

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
      message: 'Application running normally',
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
  <title>MCP Demo Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --orange-primary: #F48120;
      --orange-hover: #FF8C00;
      --bg-dark: #0C0D0E;
      --bg-darker: #000000;
      --bg-card: #18181A;
      --bg-hover: #27272A;
      --text-primary: #FAFAFA;
      --text-secondary: #A1A1AA;
      --text-muted: #71717A;
      --border: #27272A;
      --border-hover: #3F3F46;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-dark);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    .nav {
      background: var(--bg-darker);
      border-bottom: 1px solid var(--border);
      padding: 1rem 0;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
    }

    .nav-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .logo-accent {
      color: var(--orange-primary);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #10B981;
      border-radius: 50%;
      animation: pulse-status 2s infinite;
    }

    @keyframes pulse-status {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem 2rem;
    }

    .page-header {
      margin-bottom: 2.5rem;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 1rem;
      color: var(--text-secondary);
    }

    .banner {
      background: linear-gradient(135deg, #3730A3 0%, #7C3AED 100%);
      border: 1px solid rgba(124, 58, 237, 0.3);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      text-align: center;
      font-weight: 500;
    }

    .banner-text {
      color: white;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.2s;
    }

    .metric-card:hover {
      border-color: var(--border-hover);
      background: var(--bg-hover);
    }

    .metric-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .metric-unit {
      font-size: 1rem;
      font-weight: 400;
      color: var(--text-muted);
    }

    .section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: var(--bg-dark);
      border: 1px solid var(--border);
      border-radius: 8px;
      transition: all 0.2s;
    }

    .feature-item:hover {
      border-color: var(--border-hover);
    }

    .feature-label {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .toggle {
      position: relative;
      width: 44px;
      height: 24px;
      background: var(--border);
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .toggle.active {
      background: var(--orange-primary);
    }

    .toggle::after {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      background: white;
      border-radius: 50%;
      top: 3px;
      left: 3px;
      transition: left 0.2s;
    }

    .toggle.active::after {
      left: 23px;
    }

    .activity-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-list::-webkit-scrollbar {
      width: 6px;
    }

    .activity-list::-webkit-scrollbar-track {
      background: var(--bg-dark);
      border-radius: 3px;
    }

    .activity-list::-webkit-scrollbar-thumb {
      background: var(--border-hover);
      border-radius: 3px;
    }

    .activity-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-info {
      flex: 1;
    }

    .activity-action {
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .activity-time {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .activity-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      background: rgba(244, 129, 32, 0.1);
      color: var(--orange-primary);
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .footer {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .footer-link {
      color: var(--orange-primary);
      text-decoration: none;
    }

    .footer-link:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .container {
        padding: 2rem 1rem;
      }
      
      .page-title {
        font-size: 1.5rem;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <div class="nav-content">
      <div class="logo">MCP <span class="logo-accent">Demo</span></div>
      <div class="status-indicator">
        <div class="status-dot"></div>
        <span>Connected</span>
      </div>
    </div>
  </nav>

  <div class="container">
    <div class="page-header">
      <h1 class="page-title">Dashboard Overview</h1>
      <p class="page-subtitle">Real-time application monitoring and control via MCP</p>
    </div>

    <div class="banner">
      <div class="banner-text" id="message">Application running normally</div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Visitors</div>
        <div class="metric-value" id="visitors">0</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Requests</div>
        <div class="metric-value" id="requests">0</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">System Uptime</div>
        <div class="metric-value">
          <span id="uptime">0</span><span class="metric-unit">%</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Response Time</div>
        <div class="metric-value">
          <span id="responseTime">0</span><span class="metric-unit">ms</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Feature Configuration</h2>
      </div>
      <div class="feature-grid">
        <div class="feature-item">
          <span class="feature-label">Analytics</span>
          <div class="toggle" id="toggle-analytics"></div>
        </div>
        <div class="feature-item">
          <span class="feature-label">Notifications</span>
          <div class="toggle" id="toggle-notifications"></div>
        </div>
        <div class="feature-item">
          <span class="feature-label">Dark Mode</span>
          <div class="toggle" id="toggle-darkMode"></div>
        </div>
        <div class="feature-item">
          <span class="feature-label">Animations</span>
          <div class="toggle" id="toggle-animations"></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Activity Log</h2>
      </div>
      <div class="activity-list" id="activityFeed">
        <div class="activity-item">
          <div class="activity-info">
            <div class="activity-action">Application initialized</div>
            <div class="activity-time">Just now</div>
          </div>
          <div class="activity-badge">System</div>
        </div>
      </div>
    </div>
  </div>

  <footer class="footer">
    <p>Controlled via MCP Server • Built for Cloudflare SE Workshop</p>
    <p style="margin-top: 0.5rem;">
      Powered by <a href="https://workers.cloudflare.com" class="footer-link" target="_blank">Cloudflare Workers</a>
    </p>
  </footer>

  <script>
    let currentState = null;

    const eventSource = new EventSource('/events');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'connected') {
        loadInitialState();
      } else {
        updateUI(data);
      }
    };

    async function loadInitialState() {
      try {
        const response = await fetch('/api/state');
        const state = await response.json();
        updateUI(state);
      } catch (err) {
        console.error('Failed to load state:', err);
      }
    }

    function updateUI(state) {
      if (!state) return;
      currentState = state;

      document.getElementById('visitors').textContent = state.stats.visitors.toLocaleString();
      document.getElementById('requests').textContent = state.stats.requests.toLocaleString();
      document.getElementById('uptime').textContent = state.stats.uptime;
      document.getElementById('responseTime').textContent = state.stats.responseTime;
      document.getElementById('message').textContent = state.message;

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

    loadInitialState();
    
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
          <div class="activity-info">
            <div class="activity-action">\${activity.action}</div>
            <div class="activity-time">\${new Date(activity.timestamp).toLocaleTimeString()}</div>
          </div>
          <div class="activity-badge">MCP</div>
        </div>
      \`).join('');
    }
  </script>
</body>
</html>`;
}
