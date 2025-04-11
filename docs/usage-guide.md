# 蝦米任務管理器使用指南

本指南提供蝦米任務管理器的詳細使用說明，包括各功能的使用場景、最佳實踐和實用建議。

## 新增功能使用指南

### 1. 刪除任務功能

#### 使用場景

- **任務規劃變更**：當項目規劃變更，需要刪除某些不再需要的任務時
- **錯誤創建的任務**：修正錯誤創建的任務，避免任務列表混亂
- **任務優先級調整**：刪除低優先級任務以聚焦於更重要的目標

#### 最佳實踐

1. **刪除前先檢查依賴關係**：使用 `list_tasks` 檢查是否有其他任務依賴於要刪除的任務
2. **先刪除子任務**：如果要刪除一個有多個子任務的父任務，建議先刪除所有子任務
3. **保留重要任務記錄**：對於重要但不再需要的任務，考慮將其標記為完成而非刪除，以保留歷史記錄
4. **刪除後驗證**：刪除操作後，使用 `list_tasks` 確認任務已被正確刪除且依賴關係未受影響

#### 範例使用流程

```javascript
// 1. 先查看任務列表，確認要刪除的任務 ID
await mcp.mcp_shrimp_task_manager.list_tasks();

// 2. 刪除特定任務
await mcp.mcp_shrimp_task_manager.delete_task({
  taskId: "task-uuid-here",
});

// 3. 再次查看任務列表，確認刪除結果
await mcp.mcp_shrimp_task_manager.list_tasks();
```

#### 注意事項

- 已完成的任務（狀態為 `COMPLETED`）無法刪除，這是為了保持系統記錄的完整性
- 如果任務有依賴關係，系統會阻止刪除操作並提供詳細的錯誤信息
- 刪除操作是永久性的，請在操作前確認

### 2. 任務複雜度自適應處理

#### 使用場景

- **大型項目初始評估**：快速評估任務複雜度，幫助合理規劃
- **任務執行前準備**：了解任務複雜度，提前做好資源分配
- **拆分複雜任務**：識別高複雜度任務，考慮拆分為小任務

#### 最佳實踐

1. **關注複雜度警告**：當系統顯示「高複雜度」或「極高複雜度」警告時，應特別重視
2. **遵循處理建議**：系統會根據複雜度提供針對性建議，應認真考慮這些建議
3. **複雜任務拆分**：對於極高複雜度的任務，最好使用 `split_tasks` 拆分成多個子任務
4. **設置里程碑**：對於高複雜度任務，定期檢查進度並記錄關鍵決策點

#### 複雜度級別處理指南

| 複雜度級別 | 處理建議                                                     |
| ---------- | ------------------------------------------------------------ |
| 低複雜度   | 直接執行，設定明確的完成標準                                 |
| 中等複雜度 | 詳細規劃執行步驟，分階段執行並定期檢查進度                   |
| 高複雜度   | 進行充分的分析和規劃，考慮拆分為子任務，建立清晰的里程碑     |
| 極高複雜度 | 強烈建議拆分為多個獨立任務，進行風險評估，建立具體的測試標準 |

#### 範例使用流程

```javascript
// 執行任務時，系統會自動評估複雜度並提供建議
const result = await mcp.mcp_shrimp_task_manager.execute_task({
  taskId: "task-uuid-here",
});

// 對於高複雜度任務，考慮拆分
if (
  result.content.includes("高複雜度") ||
  result.content.includes("極高複雜度")
) {
  await mcp.mcp_shrimp_task_manager.split_tasks({
    isOverwrite: false,
    tasks: [
      // 拆分後的子任務...
    ],
  });
}
```

### 3. 任務摘要自動更新機制

#### 使用場景

- **任務完成記錄**：記錄任務完成的關鍵成果與決策
- **知識傳遞**：為團隊成員提供簡明的任務完成報告
- **進度回顧**：在項目中期或結束時回顧已完成的工作成果

#### 最佳實踐

1. **提供詳細摘要**：儘可能提供詳細但簡潔的自定義摘要，而非依賴自動生成
2. **突出關鍵點**：在摘要中強調最重要的實現細節、技術選擇和解決方案
3. **包含量化成果**：如適用，包括性能改進、資源節省等量化結果
4. **記錄挑戰與解決方案**：記錄遇到的主要挑戰及其解決方法

#### 編寫高品質摘要的指南

優質的任務摘要應該包含以下要素：

1. **成就說明**：清晰說明實現了什麼功能或解決了什麼問題
2. **實施方法**：簡述實現的主要步驟或採用的技術方案
3. **技術決策**：解釋為何選擇特定的實現方法
4. **成果評估**：描述實現結果如何滿足或超出預期
5. **限制與展望**：提及現有實現的限制以及未來可能的改進方向

#### 範例使用流程

```javascript
// 完成任務時提供詳細摘要
await mcp.mcp_shrimp_task_manager.complete_task({
  taskId: "task-uuid-here",
  summary:
    "成功實現任務複雜度自適應處理功能，包括：(1)在 types/index.ts 中定義了 TaskComplexityLevel 枚舉、TaskComplexityThresholds 閾值常量和 TaskComplexityAssessment 介面；(2)在 taskModel.ts 中新增 assessTaskComplexity 函數，根據任務描述長度、依賴數量和注記長度等指標評估任務複雜度；(3)修改 executeTask 函數整合複雜度檢查邏輯，並根據複雜度級別提供適當的提示和處理建議。實現結果可準確識別不同複雜度的任務，並提供針對性的處理策略，有效提升複雜任務的管理效率。",
});

// 或者讓系統自動生成摘要
await mcp.mcp_shrimp_task_manager.complete_task({
  taskId: "task-uuid-here",
});
```

