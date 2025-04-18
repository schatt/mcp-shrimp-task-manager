/**
 * planTask prompt 生成器
 * 負責將模板和參數組合成最終的 prompt
 */

import { loadPrompt, generatePrompt } from "../loader.js";
import * as templates from "../templates/planTask.js";
import { getRulesFilePath } from "../../utils/pathUtils.js";
import { Task, TaskDependency } from "../../types/index.js";

/**
 * planTask prompt 參數介面
 */
export interface PlanTaskPromptParams {
  description: string;
  requirements?: string;
  existingTasksReference?: boolean;
  completedTasks?: Task[];
  pendingTasks?: Task[];
  memoryDir: string;
}

/**
 * 獲取 planTask 的完整 prompt
 * @param params prompt 參數
 * @returns 生成的 prompt
 */
export function getPlanTaskPrompt(params: PlanTaskPromptParams): string {
  // 開始構建基本 prompt
  let basePrompt = generatePrompt(templates.planTaskTemplate, {
    description: params.description,
  });

  // 如果有 requirements，添加到 prompt 中
  if (params.requirements) {
    basePrompt += generatePrompt(templates.requirementsTemplate, {
      requirements: params.requirements,
    });
  }

  // 如果需要參考現有任務
  if (
    params.existingTasksReference &&
    params.completedTasks &&
    params.pendingTasks
  ) {
    const allTasks = [...params.completedTasks, ...params.pendingTasks];

    // 如果存在任務，則添加相關資訊
    if (allTasks.length > 0) {
      basePrompt += templates.existingTasksReferenceTemplate;

      // 處理已完成任務
      if (params.completedTasks.length > 0) {
        basePrompt += templates.completedTasksTitleTemplate;

        // 最多顯示10個已完成任務，避免提示詞過長
        const tasksToShow =
          params.completedTasks.length > 10
            ? params.completedTasks.slice(0, 10)
            : params.completedTasks;

        tasksToShow.forEach((task, index) => {
          // 產生完成時間資訊 (如果有)
          const completedTimeText = task.completedAt
            ? `   - 完成時間：${task.completedAt.toLocaleString()}\n`
            : "";

          // 使用模板生成任務顯示項目
          basePrompt += generatePrompt(templates.completedTaskItemTemplate, {
            index: index + 1,
            taskName: task.name,
            taskId: task.id,
            taskDescription:
              task.description.length > 100
                ? task.description.substring(0, 100) + "..."
                : task.description,
            completedTime: completedTimeText,
          });

          // 如果不是最後一個任務，添加換行
          if (index < tasksToShow.length - 1) {
            basePrompt += "\n\n";
          }
        });

        // 如果有更多任務，顯示提示
        if (params.completedTasks.length > 10) {
          basePrompt += `\n\n*（僅顯示前10個，共 ${params.completedTasks.length} 個）*\n`;
        }
      }

      // 處理未完成任務
      if (params.pendingTasks && params.pendingTasks.length > 0) {
        basePrompt += templates.pendingTasksTitleTemplate;

        params.pendingTasks.forEach((task, index) => {
          // 處理依賴關係 (如果有)
          const dependenciesText =
            task.dependencies && task.dependencies.length > 0
              ? `   - 依賴：${task.dependencies
                  .map((dep: TaskDependency) => `\`${dep.taskId}\``)
                  .join(", ")}\n`
              : "";

          // 使用模板生成未完成任務顯示項目
          basePrompt += generatePrompt(templates.pendingTaskItemTemplate, {
            index: index + 1,
            taskName: task.name,
            taskId: task.id,
            taskDescription:
              task.description.length > 150
                ? task.description.substring(0, 150) + "..."
                : task.description,
            taskStatus: task.status,
            dependencies: dependenciesText,
          });

          // 如果不是最後一個任務，添加換行
          if (index < (params.pendingTasks?.length ?? 0) - 1) {
            basePrompt += "\n\n";
          }
        });
      }

      // 添加任務調整原則
      basePrompt += templates.taskAdjustmentPrinciplesTemplate;
      basePrompt += templates.taskAdjustmentPrinciplesContent;
      basePrompt += templates.taskAdjustmentPrinciplesContent2;
      basePrompt += templates.taskAdjustmentPrinciplesContent3;
      basePrompt += templates.taskAdjustmentPrinciplesContent4;
      basePrompt += templates.taskAdjustmentPrinciplesContent5;

      // 添加任務更新模式指導
      basePrompt += templates.taskUpdateModesTemplate;
      basePrompt += templates.taskUpdateModesContent1;
      basePrompt += templates.taskUpdateModesContent1Detail;
      basePrompt += templates.taskUpdateModesContent1Usage;
      basePrompt += templates.taskUpdateModesContent2;
      basePrompt += templates.taskUpdateModesContent2Detail;
      basePrompt += templates.taskUpdateModesContent2Usage;
      basePrompt += templates.taskUpdateModesContent3;
      basePrompt += templates.taskUpdateModesContent3Detail;
      basePrompt += templates.taskUpdateModesContent3Usage;
      basePrompt += templates.taskUpdateModesContent3Mechanism;
    }
  }

  // 添加分析指引
  basePrompt += templates.analysisGuideTemplate;

  // 添加任務記憶檢索相關模板
  basePrompt += templates.memoryDirTemplate;
  basePrompt += generatePrompt(templates.memoryDirContent, {
    memoryDir: params.memoryDir,
  });
  basePrompt += templates.memoryDirUsageGuide;

  // 添加查詢建議
  basePrompt += templates.queryRecommendationsTemplate;
  basePrompt += templates.queryHighPriority;
  basePrompt += templates.queryHighPriorityItems;
  basePrompt += templates.queryHighPriorityItems2;
  basePrompt += templates.queryHighPriorityItems3;
  basePrompt += templates.queryHighPriorityItems4;
  basePrompt += templates.queryMediumPriority;
  basePrompt += templates.queryMediumPriorityItems;
  basePrompt += templates.queryMediumPriorityItems2;
  basePrompt += templates.queryMediumPriorityItems3;
  basePrompt += templates.queryLowPriority;
  basePrompt += templates.queryLowPriorityItems;
  basePrompt += templates.queryLowPriorityItems2;
  basePrompt += templates.queryLowPriorityItems3;
  basePrompt += templates.queryReminder;

  // 添加資訊收集指南
  basePrompt += templates.infoCollectionGuideTemplate;
  basePrompt += templates.infoCollectionGuideItems;
  basePrompt += templates.infoCollectionGuideItems2;
  basePrompt += templates.infoCollectionGuideItems3;

  const rulesPath = getRulesFilePath();
  // 添加下一步指導
  basePrompt += generatePrompt(templates.nextStepsTemplate, {
    rulesPath,
  });
  basePrompt += templates.nextStepsContent1;
  basePrompt += templates.nextStepsContent1Detail;

  if (process.env.ENABLE_THOUGHT_CHAIN !== "false") {
    basePrompt += templates.nextStepsThoughtTemplate;
    basePrompt += templates.nextStepsThoughtDetail1;
    basePrompt += templates.nextStepsThoughtDetail2;
  } else {
    basePrompt += templates.nextStepsContent2;
    basePrompt += templates.nextStepsContent2Detail1;
    basePrompt += templates.nextStepsContent2Detail2;
  }

  // 載入可能的自定義 prompt
  return loadPrompt(basePrompt, "PLAN_TASK");
}
