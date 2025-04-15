/**
 * completeTask prompt 生成器
 * 負責將模板和參數組合成最終的 prompt
 */

import { loadPrompt, generatePrompt } from "../loader.js";
import * as templates from "../templates/completeTask.js";
import { Task } from "../../types/index.js";

/**
 * completeTask prompt 參數介面
 */
export interface CompleteTaskPromptParams {
  task: Task;
  completionTime: string;
}

/**
 * 獲取 completeTask 的完整 prompt
 * @param params prompt 參數
 * @returns 生成的 prompt
 */
export function getCompleteTaskPrompt(
  params: CompleteTaskPromptParams
): string {
  const { task, completionTime } = params;

  // 開始構建基本 prompt
  let basePrompt = generatePrompt(templates.completeTaskConfirmationTemplate, {
    name: task.name,
    id: task.id,
    completionTime: completionTime,
  });

  // 添加任務摘要要求
  basePrompt += templates.taskSummaryRequirementsTemplate;

  // 添加重要提示
  basePrompt += templates.importantReminderTemplate;

  // 添加連續執行模式提示
  basePrompt += templates.continuousModeReminderTemplate;

  // 載入可能的自定義 prompt
  return loadPrompt(basePrompt, "COMPLETE_TASK");
}
