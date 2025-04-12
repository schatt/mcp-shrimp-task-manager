import { z } from "zod";
import {
  getAllTasks,
  getTaskById,
  updateTaskStatus,
  canExecuteTask,
  batchCreateOrUpdateTasks,
  deleteTask as modelDeleteTask,
  updateTaskSummary,
  assessTaskComplexity,
  clearAllTasks as modelClearAllTasks,
  updateTaskContent as modelUpdateTaskContent,
  updateTaskRelatedFiles as modelUpdateTaskRelatedFiles,
} from "../models/taskModel.js";
import {
  TaskStatus,
  ConversationParticipant,
  TaskComplexityLevel,
  RelatedFileType,
  RelatedFile,
  Task,
  TaskDependency,
} from "../types/index.js";
import {
  addConversationEntry,
  getConversationEntriesByTaskId,
} from "../models/conversationLogModel.js";
import {
  extractSummary,
  generateTaskSummary,
} from "../utils/summaryExtractor.js";
import { loadTaskRelatedFiles } from "../utils/fileLoader.js";

/**
 * 將任務狀態轉換為更友好的顯示文字
 */
function getTaskStatusDisplay(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.PENDING:
      return "待處理";
    case TaskStatus.IN_PROGRESS:
      return "進行中";
    case TaskStatus.COMPLETED:
      return "已完成";
    default:
      return status;
  }
}

/**
 * 格式化日期為更友好的顯示格式
 */
