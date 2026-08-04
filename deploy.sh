#!/bin/bash
set -e

echo "================================================"
echo "MCP Lab Workshop - Deploying Both Workers"
echo "================================================"

# Create KV namespace
echo ""
echo "Step 1: Creating KV namespace..."
KV_OUTPUT=$(npx wrangler kv namespace create "DEMO_STATE" 2>&1)
echo "$KV_OUTPUT"

# Extract the namespace ID from wrangler output
KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | head -1 | cut -d'"' -f2)

if [ -z "$KV_ID" ]; then
  echo "❌ Failed to extract KV namespace ID"
  exit 1
fi

echo "✅ KV Namespace ID: $KV_ID"

# Update demo-app wrangler.toml
echo ""
echo "Step 2: Configuring demo-app..."
sed -i.bak "s/# ID will be auto-provisioned by Workers Builds/id = \"$KV_ID\"/" demo-app/wrangler.toml
rm -f demo-app/wrangler.toml.bak
echo "✅ demo-app configured"

# Update mcp-server wrangler.toml  
echo ""
echo "Step 3: Configuring mcp-server..."
sed -i.bak "s/# ID will be auto-provisioned by Workers Builds/id = \"$KV_ID\"/" mcp-server/wrangler.toml
rm -f mcp-server/wrangler.toml.bak
echo "✅ mcp-server configured"

# Deploy demo-app
echo ""
echo "Step 4: Deploying demo-app (Dashboard)..."
cd demo-app && npx wrangler deploy
cd ..
echo "✅ demo-app deployed"

# Deploy mcp-server
echo ""
echo "Step 5: Deploying mcp-server (MCP Tools)..."
cd mcp-server && npx wrangler deploy
cd ..
echo "✅ mcp-server deployed"

echo ""
echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "🎯 Dashboard: https://mcp-demo-app.YOUR-SUBDOMAIN.workers.dev"
echo "🔧 MCP Server: https://mcp-server.YOUR-SUBDOMAIN.workers.dev/mcp"
echo ""
echo "Next steps:"
echo "1. Open the Dashboard URL to see the live monitoring UI"
echo "2. Copy the MCP Server URL to Cloudflare AI Playground"
echo "3. Use MCP tools to control the dashboard in real-time"
echo "================================================"
