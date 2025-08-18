import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWebServer } from "./web/webServer.js";

// Import all tools
import { planTask } from "./tools/task/planTask.js";
import { analyzeTask } from "./tools/task/analyzeTask.js";
import { reflectTask } from "./tools/task/reflectTask.js";
import { splitTasks } from "./tools/task/splitTasks.js";
import { listTasks } from "./tools/task/listTasks.js";
import { executeTask } from "./tools/task/executeTask.js";
import { verifyTask } from "./tools/task/verifyTask.js";
import { deleteTask } from "./tools/task/deleteTask.js";
import { clearAllTasks } from "./tools/task/clearAllTasks.js";
import { restoreArchivedTasks } from "./tools/task/restoreArchivedTasks.js";
import { updateTaskContent } from "./tools/task/updateTask.js";
import { queryTask } from "./tools/task/queryTask.js";
import { getTaskDetail } from "./tools/task/getTaskDetail.js";
import { processThought } from "./tools/thought/processThought.js";
import { researchMode } from "./tools/research/researchMode.js";

// Import project tools
import { createProject } from "./tools/project/createProject.js";
import { listProjects } from "./tools/project/listProjects.js";
import { switchProject } from "./tools/project/switchProject.js";
import { deleteProject } from "./tools/project/deleteProject.js";
import { projectInfo } from "./tools/project/projectInfo.js";
import { initProjectRules } from "./tools/project/initProjectRules.js";

// Import MCP-compliant schemas
import {
  mcpPlanTaskSchema,
  mcpAnalyzeTaskSchema,
  mcpReflectTaskSchema,
  mcpSplitTasksSchema,
  mcpListTasksSchema,
  mcpExecuteTaskSchema,
  mcpVerifyTaskSchema,
  mcpDeleteTaskSchema,
  mcpClearAllTasksSchema,
  mcpRestoreArchivedTasksSchema,
  mcpUpdateTaskContentSchema,
  mcpQueryTaskSchema,
  mcpGetTaskDetailSchema,
  mcpProcessThoughtSchema,
  mcpResearchModeSchema,
  mcpCreateProjectSchema,
  mcpListProjectsSchema,
  mcpSwitchProjectSchema,
  mcpDeleteProjectSchema,
  mcpProjectInfoSchema,
  mcpInitProjectRulesSchema,
  mcpToolsListSchema,
  mcpToolsCallSchema
} from "./mcpSchemas.js";