function formatDate(date: Date): string {
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 開始規劃工具
export const planTaskSchema = z.object({
  description: z
    .string()
    .min(10, {
      message: "任務描述不能少於10個字符，請提供更詳細的描述以確保任務目標明確",
    })
    .describe("完整詳細的任務問題描述，應包含任務目標、背景及預期成果"),
  requirements: z
    .string()
    .optional()
    .describe("任務的特定技術要求、業務約束條件或品質標準（選填）"),
  existingTasksReference: z
    .boolean()
    .optional()
    .default(false)
    .describe("是否參考現有任務作為規劃基礎，用於任務調整和延續性規劃"),
});

export async function planTask({
  description,
  requirements,
  existingTasksReference = false,
}: z.infer<typeof planTaskSchema>) {
  // 記錄任務規劃開始
  try {
    // 使用摘要提取工具處理較長的描述
    const descriptionSummary = extractSummary(description, 100);
    await addConversationEntry(
      ConversationParticipant.MCP,
      `開始新任務規劃，描述：${descriptionSummary}`,
      undefined,
      "任務規劃"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  let prompt = `## 任務分析請求\n\n請仔細分析以下任務問題，理解其核心要求、範圍和約束條件：\n\n\`\`\`\n${description}\n\`\`\`\n\n`;

  if (requirements) {
    prompt += `## 附加要求與限制條件\n\n請確保方案完全符合以下要求：\n\n\`\`\`\n${requirements}\n\`\`\`\n\n`;
  }

  // 當 existingTasksReference 為 true 時，從數據庫中載入所有任務作為參考
  if (existingTasksReference) {
    try {
      const allTasks = await getAllTasks();

      // 將任務分為已完成和未完成兩類
      const completedTasks = allTasks.filter(
        (task) => task.status === TaskStatus.COMPLETED
      );
      const pendingTasks = allTasks.filter(
        (task) => task.status !== TaskStatus.COMPLETED
      );

      // 如果存在任務，則添加到提示詞中
      if (allTasks.length > 0) {
        prompt += `## 現有任務參考\n\n您正在對現有任務進行調整或延續規劃。以下任務資訊將作為您分析和規劃的基礎：\n\n`;

        // 添加已完成任務的參考
        if (completedTasks.length > 0) {
          prompt += `### 已完成的任務（僅供參考，不可修改）\n\n`;
          prompt += `以下任務已標記為完成，作為系統穩定功能的基石和固定參考點：\n\n`;

          // 最多顯示10個已完成任務，避免提示詞過長
          const tasksToShow =
            completedTasks.length > 10
              ? completedTasks.slice(0, 10)
              : completedTasks;

          tasksToShow.forEach((task, index) => {
            // 使用摘要提取工具處理較長的描述
            const taskDescriptionSummary = extractSummary(
              task.description,
              100
            );
            prompt += `${index + 1}. **${task.name}** (ID: \`${task.id}\`)\n`;
            prompt += `   - 描述：${taskDescriptionSummary}\n`;
            if (task.completedAt) {
              prompt += `   - 完成時間：${formatDate(task.completedAt)}\n`;
            }

            if (index < tasksToShow.length - 1) {
              prompt += `\n`;
            }
          });

          if (completedTasks.length > 10) {
            prompt += `\n*（僅顯示前10個已完成任務，實際共有 ${completedTasks.length} 個已完成任務）*\n`;
          }
        }

        // 添加未完成任務的參考
        if (pendingTasks.length > 0) {
          prompt += `\n### 未完成的任務（可根據需要調整）\n\n`;
          prompt += `以下任務尚未完成，您可以根據新需求對其進行調整或重新規劃：\n\n`;

          pendingTasks.forEach((task, index) => {
            // 使用摘要提取工具處理較長的描述
            const taskDescriptionSummary = extractSummary(
              task.description,
              150
            );
            prompt += `${index + 1}. **${task.name}** (ID: \`${task.id}\`)\n`;
            prompt += `   - 描述：${taskDescriptionSummary}\n`;
            prompt += `   - 狀態：${getTaskStatusDisplay(task.status)}\n`;

            // 如果有依賴關係，也顯示出來
            if (task.dependencies && task.dependencies.length > 0) {
              prompt += `   - 依賴：${task.dependencies
                .map((dep) => `\`${dep.taskId}\``)
                .join(", ")}\n`;
            }

            if (index < pendingTasks.length - 1) {
              prompt += `\n`;
            }
          });
        }

        prompt += `\n## 任務調整指南\n\n`;
        prompt += `規劃新任務或調整現有任務時，請嚴格遵循以下五項原則：\n\n`;
        prompt += `1. **已完成任務保護原則** - 已完成的任務是系統穩定功能的基石，絕對不可修改或刪除。\n`;
        prompt += `2. **未完成任務可調整原則** - 未完成的任務可以根據新需求進行調整，包括修改描述、依賴關係等，或建議移除。\n`;
        prompt += `3. **任務ID一致性原則** - 引用現有任務時必須使用其原始ID，以確保系統跟踪的準確性。\n`;
        prompt += `4. **依賴關係完整性原則** - 調整任務計劃時必須維護依賴關係的完整性：\n`;
        prompt += `   - 不創建循環依賴\n`;
        prompt += `   - 不依賴已標記為移除的任務\n`;
        prompt += `   - 確保新增依賴關係合理且必要\n`;
        prompt += `5. **任務延續性原則** - 新任務應與現有任務構成連貫整體，維持整體計劃的邏輯性和可行性。\n\n`;
        prompt += `**重要提醒：** 系統強制執行已完成任務保護機制，無法修改已完成的任務。請在規劃階段充分考慮這一限制。\n\n`;

        // 添加選擇性任務更新模式指導
        prompt += `## 選擇性任務更新指南\n\n`;
        prompt += `任務更新時，您可以選擇以下三種更新模式，每種模式適用於不同的場景：\n\n`;
        prompt += `### 1. **追加模式(append)**\n`;
        prompt += `- **說明**：保留所有現有任務，僅添加新任務\n`;
        prompt += `- **適用場景**：逐步擴展功能，添加獨立的新特性，現有任務計劃仍然有效\n`;
        prompt += `- **使用方式**：split_tasks 工具中設置 \`updateMode="append"\`\n`;
        prompt += `- **潛在問題**：長期使用可能導致積累過多已不再相關但未完成的任務\n\n`;

        prompt += `### 2. **覆蓋模式(overwrite)**\n`;
        prompt += `- **說明**：清除所有現有未完成任務，完全使用新任務列表替換\n`;
        prompt += `- **適用場景**：徹底變更方向，現有未完成任務已完全不相關\n`;
        prompt += `- **使用方式**：split_tasks 工具中設置 \`updateMode="overwrite"\`\n`;
        prompt += `- **潛在問題**：可能會丟失有價值的未完成任務，需要確保所有重要任務都在新列表中\n\n`;

        prompt += `### 3. **選擇性更新模式(selective)**\n`;
        prompt += `- **說明**：根據任務名稱匹配選擇性地更新任務，保留不在列表中的現有任務\n`;
        prompt += `- **適用場景**：部分調整任務計劃，保留部分未完成任務，更新或添加其他任務\n`;
        prompt += `- **使用方式**：split_tasks 工具中設置 \`updateMode="selective"\`\n`;
        prompt += `- **工作原理**：\n`;
        prompt += `  1. 對於名稱相同的任務，更新其內容（描述、注釋等），保留原ID和創建時間\n`;
        prompt += `  2. 新任務名稱的條目將被創建為新任務\n`;
        prompt += `  3. 不在提交列表中的現有任務將被保留不變\n`;
        prompt += `- **最佳實踐**：在需要微調部分任務時優先選擇此模式，既避免重建所有任務，又能保持計劃的連續性\n\n`;

        prompt += `### 實際應用建議\n`;
        prompt += `- 對於小範圍調整，優先使用 **selective** 模式，精確更新目標任務\n`;
        prompt += `- 需要添加新功能時，可使用 **append** 模式保留現有工作\n`;
        prompt += `- 僅在徹底重構計劃時使用 **overwrite** 模式，謹慎權衡是否真正需要刪除所有未完成任務\n`;
        prompt += `- 無論使用哪種模式，始終需要**維護依賴關係的完整性和正確性**\n\n`;
      }
    } catch (error) {
      console.error("載入現有任務時發生錯誤:", error);
    }
  }

  prompt += `## 分析指引\n\n1. 首先確定任務的確切目標和預期成果
2. 識別任務中可能的技術挑戰和關鍵決策點
3. 考慮潛在的解決方案和替代方案
4. 評估每種方案的優缺點
5. 判斷是否需要分解為多個子任務
6. 考慮與現有系統的集成需求

如果對任務描述有任何不清楚或需要澄清的地方，請明確向用戶提問。提問時應具體指出哪些資訊缺失或模糊，並提供可能的選項。

## 任務分析最佳實踐\n\n- 保持客觀分析，避免過早做出技術選擇
- 考慮長期影響，不僅僅關注短期解決方案
- 識別假設和風險，明確標注需要進一步確認的部分
- 在分析中引用相關文檔或代碼庫中的證據支持您的觀點

## 收集資訊最佳實踐
- 當遇到你不理解或不確定的內容，請勿產生幻覺
- 當你遇到不理解專有名詞時，請勿產生幻覺
- 你可以適當的時候網路搜尋工具，查詢相關的內容
- 當你遇到需要查詢的內容時，請使用網路搜尋工具，例如包括但不限於 ddg_search、web、web_search 等等...

## 下一步行動\n\n完成初步分析後，請使用「analyze_task」工具提交您的分析結果，必須包含以下兩個關鍵部分：\n\n1. **結構化的任務摘要**：
   - 明確的任務目標和期望成果
   - 明確的範圍界定（包括明確標注哪些不在範圍內）
   - 主要技術挑戰清單
   - 相關係統依賴和限制條件

2. **初步解答構想**：
   - 詳細的技術方案描述
   - 實施策略和主要步驟
   - 可能的替代方案及其優缺點比較
   - 測試和驗證策略建議

請確保您的分析全面且深入，這將作為後續所有開發工作的基礎。`;

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}

// 分析問題工具
export const analyzeTaskSchema = z.object({
  summary: z
    .string()
    .min(20, {
      message:
        "任務摘要太短，請提供更詳細的摘要，包含任務目標、範圍與關鍵技術挑戰",
    })
    .describe("結構化的任務摘要，包含任務目標、範圍與關鍵技術挑戰"),
  initialConcept: z
    .string()
    .min(50, {
      message: "初步解答構想過於簡短，請提供更完整的技術方案和實施策略詳情",
    })
    .describe("初步解答構想，包含技術方案、架構設計和實施策略"),
  previousAnalysis: z
    .string()
    .optional()
    .describe("前次迭代的分析結果，用於持續改進方案（僅在重新分析時需提供）"),
});

export async function analyzeTask({
  summary,
  initialConcept,
  previousAnalysis,
}: z.infer<typeof analyzeTaskSchema>) {
  // 記錄任務分析
  try {
    // 使用摘要提取工具處理較長的概念描述
    const conceptSummary = extractSummary(initialConcept, 100);
    await addConversationEntry(
      ConversationParticipant.MCP,
      `開始分析任務：${extractSummary(
        summary,
        100
      )}，初步概念：${conceptSummary}`,
      undefined,
      "任務分析"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  let prompt = `## 代碼庫分析任務\n\n### 任務摘要\n\`\`\`\n${summary}\n\`\`\`\n\n已收到您的初步解答構想：\n\n\`\`\`\n${initialConcept}\n\`\`\`\n\n`;

  prompt += `## 技術審核指引\n\n請執行以下詳細的技術分析步驟：\n\n### 1. 代碼庫分析
- 檢查現有程式碼庫中的相似實現或可重用組件
- 分析系統架構，確定新功能的適當位置
- 評估與現有模塊的整合方式和潛在影響
- 識別可能受影響的其他系統部分

### 2. 技術策略評估
- 評估是否可以抽象出通用模式或利用現有框架
- 考慮模塊化和可擴展性設計原則
- 分析提案的擴展性和未來兼容性
- 評估測試策略和測試覆蓋率要求

### 3. 風險和質量分析
- 識別潛在的技術債務或效能瓶頸
- 評估安全性和數據完整性考量
- 分析錯誤處理和異常情況處理機制

### 4. 實施建議
- 確保方案符合項目的架構風格和最佳實踐
- 建議特定的實施方法和技術選擇
- 提出明確的開發步驟和里程碑

請特別關注程式碼重用的機會，避免重複實作已有功能，降低技術債務風險。分析中應引用具體的代碼文件和行號作為證據支持您的評估。`;

  if (previousAnalysis) {
    prompt += `\n\n## 迭代分析\n\n請對照先前的分析結果進行比較和改進：\n\n\`\`\`\n${previousAnalysis}\n\`\`\`\n\n請明確識別：\n1. 哪些問題已經解決，以及解決方案的有效性
2. 哪些問題仍然存在，及其優先級和嚴重性
3. 您的新方案如何解決之前未解決的問題
4. 迭代過程中獲得的新見解和經驗教訓`;
  }

  prompt += `\n\n## 下一步行動\n\n完成深入分析後，請使用「reflect_task」工具提交您的最終分析，必須包含：\n\n1. **原始任務摘要**：
   - 保持與第一階段一致，確保分析連續性
   - 必要時可以澄清或精確化原始摘要，但不應改變核心目標

2. **完整的分析結果**：
   - 詳盡的技術細節和規格定義
   - 與現有系統的所有接口和依賴關係
   - 明確的實施策略和步驟
   - 預期結果和驗收標準
   - 具體的工作量估計和資源需求

您的詳細分析將決定任務的解決方案質量。請確保全面考慮各種技術因素和業務約束，提供專業且實用的技術建議。`;

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}

// 反思構想工具
export const reflectTaskSchema = z
  .object({
    summary: z
      .string()
      .min(20, {
        message: "任務摘要太短，請確保包含完整的任務目標和範圍以維持分析連續性",
      })
      .describe("結構化的任務摘要，保持與分析階段一致以確保連續性"),
    analysis: z
      .string()
      .min(100, {
        message:
          "技術分析結果過於簡略，請提供更詳盡的技術細節、依賴組件和實施方案說明",
      })
      .describe("完整詳盡的技術分析結果，包括所有技術細節、依賴組件和實施方案"),
  })
  .refine((data) => data.summary.length * 3 <= data.analysis.length, {
    message:
      "分析內容應該比摘要更詳細，建議分析部分至少是摘要長度的3倍以提供足夠的技術深度",
    path: ["analysis"],
  });

export async function reflectTask({
  summary,
  analysis,
}: z.infer<typeof reflectTaskSchema>) {
  // 記錄任務反思
  try {
    // 使用摘要提取工具處理較長的分析
    const analysisSummary = extractSummary(analysis, 100);
    await addConversationEntry(
      ConversationParticipant.MCP,
      `開始反思任務解決方案：${extractSummary(
        summary,
        50
      )}，分析：${analysisSummary}`,
      undefined,
      "任務反思"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  const prompt = `## 解決方案反思與評估\n\n### 任務摘要\n\`\`\`\n${summary}\n\`\`\`\n\n### 詳細分析結果\n\`\`\`\n${analysis}\n\`\`\`\n\n## 批判性評估指引\n\n請從以下多個維度對您的解決方案進行全面且批判性的審查：\n\n### 1. 技術完整性評估
- 方案是否存在技術缺陷或邏輯漏洞？從各個角度檢驗解決方案的完整性。
- 所有邊緣情況和異常處理是否周全？列舉可能的異常場景並驗證處理方式。
- 所有數據流和控制流是否清晰定義？繪製流程圖以確認各環節無缺失。
- 實現是否考慮了所有必要的技術限制和依賴條件？檢查系統間的相互作用。
- 解決方案的技術選擇是否適合問題的性質和規模？評估技術選型合理性。

### 2. 效能與可擴展性評估
- 解決方案在資源使用效率方面是否最佳化？分析計算、存儲和網絡資源消耗。
- 系統在負載增加時是否仍能保持穩定性能？考慮擴展性瓶頸和解決方案。
- 是否有可能進一步優化的部分？找出潛在的優化點並提出具體改進方案。
- 是否考慮了未來功能擴展的可能性？評估方案的長期可持續性。

### 3. 需求符合度評估
- 解決方案是否完全實現了所有功能需求？逐條核對需求列表。
- 是否符合所有非功能性需求（如安全性、可維護性）？全面檢查各方面的需求符合情況。
- 是否有遺漏或誤解的需求？重新審視原始任務描述，確保全部涵蓋。
- 使用者體驗和可用性是否達到預期標準？從最終用戶角度評估方案。
- 是否考慮了業務流程與解決方案的整合？確認解決方案能夠融入現有業務流程。

## 決策點與行動建議\n\n基於您的反思，請選擇下一步行動：\n\n- **如果發現需要顯著改進的關鍵問題**：
  - 請使用「analyze_task」工具，重新提交改進後的方案
  - 明確指出問題所在並提供具體的改進方向
  - 保留原摘要，但徹底修訂方案中的問題部分

- **如果只需輕微調整或優化**：
  - 直接在下一步中應用這些小的改進
  - 記錄需要調整的具體點供後續實施參考

- **如果確認方案已足夠完善**：
  - 請使用「split_tasks」工具，將解決方案分解為具體、可執行的子任務
  - 建立明確的依賴關係和執行順序
  - 為每個子任務設定明確的完成標準和驗收條件

## split_tasks 的 updateMode 選擇建議
  - 若希望**保留所有現有任務並添加新任務**，使用 updateMode="append"
  - 若希望**清除所有未完成任務**，但保留已完成任務，使用 updateMode="overwrite"
  - 若希望**選擇性更新特定任務**，同時保留其他未完成任務，使用 updateMode="selective"

您的批判性評估將決定最終方案的質量，請務必嚴格審查，不放過任何潛在問題。`;

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}

// 拆分任務工具
export const splitTasksSchema = z
  .object({
    updateMode: z
      .enum(["append", "overwrite", "selective", "clearAllTasks"])
      .optional()
      .describe(
        "任務更新模式：'append'(保留現有任務並新增)、'overwrite'(清除所有未完成任務並重建)、'selective'(根據名稱匹配更新現有任務，保留其餘任務)、'clearAllTasks'(清除所有任務並創建備份)"
      ),
    tasks: z
      .array(
        z.object({
          name: z
            .string()
            .max(100, { message: "任務名稱過長，請保持簡潔，不超過100個字符" })
            .describe("簡潔明確的任務名稱，應能清晰表達任務目的"),
          description: z
            .string()
            .min(10, {
              message:
                "任務描述太簡短，請提供更詳細的描述，包含實施要點和驗收標準",
            })
            .describe("詳細的任務描述，包含實施要點、技術細節和驗收標準"),
          notes: z
            .string()
            .optional()
            .describe("補充說明、特殊處理要求或實施建議（選填）"),
          dependencies: z
            .array(z.string(), {
              message: "必須是字串陣列，支援任務名稱或任務ID(UUID)",
            })
            .optional()
            .describe(
              "此任務依賴的前置任務ID或任務名稱列表，支持兩種引用方式，名稱引用更直觀"
            ),
          relatedFiles: z
            .array(
              z.object({
                path: z
                  .string()
                  .min(1, { message: "檔案路徑不能為空" })
                  .describe("檔案路徑，相對於專案根目錄"),
                type: z
                  .nativeEnum(RelatedFileType)
                  .describe("檔案類型，用於區分不同類型的檔案"),
                description: z
                  .string()
                  .min(1, { message: "檔案描述不能為空" })
                  .describe("檔案描述，用於說明檔案的用途和內容"),
              })
            )
            .optional()
            .describe("與任務相關的檔案列表，包含檔案路徑、類型和描述"),
        })
      )
      .min(1, { message: "至少需要提供一個任務，請確保任務列表不為空" })
      .describe("結構化的任務清單，每個任務應保持原子性且有明確的完成標準"),
  })
  .refine(
    (data) => {
      // 檢查任務名稱是否有重複
      const nameSet = new Set();
      for (const task of data.tasks) {
        if (nameSet.has(task.name)) {
          return false;
        }
        nameSet.add(task.name);
      }
      return true;
    },
    {
      message: "任務列表中存在重複的任務名稱，請確保每個任務名稱是唯一的",
      path: ["tasks"],
    }
  );

export async function splitTasks({
  updateMode,
  tasks,
}: z.infer<typeof splitTasksSchema>) {
  // 如果未指定更新模式，預設為 "append" 模式
  const effectiveUpdateMode = updateMode || "append";

  // 處理 clearAllTasks 模式，直接調用 modelClearAllTasks 函數
  if (effectiveUpdateMode === "clearAllTasks") {
    const clearResult = await modelClearAllTasks();

    // 記錄清除結果
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `清除所有任務：${clearResult.success ? "成功" : "失敗"}，${
          clearResult.message
        }`,
        undefined,
        "任務清除"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    // 返回清除操作結果
    let prompt = `## 任務清除結果\n\n### 系統通知\n${clearResult.message}\n\n`;

    if (clearResult.success) {
      if (clearResult.backupFile) {
        prompt += `### 備份信息\n備份文件已創建：${clearResult.backupFile}\n\n`;
      }

      if (tasks.length > 0) {
        prompt += `系統將繼續創建您請求的 ${tasks.length} 個新任務。\n`;
      } else {
        prompt += `### 注意\n您沒有提供任何新任務。如需創建新任務，請使用 "append" 模式並提供任務列表。\n`;
        return {
          content: [
            {
              type: "text" as const,
              text: prompt,
            },
          ],
        };
      }
    } else {
      prompt += `### 錯誤信息\n清除任務時遇到問題：${clearResult.message}\n任務清單未更改。\n`;
      return {
        content: [
          {
            type: "text" as const,
            text: prompt,
          },
        ],
      };
    }
  }

  // 根據不同更新模式生成日誌訊息
  let updateModeMessage = "";
  if (effectiveUpdateMode === "append") {
    updateModeMessage = "追加模式：保留現有任務並新增";
  } else if (effectiveUpdateMode === "overwrite") {
    updateModeMessage = "覆蓋模式：清除所有未完成任務並重建";
  } else if (effectiveUpdateMode === "selective") {
    updateModeMessage =
      "選擇性更新模式：根據任務名稱更新現有任務、新增缺少任務，保留其餘任務";
  } else if (effectiveUpdateMode === "clearAllTasks") {
    updateModeMessage = "清除模式：清除所有任務並創建備份";
  }

  // 記錄任務拆分
  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      `拆分任務：${updateModeMessage}，任務數量：${tasks.length}`,
      undefined,
      "任務拆分"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  // 批量創建任務 - 將 updateMode 傳遞給 batchCreateOrUpdateTasks
  const createdTasks = await batchCreateOrUpdateTasks(
    tasks,
    effectiveUpdateMode
  );

  // 記錄任務創建成功
  try {
    const taskNames = createdTasks.map((task) => task.name).join(", ");
    await addConversationEntry(
      ConversationParticipant.MCP,
      `成功創建任務：${taskNames}`,
      undefined,
      "任務創建"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  // 獲取所有任務，用於顯示完整的依賴關係
  const allTasks = await getAllTasks();

  let prompt = `## 任務拆分結果 - ${effectiveUpdateMode} 模式\n\n### 系統確認\n任務已成功${
    effectiveUpdateMode === "overwrite"
      ? "覆蓋未完成的任務清單（已完成任務已保留）"
      : effectiveUpdateMode === "selective"
      ? "選擇性更新任務清單"
      : "新增至現有任務清單"
  }。\n\n`;

  prompt += `## 任務拆分指南\n\n### 有效的任務拆分策略\n\n1. **按功能分解** - 將大功能拆分為獨立可測試的子功能
   - 每個子功能應有清晰的輸入、輸出和功能邊界
   - 確保子功能間邏輯關係明確且最小化耦合
   - 避免功能過度細分導致管理複雜度增加

2. **按技術層次分解** - 沿系統架構層次分離任務
   - 前端界面層、業務邏輯層、數據訪問層分別拆分
   - 確保層間接口明確，便於並行開發
   - 優先完成底層核心功能，逐層向上構建

3. **按開發階段分解** - 從原型到完善的演進路徑
   - 初始開發階段專注核心功能實現
   - 測試與完善階段改進錯誤處理與邊緣案例
   - 優化階段專注性能與用戶體驗提升

4. **按風險程度分解** - 隔離高風險部分
   - 將技術風險高的部分單獨拆分為探索性任務
   - 將業務邏輯複雜的部分細化為可管理的子任務
   - 通過獨立任務降低風險對整體進度的影響

## 任務質量審核指引\n\n請根據以下標準對任務拆分進行嚴格的質量審核：\n\n### 1. 任務原子性\n- 每個任務是否足夠小且具體，可獨立完成？
- 任務是否具有清晰的完成標準？
- 是否避免了範圍過大的任務？
- 任務大小是否平衡，避免出現極大或極小的任務？

### 2. 依賴關係完整性\n- 任務依賴關係是否形成有向無環圖？
- 是否存在隱藏依賴未被明確標記？
- 依賴鏈是否最短化，避免不必要的阻塞？
- 是否優先考慮了任務的並行執行可能性？

### 3. 描述完整性\n- 每個任務描述是否清晰準確？
- 是否包含足夠的上下文信息？
- 注意事項是否涵蓋關鍵實施細節？
- 是否明確了任務的驗收標準？

## 詳細任務清單\n\n${createdTasks
    .map(
      (task, index) =>
        `### 任務 ${index + 1}：${task.name}\n**ID:** \`${
          task.id
        }\`\n**描述:** ${task.description}\n${
          task.notes ? `**注意事項:** ${task.notes}\n` : ""
        }${
          task.dependencies.length > 0
            ? `**依賴任務:** ${task.dependencies
                .map((d) => {
                  // 查找依賴任務的名稱，提供更友好的顯示
                  const depTask = allTasks.find((t) => t.id === d.taskId);
                  return depTask
                    ? `"${depTask.name}" (\`${d.taskId}\`)`
                    : `\`${d.taskId}\``;
                })
                .join(", ")}\n`
            : "**依賴任務:** 無\n"
        }`
    )
    .join(
      "\n"
    )}\n\n## 任務依賴管理技巧\n\n### 依賴關係設置\n在建立新任務時，可以通過以下方式指定依賴關係：\n\n1. **使用任務名稱**（推薦）：直接使用其他任務的名稱，如 \`"建立用戶界面"\`\n2. **使用任務ID**：使用任務的唯一標識符，如 \`"${
    createdTasks.length > 0
      ? createdTasks[0].id
      : "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
  }"\`\n
### 依賴關係最佳實踐
- **最小化依賴數量** - 僅設置直接前置任務為依賴
- **避免循環依賴** - 確保任務圖是有向無環的
- **平衡關鍵路徑** - 減少關鍵路徑上的任務數量
- **提高並行度** - 結構設計應允許多個任務並行執行

## 執行計劃指南

### 關鍵路徑識別
- 確定項目關鍵路徑上的任務序列
- 優先分配資源到關鍵路徑任務
- 監控關鍵路徑任務進度，防止延誤

## 決策點\n\n請選擇下一步行動：\n\n- 如發現任務拆分不合理：請重新呼叫「split_tasks」工具，調整任務定義或依賴關係\n\n- 如確認任務拆分完善：請生成執行計劃摘要，包括建議的執行順序、關鍵路徑和風險點`;

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}

// 列出任務工具
export async function listTasks() {
  // 記錄查詢任務列表
  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      "查詢所有任務列表",
      undefined,
      "任務列表查詢"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  const tasks = await getAllTasks();

  if (tasks.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "## 系統通知\n\n目前系統中沒有註冊任何任務。請先使用「split_tasks」工具創建任務結構，再進行後續操作。",
        },
      ],
    };
  }

  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  let result = "# 任務管理儀表板\n\n## 任務狀態概覽\n\n";

  // 添加任務狀態計數摘要
  const statusCounts = Object.values(TaskStatus)
    .map((status) => {
      const count = tasksByStatus[status]?.length || 0;
      return `- **${status}**: ${count} 個任務`;
    })
    .join("\n");

  result += `${statusCounts}\n\n`;

  // 添加每個狀態下的詳細任務
  for (const status of Object.values(TaskStatus)) {
    const tasksWithStatus = tasksByStatus[status] || [];

    if (tasksWithStatus.length > 0) {
      result += `## ${status} (${tasksWithStatus.length})\n\n`;

      tasksWithStatus.forEach((task, index) => {
        result += formatTaskDetails(task);
      });
    }
  }

  return {
    content: [
      {
        type: "text" as const,
        text: result,
      },
    ],
  };
}

// 執行任務工具
export const executeTaskSchema = z.object({
  taskId: z
    .string()
    .uuid({ message: "任務ID格式無效，請提供有效的UUID格式" })
    .describe("待執行任務的唯一標識符，必須是系統中存在的有效任務ID"),
});

export async function executeTask({
  taskId,
}: z.infer<typeof executeTaskSchema>) {
  const task = await getTaskById(taskId);

  if (!task) {
    // 記錄錯誤日誌
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `執行任務失敗：找不到ID為 ${taskId} 的任務`,
        undefined,
        "錯誤"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `## 系統錯誤\n\n找不到ID為 \`${taskId}\` 的任務。請使用「list_tasks」工具確認有效的任務ID後再試。`,
        },
      ],
      isError: true,
    };
  }

  if (task.status === TaskStatus.COMPLETED) {
    // 記錄已完成任務的嘗試執行
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `嘗試執行已完成的任務：${task.name} (ID: ${task.id})`,
        task.id,
        "狀態通知"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `## 系統通知\n\n任務 "${task.name}" (ID: \`${task.id}\`) 已於 ${
            task.completedAt?.toISOString() || "先前"
          } 完成，無需再次執行。\n\n如需修改或重新執行，請先聯繫系統管理員重置任務狀態。`,
        },
      ],
    };
  }

  const { canExecute, blockedBy } = await canExecuteTask(taskId);

  if (!canExecute && blockedBy) {
    // 找出阻塞的任務名稱
    const allTasks = await getAllTasks();
    const blockedByTaskNames = blockedBy.map((id) => {
      const blockingTask = allTasks.find((t) => t.id === id);
      return blockingTask
        ? `"${blockingTask.name}" (ID: \`${id}\`)`
        : `ID: \`${id}\``;
    });

    // 記錄任務被阻擋的情況
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `任務 ${task.name} (ID: ${task.id}) 被依賴阻擋，等待完成的依賴任務數量: ${blockedBy.length}`,
        task.id,
        "依賴阻擋"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `## 任務依賴阻塞通知\n\n無法執行任務 "${task.name}" (ID: \`${
            task.id
          }\`)。\n\n### 阻塞原因\n此任務依賴於尚未完成的前置任務。請先完成以下依賴任務：\n\n${blockedByTaskNames
            .map((name, i) => `${i + 1}. ${name}`)
            .join("\n")}`,
        },
      ],
      isError: true,
    };
  }

  // ===== 新增：評估任務複雜度 =====
  const complexityAssessment = await assessTaskComplexity(taskId);

  // 更新任務狀態為進行中
  await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);

  // 記錄任務開始執行
  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      `開始執行任務：${task.name} (ID: ${task.id})${
        complexityAssessment
          ? `, 複雜度評估：${complexityAssessment.level}`
          : ""
      }`,
      task.id,
      "任務啟動"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  // 構建任務執行提示
  let prompt = `## 任務執行指示\n\n### 任務詳情\n\n- **名稱:** ${
    task.name
  }\n- **ID:** \`${task.id}\`\n- **描述:** ${task.description}\n${
    task.notes ? `- **注意事項:** ${task.notes}\n` : ""
  }\n`;

  // ===== 增強：處理相關文件內容 =====
  let relatedFilesSummary = "";
  let contextInfo = "";

  // 查找依賴任務的相關信息
  if (task.dependencies && task.dependencies.length > 0) {
    try {
      const allTasks = await getAllTasks();
      const depTasks = task.dependencies
        .map((dep) => allTasks.find((t) => t.id === dep.taskId))
        .filter((t) => t !== undefined) as Task[];

      if (depTasks.length > 0) {
        const completedDepTasks = depTasks.filter(
          (t) => t.status === TaskStatus.COMPLETED
        );

        if (completedDepTasks.length > 0) {
          contextInfo += `\n## 依賴任務完成摘要\n\n`;

          for (const depTask of completedDepTasks) {
            contextInfo += `### ${depTask.name}\n`;
            if (depTask.summary) {
              contextInfo += `${depTask.summary}\n\n`;
            } else {
              contextInfo += `*無完成摘要*\n\n`;
            }
          }

          // 記錄依賴任務加載
          await addConversationEntry(
            ConversationParticipant.MCP,
            `已加載依賴任務完成摘要，共 ${completedDepTasks.length} 個已完成依賴任務`,
            task.id,
            "加載依賴任務摘要"
          );
        }
      }
    } catch (error) {
      console.error("加載依賴任務信息時發生錯誤:", error);
    }
  }

  if (task.relatedFiles && task.relatedFiles.length > 0) {
    try {
      // 記錄加載文件操作
      await addConversationEntry(
        ConversationParticipant.MCP,
        `正在生成任務相關文件摘要，共 ${task.relatedFiles.length} 個文件`,
        task.id,
        "生成相關文件摘要"
      );

      // 生成任務相關文件的摘要資訊
      // 使用loadTaskRelatedFiles生成文件摘要，現在函數直接返回格式化的文本
      // 而不是包含content和summary的物件
      const relatedFilesSummary = await loadTaskRelatedFiles(task.relatedFiles);

      // 記錄摘要生成完成
      await addConversationEntry(
        ConversationParticipant.MCP,
        `任務相關文件摘要生成完成，已為 ${task.relatedFiles.length} 個文件生成摘要資訊`,
        task.id,
        "相關文件摘要生成完成"
      );
    } catch (error) {
      console.error("生成任務相關文件摘要時發生錯誤:", error);

      // 記錄錯誤
      await addConversationEntry(
        ConversationParticipant.MCP,
        `生成任務相關文件摘要時發生錯誤: ${
          error instanceof Error ? error.message : String(error)
        }`,
        task.id,
        "相關文件摘要生成錯誤"
      );

      relatedFilesSummary =
        "## 相關文件摘要生成失敗\n\n生成文件摘要時發生錯誤，請手動查看相關文件。";
    }
  } else {
    // 沒有相關文件的情況
    relatedFilesSummary =
      "## 相關文件\n\n當前任務沒有關聯的文件。可以使用 `update_task_files` 工具添加相關文件，以便在執行任務時提供上下文。";

    // 嘗試自動發現相關文件
    try {
      // 基於任務名稱和描述關鍵詞，嘗試推測可能相關的文件
      const taskWords = [
        ...task.name.split(/[\s,.;:]+/),
        ...task.description.split(/[\s,.;:]+/),
      ]
        .filter((word) => word.length > 3)
        .map((word) => word.toLowerCase());

      // 從關鍵詞中提取可能的文件名或路徑片段
      const potentialFileKeywords = taskWords.filter(
        (word) =>
          /^[a-z0-9]+$/i.test(word) &&
          ![
            "task",
            "function",
            "model",
            "index",
            "with",
            "from",
            "this",
          ].includes(word.toLowerCase())
      );

      if (potentialFileKeywords.length > 0) {
        // 推薦自動關聯文件的提示
        relatedFilesSummary += `\n\n### 推薦操作\n基於任務描述，您可能需要查看以下相關文件：\n`;

        // 列出可能相關的文件類型或名稱
        potentialFileKeywords.slice(0, 5).forEach((keyword) => {
          relatedFilesSummary += `- 含有 "${keyword}" 的文件\n`;
        });

        relatedFilesSummary += `\n使用 update_task_files 工具關聯相關文件，以獲得更好的上下文記憶支持。`;

        // 記錄文件推薦
        await addConversationEntry(
          ConversationParticipant.MCP,
          `為任務推薦了潛在相關文件關鍵詞: ${potentialFileKeywords
            .slice(0, 5)
            .join(", ")}`,
          task.id,
          "文件推薦"
        );
      }
    } catch (error) {
      console.error("推薦相關文件時發生錯誤:", error);
    }
  }

  // 新增：添加複雜度評估部分
  if (complexityAssessment) {
    // 添加複雜度評估部分
    prompt += `\n## 任務複雜度評估\n\n- **複雜度級別:** ${complexityAssessment.level}`;

    // 根據複雜度級別使用不同風格
    let complexityStyle = "";
    if (complexityAssessment.level === TaskComplexityLevel.VERY_HIGH) {
      complexityStyle = "⚠️ **警告：此任務複雜度極高** ⚠️";
    } else if (complexityAssessment.level === TaskComplexityLevel.HIGH) {
      complexityStyle = "⚠️ **注意：此任務複雜度較高**";
    } else if (complexityAssessment.level === TaskComplexityLevel.MEDIUM) {
      complexityStyle = "**提示：此任務具有一定複雜性**";
    }

    if (complexityStyle) {
      prompt += `\n\n${complexityStyle}\n`;
    }

    // 添加評估指標
    prompt += `\n### 評估指標\n`;
    prompt += `- 描述長度: ${complexityAssessment.metrics.descriptionLength} 字符\n`;
    prompt += `- 依賴任務數: ${complexityAssessment.metrics.dependenciesCount} 個\n`;
    if (complexityAssessment.metrics.hasNotes) {
      prompt += `- 注記長度: ${complexityAssessment.metrics.notesLength} 字符\n`;
    }

    // 添加處理建議
    if (complexityAssessment.recommendations.length > 0) {
      prompt += `\n### 處理建議\n`;
      complexityAssessment.recommendations.forEach((recommendation, index) => {
        prompt += `${index + 1}. ${recommendation}\n`;
      });
    }

    prompt += `\n`;
  }

  // 直接添加相關文件摘要到prompt中
  if (relatedFilesSummary) {
    prompt += relatedFilesSummary;
  }

  // 添加上下文信息
  if (contextInfo) {
    prompt += contextInfo;
  }

  prompt += `\n## 執行指引\n\n### 理解與規劃階段
1. **仔細分析任務需求** - 全面理解任務描述、注意事項和約束條件
   - 識別核心需求和次要需求，建立優先級
   - 確認與現有系統的整合要點和依賴關係
   - 評估潛在的技術難點和解決方案

2. **設計執行方案** - 制定結構化的實施計劃
   - 定義明確的實施步驟和執行順序
   - 選擇適合的技術方案，考慮系統架構一致性
   - 設計測試策略，確保功能正確性和質量

### 實施與測試階段
3. **系統性實施方案** - 按照計劃逐步執行
   - 遵循項目的編碼規範和最佳實踐
   - 實現核心功能，確保與現有系統正確整合
   - 處理邊緣情況和錯誤處理機制
   - 持續參考現有代碼風格和架構模式

4. **全面測試與驗證** - 確保實現的正確性和穩健性
   - 測試核心功能和邊緣情況
   - 驗證與其他系統組件的交互
   - 評估性能影響和資源使用情況
   - 確保符合原始需求規格

### 文檔與完成階段
5. **完整記錄實施過程** - 詳細記錄關鍵決策和實施細節
   - 記錄技術選擇理由和考量因素
   - 描述遇到的問題及其解決方法
   - 提供實現的核心邏輯說明
   - 注明可能需要後續改進的地方

6. **更新相關文件** - 保持文檔與代碼同步
   - 使用 update_task_files 工具關聯和更新文件
   - 記錄代碼行號以便精確定位關鍵實現
   - 確保文檔反映最終實現的實際狀態

## 專注限制與質量保證\n\n### 範圍管理
- **嚴格遵守任務範圍** - 僅修改與任務直接相關的代碼區域
  - 所有變更必須可直接追溯到任務描述中的明確需求
  - 避免功能蔓延或過度設計
  - 發現範圍外問題時，記錄但不立即修改，保持系統整體一致性

- **需求優先級管理** - 專注於完成核心需求
  - 當需求與實際情況存在歧義時，選擇影響範圍最小的實現方案
  - 不自行擴展需求範圍，即使發現潛在優化機會
  - 對於重大設計決策，尋求用戶確認而非做出假設性修改

### 質量標準
- **代碼質量保證** - 確保交付高質量的實現
  - 符合專案編碼標準和架構設計原則
  - 實現適當的錯誤處理和邊緣情況檢查
  - 注重代碼可讀性和可維護性
  - 避免重複代碼，優先利用現有組件和函數

- **效能考量** - 優化性能和資源使用
  - 考慮算法效率和數據結構選擇
  - 避免不必要的計算或資源消耗
  - 在關鍵路徑上進行必要的性能優化
  - 平衡開發速度與執行效率

## 下一步行動\n\n完成實施後，必須使用「verify_task」工具進行全面驗證，確保所有功能和要求均已正確實現。驗證過程應包括：

- 功能完整性檢查 - 所有需求點是否已實現
- 代碼質量審核 - 是否符合項目標準和最佳實踐
- 兼容性測試 - 是否與現有系統無縫整合
- 性能評估 - 實現是否滿足效能要求

驗證通過後，使用「complete_task」工具標記任務完成並提供詳細的完成報告。`;

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}

