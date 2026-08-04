/**
 * MCP Demo App - Production Monitoring Dashboard
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
      features: {
        analytics: true,
        notifications: true,
        darkMode: true,
        animations: true,
      },
      stats: {
        requests: 42069,
        errors: 12,
        avgResponseTime: 23,
        uptime: 99.98,
        activeConnections: 847,
        cacheHitRate: 94.2,
        bandwidth: 2847.5,
        cpuUsage: 34.7,
      },
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
  <title>Application Dashboard</title>
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
      --orange: #F48120;
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
      --green: #10B981;
      --red: #EF4444;
      --yellow: #F59E0B;
      --blue: #3B82F6;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-dark);
      color: var(--text-primary);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 240px;
      background: var(--bg-darker);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
    }

    .logo {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border);
      font-size: 1.25rem;
      font-weight: 700;
    }

    .logo-accent {
      color: var(--orange);
    }

    .nav-items {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.9375rem;
      font-weight: 500;
      transition: all 0.2s;
      cursor: pointer;
      border-left: 3px solid transparent;
    }

    .nav-item:hover {
      background: var(--bg-card);
      color: var(--text-primary);
    }

    .nav-item.active {
      background: var(--bg-card);
      color: var(--text-primary);
      border-left-color: var(--orange);
    }

    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border);
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--green);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .main {
      margin-left: 240px;
      min-height: 100vh;
    }

    .header {
      background: var(--bg-darker);
      border-bottom: 1px solid var(--border);
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(10px);
    }

    .header-title {
      font-size: 1.5rem;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .refresh-btn {
      padding: 0.5rem 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .refresh-btn:hover {
      border-color: var(--border-hover);
      background: var(--bg-hover);
    }

    .content {
      padding: 2rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.25rem;
      transition: border-color 0.2s;
    }

    .metric-card:hover {
      border-color: var(--border-hover);
    }

    .metric-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .metric-label {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .metric-trend {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .trend-up {
      background: rgba(16, 185, 129, 0.1);
      color: var(--green);
    }

    .trend-down {
      background: rgba(239, 68, 68, 0.1);
      color: var(--red);
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .metric-unit {
      font-size: 0.875rem;
      font-weight: 400;
      color: var(--text-muted);
      margin-left: 0.25rem;
    }

    .section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }

    .section-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
    }

    .section-action {
      font-size: 0.875rem;
      color: var(--orange);
      text-decoration: none;
      font-weight: 500;
    }

    .section-action:hover {
      text-decoration: underline;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table thead {
      background: var(--bg-dark);
      border-bottom: 1px solid var(--border);
    }

    .table th {
      padding: 0.875rem 1.5rem;
      text-align: left;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .table td {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.9375rem;
    }

    .table tbody tr:hover {
      background: var(--bg-hover);
    }

    .table tbody tr:last-child td {
      border-bottom: none;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 100px;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .status-healthy {
      background: rgba(16, 185, 129, 0.1);
      color: var(--green);
    }

    .status-degraded {
      background: rgba(245, 158, 11, 0.1);
      color: var(--yellow);
    }

    .status-down {
      background: rgba(239, 68, 68, 0.1);
      color: var(--red);
    }

    .status-dot-inline {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .chart {
      padding: 1.5rem;
    }

    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      height: 120px;
      margin-bottom: 0.5rem;
    }

    .chart-bar {
      flex: 1;
      background: var(--orange);
      border-radius: 4px 4px 0 0;
      transition: all 0.3s;
      position: relative;
    }

    .chart-bar:hover {
      background: var(--orange-hover);
    }

    .chart-labels {
      display: flex;
      gap: 0.5rem;
    }

    .chart-label {
      flex: 1;
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      padding: 1.5rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: var(--bg-dark);
      border: 1px solid var(--border);
      border-radius: 6px;
    }

    .feature-label {
      font-size: 0.9375rem;
      font-weight: 500;
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
      background: var(--orange);
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
      padding: 0;
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-content {
      flex: 1;
    }

    .activity-action {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .activity-time {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .activity-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      background: rgba(244, 129, 32, 0.1);
      color: var(--orange);
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .main {
        margin-left: 0;
      }
    }
  </style>
</head>
<body>
  <div class="sidebar">
    <div class="logo">
      Platform <span class="logo-accent">Monitor</span>
    </div>
    
    <div class="nav-items">
      <div class="nav-item active">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        Overview
      </div>
      <div class="nav-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        Analytics
      </div>
      <div class="nav-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        Logs
      </div>
      <div class="nav-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        Alerts
      </div>
      <div class="nav-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m5.2-3.2l4.2 4.2m-4.2-10.4l4.2-4.2M1 12h6m6 0h6m-3.2 5.2l4.2 4.2m-4.2-10.4l4.2-4.2"/>
        </svg>
        Settings
      </div>
    </div>

    <div class="sidebar-footer">
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
        <div class="status-dot"></div>
        <span>System Operational</span>
      </div>
      <div style="font-size: 0.75rem;">Controlled via MCP</div>
    </div>
  </div>

  <div class="main">
    <div class="header">
      <h1 class="header-title">Overview</h1>
      <div class="header-actions">
        <button class="refresh-btn" onclick="location.reload()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 0.25rem;">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <div class="content">
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-label">Total Requests</div>
            <div class="metric-trend trend-up">+12.5%</div>
          </div>
          <div class="metric-value" id="requests">0</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-label">Error Rate</div>
            <div class="metric-trend trend-down">-0.03%</div>
          </div>
          <div class="metric-value">
            <span id="errors">0</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-label">Avg Response</div>
          </div>
          <div class="metric-value">
            <span id="avgResponseTime">0</span><span class="metric-unit">ms</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-label">Uptime</div>
            <div class="metric-trend trend-up">+0.01%</div>
          </div>
          <div class="metric-value">
            <span id="uptime">0</span><span class="metric-unit">%</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-label">Active Connections</div>
          </div>
          <div class="metric-value" id="activeConnections">0</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-label">Cache Hit Rate</div>
            <div class="metric-trend trend-up">+2.1%</div>
          </div>
          <div class="metric-value">
            <span id="cacheHitRate">0</span><span class="metric-unit">%</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-label">Bandwidth</div>
          </div>
          <div class="metric-value">
            <span id="bandwidth">0</span><span class="metric-unit">GB</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-label">CPU Usage</div>
          </div>
          <div class="metric-value">
            <span id="cpuUsage">0</span><span class="metric-unit">%</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Request Volume (Last 7 Days)</h2>
          <a href="#" class="section-action">View Details</a>
        </div>
        <div class="chart">
          <div class="chart-bars">
            <div class="chart-bar" style="height: 65%;"></div>
            <div class="chart-bar" style="height: 78%;"></div>
            <div class="chart-bar" style="height: 82%;"></div>
            <div class="chart-bar" style="height: 71%;"></div>
            <div class="chart-bar" style="height: 88%;"></div>
            <div class="chart-bar" style="height: 95%;"></div>
            <div class="chart-bar" style="height: 100%;"></div>
          </div>
          <div class="chart-labels">
            <div class="chart-label">Mon</div>
            <div class="chart-label">Tue</div>
            <div class="chart-label">Wed</div>
            <div class="chart-label">Thu</div>
            <div class="chart-label">Fri</div>
            <div class="chart-label">Sat</div>
            <div class="chart-label">Sun</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">API Endpoints</h2>
          <a href="#" class="section-action">View All</a>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Requests</th>
              <th>Avg Latency</th>
              <th>Errors</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="endpointsTable">
            <tr>
              <td>/api/users</td>
              <td>15,234</td>
              <td>18ms</td>
              <td>2</td>
              <td><span class="status-badge status-healthy"><span class="status-dot-inline"></span>Healthy</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Feature Flags</h2>
          <a href="#" class="section-action">Manage</a>
        </div>
        <div class="features-grid">
          <div class="feature-item">
            <span class="feature-label">Analytics Tracking</span>
            <div class="toggle" id="toggle-analytics"></div>
          </div>
          <div class="feature-item">
            <span class="feature-label">Push Notifications</span>
            <div class="toggle" id="toggle-notifications"></div>
          </div>
          <div class="feature-item">
            <span class="feature-label">Dark Mode</span>
            <div class="toggle" id="toggle-darkMode"></div>
          </div>
          <div class="feature-item">
            <span class="feature-label">UI Animations</span>
            <div class="toggle" id="toggle-animations"></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Recent Activity</h2>
          <a href="#" class="section-action">View Logs</a>
        </div>
        <div class="activity-list" id="activityFeed">
          <div class="activity-item">
            <div class="activity-content">
              <div class="activity-action">System initialized</div>
              <div class="activity-time">Just now</div>
            </div>
            <div class="activity-badge">System</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
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

      document.getElementById('requests').textContent = state.stats.requests.toLocaleString();
      document.getElementById('errors').textContent = state.stats.errors;
      document.getElementById('avgResponseTime').textContent = state.stats.avgResponseTime;
      document.getElementById('uptime').textContent = state.stats.uptime;
      document.getElementById('activeConnections').textContent = state.stats.activeConnections.toLocaleString();
      document.getElementById('cacheHitRate').textContent = state.stats.cacheHitRate;
      document.getElementById('bandwidth').textContent = state.stats.bandwidth.toLocaleString();
      document.getElementById('cpuUsage').textContent = state.stats.cpuUsage;

      Object.keys(state.features).forEach(feature => {
        const toggle = document.getElementById('toggle-' + feature);
        if (toggle) {
          toggle.classList.toggle('active', state.features[feature]);
        }
      });

      if (state.endpoints) {
        updateEndpointsTable(state.endpoints);
      }
    }

    function updateEndpointsTable(endpoints) {
      const tbody = document.getElementById('endpointsTable');
      tbody.innerHTML = endpoints.map(ep => \`
        <tr>
          <td>\${ep.path}</td>
          <td>\${ep.requests.toLocaleString()}</td>
          <td>\${ep.avgLatency}ms</td>
          <td>\${ep.errors}</td>
          <td><span class="status-badge status-\${ep.status}"><span class="status-dot-inline"></span>\${ep.status.charAt(0).toUpperCase() + ep.status.slice(1)}</span></td>
        </tr>
      \`).join('');
    }

    // Setup navigation tabs
    document.querySelectorAll('.nav-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        const tabName = item.textContent.trim();
        document.querySelector('.header-title').textContent = tabName;
        
        const content = document.querySelector('.content');
        
        if (tabName === 'Logs') {
          showLogsView(content);
        } else if (tabName === 'Overview') {
          location.reload();
        } else {
          content.innerHTML = '<div style="padding: 3rem; text-align: center; color: var(--text-secondary); font-size: 1.125rem;">' + tabName + ' view - Coming soon in full workshop version</div>';
        }
      });
    });
    
    function showLogsView(content) {
      content.innerHTML = \`
        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <select id="logLevel" style="padding: 0.5rem 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 0.875rem;">
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            <button onclick="document.getElementById('logContainer').innerHTML = ''" style="padding: 0.5rem 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 0.875rem; cursor: pointer;">Clear Logs</button>
          </div>
        </div>
        
        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; font-family: 'Monaco', 'Courier New', monospace; font-size: 0.875rem; max-height: 600px; overflow-y: auto;" id="logContainer">
          <div style="color: var(--text-muted); text-align: center; padding: 2rem;">Loading logs...</div>
        </div>
      \`;
      
      loadLogs();
      
      // Auto-refresh logs every 3 seconds
      if (window.logsInterval) clearInterval(window.logsInterval);
      window.logsInterval = setInterval(loadLogs, 3000);
    }
    
    async function loadLogs() {
      try {
        const response = await fetch('/api/activity');
        const activities = await response.json();
        const container = document.getElementById('logContainer');
        if (!container) return;
        
        if (!activities || activities.length === 0) {
          container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 2rem;">No logs available</div>';
          return;
        }
        
        const logLevels = ['info', 'warning', 'error', 'info', 'info']; // Simulate different levels
        
        container.innerHTML = activities.slice().reverse().map((activity, idx) => {
          const level = activity.details?.level || logLevels[idx % logLevels.length];
          const levelColor = {
            info: '#3B82F6',
            warning: '#F59E0B',
            error: '#EF4444'
          }[level];
          
          const timestamp = new Date(activity.timestamp).toISOString();
          const action = activity.action || 'System event';
          const details = activity.details ? JSON.stringify(activity.details) : '';
          
          return \`
            <div style="padding: 0.75rem; border-bottom: 1px solid var(--border); display: flex; gap: 1rem; align-items: flex-start;">
              <div style="color: var(--text-muted); font-size: 0.8125rem; min-width: 180px;">\${timestamp}</div>
              <div style="background: \${levelColor}; color: white; padding: 0.125rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; min-width: 60px; text-align: center;">\${level}</div>
              <div style="flex: 1;">
                <div style="color: var(--text-primary); margin-bottom: 0.25rem;">\${action}</div>
                \${details ? '<div style="color: var(--text-muted); font-size: 0.8125rem;">' + details + '</div>' : ''}
              </div>
            </div>
          \`;
        }).join('');
      } catch (err) {
        console.error('Failed to load logs:', err);
      }
    }

    // Setup feature toggle clicks
    document.querySelectorAll('[id^="toggle-"]').forEach(toggle => {
      toggle.addEventListener('click', async () => {
        const feature = toggle.id.replace('toggle-', '');
        toggle.classList.toggle('active');
        console.log('Toggle clicked:', feature, 'now:', toggle.classList.contains('active'));
      });
    });

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
          <div class="activity-content">
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
