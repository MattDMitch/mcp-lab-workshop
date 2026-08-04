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

# Get the base name from current directory or use fallback
BASE_NAME="${PWD##*/}"
if [ -z "$BASE_NAME" ] || [ "$BASE_NAME" = "mcp-lab-complete" ]; then
  BASE_NAME="mcp-lab-workshop"
fi

echo "📝 Base name detected: $BASE_NAME"

# Deploy demo-app with explicit name
echo ""
echo "Step 4: Deploying demo-app (Dashboard)..."
cd demo-app && npx wrangler deploy --name "${BASE_NAME}-dashboard"
cd ..
echo "✅ demo-app deployed as: ${BASE_NAME}-dashboard"

# Deploy mcp-server with explicit name
echo ""
echo "Step 5: Deploying mcp-server (MCP Tools)..."
cd mcp-server && npx wrangler deploy --name "${BASE_NAME}-mcp"
cd ..
echo "✅ mcp-server deployed as: ${BASE_NAME}-mcp"

echo ""
echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "🎯 Dashboard: https://${BASE_NAME}-dashboard.YOUR-SUBDOMAIN.workers.dev"
echo "🔧 MCP Server: https://${BASE_NAME}-mcp.YOUR-SUBDOMAIN.workers.dev/mcp"
echo ""
echo "📋 Your actual URLs (check Wrangler output above):"
echo "   Look for lines like: https://WORKER-NAME.your-subdomain.workers.dev"
echo ""
echo "Next steps:"
echo "1. Open the Dashboard URL to see the live monitoring UI"
echo "2. Copy the MCP Server URL to Cloudflare AI Playground"
echo "3. Use MCP tools to control the dashboard in real-time"
echo "================================================"
