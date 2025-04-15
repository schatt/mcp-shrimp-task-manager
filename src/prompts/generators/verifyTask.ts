/**
 * verifyTask prompt 生成器
 * 負責將模板和參數組合成最終的 prompt
 */

import { loadPrompt, generatePrompt } from "../loader.js";
import * as templates from "../templates/verifyTask.js";
import { Task } from "../../types/index.js";

/**
 * verifyTask prompt 參數介面
 */
export interface VerifyTaskPromptParams {
  task: Task;
}

/**
 * 提取摘要內容
 * @param content 原始內容
 * @param maxLength 最大長度
 * @returns 提取的摘要
 */
function extractSummary(content: string, maxLength: number): string {
  if (!content) return "";

  if (content.length <= maxLength) {
    return content;
  }

  // 簡單的摘要提取：截取前 maxLength 個字符並添加省略號
  return content.substring(0, maxLength) + "...";
}

/**
 * 獲取 verifyTask 的完整 prompt
 * @param params prompt 參數
 * @returns 生成的 prompt
 */
export function getVerifyTaskPrompt(params: VerifyTaskPromptParams): string {
  const { task } = params;

  // 處理注意事項
  const notes = task.notes ? `**注意事項:** ${task.notes}\n` : "";

  // 開始構建基本 prompt
  let basePrompt = generatePrompt(templates.verifyTaskTemplate, {
    name: task.name,
    id: task.id,
    description: task.description,
    notes: notes,
  });

  // 添加任務特定的驗證標準（如果有）
  if (task.verificationCriteria) {
    basePrompt += generatePrompt(templates.verificationCriteriaTemplate, {
      verificationCriteria: task.verificationCriteria,
    });
  }

  // 添加實現指南摘要（如果有）
  if (task.implementationGuide) {
    const implementationGuideSummary =
      task.implementationGuide.length > 200
        ? task.implementationGuide.substring(0, 200) + "... (參見完整實現指南)"
        : task.implementationGuide;

    basePrompt += generatePrompt(templates.implementationGuideSummaryTemplate, {
      implementationGuideSummary: implementationGuideSummary,
    });
  }

  // 添加分析結果摘要（如果有）
  if (task.analysisResult) {
    basePrompt += generatePrompt(templates.analysisSummaryTemplate, {
      analysisSummary: extractSummary(task.analysisResult, 300),
    });
  }

  // 添加標準驗證標準
  basePrompt += templates.standardVerificationCriteriaTemplate;

  // 添加報告要求
  basePrompt += templates.reportRequirementsTemplate;

  // 添加決策點
  basePrompt += templates.decisionPointsTemplate;
  basePrompt += templates.decisionPoint1;
  basePrompt += templates.decisionPoint2;
  basePrompt += templates.decisionPoint3;

  // 載入可能的自定義 prompt
  return loadPrompt(basePrompt, "VERIFY_TASK");
}
