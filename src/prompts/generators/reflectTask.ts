/**
 * reflectTask prompt generator
 * Combines templates and parameters into the final prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";

/**
 * Parameters for reflectTask prompt
 */
export interface ReflectTaskPromptParams {
  summary: string;
  analysis: string;
}

/**
 * Build the reflectTask prompt
 */
export async function getReflectTaskPrompt(
  params: ReflectTaskPromptParams
): Promise<string> {
  const indexTemplate = await loadPromptFromTemplate("reflectTask/index.md");
  const prompt = generatePrompt(indexTemplate, {
    summary: params.summary,
    analysis: params.analysis,
  });

  // Load possible custom prompt override/append
  return loadPrompt(prompt, "REFLECT_TASK");
}
