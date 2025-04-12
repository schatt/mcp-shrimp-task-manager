# 蝦米任務管理器 - 功能實現清單

本文檔列出蝦米任務管理器系統中所有實際實現的工具函數、參數結構和功能。此清單作為文檔審查的基準參考。

## 類型定義與枚舉

### 任務狀態枚舉 (TaskStatus)

- `PENDING = "待處理"` - 已創建但尚未開始執行的任務
- `IN_PROGRESS = "進行中"` - 當前正在執行的任務
- `COMPLETED = "已完成"` - 已成功完成並通過驗證的任務
- `BLOCKED = "被阻擋"` - 由於依賴關係而暫時無法執行的任務

### 任務依賴關係 (TaskDependency)

- `taskId: string` - 前置任務的唯一標識符，當前任務執行前必須完成此依賴任務

### 相關文件類型枚舉 (RelatedFileType)

- `TO_MODIFY = "待修改"` - 需要在任務中修改的文件
- `REFERENCE = "參考資料"` - 任務的參考資料或相關文檔
- `OUTPUT = "輸出結果"` - 任務產生的輸出文件
- `DEPENDENCY = "依賴文件"` - 任務依賴的組件或庫文件
- `OTHER = "其他"` - 其他類型的相關文件

### 相關文件 (RelatedFile)

- `path: string` - 文件路徑，可以是相對於項目根目錄的路徑或絕對路徑
- `type: RelatedFileType` - 文件與任務的關係類型
- `description?: string` - 文件的補充描述，說明其與任務的具體關係或用途
- `lineStart?: number` - 相關代碼區塊的起始行（選填）
- `lineEnd?: number` - 相關代碼區塊的結束行（選填）

### 任務介面 (Task)

- `id: string` - 任務的唯一標識符
- `name: string` - 簡潔明確的任務名稱
- `description: string` - 詳細的任務描述，包含實施要點和驗收標準
- `notes?: string` - 補充說明、特殊處理要求或實施建議（選填）
- `status: TaskStatus` - 任務當前的執行狀態
- `dependencies: TaskDependency[]` - 任務的前置依賴關係列表
- `createdAt: Date` - 任務創建的時間戳
- `updatedAt: Date` - 任務最後更新的時間戳
- `completedAt?: Date` - 任務完成的時間戳（僅適用於已完成的任務）
- `summary?: string` - 任務完成摘要，簡潔描述實施結果和重要決策（僅適用於已完成的任務）
- `relatedFiles?: RelatedFile[]` - 與任務相關的文件列表（選填）

### 對話參與者類型枚舉 (ConversationParticipant)

- `MCP = "MCP"` - 系統方（MCP）
- `LLM = "LLM"` - 模型方（LLM）

### 對話日誌條目 (ConversationEntry)

- `id: string` - 日誌條目的唯一標識符
- `timestamp: Date` - 記錄的時間戳
- `participant: ConversationParticipant` - 對話參與者（MCP 或 LLM）
- `summary: string` - 消息摘要，只記錄關鍵信息點而非完整對話
- `relatedTaskId?: string` - 關聯的任務 ID（選填），用於將對話與特定任務關聯
- `context?: string` - 額外的上下文信息（選填），提供對話發生的背景

### 任務複雜度級別枚舉 (TaskComplexityLevel)

- `LOW = "低複雜度"` - 簡單且直接的任務，通常不需要特殊處理
- `MEDIUM = "中等複雜度"` - 具有一定複雜性但仍可管理的任務
- `HIGH = "高複雜度"` - 複雜且耗時的任務，需要特別關注
- `VERY_HIGH = "極高複雜度"` - 極其複雜的任務，建議拆分處理

### 任務複雜度評估結果 (TaskComplexityAssessment)

- `level: TaskComplexityLevel` - 整體複雜度級別
- `metrics: object` - 各項評估指標的詳細數據
  - `descriptionLength: number` - 描述長度
  - `dependenciesCount: number` - 依賴數量
  - `notesLength: number` - 注記長度
  - `hasNotes: boolean` - 是否有注記
- `recommendations: string[]` - 處理建議列表

## 工具函數與參數

### 1. plan_task

**描述**：初始化並詳細規劃任務流程，建立明確的目標與成功標準

**參數**：

- `description: string` (必填) - 完整詳細的任務問題描述，應包含任務目標、背景及預期成果
  - 必須至少 10 個字符
