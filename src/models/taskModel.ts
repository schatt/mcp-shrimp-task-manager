import {
  Task,
  TaskStatus,
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
import { getDataDir, getTasksFilePath, getMemoryDir } from "../utils/paths.js";

// Make sure to get the project folder path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");

// Data file path (changed to asynchronous acquisition)
// const DATA_DIR = getDataDir();
// const TASKS_FILE = getTasksFilePath();

// Convert exec to Promise
const execPromise = promisify(exec);

// Make sure the data directory exists
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
async function readTasks(): Promise<Task[]> {
  await ensureDataDir();
  const TASKS_FILE = await getTasksFilePath();
  const data = await fs.readFile(TASKS_FILE, "utf-8");
  const tasks = JSON.parse(data).tasks;

  // Convert a date string back to a Date object
  return tasks.map((task: any) => ({
    ...task,
    createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
    updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
    completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
  }));
}

// Write all tasks
async function writeTasks(tasks: Task[]): Promise<void> {
  await ensureDataDir();
  const TASKS_FILE = await getTasksFilePath();
  await fs.writeFile(TASKS_FILE, JSON.stringify({ tasks }, null, 2));
}

// Get all tasks
export async function getAllTasks(): Promise<Task[]> {
  return await readTasks();
}

// Get a task by ID
export async function getTaskById(taskId: string): Promise<Task | null> {
  const tasks = await readTasks();
  return tasks.find((task) => task.id === taskId) || null;
}

// Create a new task
export async function createTask(
  name: string,
  description: string,
  notes?: string,
  dependencies: string[] = [],
  relatedFiles?: RelatedFile[]
): Promise<Task> {
  const tasks = await readTasks();

  const dependencyObjects: TaskDependency[] = dependencies.map((taskId) => ({
    taskId,
  }));

  const newTask: Task = {
    id: uuidv4(),
    name,
    description,
    notes,
    status: TaskStatus.PENDING,
    dependencies: dependencyObjects,
    createdAt: new Date(),
    updatedAt: new Date(),
    relatedFiles,
  };

  tasks.push(newTask);
  await writeTasks(tasks);

  return newTask;
}

// Update Tasks
export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<Task | null> {
  const tasks = await readTasks();
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return null;
  }

  // Check if the task is completed. Completed tasks are not allowed to be updated (unless it is a field that is explicitly allowed)
  if (tasks[taskIndex].status === TaskStatus.COMPLETED) {
    // Only update of summary field (task summary) and relatedFiles field is allowed
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

  await writeTasks(tasks);

  return tasks[taskIndex];
}

// Update task status
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<Task | null> {
  const updates: Partial<Task> = { status };

  if (status === TaskStatus.COMPLETED) {
    updates.completedAt = new Date();
  }

  return await updateTask(taskId, updates);
}

// Update Task Summary
export async function updateTaskSummary(
  taskId: string,
  summary: string
): Promise<Task | null> {
  return await updateTask(taskId, { summary });
}

// Update mission content
export async function updateTaskContent(
  taskId: string,
  updates: {
    name?: string;
    description?: string;
    notes?: string;
    relatedFiles?: RelatedFile[];
    dependencies?: string[];
    implementationGuide?: string;
    verificationCriteria?: string;
  }
): Promise<{ success: boolean; message: string; task?: Task }> {
  // Get the task and check if it exists
  const task = await getTaskById(taskId);

  if (!task) {
    return { success: false, message: "The specified task could not be found" };
  }

  // 檢查任務是否已完成
  if (task.status === TaskStatus.COMPLETED) {
    return { success: false, message: "Unable to update completed tasks" };
  }

  // Construct the update object, including only the fields that actually need to be updated
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

  // If there is no content to update, return early
  if (Object.keys(updateObj).length === 0) {
    return { success: true, message: "No content was provided that needed updating", task };
  }

  // Performing Updates
  const updatedTask = await updateTask(taskId, updateObj);

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
  relatedFiles: RelatedFile[]
): Promise<{ success: boolean; message: string; task?: Task }> {
  // Get the task and check if it exists
  const task = await getTaskById(taskId);

  if (!task) {
    return { success: false, message: "The specified task could not be found" };
  }

  // Check if the task is completed
  if (task.status === TaskStatus.COMPLETED) {
    return { success: false, message: "Unable to update completed tasks" };
  }

  // Performing Updates
  const updatedTask = await updateTask(taskId, { relatedFiles });

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
    implementationGuide?: string; // New: Implementation Guide
    verificationCriteria?: string; // New: Validation criteria
  }>,
  updateMode: "append" | "overwrite" | "selective" | "clearAllTasks", // Required parameter, specifies the task update strategy
  globalAnalysisResult?: string // New: Global analysis results
): Promise<Task[]> {
  // Read all existing tasks
  const existingTasks = await readTasks();

  // Process existing tasks according to update mode
  let tasksToKeep: Task[] = [];

  if (updateMode === "append") {
    // Append mode: keep all existing tasks
    tasksToKeep = [...existingTasks];
  } else if (updateMode === "overwrite") {
    // Overwrite mode: only keep completed tasks and clear all unfinished tasks
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

  // This map will be used to store the mapping of names to task IDs, to support referencing tasks by name.
  const taskNameToIdMap = new Map<string, string>();

  // For selective update mode, first record the name and ID of the existing task
  if (updateMode === "selective") {
    existingTasks.forEach((task) => {
      taskNameToIdMap.set(task.name, task.id);
    });
  }

  // Record the names and IDs of all tasks, whether they are to be retained or newly created
  // This will be used to resolve dependencies later
  tasksToKeep.forEach((task) => {
    taskNameToIdMap.set(task.name, task.id);
  });

  // Create a list of new tasks
  const newTasks: Task[] = [];

  for (const taskData of taskDataList) {
    // Checks whether the task is in selective update mode and the task name already exists
    if (updateMode === "selective" && taskNameToIdMap.has(taskData.name)) {
      // Get the ID of an existing task
      const existingTaskId = taskNameToIdMap.get(taskData.name)!;

      // Find existing tasks
      const existingTaskIndex = existingTasks.findIndex(
        (task) => task.id === existingTaskId
      );

      // If an existing task is found and it is not completed, update it
      if (
        existingTaskIndex !== -1 &&
        existingTasks[existingTaskIndex].status !== TaskStatus.COMPLETED
      ) {
        const taskToUpdate = existingTasks[existingTaskIndex];

        // Update the basic information of the task, but keep the original ID, creation time, etc.
        const updatedTask: Task = {
          ...taskToUpdate,
          name: taskData.name,
          description: taskData.description,
          notes: taskData.notes,
          // Will deal with it later dependencies
          updatedAt: new Date(),
          // New: Save implementation guide (if any)
          implementationGuide: taskData.implementationGuide,
          // New: Save validation criteria (if any)
          verificationCriteria: taskData.verificationCriteria,
          // New: Save global analysis results (if any)
          analysisResult: globalAnalysisResult,
        };

        // Process related documents (if any)
        if (taskData.relatedFiles) {
          updatedTask.relatedFiles = taskData.relatedFiles;
        }

        // Add the updated task to the new task list
        newTasks.push(updatedTask);

        // Remove this task from tasksToKeep because it has been updated and added to newTasks
        tasksToKeep = tasksToKeep.filter((task) => task.id !== existingTaskId);
      }
    } else {
      // Create a new task
      const newTaskId = uuidv4();

      // Add the name and ID of the new task to the map
      taskNameToIdMap.set(taskData.name, newTaskId);

      const newTask: Task = {
        id: newTaskId,
        name: taskData.name,
        description: taskData.description,
        notes: taskData.notes,
        status: TaskStatus.PENDING,
        dependencies: [], // Will fill later
        createdAt: new Date(),
        updatedAt: new Date(),
        relatedFiles: taskData.relatedFiles,
        // New: Save implementation guide (if any)
        implementationGuide: taskData.implementationGuide,
        // New: Save validation criteria (if any)
        verificationCriteria: taskData.verificationCriteria,
        // New: Save global analysis results (if any)
        analysisResult: globalAnalysisResult,
      };

      newTasks.push(newTask);
    }
  }

  // Handling dependencies between tasks
  for (let i = 0; i < taskDataList.length; i++) {
    const taskData = taskDataList[i];
    const newTask = newTasks[i];

    // If there are dependencies, handle them
    if (taskData.dependencies && taskData.dependencies.length > 0) {
      const resolvedDependencies: TaskDependency[] = [];

      for (const dependencyName of taskData.dependencies) {
        // First try to interpret the dependencies as task IDs
        let dependencyTaskId = dependencyName;

        // If the dependency does not look like a UUID, try to interpret it as a task name
        if (
          !dependencyName.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          )
        ) {
          // If the name exists in the map, the corresponding ID is used
          if (taskNameToIdMap.has(dependencyName)) {
            dependencyTaskId = taskNameToIdMap.get(dependencyName)!;
          } else {
            continue; //Skip this dependency
          }
        } else {
          // It is in UUID format, but you need to confirm whether this ID corresponds to an actual task.
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

  // Merge the retained tasks and the new tasks
  const allTasks = [...tasksToKeep, ...newTasks];

  // Write the updated task list
  await writeTasks(allTasks);

  return newTasks;
}

// Check if the task is executable (all dependencies are complete)
export async function canExecuteTask(
  taskId: string
): Promise<{ canExecute: boolean; blockedBy?: string[] }> {
  const task = await getTaskById(taskId);

  if (!task) {
    return { canExecute: false };
  }

  if (task.status === TaskStatus.COMPLETED) {
    return { canExecute: false }; // Completed tasks do not need to be performed again
  }

  if (task.dependencies.length === 0) {
    return { canExecute: true }; // Tasks without dependencies can be executed directly
  }

  const allTasks = await readTasks();
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

// 刪除任務
export async function deleteTask(
  taskId: string
): Promise<{ success: boolean; message: string }> {
  const tasks = await readTasks();
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
  await writeTasks(tasks);

  return { success: true, message: "Task deleted successfully" };
}

// Evaluating task complexity
export async function assessTaskComplexity(
  taskId: string
): Promise<TaskComplexityAssessment | null> {
  const task = await getTaskById(taskId);

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
  // 高複雜度任務建議
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
  // 極高複雜度任務建議
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

// 清除所有任務
export async function clearAllTasks(): Promise<{
  success: boolean;
  message: string;
  backupFile?: string;
}> {
  try {
    // Make sure the data directory exists
    await ensureDataDir();

    // Reading an existing task
    const allTasks = await readTasks();

    // If there is no task, return directly
    if (allTasks.length === 0) {
      return { success: true, message: "No tasks to clear" };
    }

    // Filter completed tasks
    const completedTasks = allTasks.filter(
      (task) => task.status === TaskStatus.COMPLETED
    );

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

    // Also write to the memory directory (only contains completed tasks)
    await fs.writeFile(
      memoryFilePath,
      JSON.stringify({ tasks: completedTasks }, null, 2)
    );

    // Clear task files
    await writeTasks([]);

    return {
      success: true,
      message: `All tasks have been successfully cleared. A total of ${allTasks.length} tasks have been deleted. ${completedTasks.length} completed tasks have been backed up to the memory directory.`,
      backupFile: backupFileName,
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
  pageSize: number = 5
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
  const currentTasks = await readTasks();
  let memoryTasks: Task[] = [];

  // Searching for tasks in the memory folder
  const MEMORY_DIR = await getMemoryDir();

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
          // 解析搜尋結果，提取符合的檔案路徑
          const matchedFiles = new Set<string>();

          stdout.split("\n").forEach((line) => {
            if (line.trim()) {
              // 格式通常是: 文件路徑:匹配內容
              const filePath = line.split(":")[0];
              if (filePath) {
                matchedFiles.add(filePath);
              }
            }
          });

          // 限制讀取檔案數量
          const MAX_FILES_TO_READ = 10;
          const sortedFiles = Array.from(matchedFiles)
            .sort()
            .reverse()
            .slice(0, MAX_FILES_TO_READ);

          // 只處理符合條件的檔案
          for (const filePath of sortedFiles) {
            try {
              const data = await fs.readFile(filePath, "utf-8");
              const tasks = JSON.parse(data).tasks || [];

              // 格式化日期字段
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

              // 進一步過濾任務確保符合條件
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

  // 從當前任務中過濾符合條件的任務
  const filteredCurrentTasks = filterCurrentTasks(currentTasks, query, isId);

  // 合併結果並去重
  const taskMap = new Map<string, Task>();

  // 當前任務優先
  filteredCurrentTasks.forEach((task) => {
    taskMap.set(task.id, task);
  });

  // 加入記憶任務，避免重複
  memoryTasks.forEach((task) => {
    if (!taskMap.has(task.id)) {
      taskMap.set(task.id, task);
    }
  });

  // 合併後的結果
  const allTasks = Array.from(taskMap.values());

  // 排序 - 按照更新或完成時間降序排列
  allTasks.sort((a, b) => {
    // 優先按完成時間排序
    if (a.completedAt && b.completedAt) {
      return b.completedAt.getTime() - a.completedAt.getTime();
    } else if (a.completedAt) {
      return -1; // a完成了但b未完成，a排前面
    } else if (b.completedAt) {
      return 1; // b完成了但a未完成，b排前面
    }

    // 否則按更新時間排序
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  // 分頁處理
  const totalResults = allTasks.length;
  const totalPages = Math.ceil(totalResults / pageSize);
  const safePage = Math.max(1, Math.min(page, totalPages || 1)); // 確保頁碼有效
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

// 根據平台生成適當的搜尋命令
function generateSearchCommand(
  query: string,
  isId: boolean,
  memoryDir: string
): string {
  // 安全地轉義用戶輸入
  const safeQuery = escapeShellArg(query);
  const keywords = safeQuery.split(/\s+/).filter((k) => k.length > 0);

  // 檢測操作系統類型
  const isWindows = process.platform === "win32";

  if (isWindows) {
    // Windows環境，使用findstr命令
    if (isId) {
      // ID搜尋
      return `findstr /s /i /c:"${safeQuery}" "${memoryDir}\\*.json"`;
    } else if (keywords.length === 1) {
      // 單一關鍵字
      return `findstr /s /i /c:"${safeQuery}" "${memoryDir}\\*.json"`;
    } else {
      // 多關鍵字搜尋 - Windows中使用PowerShell
      const keywordPatterns = keywords.map((k) => `'${k}'`).join(" -and ");
      return `powershell -Command "Get-ChildItem -Path '${memoryDir}' -Filter *.json -Recurse | Select-String -Pattern ${keywordPatterns} | ForEach-Object { $_.Path }"`;
    }
  } else {
    // Unix/Linux/MacOS環境，使用grep命令
    if (isId) {
      return `grep -r --include="*.json" "${safeQuery}" "${memoryDir}"`;
    } else if (keywords.length === 1) {
      return `grep -r --include="*.json" "${safeQuery}" "${memoryDir}"`;
    } else {
      // 多關鍵字用管道連接多個grep命令
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
 * 安全地轉義shell參數，防止命令注入
 */
function escapeShellArg(arg: string): string {
  if (!arg) return "";

  // 移除所有控制字符和特殊字符
  return arg
    .replace(/[\x00-\x1F\x7F]/g, "") // 控制字符
    .replace(/[&;`$"'<>|]/g, ""); // Shell 特殊字符
}

// 過濾當前任務列表
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
