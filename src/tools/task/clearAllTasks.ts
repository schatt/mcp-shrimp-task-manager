import { z } from "zod";
import {
  getAllTasks,
  clearAllTasks as modelClearAllTasks,
} from "../../models/taskModel.js";
import { getClearAllTasksPrompt } from "../../prompts/index.js";

// Clear all tasks tool
export const clearAllTasksSchema = z.object({
  confirm: z
    .boolean()
    .refine((val) => val === true, {
      message:
        "You must explicitly confirm the clear operation. Set confirm=true to proceed.",
    })
    .describe("Confirm deletion of all unfinished tasks (this operation is irreversible)"),
  force: z
    .boolean()
    .optional()
    .default(false)
    .describe("Force permanent deletion instead of archiving to memory (requires ENABLE_CLEAR_ALL_TASKS env var)"),
  archive: z
    .boolean()
    .optional()
    .default(true)
    .describe("Archive tasks to memory instead of permanent deletion (default behavior)"),
});

export async function clearAllTasks({
  confirm,
  force = false,
  archive = true,
}: z.infer<typeof clearAllTasksSchema>) {
  // Environment variable protection
  if (force && process.env.ENABLE_CLEAR_ALL_TASKS !== "true") {
    return {
      content: [
        {
          type: "text" as const,
          text: "Force deletion is disabled. Set ENABLE_CLEAR_ALL_TASKS=true environment variable to enable permanent deletion.",
        },
      ],
      isError: true,
    };
  }

  // Safety check: reject if not confirmed
  if (!confirm) {
    return {
      content: [
        {
          type: "text" as const,
          text: await getClearAllTasksPrompt({ confirm: false }),
        },
      ],
    };
  }

  // Check if there are tasks to clear
  const allTasks = await getAllTasks();
  if (allTasks.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: await getClearAllTasksPrompt({ isEmpty: true }),
        },
      ],
    };
  }

  // Perform clear operation with protection options
  const result = await modelClearAllTasks(force, archive);

  return {
    content: [
      {
        type: "text" as const,
        text: await getClearAllTasksPrompt({
          success: result.success,
          message: result.message,
          backupFile: result.backupFile,
        }),
      },
    ],
    isError: !result.success,
  };
}
