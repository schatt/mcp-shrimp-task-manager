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

### 4. 清除所有任務功能

#### 使用場景

- **項目重啟**：當項目需要重新規劃和組織時
- **測試清理**：在測試系統後恢復到初始狀態
- **系統重置**：在出現數據混亂或錯誤狀態時進行系統重置

#### 最佳實踐

1. **數據備份**：系統會自動在執行清除前創建數據備份，但建議在執行前手動備份重要數據
2. **謹慎使用**：清除操作不可逆，請確保真的需要刪除所有未完成任務
3. **團隊溝通**：在團隊環境中使用前，先與團隊成員溝通確認
4. **清除後檢查**：清除後使用 `list_tasks` 確認結果

#### 範例使用流程

```javascript
// 1. 先查看當前任務列表，確認哪些任務將被刪除
await mcp.mcp_shrimp_task_manager.list_tasks();

// 2. 執行清除操作（必須明確確認）
const clearResult = await mcp.mcp_shrimp_task_manager.clear_all_tasks({
  confirm: true, // 必須設為 true
});

// 3. 檢查清除結果
console.log(clearResult);

// 4. 確認剩餘任務狀態
await mcp.mcp_shrimp_task_manager.list_tasks();
```

#### 安全注意事項

- **明確確認**：必須設置 `confirm: true` 參數，以防止意外操作
- **備份保留**：系統會自動創建備份，格式為 `tasks-backup-YYYYMMDD-HHMMSS.json`
- **日誌記錄**：所有清除操作都會記錄在日誌中，包括操作時間、被刪除的任務數量
- **保留完成任務**：已完成的任務不會被刪除，確保項目歷史記錄完整性

#### 潛在風險

- **無法撤銷**：一旦執行，操作無法撤銷（除通過手動還原備份）
- **依賴關係丟失**：清除後，任務間的依賴關係將無法恢復
- **上下文丟失**：與任務相關的上下文記憶可能會丟失

### 5. 更新任務功能

#### 使用場景

- **任務細節變更**：當任務要求或細節發生變化時
- **補充任務資訊**：添加更多細節或說明以澄清任務目標
- **調整任務範圍**：擴大或縮小任務範圍時修改描述

#### 最佳實踐

1. **保持簡潔明確**：更新時確保任務描述清晰，焦點明確
2. **記錄變更原因**：在注記中添加變更的理由，便於後續追蹤
3. **通知相關人員**：任務有重大變更時，確保相關人員了解
4. **維護一致性**：確保更新後的任務與整體項目目標一致

#### 範例使用流程

```javascript
// 1. 查看任務當前狀態
await mcp.mcp_shrimp_task_manager.list_tasks();

// 2. 更新任務內容
const updateResult = await mcp.mcp_shrimp_task_manager.update_task({
  taskId: "task-uuid-here",
  name: "更新後的任務名稱",
  description: "更詳細的任務描述，包含新要求...",
  notes: "更新原因：需求變更，添加了新的功能要求",
});

// 3. 確認更新結果
console.log(updateResult);
```

#### 注意事項

- **已完成任務限制**：已完成的任務不能被更新，這確保了任務歷史記錄的穩定性
- **至少一個參數**：更新時至少需要提供 name、description 或 notes 中的一個參數
- **不改變核心屬性**：任務 ID 和完成狀態不能通過此功能更改
- **歷史記錄**：系統會自動記錄所有更新操作，便於追蹤任務變更歷史

### 6. 任務相關文件位置記錄功能

#### 使用場景

- **代碼關聯跟蹤**：記錄任務涉及的代碼文件和位置
- **文檔參考關聯**：將相關設計文檔、API 規範等與任務關聯
- **提升上下文記憶**：幫助 LLM 在任務執行時快速加載相關上下文
- **資源整理**：系統性整理與任務相關的所有資源

#### 最佳實踐

1. **分類關聯文件**：使用不同的關聯類型（待修改、參考資料等）清晰分類
2. **精確定位代碼**：對代碼文件指定具體行號範圍，聚焦關鍵代碼區域
3. **添加描述說明**：為每個文件添加簡明的描述，說明其與任務的關係
4. **及時更新關聯**：當發現新的相關文件時，及時更新關聯關係

#### 文件關聯類型使用指南

