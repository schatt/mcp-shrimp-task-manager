/**
 * 列出任務 prompt 模板
 * 包含所有用於構建完整 listTasks prompt 的模板片段
 */

// 任務管理儀表板標題模板
export const dashboardTitleTemplate = `# 任務管理儀表板\n\n`;

// 任務狀態概覽標題模板
export const statusOverviewTitleTemplate = `## 任務狀態概覽\n\n`;

// 單個任務狀態計數模板
export const statusCountTemplate = `- **{status}**: {count} 個任務`;

// 任務狀態分類標題模板
export const statusSectionTitleTemplate = `## {status} ({count})\n\n`;

// 系統通知模板 - 無任務
export const noTasksNoticeTemplate = `## 系統通知\n\n目前系統中沒有{statusText}任務。請查詢其他狀態任務或先使用「split_tasks」工具創建任務結構，再進行後續操作。`;