// 檢驗任務工具
export const verifyTaskSchema = z.object({
  taskId: z
    .string()
    .uuid({ message: "任務ID格式無效，請提供有效的UUID格式" })
    .describe("待驗證任務的唯一標識符，必須是狀態為「進行中」的有效任務ID"),
});

export async function verifyTask({ taskId }: z.infer<typeof verifyTaskSchema>) {
  const task = await getTaskById(taskId);

  if (!task) {
    // 記錄錯誤日誌
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `驗證任務失敗：找不到ID為 ${taskId} 的任務`,
        undefined,
        "錯誤"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `## 系統錯誤\n\n找不到ID為 \`${taskId}\` 的任務。請使用「list_tasks」工具確認有效的任務ID後再試。`,
        },
      ],
      isError: true,
    };
  }

  if (task.status !== TaskStatus.IN_PROGRESS) {
    // 記錄狀態錯誤
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `驗證任務狀態錯誤：任務 ${task.name} (ID: ${task.id}) 當前狀態為 ${task.status}，不處於進行中狀態`,
        task.id,
        "狀態錯誤"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `## 狀態錯誤\n\n任務 "${task.name}" (ID: \`${task.id}\`) 當前狀態為 "${task.status}"，不處於進行中狀態，無法進行檢驗。\n\n只有狀態為「進行中」的任務才能進行檢驗。請先使用「execute_task」工具開始任務執行。`,
        },
      ],
      isError: true,
    };
  }

  // 記錄開始驗證
  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      `開始驗證任務：${task.name} (ID: ${task.id})`,
      task.id,
      "任務驗證"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  const prompt = `## 任務驗證評估\n\n### 任務資料\n\n- **名稱:** ${
    task.name
  }\n- **ID:** \`${task.id}\`\n- **描述:** ${task.description}\n${
    task.notes ? `- **注意事項:** ${task.notes}\n` : ""
  }

## 完整性驗證標準\n\n請根據以下關鍵標準進行嚴格的質量檢查，為每個評估項目提供詳細的證據和具體範例：

### 1. 需求符合性 (30%)
#### 核心評估項目：
- **功能完整性** - 實現是否完全符合任務描述中的所有功能需求？
  - 逐條檢查任務描述中的每一項功能點，確認全部實現
  - 驗證主要功能流程的完整性和正確性
  - 評估用戶交互體驗是否符合要求

- **約束條件遵循** - 是否遵循了所有注意事項和約束條件？
  - 檢查是否嚴格遵守了任務指定的技術限制或規範
  - 驗證實現是否符合任務描述中的特定要求
  - 確認所有指定的業務規則都得到正確實現

- **邊緣情況處理** - 是否處理了所有業務邏輯的邊緣情況？
  - 列舉並驗證各種可能的異常輸入和情況
  - 檢查錯誤處理機制是否完善
  - 評估實現對無效操作的容錯能力

#### 評分指南：
- **優秀(90-100%)**: 所有需求點完美實現，邊緣情況處理完備，代碼穩健可靠
- **良好(75-89%)**: 核心需求全部實現，少量邊緣情況可能需要優化
- **合格(60-74%)**: 主要功能已實現，但處理不夠完善或有遺漏
- **需改進(<60%)**: 關鍵功能缺失或實現不正確，需要重大修改

### 2. 技術實現質量 (30%)
#### 核心評估項目：
- **架構一致性** - 代碼是否遵循了項目的架構模式和設計原則？
  - 評估實現是否符合現有代碼庫的架構風格
  - 檢查模塊化程度和責任分離是否適當
  - 驗證是否遵循了項目的編碼規範和命名慣例

- **程式健壯性** - 是否有適當的錯誤處理和防禦性編程？
  - 檢查是否實施了適當的錯誤捕獲和處理機制
  - 評估異常情況下的系統行為是否符合預期
  - 驗證是否有防禦性檢查和輸入驗證

- **實現優雅性** - 實現是否簡潔高效，避免了不必要的複雜性？
  - 評估代碼的可讀性和可維護性
  - 檢查是否存在不必要的重複或冗餘邏輯
  - 評估算法和數據結構選擇的適當性

#### 評分指南：
- **優秀(90-100%)**: 代碼優雅、健壯，完全符合項目架構標準，高度可維護
- **良好(75-89%)**: 代碼結構合理，錯誤處理完善，但可能有小的改進空間
- **合格(60-74%)**: 基本符合編碼標準，但存在架構或錯誤處理上的不足
- **需改進(<60%)**: 代碼質量較差，存在明顯的架構問題或錯誤處理不足

### 3. 集成與兼容性 (20%)
#### 核心評估項目：
- **系統整合** - 實現是否與現有系統無縫集成？
  - 檢查與其他系統組件的接口是否正確實現
  - 評估對現有功能的影響是否最小化
  - 驗證是否正確使用了共享服務和組件

- **互操作性** - 是否考慮了與其他組件的相互作用？
  - 評估與依賴服務或模塊的交互是否正確
  - 檢查資源共享和競爭條件的處理
  - 驗證數據交換格式和協議的兼容性

- **兼容性維護** - 是否保持了向前和向後兼容性（如適用）？
  - 評估對現有API或界面的變更是否維持兼容性
  - 檢查對舊數據格式或配置的支持
  - 驗證升級路徑和降級策略

#### 評分指南：
- **優秀(90-100%)**: 完美集成，零衝突，維持所有必要的兼容性
- **良好(75-89%)**: 基本無縫集成，極少數邊緣情況下可能有小問題
- **合格(60-74%)**: 主要功能正確集成，但存在一些兼容性考慮不足
- **需改進(<60%)**: 集成存在明顯問題，對現有系統造成破壞性影響

### 4. 性能與可擴展性 (20%)
#### 核心評估項目：
- **效能優化** - 實現是否考慮了性能優化？
  - 評估代碼執行效率和資源使用情況
  - 檢查是否有不必要的計算或操作
  - 驗證關鍵路徑的效能表現

- **負載適應性** - 系統是否能夠處理預期的負載和擴展需求？
  - 評估在高負載下的系統行為和穩定性
  - 檢查資源使用的可擴展性
  - 驗證並發處理和資源競爭的管理

- **資源管理** - 是否避免了可能的資源洩漏或瓶頸？
  - 檢查資源分配和釋放的正確性
  - 評估內存使用效率和垃圾回收影響
  - 驗證數據庫查詢或IO操作的效率

#### 評分指南：
- **優秀(90-100%)**: 高效實現，經過充分優化，具備優秀的擴展能力
- **良好(75-89%)**: 效能良好，無明顯瓶頸，滿足當前和可預見的需求
- **合格(60-74%)**: 基本性能可接受，但在高負載下可能存在問題
- **需改進(<60%)**: 存在明顯的性能問題或資源使用不當

## 驗證結果報告\n\n請提供詳細的驗證結果報告，應包含以下內容：

1. **整體評分與結論**：
   - 根據上述評估標準給出總體評分和評級
   - 簡明扼要的總結性評價

2. **各項標準詳細評估**：
   - 為每個標準給出分項評分和具體證據
   - 引用具體代碼示例或實現細節
   - 指出特別出色或需要改進的部分

3. **發現的問題與建議**：
   - 按嚴重程度列出所有發現的問題
   - 為每個問題提供具體、可行的修復建議
   - 區分必須修復的關鍵問題和可選的優化建議

4. **最終結論和建議**：
   - 明確指出是否符合驗收標準
   - 提供關於後續步驟的清晰建議

## 決策點\n\n根據您的全面驗證評估，請選擇適當的後續行動：

- **如果發現嚴重問題需要修復**：
  - 詳細列出所有問題及其優先級
  - 提供具體的修復指導
  - 建議繼續改進並解決關鍵問題
  - 「plan_task」工具，計劃修復問題的步驟

- **如果任務已完全符合要求**：
  - 總結實現的主要優點和特色
  - 使用「complete_task」工具，標記任務為已完成
  - 提出任務完成總結報告的要點建議

您的驗證評估將直接影響產品質量，請以專業和批判性的眼光進行全面檢查。`;

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}

