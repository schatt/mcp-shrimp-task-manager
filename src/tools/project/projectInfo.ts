import { z } from "zod";
import { getProjectByName, getDefaultProject } from "../../models/projectModel.js";

// Project info tool
export const projectInfoSchema = z.object({
  project: z.string().optional().describe("Project name (uses current if not specified)")
});

export async function projectInfo({
  project,
}: z.infer<typeof projectInfoSchema>) {
  try {
    const currentProject = project || await getDefaultProject();
    const projectData = await getProjectByName(currentProject);
    
    if (!projectData) {
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ Project '${currentProject}' not found. Use 'list_projects' to see available projects.`,
          },
        ],
        isError: true,
      };
    }

    const isDefault = currentProject === await getDefaultProject();
    const status = projectData.active ? "🟢 Active" : "🔴 Inactive";
    const defaultIndicator = isDefault ? " (Default)" : "";

    return {
      content: [
        {
          type: "text" as const,
          text: `📊 Project Information: ${currentProject}${defaultIndicator}\n\n` +
                `Basic Details:\n` +
                `- Name: ${projectData.name}\n` +
                `- ID: ${projectData.id}\n` +
                `- Description: ${projectData.description || 'None'}\n` +
                `- Status: ${status}\n` +
                `- Created: ${projectData.createdAt.toISOString()}\n` +
                `- Last Updated: ${projectData.updatedAt.toISOString()}\n\n` +
                `Project Path: ShrimpData/projects/${currentProject}/\n` +
                `Tasks File: ShrimpData/projects/${currentProject}/tasks.json\n` +
                `Memory Directory: ShrimpData/projects/${currentProject}/memory/\n` +
                `Web GUI File: ShrimpData/projects/${currentProject}/WebGUI.md`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error occurred while getting project info: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
