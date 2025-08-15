import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import { getResearchModePrompt } from "../../prompts/index.js";
import { getMemoryDir } from "../../utils/paths.js";

// Research mode tool
export const researchModeSchema = z.object({
  topic: z
    .string()
    .min(5, {
      message: "Topic cannot be shorter than 5 characters. Provide a clear topic.",
    })
    .describe("Programming topic to research; should be clear and specific"),
  previousState: z
    .string()
    .optional()
    .default("")
    .describe(
      "Previous research state and summary; empty on first run and later contains key findings to support continued research"
    ),
  currentState: z
    .string()
    .describe(
      "What the Agent should do now (e.g., web searches or code analysis). After research, call research_mode again to record state and integrate with previousState."
    ),
  nextSteps: z
    .string()
    .describe(
      "Planned follow-up, steps, or direction to keep research on track. Update this if the direction changes."
    ),
});

export async function researchMode({
  topic,
  previousState = "",
  currentState,
  nextSteps,
}: z.infer<typeof researchModeSchema>) {
  // Resolve base directories
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const PROJECT_ROOT = path.resolve(__dirname, "../../..");
  const MEMORY_DIR = await getMemoryDir();

  // Check for potential research loops
  const loopWarning = previousState && previousState.includes(currentState) 
    ? "\n\n⚠️ **LOOP DETECTION WARNING**: Your current state appears similar to previous states. Consider providing more specific progress or moving to the next research phase."
    : "";

  // Build final prompt via generator
  const prompt = await getResearchModePrompt({
    topic,
    previousState,
    currentState,
    nextSteps,
    memoryDir: MEMORY_DIR,
  });

  // Add loop warning if detected
  const finalPrompt = loopWarning ? prompt + loopWarning : prompt;

  return {
    content: [
      {
        type: "text" as const,
        text: finalPrompt,
      },
    ],
  };
}
