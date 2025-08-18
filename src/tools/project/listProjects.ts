import { z } from "zod";
import { listProjects as modelListProjects, getDefaultProject } from "../../models/projectModel.js";

// List projects tool
export const listProjectsSchema = z.object({
  includeInactive: z.boolean().optional().default(false).describe("Include inactive projects")
});

export async function listProjects({
  includeInactive,
}: z.infer<typeof listProjectsSchema>) {
  try {
    const projects = await modelListProjects(includeInactive);
    const defaultProject = await getDefaultProject();

    if (projects.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No projects found.",
          },
        ],
        isError: false,
      };
    }

    const projectList = projects
      .map(project => {
        const isDefault = project.name === defaultProject;
        const status = project.active ? "🟢 Active" : "🔴 Inactive";
        const defaultIndicator = isDefault ? " (Default)" : "";
        
        return `- ${project.name}${defaultIndicator}\n  ${status} | Created: ${project.createdAt.toISOString().split('T')[0]}\n  ${project.description ? `Description: ${project.description}` : 'No description'}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: "text" as const,
          text: `📋 Projects (${projects.length} total):\n\n${projectList}\n\nDefault project: ${defaultProject}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error occurred while listing projects: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
