/**
 * listTasks prompt 生成器
 * 負責將模板和參數組合成最終的 prompt
 */

import { loadPrompt, generatePrompt } from "../loader.js";
import * as templates from "../templates/listTasks.js";
import { Task, TaskStatus } from "../../types/index.js";

/**
 * listTasks prompt 參數介面
 */
export interface ListTasksPromptParams {
  status: string;
  tasks: Record<string, Task[]>;
  allTasks: Task[];
}

/**
 * 獲取 listTasks 的完整 prompt
 * @param params prompt 參數
 * @returns 生成的 prompt
 */
export function getListTasksPrompt(params: ListTasksPromptParams): string {
  const { status, tasks, allTasks } = params;

  // 如果沒有任務，顯示通知
  if (allTasks.length === 0) {
    const statusText = status === "all" ? "任何" : `任何 ${status} 的`;
    return generatePrompt(templates.noTasksNoticeTemplate, {
      statusText: statusText,
    });
  }

  // 開始構建基本 prompt
  let basePrompt = templates.dashboardTitleTemplate;

  // 添加狀態概覽
  basePrompt += templates.statusOverviewTitleTemplate;

  // 獲取所有狀態的計數
  const statusCounts = Object.values(TaskStatus)
    .map((statusType) => {
      const count = tasks[statusType]?.length || 0;
      return generatePrompt(templates.statusCountTemplate, {
        status: statusType,
        count: count,
      });
    })
    .join("\n");

  basePrompt += `${statusCounts}\n\n`;

  let filterStatus = "all";
  switch (status) {
    case "pending":
      filterStatus = TaskStatus.PENDING;
      break;
    case "in_progress":
      filterStatus = TaskStatus.IN_PROGRESS;
      break;
    case "completed":
      filterStatus = TaskStatus.COMPLETED;
      break;
  }

  // 添加每個狀態下的詳細任務
  for (const statusType of Object.values(TaskStatus)) {
    const tasksWithStatus = tasks[statusType] || [];

    if (
      tasksWithStatus.length > 0 &&
      (filterStatus === "all" || filterStatus === statusType)
    ) {
      basePrompt += generatePrompt(templates.statusSectionTitleTemplate, {
        status: statusType,
        count: tasksWithStatus.length,
      });

      for (const task of tasksWithStatus) {
        basePrompt += formatTaskDetails(task);
      }
    }
  }

  // 載入可能的自定義 prompt
  return loadPrompt(basePrompt, "LIST_TASKS");
}

/**
 * 格式化任務詳情
 * @param task 任務
 * @returns 格式化後的任務詳情字串
 */
function formatTaskDetails(task: Task): string {
  // 此函數內容應來自原始的 formatTaskDetails 函數
  // 根據實際需求實現詳細的任務格式化邏輯
  let result = `### ${task.name}\n**ID:** \`${task.id}\`\n**描述:** ${task.description}\n`;

  if (task.status === TaskStatus.COMPLETED && task.summary) {
    result += `**完成摘要:** ${task.summary.substring(0, 100)}${
      task.summary.length > 100 ? "..." : ""
    }\n`;
  }

  if (task.dependencies && task.dependencies.length > 0) {
    result += `**依賴:** ${task.dependencies
      .map((d) => `\`${d.taskId}\``)
      .join(", ")}\n`;
  }

  result += `**創建時間:** ${new Date(task.createdAt).toLocaleString()}\n`;

  if (task.status === TaskStatus.COMPLETED && task.completedAt) {
    result += `**完成時間:** ${new Date(task.completedAt).toLocaleString()}\n`;
  }

  result += "\n";

  return result;
}
