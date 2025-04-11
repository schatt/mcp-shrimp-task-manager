import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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
} from "./tools/taskTools.js";

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

    // 註冊工具 - 使用已定義的schema物件
    server.tool(
      "plan_task",
      "初始化並詳細規劃任務流程，建立明確的目標與成功標準",
      {
        description: z
          .string()
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
          .describe("結構化的任務摘要，包含任務目標、範圍與關鍵技術挑戰"),
        initialConcept: z
          .string()
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
          .describe("結構化的任務摘要，保持與分析階段一致以確保連續性"),
        analysis: z
          .string()
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
                .describe("簡潔明確的任務名稱，應能清晰表達任務目的"),
              description: z
                .string()
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
      async () => {
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
      },
      async (args) => {
        return await completeTask(args);
      }
    );

    // 註冊提示
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
        return planTaskPrompt(args);
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
