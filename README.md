# MCP 蝦米任務管理器

基於 Model Context Protocol (MCP)的任務管理系統，幫助 Agent 有效管理和執行任務。

## 功能特點

1. **任務規劃與分析**：幫助 Agent 理解和分析複雜任務
2. **任務拆分**：將大型任務拆分為可管理的小任務
3. **依賴管理**：處理任務間的依賴關係，確保正確的執行順序
4. **執行追蹤**：監控任務執行進度和狀態
5. **任務驗證**：確保任務符合預期要求

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
