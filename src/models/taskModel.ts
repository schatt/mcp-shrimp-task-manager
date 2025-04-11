import { Task, TaskStatus, TaskDependency } from "../types/index.js";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

// 確保獲取專案資料夾路徑
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");

// 數據文件路徑
const DATA_DIR = process.env.DATA_DIR || path.join(PROJECT_ROOT, "data");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");

// 確保數據目錄存在
async function ensureDataDir() {
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

// 讀取所有任務
async function readTasks(): Promise<Task[]> {
  await ensureDataDir();
  const data = await fs.readFile(TASKS_FILE, "utf-8");
  const tasks = JSON.parse(data).tasks;

  // 將日期字串轉換回 Date 物件
  return tasks.map((task: any) => ({
    ...task,
    createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
    updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
    completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
  }));
}

// 寫入所有任務
async function writeTasks(tasks: Task[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TASKS_FILE, JSON.stringify({ tasks }, null, 2));
}

// 獲取所有任務
export async function getAllTasks(): Promise<Task[]> {
  return await readTasks();
}

// 根據ID獲取任務
export async function getTaskById(taskId: string): Promise<Task | null> {
  const tasks = await readTasks();
  return tasks.find((task) => task.id === taskId) || null;
}

// 創建新任務
export async function createTask(
  name: string,
  description: string,
  notes?: string,
  dependencies: string[] = []
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
  };

  tasks.push(newTask);
  await writeTasks(tasks);

  return newTask;
}

// 更新任務
export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<Task | null> {
  const tasks = await readTasks();
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return null;
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updates,
    updatedAt: new Date(),
  };

  await writeTasks(tasks);

  return tasks[taskIndex];
}

// 更新任務狀態
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

// 批量創建或更新任務
export async function batchCreateOrUpdateTasks(
  taskDataList: Array<{
    name: string;
    description: string;
    notes?: string;
    dependencies?: string[];
  }>,
  isOverwrite: boolean
): Promise<Task[]> {
  // 獲取現有任務，建立名稱到ID的映射
  const existingTasks = isOverwrite ? [] : await readTasks();
  const nameToIdMap = new Map<string, string>();

  // 添加現有任務到映射表
  existingTasks.forEach((task) => {
    nameToIdMap.set(task.name, task.id);
  });

  if (isOverwrite) {
    // 覆蓋模式：刪除所有現有任務
    await writeTasks([]);
  }

  // 第一階段：創建所有任務，但不設置依賴
  const firstPassTasks: Array<{ task: Task; originalDeps: string[] }> = [];

  for (const taskData of taskDataList) {
    // 創建任務，暫時不設置依賴
    const newTask = await createTask(
      taskData.name,
      taskData.description,
      taskData.notes,
      [] // 空依賴列表
    );

    // 將新任務添加到映射表
    nameToIdMap.set(newTask.name, newTask.id);

    // 保存原始依賴信息
    firstPassTasks.push({
      task: newTask,
      originalDeps: taskData.dependencies || [],
    });
  }

  // 第二階段：更新所有任務的依賴關係
  const finalTasks: Task[] = [];

  for (const { task, originalDeps } of firstPassTasks) {
    // 解析依賴關係
    const resolvedDependencies: TaskDependency[] = [];

    for (const dep of originalDeps) {
      // 嘗試將依賴名稱解析為ID
      let depId = dep;

      // 如果不是UUID格式，嘗試將其作為任務名稱解析
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          dep
        )
      ) {
        const resolvedId = nameToIdMap.get(dep);
        if (resolvedId) {
          depId = resolvedId;
        } else {
          console.warn(`警告：找不到名為 "${dep}" 的任務，已忽略此依賴`);
          continue; // 跳過此依賴
        }
      }

      resolvedDependencies.push({ taskId: depId });
    }

    // 更新任務的依賴
    const updatedTask = await updateTask(task.id, {
      dependencies: resolvedDependencies,
    });

    if (updatedTask) {
      finalTasks.push(updatedTask);
    } else {
      finalTasks.push(task); // 回退到原始任務
    }
  }

  return finalTasks;
}

// 檢查任務是否可以執行（所有依賴都已完成）
export async function canExecuteTask(
  taskId: string
): Promise<{ canExecute: boolean; blockedBy?: string[] }> {
  const task = await getTaskById(taskId);

  if (!task) {
    return { canExecute: false };
  }

  if (task.status === TaskStatus.COMPLETED) {
    return { canExecute: false }; // 已完成的任務不需要再執行
  }

  if (task.dependencies.length === 0) {
    return { canExecute: true }; // 沒有依賴的任務可以直接執行
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
    return { success: false, message: "找不到指定任務" };
  }

  // 檢查任務狀態，已完成的任務不允許刪除
  if (tasks[taskIndex].status === TaskStatus.COMPLETED) {
    return { success: false, message: "無法刪除已完成的任務" };
  }

  // 檢查是否有其他任務依賴此任務
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
      message: `無法刪除此任務，因為以下任務依賴於它: ${dependentTaskNames}`,
    };
  }

  // 執行刪除操作
  tasks.splice(taskIndex, 1);
  await writeTasks(tasks);

  return { success: true, message: "任務刪除成功" };
}
