/**
 * listTasks prompt generator
 * Combines templates and parameters into the final prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task, TaskStatus } from "../../types/index.js";

/**
 * Parameters for listTasks prompt
 */
export interface ListTasksPromptParams {
  status: string;
  tasks: Record<string, Task[]>;
  allTasks: Task[];
}

/**
 * Build the listTasks prompt
 */
export async function getListTasksPrompt(
  params: ListTasksPromptParams
): Promise<string> {
  const { status, tasks, allTasks } = params;

  // No tasks - show notice
  if (allTasks.length === 0) {
    const notFoundTemplate = await loadPromptFromTemplate(
      "listTasks/notFound.md"
    );
    const statusText = status === "all" ? "any" : `${status}`;
    return generatePrompt(notFoundTemplate, {
      statusText: statusText,
    });
  }

  // Count tasks per status
  const statusCounts = Object.values(TaskStatus)
    .map((statusType) => {
      const count = tasks[statusType]?.length || 0;
      return `- **${statusType}**: ${count} tasks`;
    })
    .join("\n");

  let filterStatus = "all";
  switch (status) {
    case "pending":
      filterStatus = TaskStatus.PENDING;
      break;
    case "in_progress":
      filterStatus = TaskStatus.IN_PROGRESS;
      break;
    case "completed":
      filterStatus = TaskStatus.COMPLETED;
      break;
  }

  let taskDetails = "";
  let taskDetailsTemplate = await loadPromptFromTemplate(
    "listTasks/taskDetails.md"
  );
  // Append detailed tasks grouped by status
  for (const statusType of Object.values(TaskStatus)) {
    const tasksWithStatus = tasks[statusType] || [];
    if (
      tasksWithStatus.length > 0 &&
      (filterStatus === "all" || filterStatus === statusType)
    ) {
      for (const task of tasksWithStatus) {
        let dependencies = "no dependencies";
        if (task.dependencies && task.dependencies.length > 0) {
          dependencies = task.dependencies
            .map((d) => `\`${d.taskId}\``)
            .join(", ");
        }
        taskDetails += generatePrompt(taskDetailsTemplate, {
          name: task.name,
          id: task.id,
          description: task.description,
          createAt: task.createdAt,
          complatedSummary:
            (task.summary || "").substring(0, 100) +
            ((task.summary || "").length > 100 ? "..." : ""),
          dependencies: dependencies,
          complatedAt: task.completedAt,
        });
      }
    }
  }

  const indexTemplate = await loadPromptFromTemplate("listTasks/index.md");
  let prompt = generatePrompt(indexTemplate, {
    statusCount: statusCounts,
    taskDetailsTemplate: taskDetails,
  });

  // Load possible custom prompt override/append
  return loadPrompt(prompt, "LIST_TASKS");
}
