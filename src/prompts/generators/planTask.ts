/**
 * planTask prompt generator
 * Combines templates and parameters into the final prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task, TaskDependency } from "../../types/index.js";

/**
 * Parameters for planTask prompt
 */
export interface PlanTaskPromptParams {
  description: string;
  requirements?: string;
  existingTasksReference?: boolean;
  completedTasks?: Task[];
  pendingTasks?: Task[];
  memoryDir: string;
}

/**
 * Build the planTask prompt
 */
export async function getPlanTaskPrompt(
  params: PlanTaskPromptParams
): Promise<string> {
  let tasksContent = "";
  if (
    params.existingTasksReference &&
    params.completedTasks &&
    params.pendingTasks
  ) {
    const allTasks = [...params.completedTasks, ...params.pendingTasks];
    // If tasks exist, add related details
    if (allTasks.length > 0) {
      let completeTasksContent = "no completed tasks";

      // Completed tasks
      if (params.completedTasks.length > 0) {
        completeTasksContent = "";
        // Show at most 10 completed tasks to avoid long prompts
        const tasksToShow =
          params.completedTasks.length > 10
            ? params.completedTasks.slice(0, 10)
            : params.completedTasks;

        tasksToShow.forEach((task, index) => {
          // Completion timestamp (if available)
          const completedTimeText = task.completedAt
            ? `   - completedAt: ${task.completedAt.toLocaleString()}\n`
            : "";

          completeTasksContent += `{index}. **${task.name}** (ID: \`${
            task.id
          }\`)\n   - description: ${
            task.description.length > 100
              ? task.description.substring(0, 100) + "..."
              : task.description
          }\n${completedTimeText}`;
          // Line breaks between items
          if (index < tasksToShow.length - 1) {
            completeTasksContent += "\n\n";
          }
        });

        // Indicate there are more tasks if truncated
        if (params.completedTasks.length > 10) {
          completeTasksContent += `\n\n*(showing first 10 of ${params.completedTasks.length})*\n`;
        }
      }

      let unfinishedTasksContent = "no pending tasks";
      // Pending tasks
      if (params.pendingTasks && params.pendingTasks.length > 0) {
        unfinishedTasksContent = "";

        params.pendingTasks.forEach((task, index) => {
          const dependenciesText =
            task.dependencies && task.dependencies.length > 0
              ? `   - dependencies: ${task.dependencies
                  .map((dep: TaskDependency) => `\`${dep.taskId}\``)
                  .join(", ")}\n`
              : "";

          unfinishedTasksContent += `${index + 1}. **${task.name}** (ID: \`${
            task.id
          }\`)\n   - description: ${
            task.description.length > 150
              ? task.description.substring(0, 150) + "..."
              : task.description
          }\n   - status: ${task.status}\n${dependenciesText}`;

          // Line breaks between items
          if (index < (params.pendingTasks?.length ?? 0) - 1) {
            unfinishedTasksContent += "\n\n";
          }
        });
      }

      const tasksTemplate = await loadPromptFromTemplate("planTask/tasks.md");
      tasksContent = generatePrompt(tasksTemplate, {
        completedTasks: completeTasksContent,
        unfinishedTasks: unfinishedTasksContent,
      });
    }
  }

  let thoughtTemplate = "";
  if (process.env.ENABLE_THOUGHT_CHAIN !== "false") {
    thoughtTemplate = await loadPromptFromTemplate("planTask/hasThought.md");
  } else {
    thoughtTemplate = await loadPromptFromTemplate("planTask/noThought.md");
  }
  const indexTemplate = await loadPromptFromTemplate("planTask/index.md");
  let prompt = generatePrompt(indexTemplate, {
    description: params.description,
    requirements: params.requirements || "No requirements",
    tasksTemplate: tasksContent,
    rulesPath: "shrimp-rules.md",
    memoryDir: params.memoryDir,
    thoughtTemplate: thoughtTemplate,
  });

  // Load possible custom prompt override/append
  return loadPrompt(prompt, "PLAN_TASK");
}
