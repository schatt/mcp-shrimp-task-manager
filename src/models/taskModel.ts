import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskDependency,
  TaskComplexityLevel,
  TaskComplexityThresholds,
  TaskComplexityAssessment,
  RelatedFile,
} from "../types/index.js";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import { getDataDir, getTasksFilePath, getMemoryDir, getProjectTasksFilePathPath, getProjectMemoryDirPath } from "../utils/paths.js";

// Ensure we resolve the project folder path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");

// Data file path (retrieved asynchronously)
// const DATA_DIR = getDataDir();
// const TASKS_FILE = getTasksFilePath();

// Promisify exec
const execPromise = promisify(exec);

// Ensure the data directory and tasks file exist
async function ensureDataDir() {
  const DATA_DIR = await getDataDir();
  const TASKS_FILE = await getTasksFilePath();

  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  try {
    await fs.access(TASKS_FILE);
  } catch (error) {
    await fs.writeFile(TASKS_FILE, JSON.stringify({ tasks: [] }));
  }
}

// Read all tasks
async function readTasks(projectName?: string): Promise<Task[]> {
  await ensureDataDir();
  const TASKS_FILE = projectName 
    ? await getProjectTasksFilePathPath(projectName)
    : await getTasksFilePath();
  const data = await fs.readFile(TASKS_FILE, "utf-8");
  const tasks = JSON.parse(data).tasks;

  // Convert string timestamps back into Date objects
  return tasks.map((task: any) => ({
    ...task,
    createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
    updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
    completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
  }));
}

// Write all tasks
async function writeTasks(tasks: Task[], projectName?: string): Promise<void> {
  await ensureDataDir();
  const TASKS_FILE = projectName 
    ? await getProjectTasksFilePathPath(projectName)
    : await getTasksFilePath();
  await fs.writeFile(TASKS_FILE, JSON.stringify({ tasks }, null, 2));
}

// Get all tasks
export async function getAllTasks(projectName?: string): Promise<Task[]> {
  return await readTasks(projectName);
}

// Get a task by ID
export async function getTaskById(taskId: string, projectName?: string): Promise<Task | null> {
  const tasks = await readTasks(projectName);
  return tasks.find((task) => task.id === taskId) || null;
}

// Create a new task
export async function createTask(
  name: string,
  description: string,
  notes?: string,
  dependencies: string[] = [],
  relatedFiles?: RelatedFile[],
  priority?: TaskPriority,
  projectName?: string
): Promise<Task> {
  const tasks = await readTasks(projectName);

  const dependencyObjects: TaskDependency[] = dependencies.map((taskId) => ({
    taskId,
  }));

  const newTask: Task = {
    id: uuidv4(),
    name,
    description,
    notes,
    status: TaskStatus.PENDING,
    priority: priority || TaskPriority.MEDIUM, // Default to MEDIUM priority if not specified
    dependencies: dependencyObjects,
    createdAt: new Date(),
    updatedAt: new Date(),
    relatedFiles,
  };

  tasks.push(newTask);
  await writeTasks(tasks, projectName);

  return newTask;
}

// Update task
export async function updateTask(
  taskId: string,
  updates: Partial<Task>,
  projectName?: string
): Promise<Task | null> {
  const tasks = await readTasks(projectName);
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return null;
  }

  // Disallow updates to completed tasks (except explicitly allowed fields)
  if (tasks[taskIndex].status === TaskStatus.COMPLETED) {
    // Only 'summary' and 'relatedFiles' can be updated
    const allowedFields = ["summary", "relatedFiles"];
    const attemptedFields = Object.keys(updates);

    const disallowedFields = attemptedFields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (disallowedFields.length > 0) {
      return null;
    }
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updates,
    updatedAt: new Date(),
  };

  await writeTasks(tasks, projectName);

  return tasks[taskIndex];
}

// Update task status
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  projectName?: string
): Promise<Task | null> {
  const updates: Partial<Task> = { status };

  if (status === TaskStatus.COMPLETED) {
    updates.completedAt = new Date();
  }

  return await updateTask(taskId, updates, projectName);
}

// Update Task Summary
export async function updateTaskSummary(
  taskId: string,
  summary: string,
  projectName?: string
): Promise<Task | null> {
  return await updateTask(taskId, { summary }, projectName);
}

