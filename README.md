# MCP 蝦米任務管理器

基於 Model Context Protocol (MCP)的任務管理系統，幫助 Agent 有效管理和執行任務。

## 功能特點

1. **任務規劃與分析**：幫助 Agent 理解和分析複雜任務
2. **任務拆分**：將大型任務拆分為可管理的小任務
3. **依賴管理**：處理任務間的依賴關係，確保正確的執行順序
4. **執行追蹤**：監控任務執行進度和狀態
5. **任務驗證**：確保任務符合預期要求
6. **工作日誌**：記錄和查詢對話歷史，提供任務執行過程的完整紀錄

## 任務管理工作流程

本系統提供了完整的任務工作流程：

1. **開始規劃 (plan_task)**：分析任務問題，確定任務範圍
2. **分析問題 (analyze_task)**：深入分析，檢查現有代碼庫避免重複
3. **反思構想 (reflect_task)**：批判性審查分析結果，確保方案完善
4. **拆分任務 (split_tasks)**：將大任務拆分為小任務，建立依賴關係
5. **列出任務 (list_tasks)**：查看所有任務及其狀態
6. **執行任務 (execute_task)**：執行特定任務
7. **檢驗任務 (verify_task)**：檢查任務完成情況
8. **完成任務 (complete_task)**：標記任務完成並提供報告

## 工作日誌功能

### 功能概述

工作日誌系統記錄 MCP 與 LLM 之間的關鍵對話內容，主要目的是：

1. **保存執行脈絡**：記錄任務執行過程中的關鍵決策和事件
2. **提供可追溯性**：方便回溯查看歷史操作和決策理由
3. **知識累積**：積累經驗知識，避免重複解決相同問題
4. **效能分析**：提供數據支持，幫助分析系統效能和改進方向

系統會自動在以下關鍵時刻記錄日誌：

- 任務執行開始時
- 關鍵決策點
- 任務驗證過程中
- 任務完成時

### 如何使用日誌查詢工具

系統提供兩個主要的日誌管理工具：

#### 1. 查詢日誌 (list_conversation_log)

```javascript
const logResult = await mcp.mcp_shrimp_task_manager.list_conversation_log({
  taskId: "任務ID", // 選填，按特定任務過濾
  startDate: "2025-01-01T00:00:00Z", // 選填，開始日期（ISO格式）
  endDate: "2025-12-31T23:59:59Z", // 選填，結束日期（ISO格式）
  limit: 20, // 選填，每頁顯示數量，預設20，最大100
  offset: 0, // 選填，分頁起始位置，預設0
});
```

參數說明：

- `taskId`：按任務 ID 過濾日誌
- `startDate`：查詢開始日期，ISO 格式字串
- `endDate`：查詢結束日期，ISO 格式字串
- `limit`：每頁顯示的記錄數量，預設 20，最大 100
- `offset`：分頁偏移量，用於實現分頁查詢

#### 2. 清除日誌 (clear_conversation_log)

```javascript
const clearResult = await mcp.mcp_shrimp_task_manager.clear_conversation_log({
  confirm: true, // 必填，確認刪除操作
});
```

注意：清除操作不可逆，請謹慎使用。

### 日誌數據結構

工作日誌的核心數據結構為 `ConversationEntry`：

```typescript
interface ConversationEntry {
  id: string; // 唯一識別符
  timestamp: Date; // 記錄時間
  participant: ConversationParticipant; // 對話參與者（MCP或LLM）
  summary: string; // 消息摘要，僅記錄關鍵信息
  relatedTaskId?: string; // 關聯的任務ID（選填）
  context?: string; // 額外上下文信息（選填）
}

enum ConversationParticipant {
  MCP = "MCP", // 系統方
  LLM = "LLM", // 模型方
}
```

日誌以 JSON 格式存儲在 `data/conversation_log.json` 文件中，當記錄數量超過閾值時，系統會自動將舊日誌歸檔並創建新的日誌文件。

### 開發者指南：擴展或修改日誌功能

#### 關鍵文件

1. **類型定義**：`src/types/index.ts`

   - 包含 `ConversationEntry` 和 `ConversationParticipant` 等核心類型定義

2. **模型層**：`src/models/conversationLogModel.ts`

   - 包含所有日誌相關的數據操作函數
   - 日誌文件的讀寫、查詢、歸檔等功能

