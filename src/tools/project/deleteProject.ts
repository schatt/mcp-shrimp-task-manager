import { z } from "zod";
import { deleteProject as modelDeleteProject, getProjectByName } from "../../models/projectModel.js";

// Delete project tool
export const deleteProjectSchema = z.object({
  project: z.string().describe("Project name to delete"),
  confirm: z.boolean().describe("Must be true to confirm deletion"),
  archiveTasks: z.boolean().optional().default(true).describe("Archive tasks before deletion")
});

export async function deleteProject({
  project,
  confirm,
  archiveTasks,
}: z.infer<typeof deleteProjectSchema>) {
  try {
    if (!confirm) {
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ Deletion cancelled. Set 'confirm: true' to proceed with deleting project '${project}'.`,
          },
        ],
        isError: true,
      };
    }

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

    // Perform deletion
    const result = await modelDeleteProject(project, archiveTasks);
    
    if (result.success) {
      const archiveMessage = archiveTasks 
        ? "Tasks have been archived before deletion." 
        : "Tasks were not archived.";
        
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Project '${project}' deleted successfully!\n\n${archiveMessage}\n\nProject Details:\n- Name: ${projectExists.name}\n- Description: ${projectExists.description || 'None'}\n- Status: ${projectExists.active ? 'Active' : 'Inactive'}\n- Created: ${projectExists.createdAt.toISOString().split('T')[0]}\n- Deleted: ${new Date().toISOString().split('T')[0]}`,
          },
        ],
        isError: false,
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ Failed to delete project '${project}': ${result.error}`,
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
          text: `Error occurred while deleting project: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
