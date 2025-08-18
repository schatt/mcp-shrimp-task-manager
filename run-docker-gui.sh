#!/bin/bash

# Run MCP Shrimp Task Manager with Web GUI in Docker

echo "🚀 Starting MCP Shrimp Task Manager with Web GUI..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t mcp-shrimp-task-manager .

# Run the container with web GUI enabled
echo "🌐 Starting container with web GUI on port 3000..."
docker run -it --rm \
  -p 3000:3000 \
  -e ENABLE_GUI=true \
  -e WEB_PORT=3000 \
         -v "$HOME/code/Shrimp:/app/ShrimpData" \
  --name mcp-shrimp-task-manager \
  mcp-shrimp-task-manager

echo "✅ Container stopped. Web GUI was available at http://localhost:3000"
