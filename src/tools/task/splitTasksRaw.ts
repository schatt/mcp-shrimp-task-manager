import { z } from "zod";
import {
  getAllTasks,
  batchCreateOrUpdateTasks,
  clearAllTasks as modelClearAllTasks,
} from "../../models/taskModel.js";
import { RelatedFileType, Task, TaskPriority } from "../../types/index.js";
import { getSplitTasksPrompt } from "../../prompts/index.js";

// Split tasks (raw JSON) tool
export const splitTasksRawSchema = z.object({
  updateMode: z
    .enum(["append", "overwrite", "selective", "clearAllTasks"])
    .describe(
      "Task update mode: 'append' (keep all existing tasks and add new), 'overwrite' (remove unfinished tasks and replace; keep completed), 'selective' (smart update by task name; keep unmatched), 'clearAllTasks' (clear all tasks and create a backup).\nDefault is 'clearAllTasks'; use others only when the user requests changes."
    ),
  tasksRaw: z
    .string()
    .describe(
      "Structured task list. Each task should be atomic with clear acceptance criteria. Avoid trivial tasks; merge minor edits. Example: [{name: 'Clear task name', description: 'Detailed description with implementation and acceptance', implementationGuide: 'Implementation steps with concise pseudocode', notes: 'Additional notes (optional)', dependencies: ['Prerequisite task full name'], relatedFiles: [{path: 'file path', type: 'file type (TO_MODIFY, REFERENCE, CREATE, DEPENDENCY, OTHER)', description: 'file description', lineStart: 1, lineEnd: 100}], verificationCriteria: 'Verification criteria'}, {name: 'Task 2', description: 'Task 2 description', implementationGuide: 'Task 2 implementation', notes: 'optional', dependencies: ['Task 1'], relatedFiles: [{path: 'file path', type: 'file type (...)', description: 'file description', lineStart: 1, lineEnd: 100}], verificationCriteria: 'criteria'}]"
    ),
  globalAnalysisResult: z
    .string()
    .optional()
    .describe("Global objective/result from earlier analysis that applies to all tasks"),
});

const tasksSchema = z
  .array(
    z.object({
      name: z
        .string()
        .max(100, {
          message: "Task name too long. Limit to 100 characters.",
        })
        .describe("Concise, clear task name that communicates the purpose"),
      description: z
        .string()
        .min(10, {
          message: "Task description too short. Provide more details for clarity.",
        })
        .describe("Detailed task description including implementation points, technical details, and acceptance criteria"),
      priority: z
        .nativeEnum(TaskPriority)
        .optional()
        .describe("Task priority level (CRITICAL, HIGH, MEDIUM, LOW). Defaults to MEDIUM if not specified."),
      implementationGuide: z
        .string()
        .describe("Specific implementation methods and steps; provide concise pseudocode where needed"),
      dependencies: z
        .array(z.string())
        .optional()
        .describe("List of prerequisite task IDs or names; both are supported (names are more intuitive)"),
      notes: z
        .string()
        .optional()
        .describe("Additional notes, special handling requirements, or recommendations (optional)"),
      relatedFiles: z
        .array(
          z.object({
            path: z
              .string()
              .min(1, {
                message: "File path cannot be empty",
              })
              .describe("File path (absolute or relative to project root)"),
            type: z
              .nativeEnum(RelatedFileType)
              .describe("File type (TO_MODIFY, REFERENCE, CREATE, DEPENDENCY, OTHER)"),
            description: z
              .string()
              .min(1, {
                message: "File description cannot be empty",
              })
              .describe("File description explaining purpose and content"),
            lineStart: z
              .number()
              .int()
              .positive()
              .optional()
              .describe("Start line of related code block (optional)"),
            lineEnd: z
              .number()
              .int()
              .positive()
              .optional()
              .describe("End line of related code block (optional)"),
          })
        )
        .optional()
        .describe("List of files related to the task (code to modify, references, files to create, dependencies, etc.)"),
      verificationCriteria: z
        .string()
        .optional()
        .describe("Verification criteria and methods for this task"),
    })
  )
  .min(1, {
    message: "Please provide at least one task",
  })
  .describe(
    "Structured task list. Each task should be atomic with clear acceptance criteria. Avoid trivial tasks; merge minor edits."
  );

