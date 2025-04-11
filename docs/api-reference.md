# 蝦米任務管理器 API 參考文檔

本文檔提供蝦米任務管理器的 API 參考，包含所有可用工具的詳細說明和參數列表。

## 新增功能

### 1. 刪除任務功能

#### `delete_task`

允許刪除未完成狀態的任務，但禁止刪除已完成的任務。

**參數：**

| 參數名 | 類型   | 必填 | 描述                                                      |
| ------ | ------ | ---- | --------------------------------------------------------- |
| taskId | string | 是   | 待刪除任務的唯一標識符，必須是系統中存在且未完成的任務 ID |

**返回：**

- 成功：返回操作成功的確認訊息
- 失敗：返回錯誤訊息，說明失敗原因（任務不存在、任務已完成、有依賴關係等）

**使用範例：**

```javascript
const deleteResult = await mcp.mcp_shrimp_task_manager.delete_task({
  taskId: "task-uuid-here",
});
```

**約束條件：**

- 不允許刪除已完成的任務（狀態為 `COMPLETED`）
- 如果有其他任務依賴於此任務，也不允許刪除
- 刪除操作不可逆，請謹慎使用

### 2. 任務複雜度自適應處理

系統會在執行任務時自動評估任務複雜度，並提供相應的處理建議。此功能無需額外的 API 調用，在執行 `execute_task` 時自動應用。

**複雜度級別：**

- **低複雜度**：簡單且直接的任務，通常不需要特殊處理
- **中等複雜度**：具有一定複雜性但仍可管理的任務
- **高複雜度**：複雜且耗時的任務，需要特別關注
- **極高複雜度**：極其複雜的任務，建議拆分處理

**複雜度評估指標：**

- **描述長度**：任務描述的字符數
- **依賴數量**：任務依賴的前置任務數量
- **注記長度**：任務注記的字符數（如果有）

**複雜度閾值：**

| 指標     | 中等複雜度 | 高複雜度   | 極高複雜度 |
| -------- | ---------- | ---------- | ---------- |
| 描述長度 | >500 字符  | >1000 字符 | >2000 字符 |
| 依賴數量 | >2 個      | >5 個      | >10 個     |
| 注記長度 | >200 字符  | >500 字符  | >1000 字符 |

### 3. 任務摘要自動更新機制

當任務完成時，系統會自動生成或使用提供的摘要信息，以優化 LLM 的記憶效能。

#### `complete_task`

標記任務為已完成狀態，可提供自定義摘要或使用系統自動生成的摘要。

**參數：**

| 參數名  | 類型   | 必填 | 描述                                                                 |
| ------- | ------ | ---- | -------------------------------------------------------------------- |
| taskId  | string | 是   | 待標記為完成的任務唯一標識符，必須是狀態為「進行中」的有效任務 ID    |
| summary | string | 否   | 任務完成摘要，簡潔描述實施結果和重要決策（選填，如未提供將自動生成） |

**返回：**

- 成功：任務被標記為完成，並顯示任務報告要求
- 失敗：返回錯誤訊息，說明失敗原因

**使用範例：**

```javascript
// 提供自定義摘要
const completeResult = await mcp.mcp_shrimp_task_manager.complete_task({
  taskId: "task-uuid-here",
  summary:
    "成功實現用戶驗證功能，包括登入、登出和密碼重設流程。採用了 JWT 令牌機制確保安全性，並添加了針對常見攻擊的防護措施。",
});

// 使用自動生成的摘要
const completeResult = await mcp.mcp_shrimp_task_manager.complete_task({
  taskId: "task-uuid-here",
});
```

**自動摘要生成：**

當未提供 `summary` 參數時，系統會根據任務名稱和描述自動生成摘要。

### 4. 清除所有任務功能

#### `clear_all_tasks`

清除系統中所有未完成的任務，提供簡化的系統重置功能。

**參數：**

| 參數名  | 類型    | 必填 | 描述                      |
| ------- | ------- | ---- | ------------------------- |
| confirm | boolean | 是   | 確認刪除操作，必須為 true |

**返回：**

- 成功：返回清除操作的結果，包含被刪除的任務數量
- 失敗：返回錯誤訊息，說明失敗原因

**使用範例：**

```javascript
const clearResult = await mcp.mcp_shrimp_task_manager.clear_all_tasks({
  confirm: true, // 必須明確確認
});
```

**安全機制：**

- 必須明確設置 `confirm` 參數為 `true` 才能執行操作
- 系統會自動在清除前創建數據備份，存放在 `data/backups` 目錄
- 所有清除操作都會記錄到系統日誌中
- 已完成的任務不會被刪除，確保歷史記錄完整性

### 5. 更新任務功能

#### `update_task`

更新未完成任務的內容，包括名稱、描述和注記。

**參數：**

