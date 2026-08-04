# 🚀 MCP Lab Workshop

<div align="center">

**Learn Model Context Protocol (MCP) with Cloudflare Workers**

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR-USERNAME/mcp-lab-workshop)

<img src="https://img.shields.io/badge/Cloudflare-F48120?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare"/>
<img src="https://img.shields.io/badge/Workers-000000?style=for-the-badge&logo=cloudflare&logoColor=F48120" alt="Workers"/>
<img src="https://img.shields.io/badge/MCP-Protocol-8B5CF6?style=for-the-badge" alt="MCP"/>

</div>

---

## 🎯 What is This?

An **interactive workshop** for SE interns to learn about **Model Context Protocol (MCP)** servers. Deploy a live dashboard app that can be controlled in real-time via MCP tools.

### What You'll Build

1. **🎨 Interactive Dashboard** - A beautiful dark-themed web app with real-time stats
2. **🔧 MCP Server** - A fully functional MCP server with 8 tools to control the dashboard
3. **📡 Real-time Connection** - Watch the dashboard update live as you call MCP tools

---

## ✨ Features

### Demo App
- 🌙 **Dark-themed** beautiful UI with Cloudflare branding
- 📊 **Live statistics** that update in real-time
- 🎛️ **Feature toggles** (Analytics, Notifications, Dark Mode, Animations)
- 📡 **Activity feed** showing all MCP actions
- ⚡ **Server-Sent Events** for instant updates

### MCP Server
- 🛠️ **8 MCP Tools** for controlling the dashboard
- 🔓 **No authentication** required - perfect for learning
- 🌍 **Edge deployed** - runs on Cloudflare's global network
- 📦 **KV storage** for state management

---

## 🚀 Quick Deploy

### One-Click Deploy

Click the button above to deploy to your Cloudflare account:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/MattDMitch/mcp-lab-workshop)

The deploy process will:
1. ✅ Clone the repo to your GitHub
2. ✅ Create a KV namespace automatically
3. ✅ Deploy **TWO workers**: `mcp-demo-app` (dashboard) and `mcp-server` (MCP tools)
4. ✅ Give you live URLs instantly

> **Important**: The deployment creates **two separate workers**. Make sure both are deployed successfully!

### Manual Deploy

If you prefer to deploy manually:

```bash
# Clone the repo
git clone https://github.com/MattDMitch/mcp-lab-workshop.git
cd mcp-lab-workshop

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Run deploy script (creates KV namespace and deploys both workers)
npm run deploy
```

This will deploy:
- ✅ `mcp-demo-app` - The monitoring dashboard UI
- ✅ `mcp-server` - The MCP tools server

---

## 🎮 Using the MCP Server

Once deployed, you'll get ONE worker with multiple endpoints:

- **Dashboard**: `https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev/`
- **MCP Server**: `https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev/mcp`

> Both the dashboard and MCP server run in the same worker using path-based routing

### Connect to MCP Server

Add the MCP server to your OpenCode or MCP client:

```json
{
  "mcpServers": {
    "demo": {
      "url": "https://REPO-NAME-mcp.YOUR-SUBDOMAIN.workers.dev"
    }
  }
}
```

### Available Tools

| Tool | Description | Example |
|------|-------------|---------|
| `toggle_feature` | Toggle features on/off | Toggle dark mode |
| `update_stats` | Change dashboard numbers | Set visitors to 9999 |
| `set_message` | Update banner message | "Hello Interns! 👋" |
| `get_state` | View current app state | Get all settings |
| `reset_demo` | Reset to defaults | Clean slate |
| `simulate_traffic` | Generate fake activity | Simulate high traffic |
| `enable_all_features` | Turn on all features | Enable everything |
| `disable_all_features` | Turn off all features | Disable everything |

---

## 💡 Try These Examples

### Toggle Dark Mode
```bash
curl -X POST https://mcp-server.YOUR-SUBDOMAIN.workers.dev/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "toggle_feature",
    "arguments": {"feature": "darkMode"}
  }'
```

### Set Custom Message
```bash
curl -X POST https://mcp-server.YOUR-SUBDOMAIN.workers.dev/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "set_message",
    "arguments": {"message": "Welcome SE Interns! 🎉"}
  }'
```

### Simulate High Traffic
```bash
curl -X POST https://mcp-server.YOUR-SUBDOMAIN.workers.dev/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "simulate_traffic",
    "arguments": {"amount": "high"}
  }'
```

### Update Stats
```bash
curl -X POST https://mcp-server.YOUR-SUBDOMAIN.workers.dev/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "update_stats",
    "arguments": {"stat": "visitors", "value": 9999}
  }'
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│  Demo App Worker                │
│  - Dark-themed dashboard        │
│  - Server-Sent Events           │
│  - Real-time updates            │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  Cloudflare KV Namespace        │
│  - App state storage            │
│  - Activity logs                │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  MCP Server Worker              │
│  - 8 MCP tools                  │
│  - Tool execution               │
│  - State management             │
└─────────────────────────────────┘
```

---

## 📚 Workshop Guide

### Part 1: Deploy (10 min)
1. Click "Deploy to Cloudflare"
2. Authorize GitHub and Cloudflare
3. Get your live URLs

### Part 2: Explore the Dashboard (10 min)
1. Open the dashboard URL
2. See the dark-themed interface
3. Observe the stats and features

### Part 3: Connect MCP Client (10 min)
1. Add MCP server to OpenCode
2. List available tools
3. Verify connection

### Part 4: Control the Dashboard (15 min)
1. Toggle dark mode
2. Update statistics
3. Change the message
4. Simulate traffic
5. Watch real-time updates!

### Part 5: Explore the Code (15 min)
1. Review MCP server implementation
2. Understand tool schemas
3. See KV storage in action
4. Learn about SSE for real-time updates

---

## 🎓 Learning Objectives

After this workshop, you'll understand:

- ✅ What MCP is and why it's useful
- ✅ How to build an MCP server
- ✅ Tool schemas and execution
- ✅ Real-time web applications with SSE
- ✅ Cloudflare Workers and KV storage
- ✅ Edge computing concepts

---

## 🛠️ Tech Stack

- **[Cloudflare Workers](https://workers.cloudflare.com)** - Serverless execution
- **[Workers KV](https://developers.cloudflare.com/kv/)** - Edge storage
- **[MCP Protocol](https://modelcontextprotocol.io)** - Tool calling interface
- **Server-Sent Events** - Real-time updates
- **Vanilla JS** - No framework complexity

---

## 📂 Project Structure

```
mcp-lab-complete/
├── README.md              # This file
├── wrangler.toml          # Cloudflare config
├── package.json           # Project metadata
├── demo-app/
│   └── index.js          # Dashboard worker
└── mcp-server/
    └── index.js          # MCP server worker
```

---

## 🎨 Customization Ideas

**For Students:**
- Add new MCP tools
- Create custom themes
- Add more statistics
- Build a notification system
- Add WebSocket support

**For Instructors:**
- Create coding challenges
- Add quiz questions
- Build team competitions
- Create extension exercises

---

## 🔗 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Workers KV Guide](https://developers.cloudflare.com/kv/)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

---

## 📄 License

MIT License - Free to use for educational purposes

---

## 🙌 Credits

Built for **Cloudflare SE Intern Workshops**

Made with ❤️ and ☕

---

<div align="center">

**Ready to learn MCP?**

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/MattDMitch/mcp-lab-workshop)

</div>
