#!/usr/bin/env node

import { spawn } from 'child_process';

async function testMCPServer() {
  console.log('🧪 Testing MCP Server...');
  
  // Start the MCP server
  const mcpProcess = spawn('docker', [
    'run', '--rm', '-i',
    '-e', 'DOCKER_MCP_MODE=true',
    '-e', 'DATA_DIR=/app/ShrimpData',
    'mcp-shrimp-task-manager:latest'
  ]);

  let responseData = '';

  mcpProcess.stdout.on('data', (data) => {
    responseData += data.toString();
    console.log('📤 Server output:', data.toString());
  });

  mcpProcess.stderr.on('data', (data) => {
    console.log('⚠️  Server stderr:', data.toString());
  });

  // Wait a moment for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send initialize request
  const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {}, logging: {} },
      clientInfo: { name: "test", version: "1.0.0" }
    }
  };

  console.log('📤 Sending initialize request...');
  mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send tools/list request
  const listRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };

  console.log('📤 Sending tools/list request...');
  mcpProcess.stdin.write(JSON.stringify(listRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Send initialized notification
  const initializedNotification = {
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {}
  };

  console.log('📤 Sending initialized notification...');
  mcpProcess.stdin.write(JSON.stringify(initializedNotification) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test a specific tool
  const testRequest = {
    jsonrpc: "2.0",
    id: 3,
    method: "list_tasks",
    params: {}
  };

  console.log('📤 Testing list_tasks tool...');
  mcpProcess.stdin.write(JSON.stringify(testRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✅ Test completed');
  mcpProcess.kill();
}

testMCPServer().catch(console.error);
