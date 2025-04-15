/**
 * 任務完成 prompt 模板
 * 包含所有用於構建完整 completeTask prompt 的模板片段
 */

// 基本任務完成確認模板
export const completeTaskConfirmationTemplate = `## 任務完成確認\n\n任務 "{name}" (ID: \`{id}\`) 已於 {completionTime} 成功標記為完成。\n\n`;

// 任務摘要要求模板
export const taskSummaryRequirementsTemplate = `## 任務摘要要求\n\n請提供此次完成任務的摘要總結，包含以下關鍵要點：\n\n1. 任務目標與主要成果\n2. 實施的解決方案要點\n3. 遇到的主要挑戰及解決方法\n\n`;

// 重要提示模板
export const importantReminderTemplate = `**重要提示：** 請在當前回應中提供任務摘要總結。完成本次任務摘要後，請等待用戶明確指示後再繼續執行其他任務。請勿自動開始執行下一個任務。\n\n`;

// 連續執行模式提示模板
export const continuousModeReminderTemplate = `如果用戶要求連續執行任務，請使用「execute_task」工具開始執行下一個任務。`;
