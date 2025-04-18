/**
 * 任務計劃 prompt 模板
 * 包含所有用於構建完整 planTask prompt 的模板片段
 */

// 基本任務分析模板
export const planTaskTemplate = `## 任務分析\n\n{description}\n\n`;

// 要求與限制模板
export const requirementsTemplate = `## 要求與限制\n\n{requirements}\n\n`;

// 現有任務參考引導
export const existingTasksReferenceTemplate = `## 現有任務參考\n\n`;

// 已完成任務標題
export const completedTasksTitleTemplate = `### 已完成任務\n\n`;

// 已完成任務項目模板
export const completedTaskItemTemplate = `{index}. **{taskName}** (ID: \`{taskId}\`)\n   - 描述：{taskDescription}\n{completedTime}`;

// 未完成任務標題
export const pendingTasksTitleTemplate = `\n### 未完成任務\n\n`;

// 未完成任務項目模板
export const pendingTaskItemTemplate = `{index}. **{taskName}** (ID: \`{taskId}\`)\n   - 描述：{taskDescription}\n   - 狀態：{taskStatus}\n{dependencies}`;

// 任務調整原則
export const taskAdjustmentPrinciplesTemplate = `\n## 任務調整原則\n\n`;
export const taskAdjustmentPrinciplesContent = `1. **已完成任務保護** - 已完成任務不可修改或刪除\n`;
export const taskAdjustmentPrinciplesContent2 = `2. **未完成任務可調整** - 可根據新需求修改未完成任務\n`;
export const taskAdjustmentPrinciplesContent3 = `3. **任務ID一致性** - 引用現有任務必須使用原始ID\n`;
export const taskAdjustmentPrinciplesContent4 = `4. **依賴關係完整性** - 避免循環依賴，不依賴已標記移除的任務\n`;
export const taskAdjustmentPrinciplesContent5 = `5. **任務延續性** - 新任務應與現有任務構成連貫整體\n\n`;

// 任務更新模式指導
export const taskUpdateModesTemplate = `## 任務更新模式\n\n`;
export const taskUpdateModesContent1 = `### 1. **追加模式(append)**\n`;
export const taskUpdateModesContent1Detail = `- 保留所有現有任務，僅添加新任務\n`;
export const taskUpdateModesContent1Usage = `- 適用：逐步擴展功能，現有計劃仍有效\n\n`;

export const taskUpdateModesContent2 = `### 2. **覆蓋模式(overwrite)**\n`;
export const taskUpdateModesContent2Detail = `- 清除所有現有未完成任務，完全使用新任務列表\n`;
export const taskUpdateModesContent2Usage = `- 適用：徹底變更方向，現有未完成任務已不相關\n\n`;

export const taskUpdateModesContent3 = `### 3. **選擇性更新模式(selective)**\n`;
export const taskUpdateModesContent3Detail = `- 根據任務名稱匹配選擇性更新任務，保留其他現有任務\n`;
export const taskUpdateModesContent3Usage = `- 適用：部分調整任務計劃，保留部分未完成任務\n`;
export const taskUpdateModesContent3Mechanism = `- 工作原理：更新同名任務，創建新任務，保留其他任務\n\n`;

// 分析指引模板
export const analysisGuideTemplate = `## 分析指引\n\n1. 確定任務的目標和預期成果
2. 識別技術挑戰和關鍵決策點
3. 考慮潛在解決方案和替代方案
4. 評估各方案優缺點
5. 判斷是否需要分解為子任務
6. 考慮與現有系統的集成需求\n\n`;

// 任務記憶檢索模板
export const memoryDirTemplate = `## 任務記憶檢索\n\n`;
export const memoryDirContent = `過去任務記錄儲存在 **{memoryDir}**。\n`;
export const memoryDirUsageGuide = `使用查詢工具時，請根據以下情境判斷：\n\n`;

// 查詢建議模板
export const queryRecommendationsTemplate = `### 查詢建議\n\n`;
export const queryHighPriority = `- **必查（高優先級）**:\n`;
export const queryHighPriorityItems = `  - 涉及修改或擴展現有功能，需了解原有實現\n`;
export const queryHighPriorityItems2 = `  - 任務描述提到需參考以往工作或已有實現經驗\n`;
export const queryHighPriorityItems3 = `  - 涉及系統內部技術實現或關鍵組件\n`;
export const queryHighPriorityItems4 = `  - 用戶要求必須查詢記憶\n\n`;

export const queryMediumPriority = `- **可查（中優先級）**:\n`;
export const queryMediumPriorityItems = `  - 新功能與現有系統有整合需求，實現部分獨立\n`;
export const queryMediumPriorityItems2 = `  - 功能標準化且需符合系統慣例\n`;
export const queryMediumPriorityItems3 = `  - 不確定是否已有類似實現\n\n`;

export const queryLowPriority = `- **可跳過（低優先級）**:\n`;
export const queryLowPriorityItems = `  - 完全全新、獨立的功能\n`;
export const queryLowPriorityItems2 = `  - 基本設置或簡單標準任務\n`;
export const queryLowPriorityItems3 = `  - 用戶明確指示不需參考過去記錄\n\n`;

export const queryReminder = `> ※ 查詢記憶可幫助了解過往方案，借鑒成功經驗並避免重複錯誤。\n\n`;

// 資訊收集指南模板
export const infoCollectionGuideTemplate = `## 資訊收集指南\n\n`;
export const infoCollectionGuideItems = `1. **詢問用戶** - 當你對任務要求有疑問時，直接詢問用戶\n`;
export const infoCollectionGuideItems2 = `2. **查詢記憶** - 使用「query_task」工具查詢以往記憶是否有相關任務\n`;
export const infoCollectionGuideItems3 = `3. **網路搜索** - 當出現你不理解的名詞或概念時，使用網路搜尋工具找尋答案\n\n`;

// 下一步模板
export const nextStepsTemplate = `## 下一步\n\n⚠️ 重要：請先閱讀 {rulesPath} 規則再進行任何分析或設計 ⚠️\n\n`;
export const nextStepsContent1 = `**第一步：根據任務描述決定是否查詢記憶**\n`;
export const nextStepsContent1Detail = `- 判斷任務是否屬於必查情境，若是，請先使用「query_task」查詢過往記錄；否則，可直接進行分析。\n\n`;
export const nextStepsContent2 = `**第二步：使用 analyze_task 提交分析結果**\n`;
export const nextStepsContent2Detail1 = `1. **任務摘要** - 目標、範圍、挑戰和限制條件\n`;
export const nextStepsContent2Detail2 = `2. **初步解答構想** - 可行的技術方案和實施計劃\n`;

export const nextStepsThoughtTemplate = `**第二步：必須強制使用「process_thought」思考答案 (禁止直接使用analyze_task)**\n`;
export const nextStepsThoughtDetail1 = `1. **強制思考過程** - 必須展示逐步推理過程，包括假設、驗證和調整\n`;
export const nextStepsThoughtDetail2 = `2. 警告：必須先使用「process_thought」工具思考，嚴格禁止直接使用analyze_task或直接回答\n`;
