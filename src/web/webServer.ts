import express, { Request, Response } from "express";
import getPort from "get-port";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { fileURLToPath } from "url";
import {
  getDataDir,
  getTasksFilePath,
  getWebGuiFilePath,
} from "../utils/paths.js";

export async function createWebServer() {
  // Create Express app
  const app = express();

  // Store list of SSE clients
  let sseClients: Response[] = [];

  // Helper to send SSE events
  function sendSseUpdate() {
    sseClients.forEach((client) => {
      // Ensure client is still connected
      if (!client.writableEnded) {
        client.write(
          `event: update\ndata: ${JSON.stringify({
            timestamp: Date.now(),
          })}\n\n`
        );
      }
    });
    // Clean disconnected clients
    sseClients = sseClients.filter((client) => !client.writableEnded);
  }

  // Static files directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const publicPath = path.join(__dirname, "..", "..", "src", "public");
  const TASKS_FILE_PATH = await getTasksFilePath(); // Resolve via helper

  app.use(express.static(publicPath));

  // API routes
  app.get("/api/tasks", async (req: Request, res: Response) => {
    try {
      // Read asynchronously
      const tasksData = await fsPromises.readFile(TASKS_FILE_PATH, "utf-8");
      res.json(JSON.parse(tasksData));
    } catch (error) {
      // Return empty list when file is missing
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        res.json({ tasks: [] });
      } else {
        res.status(500).json({ error: "Failed to read tasks data" });
      }
    }
  });

  // Task update endpoint
  app.post("/api/tasks/update", express.json(), async (req: Request, res: Response) => {
    try {
      const { taskId, priority, name, description, notes, dependencies, relatedFiles, implementationGuide, verificationCriteria } = req.body;
      
      if (!taskId) {
        res.status(400).json({ error: "Task ID is required" });
        return;
      }

      // Read current tasks
      const tasksData = await fsPromises.readFile(TASKS_FILE_PATH, "utf-8");
      const { tasks } = JSON.parse(tasksData);
      
      // Find the task to update
      const taskIndex = tasks.findIndex((task: any) => task.id === taskId);
      if (taskIndex === -1) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      // Build update object with only provided fields
      const updates: any = {};
      if (priority !== undefined) updates.priority = priority;
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (notes !== undefined) updates.notes = notes;
      if (dependencies !== undefined) updates.dependencies = dependencies;
      if (relatedFiles !== undefined) updates.relatedFiles = relatedFiles;
      if (implementationGuide !== undefined) updates.implementationGuide = implementationGuide;
      if (verificationCriteria !== undefined) updates.verificationCriteria = verificationCriteria;

      // Update the task
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Write updated tasks back to file
      await fsPromises.writeFile(TASKS_FILE_PATH, JSON.stringify({ tasks }, null, 2));

      // Notify SSE clients of the update
      sendSseUpdate();

      res.json({ success: true, message: "Task updated successfully", task: tasks[taskIndex] });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // SSE endpoint
  app.get("/api/tasks/stream", (req: Request, res: Response) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      // Optional: CORS header if frontend and backend are on different origins
      // "Access-Control-Allow-Origin": "*",
    });

    // Send an initial event/keep-alive
    res.write("data: connected\n\n");

    // Track client
    sseClients.push(res);

    // Remove client on disconnect
    req.on("close", () => {
      sseClients = sseClients.filter((client) => client !== res);
    });
  });

  // Helper to write WebGUI file
  async function writeWebGuiFile(port: number | string) {
    try {
      // Read TEMPLATES_USE and convert to language code
      const templatesUse = process.env.TEMPLATES_USE || "en";
      const getLanguageFromTemplate = (template: string): string => {
        if (template === "zh") return "zh-TW";
        if (template === "en") return "en";
        // Default to English for custom templates
        return "en";
      };
      const language = getLanguageFromTemplate(templatesUse);

      const websiteUrl = `[Task Manager UI](http://localhost:${port}?lang=${language})`;
      const websiteFilePath = await getWebGuiFilePath();
      const DATA_DIR = await getDataDir();
      try {
        await fsPromises.access(DATA_DIR);
      } catch (error) {
        await fsPromises.mkdir(DATA_DIR, { recursive: true });
      }
      await fsPromises.writeFile(websiteFilePath, websiteUrl, "utf-8");
    } catch (error) {
      // Silently handle error - console not supported in MCP
    }
  }

  return {
    app,
    sendSseUpdate,
    async startServer() {
      // Get available port
      const port = process.env.WEB_PORT || (await getPort());

      // Start HTTP server
      const httpServer = app.listen(port, () => {
        // Watch file changes after server starts
        try {
          // Check file existence before watching to avoid errors
          if (fs.existsSync(TASKS_FILE_PATH)) {
            fs.watch(TASKS_FILE_PATH, (eventType, filename) => {
              if (
                filename &&
                (eventType === "change" || eventType === "rename")
              ) {
                // Slight delay/debounce if needed
                sendSseUpdate();
              }
            });
          }
        } catch (watchError) {}

        // Write URL into WebGUI.md
        writeWebGuiFile(port).catch((error) => {});
      });

      // Handle process termination (close watchers)
      const shutdownHandler = async () => {
        // Close all SSE connections
        sseClients.forEach((client) => client.end());
        sseClients = [];

        // Close HTTP server
        await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      };

      process.on("SIGINT", shutdownHandler);
      process.on("SIGTERM", shutdownHandler);

      return httpServer;
    },
  };
}
