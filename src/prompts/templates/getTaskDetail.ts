/**
 * 查詢任務詳情 prompt 模板
 * 包含所有用於構建完整 getTaskDetail prompt 的模板片段
 */

// 任務詳情標題模板
export const taskDetailTitleTemplate = `## 任務完整詳情\n\n`;

// 任務基本信息模板
export const taskBasicInfoTemplate = `### {name}\n\n**ID:** \`{id}\`\n\n**狀態:** {status}\n\n**描述:**\n{description}\n\n`;

// 任務注記模板
export const taskNotesTemplate = `**注記:**\n{notes}\n\n`;

// 任務依賴模板
export const taskDependenciesTemplate = `**依賴任務:** {dependencies}\n\n`;

// 任務實現指南模板
export const taskImplementationGuideTemplate = `**實現指南:**\n\`\`\`\n{implementationGuide}\n\`\`\`\n\n`;

// 任務驗證標準模板
export const taskVerificationCriteriaTemplate = `**驗證標準:**\n\`\`\`\n{verificationCriteria}\n\`\`\`\n\n`;

// 任務相關文件標題模板
export const taskRelatedFilesTemplate = `**相關文件:**\n{files}\n`;

// 單個相關文件模板
export const taskRelatedFileItemTemplate = `- \`{path}\` ({type}){description}`;

// 任務時間信息模板
export const taskTimeInfoTemplate = `**創建時間:** {createdTime}\n**更新時間:** {updatedTime}\n`;

// 任務完成時間模板
export const taskCompletedTimeTemplate = `**完成時間:** {completedTime}\n\n`;

// 任務完成摘要模板
export const taskSummaryTemplate = `**完成摘要:**\n{summary}\n\n`;

// 錯誤模板 - 找不到任務
export const taskNotFoundTemplate = `## 錯誤\n\n找不到ID為 \`{taskId}\` 的任務。請確認任務ID是否正確。`;

// 系統錯誤模板
export const errorTemplate = `## 系統錯誤\n\n取得任務詳情時發生錯誤: {errorMessage}`;