// 完成任務工具
export const completeTaskSchema = z.object({
  taskId: z
    .string()
    .uuid({ message: "任務ID格式無效，請提供有效的UUID格式" })
    .describe(
      "待標記為完成的任務唯一標識符，必須是狀態為「進行中」的有效任務ID"
    ),
  summary: z
    .string()
    .min(30, {
      message: "任務摘要太簡短，請提供更詳細的完成報告，包含實施結果和主要決策",
    })
    .optional()
    .describe(
      "任務完成摘要，簡潔描述實施結果和重要決策（選填，如未提供將自動生成）"
    ),
});

export async function completeTask({
  taskId,
  summary,
}: z.infer<typeof completeTaskSchema>) {
  const task = await getTaskById(taskId);

  if (!task) {
    // 記錄錯誤日誌
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `完成任務失敗：找不到ID為 ${taskId} 的任務`,
        undefined,
        "錯誤"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `## 系統錯誤\n\n找不到ID為 \`${taskId}\` 的任務。請使用「list_tasks」工具確認有效的任務ID後再試。`,
        },
      ],
      isError: true,
    };
  }

  if (task.status !== TaskStatus.IN_PROGRESS) {
    // 記錄狀態錯誤
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `完成任務狀態錯誤：任務 ${task.name} (ID: ${task.id}) 當前狀態為 ${task.status}，不是進行中狀態`,
        task.id,
        "狀態錯誤"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `## 狀態錯誤\n\n任務 "${task.name}" (ID: \`${task.id}\`) 當前狀態為 "${task.status}"，不是進行中狀態，無法標記為完成。\n\n只有狀態為「進行中」的任務才能標記為完成。請先使用「execute_task」工具開始任務執行。`,
        },
      ],
      isError: true,
    };
  }

  // 處理摘要信息
  let taskSummary = summary;
  if (!taskSummary) {
    // 自動生成摘要
    taskSummary = generateTaskSummary(task.name, task.description);
  }

  // 更新任務狀態為已完成，並添加摘要
  await updateTaskStatus(taskId, TaskStatus.COMPLETED);
  await updateTaskSummary(taskId, taskSummary);

  // 記錄任務完成
  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      `任務成功完成：${task.name} (ID: ${task.id})，完成摘要：${extractSummary(
        taskSummary,
        100
      )}`,
      task.id,
      "任務完成"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `## 任務完成確認\n\n任務 "${task.name}" (ID: \`${
          task.id
        }\`) 已於 ${new Date().toISOString()} 成功標記為完成。\n\n## 任務摘要要求\n\n請提供此次完成任務的摘要總結，包含以下關鍵要點：\n\n1. 任務目標與主要成果\n2. 實施的解決方案要點\n3. 遇到的主要挑戰及解決方法\n\n**重要提示：** 請在當前回應中提供任務摘要總結。完成本次任務摘要後，請等待用戶明確指示後再繼續執行其他任務。請勿自動開始執行下一個任務。\n\n如果用戶要求連續執行任務，請使用「execute_task」工具開始執行下一個任務。`,
      },
    ],
  };
}

