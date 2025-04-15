/**
 * 方案評估 prompt 模板
 * 包含所有用於構建完整 reflectTask prompt 的模板片段
 */

// 基本方案評估模板
export const reflectTaskTemplate = `## 方案評估\n\n### 任務摘要\n\`\`\`\n{summary}\n\`\`\`\n\n### 分析結果\n\`\`\`\n{analysis}\n\`\`\`\n\n`;

// 評估要點模板
export const evaluationPointsTemplate = `## 評估要點\n\n### 1. 技術完整性
- 檢查方案技術缺陷和邏輯漏洞
- 驗證邊緣情況和異常處理
- 確認數據流和控制流完整性
- 評估技術選型合理性

### 2. 效能與可擴展性
- 分析資源使用效率和優化空間
- 評估系統負載擴展能力
- 識別潛在優化點
- 考慮未來功能擴展可能性

### 3. 需求符合度
- 核對功能需求實現情況
- 檢查非功能性需求符合度
- 確認需求理解準確性
- 評估用戶體驗和業務流程整合`;

// 決策點模板
export const decisionPointsTemplate = `## 決策點\n\n根據評估結果選擇後續行動：\n\n- **發現關鍵問題**：使用「analyze_task」重新提交改進方案
- **輕微調整**：在下一步執行中應用這些小的改進
- **方案完善**：使用「split_tasks」將解決方案分解為可執行子任務，如果任務太多或內容過長，請使用多次使用「split_tasks」工具，每次只提交一小部分任務`;

// 更新模式選擇模板
export const updateModesTemplate = `## split_tasks 更新模式選擇
- **append** - 保留所有現有任務並添加新任務
- **overwrite** - 清除未完成任務，保留已完成任務
- **selective** - 選擇性更新特定任務，保留其他任務
- **clearAllTasks** - 清除所有任務並創建備份`;

// 知識傳遞機制模板
export const knowledgeTransferTemplate = `## 知識傳遞機制
1. **全局分析結果** - 關聯完整分析文檔
2. **任務專屬實現指南** - 每個任務保存具體實現方法
3. **任務專屬驗證標準** - 設置明確驗證要求`;

// 任務過多處理模板
export const taskOverflowTemplate = `## split_tasks 任務太多或內容過長導致「split_tasks」工具無法正常運作時
- 請使用多次使用「split_tasks」工具，每次只提交一小部分任務
- 如果每次只新增一個任務還是無法正常運作，請考慮再次拆分任務，或者簡化任務但必須保留核心內容`;

// 結尾提醒模板
export const conclusionTemplate = `請嚴格審查方案，確保解決方案質量。`;