| 類型     | 適用場景                         | 建議                                 |
| -------- | -------------------------------- | ------------------------------------ |
| 待修改   | 需要在任務中修改的文件           | 指定具體行號範圍，描述需要修改的內容 |
| 參考資料 | 提供背景或指導的文檔             | 添加說明，指出需要關注的文檔關鍵部分 |
| 輸出結果 | 任務將創建或修改的目標文件       | 描述預期的輸出結果和質量標準         |
| 依賴文件 | 任務實現依賴的組件或庫           | 說明依賴關係和注意事項               |
| 其他     | 不屬於上述類別但與任務相關的文件 | 清楚說明關聯原因                     |

#### 範例使用流程

```javascript
// 添加或更新任務相關文件
const filesResult = await mcp.mcp_shrimp_task_manager.update_task_files({
  taskId: "task-uuid-here",
  relatedFiles: [
    // 待修改的代碼文件，包含具體行號
    {
      path: "src/services/authService.ts",
      type: "待修改",
      description: "需要增加多因素認證支持",
      lineStart: 45,
      lineEnd: 78,
    },
    // 參考的設計文檔
    {
      path: "docs/auth-design.md",
      type: "參考資料",
      description: "包含認證流程設計和安全要求",
    },
    // 任務將要創建的新文件
    {
      path: "src/components/TwoFactorAuth.tsx",
      type: "輸出結果",
      description: "需要創建的多因素認證組件",
    },
    // 依賴的現有組件
    {
      path: "src/components/InputCode.tsx",
      type: "依賴文件",
      description: "將複用的驗證碼輸入組件",
    },
  ],
});
```

#### 上下文記憶增強效果

通過關聯文件功能，系統可以：

1. **自動載入關鍵上下文**：執行任務時自動加載相關文件內容
2. **提供精確代碼定位**：直接定位到相關代碼，減少搜索時間
3. **建立知識網絡**：將分散的相關資源連接成有機整體
4. **提高執行效率**：減少上下文切換，提高任務連貫性

### 7. 優化任務執行時的上下文記憶功能

#### 使用場景

- **執行複雜任務**：當任務涉及多個文件和組件時
- **延續之前工作**：在中斷後重新開始任務時恢復上下文
- **團隊協作**：不同成員接手任務時快速了解相關上下文
- **長期項目**：在跨越長時間的項目中保持上下文連貫性

#### 最佳實踐

1. **優先關聯核心文件**：識別並優先關聯最重要的文件
2. **保持關聯更新**：隨著任務進展，及時更新相關文件列表
3. **添加精確注釋**：在相關文件描述中提供具體指引
4. **利用代碼區塊定位**：使用行號範圍準確定位相關代碼
5. **建立樹狀依賴**：明確文件間的依賴關係，形成知識樹

#### 智能上下文加載功能說明

系統在執行任務時會智能處理文件內容，主要特點包括：

1. **自動優先級排序**：根據文件類型和關聯程度排序

   - "待修改"文件優先級最高
   - 直接依賴的文件次之
   - 參考資料根據相關性排序

2. **智能代碼提取**：對於大型文件，系統會：

   - 優先加載指定的行號範圍
   - 識別關鍵代碼區塊（如函數定義、類定義）
   - 提取重要的註釋和文檔字符串

3. **上下文壓縮**：在上下文過大時，系統會：

   - 保留核心代碼，刪減非關鍵部分
   - 對大型文檔生成摘要
   - 優化格式，減少上下文標記使用

4. **執行歷史記憶**：自動包含：
   - 之前執行的關鍵步驟
   - 重要決策點和選擇原因
   - 遇到的問題和解決方案

#### 使用範例

執行任務時，系統會自動應用上下文記憶功能：

```javascript
// 執行任務（系統會自動加載相關文件和上下文）
const executeResult = await mcp.mcp_shrimp_task_manager.execute_task({
  taskId: "task-uuid-here",
});

// 隨著任務進展，更新相關文件以增強上下文記憶
await mcp.mcp_shrimp_task_manager.update_task_files({
  taskId: "task-uuid-here",
  relatedFiles: [
    // 添加新發現的相關文件
    {
      path: "src/utils/validation.ts",
      type: "依賴文件",
      description: "包含需要使用的表單驗證函數",
      lineStart: 25,
      lineEnd: 48,
    },
  ],
});

// 繼續執行任務，利用更新後的上下文
// 系統會結合新文件和之前的執行上下文
```

#### 上下文記憶限制與解決方案

面對 LLM 上下文窗口限制，系統採用以下策略：

1. **分層資訊呈現**：

   - 核心代碼完整呈現
   - 次要內容以摘要形式提供
   - 背景知識以參考鏈接形式提供

2. **動態上下文調整**：

   - 根據任務階段調整重點內容
   - 在複雜決策點呈現更多背景資訊
   - 在實施階段聚焦於實現細節