#### 自動摘要生成的工作原理

當未提供自定義摘要時，系統會：

1. 基於任務名稱和描述自動生成摘要
2. 使用智能算法提取關鍵信息
3. 確保摘要長度適中（約 250 字符以內）
4. 保留任務最核心的功能描述和目標

## 工作日誌功能使用指南

### 查詢日誌 (`list_conversation_log`)

#### 使用場景

- **追蹤任務執行過程**：了解特定任務的執行歷程
- **回顧關鍵決策**：查找過去做出的重要決策和理由
- **診斷問題**：當遇到問題時，檢查歷史記錄以找出原因
- **提取經驗教訓**：從過去的項目中學習，避免重複錯誤

#### 最佳實踐

1. **使用特定過濾條件**：針對具體任務或時間段查詢，避免獲取過多不相關日誌
2. **利用分頁功能**：對於大量日誌，使用分頁功能逐步檢視
3. **定期審查日誌**：定期查看日誌，及時發現問題並總結經驗
4. **將關鍵發現記錄到文檔**：將日誌中的重要發現整理到專門的文檔中，方便團隊分享

#### 範例使用流程

```javascript
// 查詢特定任務的日誌
const taskLogs = await mcp.mcp_shrimp_task_manager.list_conversation_log({
  taskId: "task-uuid-here",
});

// 查詢特定時間段的日誌
const dateLogs = await mcp.mcp_shrimp_task_manager.list_conversation_log({
  startDate: "2025-01-01T00:00:00Z",
  endDate: "2025-01-31T23:59:59Z",
});

// 使用分頁功能查看大量日誌
let allLogs = [];
let offset = 0;
const limit = 20;
let hasMore = true;

while (hasMore) {
  const logs = await mcp.mcp_shrimp_task_manager.list_conversation_log({
    limit,
    offset,
  });

  allLogs = allLogs.concat(logs.entries);
  offset += limit;
  hasMore = logs.entries.length === limit;
}
```

### 清除日誌 (`clear_conversation_log`)

#### 使用場景

- **釋放存儲空間**：當日誌佔用過多空間時
- **保護隱私**：清除包含敏感信息的日誌
- **重新開始**：在項目新階段開始前清理舊日誌

#### 最佳實踐

1. **備份重要日誌**：清除前考慮導出或備份重要日誌
2. **定期維護**：建立定期日誌清理計劃，維持系統整潔
3. **選擇性清理**：考慮只保留最近或最關鍵的日誌
4. **確認清理操作**：清除是不可逆的，操作前確保團隊成員都已了解

#### 範例使用流程

```javascript
// 清除所有日誌（需慎重操作）
await mcp.mcp_shrimp_task_manager.clear_conversation_log({
  confirm: true,
});
```

## 整合使用流程

以下是一個完整的任務管理工作流程，整合了所有功能的使用：

1. **規劃與分析**

   ```javascript
   // 開始規劃
   await mcp.mcp_shrimp_task_manager.plan_task({
     description: "項目描述...",
     requirements: "技術要求...",
   });

   // 分析問題
   await mcp.mcp_shrimp_task_manager.analyze_task({
     summary: "任務摘要...",
     initialConcept: "初步構想...",
   });

   // 反思構想
   await mcp.mcp_shrimp_task_manager.reflect_task({
     summary: "任務摘要...",
     analysis: "分析結果...",
   });
   ```

2. **任務拆分與執行**

   ```javascript
   // 拆分任務
   await mcp.mcp_shrimp_task_manager.split_tasks({
     isOverwrite: false,
     tasks: [
       /* 任務列表 */
     ],
   });

   // 查看任務列表
   await mcp.mcp_shrimp_task_manager.list_tasks();

   // 執行任務（系統會自動評估複雜度）
   await mcp.mcp_shrimp_task_manager.execute_task({
     taskId: "task-uuid-here",
   });
   ```

3. **驗證與完成**

   ```javascript
   // 驗證任務
   await mcp.mcp_shrimp_task_manager.verify_task({
     taskId: "task-uuid-here",
   });

   // 完成任務（提供詳細摘要）
   await mcp.mcp_shrimp_task_manager.complete_task({
     taskId: "task-uuid-here",
     summary: "詳細摘要...",
   });
   ```

4. **維護與整理**

   ```javascript
   // 刪除不需要的任務
   await mcp.mcp_shrimp_task_manager.delete_task({
     taskId: "task-uuid-here",
   });

   // 查詢任務日誌
   await mcp.mcp_shrimp_task_manager.list_conversation_log({
     taskId: "task-uuid-here",
   });
   ```

## 常見問題與解決方案

### Q: 如何處理極高複雜度的任務？

**A:** 建議將極高複雜度的任務拆分為多個小任務。使用 `split_tasks` 工具，確保每個子任務都有明確的範圍和可驗證的成功標準。

### Q: 自動生成的摘要不夠詳細怎麼辦？

**A:** 建議總是提供自定義摘要。自定義摘要應包含實施過程中的關鍵決策、主要挑戰及其解決方案、使用的核心技術和達成的成果。

### Q: 為什麼無法刪除已完成的任務？

**A:** 這是為了保持系統記錄的完整性。已完成的任務通常包含寶貴的實施記錄和經驗，保留這些信息有助於未來的參考和學習。

### Q: 日誌記錄佔用了太多空間怎麼辦？

**A:** 定期使用 `list_conversation_log` 工具檢查日誌，提取關鍵信息並記錄到專門的文檔中，然後使用 `clear_conversation_log` 工具清理舊日誌。
