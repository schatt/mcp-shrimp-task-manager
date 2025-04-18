/**
 * initProjectRules prompt 生成器
 * 負責將模板和參數組合成最終的 prompt
 */

import { loadPrompt, generatePrompt } from "../loader.js";
import { initProjectRulesTemplate } from "../templates/initProjectRules.js";
import { getRulesFilePath } from "../../utils/pathUtils.js";
/**
 * initProjectRules prompt 參數介面
 */
export interface InitProjectRulesPromptParams {
  // 目前沒有額外參數，未來可按需擴展
}

/**
 * 獲取 initProjectRules 的完整 prompt
 * @param params prompt 參數（可選）
 * @returns 生成的 prompt
 */
export function getInitProjectRulesPrompt(
  params?: InitProjectRulesPromptParams
): string {
  // 使用基本模板
  const rulesPath = getRulesFilePath();
  const basePrompt = generatePrompt(initProjectRulesTemplate, {
    rulesPath,
  });

  // 載入可能的自定義 prompt (通過環境變數覆蓋或追加)
  return loadPrompt(basePrompt, "INIT_PROJECT_RULES");
}
