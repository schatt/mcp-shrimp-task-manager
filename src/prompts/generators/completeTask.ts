/**
 * completeTask prompt generator
 * Combines templates and parameters into the final prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task } from "../../types/index.js";

/**
 * Parameters for completeTask prompt
 */
export interface CompleteTaskPromptParams {
  task: Task;
  completionTime: string;
}

/**
 * Build the completeTask prompt
 */
export async function getCompleteTaskPrompt(
  params: CompleteTaskPromptParams
): Promise<string> {
  const { task, completionTime } = params;

  const indexTemplate = await loadPromptFromTemplate("completeTask/index.md");

  // Build base prompt
  let prompt = generatePrompt(indexTemplate, {
    name: task.name,
    id: task.id,
    completionTime: completionTime,
  });

  // Load possible custom prompt override/append
  return loadPrompt(prompt, "COMPLETE_TASK");
}
