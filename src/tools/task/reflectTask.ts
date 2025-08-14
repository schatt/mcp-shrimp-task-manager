import { z } from "zod";
import { getReflectTaskPrompt } from "../../prompts/index.js";

// Reflect on solution tool
export const reflectTaskSchema = z.object({
  summary: z
    .string()
    .min(10, {
      message: "Summary cannot be shorter than 10 characters. Provide more detail.",
    })
    .describe("Structured task summary; keep consistent with the analysis phase"),
  analysis: z
    .string()
    .min(100, {
      message: "Technical analysis is insufficient; provide complete analysis and implementation plan.",
    })
    .describe(
      "Comprehensive technical analysis including all details, dependencies, and implementation plan. If code is needed, use pseudocode with only high-level logic and key steps."
    ),
});

export async function reflectTask({
  summary,
  analysis,
}: z.infer<typeof reflectTaskSchema>) {
  // Build final prompt via generator
  const prompt = await getReflectTaskPrompt({
    summary,
    analysis,
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
