/**
 * 任務執行 prompt 模板
 * 包含所有用於構建完整 executeTask prompt 的模板片段
 */

// 基本任務執行模板
export const executeTaskTemplate = `## 任務執行\n\n**名稱:** {name}\n**ID:** \`{id}\`\n**描述:** {description}\n{notes}\n`;

// 實現指南模板
export const implementationGuideTemplate = `\n## 實現指南\n\n{implementationGuide}\n\n`;

// 驗證標準模板
export const verificationCriteriaTemplate = `\n## 驗證標準\n\n{verificationCriteria}\n\n`;

// 分析背景模板
export const analysisResultTemplate = `\n## 分析背景\n\n{analysisResult}\n\n`;

// 相關文件模板
export const relatedFilesSummaryTemplate = `## 相關文件\n\n{relatedFilesSummary}\n\n`;

// 相關文件未指定模板
export const noRelatedFilesTemplate = `## 相關文件\n\n當前任務沒有關聯的文件。可以使用 \`update_task_files\` 工具添加相關文件，以便在執行任務時提供上下文。`;

// 推薦相關文件模板
export const recommendedFilesTemplate = `\n\n### 推薦操作\n基於任務描述，您可能需要查看以下相關文件：\n{potentialFiles}\n使用 update_task_files 工具關聯相關文件，以獲得更好的上下文記憶支持。`;

// 依賴任務完成摘要模板
export const dependencyTaskSummaryTemplate = `\n## 依賴任務完成摘要\n\n`;

// 單個依賴任務摘要模板
export const dependencyTaskItemTemplate = `### {name}\n{summary}\n\n`;

// 任務複雜度評估模板
export const complexityAssessmentTemplate = `\n## 任務複雜度評估\n\n- **複雜度級別:** {level}`;

// 複雜度警告模板
export const complexityWarningTemplate = `\n\n{complexityStyle}\n`;

// 評估指標模板
export const assessmentMetricsTemplate = `\n### 評估指標\n`;
export const descriptionLengthMetric = `- 描述長度: {descriptionLength} 字符\n`;
export const dependenciesCountMetric = `- 依賴任務數: {dependenciesCount} 個\n`;

// 處理建議模板
export const handlingRecommendationsTemplate = `\n### 處理建議\n`;
export const handlingRecommendation1 = `1. {recommendation1}\n`;
export const handlingRecommendation2 = `2. {recommendation2}\n`;

// 執行步驟模板
export const executionStepsTemplate = `\n## 執行步驟\n\n`;
export const executionStep1 = `1. **分析需求** - 理解任務需求和約束條件\n`;
export const executionStep2 = `2. **設計方案** - 制定實施計劃和測試策略\n`;
export const executionStep3 = `3. **實施方案** - 按計劃執行，處理邊緣情況\n`;
export const executionStep4 = `4. **測試驗證** - 確保功能正確性和穩健性\n`;

// 質量要求模板
export const qualityRequirementsTemplate = `\n## 質量要求\n\n`;
export const qualityRequirement1 = `- **範圍管理** - 僅修改相關代碼，避免功能蔓延\n`;
export const qualityRequirement2 = `- **代碼質量** - 符合編碼標準，處理異常情況\n`;
export const qualityRequirement3 = `- **效能考量** - 注意算法效率和資源使用\n\n`;

// 完成提示模板
export const completionReminderTemplate = `完成後使用「verify_task」工具進行驗證。`;