// Update task content
export async function updateTaskContent(
  taskId: string,
  updates: {
    name?: string;
    description?: string;
    notes?: string;
    priority?: TaskPriority; // New: Task priority level
    relatedFiles?: RelatedFile[];
    dependencies?: string[];
    implementationGuide?: string;
    verificationCriteria?: string;
  },
  projectName?: string
): Promise<{ success: boolean; message: string; task?: Task }> {
  // Load the task and check existence
  const task = await getTaskById(taskId, projectName);

  if (!task) {
    return { success: false, message: "The specified task could not be found" };
  }

  // Disallow updates to completed tasks
  if (task.status === TaskStatus.COMPLETED) {
    return { success: false, message: "Unable to update completed tasks" };
  }

  // Build update object with only provided fields
  const updateObj: Partial<Task> = {};

  if (updates.name !== undefined) {
    updateObj.name = updates.name;
  }

  if (updates.description !== undefined) {
    updateObj.description = updates.description;
  }

  if (updates.notes !== undefined) {
    updateObj.notes = updates.notes;
  }

  if (updates.priority !== undefined) {
    updateObj.priority = updates.priority;
  }

  if (updates.relatedFiles !== undefined) {
    updateObj.relatedFiles = updates.relatedFiles;
  }

  if (updates.dependencies !== undefined) {
    updateObj.dependencies = updates.dependencies.map((dep) => ({
      taskId: dep,
    }));
  }

  if (updates.implementationGuide !== undefined) {
    updateObj.implementationGuide = updates.implementationGuide;
  }

  if (updates.verificationCriteria !== undefined) {
    updateObj.verificationCriteria = updates.verificationCriteria;
  }

  // Early return when nothing to update
  if (Object.keys(updateObj).length === 0) {
    return { success: true, message: "No content was provided that needed updating", task };
  }

  // Perform update
  const updatedTask = await updateTask(taskId, updateObj, projectName);

  if (!updatedTask) {
    return { success: false, message: "An error occurred while updating the task" };
  }

  return {
    success: true,
    message: "The task content has been successfully updated",
    task: updatedTask,
  };
}

// Update task related files
export async function updateTaskRelatedFiles(
  taskId: string,
  relatedFiles: RelatedFile[],
  projectName?: string
): Promise<{ success: boolean; message: string; task?: Task }> {
  // Load task and check existence
  const task = await getTaskById(taskId, projectName);

  if (!task) {
    return { success: false, message: "The specified task could not be found" };
  }

  // Disallow updates to completed tasks
  if (task.status === TaskStatus.COMPLETED) {
    return { success: false, message: "Unable to update completed tasks" };
  }

  // Perform update
  const updatedTask = await updateTask(taskId, { relatedFiles }, projectName);

  if (!updatedTask) {
    return { success: false, message: "An error occurred while updating task-related files" };
  }

  return {
    success: true,
    message: `Successfully updated task related files, total ${relatedFiles.length} files`,
    task: updatedTask,
  };
}

