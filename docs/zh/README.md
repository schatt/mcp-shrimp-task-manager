[English](../../README.md) | [中文](README.md)

# MCP 蝦米任務管理器

[![smithery badge](https://smithery.ai/badge/@cjo4m06/mcp-shrimp-task-manager)](https://smithery.ai/server/@cjo4m06/mcp-shrimp-task-manager)

> 🚀 基於 Model Context Protocol (MCP) 的智能任務管理系統，為 AI Agent 提供高效的程式開發工作流程框架。

蝦米任務管理器透過結構化的工作流程引導，協助 Agent 系統性規劃程式開發步驟，強化任務記憶管理機制，有效避免冗餘與重複的編程工作。

## ✨ 功能特點

- **任務規劃與分析**：深入理解與分析複雜任務需求
- **智能任務拆分**：將大型任務自動拆分為可管理的小型任務
- **依賴關係管理**：精確處理任務間的依賴關係，確保正確的執行順序
- **執行狀態追蹤**：即時監控任務執行進度和狀態
- **任務完整性驗證**：確保任務成果符合預期要求
- **任務複雜度評估**：自動評估任務複雜度並提供最佳處理建議
- **任務摘要自動更新**：完成任務時自動產生摘要，優化記憶效能
- **任務記憶功能**：自動備份任務歷史記錄，提供長期記憶和參考能力

## 🔄 任務管理工作流程

本系統提供完整的任務管理生命週期：

1. **開始規劃** `plan_task`：分析任務問題，確定需求範圍
2. **深入分析** `analyze_task`：檢查現有代碼庫避免重複工作
3. **方案反思** `reflect_task`：批判性審查分析結果，確保方案完善
4. **任務拆分** `split_tasks`：將複雜任務分解為小型任務，建立明確依賴關係
5. **任務列表** `list_tasks`：查看所有任務及其執行狀態
6. **執行任務** `execute_task`：執行特定任務，同時評估複雜度
7. **結果檢驗** `verify_task`：全面檢查任務完成情況
8. **任務完成** `complete_task`：標記任務完成並生成報告，自動更新摘要
9. **任務管理** `delete_task`：管理未完成的任務（已完成任務將保留在系統中）
10. **查詢任務** `query_task`：透過關鍵字查詢以往記憶是否有相關任務
11. **顯示任務** `get_task_detail`：顯示完整任務指導

## 🧠 任務記憶功能

蝦米任務管理器具備長期記憶功能，可以自動保存任務執行的歷史記錄，並在規劃新任務時提供參考經驗。

### 功能特點

- 系統會自動將任務備份到 memory 目錄中
- 備份文件按照時間順序命名，格式為 tasks_backup_YYYY-MM-DDThh-mm-ss.json
- 任務規劃 Agent 會自動獲得關於如何利用記憶功能的指導

### 優勢與效益

- **避免重複工作**：參考過去任務，不必從零開始解決類似問題
- **借鑒成功經驗**：利用已驗證有效的解決方案，提高開發效率
- **學習與改進**：識別過去的錯誤或低效方案，持續優化工作流程
- **知識沉澱**：隨著系統使用時間增長，形成持續擴展的知識庫

通過有效利用任務記憶功能，系統能夠不斷積累經驗，智能化程度和工作效率將持續提升。

## 📚 文件資源

- [系統架構](architecture.md)：詳細的系統設計與數據流說明

## 🔧 安裝與使用

### Installing via Smithery

To install 蝦米任務管理器 for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@cjo4m06/mcp-shrimp-task-manager):

```bash
npx -y @smithery/cli install @cjo4m06/mcp-shrimp-task-manager --client claude
```

### Manual Installation

```bash
# 安裝依賴套件
npm install

# 建置並啟動服務
npm run build
```

## 🔌 在支援 MCP 的客戶端中使用

蝦米任務管理器可以與任何支援 Model Context Protocol 的客戶端一起使用，例如 Cursor IDE。

### 在 Cursor IDE 中配置

蝦米任務管理器提供兩種配置方式：全局配置和專案特定配置。

#### 全局配置

1. 開啟 Cursor IDE 的全局設定檔案（通常位於 `~/.cursor/mcp.json`）
2. 在 `mcpServers` 區段中添加以下配置：

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "/mcp-shrimp-task-manager/data"
      }
    }
  }
}
```

> ⚠️ 請將 `/mcp-shrimp-task-manager` 替換為您的實際路徑。

#### 專案特定配置

您也可以為每個專案設定專屬配置，以便針對不同專案使用獨立的數據目錄：

1. 在專案根目錄創建 `.cursor` 目錄
2. 在該目錄下創建 `mcp.json` 文件，內容如下：

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/path/to/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "/path/to/project/data" // 必須使用絕對路徑
      }
    }
  }
}
```

