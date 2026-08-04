#!/bin/bash
set -e

echo "Creating KV namespace..."
KV_OUTPUT=$(npx wrangler kv namespace create "DEMO_STATE" 2>&1)
echo "$KV_OUTPUT"

# Extract the namespace ID from wrangler output
KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | head -1 | cut -d'"' -f2)

if [ -z "$KV_ID" ]; then
  echo "Failed to extract KV namespace ID"
  exit 1
fi

echo "KV Namespace ID: $KV_ID"

# Update demo-app wrangler.toml
sed -i.bak "s/binding = \"DEMO_STATE\"/binding = \"DEMO_STATE\"\nid = \"$KV_ID\"/" demo-app/wrangler.toml
rm demo-app/wrangler.toml.bak

# Update mcp-server wrangler.toml  
sed -i.bak "s/binding = \"DEMO_STATE\"/binding = \"DEMO_STATE\"\nid = \"$KV_ID\"/" mcp-server/wrangler.toml
rm mcp-server/wrangler.toml.bak

echo "Deploying demo-app..."
cd demo-app && npx wrangler deploy

echo "Deploying mcp-server..."
cd ../mcp-server && npx wrangler deploy

echo "Deployment complete!"
echo "Demo App: https://mcp-demo-app.YOUR-SUBDOMAIN.workers.dev"
echo "MCP Server: https://mcp-server.YOUR-SUBDOMAIN.workers.dev"
