import { z } from "zod";
import { searchTasksWithCommand } from "../../models/taskModel.js";
import { getGetTaskDetailPrompt } from "../../prompts/index.js";

// Get full task detail parameters
export const getTaskDetailSchema = z.object({
  taskId: z
    .string()
    .min(1, {
      message: "Task ID cannot be empty. Provide a valid task ID.",
    })
    .describe("The task ID whose details you want to view"),
});

// Get full task detail
export async function getTaskDetail({
  taskId,
}: z.infer<typeof getTaskDetailSchema>) {
  try {
    // Use searchTasksWithCommand instead of getTaskById to include memory
    // Set isId=true (search by ID); page=1, pageSize=1
    const result = await searchTasksWithCommand(taskId, true, 1, 1);

    // Not found
    if (result.tasks.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `## Error\n\nTask with ID \`${taskId}\` was not found. Please verify the task ID.`,
          },
        ],
        isError: true,
      };
    }

    // The first (and only) matched task
    const task = result.tasks[0];

    // Build final prompt via generator
    const prompt = await getGetTaskDetailPrompt({
      taskId,
      task,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: prompt,
        },
      ],
    };
  } catch (error) {
    // Build error prompt via generator
    const errorPrompt = await getGetTaskDetailPrompt({
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      content: [
        {
          type: "text" as const,
          text: errorPrompt,
        },
      ],
    };
  }
}
