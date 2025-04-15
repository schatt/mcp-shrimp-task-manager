/**
 * reflectTask prompt 生成器
 * 負責將模板和參數組合成最終的 prompt
 */

import { loadPrompt, generatePrompt } from "../loader.js";
import * as templates from "../templates/reflectTask.js";

/**
 * reflectTask prompt 參數介面
 */
export interface ReflectTaskPromptParams {
  summary: string;
  analysis: string;
}

/**
 * 獲取 reflectTask 的完整 prompt
 * @param params prompt 參數
 * @returns 生成的 prompt
 */
export function getReflectTaskPrompt(params: ReflectTaskPromptParams): string {
  // 開始構建基本 prompt
  let basePrompt = generatePrompt(templates.reflectTaskTemplate, {
    summary: params.summary,
    analysis: params.analysis,
  });

  // 添加評估要點
  basePrompt += templates.evaluationPointsTemplate;

  // 添加決策點指導
  basePrompt += templates.decisionPointsTemplate;

  // 添加更新模式選擇指導
  basePrompt += templates.updateModesTemplate;

  // 添加知識傳遞機制指導
  basePrompt += templates.knowledgeTransferTemplate;

  // 添加任務過多處理指導
  basePrompt += templates.taskOverflowTemplate;

  // 添加結尾提醒
  basePrompt += templates.conclusionTemplate;

  // 載入可能的自定義 prompt
  return loadPrompt(basePrompt, "REFLECT_TASK");
}
