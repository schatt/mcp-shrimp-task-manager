import { z } from "zod";
import { restoreArchivedTasks as modelRestoreArchivedTasks } from "../../models/taskModel.js";

// Restore archived tasks tool
export const restoreArchivedTasksSchema = z.object({
  backupFileName: z
    .string()
    .describe("Name of the backup file to restore from (e.g., tasks_memory_2025-08-15T12-43-49.json)"),
});

export async function restoreArchivedTasks({
  backupFileName,
}: z.infer<typeof restoreArchivedTasksSchema>) {
  try {
    const result = await modelRestoreArchivedTasks(backupFileName);
    
    return {
      content: [
        {
          type: "text" as const,
          text: result.message,
        },
      ],
      isError: !result.success,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error occurred while restoring tasks: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

