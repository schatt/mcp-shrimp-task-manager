/**
 * initProjectRules prompt generator
 * Combines templates and parameters into the final prompt
 */

import { loadPrompt, loadPromptFromTemplate } from "../loader.js";
/**
 * Parameters for initProjectRules prompt
 */
export interface InitProjectRulesPromptParams {
  // No extra params currently; extend as needed in the future
}

/**
 * Build the initProjectRules prompt
 */
export async function getInitProjectRulesPrompt(
  params?: InitProjectRulesPromptParams
): Promise<string> {
  const indexTemplate = await loadPromptFromTemplate(
    "initProjectRules/index.md"
  );

  // Load possible custom prompt override/append via environment variables
  return loadPrompt(indexTemplate, "INIT_PROJECT_RULES");
}
