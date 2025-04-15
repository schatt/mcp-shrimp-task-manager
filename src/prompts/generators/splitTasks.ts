/**
 * splitTasks prompt 生成器
 * 負責將模板和參數組合成最終的 prompt
 */

import { loadPrompt, generatePrompt } from "../loader.js";
import * as templates from "../templates/splitTasks.js";
import { Task } from "../../types/index.js";

/**
 * splitTasks prompt 參數介面
 */
export interface SplitTasksPromptParams {
  updateMode: string;
  createdTasks: Task[];
  allTasks: Task[];
}

/**
 * 獲取更新模式描述
 * @param updateMode 更新模式
 * @returns 更新模式的描述文字
 */
function getUpdateModeDescription(updateMode: string): string {
  switch (updateMode) {
    case "overwrite":
      return "覆蓋未完成任務（已完成任務已保留）";
    case "selective":
      return "選擇性更新";
    case "append":
    default:
      return "新增至現有任務清單";
  }
}

/**
 * 格式化單個任務顯示內容
 * @param task 任務
 * @param index 任務索引
 * @param allTasks 所有任務列表，用於查找依賴任務名稱
 * @returns 格式化後的任務顯示文字
 */
function formatTaskItem(task: Task, index: number, allTasks: Task[]): string {
  // 處理注意事項
  const notes = task.notes ? `**注意事項:** ${task.notes}\n` : "";

  // 處理實現指南
  const implementationGuide = task.implementationGuide
    ? `**實現指南:** ${
        task.implementationGuide.length > 100
          ? task.implementationGuide.substring(0, 100) +
            "... (執行時可查看完整內容)"
          : task.implementationGuide
      }\n`
    : "";

  // 處理驗證標準
  const verificationCriteria = task.verificationCriteria
    ? `**驗證標準:** ${
        task.verificationCriteria.length > 100
          ? task.verificationCriteria.substring(0, 100) +
            "... (驗證時可查看完整內容)"
          : task.verificationCriteria
      }\n`
    : "";

  // 處理依賴任務
  const dependencies =
    task.dependencies && task.dependencies.length > 0
      ? `**依賴任務:** ${task.dependencies
          .map((d: any) => {
            // 查找依賴任務的名稱，提供更友好的顯示
            const depTask = allTasks.find((t) => t.id === d.taskId);
            return depTask
              ? `"${depTask.name}" (\`${d.taskId}\`)`
              : `\`${d.taskId}\``;
          })
          .join(", ")}\n`
      : "**依賴任務:** 無\n";

  // 使用模板生成任務項目
  return generatePrompt(templates.taskItemTemplate, {
    index: index + 1,
    name: task.name,
    id: task.id,
    description: task.description,
    notes,
    implementationGuide,
    verificationCriteria,
    dependencies,
  });
}

/**
 * 獲取 splitTasks 的完整 prompt
 * @param params prompt 參數
 * @returns 生成的 prompt
 */
export function getSplitTasksPrompt(params: SplitTasksPromptParams): string {
  // 開始構建基本 prompt
  let basePrompt = generatePrompt(templates.splitTasksTitleTemplate, {
    updateMode: params.updateMode,
  });

  // 添加更新模式描述
  basePrompt += generatePrompt(templates.updateModeDescriptionTemplate, {
    updateDescription: getUpdateModeDescription(params.updateMode),
  });

  // 添加拆分策略
  basePrompt += templates.splitStrategyTemplate;

  // 添加任務質量審核
  basePrompt += templates.qualityReviewTemplate;

  // 添加任務清單標題
  basePrompt += templates.taskListTitleTemplate;

  // 添加所有建立的任務
  basePrompt += params.createdTasks
    .map((task, index) => formatTaskItem(task, index, params.allTasks))
    .join("\n");

  // 添加空行
  basePrompt += "\n\n";

  // 添加依賴關係管理
  basePrompt += templates.dependencyManagementTemplate;
  basePrompt += templates.dependencyManagementContent1;
  basePrompt += templates.dependencyManagementContent2;
  basePrompt += templates.dependencyManagementContent3;
  basePrompt += templates.dependencyManagementContent4;

  // 添加決策點
  basePrompt += templates.decisionPointsTemplate;
  basePrompt += templates.decisionPointContent1;
  basePrompt += templates.decisionPointContent2;

  // 載入可能的自定義 prompt
  return loadPrompt(basePrompt, "SPLIT_TASKS");
}
