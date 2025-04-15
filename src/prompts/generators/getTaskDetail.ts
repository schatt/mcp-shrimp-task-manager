/**
 * getTaskDetail prompt 生成器
 * 負責將模板和參數組合成最終的 prompt
 */

import { loadPrompt, generatePrompt } from "../loader.js";
import * as templates from "../templates/getTaskDetail.js";
import { Task, RelatedFile } from "../../types/index.js";

/**
 * getTaskDetail prompt 參數介面
 */
export interface GetTaskDetailPromptParams {
  taskId: string;
  task?: Task | null;
  error?: string;
}

/**
 * 獲取 getTaskDetail 的完整 prompt
 * @param params prompt 參數
 * @returns 生成的 prompt
 */
export function getGetTaskDetailPrompt(
  params: GetTaskDetailPromptParams
): string {
  const { taskId, task, error } = params;

  // 如果有錯誤，顯示錯誤訊息
  if (error) {
    return generatePrompt(templates.errorTemplate, {
      errorMessage: error,
    });
  }

  // 如果找不到任務，顯示找不到任務的訊息
  if (!task) {
    return generatePrompt(templates.taskNotFoundTemplate, {
      taskId,
    });
  }

  // 開始構建基本 prompt
  let basePrompt = templates.taskDetailTitleTemplate;

  // 添加任務基本信息
  basePrompt += generatePrompt(templates.taskBasicInfoTemplate, {
    name: task.name,
    id: task.id,
    status: task.status,
    description: task.description,
  });

  // 添加注記（如果有）
  if (task.notes) {
    basePrompt += generatePrompt(templates.taskNotesTemplate, {
      notes: task.notes,
    });
  }

  // 添加依賴任務（如果有）
  if (task.dependencies && task.dependencies.length > 0) {
    basePrompt += generatePrompt(templates.taskDependenciesTemplate, {
      dependencies: task.dependencies
        .map((dep) => `\`${dep.taskId}\``)
        .join(", "),
    });
  }

  // 添加實現指南（如果有）
  if (task.implementationGuide) {
    basePrompt += generatePrompt(templates.taskImplementationGuideTemplate, {
      implementationGuide: task.implementationGuide,
    });
  }

  // 添加驗證標準（如果有）
  if (task.verificationCriteria) {
    basePrompt += generatePrompt(templates.taskVerificationCriteriaTemplate, {
      verificationCriteria: task.verificationCriteria,
    });
  }

  // 添加相關文件（如果有）
  if (task.relatedFiles && task.relatedFiles.length > 0) {
    const fileItems = task.relatedFiles
      .map((file) =>
        generatePrompt(templates.taskRelatedFileItemTemplate, {
          path: file.path,
          type: file.type,
          description: file.description ? `: ${file.description}` : "",
        })
      )
      .join("\n");

    basePrompt += generatePrompt(templates.taskRelatedFilesTemplate, {
      files: fileItems,
    });
  }

  // 添加時間信息
  basePrompt += generatePrompt(templates.taskTimeInfoTemplate, {
    createdTime: new Date(task.createdAt).toLocaleString("zh-TW"),
    updatedTime: new Date(task.updatedAt).toLocaleString("zh-TW"),
  });

  // 添加完成時間（如果有）
  if (task.completedAt) {
    basePrompt += generatePrompt(templates.taskCompletedTimeTemplate, {
      completedTime: new Date(task.completedAt).toLocaleString("zh-TW"),
    });
  }

  // 添加完成摘要（如果有）
  if (task.summary) {
    basePrompt += generatePrompt(templates.taskSummaryTemplate, {
      summary: task.summary,
    });
  }

  // 載入可能的自定義 prompt
  return loadPrompt(basePrompt, "GET_TASK_DETAIL");
}
