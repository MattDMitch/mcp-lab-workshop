# Deployment Verification Checklist

After clicking "Deploy to Cloudflare", verify both workers are deployed correctly:

## ✅ Step 1: Check Worker Count

You should have **TWO workers** deployed:

1. **REPO-NAME-dashboard** - Dashboard UI (e.g., `mcp-lab-workshop2-dashboard`)
2. **REPO-NAME-mcp** - MCP Tools (e.g., `mcp-lab-workshop2-mcp`)

Go to: https://dash.cloudflare.com/ → Workers & Pages

You should see both workers listed with `-dashboard` and `-mcp` suffixes.

## ✅ Step 2: Verify Dashboard (REPO-NAME-dashboard)

Visit: `https://REPO-NAME-dashboard.YOUR-SUBDOMAIN.workers.dev`

(Replace REPO-NAME with your actual repo name, e.g., `mcp-lab-workshop2-dashboard`)

**Expected**: You should see a **dark-themed monitoring dashboard** with:
- Navigation sidebar (Overview, Logs, Settings)
- 8 metric cards (Requests, Errors, Response Time, etc.)
- Live activity feed
- Feature toggles

**Wrong**: If you see an "MCP Server" page with connection instructions, the wrong code was deployed.

## ✅ Step 3: Verify MCP Server (REPO-NAME-mcp)

Visit: `https://REPO-NAME-mcp.YOUR-SUBDOMAIN.workers.dev`

(Replace REPO-NAME with your actual repo name, e.g., `mcp-lab-workshop2-mcp`)

**Expected**: You should see an **MCP Server info page** with:
- "MCP Server" title with green "Active" badge
- Cloudflare AI Playground connection URL
- Link to dashboard
- Quick test curl command

## ✅ Step 4: Test Dashboard Link

On the MCP Server page, click "View Live Dashboard"

**Expected**: Opens your dashboard at `https://REPO-NAME-dashboard.YOUR-SUBDOMAIN.workers.dev`

The URLs should match your subdomain and repo name (e.g., `mcp-lab-workshop2-dashboard.joey-abc.workers.dev`).

## ✅ Step 5: Test MCP Connection

1. Open Cloudflare AI Playground
2. Add MCP server: `https://REPO-NAME-mcp.YOUR-SUBDOMAIN.workers.dev/mcp`
3. You should see 6 tools available
4. Call `get_state` tool
5. Should return dashboard state with stats

## 🚨 Troubleshooting

### Problem: Only one worker deployed

**Solution**: Run manual deploy:
```bash
cd mcp-lab-workshop
npm install
npm run deploy
```

### Problem: mcp-demo-app shows MCP Server page

**Solution**: Wrong code deployed. Redeploy demo-app:
```bash
cd demo-app
npx wrangler deploy
```

### Problem: URLs show "matthew-4b1.workers.dev"

**Solution**: You're looking at the example deployment. Your URLs should have YOUR subdomain.

### Problem: Dashboard not updating

**Solution**: 
1. Check both workers share same KV namespace
2. Verify KV namespace exists in dashboard
3. Try `reset_demo` tool to reset state

## 📞 Need Help?

If deployment fails or you see errors, check:
1. Cloudflare account is connected
2. Both workers appear in dashboard
3. KV namespace was created
4. Each worker has correct code (check first 5 lines of index.js)
