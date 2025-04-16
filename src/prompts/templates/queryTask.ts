/**
 * 查詢任務 prompt 模板
 * 包含所有用於構建完整 queryTask prompt 的模板片段
 */

/**
 * queryTask 相關的提示模板
 * 注意：所有變數格式已統一為 {變數} 格式，移除了 {{變數}} 格式
 */

/**
 * 查詢模式模板 - 已將三元運算符拆分為兩個獨立常量
 */
export const searchModeIdTemplate = "任務ID查詢";
export const searchModeKeywordTemplate = "關鍵字查詢";

/**
 * 查詢頭部模板
 * 注意：三元運算符已替換為 {searchMode} 變數
 */
export const searchHeaderTemplate = `
# 任務查詢結果

## 查詢資訊
- 查詢詞: {query}
- 查詢模式: {searchMode}
- 總計找到: {totalTasks} 筆任務
`;

/**
 * 沒有結果時的模板 - 已拆分為ID查詢和關鍵字查詢兩個獨立模板
 * 原模板保留作為參考：
 * export const noResultsTemplate = `
 * ## 無符合結果
 * 沒有找到符合 "{query}" 的任務。
 *
 * ### 可能的原因:
 * {{#if isId}}
 * - 您提供的任務ID不存在或格式不正確
 * - 任務可能已被刪除
 * {{else}}
 * - 關鍵字拼寫可能有誤
 * - 請嘗試使用更簡短或相近的關鍵詞
 * - 任務清單可能為空
 * {{/if}}
 *
 * 您可以使用 \`list_tasks\` 命令查看所有現有任務。
 * `;
 */

/**
 * 沒有結果時的模板 - ID查詢
 */
export const noResultsIdTemplate = `
## 無符合結果
沒有找到符合 "{query}" 的任務。

### 可能的原因:
- 您提供的任務ID不存在或格式不正確
- 任務可能已被刪除

您可以使用 \`list_tasks\` 命令查看所有現有任務。
`;

/**
 * 沒有結果時的模板 - 關鍵字查詢
 */
export const noResultsKeywordTemplate = `
## 無符合結果
沒有找到符合 "{query}" 的任務。

### 可能的原因:
- 關鍵字拼寫可能有誤
- 請嘗試使用更簡短或相近的關鍵詞
- 任務清單可能為空

您可以使用 \`list_tasks\` 命令查看所有現有任務。
`;

/**
 * 結果列表頭部模板
 */
export const resultListHeaderTemplate = `
## 任務列表
以下是符合查詢的任務:

`;

/**
 * 分頁資訊模板
 */
export const paginationInfoTemplate = `
## 分頁資訊
- 當前頁: {page} / {totalPages}
- 每頁顯示: {pageSize} 筆
- 總計結果: {totalTasks} 筆

您可以指定 page 參數查看更多結果。
`;

/**
 * 任務摘要模板
 */
export const taskSummaryTemplate = `
### {taskName} (ID: {taskId})
- 狀態: {taskStatus}
- 描述: {taskDescription}
- 建立時間: {createdAt}
- 完成時間: {completedAt}
`;

/**
 * 使用提示模板
 */
export const usageHintTemplate = `
## 相關操作提示
- 使用 \`get_task_detail {任務ID}\` 查看任務完整詳情
- 使用 \`execute_task {任務ID}\` 執行特定任務
- 使用 \`list_tasks\` 查看所有任務
`;

// 查詢結果標題模板
export const queryResultTitleTemplate = `## 查詢結果 ({totalResults})\n\n`;

// 單個任務顯示模板
export const taskDisplayTemplate = `### {name}
**ID:** \`{id}\`
**狀態:** {status}
**描述:** {description}
{notes}
{implementationGuide}
{verificationCriteria}
{summary}
**創建時間:** {createdTime}
**更新時間:** {updatedTime}
{completedTime}
**詳細內容:** 請使用「get_task_detail」工具查看 {id} 完整任務詳情`;

// 下一頁指示模板
export const nextPageGuideTemplate = `\n\n要查看下一頁結果，請使用相同的查詢參數，但將頁碼設為 {nextPage}。`;

// 系統錯誤模板
export const errorTemplate = `## 系統錯誤\n\n查詢任務時發生錯誤: {errorMessage}`;