export async function splitTasksRaw({
  updateMode,
  tasksRaw,
  globalAnalysisResult,
}: z.infer<typeof splitTasksRawSchema>) {
  let tasks: Task[] = [];
  try {
    tasks = JSON.parse(tasksRaw);
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            "Invalid tasksRaw format. Ensure valid JSON. If the text is too long to fix at once, submit in batches to avoid overly long messages. Error: " +
            (error instanceof Error ? error.message : String(error)),
        },
      ],
    };
  }

  // Validate tasks using tasksSchema
  const tasksResult = tasksSchema.safeParse(tasks);
  if (!tasksResult.success) {
    // Return error message
    return {
      content: [
        {
          type: "text" as const,
          text:
            "Invalid 'tasks' format. Ensure correctness. Error: " +
            tasksResult.error.message,
        },
      ],
    };
  }

  try {
    // Ensure unique task names
    const nameSet = new Set();
    for (const task of tasks) {
      if (nameSet.has(task.name)) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Duplicate task names found in 'tasks'. Ensure each name is unique.",
            },
          ],
        };
      }
      nameSet.add(task.name);
    }

    // Process according to update mode
    let message = "";
    let actionSuccess = true;
    let backupFile = null;
    let createdTasks: Task[] = [];
    let allTasks: Task[] = [];

    // 將任務資料轉換為符合batchCreateOrUpdateTasks的格式
    const convertedTasks = tasks.map((task) => ({
      name: task.name,
      description: task.description,
      notes: task.notes,
      dependencies: task.dependencies as unknown as string[],
      priority: task.priority, // Include priority field
      implementationGuide: task.implementationGuide,
      verificationCriteria: task.verificationCriteria,
      relatedFiles: task.relatedFiles?.map((file) => ({
        path: file.path,
        type: file.type as RelatedFileType,
        description: file.description,
        lineStart: file.lineStart,
        lineEnd: file.lineEnd,
      })),
    }));

    // Handle clearAllTasks mode
    if (updateMode === "clearAllTasks") {
      const clearResult = await modelClearAllTasks();

      if (clearResult.success) {
        message = clearResult.message;
        backupFile = clearResult.backupFile;

        try {
                  // After clearing, create new tasks
        createdTasks = await batchCreateOrUpdateTasks(
          convertedTasks,
          "append",
          globalAnalysisResult,
          false // No archiving for new task creation
        );
          message += `\nSuccessfully created ${createdTasks.length} new tasks.`;
        } catch (error) {
          actionSuccess = false;
          message += `\nError while creating new tasks: ${
            error instanceof Error ? error.message : String(error)
          }`;
        }
      } else {
        actionSuccess = false;
        message = clearResult.message;
      }
    } else {
      // For other modes, use batchCreateOrUpdateTasks directly
      try {
        createdTasks = await batchCreateOrUpdateTasks(
          convertedTasks,
          updateMode,
          globalAnalysisResult,
          false // No archiving for split tasks (new task creation)
        );

        // Generate message by mode
        switch (updateMode) {
          case "append":
            message = `Successfully appended ${createdTasks.length} new tasks.`;
            break;
          case "overwrite":
            message = `Successfully cleared unfinished tasks and created ${createdTasks.length} new tasks.`;
            break;
          case "selective":
            message = `Successfully selectively updated/created ${createdTasks.length} tasks.`;
            break;
        }
      } catch (error) {
        actionSuccess = false;
        message = `Task creation failed: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    }

    // Load all tasks for dependency display
    try {
      allTasks = await getAllTasks();
    } catch (error) {
      allTasks = [...createdTasks]; // Fallback to newly created tasks
    }

    // 使用prompt生成器獲取最終prompt
    const prompt = await getSplitTasksPrompt({
      updateMode,
      createdTasks,
      allTasks,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: prompt,
        },
      ],
      ephemeral: {
        taskCreationResult: {
          success: actionSuccess,
          message,
          backupFilePath: backupFile,
        },
      },
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            "Error occurred while splitting tasks: " +
            (error instanceof Error ? error.message : String(error)),
        },
      ],
    };
  }
}
