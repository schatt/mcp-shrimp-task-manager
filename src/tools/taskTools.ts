import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
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
  searchTasksWithCommand,
} from "../models/taskModel.js";
import {
  TaskStatus,
  TaskComplexityLevel,
  RelatedFileType,
  RelatedFile,
  Task,
  TaskDependency,
} from "../types/index.js";
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
  let prompt = `## 任務分析\n\n${description}\n\n`;

  if (requirements) {
    prompt += `## 要求與限制\n\n${requirements}\n\n`;
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
        prompt += `## 現有任務參考\n\n`;

        // 添加已完成任務的參考
        if (completedTasks.length > 0) {
          prompt += `### 已完成任務\n\n`;

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
            prompt += `\n*（僅顯示前10個，共 ${completedTasks.length} 個）*\n`;
          }
        }

        // 添加未完成任務的參考
        if (pendingTasks.length > 0) {
          prompt += `\n### 未完成任務\n\n`;

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

        prompt += `\n## 任務調整原則\n\n`;
        prompt += `1. **已完成任務保護** - 已完成任務不可修改或刪除\n`;
        prompt += `2. **未完成任務可調整** - 可根據新需求修改未完成任務\n`;
        prompt += `3. **任務ID一致性** - 引用現有任務必須使用原始ID\n`;
        prompt += `4. **依賴關係完整性** - 避免循環依賴，不依賴已標記移除的任務\n`;
        prompt += `5. **任務延續性** - 新任務應與現有任務構成連貫整體\n\n`;

        // 添加選擇性任務更新模式指導
        prompt += `## 任務更新模式\n\n`;
        prompt += `### 1. **追加模式(append)**\n`;
        prompt += `- 保留所有現有任務，僅添加新任務\n`;
        prompt += `- 適用：逐步擴展功能，現有計劃仍有效\n\n`;

        prompt += `### 2. **覆蓋模式(overwrite)**\n`;
        prompt += `- 清除所有現有未完成任務，完全使用新任務列表\n`;
        prompt += `- 適用：徹底變更方向，現有未完成任務已不相關\n\n`;

        prompt += `### 3. **選擇性更新模式(selective)**\n`;
        prompt += `- 根據任務名稱匹配選擇性更新任務，保留其他現有任務\n`;
        prompt += `- 適用：部分調整任務計劃，保留部分未完成任務\n`;
        prompt += `- 工作原理：更新同名任務，創建新任務，保留其他任務\n\n`;
      }
    } catch (error) {
      console.error("載入現有任務時發生錯誤:", error);
    }
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const PROJECT_ROOT = path.resolve(__dirname, "../..");
  const DATA_DIR = process.env.DATA_DIR || path.join(PROJECT_ROOT, "data");
  const MEMORY_DIR = path.join(DATA_DIR, "memory");

  prompt += `## 分析指引\n\n1. 確定任務的目標和預期成果
2. 識別技術挑戰和關鍵決策點
3. 考慮潛在解決方案和替代方案
4. 評估各方案優缺點
5. 判斷是否需要分解為子任務
6. 考慮與現有系統的集成需求\n\n`;

  prompt += `## 任務記憶檢索指南\n\n過去任務備份在 **${MEMORY_DIR}** 目錄：\n\n`;
  prompt += `1. **查找** - 按時間或相關性選擇特定備份\n`;
  prompt += `2. **分析** - 了解相似任務的經驗和解決方案\n`;
  prompt += `3. **應用** - 借鑒成功經驗，避免重複錯誤\n\n`;
  prompt += `有效利用任務記憶可提高效率和解決方案的一致性。\n\n`;

  prompt += `## 資訊收集指南\n\n`;
  prompt += `1. **詢問用戶** - 當你對任務要求有疑問時，直接詢問用戶\n`;
  prompt += `2. **查詢記憶** - 使用「query_task」工具查詢以往記憶是否有相關任務\n`;
  prompt += `3. **網路搜索** - 當出現你不理解的名詞或概念時，使用網路搜尋工具找尋答案\n\n`;

  prompt += `## 下一步行動\n\n`;

  // 提供情境導向的指導
  prompt += `**第一步：評估是否需要查詢任務記憶**\n\n`;
  prompt += `- 根據任務性質智能判斷是否使用「query_task」工具查詢相關任務記憶：\n\n`;

  // 高優先級情境
  prompt += `  **建議查詢的情境**：\n`;
  prompt += `  - 修改或擴展現有功能（需了解原有實現方式）\n`;
  prompt += `  - 與系統現有功能高度相關或類似的任務\n`;
  prompt += `  - 任務描述中提及需延續或參考過去工作\n`;
  prompt += `  - 涉及系統特定技術實現的任務\n`;
  prompt += `  - 需要保持一致性的系統組件開發\n`;
  prompt += `  - 複雜度高的技術任務\n\n`;

  // 中等優先級情境
  prompt += `  **可選擇性查詢的情境**：\n`;
  prompt += `  - 需與現有系統整合但實現相對獨立的新功能\n`;
  prompt += `  - 標準化功能但需符合系統特定慣例\n`;
  prompt += `  - 已有明確方向的優化任務\n`;
  prompt += `  - 不確定是否有類似現有實現的功能\n\n`;

  // 低優先級情境
  prompt += `  **可不查詢的情境**：\n`;
  prompt += `  - 全新且獨立的功能（與現有系統無明顯重疊）\n`;
  prompt += `  - 基礎設置或標準化簡單任務\n`;
  prompt += `  - 用戶明確指示不需參考過去經驗的任務\n`;
  prompt += `  - 完全依照外部標準實施的任務\n\n`;

  // 保留關於查詢價值的說明
  prompt += `查詢任務記憶可幫助了解類似任務的實現方式和潛在問題，避免重複工作，提高分析效率。\n\n`;

  // 僅調整語言，保持原有流程的第二步不變
  prompt += `**第二步：提交分析結果**\n\n`;
  prompt += `- 在評估是否需要查詢記憶（並在必要時查詢）後，使用「analyze_task」工具提交分析結果：\n\n`;
  prompt += `1. **任務摘要** - 目標、範圍、挑戰和限制條件\n`;
  prompt += `2. **初步解答構想** - 可行的技術方案和實施計劃\n`;

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
      message:
        "初步解答構想過於簡短，請提供更完整的技術方案和實施策略詳情，如果需要提供程式碼請使用 pseudocode 格式且盡量精簡只保留核心實現部分",
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
  let prompt = `## 代碼庫分析\n\n### 任務摘要\n\`\`\`\n${summary}\n\`\`\`\n\n已收到初步解答構想：\n\n\`\`\`\n${initialConcept}\n\`\`\`\n\n`;

  prompt += `## 技術審核要點\n\n### 1. 代碼庫分析
- 尋找可重用組件和類似實現
- 確定新功能的適當位置
- 評估與現有模塊的整合方式

### 2. 技術策略評估
- 考慮模塊化和可擴展性設計
- 評估提案的未來兼容性
- 規劃測試策略和覆蓋範圍

### 3. 風險和質量分析
- 識別技術債務和效能瓶頸
- 評估安全性和數據完整性
- 檢查錯誤處理機制

### 4. 實施建議
- 遵循項目架構風格
- 建議實施方法和技術選擇
- 提出明確開發步驟

注意尋找程式碼重用機會，避免重複實作已有功能，降低技術債務風險。`;

  if (previousAnalysis) {
    prompt += `\n\n## 迭代分析\n\n請對照先前分析結果：\n\n\`\`\`\n${previousAnalysis}\n\`\`\`\n\n請識別：
1. 已解決的問題及解決方案有效性
2. 仍存在的問題及其優先級
3. 新方案如何解決未解決問題
4. 迭代過程中獲得的新見解`;
  }

  prompt += `\n\n## 下一步行動\n\n完成分析後，使用「reflect_task」工具提交最終分析，包含：\n\n1. **原始任務摘要** - 保持與第一階段一致
2. **完整分析結果** - 技術細節、接口依賴、實施策略、驗收標準和工作量估計

您的分析將決定解決方案質量，請全面考慮各種技術因素和業務約束。`;

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
      .describe(
        "完整詳盡的技術分析結果，包括所有技術細節、依賴組件和實施方案，如果需要提供程式碼請使用 pseudocode 格式且盡量精簡只保留核心實現部分"
      ),
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
  const prompt = `## 方案評估\n\n### 任務摘要\n\`\`\`\n${summary}\n\`\`\`\n\n### 分析結果\n\`\`\`\n${analysis}\n\`\`\`\n\n## 評估要點\n\n### 1. 技術完整性
- 檢查方案技術缺陷和邏輯漏洞
- 驗證邊緣情況和異常處理
- 確認數據流和控制流完整性
- 評估技術選型合理性

### 2. 效能與可擴展性
- 分析資源使用效率和優化空間
- 評估系統負載擴展能力
- 識別潛在優化點
- 考慮未來功能擴展可能性

### 3. 需求符合度
- 核對功能需求實現情況
- 檢查非功能性需求符合度
- 確認需求理解準確性
- 評估用戶體驗和業務流程整合

## 決策點\n\n根據評估結果選擇後續行動：\n\n- **發現關鍵問題**：使用「analyze_task」重新提交改進方案
- **輕微調整**：在下一步執行中應用這些小的改進
- **方案完善**：使用「split_tasks」將解決方案分解為可執行子任務，如果任務太多或內容過長，請使用多次使用「split_tasks」工具，每次只提交一小部分任務

## split_tasks 更新模式選擇
- **append** - 保留所有現有任務並添加新任務
- **overwrite** - 清除未完成任務，保留已完成任務
- **selective** - 選擇性更新特定任務，保留其他任務
- **clearAllTasks** - 清除所有任務並創建備份

## 知識傳遞機制
1. **全局分析結果** - 關聯完整分析文檔
2. **任務專屬實現指南** - 每個任務保存具體實現方法
3. **任務專屬驗證標準** - 設置明確驗證要求

## split_tasks 任務太多或內容過長導致「split_tasks」工具無法正常運作時
- 請使用多次使用「split_tasks」工具，每次只提交一小部分任務
- 如果每次只新增一個任務還是無法正常運作，請考慮再次拆分任務，或者簡化任務但必須保留核心內容

請嚴格審查方案，確保解決方案質量。`;

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
      .describe(
        "任務更新模式（必填）：'append'(保留現有任務並新增)、'overwrite'(清除所有未完成任務並重建)、'selective'(根據名稱匹配更新現有任務，保留其餘任務)、'clearAllTasks'(清除所有任務並創建備份)"
      ),
    globalAnalysisResult: z
      .string()
      .optional()
      .describe(
        "全局分析結果：來自 reflect_task 的完整分析結果，適用於所有任務的通用部分"
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
          implementationGuide: z
            .string()
            .describe(
              "此特定任務的具體實現方法和步驟，請參考之前的分析結果提供 pseudocode"
            ),
          verificationCriteria: z
            .string()
            .optional()
            .describe("此特定任務的驗證標準和檢驗方法"),
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
  globalAnalysisResult,
}: z.infer<typeof splitTasksSchema>) {
  // 處理 clearAllTasks 模式，直接調用 modelClearAllTasks 函數
  if (updateMode === "clearAllTasks") {
    const clearResult = await modelClearAllTasks();

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
  if (updateMode === "append") {
    updateModeMessage = "追加模式：保留現有任務並新增";
  } else if (updateMode === "overwrite") {
    updateModeMessage = "覆蓋模式：清除所有未完成任務並重建";
  } else if (updateMode === "selective") {
    updateModeMessage =
      "選擇性更新模式：根據任務名稱更新現有任務、新增缺少任務，保留其餘任務";
  } else if (updateMode === "clearAllTasks") {
    updateModeMessage = "清除模式：清除所有任務並創建備份";
  }

  // 批量創建任務 - 將 updateMode 和 globalAnalysisResult 傳遞給 batchCreateOrUpdateTasks
  const createdTasks = await batchCreateOrUpdateTasks(
    tasks,
    updateMode,
    globalAnalysisResult
  );

  // 獲取所有任務，用於顯示完整的依賴關係
  const allTasks = await getAllTasks();

  let prompt = `## 任務拆分 - ${updateMode} 模式\n\n`;

  prompt += `任務已${
    updateMode === "overwrite"
      ? "覆蓋未完成任務（已完成任務已保留）"
      : updateMode === "selective"
      ? "選擇性更新"
      : "新增至現有任務清單"
  }。\n\n`;

  prompt += `## 拆分策略\n\n1. **按功能分解** - 獨立可測試的子功能，明確輸入輸出
2. **按技術層次分解** - 沿架構層次分離任務，確保接口明確
3. **按開發階段分解** - 核心功能先行，優化功能後續
4. **按風險分解** - 隔離高風險部分，降低整體風險\n\n`;

  prompt += `## 任務質量審核\n\n1. **任務原子性** - 每個任務足夠小且具體，可獨立完成
2. **依賴關係** - 任務依賴形成有向無環圖，避免循環依賴
3. **描述完整性** - 每個任務描述清晰準確，包含必要上下文\n\n`;

  prompt += `## 任務清單\n\n${createdTasks
    .map((task, index) => {
      let taskInfo = `### 任務 ${index + 1}：${task.name}\n**ID:** \`${
        task.id
      }\`\n**描述:** ${task.description}\n`;

      if (task.notes) {
        taskInfo += `**注意事項:** ${task.notes}\n`;
      }

      // 添加實現指南的顯示（如果有）
      if (task.implementationGuide) {
        taskInfo += `**實現指南:** ${
          task.implementationGuide.length > 100
            ? task.implementationGuide.substring(0, 100) +
              "... (執行時可查看完整內容)"
            : task.implementationGuide
        }\n`;
      }

      // 添加驗證標準的顯示（如果有）
      if (task.verificationCriteria) {
        taskInfo += `**驗證標準:** ${
          task.verificationCriteria.length > 100
            ? task.verificationCriteria.substring(0, 100) +
              "... (驗證時可查看完整內容)"
            : task.verificationCriteria
        }\n`;
      }

      // 添加依賴任務
      taskInfo += `${
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
      }`;

      return taskInfo;
    })
    .join("\n")}\n\n`;

  prompt += `## 依賴關係管理\n\n`;
  prompt += `- 設置依賴可使用任務名稱或任務ID\n`;
  prompt += `- 最小化依賴數量，只設置直接前置任務\n`;
  prompt += `- 避免循環依賴，確保任務圖有向無環\n`;
  prompt += `- 平衡關鍵路徑，優化並行執行可能性\n\n`;

  prompt += `## 決策點\n\n`;
  prompt += `- 發現任務拆分不合理：重新呼叫「split_tasks」調整\n`;
  prompt += `- 確認任務拆分完善：生成執行計劃，確定優先順序\n`;

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

  // 構建任務執行提示
  let prompt = `## 任務執行\n\n**名稱:** ${task.name}\n**ID:** \`${
    task.id
  }\`\n**描述:** ${task.description}\n${
    task.notes ? `**注意事項:** ${task.notes}\n` : ""
  }\n`;

  // ===== 增強：顯示實現指南（如果有） =====
  if (task.implementationGuide) {
    prompt += `\n## 實現指南\n\n${task.implementationGuide}\n\n`;
  }

  // ===== 增強：顯示驗證標準（如果有） =====
  if (task.verificationCriteria) {
    prompt += `\n## 驗證標準\n\n${task.verificationCriteria}\n\n`;
  }

  // ===== 增強：顯示分析結果（如果有） =====
  if (task.analysisResult) {
    prompt += `\n## 分析背景\n\n${task.analysisResult}\n\n`;
  }

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
        }
      }
    } catch (error) {
      console.error("加載依賴任務信息時發生錯誤:", error);
    }
  }

  if (task.relatedFiles && task.relatedFiles.length > 0) {
    try {
      // 生成任務相關文件的摘要資訊
      // 使用loadTaskRelatedFiles生成文件摘要，現在函數直接返回格式化的文本
      // 而不是包含content和summary的物件
      const relatedFilesSummary = await loadTaskRelatedFiles(task.relatedFiles);
    } catch (error) {
      console.error("生成任務相關文件摘要時發生錯誤:", error);

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

  prompt += `\n## 執行步驟\n\n`;
  prompt += `1. **分析需求** - 理解任務需求和約束條件\n`;
  prompt += `2. **設計方案** - 制定實施計劃和測試策略\n`;
  prompt += `3. **實施方案** - 按計劃執行，處理邊緣情況\n`;
  prompt += `4. **測試驗證** - 確保功能正確性和穩健性\n\n`;

  prompt += `## 質量要求\n\n`;
  prompt += `- **範圍管理** - 僅修改相關代碼，避免功能蔓延\n`;
  prompt += `- **代碼質量** - 符合編碼標準，處理異常情況\n`;
  prompt += `- **效能考量** - 注意算法效率和資源使用\n\n`;

  prompt += `完成後使用「verify_task」工具進行驗證。`;

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

  // 構建基本的任務詳情
  let prompt = `## 任務驗證\n\n**名稱:** ${task.name}\n**ID:** \`${
    task.id
  }\`\n**描述:** ${task.description}\n${
    task.notes ? `**注意事項:** ${task.notes}\n` : ""
  }\n`;

  // 顯示任務特定的驗證標準（如果有）
  if (task.verificationCriteria) {
    prompt += `\n## 驗證標準\n\n${task.verificationCriteria}\n\n`;
  }

  // 顯示實現指南摘要（如果有）
  if (task.implementationGuide) {
    prompt += `\n## 實現指南摘要\n\n${
      task.implementationGuide.length > 200
        ? task.implementationGuide.substring(0, 200) + "... (參見完整實現指南)"
        : task.implementationGuide
    }\n\n`;
  }

  // 顯示分析結果摘要（如果有）
  if (task.analysisResult) {
    prompt += `\n## 分析要點\n\n${extractSummary(
      task.analysisResult,
      300
    )}\n\n`;
  }

  prompt += `## 驗證標準\n\n1. **需求符合性(30%)** - 功能完整性、約束條件遵循、邊緣情況處理\n2. **技術質量(30%)** - 架構一致性、程式健壯性、實現優雅性\n3. **集成兼容性(20%)** - 系統整合、互操作性、兼容性維護\n4. **性能可擴展性(20%)** - 效能優化、負載適應性、資源管理\n\n## 報告要求\n\n提供整體評分和評級，各項標準評估，問題與建議，及最終結論。\n\n`;
  prompt += `## 決策點\n\n根據驗證結果選擇：\n`;
  prompt += `- **嚴重錯誤**：使用「plan_task」工具重新規劃任務\n`;
  prompt += `- **輕微錯誤**：直接修復問題\n`;
  prompt += `- **無錯誤**：使用「complete_task」工具標記完成\n`;

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
    return {
      content: [
        {
          type: "text" as const,
          text: `## 操作被拒絕\n\n任務 "${task.name}" (ID: \`${task.id}\`) 已完成，不允許刪除已完成的任務。`,
        },
      ],
      isError: true,
    };
  }

  const result = await modelDeleteTask(taskId);

  return {
    content: [
      {
        type: "text" as const,
        text: `## ${result.success ? "操作成功" : "操作失敗"}\n\n${
          result.message
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
          text: `## 操作取消\n\n未確認清除操作。如要清除所有任務，請將 confirm 參數設為 true。\n\n⚠️ 此操作將刪除所有未完成的任務且無法恢復。`,
        },
      ],
    };
  }

  // 檢查是否真的有任務需要清除
  const allTasks = await getAllTasks();
  if (allTasks.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 操作提示\n\n系統中沒有任何任務需要清除。`,
        },
      ],
    };
  }

  // 執行清除操作
  const result = await modelClearAllTasks();

  return {
    content: [
      {
        type: "text" as const,
        text: `## ${result.success ? "操作成功" : "操作失敗"}\n\n${
          result.message
        }${
          result.backupFile
            ? `\n\n已自動創建備份: \`${result.backupFile}\``
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
              RelatedFileType.CREATE,
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
    dependencies: z
      .array(z.string())
      .optional()
      .describe("任務的新依賴關係（選填）"),
    implementationGuide: z
      .string()
      .optional()
      .describe("任務的新實現指南（選填）"),
    verificationCriteria: z
      .string()
      .optional()
      .describe("任務的新驗證標準（選填）"),
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
        data.dependencies ||
        data.implementationGuide ||
        data.verificationCriteria ||
        data.relatedFiles
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
  dependencies,
  implementationGuide,
  verificationCriteria,
}: z.infer<typeof updateTaskContentSchema>) {
  // 獲取任務以檢查它是否存在
  const task = await getTaskById(taskId);

  if (!task) {
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
  if (dependencies)
    updateSummary += `，更新依賴關係 (${dependencies.length} 個)`;
  if (implementationGuide) updateSummary += `，更新實現指南`;
  if (verificationCriteria) updateSummary += `，更新驗證標準`;

  // 執行更新操作
  const result = await modelUpdateTaskContent(taskId, {
    name,
    description,
    notes,
    relatedFiles,
    dependencies,
    implementationGuide,
    verificationCriteria,
  });

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
              RelatedFileType.CREATE,
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

  // 執行更新操作
  const result = await modelUpdateTaskRelatedFiles(taskId, relatedFiles);

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

// 查詢任務工具
export const queryTaskSchema = z.object({
  query: z
    .string()
    .min(1, {
      message: "查詢內容不能為空，請提供任務ID或搜尋關鍵字",
    })
    .describe("搜尋查詢文字，可以是任務ID或多個關鍵字（空格分隔）"),
  isId: z
    .boolean()
    .optional()
    .default(false)
    .describe("指定是否為ID查詢模式，默認為否（關鍵字模式）"),
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .describe("分頁頁碼，默認為第1頁"),
  pageSize: z
    .number()
    .int()
    .positive()
    .min(1)
    .max(20)
    .optional()
    .default(5)
    .describe("每頁顯示的任務數量，默認為5筆，最大20筆"),
});

export async function queryTask({
  query,
  isId = false,
  page = 1,
  pageSize = 3,
}: z.infer<typeof queryTaskSchema>) {
  try {
    // 使用系統指令搜尋函數
    const results = await searchTasksWithCommand(query, isId, page, pageSize);

    // 格式化任務顯示內容
    const tasksDisplay = results.tasks.map((task) =>
      formatTaskForDisplay(task)
    );

    // 構建分頁指導訊息
    let paginationMessage = "";
    if (results.pagination.totalResults > 0) {
      paginationMessage = `\n\n## 分頁資訊\n\n- 當前頁: ${results.pagination.currentPage}/${results.pagination.totalPages}\n- 顯示結果: ${results.tasks.length}筆（共${results.pagination.totalResults}筆）`;

      if (results.pagination.hasMore) {
        paginationMessage += `\n\n要查看下一頁結果，請使用相同的查詢參數，但將頁碼設為 ${
          results.pagination.currentPage + 1
        }。`;
      }
    }

    let responseText = "";

    if (results.tasks.length === 0) {
      responseText = `## 查詢結果\n\n未找到符合條件的任務。請嘗試使用不同的關鍵字或檢查任務ID是否正確。`;
    } else {
      responseText = `## 查詢結果 (${
        results.pagination.totalResults
      })\n\n${tasksDisplay.join("\n\n")}${paginationMessage}`;
    }

    return {
      content: [
        {
          type: "text" as const,
          text: responseText,
        },
      ],
    };
  } catch (error) {
    console.error("查詢任務時發生錯誤:", error);
    return {
      content: [
        {
          type: "text" as const,
          text: `## 系統錯誤\n\n查詢任務時發生錯誤: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}

// 格式化任務顯示內容的輔助函數
function formatTaskForDisplay(task: Task): string {
  let taskInfo = `### ${task.name}\n**ID:** \`${task.id}\`\n**狀態:** ${task.status}\n**描述:** ${task.description}\n`;

  if (task.notes) {
    taskInfo += `**注記:** ${task.notes}\n`;
  }

  if (task.implementationGuide) {
    taskInfo += `**實現指南:** ${
      task.implementationGuide.length > 300
        ? task.implementationGuide.substring(0, 300) + "..."
        : task.implementationGuide
    }\n`;
  }

  if (task.verificationCriteria) {
    taskInfo += `**驗證標準:** ${
      task.verificationCriteria.length > 300
        ? task.verificationCriteria.substring(0, 300) + "..."
        : task.verificationCriteria
    }\n`;
  }

  if (task.summary) {
    taskInfo += `**完成摘要:** ${task.summary}\n`;
  }

  taskInfo += `**創建時間:** ${new Date(task.createdAt).toLocaleString(
    "zh-TW"
  )}\n`;
  taskInfo += `**更新時間:** ${new Date(task.updatedAt).toLocaleString(
    "zh-TW"
  )}\n`;

  if (task.completedAt) {
    taskInfo += `**完成時間:** ${new Date(task.completedAt).toLocaleString(
      "zh-TW"
    )}\n`;
  }

  taskInfo += `**詳細內容:** 請使用「get_task_detail」工具查看 ${task.id} 完整任務詳情`;

  return taskInfo;
}

// 取得完整任務詳情的參數
export const getTaskDetailSchema = z.object({
  taskId: z
    .string()
    .min(1, {
      message: "任務ID不能為空，請提供有效的任務ID",
    })
    .describe("欲檢視詳情的任務ID"),
});

// 取得任務完整詳情
export async function getTaskDetail({
  taskId,
}: z.infer<typeof getTaskDetailSchema>) {
  try {
    // 檢查任務是否存在
    const task = await getTaskById(taskId);
    if (!task) {
      return {
        content: [
          {
            type: "text" as const,
            text: `## 錯誤\n\n找不到ID為 \`${taskId}\` 的任務。請確認任務ID是否正確。`,
          },
        ],
        isError: true,
      };
    }

    // 格式化完整的任務詳情，不截斷內容
    const fullTaskDetail = formatFullTaskDetail(task);

    return {
      content: [
        {
          type: "text" as const,
          text: `## 任務完整詳情\n\n${fullTaskDetail}`,
        },
      ],
    };
  } catch (error) {
    console.error("取得任務詳情時發生錯誤:", error);
    return {
      content: [
        {
          type: "text" as const,
          text: `## 系統錯誤\n\n取得任務詳情時發生錯誤: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}

// 格式化完整任務詳情的輔助函數，不截斷長內容
function formatFullTaskDetail(task: Task): string {
  let taskDetail = `### ${task.name}\n\n**ID:** \`${task.id}\`\n\n**狀態:** ${task.status}\n\n**描述:**\n${task.description}\n\n`;

  if (task.notes) {
    taskDetail += `**注記:**\n${task.notes}\n\n`;
  }

  if (task.dependencies && task.dependencies.length > 0) {
    taskDetail += `**依賴任務:** ${task.dependencies
      .map((dep) => `\`${dep.taskId}\``)
      .join(", ")}\n\n`;
  }

  if (task.implementationGuide) {
    taskDetail += `**實現指南:**\n\`\`\`\n${task.implementationGuide}\n\`\`\`\n\n`;
  }

  if (task.verificationCriteria) {
    taskDetail += `**驗證標準:**\n\`\`\`\n${task.verificationCriteria}\n\`\`\`\n\n`;
  }

  if (task.relatedFiles && task.relatedFiles.length > 0) {
    taskDetail += `**相關文件:**\n`;
    for (const file of task.relatedFiles) {
      taskDetail += `- \`${file.path}\` (${file.type})${
        file.description ? `: ${file.description}` : ""
      }\n`;
    }
    taskDetail += `\n`;
  }

  taskDetail += `**創建時間:** ${new Date(task.createdAt).toLocaleString(
    "zh-TW"
  )}\n`;
  taskDetail += `**更新時間:** ${new Date(task.updatedAt).toLocaleString(
    "zh-TW"
  )}\n`;

  if (task.completedAt) {
    taskDetail += `**完成時間:** ${new Date(task.completedAt).toLocaleString(
      "zh-TW"
    )}\n\n`;
  }

  if (task.summary) {
    taskDetail += `**完成摘要:**\n${task.summary}\n\n`;
  }

  return taskDetail;
}
