import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import {
  getTaskById,
  updateTaskContent as modelUpdateTaskContent,
} from "../../models/taskModel.js";
import { RelatedFileType } from "../../types/index.js";
import { getUpdateTaskContentPrompt } from "../../prompts/index.js";

// Update task content tool
export const updateTaskContentSchema = z.object({
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "Invalid task ID format. Please provide a valid UUID v4.",
    })
    .describe("The unique identifier of the task to update. Must exist and not be completed."),
  name: z.string().optional().describe("New task name (optional)"),
  description: z.string().optional().describe("New task description (optional)"),
  notes: z.string().optional().describe("New additional notes (optional)"),
  dependencies: z
    .array(z.string())
    .optional()
    .describe("New dependencies (optional)"),
  relatedFiles: z
    .array(
      z.object({
        path: z
          .string()
          .min(1, { message: "File path cannot be empty. Provide a valid path." })
          .describe("File path (absolute or relative to project root)"),
        type: z
          .nativeEnum(RelatedFileType)
          .describe("File relationship type (TO_MODIFY, REFERENCE, CREATE, DEPENDENCY, OTHER)"),
        description: z.string().optional().describe("Additional file description (optional)"),
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
  implementationGuide: z
    .string()
    .optional()
    .describe("New implementation guide (optional)"),
  verificationCriteria: z
    .string()
    .optional()
    .describe("New verification criteria (optional)"),
});

export async function updateTaskContent({
  taskId,
  name,
  description,
  notes,
  relatedFiles,
  dependencies,
  implementationGuide,
  verificationCriteria,
}: z.infer<typeof updateTaskContentSchema>) {
  if (relatedFiles) {
    for (const file of relatedFiles) {
      if (
        (file.lineStart && !file.lineEnd) ||
        (!file.lineStart && file.lineEnd) ||
        (file.lineStart && file.lineEnd && file.lineStart > file.lineEnd)
      ) {
        return {
          content: [
            {
              type: "text" as const,
              text: await getUpdateTaskContentPrompt({
                taskId,
                validationError:
                  "Invalid line range: both start and end must be set, and start must be less than end.",
              }),
            },
          ],
        };
      }
    }
  }

  if (
    !(
      name ||
      description ||
      notes ||
      dependencies ||
      implementationGuide ||
      verificationCriteria ||
      relatedFiles
    )
  ) {
    return {
      content: [
        {
          type: "text" as const,
          text: await getUpdateTaskContentPrompt({
            taskId,
            emptyUpdate: true,
          }),
        },
      ],
    };
  }

  // Load task to verify existence
  const task = await getTaskById(taskId);

  if (!task) {
    return {
      content: [
        {
          type: "text" as const,
          text: await getUpdateTaskContentPrompt({
            taskId,
          }),
        },
      ],
      isError: true,
    };
  }

  // Record a brief update summary (not output directly)
  let updateSummary = `Preparing to update task: ${task.name} (ID: ${task.id})`;
  if (name) updateSummary += `, new name: ${name}`;
  if (description) updateSummary += `, update description`;
  if (notes) updateSummary += `, update notes`;
  if (relatedFiles)
    updateSummary += `, update related files (${relatedFiles.length})`;
  if (dependencies)
    updateSummary += `, update dependencies (${dependencies.length})`;
  if (implementationGuide) updateSummary += `, update implementation guide`;
  if (verificationCriteria) updateSummary += `, update verification criteria`;

  // Perform the update
  const result = await modelUpdateTaskContent(taskId, {
    name,
    description,
    notes,
    relatedFiles,
    dependencies,
    implementationGuide,
    verificationCriteria,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: await getUpdateTaskContentPrompt({
          taskId,
          task,
          success: result.success,
          message: result.message,
          updatedTask: result.task,
        }),
      },
    ],
    isError: !result.success,
  };
}
