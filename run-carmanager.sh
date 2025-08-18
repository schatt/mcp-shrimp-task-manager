#!/bin/bash

# Run MCP Shrimp Task Manager for CarManager app

echo "🚗 Starting MCP Shrimp Task Manager for CarManager..."

# Check if CarManager ShrimpData directory exists
CARMANAGER_DATA_DIR="$HOME/code/github/CarManager/ShrimpData"
if [ ! -d "$CARMANAGER_DATA_DIR" ]; then
    echo "❌ CarManager ShrimpData directory not found at: $CARMANAGER_DATA_DIR"
    echo "   Please ensure the directory exists before running this script."
    exit 1
fi

echo "📁 Using data directory: $CARMANAGER_DATA_DIR"
echo "🌐 Web GUI will be available at: http://localhost:3001"

# Build and run the container
echo "📦 Building Docker image..."
docker build -t mcp-shrimp-task-manager .

echo "🚀 Starting CarManager instance..."
docker run -it --rm \
  -p 3001:3000 \
  -e ENABLE_GUI=true \
  -e WEB_PORT=3000 \
  -e DATA_DIR=/app/ShrimpData \
  -v "$CARMANAGER_DATA_DIR:/app/ShrimpData" \
  --name mcp-shrimp-carmanager \
  mcp-shrimp-task-manager

echo "✅ CarManager MCP instance stopped. Web GUI was available at http://localhost:3001"
