import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import { getAllTasks } from "../../models/taskModel.js";
import { TaskStatus, Task } from "../../types/index.js";
import { getPlanTaskPrompt } from "../../prompts/index.js";
import { getMemoryDir } from "../../utils/paths.js";

// Plan task tool
export const planTaskSchema = z.object({
  description: z
    .string()
    .min(10, {
      message: "Description cannot be shorter than 10 characters. Provide more detail.",
    })
    .describe("Complete, detailed task description including goals, background, and expected outcomes"),
  requirements: z
    .string()
    .optional()
    .describe("Specific technical requirements, business constraints, or quality standards (optional)"),
  existingTasksReference: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to reference existing tasks as a basis for planning (for adjustments/continuity)"),
});

export async function planTask({
  description,
  requirements,
  existingTasksReference = false,
}: z.infer<typeof planTaskSchema>) {
  // Resolve base directories
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const PROJECT_ROOT = path.resolve(__dirname, "../../..");
  const MEMORY_DIR = await getMemoryDir();

  // Prepare parameters
  let completedTasks: Task[] = [];
  let pendingTasks: Task[] = [];

  // Load all tasks as references if requested
  if (existingTasksReference) {
    try {
      const allTasks = await getAllTasks();

      // Split into completed and pending
      completedTasks = allTasks.filter(
        (task) => task.status === TaskStatus.COMPLETED
      );
      pendingTasks = allTasks.filter(
        (task) => task.status !== TaskStatus.COMPLETED
      );
    } catch (error) {}
  }

  // Build final prompt via generator
  const prompt = await getPlanTaskPrompt({
    description,
    requirements,
    existingTasksReference,
    completedTasks,
    pendingTasks,
    memoryDir: MEMORY_DIR,
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
