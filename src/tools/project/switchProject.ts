import { z } from "zod";
import { setDefaultProject as modelSetDefaultProject, getProjectByName } from "../../models/projectModel.js";

// Switch project tool
export const switchProjectSchema = z.object({
  project: z.string().describe("Project name to switch to"),
  setAsDefault: z.boolean().optional().default(false).describe("Set as new default project")
});

export async function switchProject({
  project,
  setAsDefault,
}: z.infer<typeof switchProjectSchema>) {
  try {
    // Check if project exists
    const projectExists = await getProjectByName(project);
    if (!projectExists) {
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ Project '${project}' does not exist. Use 'list_projects' to see available projects.`,
          },
        ],
        isError: true,
      };
    }

    if (setAsDefault) {
      // Set as default project
      const result = await modelSetDefaultProject(project);
      
      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `✅ Switched to project '${project}' and set as default!\n\nProject Details:\n- Name: ${projectExists.name}\n- Description: ${projectExists.description || 'None'}\n- Status: ${projectExists.active ? 'Active' : 'Inactive'}\n- Created: ${projectExists.createdAt.toISOString().split('T')[0]}`,
            },
          ],
          isError: false,
        };
      } else {
        return {
          content: [
            {
              type: "text" as const,
              text: `❌ Failed to set '${project}' as default: ${result.error}`,
            },
          ],
          isError: true,
        };
      }
    } else {
      // Just switch to project (temporary)
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Switched to project '${project}'!\n\nNote: This is a temporary switch. To make it permanent, use 'setAsDefault: true'.\n\nProject Details:\n- Name: ${projectExists.name}\n- Description: ${projectExists.description || 'None'}\n- Status: ${projectExists.active ? 'Active' : 'Inactive'}\n- Created: ${projectExists.createdAt.toISOString().split('T')[0]}`,
          },
        ],
        isError: false,
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error occurred while switching project: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
