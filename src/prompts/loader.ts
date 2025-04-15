/**
 * prompt 載入器
 * 提供從環境變數載入自定義 prompt 的功能
 */

function processEnvString(input: string | undefined): string {
  if (!input) return "";

  return input
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r");
}

/**
 * 載入 prompt，支援環境變數自定義
 * @param basePrompt 基本 prompt 內容
 * @param promptKey prompt 的鍵名，用於生成環境變數名稱
 * @returns 最終的 prompt 內容
 */
export function loadPrompt(basePrompt: string, promptKey: string): string {
  // 轉換為大寫，作為環境變數的一部分
  const envKey = promptKey.toUpperCase();

  // 檢查是否有替換模式的環境變數
  const overrideEnvVar = `MCP_PROMPT_${envKey}`;
  if (process.env[overrideEnvVar]) {
    // 使用環境變數完全替換原始 prompt
    return processEnvString(process.env[overrideEnvVar]);
  }

  // 檢查是否有追加模式的環境變數
  const appendEnvVar = `MCP_PROMPT_${envKey}_APPEND`;
  if (process.env[appendEnvVar]) {
    // 將環境變數內容追加到原始 prompt 後
    return `${basePrompt}\n\n${processEnvString(process.env[appendEnvVar])}`;
  }

  // 如果沒有自定義，則使用原始 prompt
  return basePrompt;
}

/**
 * 生成包含動態參數的 prompt
 * @param promptTemplate prompt 模板
 * @param params 動態參數
 * @returns 填充參數後的 prompt
 */
export function generatePrompt(
  promptTemplate: string,
  params: Record<string, any> = {}
): string {
  // 使用簡單的模板替換方法，將 {paramName} 替換為對應的參數值
  let result = promptTemplate;

  Object.entries(params).forEach(([key, value]) => {
    // 如果值為 undefined 或 null，使用空字串替換
    const replacementValue =
      value !== undefined && value !== null ? String(value) : "";

    // 使用正則表達式替換所有匹配的佔位符
    const placeholder = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(placeholder, replacementValue);
  });

  return result;
}
