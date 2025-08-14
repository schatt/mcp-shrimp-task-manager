import { z } from "zod";
import { searchTasksWithCommand } from "../../models/taskModel.js";
import { getQueryTaskPrompt } from "../../prompts/index.js";

// Query tasks tool
export const queryTaskSchema = z.object({
  query: z
    .string()
    .min(1, {
      message: "Query cannot be empty. Provide a task ID or search keywords.",
    })
    .describe("Search text. Can be a task ID or multiple space-separated keywords."),
  isId: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether this is an ID-lookup mode. Defaults to false (keyword mode)."),
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .describe("Page number (default 1)"),
  pageSize: z
    .number()
    .int()
    .positive()
    .min(1)
    .max(20)
    .optional()
    .default(5)
    .describe("Results per page (default 5, max 20)"),
});

export async function queryTask({
  query,
  isId = false,
  page = 1,
  pageSize = 3,
}: z.infer<typeof queryTaskSchema>) {
  try {
    // Use system command-based search function
    const results = await searchTasksWithCommand(query, isId, page, pageSize);

    // Build final prompt via generator
    const prompt = await getQueryTaskPrompt({
      query,
      isId,
      tasks: results.tasks,
      totalTasks: results.pagination.totalResults,
      page: results.pagination.currentPage,
      pageSize,
      totalPages: results.pagination.totalPages,
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
    return {
      content: [
        {
          type: "text" as const,
          text: `## System Error\n\nError occurred while querying tasks: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}
