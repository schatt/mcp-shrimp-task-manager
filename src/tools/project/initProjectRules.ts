import { z } from "zod";
import { getInitProjectRulesPrompt } from "../../prompts/index.js";

// Define schema
export const initProjectRulesSchema = z.object({});

/**
 * Initialize project rules tool function
 * Provides guidance to create a project rules document
 */
export async function initProjectRules() {
  try {
    // Get prompt from generator
    const promptContent = await getInitProjectRulesPrompt();

    // Return success response
    return {
      content: [
        {
          type: "text" as const,
          text: promptContent,
        },
      ],
    };
  } catch (error) {
    // Error handling
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text" as const,
          text: `Error occurred while initializing project rules: ${errorMessage}`,
        },
      ],
    };
  }
}