### ⚠️ 重要配置說明

**DATA_DIR 參數**是蝦米任務管理器存儲任務數據、對話記錄等信息的目錄，正確設置此參數對於系統的正常運行至關重要。此參數必須使用**絕對路徑**，使用相對路徑可能導致系統無法正確定位數據目錄，造成數據丟失或功能失效。

> **警告**：使用相對路徑可能導致以下問題：
>
> - 數據檔案找不到，導致系統初始化失敗
> - 任務狀態丟失或無法正確保存
> - 應用程式在不同環境下行為不一致
> - 系統崩潰或無法啟動

## 💡 系統提示詞指導

### Cursor IDE 配置

您可以啟用 Cursor Settings => Features => Custom modes 功能，並配置以下兩個模式：

#### TaskPlanner 模式

```
你是一個專業的任務規劃專家，你必須與用戶進行交互，分析用戶的需求，並收集專案相關資訊，最終使用 mcp_shrimp_task_manager_plan_task 建立任務，當任務建立完成後必須總結摘要，並告知用戶使用 任務執行 Model 進行任務執行。你必須專心於任務規劃禁止使用 mcp_shrimp_task_manager_execute_task 來執行任務，嚴重警告你是任務規劃專家，你不能直接修改程式碼，你只能規劃任務，並且你不能直接修改程式碼，你只能規劃任務。
```

#### TaskExecutor 模式

```
你是一個專業的任務執行專家，當用戶有指定執行任務，則使用 mcp_shrimp_task_manager_execute_task 進行任務執行，沒有執行任務時則使用 mcp_shrimp_task_manager_list_tasks 尋找位執行的任務並執行，當執行完成後必須總結摘要告知用戶使用，你一次只能執行一個任務，單任務完成時除非用戶明確告知否則禁止進行下一則任務。用戶如果要求"連續模式"則按照順序連續執行所有任務
```

> 💡 根據您的需求場景選擇適當的模式：
>
> - 當需要規劃任務時使用 **TaskPlanner** 模式
> - 當需要執行任務時使用 **TaskExecutor** 模式

### 在其他工具中使用

如果您的工具不支援 Custom modes 功能，可以：

- 在不同階段手動貼上相應的提示詞
- 或直接使用簡單命令如 `請規劃以下任務：......` 或 `請開始執行任務...`

## 🛠️ 可用工具一覽

配置完成後，您可使用以下工具：

| 功能分類     | 工具名稱          | 功能描述           |
| ------------ | ----------------- | ------------------ |
| **任務規劃** | `plan_task`       | 開始規劃任務       |
| **任務分析** | `analyze_task`    | 深入分析任務需求   |
| **方案評估** | `reflect_task`    | 反思與改進方案構想 |
| **任務管理** | `split_tasks`     | 將任務拆分為子任務 |
|              | `list_tasks`      | 顯示所有任務及狀態 |
|              | `query_task`      | 搜尋並列出任務     |
|              | `get_task_detail` | 顯示完整任務詳情   |
|              | `delete_task`     | 刪除未完成的任務   |
| **任務執行** | `execute_task`    | 執行特定任務       |
|              | `verify_task`     | 檢驗任務完成情況   |
|              | `complete_task`   | 標記任務為已完成   |

## 🔧 技術實現

- **Node.js**：高效能的 JavaScript 運行時環境
- **TypeScript**：提供強型別安全的開發環境
- **MCP SDK**：與大型語言模型無縫互動的接口
- **UUID**：生成唯一且可靠的任務識別碼

## 📄 許可協議

本專案採用 MIT 許可協議發布
