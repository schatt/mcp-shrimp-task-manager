import { z } from "zod";

// Import existing schemas
import { planTaskSchema } from "./tools/task/planTask.js";
import { analyzeTaskSchema } from "./tools/task/analyzeTask.js";
import { reflectTaskSchema } from "./tools/task/reflectTask.js";
import { splitTasksSchema } from "./tools/task/splitTasks.js";
import { listTasksSchema } from "./tools/task/listTasks.js";
import { executeTaskSchema } from "./tools/task/executeTask.js";
import { verifyTaskSchema } from "./tools/task/verifyTask.js";
import { deleteTaskSchema } from "./tools/task/deleteTask.js";
import { clearAllTasksSchema } from "./tools/task/clearAllTasks.js";
import { restoreArchivedTasksSchema } from "./tools/task/restoreArchivedTasks.js";
import { updateTaskContentSchema } from "./tools/task/updateTask.js";
import { queryTaskSchema } from "./tools/task/queryTask.js";
import { getTaskDetailSchema } from "./tools/task/getTaskDetail.js";
import { processThoughtSchema } from "./tools/thought/processThought.js";
import { researchModeSchema } from "./tools/research/researchMode.js";
import { createProjectSchema } from "./tools/project/createProject.js";
import { listProjectsSchema } from "./tools/project/listProjects.js";
import { switchProjectSchema } from "./tools/project/switchProject.js";
import { deleteProjectSchema } from "./tools/project/deleteProject.js";
import { projectInfoSchema } from "./tools/project/projectInfo.js";
import { initProjectRulesSchema } from "./tools/project/initProjectRules.js";

// MCP-compliant schemas that include the required 'method' field
export const mcpPlanTaskSchema = z.object({
  method: z.literal("plan_task"),
  params: planTaskSchema
});

export const mcpAnalyzeTaskSchema = z.object({
  method: z.literal("analyze_task"),
  params: analyzeTaskSchema
});

export const mcpReflectTaskSchema = z.object({
  method: z.literal("reflect_task"),
  params: reflectTaskSchema
});

export const mcpSplitTasksSchema = z.object({
  method: z.literal("split_tasks"),
  params: splitTasksSchema
});

export const mcpListTasksSchema = z.object({
  method: z.literal("list_tasks"),
  params: listTasksSchema
});

export const mcpExecuteTaskSchema = z.object({
  method: z.literal("execute_task"),
  params: executeTaskSchema
});

export const mcpVerifyTaskSchema = z.object({
  method: z.literal("verify_task"),
  params: verifyTaskSchema
});

export const mcpDeleteTaskSchema = z.object({
  method: z.literal("delete_task"),
  params: deleteTaskSchema
});

export const mcpClearAllTasksSchema = z.object({
  method: z.literal("clear_all_tasks"),
  params: clearAllTasksSchema
});

export const mcpRestoreArchivedTasksSchema = z.object({
  method: z.literal("restore_archived_tasks"),
  params: restoreArchivedTasksSchema
});

export const mcpUpdateTaskContentSchema = z.object({
  method: z.literal("update_task_content"),
  params: updateTaskContentSchema
});

export const mcpQueryTaskSchema = z.object({
  method: z.literal("query_task"),
  params: queryTaskSchema
});

export const mcpGetTaskDetailSchema = z.object({
  method: z.literal("get_task_detail"),
  params: getTaskDetailSchema
});

export const mcpProcessThoughtSchema = z.object({
  method: z.literal("process_thought"),
  params: processThoughtSchema
});

export const mcpResearchModeSchema = z.object({
  method: z.literal("research_mode"),
  params: researchModeSchema
});

export const mcpCreateProjectSchema = z.object({
  method: z.literal("create_project"),
  params: createProjectSchema
});

export const mcpListProjectsSchema = z.object({
  method: z.literal("list_projects"),
  params: listProjectsSchema
});

export const mcpSwitchProjectSchema = z.object({
  method: z.literal("switch_project"),
  params: switchProjectSchema
});

export const mcpDeleteProjectSchema = z.object({
  method: z.literal("delete_project"),
  params: deleteProjectSchema
});

export const mcpProjectInfoSchema = z.object({
  method: z.literal("project_info"),
  params: projectInfoSchema
});

export const mcpInitProjectRulesSchema = z.object({
  method: z.literal("init_project_rules"),
  params: z.object({}) // initProjectRules takes no parameters
});

// MCP standard method schemas
export const mcpToolsListSchema = z.object({
  method: z.literal("tools/list"),
  params: z.object({})
});

export const mcpToolsCallSchema = z.object({
  method: z.literal("tools/call"),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.any())
  })
});
