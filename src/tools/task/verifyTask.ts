import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import {
  getTaskById,
  updateTaskStatus,
  updateTaskSummary,
} from "../../models/taskModel.js";
import { TaskStatus } from "../../types/index.js";
import { getVerifyTaskPrompt } from "../../prompts/index.js";

// Verify task tool
export const verifyTaskSchema = z.object({
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "Invalid task ID format. Please provide a valid UUID v4.",
    })
    .describe("The unique identifier of the task to verify. Must be a valid existing task ID."),
  summary: z
    .string()
    .min(30, {
      message: "Minimum 30 characters",
    })
    .describe(
      "When score is >= 80, provide a completion summary (results and key decisions). When < 80, list issues and corrections. Min 30 chars."
    ),
  score: z
    .number()
    .min(0, { message: "Score cannot be less than 0" })
    .max(100, { message: "Score cannot be greater than 100" })
    .describe("Score for the task. If >= 80 the task is automatically marked completed."),
});

export async function verifyTask({
  taskId,
  summary,
  score,
}: z.infer<typeof verifyTaskSchema>) {
  const task = await getTaskById(taskId);

  if (!task) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## System Error\n\nTask with ID \`${taskId}\` was not found. Please use \`list_tasks\` to find a valid task ID and try again.`,
        },
      ],
      isError: true,
    };
  }

  if (task.status !== TaskStatus.IN_PROGRESS) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## Status Error\n\nTask "${task.name}" (ID: \`${task.id}\`) is currently in status "${task.status}", not In Progress, so it cannot be verified.\n\nOnly tasks in In Progress status can be verified. Please start the task using \`execute_task\` first.`,
        },
      ],
      isError: true,
    };
  }

  if (score >= 80) {
    // Mark task as completed and attach summary
    await updateTaskSummary(taskId, summary);
    await updateTaskStatus(taskId, TaskStatus.COMPLETED);
  }

  // Build final prompt via generator
  const prompt = await getVerifyTaskPrompt({ task, score, summary });

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}