// 刪除任務工具
export const deleteTaskSchema = z.object({
  taskId: z
    .string()
    .uuid({ message: "任務ID格式無效，請提供有效的UUID格式" })
    .describe("待刪除任務的唯一標識符，必須是系統中存在且未完成的任務ID"),
});

export async function deleteTask({ taskId }: z.infer<typeof deleteTaskSchema>) {
  const task = await getTaskById(taskId);

  if (!task) {
    // 記錄錯誤日誌
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `刪除任務失敗：找不到ID為 ${taskId} 的任務`,
        undefined,
        "錯誤"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `## 系統錯誤\n\n找不到ID為 \`${taskId}\` 的任務。請使用「list_tasks」工具確認有效的任務ID後再試。`,
        },
      ],
      isError: true,
    };
  }

  if (task.status === TaskStatus.COMPLETED) {
    // 記錄操作被拒絕
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `刪除操作被拒絕：嘗試刪除已完成的任務 ${task.name} (ID: ${task.id})`,
        task.id,
        "操作被拒絕"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `## 操作被拒絕\n\n任務 "${task.name}" (ID: \`${task.id}\`) 已完成，不允許刪除已完成的任務。\n\n如需清理任務，請聯絡系統管理員。`,
        },
      ],
      isError: true,
    };
  }

  // 記錄要刪除的任務
  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      `正在刪除任務：${task.name} (ID: ${task.id})`,
      task.id,
      "任務刪除"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  const result = await modelDeleteTask(taskId);

  // 記錄刪除結果
  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      `任務刪除${result.success ? "成功" : "失敗"}：${task.name} (ID: ${
        task.id
      })，原因：${result.message}`,
      result.success ? undefined : task.id,
      result.success ? "任務刪除成功" : "任務刪除失敗"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `## ${result.success ? "操作成功" : "操作失敗"}\n\n${
          result.message
        }\n\n${
          result.success
            ? `任務 "${task.name}" (ID: \`${task.id}\`) 已成功從系統中刪除。`
            : ""
        }`,
      },
    ],
    isError: !result.success,
  };
}

// 清除所有任務工具
export const clearAllTasksSchema = z.object({
  confirm: z
    .boolean()
    .refine((val) => val === true, {
      message:
        "必須明確確認清除操作，請將 confirm 參數設置為 true 以確認此危險操作",
    })
    .describe("確認刪除所有未完成的任務（此操作不可逆）"),
});

export async function clearAllTasks({
  confirm,
}: z.infer<typeof clearAllTasksSchema>) {
  // 安全檢查：如果沒有確認，則拒絕操作
  if (!confirm) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 操作取消\n\n未確認清除操作。如要清除所有任務，請將 confirm 參數設為 true。\n\n⚠️ 警告：此操作將刪除所有未完成的任務，且無法恢復。請謹慎操作。`,
        },
      ],
    };
  }

  // 檢查是否真的有任務需要清除
  const allTasks = await getAllTasks();
  if (allTasks.length === 0) {
    // 記錄操作
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `清除所有任務操作：無任務需要清除`,
        undefined,
        "任務清除"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `## 操作提示\n\n系統中沒有任何任務需要清除。`,
        },
      ],
    };
  }

  // 記錄操作開始
  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      `開始清除所有任務操作：共 ${allTasks.length} 個任務`,
      undefined,
      "任務清除"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  // 執行清除操作
  const result = await modelClearAllTasks();

  // 記錄操作結果
  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      `任務清除${result.success ? "成功" : "失敗"}：${result.message}${
        result.backupFile ? `，備份文件: ${result.backupFile}` : ""
      }`,
      undefined,
      result.success ? "任務清除成功" : "任務清除失敗"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `## ${result.success ? "操作成功" : "操作失敗"}\n\n${
          result.message
        }${
          result.backupFile
            ? `\n\n系統已自動創建備份文件: \`${result.backupFile}\``
            : ""
        }`,
      },
    ],
    isError: !result.success,
  };
}

// 更新任務內容工具
export const updateTaskContentSchema = z
  .object({
    taskId: z
      .string()
      .uuid({ message: "任務ID格式無效，請提供有效的UUID格式" })
      .describe("待更新任務的唯一標識符，必須是系統中存在且未完成的任務ID"),
    name: z
      .string()
      .min(5, {
        message: "任務名稱太短，請提供更清晰明確的名稱以便識別任務目的",
      })
      .max(100, { message: "任務名稱過長，請保持簡潔，不超過100個字符" })
      .optional()
      .describe("任務的新名稱（選填）"),
    description: z
      .string()
      .min(20, {
        message: "任務描述太簡短，請提供更詳細的描述，包含實施要點和驗收標準",
      })
      .optional()
      .describe("任務的新描述內容（選填）"),
    notes: z.string().optional().describe("任務的新補充說明（選填）"),
    relatedFiles: z
      .array(
        z.object({
          path: z
            .string()
            .min(1, { message: "文件路徑不能為空，請提供有效的文件路徑" })
            .describe("文件路徑，可以是相對於項目根目錄的路徑或絕對路徑"),
          type: z
            .enum([
              RelatedFileType.TO_MODIFY,
              RelatedFileType.REFERENCE,
              RelatedFileType.OUTPUT,
              RelatedFileType.DEPENDENCY,
              RelatedFileType.OTHER,
            ])
            .describe("文件與任務的關係類型"),
          description: z.string().optional().describe("文件的補充描述（選填）"),
          lineStart: z
            .number()
            .int()
            .positive()
            .optional()
            .describe("相關代碼區塊的起始行（選填）"),
          lineEnd: z
            .number()
            .int()
            .positive()
            .optional()
            .describe("相關代碼區塊的結束行（選填）"),
        })
      )
      .optional()
      .describe("與任務相關的文件列表（選填）"),
  })
  .refine(
    (data) => {
      // 確保行號有效：如果有起始行，就必須有結束行，反之亦然
      if (data.relatedFiles) {
        for (const file of data.relatedFiles) {
          if (
            (file.lineStart && !file.lineEnd) ||
            (!file.lineStart && file.lineEnd)
          ) {
            return false;
          }
          // 確保起始行小於結束行
          if (file.lineStart && file.lineEnd && file.lineStart > file.lineEnd) {
            return false;
          }
        }
      }
      // 確保至少有一個字段被更新
      return !!(
        data.name ||
        data.description ||
        data.notes ||
        (data.relatedFiles && data.relatedFiles.length > 0)
      );
    },
    {
      message:
        "更新請求無效：1. 行號設置必須同時包含起始行和結束行，且起始行必須小於結束行；2. 至少需要更新一個字段（名稱、描述、注記或相關文件）",
      path: ["relatedFiles"],
    }
  );

export async function updateTaskContent({
  taskId,
  name,
  description,
  notes,
  relatedFiles,
}: z.infer<typeof updateTaskContentSchema>) {
  // 獲取任務以檢查它是否存在
  const task = await getTaskById(taskId);

  if (!task) {
    // 記錄錯誤日誌
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `更新任務失敗：找不到ID為 ${taskId} 的任務`,
        undefined,
        "錯誤"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `## 系統錯誤\n\n找不到ID為 \`${taskId}\` 的任務。請使用「list_tasks」工具確認有效的任務ID後再試。`,
        },
      ],
      isError: true,
    };
  }

  // 記錄要更新的任務和內容
  let updateSummary = `準備更新任務：${task.name} (ID: ${task.id})`;
  if (name) updateSummary += `，新名稱：${name}`;
  if (description) updateSummary += `，更新描述`;
  if (notes) updateSummary += `，更新注記`;
  if (relatedFiles)
    updateSummary += `，更新相關文件 (${relatedFiles.length} 個)`;

  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      updateSummary,
      task.id,
      "任務更新"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  // 執行更新操作
  const result = await modelUpdateTaskContent(taskId, {
    name,
    description,
    notes,
    relatedFiles,
  });

  // 記錄更新結果
  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      `任務更新${result.success ? "成功" : "失敗"}：${task.name} (ID: ${
        task.id
      })，原因：${result.message}`,
      task.id,
      result.success ? "任務更新成功" : "任務更新失敗"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  // 構建響應消息
  const responseTitle = result.success ? "操作成功" : "操作失敗";
  let responseMessage = result.message;

  if (result.success && result.task) {
    // 顯示更新後的任務詳情
    responseMessage += "\n\n### 更新後的任務詳情\n";
    responseMessage += `- **名稱:** ${result.task.name}\n`;
    responseMessage += `- **描述:** ${result.task.description.substring(
      0,
      100
    )}${result.task.description.length > 100 ? "..." : ""}\n`;

    if (result.task.notes) {
      responseMessage += `- **注記:** ${result.task.notes.substring(0, 100)}${
        result.task.notes.length > 100 ? "..." : ""
      }\n`;
    }

    responseMessage += `- **狀態:** ${result.task.status}\n`;
    responseMessage += `- **更新時間:** ${new Date(
      result.task.updatedAt
    ).toISOString()}\n`;

    // 顯示相關文件信息
    if (result.task.relatedFiles && result.task.relatedFiles.length > 0) {
      responseMessage += `- **相關文件:** ${result.task.relatedFiles.length} 個\n`;

      // 按文件類型分組
      const filesByType = result.task.relatedFiles.reduce((acc, file) => {
        if (!acc[file.type]) {
          acc[file.type] = [];
        }
        acc[file.type].push(file);
        return acc;
      }, {} as Record<string, RelatedFile[]>);

      for (const [type, files] of Object.entries(filesByType)) {
        responseMessage += `  - ${type} (${files.length} 個): `;
        responseMessage += files.map((file) => `\`${file.path}\``).join(", ");
        responseMessage += "\n";
      }
    }
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `## ${responseTitle}\n\n${responseMessage}`,
      },
    ],
    isError: !result.success,
  };
}

