import { z } from "zod";
import { createProject as modelCreateProject } from "../../models/projectModel.js";

// Create project tool
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, "Project name must be at least 3 characters")
    .max(50, "Project name must be 50 characters or less")
    .regex(/^[a-zA-Z0-9_-]+$/, "Project name can only contain letters, numbers, hyphens, and underscores")
    .describe("Project name (3-50 chars, alphanumeric + hyphens/underscores only)"),
  description: z.string().optional().describe("Project description (optional)"),
  setAsDefault: z.boolean().optional().default(false).describe("Set as default project")
});

export async function createProject({
  name,
  description,
  setAsDefault,
}: z.infer<typeof createProjectSchema>) {
  try {
    const result = await modelCreateProject(name, description, setAsDefault);

    if (result.success) {
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Project '${name}' created successfully!${setAsDefault ? ' (Set as default)' : ''}\n\nProject Details:\n- Name: ${name}\n- Description: ${description || 'None'}\n- ID: ${result.project?.id}\n- Created: ${result.project?.createdAt.toISOString()}`,
          },
        ],
        isError: false,
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ Failed to create project '${name}': ${result.error}`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error occurred while creating project: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
