/**
 * splitTasks prompt generator
 * Combines templates and parameters into the final prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task } from "../../types/index.js";

/**
 * Parameters for splitTasks prompt
 */
export interface SplitTasksPromptParams {
  updateMode: string;
  createdTasks: Task[];
  allTasks: Task[];
}

/**
 * Build the splitTasks prompt
 */
export async function getSplitTasksPrompt(
  params: SplitTasksPromptParams
): Promise<string> {
  const taskDetailsTemplate = await loadPromptFromTemplate(
    "splitTasks/taskDetails.md"
  );

  const tasksContent = params.createdTasks
    .map((task, index) => {
      let implementationGuide = "no implementation guide";
      if (task.implementationGuide) {
        implementationGuide =
          task.implementationGuide.length > 100
            ? task.implementationGuide.substring(0, 100) + "..."
            : task.implementationGuide;
      }

      let verificationCriteria = "no verification criteria";
      if (task.verificationCriteria) {
        verificationCriteria =
          task.verificationCriteria.length > 100
            ? task.verificationCriteria.substring(0, 100) + "..."
            : task.verificationCriteria;
      }

      const dependencies = task.dependencies
        ? task.dependencies
            .map((d: any) => {
             // Resolve dependency task name for friendlier display
              const depTask = params.allTasks.find((t) => t.id === d.taskId);
              return depTask
                ? `"${depTask.name}" (\`${d.taskId}\`)`
                : `\`${d.taskId}\``;
            })
            .join(", ")
        : "no dependencies";

      return generatePrompt(taskDetailsTemplate, {
        index: index + 1,
        name: task.name,
        id: task.id,
        description: task.description,
        notes: task.notes || "no notes",
        implementationGuide: implementationGuide,
        verificationCriteria: verificationCriteria,
        dependencies: dependencies,
      });
    })
    .join("\n");

  const indexTemplate = await loadPromptFromTemplate("splitTasks/index.md");
  const prompt = generatePrompt(indexTemplate, {
    updateMode: params.updateMode,
    tasksContent,
  });

  // Load possible custom prompt override/append
  return loadPrompt(prompt, "SPLIT_TASKS");
}