| 參數名      | 類型   | 必填 | 描述                                              |
| ----------- | ------ | ---- | ------------------------------------------------- |
| taskId      | string | 是   | 待更新任務的唯一標識符，必須是未完成的有效任務 ID |
| name        | string | 否   | 任務的新名稱（選填）                              |
| description | string | 否   | 任務的新描述（選填）                              |
| notes       | string | 否   | 任務的新補充說明（選填）                          |

**返回：**

- 成功：返回更新後的任務數據
- 失敗：返回錯誤訊息，說明失敗原因（如任務不存在、已完成等）

**使用範例：**

```javascript
const updateResult = await mcp.mcp_shrimp_task_manager.update_task({
  taskId: "task-uuid-here",
  name: "優化後的任務名稱",
  description: "更詳細的任務描述...",
  notes: "補充重要資訊",
});
```

**約束條件：**

- 不允許更新已完成的任務
- 至少需要提供 name、description 或 notes 中的一個參數
- 任務 ID 和完成狀態不可通過此功能更改

### 6. 任務相關文件位置記錄功能

#### `update_task_files`

為任務添加或更新相關文件記錄，提升任務執行時的上下文記憶能力。

**參數：**

| 參數名       | 類型   | 必填 | 描述                                 |
| ------------ | ------ | ---- | ------------------------------------ |
| taskId       | string | 是   | 任務的唯一標識符                     |
| relatedFiles | array  | 是   | 相關文件列表，包含以下屬性的對象數組 |

**relatedFiles 對象屬性：**

| 屬性名      | 類型   | 必填 | 描述                                                                                 |
| ----------- | ------ | ---- | ------------------------------------------------------------------------------------ |
| path        | string | 是   | 文件路徑（相對於項目根目錄或絕對路徑）                                               |
| type        | string | 是   | 文件關聯類型，可選值：「待修改」、「參考資料」、「輸出結果」、「依賴文件」、「其他」 |
| description | string | 否   | 文件的補充描述（選填）                                                               |
| lineStart   | number | 否   | 相關代碼區塊的起始行（選填）                                                         |
| lineEnd     | number | 否   | 相關代碼區塊的結束行（選填）                                                         |

**返回：**

- 成功：返回更新後的任務數據，包含完整的相關文件列表
- 失敗：返回錯誤訊息

**使用範例：**

```javascript
const updateFilesResult = await mcp.mcp_shrimp_task_manager.update_task_files({
  taskId: "task-uuid-here",
  relatedFiles: [
    {
      path: "src/components/Button.tsx",
      type: "待修改",
      description: "需要修改按鈕組件以支持新狀態",
      lineStart: 24,
      lineEnd: 45,
    },
    {
      path: "docs/design-spec.md",
      type: "參考資料",
      description: "包含按鈕設計規範",
    },
  ],
});
```

## 工作日誌功能

### 1. 查詢日誌

#### `list_conversation_log`

查詢系統對話日誌，支持按任務 ID 或時間範圍過濾，提供分頁功能。

**參數：**

| 參數名    | 類型   | 必填 | 描述                                        |
| --------- | ------ | ---- | ------------------------------------------- |
| taskId    | string | 否   | 按任務 ID 過濾（選填）                      |
| startDate | string | 否   | 起始日期過濾，ISO 格式字串（選填）          |
| endDate   | string | 否   | 結束日期過濾，ISO 格式字串（選填）          |
| limit     | number | 否   | 返回結果數量限制，預設 20，最大 100（選填） |
| offset    | number | 否   | 分頁偏移量，預設 0（選填）                  |

**使用範例：**

```javascript
const logResult = await mcp.mcp_shrimp_task_manager.list_conversation_log({
  taskId: "task-uuid-here", // 選填，按特定任務過濾
  startDate: "2025-01-01T00:00:00Z", // 選填，開始日期
  endDate: "2025-12-31T23:59:59Z", // 選填，結束日期
  limit: 20, // 選填，每頁顯示數量
  offset: 0, // 選填，分頁起始位置
});
```

### 2. 清除日誌

#### `clear_conversation_log`

清除所有對話日誌記錄，操作不可逆。

**參數：**

| 參數名  | 類型    | 必填 | 描述                      |
| ------- | ------- | ---- | ------------------------- |
| confirm | boolean | 是   | 確認刪除操作，必須為 true |

**使用範例：**

```javascript
const clearResult = await mcp.mcp_shrimp_task_manager.clear_conversation_log({
  confirm: true, // 必填，確認刪除操作
});
```

## 完整 API 列表

除了上述新增功能外，蝦米任務管理器還提供以下核心功能：

1. **開始規劃**：`plan_task`
2. **分析問題**：`analyze_task`
3. **反思構想**：`reflect_task`
4. **拆分任務**：`split_tasks`
5. **列出任務**：`list_tasks`
6. **執行任務**：`execute_task`
7. **檢驗任務**：`verify_task`
8. **完成任務**：`complete_task`
9. **刪除任務**：`delete_task`
10. **查詢日誌**：`list_conversation_log`
11. **清除日誌**：`clear_conversation_log`