- `requirements?: string` (選填) - 任務的特定技術要求、業務約束條件或品質標準

**返回值**：

- 返回一個包含規劃提示的響應，用於引導用戶開始任務分析

### 2. analyze_task

**描述**：深入分析任務需求並系統性檢查代碼庫，評估技術可行性與潛在風險

**參數**：

- `summary: string` (必填) - 結構化的任務摘要，包含任務目標、範圍與關鍵技術挑戰
  - 必須至少 20 個字符
- `initialConcept: string` (必填) - 初步解答構想，包含技術方案、架構設計和實施策略
  - 必須至少 50 個字符
- `previousAnalysis?: string` (選填) - 前次迭代的分析結果，用於持續改進方案

**返回值**：

- 返回一個包含技術分析指引的響應，用於指導用戶進行深入分析

### 3. reflect_task

**描述**：批判性審查分析結果，評估方案完整性並識別優化機會，確保解決方案符合最佳實踐

**參數**：

- `summary: string` (必填) - 結構化的任務摘要，保持與分析階段一致以確保連續性
  - 必須至少 20 個字符
- `analysis: string` (必填) - 完整詳盡的技術分析結果，包括所有技術細節、依賴組件和實施方案
  - 必須至少 100 個字符

**返回值**：

- 返回一個包含反思提示與實施建議的響應

### 4. split_tasks

**描述**：將複雜任務分解為獨立且可追蹤的子任務，建立明確的依賴關係和優先順序

**參數**：

- `isOverwrite: boolean` (必填) - 任務覆蓋模式選擇（true：清除並覆蓋所有現有任務；false：保留現有任務並新增）
- `tasks: Array<object>` (必填) - 結構化的任務清單，每個任務應保持原子性且有明確的完成標準
  - `name: string` (必填) - 簡潔明確的任務名稱，應能清晰表達任務目的
    - 不超過 100 個字符
  - `description: string` (必填) - 詳細的任務描述，包含實施要點、技術細節和驗收標準
    - 必須至少 10 個字符
  - `notes?: string` (選填) - 補充說明、特殊處理要求或實施建議
  - `dependencies?: string[]` (選填) - 此任務依賴的前置任務 ID 或任務名稱列表
  - `relatedFiles?: RelatedFile[]` (選填) - 與任務相關的文件列表

**返回值**：

- 返回一個包含任務拆分結果的響應，包括成功創建的任務數量和任務 ID 列表

### 5. list_tasks

**描述**：生成結構化任務清單，包含完整狀態追蹤、優先級和依賴關係

**參數**：無

**返回值**：

- 返回一個包含任務清單的響應，按狀態分組顯示所有任務

### 6. execute_task

**描述**：按照預定義計劃執行特定任務，確保每個步驟的輸出符合質量標準

**參數**：

- `taskId: string` (必填) - 待執行任務的唯一標識符，必須是系統中存在的有效任務 ID

**返回值**：

- 返回一個包含任務執行指南的響應，包括任務詳情、複雜度評估和執行步驟建議

### 7. verify_task

**描述**：全面驗證任務完成度，確保所有需求與技術標準都已滿足，並無遺漏細節

**參數**：

- `taskId: string` (必填) - 待驗證任務的唯一標識符，必須是系統中存在的有效任務 ID

**返回值**：

- 返回一個包含任務驗證結果的響應，包括完成標準檢查和具體驗證項

### 8. complete_task

**描述**：正式標記任務為完成狀態，生成詳細的完成報告，並更新關聯任務的依賴狀態

**參數**：

- `taskId: string` (必填) - 待完成任務的唯一標識符，必須是系統中存在的有效任務 ID
- `summary?: string` (選填) - 任務完成摘要，簡潔描述實施結果和重要決策

**返回值**：

- 返回一個包含任務完成確認的響應，包括完成時間和更新的依賴任務狀態

### 9. delete_task

**描述**：刪除未完成的任務，但不允許刪除已完成的任務，確保系統記錄的完整性

**參數**：

- `taskId: string` (必填) - 待刪除任務的唯一標識符，必須是系統中存在且未完成的任務 ID

**返回值**：

- 返回一個包含任務刪除結果的響應，包括成功或失敗的訊息

### 10. clear_all_tasks

**描述**：刪除系統中所有未完成的任務，該指令必須由用戶明確確認才能執行

**參數**：

- `confirm: boolean` (必填) - 確認刪除所有未完成的任務（此操作不可逆）

