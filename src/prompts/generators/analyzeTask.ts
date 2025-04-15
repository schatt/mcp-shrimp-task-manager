/**
 * analyzeTask prompt 生成器
 * 負責將模板和參數組合成最終的 prompt
 */

import { loadPrompt, generatePrompt } from "../loader.js";
import * as templates from "../templates/analyzeTask.js";

/**
 * analyzeTask prompt 參數介面
 */
export interface AnalyzeTaskPromptParams {
  summary: string;
  initialConcept: string;
  previousAnalysis?: string;
}

/**
 * 獲取 analyzeTask 的完整 prompt
 * @param params prompt 參數
 * @returns 生成的 prompt
 */
export function getAnalyzeTaskPrompt(params: AnalyzeTaskPromptParams): string {
  // 開始構建基本 prompt
  let basePrompt = generatePrompt(templates.analyzeTaskTemplate, {
    summary: params.summary,
    initialConcept: params.initialConcept,
  });

  // 添加技術審核要點
  basePrompt += templates.technicalReviewTemplate;

  // 如果有前次分析結果，添加相關模板
  if (params.previousAnalysis) {
    basePrompt += generatePrompt(templates.iterationAnalysisTemplate, {
      previousAnalysis: params.previousAnalysis,
    });
  }

  // 添加下一步行動指導
  basePrompt += templates.nextActionTemplate;

  // 載入可能的自定義 prompt
  return loadPrompt(basePrompt, "ANALYZE_TASK");
}
