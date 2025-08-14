/**
 * Prompt loader
 * Provides environment-variable-based customization for prompts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDataDir } from "../utils/paths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processEnvString(input: string | undefined): string {
  if (!input) return "";

  return input
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r");
}

/**
 * Load a prompt with optional environment-variable customization
 * @param basePrompt Base prompt content
 * @param promptKey Prompt key used to build env var names
 * @returns Final prompt content
 */
export function loadPrompt(basePrompt: string, promptKey: string): string {
  // Convert to uppercase for env var key
  const envKey = promptKey.toUpperCase();

  // Check for override mode env var
  const overrideEnvVar = `MCP_PROMPT_${envKey}`;
  if (process.env[overrideEnvVar]) {
    // Fully override the original prompt
    return processEnvString(process.env[overrideEnvVar]);
  }

  // Check for append mode env var
  const appendEnvVar = `MCP_PROMPT_${envKey}_APPEND`;
  if (process.env[appendEnvVar]) {
    // Append env content to the base prompt
    return `${basePrompt}\n\n${processEnvString(process.env[appendEnvVar])}`;
  }

  // No customization; return base prompt
  return basePrompt;
}

/**
 * Generate a prompt with dynamic parameters
 * @param promptTemplate Template content
 * @param params Dynamic parameters
 * @returns Prompt with placeholders filled
 */
export function generatePrompt(
  promptTemplate: string,
  params: Record<string, any> = {}
): string {
  // Simple placeholder replacement: {paramName} -> value
  let result = promptTemplate;

  Object.entries(params).forEach(([key, value]) => {
    // Use empty string for undefined/null values
    const replacementValue =
      value !== undefined && value !== null ? String(value) : "";

    // Replace all placeholders
    const placeholder = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(placeholder, replacementValue);
  });

  return result;
}

/**
 * Load prompt from template file
 * @param templatePath Path relative to the template set root (e.g., 'chat/basic.md')
 * @returns Template content
 * @throws Error when the template file cannot be found
 */
export async function loadPromptFromTemplate(
  templatePath: string
): Promise<string> {
  const templateSetName = process.env.TEMPLATES_USE || "en";
  const dataDir = await getDataDir();
  const builtInTemplatesBaseDir = __dirname;

  let finalPath = "";
  const checkedPaths: string[] = []; // 用於更詳細的錯誤報告

  // 1. Check custom path under DATA_DIR
  // path.resolve handles absolute templateSetName as well
  const customFilePath = path.resolve(dataDir, templateSetName, templatePath);
  checkedPaths.push(`Custom: ${customFilePath}`);
  if (fs.existsSync(customFilePath)) {
    finalPath = customFilePath;
  }

  // 2. If not found, check specific built-in template directory
  if (!finalPath) {
    // Built-in sets are named like 'en', 'zh', etc.
    const specificBuiltInFilePath = path.join(
      builtInTemplatesBaseDir,
      `templates_${templateSetName}`,
      templatePath
    );
    checkedPaths.push(`Specific Built-in: ${specificBuiltInFilePath}`);
    if (fs.existsSync(specificBuiltInFilePath)) {
      finalPath = specificBuiltInFilePath;
    }
  }

  // 3. If still not found and not 'en', fall back to English built-ins
  if (!finalPath && templateSetName !== "en") {
    const defaultBuiltInFilePath = path.join(
      builtInTemplatesBaseDir,
      "templates_en",
      templatePath
    );
    checkedPaths.push(`Default Built-in ('en'): ${defaultBuiltInFilePath}`);
    if (fs.existsSync(defaultBuiltInFilePath)) {
      finalPath = defaultBuiltInFilePath;
    }
  }

  // 4. If not found in any path, throw a descriptive error
  if (!finalPath) {
    throw new Error(
      `Template file not found: '${templatePath}' in template set '${templateSetName}'. Checked paths:\n - ${checkedPaths.join(
        "\n - "
      )}`
    );
  }

  // 5. Read the resolved file
  return fs.readFileSync(finalPath, "utf-8");
}