3. **記憶外部化**：
   - 使用相關文件系統存儲上下文
   - 提供檢索機制以按需加載資訊
   - 定期總結並存儲重要進展

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

   // 關聯任務相關文件，增強上下文記憶
   await mcp.mcp_shrimp_task_manager.update_task_files({
     taskId: "task-uuid-here",
     relatedFiles: [
       {
         path: "src/components/Auth.tsx",
         type: "待修改",
         description: "需要更新的認證組件",
         lineStart: 35,
         lineEnd: 67,
       },
     ],
   });

   // 執行任務（系統會自動評估複雜度並加載相關文件）
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
   // 更新任務內容
   await mcp.mcp_shrimp_task_manager.update_task({
     taskId: "task-uuid-here",
     description: "更新後的任務描述...",
   });

   // 刪除不需要的任務
   await mcp.mcp_shrimp_task_manager.delete_task({
     taskId: "task-uuid-here",
   });

   // 清除所有未完成任務（謹慎使用）
   await mcp.mcp_shrimp_task_manager.clear_all_tasks({
     confirm: true,
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

### Q: 如何管理大型項目中的上下文記憶？

**A:** 利用相關文件功能建立完整的文件關聯網絡，為每個任務標記最關鍵的相關文件，並使用精確的行號範圍定位核心代碼。定期更新文件關聯，反映項目的最新狀態。

### Q: 清除所有任務後，如何恢復誤刪的數據？

**A:** 系統在清除操作前會自動創建備份文件，存放在 `data/backups` 目錄下。可以通過手動恢復這些備份文件來還原數據。建議定期檢查並整理備份目錄，確保重要數據安全。

<a id="project-specific-configuration"></a>

## 專案特定配置指南

蝦米任務管理器支持兩種配置方式：全局配置和專案特定配置。本章節將詳細介紹如何使用專案特定配置，幫助您更有效地管理多個專案的任務數據。

### DATA_DIR 參數的作用及重要性

`DATA_DIR` 是蝦米任務管理器中最關鍵的配置參數之一，它決定了系統存儲數據的位置。具體來說，`DATA_DIR` 參數指定的目錄用於存儲：

1. **任務數據**：所有任務的詳細信息、狀態和依賴關係（`tasks.json`）
2. **對話日誌**：系統與 LLM 之間的交互記錄（`conversation_log.json`）
3. **數據備份**：任務數據的定期備份（`backups/` 目錄）
4. **臨時文件**：系統操作過程中的臨時數據

`DATA_DIR` 參數的正確設置對系統穩定性和數據安全至關重要，因為：

- **數據持久化**：確保任務信息在系統重啟後不會丟失
- **數據完整性**：維護任務間的依賴關係和執行歷史
- **上下文記憶**：保存 LLM 在執行任務時需要的上下文信息
- **備份與恢復**：支持數據備份和災難恢復機制

### 專案特定配置的優勢

相比全局配置，在專案目錄中使用專案特定的 `.cursor/mcp.json` 配置有以下明顯優勢：

#### 1. 數據隔離

- **獨立數據存儲**：每個專案使用獨立的數據目錄，避免任務數據混淆
- **專案內聚性**：任務數據與專案代碼一起管理，增強內聚性
- **錯誤防護**：防止跨專案操作錯誤，如誤刪除他專案的任務

#### 2. 專案可移植性

- **整體遷移**：專案代碼和任務數據可一起移動或分享
- **環境一致性**：確保在不同環境中使用相同的配置
- **團隊協作**：團隊成員可以共享完整的專案上下文，包括任務狀態

#### 3. 多專案管理

- **同時處理**：可以同時處理多個專案而不互相影響
- **上下文切換**：在不同專案間切換時，自動使用相應的任務數據
- **專案特化**：可以為不同類型的專案設置不同的配置參數

#### 4. 版本控制友好

- **配置跟踪**：`.cursor/mcp.json` 可以納入版本控制系統
- **配置共享**：團隊成員自動獲取一致的配置設置
- **變更記錄**：配置變更可以通過版本控制系統追蹤和審查

### mcp.json 配置參數完整說明

專案特定的 `mcp.json` 文件應放置在專案根目錄的 `.cursor` 目錄下，其完整結構如下：

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/path/to/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "./data",
        "LOG_LEVEL": "info",
        "MAX_BACKUP_FILES": "5"
      }
    }
  }
}
```

#### 必要參數

| 參數名         | 說明                                | 示例值                                               |
| -------------- | ----------------------------------- | ---------------------------------------------------- |
| `command`      | 執行命令，通常為 node               | `"node"`                                             |
| `args`         | 命令參數，指向 dist/index.js 的路徑 | `["/path/to/mcp-shrimp-task-manager/dist/index.js"]` |
| `env.DATA_DIR` | 數據目錄路徑，可使用絕對或相對路徑  | `"./data"` 或 `"/absolute/path/to/data"`             |

#### 可選環境變數

| 環境變數名         | 說明                      | 默認值   | 示例值                 |
| ------------------ | ------------------------- | -------- | ---------------------- |
| `LOG_LEVEL`        | 日誌記錄級別              | `"info"` | `"debug"`, `"warning"` |
| `MAX_BACKUP_FILES` | 保留的最大備份文件數量    | `"5"`    | `"10"`                 |
| `BACKUP_INTERVAL`  | 自動備份間隔（小時）      | `"24"`   | `"12"`                 |
| `PORT`             | HTTP 服務器端口（如啟用） | `"3000"` | `"8080"`               |

### 注意事項和建議

1. **路徑設置**：

   - 絕對路徑提供明確的位置指向，但降低了可移植性
   - 相對路徑（如 `"./data"`）增強可移植性，建議在團隊協作環境中使用

2. **數據目錄**：

   - 建議創建專用的數據目錄（例如 `data/`）
   - 確保該目錄已納入 `.gitignore`，避免將任務數據提交到版本控制系統（除非有意共享）

3. **權限考慮**：

   - 確保運行蝦米任務管理器的用戶對 DATA_DIR 目錄有讀寫權限
   - 在團隊環境中，可能需要考慮目錄的共享權限設置

4. **備份策略**：
   - 設置適當的 `MAX_BACKUP_FILES` 值，平衡數據安全和磁盤使用
   - 考慮定期將備份複製到外部存儲以增強數據安全

### 專案特定配置的逐步設置指南

以下是配置專案特定 mcp.json 的詳細步驟指南，幫助您快速設置適合專案需求的配置。

#### 步驟 1：在專案根目錄創建 .cursor 目錄

首先，在您的專案根目錄中創建一個名為 `.cursor` 的目錄：

```bash
# 在專案根目錄執行
mkdir -p .cursor
```

> **注意**：在某些操作系統中，以點（.）開頭的目錄可能默認隱藏。如果您在檔案管理器中看不到該目錄，請檢查顯示隱藏文件的選項。

#### 步驟 2：創建 mcp.json 配置文件

在 `.cursor` 目錄中創建 `mcp.json` 文件：

```bash
touch .cursor/mcp.json
```

#### 步驟 3：編輯 mcp.json 文件

使用您喜歡的文本編輯器打開 `mcp.json` 文件，添加以下基本配置：

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "./data"
      }
    }
  }
}
```