async function main() {
  try {
    const ENABLE_GUI = process.env.ENABLE_GUI === "true";
    let webServerInstance: Awaited<ReturnType<typeof createWebServer>> | null = null;

    // Creating an MCP Server
    const server = new Server(
      {
        name: "Shrimp Task Manager",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          logging: {},
        },
      }
    );

    // Register all tools using MCP-compliant schemas
    server.setRequestHandler(mcpPlanTaskSchema, async (request) => {
      return await planTask(request.params);
    });

    server.setRequestHandler(mcpAnalyzeTaskSchema, async (request) => {
      return await analyzeTask(request.params);
    });

    server.setRequestHandler(mcpReflectTaskSchema, async (request) => {
      return await reflectTask(request.params);
    });

    server.setRequestHandler(mcpSplitTasksSchema, async (request) => {
      return await splitTasks(request.params);
    });

    server.setRequestHandler(mcpListTasksSchema, async (request) => {
      return await listTasks(request.params);
    });

    server.setRequestHandler(mcpExecuteTaskSchema, async (request) => {
      return await executeTask(request.params);
    });

    server.setRequestHandler(mcpVerifyTaskSchema, async (request) => {
      return await verifyTask(request.params);
    });

    server.setRequestHandler(mcpDeleteTaskSchema, async (request) => {
      return await deleteTask(request.params);
    });

    server.setRequestHandler(mcpClearAllTasksSchema, async (request) => {
      return await clearAllTasks(request.params);
    });

    server.setRequestHandler(mcpRestoreArchivedTasksSchema, async (request) => {
      return await restoreArchivedTasks(request.params);
    });

    server.setRequestHandler(mcpUpdateTaskContentSchema, async (request) => {
      return await updateTaskContent(request.params);
    });

    server.setRequestHandler(mcpQueryTaskSchema, async (request) => {
      return await queryTask(request.params);
    });

    server.setRequestHandler(mcpGetTaskDetailSchema, async (request) => {
      return await getTaskDetail(request.params);
    });

    server.setRequestHandler(mcpProcessThoughtSchema, async (request) => {
      return await processThought(request.params);
    });

    server.setRequestHandler(mcpResearchModeSchema, async (request) => {
      return await researchMode(request.params);
    });

    // Project management tools
    server.setRequestHandler(mcpCreateProjectSchema, async (request) => {
      return await createProject(request.params);
    });

    server.setRequestHandler(mcpListProjectsSchema, async (request) => {
      return await listProjects(request.params);
    });

    server.setRequestHandler(mcpSwitchProjectSchema, async (request) => {
      return await switchProject(request.params);
    });

    server.setRequestHandler(mcpDeleteProjectSchema, async (request) => {
      return await deleteProject(request.params);
    });

    server.setRequestHandler(mcpProjectInfoSchema, async (request) => {
      return await projectInfo(request.params);
    });

    server.setRequestHandler(mcpInitProjectRulesSchema, async (request) => {
      return await initProjectRules();
    });

    // Add standard MCP methods that Cursor needs
    server.setRequestHandler(mcpToolsListSchema, async (request) => {
      return {
        tools: [
          {
            name: "plan_task",
            description: "Plan a task based on description and requirements",
            inputSchema: mcpPlanTaskSchema.shape.params
          },
          {
            name: "analyze_task",
            description: "Analyze a task with summary and initial concept",
            inputSchema: mcpAnalyzeTaskSchema.shape.params
          },
          {
            name: "reflect_task",
            description: "Reflect on a completed task",
            inputSchema: mcpReflectTaskSchema.shape.params
          },
          {
            name: "split_tasks",
            description: "Split a large task into smaller subtasks",
            inputSchema: mcpSplitTasksSchema.shape.params
          },
          {
            name: "list_tasks",
            description: "List all tasks with optional status filtering",
            inputSchema: mcpListTasksSchema.shape.params
          },
          {
            name: "execute_task",
            description: "Execute a specific task",
            inputSchema: mcpExecuteTaskSchema.shape.params
          },
          {
            name: "verify_task",
            description: "Verify task completion",
            inputSchema: mcpVerifyTaskSchema.shape.params
          },
          {
            name: "delete_task",
            description: "Delete a specific task",
            inputSchema: mcpDeleteTaskSchema.shape.params
          },
          {
            name: "clear_all_tasks",
            description: "Clear all tasks with optional archiving",
            inputSchema: mcpClearAllTasksSchema.shape.params
          },
          {
            name: "restore_archived_tasks",
            description: "Restore tasks from archived backup",
            inputSchema: mcpRestoreArchivedTasksSchema.shape.params
          },
          {
            name: "update_task_content",
            description: "Update task content and metadata",
            inputSchema: mcpUpdateTaskContentSchema.shape.params
          },
          {
            name: "query_task",
            description: "Query tasks by search term or ID",
            inputSchema: mcpQueryTaskSchema.shape.params
          },
          {
            name: "get_task_detail",
            description: "Get detailed information about a specific task",
            inputSchema: mcpGetTaskDetailSchema.shape.params
          },
          {
            name: "process_thought",
            description: "Process a thought for task planning",
            inputSchema: mcpProcessThoughtSchema.shape.params
          },
          {
            name: "research_mode",
            description: "Enter research mode for a topic",
            inputSchema: mcpResearchModeSchema.shape.params
          },
          {
            name: "create_project",
            description: "Create a new project",
            inputSchema: mcpCreateProjectSchema.shape.params
          },
          {
            name: "list_projects",
            description: "List all available projects",
            inputSchema: mcpListProjectsSchema.shape.params
          },
          {
            name: "switch_project",
            description: "Switch to a different project",
            inputSchema: mcpSwitchProjectSchema.shape.params
          },
          {
            name: "delete_project",
            description: "Delete a project",
            inputSchema: mcpDeleteProjectSchema.shape.params
          },
          {
            name: "project_info",
            description: "Get information about a specific project",
            inputSchema: mcpProjectInfoSchema.shape.params
          },
          {
            name: "init_project_rules",
            description: "Initialize project rules and configuration",
            inputSchema: mcpInitProjectRulesSchema.shape.params
          }
        ]
      };
    });

    // Add tools/call handler for executing tools
    server.setRequestHandler(mcpToolsCallSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // Route to the appropriate tool based on name
      switch (name) {
        case "plan_task":
          return await planTask(args);
        case "analyze_task":
          return await analyzeTask(args);
        case "reflect_task":
          return await reflectTask(args);
        case "split_tasks":
          return await splitTasks(args);
        case "list_tasks":
          return await listTasks(args);
        case "execute_task":
          return await executeTask(args);
        case "verify_task":
          return await verifyTask(args);
        case "delete_task":
          return await deleteTask(args);
        case "clear_all_tasks":
          return await clearAllTasks(args);
        case "restore_archived_tasks":
          return await restoreArchivedTasks(args);
        case "update_task_content":
          return await updateTaskContent(args);
        case "query_task":
          return await queryTask(args);
        case "get_task_detail":
          return await getTaskDetail(args);
        case "process_thought":
          return await processThought(args);
        case "research_mode":
          return await researchMode(args);
        case "create_project":
          return await createProject(args);
        case "list_projects":
          return await listProjects(args);
        case "switch_project":
          return await switchProject(args);
        case "delete_project":
          return await deleteProject(args);
        case "project_info":
          return await projectInfo(args);
        case "init_project_rules":
          return await initProjectRules();
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // Start Web GUI if enabled (disabled in Docker MCP mode)
    if (ENABLE_GUI) {
      try {
        webServerInstance = await createWebServer();
        await webServerInstance.startServer();
        console.log("🌐 Web GUI started successfully");
      } catch (error) {
        console.error("❌ Failed to start web GUI:", error);
      }
    }

    // For Docker MCP Gateway, we need to use stdio transport
    // The gateway will handle the transport for us
    if (process.env.DOCKER_MCP_MODE === 'true') {
      // In Docker MCP mode, we use stdio transport for the gateway
      const stdioTransport = new StdioServerTransport();
      await server.connect(stdioTransport);
      console.log("🔌 Shrimp Task Manager MCP Server ready for Docker MCP Gateway");
      console.log("📋 Available tools: plan_task, analyze_task, create_project, list_tasks, and more...");
    } else {
      // Fallback to stdio transport for local development
      const stdioTransport = new StdioServerTransport();
      await server.connect(stdioTransport);
      console.log("🔌 MCP Server connected via stdio transport");
    }
  } catch (error) {
    console.error("❌ Failed to start MCP server:", error);
    process.exit(1);
  }
}

main().catch(console.error);
