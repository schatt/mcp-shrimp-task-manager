/**
 * 任務拆分 prompt 模板
 * 包含所有用於構建完整 splitTasks prompt 的模板片段
 */

// 任務拆分標題模板
export const splitTasksTitleTemplate = `## 任務拆分 - {updateMode} 模式\n\n`;

// 任務更新模式描述模板
export const updateModeDescriptionTemplate = `任務已{updateDescription}。\n\n`;

// 任務拆分策略模板
export const splitStrategyTemplate = `## 拆分策略\n\n1. **按功能分解** - 獨立可測試的子功能，明確輸入輸出
2. **按技術層次分解** - 沿架構層次分離任務，確保接口明確
3. **按開發階段分解** - 核心功能先行，優化功能後續
4. **按風險分解** - 隔離高風險部分，降低整體風險\n\n`;

// 任務質量審核模板
export const qualityReviewTemplate = `## 任務質量審核\n\n1. **任務原子性** - 每個任務足夠小且具體，可獨立完成
2. **依賴關係** - 任務依賴形成有向無環圖，避免循環依賴
3. **描述完整性** - 每個任務描述清晰準確，包含必要上下文\n\n`;

// 任務清單標題模板
export const taskListTitleTemplate = `## 任務清單\n\n`;

// 單個任務顯示模板
export const taskItemTemplate = `### 任務 {index}：{name}
**ID:** \`{id}\`
**描述:** {description}
{notes}
{implementationGuide}
{verificationCriteria}
{dependencies}
`;

// 依賴關係管理模板
export const dependencyManagementTemplate = `## 依賴關係管理\n\n`;
export const dependencyManagementContent1 = `- 設置依賴可使用任務名稱或任務ID\n`;
export const dependencyManagementContent2 = `- 最小化依賴數量，只設置直接前置任務\n`;
export const dependencyManagementContent3 = `- 避免循環依賴，確保任務圖有向無環\n`;
export const dependencyManagementContent4 = `- 平衡關鍵路徑，優化並行執行可能性\n\n`;

// 決策點模板
export const decisionPointsTemplate = `## 決策點\n\n`;
export const decisionPointContent1 = `- 發現任務拆分不合理：重新呼叫「split_tasks」調整\n`;
export const decisionPointContent2 = `- 確認任務拆分完善：生成執行計劃，確定優先順序\n`;