請將 `/absolute/path/to/mcp-shrimp-task-manager` 替換為蝦米任務管理器的實際安裝路徑。

#### 步驟 4：設定 DATA_DIR 參數

`DATA_DIR` 參數可以使用相對路徑或絕對路徑：

**使用相對路徑（推薦）**：

```json
"DATA_DIR": "./data"
```

這會在您的專案根目錄中使用 `data` 目錄存儲任務數據。這種方式有利於專案可移植性。

**使用絕對路徑**：

```json
"DATA_DIR": "/Users/username/projects/my-project/data"
```

絕對路徑提供了明確的位置指向，但降低了專案的可移植性。

#### 步驟 5：創建數據目錄

確保 `DATA_DIR` 指向的目錄存在：

```bash
# 如果使用相對路徑 "./data"
mkdir -p data
```

#### 步驟 6：更新 .gitignore（可選但推薦）

如果您的專案使用 Git 進行版本控制，建議將數據目錄添加到 `.gitignore` 文件中（除非您打算共享任務數據）：

```bash
# 添加到 .gitignore
echo "data/" >> .gitignore
```

#### 完整配置範例

以下是一個更完整的配置範例，包含常用的可選參數：

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/path/to/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "./data",
        "LOG_LEVEL": "info",
        "MAX_BACKUP_FILES": "10",
        "BACKUP_INTERVAL": "12"
      }
    }
  }
}
```

#### 測試配置

完成配置後，打開 Cursor IDE 並嘗試使用蝦米任務管理器的任何功能（如 `list_tasks`）來測試配置是否生效。系統應該會在您指定的 `DATA_DIR` 路徑創建必要的數據文件。

#### 常見問題與解決方案

1. **找不到蝦米任務管理器**

   - 檢查 `args` 中的路徑是否正確指向 dist/index.js
   - 確保已正確安裝蝦米任務管理器及其依賴

2. **無法創建或訪問數據目錄**

   - 檢查用戶對指定目錄的讀寫權限
   - 如果使用相對路徑，確認相對於專案根目錄的位置是否正確

3. **配置未生效**
   - 確保 `.cursor/mcp.json` 文件格式正確（有效的 JSON）
   - 重新啟動 Cursor IDE 以載入新配置
   - 檢查 Cursor IDE 的日誌是否有錯誤信息

### 多種配置場景範例

蝦米任務管理器可以適應多種不同的工作場景，以下提供幾種常見使用場景的配置示例和最佳實踐。

#### 1. 單一開發者多專案環境

對於同時處理多個專案的獨立開發者，專案特定配置可以幫助您維護清晰的任務隔離。

**示例配置**：

```json
// 專案A: .cursor/mcp.json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/Users/developer/tools/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "./data",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

