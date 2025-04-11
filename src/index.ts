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

// 導入日誌工具函數
import {
  listConversationLog,
  listConversationLogSchema,
  clearConversationLog,
  clearConversationLogSchema,
} from "./tools/logTools.js";

// 導入提示模板
import {
  planTaskPrompt,
  planTaskPromptSchema,
  executeTaskPrompt,
  executeTaskPromptSchema,
  verifyTaskPrompt,
  verifyTaskPromptSchema,
} from "./prompts/taskPrompts.js";

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
      "初始化並詳細規劃任務流程，建立明確的目標與成功標準",
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
      },
      async (args) => {
        return await planTask(args);
      }
    );

    server.tool(
      "analyze_task",
      "深入分析任務需求並系統性檢查代碼庫，評估技術可行性與潛在風險",
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
          .describe("初步解答構想，包含技術方案、架構設計和實施策略"),
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
      "批判性審查分析結果，評估方案完整性並識別優化機會，確保解決方案符合最佳實踐",
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
            "完整詳盡的技術分析結果，包括所有技術細節、依賴組件和實施方案"
          ),
      },
      async (args) => {
        return await reflectTask(args);
      }
    );

    server.tool(
      "split_tasks",
      "將複雜任務分解為獨立且可追蹤的子任務，建立明確的依賴關係和優先順序",
      {
        isOverwrite: z
          .boolean()
          .describe(
            "任務覆蓋模式選擇（true：清除並覆蓋所有現有任務；false：保留現有任務並新增）"
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
                .array(z.string())
                .optional()
                .describe(
                  "此任務依賴的前置任務ID或任務名稱列表，支持兩種引用方式，名稱引用更直觀"
                ),
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
                  RelatedFileType.OUTPUT,
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

    // 註冊日誌查詢工具
    server.tool(
      "list_conversation_log",
      "查詢系統對話日誌，支持按任務 ID 或時間範圍過濾，提供分頁功能處理大量記錄",
      {
        taskId: z
          .string()
          .optional()
          .describe("按任務 ID 過濾對話記錄（選填）"),
        startDate: z
          .string()
          .optional()
          .describe("起始日期過濾，格式為 ISO 日期字串（選填）"),
        endDate: z
          .string()
          .optional()
          .describe("結束日期過濾，格式為 ISO 日期字串（選填）"),
        limit: z
          .number()
          .int()
          .positive()
          .max(100)
          .default(20)
          .describe("返回結果數量限制，最大 100（預設：20）"),
        offset: z
          .number()
          .int()
          .nonnegative()
          .default(0)
          .describe("分頁偏移量（預設：0）"),
      },
      async (args) => {
        return await listConversationLog(args);
      }
    );

    // 註冊日誌清除工具
    server.tool(
      "clear_conversation_log",
      "清除所有對話日誌記錄，需要明確確認以避免意外操作",
      {
        confirm: z.boolean().describe("確認刪除所有日誌記錄（此操作不可逆）"),
      },
      async (args) => {
        return await clearConversationLog(args);
      }
    );

    // 註冊提示 - 使用同樣的錯誤處理模式
    server.prompt(
      "plan_task_prompt",
      "生成結構化的新任務規劃，包含明確目標、評估標準與執行步驟",
      {
        taskType: z
          .string()
          .describe("任務類型，例如 'bug修復'、'功能開發'、'性能優化'等"),
        description: z
          .string()
          .describe("完整詳細的任務問題描述，包含任務背景和目標"),
        codeContext: z
          .string()
          .optional()
          .describe("相關代碼片段或文件路徑（選填）"),
      },
      async (args) => {
        return await planTaskPrompt(args);
      }
    );

    server.prompt(
      "execute_task_prompt",
      "提供執行特定任務的詳細指南，包含所有必要上下文與技術細節",
      {
        taskId: z.string().describe("待執行任務的唯一標識符"),
        additionalContext: z
          .string()
          .optional()
          .describe("執行任務時需要參考的額外信息（選填）"),
      },
      async (args) => {
        return await executeTaskPrompt(args);
      }
    );

    server.prompt(
      "verify_task_prompt",
      "生成全面的任務驗證標準與檢查清單，確保質量與完整性",
      {
        taskId: z.string().describe("待驗證任務的唯一標識符"),
        verificationFocus: z
          .string()
          .optional()
          .describe("特別需要關注的驗證方向，如'安全性'、'性能'等（選填）"),
      },
      async (args) => {
        return await verifyTaskPrompt(args);
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