// Create or update tasks in batches
export async function batchCreateOrUpdateTasks(
  taskDataList: Array<{
    name: string;
    description: string;
    notes?: string;
    dependencies?: string[];
    relatedFiles?: RelatedFile[];
    priority?: TaskPriority; // New: Task priority level
    implementationGuide?: string; // New: Implementation Guide
    verificationCriteria?: string; // New: Validation criteria
  }>,
  updateMode: "append" | "overwrite" | "selective" | "clearAllTasks", // Required parameter, specifies the task update strategy
  globalAnalysisResult?: string, // New: Global analysis results
  archiveOnOverwrite: boolean = false, // New: Whether to archive tasks when overwriting (default: false)
  projectName?: string // New: Project name for project-specific operations
): Promise<Task[]> {
  // Read all existing tasks
  const existingTasks = await readTasks(projectName);

  // Process existing tasks according to update mode
  let tasksToKeep: Task[] = [];

  if (updateMode === "append") {
    // Append mode: keep all existing tasks
    tasksToKeep = [...existingTasks];
  } else if (updateMode === "overwrite") {
    // Overwrite mode: optionally archive unfinished tasks and keep completed tasks
    const tasksToArchive = existingTasks.filter(
      (task) => task.status !== TaskStatus.COMPLETED
    );
    
    // Archive unfinished tasks to memory only if explicitly requested
    if (archiveOnOverwrite && tasksToArchive.length > 0) {
      try {
        const MEMORY_DIR = await getMemoryDir();
        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, "-")
          .replace(/\..+/, "");
        const backupFileName = `overwrite_archive_${timestamp}.json`;
        const memoryFilePath = path.join(MEMORY_DIR, backupFileName);
        
        // Ensure memory directory exists
        try {
          await fs.access(MEMORY_DIR);
        } catch (error) {
          await fs.mkdir(MEMORY_DIR, { recursive: true });
        }
        
        // Archive unfinished tasks
        await fs.writeFile(
          memoryFilePath,
          JSON.stringify({ 
            tasks: tasksToArchive, 
            mode: "overwrite_archive",
            originalCount: existingTasks.length,
            archivedCount: tasksToArchive.length
          }, null, 2)
        );
        
        console.log(`Archived ${tasksToArchive.length} unfinished tasks to ${backupFileName}`);
      } catch (error) {
        console.error(`Warning: Failed to archive tasks: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Keep only completed tasks
    tasksToKeep = existingTasks.filter(
      (task) => task.status === TaskStatus.COMPLETED
    );
  } else if (updateMode === "selective") {
    // Selective update mode: Selectively update based on task name, retaining tasks that are not in the update list
    // 1. Extract the list of names of tasks to be updated
    const updateTaskNames = new Set(taskDataList.map((task) => task.name));

    // 2. Keep all tasks that do not appear in the update list
    tasksToKeep = existingTasks.filter(
      (task) => !updateTaskNames.has(task.name)
    );
  } else if (updateMode === "clearAllTasks") {
    // Clear all tasks mode: clear the task list
    tasksToKeep = [];
  }

  // Map of task name to task ID (supports name-based references)
  const taskNameToIdMap = new Map<string, string>();

  // In selective mode, record existing name->ID first
  if (updateMode === "selective") {
    existingTasks.forEach((task) => {
      taskNameToIdMap.set(task.name, task.id);
    });
  }

  // Record names and IDs of all retained tasks for dependency resolution
  tasksToKeep.forEach((task) => {
    taskNameToIdMap.set(task.name, task.id);
  });

  // Build list of new/updated tasks
  const newTasks: Task[] = [];

  for (const taskData of taskDataList) {
    // In selective mode, update existing non-completed tasks by name
    if (updateMode === "selective" && taskNameToIdMap.has(taskData.name)) {
      // Existing task ID
      const existingTaskId = taskNameToIdMap.get(taskData.name)!;

      // Find existing task
      const existingTaskIndex = existingTasks.findIndex(
        (task) => task.id === existingTaskId
      );

      // If an existing task is found and it is not completed, update it
      if (
        existingTaskIndex !== -1 &&
        existingTasks[existingTaskIndex].status !== TaskStatus.COMPLETED
      ) {
        const taskToUpdate = existingTasks[existingTaskIndex];

        // Update task fields, keeping original ID and timestamps
        const updatedTask: Task = {
          ...taskToUpdate,
          name: taskData.name,
          description: taskData.description,
          notes: taskData.notes,
          priority: taskData.priority || taskToUpdate.priority, // Preserve existing priority if not specified
          // Dependencies handled later
          updatedAt: new Date(),
          // Save implementation guide (if any)
          implementationGuide: taskData.implementationGuide,
          // Save verification criteria (if any)
          verificationCriteria: taskData.verificationCriteria,
          // Save global analysis results (if any)
          analysisResult: globalAnalysisResult,
        };

        // Process related files (if any)
        if (taskData.relatedFiles) {
          updatedTask.relatedFiles = taskData.relatedFiles;
        }

        // Add to new list
        newTasks.push(updatedTask);

        // Remove from tasksToKeep (now in newTasks)
        tasksToKeep = tasksToKeep.filter((task) => task.id !== existingTaskId);
      }
    } else {
      // Create a new task
      const newTaskId = uuidv4();

      // Track in map
      taskNameToIdMap.set(taskData.name, newTaskId);

      const newTask: Task = {
        id: newTaskId,
        name: taskData.name,
        description: taskData.description,
        notes: taskData.notes,
        status: TaskStatus.PENDING,
        priority: taskData.priority || TaskPriority.MEDIUM, // Default to MEDIUM priority if not specified
        dependencies: [], // Filled later
        createdAt: new Date(),
        updatedAt: new Date(),
        relatedFiles: taskData.relatedFiles,
        // Save implementation guide (if any)
        implementationGuide: taskData.implementationGuide,
        // Save verification criteria (if any)
        verificationCriteria: taskData.verificationCriteria,
        // Save global analysis results (if any)
        analysisResult: globalAnalysisResult,
      };

      newTasks.push(newTask);
    }
  }

  // Resolve dependencies between tasks
  for (let i = 0; i < taskDataList.length; i++) {
    const taskData = taskDataList[i];
    const newTask = newTasks[i];

    // Handle dependencies if present
    if (taskData.dependencies && taskData.dependencies.length > 0) {
      const resolvedDependencies: TaskDependency[] = [];

      for (const dependencyName of taskData.dependencies) {
        // First treat dependency as an ID
        let dependencyTaskId = dependencyName;

        // If it does not look like a UUID, treat it as a task name
        if (
          !dependencyName.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          )
        ) {
          // Map name to ID if known
          if (taskNameToIdMap.has(dependencyName)) {
            dependencyTaskId = taskNameToIdMap.get(dependencyName)!;
          } else {
            continue; //Skip this dependency
          }
        } else {
          // It looks like a UUID; confirm the ID corresponds to an actual task
          const idExists = [...tasksToKeep, ...newTasks].some(
            (task) => task.id === dependencyTaskId
          );
          if (!idExists) {
            continue; // Skip this dependency
          }
        }

        resolvedDependencies.push({ taskId: dependencyTaskId });
      }

      newTask.dependencies = resolvedDependencies;
    }
  }

  // Merge retained and new tasks
  const allTasks = [...tasksToKeep, ...newTasks];

  // Persist the updated task list
  await writeTasks(allTasks, projectName);

  return newTasks;
}

// Check if the task is executable (all dependencies are complete)
export async function canExecuteTask(
  taskId: string,
  projectName?: string
): Promise<{ canExecute: boolean; blockedBy?: string[] }> {
  const task = await getTaskById(taskId, projectName);

  if (!task) {
    return { canExecute: false };
  }

  if (task.status === TaskStatus.COMPLETED) {
    return { canExecute: false }; // Completed tasks do not need to be performed again
  }

  if (task.dependencies.length === 0) {
    return { canExecute: true }; // Tasks without dependencies can be executed directly
  }

  const allTasks = await readTasks(projectName);
  const blockedBy: string[] = [];

  for (const dependency of task.dependencies) {
    const dependencyTask = allTasks.find((t) => t.id === dependency.taskId);

    if (!dependencyTask || dependencyTask.status !== TaskStatus.COMPLETED) {
      blockedBy.push(dependency.taskId);
    }
  }

  return {
    canExecute: blockedBy.length === 0,
    blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
  };
}

// Deleting a task
export async function deleteTask(
  taskId: string,
  projectName?: string
): Promise<{ success: boolean; message: string }> {
  const tasks = await readTasks(projectName);
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return { success: false, message: "The specified task could not be found" };
  }

  // Check the task status. Completed tasks cannot be deleted.
  if (tasks[taskIndex].status === TaskStatus.COMPLETED) {
    return { success: false, message: "Cannot delete completed tasks" };
  }

  // Check if any other tasks depend on this task
  const allTasks = tasks.filter((_, index) => index !== taskIndex);
  const dependentTasks = allTasks.filter((task) =>
    task.dependencies.some((dep) => dep.taskId === taskId)
  );

  if (dependentTasks.length > 0) {
    const dependentTaskNames = dependentTasks
      .map((task) => `"${task.name}" (ID: ${task.id})`)
      .join(", ");
    return {
      success: false,
      message: `This task cannot be deleted because the following tasks depend on it: ${dependentTaskNames}`,
    };
  }

  // Perform a delete operation
  tasks.splice(taskIndex, 1);
  await writeTasks(tasks, projectName);

  return { success: true, message: "Task deleted successfully" };
}

// Evaluating task complexity
export async function assessTaskComplexity(
  taskId: string,
  projectName?: string
): Promise<TaskComplexityAssessment | null> {
  const task = await getTaskById(taskId, projectName);

  if (!task) {
    return null;
  }

  // Evaluate various indicators
  const descriptionLength = task.description.length;
  const dependenciesCount = task.dependencies.length;
  const notesLength = task.notes ? task.notes.length : 0;
  const hasNotes = !!task.notes;

  // Evaluate complexity level based on various indicators
  let level = TaskComplexityLevel.LOW;

  // Description length evaluation
  if (
    descriptionLength >= TaskComplexityThresholds.DESCRIPTION_LENGTH.VERY_HIGH
  ) {
    level = TaskComplexityLevel.VERY_HIGH;
  } else if (
    descriptionLength >= TaskComplexityThresholds.DESCRIPTION_LENGTH.HIGH
  ) {
    level = TaskComplexityLevel.HIGH;
  } else if (
    descriptionLength >= TaskComplexityThresholds.DESCRIPTION_LENGTH.MEDIUM
  ) {
    level = TaskComplexityLevel.MEDIUM;
  }

  // Dependency Quantity Assessment (highest level)
  if (
    dependenciesCount >= TaskComplexityThresholds.DEPENDENCIES_COUNT.VERY_HIGH
  ) {
    level = TaskComplexityLevel.VERY_HIGH;
  } else if (
    dependenciesCount >= TaskComplexityThresholds.DEPENDENCIES_COUNT.HIGH &&
    level !== TaskComplexityLevel.VERY_HIGH
  ) {
    level = TaskComplexityLevel.HIGH;
  } else if (
    dependenciesCount >= TaskComplexityThresholds.DEPENDENCIES_COUNT.MEDIUM &&
    level !== TaskComplexityLevel.HIGH &&
    level !== TaskComplexityLevel.VERY_HIGH
  ) {
    level = TaskComplexityLevel.MEDIUM;
  }

  // Annotation length assessment (highest level)
  if (notesLength >= TaskComplexityThresholds.NOTES_LENGTH.VERY_HIGH) {
    level = TaskComplexityLevel.VERY_HIGH;
  } else if (
    notesLength >= TaskComplexityThresholds.NOTES_LENGTH.HIGH &&
    level !== TaskComplexityLevel.VERY_HIGH
  ) {
    level = TaskComplexityLevel.HIGH;
  } else if (
    notesLength >= TaskComplexityThresholds.NOTES_LENGTH.MEDIUM &&
    level !== TaskComplexityLevel.HIGH &&
    level !== TaskComplexityLevel.VERY_HIGH
  ) {
    level = TaskComplexityLevel.MEDIUM;
  }

  // Generate treatment suggestions based on complexity level
  const recommendations: string[] = [];

  // Low-complexity task suggestions
  if (level === TaskComplexityLevel.LOW) {
    recommendations.push("This task is of low complexity and can be executed directly");
    recommendations.push("It is recommended to set clear completion standards to ensure that there is a clear basis for acceptance");
  }
  // Recommendations for tasks of medium complexity
  else if (level === TaskComplexityLevel.MEDIUM) {
    recommendations.push("This task is somewhat complex, so it is recommended to plan the execution steps in detail");
    recommendations.push("Can be implemented in phases and progress checked regularly to ensure accurate understanding and complete implementation");
    if (dependenciesCount > 0) {
      recommendations.push("Pay attention to checking the completion status and output quality of all dependent tasks");
    }
  }
  // High-complexity task suggestions
  else if (level === TaskComplexityLevel.HIGH) {
    recommendations.push("This task is relatively complex, so it is recommended to conduct sufficient analysis and planning first.");
    recommendations.push("Consider breaking tasks into smaller, independently executable subtasks");
    recommendations.push("Establish clear milestones and checkpoints to track progress and quality");
    if (
      dependenciesCount > TaskComplexityThresholds.DEPENDENCIES_COUNT.MEDIUM
    ) {
      recommendations.push(
        "There are many dependent tasks. It is recommended to make a dependency diagram to ensure the correct execution order."
      );
    }
  }
  // Recommendations for very high complexity tasks
  else if (level === TaskComplexityLevel.VERY_HIGH) {
    recommendations.push("⚠️ This task is extremely complex and it is strongly recommended to split it into multiple independent tasks");
    recommendations.push(
      "Conduct detailed analysis and planning before execution, clearly defining the scope and interface of each subtask"
    );
    recommendations.push(
      "Conduct risk assessments on tasks, identify possible obstacles and develop response strategies"
    );
    recommendations.push("Establish specific testing and verification standards to ensure the output quality of each subtask");
    if (
      descriptionLength >= TaskComplexityThresholds.DESCRIPTION_LENGTH.VERY_HIGH
    ) {
      recommendations.push(
        "The task description is very long. It is recommended to sort out the key points and establish a structured execution checklist."
      );
    }
    if (dependenciesCount >= TaskComplexityThresholds.DEPENDENCIES_COUNT.HIGH) {
      recommendations.push(
        "There are too many dependent tasks. It is recommended to re-evaluate the task boundaries to ensure that the tasks are divided reasonably."
      );
    }
  }

  return {
    level,
    metrics: {
      descriptionLength,
      dependenciesCount,
      notesLength,
      hasNotes,
    },
    recommendations,
  };
}

  // Clear all tasks with protection options
export async function clearAllTasks(
  force: boolean = false,
  archive: boolean = true,
  projectName?: string
): Promise<{
  success: boolean;
  message: string;
  backupFile?: string;
  archivedTasks?: number;
}> {
  try {
    // Make sure the data directory exists
    await ensureDataDir();

    // Reading an existing task
    const allTasks = await readTasks(projectName);

    // If there is no task, return directly
    if (allTasks.length === 0) {
      return { success: true, message: "No tasks to clear" };
    }

    // Determine which tasks to archive based on options
    let tasksToArchive: Task[] = [];
    let tasksToDelete: Task[] = [];
    
    if (force) {
      // Force mode: archive all tasks (including completed ones)
      tasksToArchive = allTasks;
      tasksToDelete = [];
    } else if (archive) {
      // Archive mode: archive all tasks, don't delete anything
      tasksToArchive = allTasks;
      tasksToDelete = [];
    } else {
      // Legacy mode: only archive completed tasks
      tasksToArchive = allTasks.filter(
        (task) => task.status === TaskStatus.COMPLETED
      );
      tasksToDelete = allTasks.filter(
        (task) => task.status !== TaskStatus.COMPLETED
      );
    }

    // Create backup file name
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "");
    const backupFileName = `tasks_memory_${timestamp}.json`;

    // Make sure the memory directory exists
    const MEMORY_DIR = await getMemoryDir();
    try {
      await fs.access(MEMORY_DIR);
    } catch (error) {
      await fs.mkdir(MEMORY_DIR, { recursive: true });
    }

    // Create a backup path under the memory directory
    const memoryFilePath = path.join(MEMORY_DIR, backupFileName);

    // Archive tasks to memory
    if (tasksToArchive.length > 0) {
      await fs.writeFile(
        memoryFilePath,
        JSON.stringify({ tasks: tasksToArchive }, null, 2)
      );
    }

    // Clear task files (only if not in archive-only mode)
    if (tasksToDelete.length > 0 || !archive) {
      await writeTasks([], projectName);
    }

    return {
      success: true,
      message: `Task operation completed successfully. ${tasksToArchive.length} tasks archived to memory. ${tasksToDelete.length} tasks permanently deleted. Backup file: ${backupFileName}`,
      backupFile: backupFileName,
      archivedTasks: tasksToArchive.length,
    };
  } catch (error) {
    return {
      success: false,
      message: `An error occurred while clearing the task: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

// Searching the task memory using system commands
export async function searchTasksWithCommand(
  query: string,
  isId: boolean = false,
  page: number = 1,
  pageSize: number = 5,
  projectName?: string
): Promise<{
  tasks: Task[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasMore: boolean;
  };
}> {
  // Read the task in the current task file
  const currentTasks = await readTasks(projectName);
  let memoryTasks: Task[] = [];

  // Searching for tasks in the memory folder
  const MEMORY_DIR = projectName 
    ? await getProjectMemoryDirPath(projectName)
    : await getMemoryDir();

  try {
    // Make sure the memory folder exists
    await fs.access(MEMORY_DIR);

    // Generate search command
    const cmd = generateSearchCommand(query, isId, MEMORY_DIR);

    // If there is a search command, execute it
    if (cmd) {
      try {
        const { stdout } = await execPromise(cmd, {
          maxBuffer: 1024 * 1024 * 10,
        });

        if (stdout) {
          // Parse search results and extract matching file paths
          const matchedFiles = new Set<string>();

          stdout.split("\n").forEach((line) => {
            if (line.trim()) {
              // Format usually: filepath:matched_content
              const filePath = line.split(":")[0];
              if (filePath) {
                matchedFiles.add(filePath);
              }
            }
          });

          // Limit number of files to read
          const MAX_FILES_TO_READ = 10;
          const sortedFiles = Array.from(matchedFiles)
            .sort()
            .reverse()
            .slice(0, MAX_FILES_TO_READ);

          // Process only eligible files
          for (const filePath of sortedFiles) {
            try {
              const data = await fs.readFile(filePath, "utf-8");
              const tasks = JSON.parse(data).tasks || [];

              // Normalize date fields
              const formattedTasks = tasks.map((task: any) => ({
                ...task,
                createdAt: task.createdAt
                  ? new Date(task.createdAt)
                  : new Date(),
                updatedAt: task.updatedAt
                  ? new Date(task.updatedAt)
                  : new Date(),
                completedAt: task.completedAt
                  ? new Date(task.completedAt)
                  : undefined,
              }));

              // Further filter tasks to ensure they match
              const filteredTasks = isId
                ? formattedTasks.filter((task: Task) => task.id === query)
                : formattedTasks.filter((task: Task) => {
                    const keywords = query
                      .split(/\s+/)
                      .filter((k) => k.length > 0);
                    if (keywords.length === 0) return true;

                    return keywords.every((keyword) => {
                      const lowerKeyword = keyword.toLowerCase();
                      return (
                        task.name.toLowerCase().includes(lowerKeyword) ||
                        task.description.toLowerCase().includes(lowerKeyword) ||
                        (task.notes &&
                          task.notes.toLowerCase().includes(lowerKeyword)) ||
                        (task.implementationGuide &&
                          task.implementationGuide
                            .toLowerCase()
                            .includes(lowerKeyword)) ||
                        (task.summary &&
                          task.summary.toLowerCase().includes(lowerKeyword))
                      );
                    });
                  });

              memoryTasks.push(...filteredTasks);
            } catch (error: unknown) {}
          }
        }
      } catch (error: unknown) {}
    }
  } catch (error: unknown) {}

  // Filter matching tasks from current tasks
  const filteredCurrentTasks = filterCurrentTasks(currentTasks, query, isId);

  // Merge results and deduplicate
  const taskMap = new Map<string, Task>();

  // Prefer current tasks first
  filteredCurrentTasks.forEach((task) => {
    taskMap.set(task.id, task);
  });

  // Add memory tasks while avoiding duplicates
  memoryTasks.forEach((task) => {
    if (!taskMap.has(task.id)) {
      taskMap.set(task.id, task);
    }
  });

  // Combine into final result
  const allTasks = Array.from(taskMap.values());

  // Sort by updated or completed time (desc)
  allTasks.sort((a, b) => {
    // Prioritize by completion time
    if (a.completedAt && b.completedAt) {
      return b.completedAt.getTime() - a.completedAt.getTime();
    } else if (a.completedAt) {
      return -1; // a completed, b not
    } else if (b.completedAt) {
      return 1; // b completed, a not
    }

    // Otherwise sort by updated time
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  // Pagination
  const totalResults = allTasks.length;
  const totalPages = Math.ceil(totalResults / pageSize);
  const safePage = Math.max(1, Math.min(page, totalPages || 1)); // Ensure valid page
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalResults);
  const paginatedTasks = allTasks.slice(startIndex, endIndex);

  return {
    tasks: paginatedTasks,
    pagination: {
      currentPage: safePage,
      totalPages: totalPages || 1,
      totalResults,
      hasMore: safePage < totalPages,
    },
  };
}

// Generate appropriate search command by platform
function generateSearchCommand(
  query: string,
  isId: boolean,
  memoryDir: string
): string {
  // Safely escape user input
  const safeQuery = escapeShellArg(query);
  const keywords = safeQuery.split(/\s+/).filter((k) => k.length > 0);

  // Detect OS type
  const isWindows = process.platform === "win32";

  if (isWindows) {
    // Windows: use findstr
    if (isId) {
      // Search by ID
      return `findstr /s /i /c:"${safeQuery}" "${memoryDir}\\*.json"`;
    } else if (keywords.length === 1) {
      // Single keyword
      return `findstr /s /i /c:"${safeQuery}" "${memoryDir}\\*.json"`;
    } else {
      // Multiple keywords - use PowerShell
      const keywordPatterns = keywords.map((k) => `'${k}'`).join(" -and ");
      return `powershell -Command "Get-ChildItem -Path '${memoryDir}' -Filter *.json -Recurse | Select-String -Pattern ${keywordPatterns} | ForEach-Object { $_.Path }"`;
    }
  } else {
    // Unix/Linux/macOS: use grep
    if (isId) {
      return `grep -r --include="*.json" "${safeQuery}" "${memoryDir}"`;
    } else if (keywords.length === 1) {
      return `grep -r --include="*.json" "${safeQuery}" "${memoryDir}"`;
    } else {
      // Chain multiple grep commands for multiple keywords
      const firstKeyword = escapeShellArg(keywords[0]);
      const otherKeywords = keywords.slice(1).map((k) => escapeShellArg(k));

      let cmd = `grep -r --include="*.json" "${firstKeyword}" "${memoryDir}"`;
      for (const keyword of otherKeywords) {
        cmd += ` | grep "${keyword}"`;
      }
      return cmd;
    }
  }
}

/**
 * Safely escape shell arguments to prevent command injection
 */
function escapeShellArg(arg: string): string {
  if (!arg) return "";

  // Remove control and special shell characters
  return arg
    .replace(/[\x00-\x1F\x7F]/g, "") // control chars
    .replace(/[&;`$"'<>|]/g, ""); // shell specials
}

// Filter tasks in current list
function filterCurrentTasks(
  tasks: Task[],
  query: string,
  isId: boolean
): Task[] {
  if (isId) {
    return tasks.filter((task) => task.id === query);
  } else {
    const keywords = query.split(/\s+/).filter((k) => k.length > 0);
    if (keywords.length === 0) return tasks;

    return tasks.filter((task) => {
      return keywords.every((keyword) => {
        const lowerKeyword = keyword.toLowerCase();
        return (
          task.name.toLowerCase().includes(lowerKeyword) ||
          task.description.toLowerCase().includes(lowerKeyword) ||
          (task.notes && task.notes.toLowerCase().includes(lowerKeyword)) ||
          (task.implementationGuide &&
            task.implementationGuide.toLowerCase().includes(lowerKeyword)) ||
          (task.summary && task.summary.toLowerCase().includes(lowerKeyword))
        );
      });
    });
  }
}

// Restore archived tasks from memory
export async function restoreArchivedTasks(
  backupFileName: string,
  projectName?: string
): Promise<{
  success: boolean;
  message: string;
  restoredTasks: number;
}> {
  try {
    const MEMORY_DIR = projectName 
      ? await getProjectMemoryDirPath(projectName)
      : await getMemoryDir();
    const backupFilePath = path.join(MEMORY_DIR, backupFileName);
    
    // Check if backup file exists
    try {
      await fs.access(backupFilePath);
    } catch (error) {
      return {
        success: false,
        message: `Backup file ${backupFileName} not found in memory directory.`,
        restoredTasks: 0,
      };
    }
    
    // Read backup file
    const backupData = await fs.readFile(backupFilePath, "utf-8");
    const { tasks: archivedTasks } = JSON.parse(backupData);
    
    if (!archivedTasks || archivedTasks.length === 0) {
      return {
        success: false,
        message: "No tasks found in backup file.",
        restoredTasks: 0,
      };
    }
    
    // Read current tasks
    const currentTasks = await readTasks(projectName);
    
    // Merge archived tasks with current tasks (avoid duplicates by ID)
    const existingIds = new Set(currentTasks.map(task => task.id));
    const newTasks = archivedTasks.filter((task: Task) => !existingIds.has(task.id));
    
    if (newTasks.length === 0) {
      return {
        success: false,
        message: "All tasks in backup file already exist in current task list.",
        restoredTasks: 0,
      };
    }
    
    // Write merged tasks
    await writeTasks([...currentTasks, ...newTasks], projectName);
    
    return {
      success: true,
      message: `Successfully restored ${newTasks.length} tasks from backup file ${backupFileName}.`,
      restoredTasks: newTasks.length,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error restoring tasks: ${error instanceof Error ? error.message : String(error)}`,
      restoredTasks: 0,
    };
  }
}