```json
// 專案B: .cursor/mcp.json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/Users/developer/tools/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "./data",
        "LOG_LEVEL": "debug" // 不同的日誌級別
      }
    }
  }
}
```

**最佳實踐**：

- 在每個專案中使用相對路徑 `"./data"` 作為 DATA_DIR，提高可移植性
- 根據專案需求調整日誌級別和備份策略
- 使用腳本或別名簡化在多個專案間切換的操作

#### 2. 團隊協作環境

在團隊協作的環境中，專案特定配置可以確保團隊成員使用一致的設置。

**示例配置**：

```json
// 團隊專案: .cursor/mcp.json (納入版本控制)
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": [
        "${workspaceFolder}/node_modules/mcp-shrimp-task-manager/dist/index.js"
      ],
      "env": {
        "DATA_DIR": "${workspaceFolder}/data",
        "LOG_LEVEL": "info",
        "MAX_BACKUP_FILES": "10"
      }
    }
  }
}
```

**最佳實踐**：

- 使用 `${workspaceFolder}` 變數（在支持的環境中）或相對路徑，確保配置在不同團隊成員的機器上都能正常工作
- 將 `.cursor/mcp.json` 文件納入版本控制，但將數據目錄添加到 `.gitignore`
- 考慮為共享知識庫專案配置共享的數據目錄（如雲端存儲或版本控制）
- 明確記錄配置要求，確保新團隊成員能夠快速設置環境

#### 3. 臨時/測試專案設置

對於臨時專案或測試環境，您可能需要更靈活的配置。

**示例配置**：

```json
// 臨時測試專案: .cursor/mcp.json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/path/to/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "/tmp/test-project-data", // 使用臨時目錄
        "LOG_LEVEL": "debug",
        "MAX_BACKUP_FILES": "2" // 減少備份量
      }
    }
  }
}
```

**最佳實踐**：

- 對於臨時測試，可以使用系統臨時目錄存儲數據
- 設置更高的日誌級別（如 `"debug"`）以便更詳細地診斷問題
- 減少備份文件數量，避免不必要的磁盤使用
- 測試完成後記得清理臨時數據

#### 4. 絕對路徑與相對路徑的比較

選擇絕對路徑或相對路徑取決於您的具體需求。以下是兩種方式的對比分析：

**絕對路徑**：

```json
"DATA_DIR": "/Users/username/projects/my-project/data"
```

優點：

- 提供明確的數據位置，不受當前工作目錄影響
- 可以指向專案外部的數據存儲，便於共享或集中管理
- 對於固定的開發環境，配置更明確

缺點：

- 降低專案可移植性，在不同機器上需要調整路徑
- 在團隊環境中需要每個成員自定義路徑
- 可能導致硬編碼的路徑依賴

**相對路徑**：

```json
"DATA_DIR": "./data"
```

優點：

- 提高專案可移植性，可以整體移動或分享專案
- 在團隊環境中更容易標準化
- 與版本控制系統配合更好，無需針對不同環境修改配置

缺點：

- 相對於當前工作目錄，可能在某些 IDE 或調用方式下有差異
- 可能需要額外步驟確保目錄存在
- 在某些複雜的專案結構中可能引起混淆

**最佳選擇建議**：

- **團隊專案**：優先使用相對路徑，提高可移植性和一致性
- **個人專案**：可以根據個人偏好選擇，但相對路徑通常更靈活
- **服務器/CI 環境**：通常絕對路徑更可靠，便於自動化配置
- **混合方式**：在某些情況下，可以在配置中使用環境變數，統一管理路徑
