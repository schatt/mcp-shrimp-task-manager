import { z } from "zod";
import {
  getProcessThoughtPrompt,
  ProcessThoughtPromptParams,
} from "../../prompts/generators/processThought.js";

/**
 * Schema for processThought tool parameters
 */
export const processThoughtSchema = z.object({
  thought: z
    .string()
    .min(1, {
      message: "Thought content cannot be empty. Provide valid content.",
    })
    .describe("Thought content"),
  thought_number: z
    .number()
    .int()
    .positive({
      message: "Thought number must be a positive integer",
    })
    .describe("Current thought number"),
  total_thoughts: z
    .number()
    .int()
    .positive({
      message: "Total thoughts must be a positive integer",
    })
    .describe("Planned total number of thoughts; can be adjusted as needed"),
  next_thought_needed: z.boolean().describe("Whether another thought is needed"),
  stage: z
    .string()
    .min(1, {
      message: "Stage cannot be empty. Provide a valid thinking stage.",
    })
    .describe(
      "Thinking stage. Available stages include: Problem Definition, Information Gathering, Research, Analysis, Synthesis, Conclusion, Critical Questioning, and Planning."
    ),
  tags: z.array(z.string()).optional().describe("Thought tags (array of strings)"),
  axioms_used: z
    .array(z.string())
    .optional()
    .describe("Axioms used (array of strings)"),
  assumptions_challenged: z
    .array(z.string())
    .optional()
    .describe("Assumptions challenged (array of strings)"),
});

/**
 * Process a single thought and return formatted output
 */
export async function processThought(
  params: z.infer<typeof processThoughtSchema>
) {
  try {
    // Convert params to canonical ThoughtData format
    const thoughtData: ProcessThoughtPromptParams = {
      thought: params.thought,
      thoughtNumber: params.thought_number,
      totalThoughts: params.total_thoughts,
      nextThoughtNeeded: params.next_thought_needed,
      stage: params.stage,
      tags: params.tags || [],
      axioms_used: params.axioms_used || [],
      assumptions_challenged: params.assumptions_challenged || [],
    };

    // Ensure thought number does not exceed total thoughts
    if (thoughtData.thoughtNumber > thoughtData.totalThoughts) {
      // Auto-adjust total thoughts
      thoughtData.totalThoughts = thoughtData.thoughtNumber;
    }

    // Format output
    const formattedThought = await getProcessThoughtPrompt(thoughtData);

    // Return success response
    return {
      content: [
        {
          type: "text" as const,
          text: formattedThought,
        },
      ],
    };
  } catch (error) {
    // Capture and handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text" as const,
          text: `Error occurred while processing thought: ${errorMessage}`,
        },
      ],
    };
  }
}
