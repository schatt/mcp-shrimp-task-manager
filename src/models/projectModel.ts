import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Project, ProjectConfig } from "../types/index.js";
import { getDataDir } from "../utils/paths.js";

// Ensure we resolve the project folder path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");

// Project naming validation
const PROJECT_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const RESERVED_NAMES = new Set(["config", "projects", "memory", "default"]);

export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (name.length < 3) {
    return { valid: false, error: "Project name must be at least 3 characters long" };
  }
  
  if (name.length > 50) {
    return { valid: false, error: "Project name must be 50 characters or less" };
  }
  
  if (!PROJECT_NAME_REGEX.test(name)) {
    return { valid: false, error: "Project name can only contain letters, numbers, hyphens, and underscores" };
  }
  
  if (RESERVED_NAMES.has(name.toLowerCase())) {
    return { valid: false, error: `Project name '${name}' is reserved for system use` };
  }
  
  return { valid: true };
}

// Get project configuration file path
async function getProjectConfigPath(): Promise<string> {
  const dataDir = await getDataDir();
  return path.join(dataDir, "config.json");
}

// Get projects directory path
async function getProjectsDir(): Promise<string> {
  const dataDir = await getDataDir();
  return path.join(dataDir, "projects");
}

// Load project configuration
export async function loadProjectConfig(): Promise<ProjectConfig> {
  try {
    const configPath = await getProjectConfigPath();
    const configData = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(configData);
    
    // Convert timestamps back to Date objects
    Object.values(config.projects).forEach((project: any) => {
      project.createdAt = new Date(project.createdAt);
      project.updatedAt = new Date(project.updatedAt);
    });
    
    return config;
  } catch (error) {
    // Return default configuration if file doesn't exist
    return {
      defaultProject: "default",
      projects: {
        default: {
          id: uuidv4(),
          name: "default",
          description: "Default project",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      globalSettings: {
        templatesUse: "en",
        enableGui: true,
      },
    };
  }
}

// Save project configuration
async function saveProjectConfig(config: ProjectConfig): Promise<void> {
  const configPath = await getProjectConfigPath();
  const configDir = path.dirname(configPath);
  
  // Ensure config directory exists
  try {
    await fs.access(configDir);
  } catch (error) {
    await fs.mkdir(configDir, { recursive: true });
  }
  
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

// Ensure project directory structure exists
async function ensureProjectStructure(projectName: string): Promise<void> {
  const projectsDir = await getProjectsDir();
  const projectDir = path.join(projectsDir, projectName);
  
  try {
    await fs.access(projectsDir);
  } catch (error) {
    await fs.mkdir(projectsDir, { recursive: true });
  }
  
  try {
    await fs.access(projectDir);
  } catch (error) {
    await fs.mkdir(projectDir, { recursive: true });
  }
  
  // Create project-specific directories
  const memoryDir = path.join(projectDir, "memory");
  try {
    await fs.access(memoryDir);
  } catch (error) {
    await fs.mkdir(memoryDir, { recursive: true });
  }
  
  // Create default tasks.json if it doesn't exist
  const tasksFile = path.join(projectDir, "tasks.json");
  try {
    await fs.access(tasksFile);
  } catch (error) {
    await fs.writeFile(tasksFile, JSON.stringify({ tasks: [] }, null, 2));
  }
  
  // Create default WebGUI.md if it doesn't exist
  const webGuiFile = path.join(projectDir, "WebGUI.md");
  try {
    await fs.access(webGuiFile);
  } catch (error) {
    await fs.writeFile(webGuiFile, "# Project Web GUI\n\nAccess your project tasks here.", "utf-8");
  }
}

// Create a new project
export async function createProject(
  name: string,
  description?: string,
  setAsDefault: boolean = false
): Promise<{ success: boolean; project?: Project; error?: string }> {
  // Validate project name
  const validation = validateProjectName(name);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  try {
    const config = await loadProjectConfig();
    
    // Check if project already exists
    if (config.projects[name]) {
      return { success: false, error: `Project '${name}' already exists` };
    }
    
    // Create new project
    const newProject: Project = {
      id: uuidv4(),
      name,
      description,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add to configuration
    config.projects[name] = newProject;
    
    // Set as default if requested
    if (setAsDefault) {
      config.defaultProject = name;
    }
    
    // Save configuration
    await saveProjectConfig(config);
    
    // Create project directory structure
    await ensureProjectStructure(name);
    
    return { success: true, project: newProject };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to create project: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// List all projects
export async function listProjects(includeInactive: boolean = false): Promise<Project[]> {
  try {
    const config = await loadProjectConfig();
    const projects = Object.values(config.projects);
    
    if (includeInactive) {
      return projects;
    }
    
    return projects.filter(project => project.active);
  } catch (error) {
    return [];
  }
}

// Get project by name
export async function getProjectByName(name: string): Promise<Project | null> {
  try {
    const config = await loadProjectConfig();
    return config.projects[name] || null;
  } catch (error) {
    return null;
  }
}

// Get current default project
export async function getDefaultProject(): Promise<string> {
  try {
    const config = await loadProjectConfig();
    return config.defaultProject;
  } catch (error) {
    return "default";
  }
}

// Set default project
export async function setDefaultProject(name: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await loadProjectConfig();
    
    if (!config.projects[name]) {
      return { success: false, error: `Project '${name}' does not exist` };
    }
    
    config.defaultProject = name;
    await saveProjectConfig(config);
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to set default project: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// Delete a project
export async function deleteProject(
  name: string,
  archiveTasks: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await loadProjectConfig();
    
    if (!config.projects[name]) {
      return { success: false, error: `Project '${name}' does not exist` };
    }
    
    // Don't allow deleting the last project
    if (Object.keys(config.projects).length === 1) {
      return { success: false, error: "Cannot delete the last remaining project" };
    }
    
    // Archive tasks if requested
    if (archiveTasks) {
      const projectDir = path.join(await getProjectsDir(), name);
      const tasksFile = path.join(projectDir, "tasks.json");
      
      try {
        const tasksData = await fs.readFile(tasksFile, "utf-8");
        const { tasks } = JSON.parse(tasksData);
        
        if (tasks && tasks.length > 0) {
          const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
          const archiveFile = path.join(projectDir, "memory", `deleted_project_${timestamp}.json`);
          
          await fs.writeFile(archiveFile, JSON.stringify({ 
            tasks, 
            projectName: name,
            deletedAt: new Date().toISOString()
          }, null, 2));
        }
      } catch (error) {
        // Continue with deletion even if archiving fails
      }
    }
    
    // Remove from configuration
    delete config.projects[name];
    
    // Update default project if necessary
    if (config.defaultProject === name) {
      const remainingProjects = Object.keys(config.projects);
      config.defaultProject = remainingProjects[0] || "default";
    }
    
    // Save configuration
    await saveProjectConfig(config);
    
    // Remove project directory
    const projectDir = path.join(await getProjectsDir(), name);
    try {
      await fs.rm(projectDir, { recursive: true, force: true });
    } catch (error) {
      // Continue even if directory removal fails
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to delete project: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// Get project data directory
export async function getProjectDataDir(projectName?: string): Promise<string> {
  const config = await loadProjectConfig();
  const project = projectName || config.defaultProject;
  const projectsDir = await getProjectsDir();
  return path.join(projectsDir, project);
}

// Get project tasks file path
export async function getProjectTasksFilePath(projectName?: string): Promise<string> {
  const projectDir = await getProjectDataDir(projectName);
  return path.join(projectDir, "tasks.json");
}

// Get project memory directory
export async function getProjectMemoryDir(projectName?: string): Promise<string> {
  const projectDir = await getProjectDataDir(projectName);
  return path.join(projectDir, "memory");
}
