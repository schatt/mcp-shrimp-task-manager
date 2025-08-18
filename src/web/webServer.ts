import express, { Request, Response } from "express";
import getPort from "get-port";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { fileURLToPath } from "url";
import crypto from "crypto";
import {
  getDataDir,
  getTasksFilePath,
  getWebGuiFilePath,
  getProjectTasksFilePathPath,
} from "../utils/paths.js";
import { createServer } from "http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import * as MCP from "@modelcontextprotocol/sdk/server/index.js";
import {
  listProjects,
  createProject,
} from "../models/projectModel.js";
import { getAllTasks, updateTask } from "../models/taskModel.js";

export async function createWebServer(mcpServer?: MCP.Server) {
  const app = express();
  
  // Fix __dirname for ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Add comprehensive logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    console.log(`📥 ${req.method} ${req.path} - ${req.get('User-Agent') || 'Unknown'}`);
    console.log(`   Headers:`, req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`   Body:`, JSON.stringify(req.body, null, 2));
    }
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`📤 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // Parse JSON bodies
  app.use(express.json());

  // Serve static files
  app.use(express.static(path.join(__dirname, '../public')));

  // API endpoints
  app.get('/api/tasks', async (req, res) => {
    try {
      const project = req.query.project as string;
      const tasks = await getAllTasks(project);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.post('/api/tasks/update', async (req, res) => {
    try {
      const { id, updates } = req.body;
      const project = req.query.project as string;
      const result = await updateTask(id, updates, project);
      if (result) {
        res.json({ success: true, task: result });
      } else {
        res.status(404).json({ error: 'Task not found' });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await listProjects();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.post('/api/projects/create', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Project name is required' });
      }
      
      const result = await createProject(name);
      res.json(result);
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  // MCP HTTP transport integration
  if (process.env.ENABLE_HTTP_MCP === 'true' && mcpServer) {
    console.log("🔌 Setting up MCP HTTP transport...");
    
    // Create transport with proper session management
    const mcpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      enableJsonResponse: true, // Enable JSON responses for easier debugging
      onsessioninitialized: (sessionId) => {
        console.log("🔌 MCP session initialized:", sessionId);
      },
      onsessionclosed: (sessionId) => {
        console.log("🔌 MCP session closed:", sessionId);
      }
    });

    // Connect transport to MCP server
    await mcpServer.connect(mcpTransport);
    console.log("🔌 MCP HTTP transport connected to server");

    // MCP endpoints
    app.post("/mcp", async (req, res) => {
      console.log("🔌 MCP POST request received:", {
        method: req.method,
        path: req.path,
        headers: req.headers,
        body: req.body
      });
      try {
        await mcpTransport.handleRequest(req, res, req.body);
        console.log("🔌 MCP POST request handled successfully");
      } catch (error) {
        console.error("❌ MCP POST request failed:", error);
        res.status(500).json({ error: "MCP request failed", details: error instanceof Error ? error.message : String(error) });
      }
    });

    app.get("/mcp/stream", async (req, res) => {
      console.log("🔌 MCP GET stream request received:", {
        method: req.method,
        path: req.path,
        headers: req.headers
      });
      try {
        await mcpTransport.handleRequest(req, res);
        console.log("🔌 MCP GET stream request handled successfully");
      } catch (error) {
        console.error("❌ MCP GET stream request failed:", error);
        res.status(500).json({ error: "MCP stream request failed", details: error instanceof Error ? error.message : String(error) });
      }
    });
  }

  return {
    startServer: () => {
      const port = process.env.WEB_PORT || 3000;
      app.listen(port, () => {
        console.log(`🌐 Web GUI started successfully on port ${port}`);
        if (process.env.ENABLE_HTTP_MCP === 'true') {
          console.log(`🔌 MCP HTTP transport available at http://localhost:${port}/mcp`);
        }
      });
    }
  };
}
