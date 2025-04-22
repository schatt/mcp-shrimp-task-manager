import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

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
  listTasksSchema,
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
  queryTask,
  queryTaskSchema,
  getTaskDetail,
  getTaskDetailSchema,
} from "./tools/taskTools.js";

// 導入思維鏈工具
import {
  processThought,
  processThoughtSchema,
} from "./tools/thoughtChainTools.js";

// 導入專案工具
import {
  initProjectRules,
  initProjectRulesSchema,
} from "./tools/projectTools.js";

async function main() {
  try {
    console.log("啟動蝦米任務管理器服務...");

    // 創建MCP服務器
    const server = new Server(
      {
        name: "蝦米任務管理器",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // {
    //   type: "object" as const,
    // }
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "plan_task",
            description:
              "初始化並詳細規劃任務流程，建立明確的目標與成功標準，可選擇參考現有任務進行延續規劃",
            inputSchema: zodToJsonSchema(planTaskSchema),
          },
          {
            name: "analyze_task",
            description:
              "深入分析任務需求並系統性檢查代碼庫，評估技術可行性與潛在風險，如果需要提供程式碼請使用 pseudocode 格式且僅提供高級邏輯流程和關鍵步驟避免完整代碼",
            inputSchema: zodToJsonSchema(analyzeTaskSchema),
          },
          {
            name: "reflect_task",
            description:
              "批判性審查分析結果，評估方案完整性並識別優化機會，確保解決方案符合最佳實踐，如果需要提供程式碼請使用 pseudocode 格式且僅提供高級邏輯流程和關鍵步驟避免完整代碼",
            inputSchema: zodToJsonSchema(reflectTaskSchema),
          },
          {
            name: "split_tasks",
            description: `將複雜任務分解為獨立子任務，建立依賴關係和優先順序。
## updateMode
- **append**：保留現有任務並添加新任務
- **overwrite**：刪除未完成任務，保留已完成任務
- **selective**：根據任務名稱智能匹配更新現有任務
- **clearAllTasks**：清除所有任務並創建備份（優先使用此模式）

## 關鍵要求
- **提供精簡pseudocode**：僅提供高級邏輯流程和關鍵步驟避免完整代碼
- **必要時整合**：簡單修改可與其他任務整合，避免任務過多
- **分批提交**：任務過多時使用「split_tasks」工具，參數不超過8000字`,
            inputSchema: zodToJsonSchema(splitTasksSchema),
          },
          {
            name: "list_tasks",
            description:
              "生成結構化任務清單，包含完整狀態追蹤、優先級和依賴關係",
            inputSchema: zodToJsonSchema(listTasksSchema),
          },
          {
            name: "execute_task",
            description:
              "按照預定義計劃執行特定任務，確保每個步驟的輸出符合質量標準",
            inputSchema: zodToJsonSchema(executeTaskSchema),
          },
          {
            name: "verify_task",
            description:
              "全面驗證任務完成度，確保所有需求與技術標準都已滿足，並無遺漏細節",
            inputSchema: zodToJsonSchema(verifyTaskSchema),
          },
          {
            name: "complete_task",
            description:
              "正式標記任務為完成狀態，生成詳細的完成報告，並更新關聯任務的依賴狀態",
            inputSchema: zodToJsonSchema(completeTaskSchema),
          },
          {
            name: "delete_task",
            description:
              "刪除未完成的任務，但不允許刪除已完成的任務，確保系統記錄的完整性",
            inputSchema: zodToJsonSchema(deleteTaskSchema),
          },
          {
            name: "clear_all_tasks",
            description:
              "刪除系統中所有未完成的任務，該指令必須由用戶明確確認才能執行",
            inputSchema: zodToJsonSchema(clearAllTasksSchema),
          },
          {
            name: "update_task",
            description:
              "更新任務內容，包括名稱、描述和注記、依賴任務、相關文件、實現指南和驗證標準，已完成的任務僅允許更新摘要和相關文件",
            inputSchema: zodToJsonSchema(updateTaskContentSchema),
          },
          // {
          //   name: "update_task_files",
          //   description:
          //     "更新任務相關文件列表，用於記錄與任務相關的代碼文件、參考資料等",
          //   inputSchema: zodToJsonSchema(updateTaskRelatedFilesSchema),
          // },
          {
            name: "query_task",
            description: "根據關鍵字或ID搜尋任務，顯示省略版的任務資訊",
            inputSchema: zodToJsonSchema(queryTaskSchema),
          },
          {
            name: "get_task_detail",
            description:
              "根據任務ID獲取任務的完整詳細信息，包括未截斷的實現指南和驗證標準等",
            inputSchema: zodToJsonSchema(getTaskDetailSchema),
          },
          {
            name: "process_thought",
            description:
              "進行靈活且可演化的思考流程，透過建立、質疑、驗證與修正想法，逐步深化理解並產生有效解法。遇到需收集資料或分析或研究的情境時，應優先查看專案相關程式；如相關程式不存在，可查詢網路而非臆測。思考充分時設 nextThoughtNeeded 為 false，否則調整 total_thoughts 延長流程",
            inputSchema: zodToJsonSchema(processThoughtSchema),
          },
          {
            name: "init_project_rules",
            description:
              "初始化專案規範，當用戶要求產生或初始化專案規範文件時呼叫該工具，如果用戶要求變更或更新專案規範也呼叫該工具",
            inputSchema: zodToJsonSchema(initProjectRulesSchema),
          },
        ],
      };
    });

    server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        try {
          if (!request.params.arguments) {
            throw new Error("No arguments provided");
          }

          let parsedArgs;
          switch (request.params.name) {
            case "plan_task":
              parsedArgs = await planTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await planTask(parsedArgs.data);
            case "analyze_task":
              parsedArgs = await analyzeTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await analyzeTask(parsedArgs.data);
            case "reflect_task":
              parsedArgs = await reflectTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await reflectTask(parsedArgs.data);
            case "split_tasks":
              parsedArgs = await splitTasksSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await splitTasks(parsedArgs.data);
            case "list_tasks":
              parsedArgs = await listTasksSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await listTasks(parsedArgs.data);
            case "execute_task":
              parsedArgs = await executeTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await executeTask(parsedArgs.data);
            case "verify_task":
              parsedArgs = await verifyTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await verifyTask(parsedArgs.data);
            case "complete_task":
              parsedArgs = await completeTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await completeTask(parsedArgs.data);
            case "delete_task":
              parsedArgs = await deleteTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await deleteTask(parsedArgs.data);
            case "clear_all_tasks":
              parsedArgs = await clearAllTasksSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await clearAllTasks(parsedArgs.data);
            case "update_task":
              parsedArgs = await updateTaskContentSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await updateTaskContent(parsedArgs.data);
            // case "update_task_files":
            //   parsedArgs = await updateTaskRelatedFilesSchema.safeParseAsync(
            //     request.params.arguments
            //   );
            //   if (!parsedArgs.success) {
            //     throw new Error(
            //       `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
            //     );
            //   }
            //   return await updateTaskRelatedFiles(parsedArgs.data);
            case "query_task":
              parsedArgs = await queryTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await queryTask(parsedArgs.data);
            case "get_task_detail":
              parsedArgs = await getTaskDetailSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await getTaskDetail(parsedArgs.data);
            case "process_thought":
              parsedArgs = await processThoughtSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await processThought(parsedArgs.data);
            case "init_project_rules":
              return await initProjectRules();
            default:
              throw new Error(`工具 ${request.params.name} 不存在`);
          }
        } catch (error) {
          console.error("Error executing tool:", error);
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `發生錯誤: ${errorMsg} \n 請嘗試修正錯誤並重新嘗試呼叫工具`,
              },
            ],
          };
        }
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