**返回值**：

- 返回一個包含清除操作結果的響應，包括成功或失敗的訊息

### 11. update_task

**描述**：更新任務內容，包括名稱、描述和注記，但不允許修改已完成的任務

**參數**：

- `taskId: string` (必填) - 待更新任務的唯一標識符，必須是系統中存在且未完成的任務 ID
- `name?: string` (選填) - 任務的新名稱
- `description?: string` (選填) - 任務的新描述內容
- `notes?: string` (選填) - 任務的新補充說明

**返回值**：

- 返回一個包含任務更新結果的響應，包括成功或失敗的訊息

### 12. update_task_files

**描述**：更新任務相關文件列表，用於記錄與任務相關的代碼文件、參考資料等

**參數**：

- `taskId: string` (必填) - 待更新任務的唯一標識符，必須是系統中存在且未完成的任務 ID
- `relatedFiles: Array<RelatedFile>` (必填) - 與任務相關的文件列表
  - `path: string` (必填) - 文件路徑，可以是相對於項目根目錄的路徑或絕對路徑
  - `type: RelatedFileType` (必填) - 文件與任務的關係類型
  - `description?: string` (選填) - 文件的補充描述
  - `lineStart?: number` (選填) - 相關代碼區塊的起始行
  - `lineEnd?: number` (選填) - 相關代碼區塊的結束行

**返回值**：

- 返回一個包含文件更新結果的響應，包括成功或失敗的訊息

### 13. list_conversation_log

**描述**：查詢系統對話日誌，支持按任務 ID 或時間範圍過濾，提供分頁功能處理大量記錄

**參數**：

- `taskId?: string` (選填) - 按任務 ID 過濾對話記錄
- `startDate?: string` (選填) - 起始日期過濾，格式為 ISO 日期字串
- `endDate?: string` (選填) - 結束日期過濾，格式為 ISO 日期字串
- `limit?: number` (選填，預設 20) - 返回結果數量限制，最大 100
- `offset?: number` (選填，預設 0) - 分頁偏移量

**返回值**：

- 返回一個包含對話日誌查詢結果的響應，包括日誌條目列表及分頁信息

### 14. clear_conversation_log

**描述**：清除所有對話日誌記錄，需要明確確認以避免意外操作

**參數**：

- `confirm: boolean` (必填) - 確認刪除所有日誌記錄（此操作不可逆）

**返回值**：

- 返回一個包含清除操作結果的響應，包括成功或失敗的訊息

## 工具函數重要細節

### 依賴關係 (dependencies) 處理

- 在 `splitTasks` 和其他函數中，`dependencies` 參數允許接受任務名稱或任務 ID(UUID)
- 系統會在任務創建或更新時將字串陣列轉換為 `TaskDependency` 物件陣列
- 任務依賴關係形成有向無環圖(DAG)，用於確定任務執行順序和阻塞狀態

### 任務複雜度評估

- 系統使用 `assessTaskComplexity` 函數評估任務的複雜度
- 評估基於多個指標：描述長度、依賴數量、注記長度等
- 根據 `TaskComplexityThresholds` 定義的閾值來判定複雜度級別
- 複雜度評估結果用於生成適當的處理建議

### 文件處理功能

- `loadTaskRelatedFiles` 函數不實際讀取檔案內容，僅生成文件資訊摘要
- 文件按類型優先級排序：待修改 > 參考資料 > 依賴文件 > 輸出結果 > 其他
- 支持指定代碼區塊行號範圍，便於精確定位關鍵實現

### 日誌管理

- 系統會自動記錄重要操作到對話日誌
- 長文本會自動使用 `extractSummary` 函數提取摘要，避免日誌過於冗長
- 日誌條目數量超過閾值時會進行自動輪換和歸檔
- 日誌查詢支持多種過濾條件和分頁功能

## 實用工具函數

### 摘要提取 (summaryExtractor.ts)

- `extractSummary` - 從文本中提取簡短摘要，自動處理 Markdown 格式
- `generateTaskSummary` - 基於任務名稱和描述生成任務完成摘要
- `extractTitle` - 從內容中提取適合作為標題的文本
- `extractSummaryFromConversation` - 從對話記錄中提取摘要信息

### 文件加載 (fileLoader.ts)

- `loadTaskRelatedFiles` - 生成任務相關文件的內容摘要
- `generateFileInfo` - 生成文件基本資訊摘要
