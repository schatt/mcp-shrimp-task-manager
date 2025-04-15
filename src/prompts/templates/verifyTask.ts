/**
 * 任務驗證 prompt 模板
 * 包含所有用於構建完整 verifyTask prompt 的模板片段
 */

// 基本任務驗證模板
export const verifyTaskTemplate = `## 任務驗證\n\n**名稱:** {name}\n**ID:** \`{id}\`\n**描述:** {description}\n{notes}\n`;

// 驗證標準模板
export const verificationCriteriaTemplate = `\n## 驗證標準\n\n{verificationCriteria}\n\n`;

// 實現指南摘要模板
export const implementationGuideSummaryTemplate = `\n## 實現指南摘要\n\n{implementationGuideSummary}\n\n`;

// 分析要點模板
export const analysisSummaryTemplate = `\n## 分析要點\n\n{analysisSummary}\n\n`;

// 標準驗證標準模板
export const standardVerificationCriteriaTemplate = `## 驗證標準\n\n1. **需求符合性(30%)** - 功能完整性、約束條件遵循、邊緣情況處理\n2. **技術質量(30%)** - 架構一致性、程式健壯性、實現優雅性\n3. **集成兼容性(20%)** - 系統整合、互操作性、兼容性維護\n4. **性能可擴展性(20%)** - 效能優化、負載適應性、資源管理\n\n`;

// 報告要求模板
export const reportRequirementsTemplate = `## 報告要求\n\n提供整體評分和評級，各項標準評估，問題與建議，及最終結論。\n\n`;

// 決策點模板
export const decisionPointsTemplate = `## 決策點\n\n根據驗證結果選擇：\n`;
export const decisionPoint1 = `- **嚴重錯誤**：使用「plan_task」工具重新規劃任務\n`;
export const decisionPoint2 = `- **輕微錯誤**：直接修復問題\n`;
export const decisionPoint3 = `- **無錯誤**：使用「complete_task」工具標記完成\n`;
