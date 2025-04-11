// 任務狀態枚舉：定義任務在工作流程中的當前階段
export enum TaskStatus {
  PENDING = "待處理", // 已創建但尚未開始執行的任務
  IN_PROGRESS = "進行中", // 當前正在執行的任務
  COMPLETED = "已完成", // 已成功完成並通過驗證的任務
  BLOCKED = "被阻擋", // 由於依賴關係而暫時無法執行的任務
}

// 任務依賴關係：定義任務之間的前置條件關係
export interface TaskDependency {
  taskId: string; // 前置任務的唯一標識符，當前任務執行前必須完成此依賴任務
}

// 任務介面：定義任務的完整數據結構
export interface Task {
  id: string; // 任務的唯一標識符
  name: string; // 簡潔明確的任務名稱
  description: string; // 詳細的任務描述，包含實施要點和驗收標準
  notes?: string; // 補充說明、特殊處理要求或實施建議（選填）
  status: TaskStatus; // 任務當前的執行狀態
  dependencies: TaskDependency[]; // 任務的前置依賴關係列表
  createdAt: Date; // 任務創建的時間戳
  updatedAt: Date; // 任務最後更新的時間戳
  completedAt?: Date; // 任務完成的時間戳（僅適用於已完成的任務）
  summary?: string; // 任務完成摘要，簡潔描述實施結果和重要決策（僅適用於已完成的任務）
}

// 規劃任務的參數：用於初始化任務規劃階段
export interface PlanTaskArgs {
  description: string; // 完整詳細的任務問題描述，應包含任務目標、背景及預期成果
  requirements?: string; // 任務的特定技術要求、業務約束條件或品質標準（選填）
}

// 分析問題的參數：用於深入分析任務並提出技術方案
export interface AnalyzeTaskArgs {
  summary: string; // 結構化的任務摘要，包含任務目標、範圍與關鍵技術挑戰
  initialConcept: string; // 初步解答構想，包含技術方案、架構設計和實施策略
  previousAnalysis?: string; // 前次迭代的分析結果，用於持續改進方案（僅在重新分析時需提供）
}

// 反思構想的參數：用於對分析結果進行批判性評估
export interface ReflectTaskArgs {
  summary: string; // 結構化的任務摘要，保持與分析階段一致以確保連續性
  analysis: string; // 完整詳盡的技術分析結果，包括所有技術細節、依賴組件和實施方案
}

// 拆分任務的參數：用於將大型任務分解為可管理的小型任務
export interface SplitTasksArgs {
  isOverwrite: boolean; // 任務覆蓋模式選擇（true：清除並覆蓋所有現有任務；false：保留現有任務並新增）
  tasks: Array<{
    name: string; // 簡潔明確的任務名稱，應能清晰表達任務目的
    description: string; // 詳細的任務描述，包含實施要點、技術細節和驗收標準
    notes?: string; // 補充說明、特殊處理要求或實施建議（選填）
    dependencies?: string[]; // 此任務依賴的前置任務ID列表，形成任務的有向無環依賴圖
  }>;
}

// 列出任務的參數（無）

// 執行任務的參數：用於開始執行特定任務
export interface ExecuteTaskArgs {
  taskId: string; // 待執行任務的唯一標識符，必須是系統中存在的有效任務ID
}

// 檢驗任務的參數：用於評估任務的完成質量
export interface VerifyTaskArgs {
  taskId: string; // 待驗證任務的唯一標識符，必須是狀態為「進行中」的有效任務ID
}

// 完成任務的參數：用於標記任務為已完成狀態
export interface CompleteTaskArgs {
  taskId: string; // 待標記為完成的任務唯一標識符，必須是狀態為「進行中」的有效任務ID
  summary?: string; // 任務完成摘要，簡潔描述實施結果和重要決策（選填，如未提供將自動生成）
}

// 對話參與者類型：定義對話中的參與方身份
export enum ConversationParticipant {
  MCP = "MCP", // 系統方（MCP）
  LLM = "LLM", // 模型方（LLM）
}

// 對話日誌條目：記錄 MCP 與 LLM 之間的重要對話內容
export interface ConversationEntry {
  id: string; // 日誌條目的唯一標識符
  timestamp: Date; // 記錄的時間戳
  participant: ConversationParticipant; // 對話參與者（MCP 或 LLM）
  summary: string; // 消息摘要，只記錄關鍵信息點而非完整對話
  relatedTaskId?: string; // 關聯的任務 ID（選填），用於將對話與特定任務關聯
  context?: string; // 額外的上下文信息（選填），提供對話發生的背景
}

// 對話日誌列表參數：用於查詢對話日誌的參數
export interface ListConversationLogArgs {
  taskId?: string; // 按任務 ID 過濾（選填）
  startDate?: Date; // 起始日期過濾（選填）
  endDate?: Date; // 結束日期過濾（選填）
  limit?: number; // 返回結果數量限制（選填）
  offset?: number; // 分頁偏移量（選填）
}
