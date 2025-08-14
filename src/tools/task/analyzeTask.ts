import { z } from "zod";
import { getAnalyzeTaskPrompt } from "../../prompts/index.js";

// Analyze task tool
export const analyzeTaskSchema = z.object({
  summary: z
    .string()
    .min(10, {
      message: "Summary cannot be shorter than 10 characters. Provide more detail.",
    })
    .describe(
      "Structured task summary including goals, scope, and key technical challenges (min 10 chars)"
    ),
  initialConcept: z
    .string()
    .min(50, {
      message:
        "Initial concept must be at least 50 characters. Provide sufficient technical detail.",
    })
    .describe(
      "Initial solution concept (>=50 chars): include technical approach, architecture, and strategy. If code is needed, use pseudocode and include only high-level logic and key steps."
    ),
  previousAnalysis: z
    .string()
    .optional()
    .describe("Previous iteration analysis, for iterative improvement (optional)"),
});

export async function analyzeTask({
  summary,
  initialConcept,
  previousAnalysis,
}: z.infer<typeof analyzeTaskSchema>) {
  // Build final prompt via generator
  const prompt = await getAnalyzeTaskPrompt({
    summary,
    initialConcept,
    previousAnalysis,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}
