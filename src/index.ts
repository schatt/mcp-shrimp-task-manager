import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

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
    const server = new McpServer({
      name: "蝦米任務管理器",
      version: "1.0.0",
    });

    // 註冊工具 - 使用已定義的schema物件，並添加內嵌錯誤處理
    server.tool(
      "plan_task",
      "初始化並詳細規劃任務流程，建立明確的目標與成功標準，可選擇參考現有任務進行延續規劃",
      planTaskSchema.shape,
      async (args) => {
        return await planTask(args);
      }
    );

    server.tool(
      "analyze_task",
      "深入分析任務需求並系統性檢查代碼庫，評估技術可行性與潛在風險，如果需要提供程式碼請使用 pseudocode 格式且盡量精簡只保留核心實現部分",
      analyzeTaskSchema.shape,
      async (args) => {
        return await analyzeTask(args);
      }
    );

    server.tool(
      "reflect_task",
      "批判性審查分析結果，評估方案完整性並識別優化機會，確保解決方案符合最佳實踐，如果需要提供程式碼請使用 pseudocode 格式且盡量精簡只保留核心實現部分",
      reflectTaskSchema.shape,
      async (args) => {
        return await reflectTask(args);
      }
    );

    server.tool(
      "split_tasks",
      "將複雜任務分解為獨立且可追蹤的子任務，建立明確的依賴關係和優先順序。支援四種任務更新模式：追加(append)、覆蓋(overwrite)、選擇性更新(selective)和清除所有任務(clearAllTasks)，其中覆蓋模式只會刪除未完成的任務並保留已完成任務，選擇性更新模式可根據任務名稱智能匹配更新現有任務，同時保留其他任務，如果你需要規劃全新的任務請使用清除所有任務模式會清除所有任務並創建備份。請優先使用清除所有任務模式，只有用戶要求變更或修改計畫內容才使用其他模式。\n\n**請參考之前的分析結果提供 pseudocode\n\n**如果任務太多或內容過長，請分批使用「split_tasks」工具，每次只提交一小部分任務",
      splitTasksSchema.shape,
      async (args) => {
        return await splitTasks(args);
      }
    );

    server.tool(
      "list_tasks",
      "生成結構化任務清單，包含完整狀態追蹤、優先級和依賴關係",
      listTasksSchema.shape,
      async (args) => {
        return await listTasks(args);
      }
    );

    server.tool(
      "execute_task",
      "按照預定義計劃執行特定任務，確保每個步驟的輸出符合質量標準",
      executeTaskSchema.shape,
      async (args) => {
        return await executeTask(args);
      }
    );

    server.tool(
      "verify_task",
      "全面驗證任務完成度，確保所有需求與技術標準都已滿足，並無遺漏細節",
      verifyTaskSchema.shape,
      async (args) => {
        return await verifyTask(args);
      }
    );

    server.tool(
      "complete_task",
      "正式標記任務為完成狀態，生成詳細的完成報告，並更新關聯任務的依賴狀態",
      completeTaskSchema.shape,
      async (args) => {
        return await completeTask(args);
      }
    );

    server.tool(
      "delete_task",
      "刪除未完成的任務，但不允許刪除已完成的任務，確保系統記錄的完整性",
      deleteTaskSchema.shape,
      async (args) => {
        return await deleteTask(args);
      }
    );

    // 註冊清除所有任務工具
    server.tool(
      "clear_all_tasks",
      "刪除系統中所有未完成的任務，該指令必須由用戶明確確認才能執行",
      clearAllTasksSchema.shape,
      async (args) => {
        return await clearAllTasks(args);
      }
    );

    // 註冊更新任務工具
    server.tool(
      "update_task",
      "更新任務內容，包括名稱、描述和注記，但不允許修改已完成的任務",
      updateTaskContentSchema.shape,
      async (args) => {
        return await updateTaskContent(args);
      }
    );

    // 註冊更新任務相關文件工具
    server.tool(
      "update_task_files",
      "更新任務相關文件列表，用於記錄與任務相關的代碼文件、參考資料等",
      updateTaskRelatedFilesSchema.shape,
      async (args) => {
        return await updateTaskRelatedFiles(args);
      }
    );

    // 註冊查詢任務工具
    server.tool(
      "query_task",
      "根據關鍵字或ID搜尋任務，顯示省略版的任務資訊",
      queryTaskSchema.shape,
      async (args) => {
        return await queryTask(args);
      }
    );

    // 註冊取得任務完整詳情工具
    server.tool(
      "get_task_detail",
      "根據任務ID獲取任務的完整詳細信息，包括未截斷的實現指南和驗證標準等",
      getTaskDetailSchema.shape,
      async (args) => {
        return await getTaskDetail(args);
      }
    );

    // 註冊思維鏈工具
    server.tool(
      "process_thought",
      "任何需要思考或分析的時候，透過該工具進行靈活的、可適應和發展的思考過程來分析問題，隨著理解的加深，每個想法都可以建立、質疑或修改先前的見解。你可以質疑想法、假設想法、驗證想法，並且可以建立新的想法。你將重複這個過程，直到你對問題有足夠的理解，並且能夠提出有效的解決方案。如果你覺得思考已經充分可以把 nextThoughtNeeded 設為 false 並且停止思考，如果你覺得需要更多的思考你可以隨時變更 total_thoughts 來增加步驟。",
      processThoughtSchema.shape,
      async (args) => {
        return await processThought(args);
      }
    );

    // 註冊初始化專案規範工具
    server.tool(
      "init_project_rules",
      "初始化專案規範，當用戶要求產生或初始化專案規範文件時呼叫該工具，如果用戶要求變更或更新專案規範也呼叫該工具",
      initProjectRulesSchema.shape,
      async () => {
        return await initProjectRules();
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
