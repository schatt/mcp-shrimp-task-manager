/**
 * queryTask prompt generator
 * Combines templates and parameters into the final prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task } from "../../types/index.js";

/**
 * Parameters for queryTask prompt
 */
export interface QueryTaskPromptParams {
  query: string;
  isId: boolean;
  tasks: Task[];
  totalTasks: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Build the queryTask prompt
 */
export async function getQueryTaskPrompt(
  params: QueryTaskPromptParams
): Promise<string> {
  const { query, isId, tasks, totalTasks, page, pageSize, totalPages } = params;

  if (tasks.length === 0) {
    const notFoundTemplate = await loadPromptFromTemplate(
      "queryTask/notFound.md"
    );
    return generatePrompt(notFoundTemplate, {
      query,
    });
  }

  const taskDetailsTemplate = await loadPromptFromTemplate(
    "queryTask/taskDetails.md"
  );
  let tasksContent = "";
  for (const task of tasks) {
    tasksContent += generatePrompt(taskDetailsTemplate, {
      taskId: task.id,
      taskName: task.name,
      taskStatus: task.status,
      taskDescription:
        task.description.length > 100
          ? `${task.description.substring(0, 100)}...`
          : task.description,
      createdAt: new Date(task.createdAt).toLocaleString(),
    });
  }

  const indexTemplate = await loadPromptFromTemplate("queryTask/index.md");
  const prompt = generatePrompt(indexTemplate, {
    tasksContent,
    page,
    totalPages,
    pageSize,
    totalTasks,
    query,
  });

  // Load possible custom prompt override/append
  return loadPrompt(prompt, "QUERY_TASK");
}