3. **工具層**：`src/tools/logTools.ts`

   - 提供給外部調用的日誌工具函數
   - 實現格式化輸出和參數處理

4. **摘要提取**：`src/utils/summaryExtractor.ts`
   - 從完整對話中提取關鍵信息的工具
   - 使用關鍵詞匹配和重要性評分算法

#### 如何擴展

1. **添加新的日誌查詢方式**

   - 在 `conversationLogModel.ts` 中添加新的查詢函數
   - 在 `logTools.ts` 中創建相應的工具函數
   - 在 `index.ts` 中註冊新工具

2. **修改日誌存儲方式**

   - 日誌默認以 JSON 文件形式存儲，可修改 `conversationLogModel.ts` 改用數據庫存儲
   - 同時更新相關的讀寫函數

3. **優化摘要提取算法**

   - 可在 `summaryExtractor.ts` 中增強或替換摘要提取算法
   - 考慮添加基於機器學習的摘要方法

4. **添加新的日誌觸發點**
   - 在關鍵流程中調用 `addConversationEntry` 函數添加新的日誌記錄點

## 任務依賴關係

系統支持兩種方式指定任務依賴：

1. **通過任務名稱**（推薦）：使用任務名稱直接引用依賴任務，更直觀易讀

   ```json
   {
     "name": "實現前端表單",
     "dependencies": ["設計UI界面", "定義API規格"]
   }
   ```

2. **通過任務 ID**：使用任務的唯一標識符，適用於需要精確引用的場景
   ```json
   {
     "name": "部署應用",
     "dependencies": ["a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"]
   }
   ```

這種靈活的依賴指定方式讓您可以在同一批次創建的任務間建立依賴關係，無需預先知道任務 ID。

## 安裝與使用

```bash
# 安裝依賴
npm install

# 啟動服務
npm start
```

## 在支援 MCP 的客戶端中使用

蝦米任務管理器可以與任何支援 Model Context Protocol 的客戶端一起使用，例如 Cursor IDE。

### 在 Cursor IDE 中配置

1. 打開 Cursor IDE 的設定檔案（通常位於 `~/.cursor/settings.json`）
2. 在 `mcpServers` 部分添加蝦米任務管理器的配置

```json
{
  "mcpServers": [
    {
      "name": "蝦米任務管理器",
      "id": "mcp-shrimp-task-manager",
      "command": "node",
      "args": ["path/to/mcp-shrimp-task-manager/dist/index.js"],
      "description": "任務規劃、拆分、執行和管理工具",
      "env": {
        "NODE_ENV": "production"
      }
    }
  ]
}
```

請將 `path/to/mcp-shrimp-task-manager` 替換為實際的路徑。

### 可用的工具

在 Cursor IDE 中，配置完成後，您可以使用以下工具：

- **開始規劃**：`plan_task`
- **分析問題**：`analyze_task`
- **反思構想**：`reflect_task`
- **拆分任務**：`split_tasks`
- **列出任務**：`list_tasks`
- **執行任務**：`execute_task`
- **檢驗任務**：`verify_task`
- **完成任務**：`complete_task`

### 使用範例

在 Cursor IDE 中，您可以這樣使用蝦米任務管理器：

```javascript
// 開始規劃一個任務
const planResult = await mcp.mcp_shrimp_task_manager.plan_task({
  description: "開發一個用戶註冊系統",
  requirements: "需要支持電子郵件和社交媒體登入",
});

// 拆分任務
const splitResult = await mcp.mcp_shrimp_task_manager.split_tasks({
  isOverwrite: false,
  tasks: [
    {
      name: "設計用戶界面",
      description: "創建用戶友好的註冊表單界面",
      notes: "需要遵循品牌設計指南",
    },
    {
      name: "實現後端API",
      description: "開發用戶註冊和驗證API",
      dependencies: ["設計用戶界面"], // 使用任務名稱引用依賴
    },
  ],
});

// 執行任務
const executeResult = await mcp.mcp_shrimp_task_manager.execute_task({
  taskId: "task-uuid-here", // 可從list_tasks獲取
});
```

## 技術實現

- **Node.js**：JavaScript 運行時環境
- **TypeScript**：提供類型安全
- **MCP SDK**：用於與大型語言模型互動
- **UUID**：生成唯一任務標識符

## 許可協議

MIT
