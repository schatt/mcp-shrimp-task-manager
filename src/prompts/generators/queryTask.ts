/**
 * queryTask prompt 生成器
 * 負責將模板和參數組合成最終的 prompt
 */

import { loadPrompt, generatePrompt } from "../loader.js";
import * as templates from "../templates/queryTask.js";
import { Task } from "../../types/index.js";

/**
 * queryTask prompt 參數介面
 */
export interface QueryTaskPromptParams {
  query: string;
  isId: boolean;
  tasks: Task[];
  totalTasks: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 獲取 queryTask 的完整 prompt
 * @param params prompt 參數
 * @returns 生成的 prompt
 */
export function getQueryTaskPrompt(params: QueryTaskPromptParams): string {
  const { query, isId, tasks, totalTasks, page, pageSize, totalPages } = params;

  // 初始化基本 prompt
  let basePrompt = generatePrompt(templates.searchHeaderTemplate, {
    query,
    searchMode: isId
      ? templates.searchModeIdTemplate
      : templates.searchModeKeywordTemplate,
    totalTasks,
  });

  // 如果沒有找到任務
  if (tasks.length === 0) {
    basePrompt += generatePrompt(
      isId ? templates.noResultsIdTemplate : templates.noResultsKeywordTemplate,
      { query }
    );
    return loadPrompt(basePrompt, "QUERY_TASK");
  }

  // 添加任務列表
  basePrompt += templates.resultListHeaderTemplate;

  // 格式化找到的任務
  for (const task of tasks) {
    basePrompt += formatTaskSummary(task);
  }

  // 添加分頁信息
  if (totalPages > 1) {
    basePrompt += generatePrompt(templates.paginationInfoTemplate, {
      page,
      totalPages,
      pageSize,
      totalTasks,
    });
  }

  // 添加使用提示
  basePrompt += templates.usageHintTemplate;

  // 載入可能的自定義 prompt
  return loadPrompt(basePrompt, "QUERY_TASK");
}

/**
 * 格式化任務摘要
 * @param task 任務對象
 * @returns 格式化後的任務摘要字串
 */
function formatTaskSummary(task: Task): string {
  // 簡化版的任務摘要，比完整格式更精簡
  let result = generatePrompt(templates.taskSummaryTemplate, {
    taskId: task.id,
    taskName: task.name,
    taskStatus: task.status,
    taskDescription:
      task.description.length > 100
        ? `${task.description.substring(0, 100)}...`
        : task.description,
    createdAt: new Date(task.createdAt).toLocaleString(),
    completedAt: task.completedAt
      ? new Date(task.completedAt).toLocaleString()
      : "尚未完成",
  });

  return result;
}