// 更新任務相關文件工具
export const updateTaskRelatedFilesSchema = z
  .object({
    taskId: z
      .string()
      .uuid({ message: "任務ID格式無效，請提供有效的UUID格式" })
      .describe("待更新任務的唯一標識符，必須是系統中存在且未完成的任務ID"),
    relatedFiles: z
      .array(
        z.object({
          path: z
            .string()
            .min(1, { message: "文件路徑不能為空，請提供有效的文件路徑" })
            .describe("文件路徑，可以是相對於項目根目錄的路徑或絕對路徑"),
          type: z
            .enum([
              RelatedFileType.TO_MODIFY,
              RelatedFileType.REFERENCE,
              RelatedFileType.OUTPUT,
              RelatedFileType.DEPENDENCY,
              RelatedFileType.OTHER,
            ])
            .describe("文件與任務的關係類型"),
          description: z.string().optional().describe("文件的補充描述（選填）"),
          lineStart: z
            .number()
            .int()
            .positive()
            .optional()
            .describe("相關代碼區塊的起始行（選填）"),
          lineEnd: z
            .number()
            .int()
            .positive()
            .optional()
            .describe("相關代碼區塊的結束行（選填）"),
        })
      )
      .min(1, { message: "至少需要提供一個相關文件，請確保文件列表不為空" })
      .describe("與任務相關的文件列表"),
  })
  .refine(
    (data) => {
      // 檢查文件路徑是否有重複
      const pathSet = new Set();
      for (const file of data.relatedFiles) {
        if (pathSet.has(file.path)) {
          return false;
        }
        pathSet.add(file.path);
      }
      return true;
    },
    {
      message: "文件列表中存在重複的文件路徑，請確保每個文件路徑是唯一的",
      path: ["relatedFiles"],
    }
  )
  .refine(
    (data) => {
      // 確保行號有效：如果有起始行，就必須有結束行，反之亦然
      for (const file of data.relatedFiles) {
        if (
          (file.lineStart && !file.lineEnd) ||
          (!file.lineStart && file.lineEnd)
        ) {
          return false;
        }
        // 確保起始行小於結束行
        if (file.lineStart && file.lineEnd && file.lineStart > file.lineEnd) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "行號設置無效：必須同時設置起始行和結束行，且起始行必須小於結束行",
      path: ["relatedFiles"],
    }
  );

export async function updateTaskRelatedFiles({
  taskId,
  relatedFiles,
}: z.infer<typeof updateTaskRelatedFilesSchema>) {
  // 獲取任務以檢查它是否存在
  const task = await getTaskById(taskId);

  if (!task) {
    // 記錄錯誤日誌
    try {
      await addConversationEntry(
        ConversationParticipant.MCP,
        `更新任務相關文件失敗：找不到ID為 ${taskId} 的任務`,
        undefined,
        "錯誤"
      );
    } catch (error) {
      console.error("記錄對話日誌時發生錯誤:", error);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `## 系統錯誤\n\n找不到ID為 \`${taskId}\` 的任務。請使用「list_tasks」工具確認有效的任務ID後再試。`,
        },
      ],
      isError: true,
    };
  }

  // 記錄要更新的任務和相關文件
  const fileTypeCount = relatedFiles.reduce((acc, file) => {
    acc[file.type] = (acc[file.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fileTypeSummary = Object.entries(fileTypeCount)
    .map(([type, count]) => `${type} ${count} 個`)
    .join("，");

  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      `準備更新任務相關文件：${task.name} (ID: ${task.id})，共 ${relatedFiles.length} 個文件（${fileTypeSummary}）`,
      task.id,
      "更新相關文件"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  // 執行更新操作
  const result = await modelUpdateTaskRelatedFiles(taskId, relatedFiles);

  // 記錄更新結果
  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      `任務相關文件更新${result.success ? "成功" : "失敗"}：${task.name} (ID: ${
        task.id
      })，${result.message}`,
      task.id,
      result.success ? "相關文件更新成功" : "相關文件更新失敗"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  // 構建響應消息
  const responseTitle = result.success ? "操作成功" : "操作失敗";
  let responseMessage = result.message;

  if (result.success && result.task && result.task.relatedFiles) {
    // 顯示更新後的相關文件列表
    responseMessage += "\n\n### 任務相關文件列表\n";

    // 按文件類型分組顯示
    const filesByType = result.task.relatedFiles.reduce((acc, file) => {
      acc[file.type] = acc[file.type] || [];
      acc[file.type].push(file);
      return acc;
    }, {} as Record<string, RelatedFile[]>);

    for (const [type, files] of Object.entries(filesByType)) {
      responseMessage += `\n#### ${type} (${files.length} 個)\n`;
      files.forEach((file, index) => {
        responseMessage += `${index + 1}. \`${file.path}\`${
          file.description ? ` - ${file.description}` : ""
        }${
          file.lineStart && file.lineEnd
            ? ` (行 ${file.lineStart}-${file.lineEnd})`
            : ""
        }\n`;
      });
    }
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `## ${responseTitle}\n\n${responseMessage}`,
      },
    ],
    isError: !result.success,
  };
}

// 格式化單個任務的詳細資訊
const formatTaskDetails = (task: Task) => {
  let details = `### ${task.name}\n**ID:** \`${task.id}\`\n**描述:** ${task.description}\n`;

  if (task.notes) {
    details += `**注記:** ${task.notes}\n`;
  }

  details += `**狀態:** ${task.status}\n`;

  if (task.dependencies.length > 0) {
    const depIds = task.dependencies
      .map((dep: TaskDependency) => `\`${dep.taskId}\``)
      .join(", ");
    details += `**依賴任務:** ${depIds}\n`;
  }

  // 添加相關文件信息
  if (task.relatedFiles && task.relatedFiles.length > 0) {
    details += `**相關文件:** ${task.relatedFiles.length} 個\n`;

    // 按文件類型分組
    const filesByType = task.relatedFiles.reduce(
      (acc: Record<string, RelatedFile[]>, file: RelatedFile) => {
        if (!acc[file.type]) {
          acc[file.type] = [];
        }
        acc[file.type].push(file);
        return acc;
      },
      {} as Record<string, RelatedFile[]>
    );

    for (const [type, files] of Object.entries(filesByType)) {
      details += `  - ${type} (${files.length} 個): `;
      details += files
        .map((file: RelatedFile) => `\`${file.path}\``)
        .join(", ");
      details += "\n";
    }
  }

  details += `**創建時間:** ${new Date(task.createdAt).toISOString()}\n`;
  details += `**更新時間:** ${new Date(task.updatedAt).toISOString()}\n`;

  if (task.completedAt) {
    details += `**完成時間:** ${new Date(task.completedAt).toISOString()}\n`;
  }

  if (task.summary) {
    details += `**完成摘要:** ${task.summary}\n`;
  }

  return details;
};
