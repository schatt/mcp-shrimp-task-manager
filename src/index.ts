import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { RelatedFileType } from "./types/index.js";

// 導入工具函數
import {
  planTask,
  planTaskSchema,
  analyzeTask,
  analyzeTaskSchema,
  reflectTask,
  reflectTaskSchema,
  splitTasks,
  splitTasksSchema,
  listTasks,
  executeTask,
  executeTaskSchema,
  verifyTask,
  verifyTaskSchema,
  completeTask,
  completeTaskSchema,
  deleteTask,
  deleteTaskSchema,
  clearAllTasks,
  clearAllTasksSchema,
  updateTaskContent,
  updateTaskContentSchema,
  updateTaskRelatedFiles,
  updateTaskRelatedFilesSchema,
} from "./tools/taskTools.js";

async function main() {
  try {
    console.log("啟動蝦米任務管理器服務...");

    // 創建MCP服務器
    const server = new McpServer({
      name: "蝦米任務管理器",
      version: "1.0.0",
    });

    // 註冊工具 - 使用已定義的schema物件，並添加內嵌錯誤處理
    server.tool(
      "plan_task",
      "初始化並詳細規劃任務流程，建立明確的目標與成功標準，可選擇參考現有任務進行延續規劃",
      {
        description: z
          .string()
          .min(10, {
            message:
              "任務描述不能少於10個字符，請提供更詳細的描述以確保任務目標明確",
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
      },
      async (args) => {
        return await planTask(args);
      }
    );

    server.tool(
      "analyze_task",
      "深入分析任務需求並系統性檢查代碼庫，評估技術可行性與潛在風險，如果需要提供程式碼請使用 pseudocode 格式且盡量精簡只保留核心實現部分",
      {
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
              "初步解答構想過於簡短，請提供更完整的技術方案和實施策略詳情",
          })
          .describe(
            "初步解答構想，包含技術方案、架構設計和實施策略，如果需要提供程式碼請使用 pseudocode 格式且盡量精簡只保留核心實現部分"
          ),
        previousAnalysis: z
          .string()
          .optional()
          .describe(
            "前次迭代的分析結果，用於持續改進方案（僅在重新分析時需提供）"
          ),
      },
      async (args) => {
        return await analyzeTask(args);
      }
    );

    server.tool(
      "reflect_task",
      "批判性審查分析結果，評估方案完整性並識別優化機會，確保解決方案符合最佳實踐，如果需要提供程式碼請使用 pseudocode 格式且盡量精簡只保留核心實現部分",
      {
        summary: z
          .string()
          .min(20, {
            message:
              "任務摘要太短，請確保包含完整的任務目標和範圍以維持分析連續性",
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
      },
      async (args) => {
        return await reflectTask(args);
      }
    );

    server.tool(
      "split_tasks",
      "將複雜任務分解為獨立且可追蹤的子任務，建立明確的依賴關係和優先順序。支援四種任務更新模式：追加(append)、覆蓋(overwrite)、選擇性更新(selective)和清除所有任務(clearAllTasks)，其中覆蓋模式只會刪除未完成的任務並保留已完成任務，選擇性更新模式可根據任務名稱智能匹配更新現有任務，同時保留其他任務，如果你需要規劃全新的任務請使用清除所有任務模式會清除所有任務並創建備份。請優先使用清除所有任務模式，只有用戶要求變更或修改計畫內容才使用其他模式。\n\n**請參考之前的分析結果提供 pseudocode\n\n**如果任務太多或內容過長，請分批使用「split_tasks」工具，每次只提交一小部分任務",
      {
        updateMode: z
          .enum(["append", "overwrite", "selective", "clearAllTasks"])
          .describe(
            "任務更新模式選擇：'append'(保留所有現有任務並添加新任務)、'overwrite'(清除所有未完成任務並完全替換，保留已完成任務)、'selective'(智能更新：根據任務名稱匹配更新現有任務，保留不在列表中的任務，推薦用於任務微調)、'clearAllTasks'(清除所有任務並創建備份)。\n預設為'clearAllTasks'模式，只有用戶要求變更或修改計畫內容才使用其他模式"
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
                .max(100, {
                  message: "任務名稱過長，請保持簡潔，不超過100個字符",
                })
                .describe("簡潔明確的任務名稱，應能清晰表達任務目的"),
              description: z
                .string()
                .min(10, {
                  message:
                    "任務描述太短，請詳細說明實施要點、技術細節和驗收標準",
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
                  "此任務依賴的前置任務ID或任務名稱列表，支持兩種引用方式，名稱引用更直觀，是一個字串陣列"
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
          .describe("結構化的任務清單，每個任務應保持原子性且有明確的完成標準"),
      },
      async (args) => {
        return await splitTasks(args);
      }
    );

    server.tool(
      "list_tasks",
      "生成結構化任務清單，包含完整狀態追蹤、優先級和依賴關係",
      {},
      async (args) => {
        return await listTasks();
      }
    );

    server.tool(
      "execute_task",
      "按照預定義計劃執行特定任務，確保每個步驟的輸出符合質量標準",
      {
        taskId: z
          .string()
          .describe("待執行任務的唯一標識符，必須是系統中存在的有效任務ID"),
      },
      async (args) => {
        return await executeTask(args);
      }
    );

    server.tool(
      "verify_task",
      "全面驗證任務完成度，確保所有需求與技術標準都已滿足，並無遺漏細節",
      {
        taskId: z
          .string()
          .describe("待驗證任務的唯一標識符，必須是系統中存在的有效任務ID"),
      },
      async (args) => {
        return await verifyTask(args);
      }
    );

    server.tool(
      "complete_task",
      "正式標記任務為完成狀態，生成詳細的完成報告，並更新關聯任務的依賴狀態",
      {
        taskId: z
          .string()
          .describe("待完成任務的唯一標識符，必須是系統中存在的有效任務ID"),
        summary: z
          .string()
          .optional()
          .describe(
            "任務完成摘要，簡潔描述實施結果和重要決策（選填，如未提供將自動生成）"
          ),
      },
      async (args) => {
        return await completeTask(args);
      }
    );

    server.tool(
      "delete_task",
      "刪除未完成的任務，但不允許刪除已完成的任務，確保系統記錄的完整性",
      {
        taskId: z
          .string()
          .describe("待刪除任務的唯一標識符，必須是系統中存在且未完成的任務ID"),
      },
      async (args) => {
        return await deleteTask(args);
      }
    );

    // 註冊清除所有任務工具
    server.tool(
      "clear_all_tasks",
      "刪除系統中所有未完成的任務，該指令必須由用戶明確確認才能執行",
      {
        confirm: z
          .boolean()
          .describe("確認刪除所有未完成的任務（此操作不可逆）"),
      },
      async (args) => {
        return await clearAllTasks(args);
      }
    );

    // 註冊更新任務工具
    server.tool(
      "update_task",
      "更新任務內容，包括名稱、描述和注記，但不允許修改已完成的任務",
      {
        taskId: z
          .string()
          .describe("待更新任務的唯一標識符，必須是系統中存在且未完成的任務ID"),
        name: z.string().optional().describe("任務的新名稱（選填）"),
        description: z.string().optional().describe("任務的新描述內容（選填）"),
        notes: z.string().optional().describe("任務的新補充說明（選填）"),
        dependencies: z
          .array(z.string())
          .optional()
          .describe("任務的新依賴關係（選填）"),
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
              description: z
                .string()
                .optional()
                .describe("文件的補充描述（選填）"),
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
        implementationGuide: z
          .string()
          .optional()
          .describe("任務的新實現指南（選填）"),
        verificationCriteria: z
          .string()
          .optional()
          .describe("任務的新驗證標準（選填）"),
      },
      async (args) => {
        return await updateTaskContent(args);
      }
    );

    // 註冊更新任務相關文件工具
    server.tool(
      "update_task_files",
      "更新任務相關文件列表，用於記錄與任務相關的代碼文件、參考資料等",
      {
        taskId: z
          .string()
          .describe("待更新任務的唯一標識符，必須是系統中存在且未完成的任務ID"),
        relatedFiles: z
          .array(
            z.object({
              path: z
                .string()
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
              description: z
                .string()
                .optional()
                .describe("文件的補充描述（選填）"),
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
          .describe("與任務相關的文件列表"),
      },
      async (args) => {
        return await updateTaskRelatedFiles(args);
      }
    );

    // 建立連接
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.log("蝦米任務管理器服務已啟動");
  } catch (error) {
    console.error("啟動服務失敗:", error);
    process.exit(1);
  }
}

main().catch(console.error);
