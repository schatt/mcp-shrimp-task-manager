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
});

export async function planTask({
  description,
  requirements,
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

  prompt += `## 分析指引\n\n1. 首先確定任務的確切目標和預期成果
2. 識別任務中可能的技術挑戰和關鍵決策點
3. 考慮潛在的解決方案和替代方案
4. 評估每種方案的優缺點

如果對任務描述有任何不清楚或需要澄清的地方，請明確向用戶提問。

## 下一步行動\n\n完成初步分析後，請使用「analyze_task」工具提交您的分析結果，必須同時包含：\n\n1. 結構化的任務摘要（包括目標、範圍和關鍵挑戰）\n2. 初步解答構想（包括技術方案和實施策略）`;

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

  prompt += `## 技術審核指引\n\n請執行以下分析步驟：\n\n1. 檢查現有程式碼庫中的相似實現或可重用組件
2. 評估是否可以抽象出通用模式或利用現有框架
3. 識別潛在的技術債務或效能瓶頸
4. 確保方案符合項目的架構風格和最佳實踐

請特別關注程式碼重用的機會，避免重複實作已有功能，降低技術債務風險。`;

  if (previousAnalysis) {
    prompt += `\n\n## 迭代分析\n\n請對照先前的分析結果進行比較和改進：\n\n\`\`\`\n${previousAnalysis}\n\`\`\`\n\n請明確識別：\n1. 哪些問題已經解決\n2. 哪些問題仍然存在\n3. 您的新方案如何解決之前未解決的問題`;
  }

  prompt += `\n\n## 下一步行動\n\n完成深入分析後，請使用「reflect_task」工具提交：\n\n1. 原始任務摘要（保持與第一階段一致）\n2. 完整的分析結果（包括技術細節、依賴組件和實施策略）`;

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

  const prompt = `## 解決方案反思與評估\n\n### 任務摘要\n\`\`\`\n${summary}\n\`\`\`\n\n### 詳細分析結果\n\`\`\`\n${analysis}\n\`\`\`\n\n## 批判性評估指引\n\n請從以下多個維度對您的解決方案進行全面且批判性的審查：\n\n### 1. 技術完整性評估\n- 方案是否存在技術缺陷或邏輯漏洞？
- 是否考慮了邊緣情況和異常處理？
- 所有數據流和控制流是否清晰定義？

### 2. 效能與可擴展性評估
- 解決方案在資源使用效率方面是否最佳化？
- 系統在負載增加時是否仍能保持穩定性能？
- 是否有可能進一步優化的部分？

### 3. 需求符合度評估
- 解決方案是否完全實現了所有功能需求？
- 是否符合所有非功能性需求（如安全性、可維護性）？
- 是否有遺漏或誤解的需求？

## 決策點\n\n基於您的反思，請選擇下一步行動：\n\n- 如果發現需要改進的關鍵問題：請使用「analyze_task」工具，重新提交改進後的方案（必須包含之前的摘要和修改後的構想）\n\n- 如果確認方案已足夠完善：請使用「split_tasks」工具，將解決方案分解為具體、可執行的子任務，並建立明確的依賴關係`;

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
  isOverwrite,
  tasks,
}: z.infer<typeof splitTasksSchema>) {
  // 記錄任務拆分
  try {
    await addConversationEntry(
      ConversationParticipant.MCP,
      `拆分任務：${isOverwrite ? "覆蓋模式" : "新增模式"}，任務數量：${
        tasks.length
      }`,
      undefined,
      "任務拆分"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  // 批量創建任務
  const createdTasks = await batchCreateOrUpdateTasks(tasks, isOverwrite);

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

  const prompt = `## 任務拆分結果 - ${
    isOverwrite ? "覆蓋模式" : "新增模式"
  }\n\n### 系統確認\n任務已成功${
    isOverwrite ? "覆蓋現有任務清單" : "新增至現有任務清單"
  }。\n\n## 任務質量審核指引\n\n請根據以下標準對任務拆分進行嚴格的質量審核：\n\n### 1. 任務原子性\n- 每個任務是否足夠小且具體，可獨立完成？
- 任務是否具有清晰的完成標準？
- 是否避免了範圍過大的任務？

### 2. 依賴關係完整性\n- 任務依賴關係是否形成有向無環圖？
- 是否存在隱藏依賴未被明確標記？
- 依賴鏈是否最短化，避免不必要的阻塞？

### 3. 描述完整性\n- 每個任務描述是否清晰準確？
- 是否包含足夠的上下文信息？
- 注意事項是否涵蓋關鍵實施細節？

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
    )}\n\n## 任務依賴提示\n\n在建立新任務時，可以通過以下方式指定依賴關係：\n\n1. **使用任務名稱**（推薦）：直接使用其他任務的名稱，如 \`"建立用戶界面"\`\n2. **使用任務ID**：使用任務的唯一標識符，如 \`"${
    createdTasks.length > 0
      ? createdTasks[0].id
      : "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
  }"\`\n\n## 決策點\n\n請選擇下一步行動：\n\n- 如發現任務拆分不合理：請重新呼叫「split_tasks」工具，調整任務定義或依賴關係\n\n- 如確認任務拆分完善：請生成執行計劃摘要，包括建議的執行順序、關鍵路徑和風險點`;

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
  let relatedFilesContent = "";
  let relatedFilesSummary = "";
  let contextInfo = "";

  // 查找之前執行過的相關日誌條目，增強上下文記憶
  try {
    const taskLogs = await getConversationEntriesByTaskId(task.id);
    if (taskLogs.length > 0) {
      // 按時間排序，獲取最近的日誌（最多3條）
      const recentLogs = [...taskLogs]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 3);

      if (recentLogs.length > 0) {
        contextInfo += `\n## 任務執行歷史摘要\n\n最近 ${recentLogs.length} 條操作記錄：\n\n`;
        recentLogs.forEach((log, index) => {
          const timestamp = new Date(log.timestamp)
            .toISOString()
            .replace(/T/, " ")
            .replace(/\..+/, "");
          contextInfo += `${index + 1}. [${timestamp}] ${log.summary}\n`;
        });

        // 記錄日誌加載
        await addConversationEntry(
          ConversationParticipant.MCP,
          `已加載任務歷史記錄，共 ${recentLogs.length} 條`,
          task.id,
          "加載歷史記錄"
        );
      }
    }
  } catch (error) {
    console.error("加載任務歷史記錄時發生錯誤:", error);
  }

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
      const loadResult = await loadTaskRelatedFiles(task.relatedFiles);
      relatedFilesContent = loadResult.content;
      relatedFilesSummary = loadResult.summary;

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

  // ===== 增強：添加相關文件部分，更詳細的信息 =====
  if (task.relatedFiles && task.relatedFiles.length > 0) {
    prompt += `\n## 任務相關文件\n\n共關聯 ${task.relatedFiles.length} 個文件，類型分布：\n`;

    // 按類型分組統計
    const fileTypeCount: Record<string, number> = {};
    task.relatedFiles.forEach((file) => {
      fileTypeCount[file.type] = (fileTypeCount[file.type] || 0) + 1;
    });

    Object.entries(fileTypeCount).forEach(([type, count]) => {
      prompt += `- ${type}: ${count} 個\n`;
    });

    // 新增：展示文件詳細列表
    prompt += `\n### 文件詳細列表\n`;

    // 按類型分組
    const filesByType = task.relatedFiles.reduce((acc, file) => {
      acc[file.type] = acc[file.type] || [];
      acc[file.type].push(file);
      return acc;
    }, {} as Record<string, RelatedFile[]>);

    // 展示每種類型的文件
    Object.entries(filesByType).forEach(([type, files]) => {
      prompt += `\n#### ${type} (${files.length} 個)\n`;
      files.forEach((file, index) => {
        prompt += `${index + 1}. \`${file.path}\`${
          file.description ? ` - ${file.description}` : ""
        }${
          file.lineStart && file.lineEnd
            ? ` (行 ${file.lineStart}-${file.lineEnd})`
            : ""
        }\n`;
      });
    });

    prompt += `\n使用這些相關文件作為上下文，幫助您理解任務需求和實現細節。系統已為文件生成摘要資訊，無需讀取實際檔案內容。\n`;
  }

  // 添加上下文信息
  if (contextInfo) {
    prompt += contextInfo;
  }

  prompt += `\n## 執行指引\n\n1. 請仔細分析任務要求，確保理解所有細節和約束條件
2. 設計詳細的執行方案，包括具體步驟和技術選擇
3. 系統性地實施您的方案，遵循最佳實踐和項目慣例
4. 完整記錄您的實施過程，包括重要決策點和遇到的挑戰
5. 實時更新任務相關文件，確保上下文記憶持續有效

## 專注限制\n\n為確保系統穩定性和任務準確性，請嚴格遵守：\n\n- 僅修改與任務直接相關的代碼區域，不做範圍外的修改\n- 所有變更必須可直接追溯到任務描述中的明確需求\n- 發現範圍外問題時，僅記錄不修改，保持系統整體一致性\n- 當任務描述與實際需求存在歧義時，優先選擇影響範圍最小的實現方案\n- 不自行擴展需求範圍，即使發現可能的優化機會\n\n如有疑問，請立即向用戶請求澄清，而非做出假設性修改。

## 質量保證\n\n- 確保代碼符合專案編碼標準和架構設計
- 實施適當的錯誤處理和邊緣情況檢查
- 優化性能和資源使用

## 上下文記憶管理\n\n- 在執行過程中，使用 update_task_files 工具更新重要的相關文件
- 關注關鍵代碼片段，記錄代碼行號以便精確定位
- 將重要的發現、決策和實現細節記錄為文件關聯和描述

## 下一步行動\n\n完成實施後，必須使用「verify_task」工具進行全面驗證，確保所有功能和要求均已正確實現。`;

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
      {
        type: "text" as const,
        text: relatedFilesContent,
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

## 完整性驗證標準\n\n請根據以下關鍵標準進行嚴格的質量檢查：

### 1. 需求符合性 (30%)\n- 實現是否完全符合任務描述中的所有功能需求？\n- 是否遵循了所有注意事項和約束條件？\n- 是否處理了所有業務邏輯的邊緣情況？

### 2. 技術實現質量 (30%)\n- 代碼是否遵循了項目的架構模式和設計原則？\n- 是否有適當的錯誤處理和防禦性編程？\n- 實現是否簡潔高效，避免了不必要的複雜性？

### 3. 集成與兼容性 (20%)\n- 實現是否與現有系統無縫集成？\n- 是否考慮了與其他組件的相互作用？\n- 是否保持了向前和向後兼容性（如適用）？

### 4. 性能與可擴展性 (20%)\n- 實現是否考慮了性能優化？\n- 系統是否能夠處理預期的負載和擴展需求？\n- 是否避免了可能的資源洩漏或瓶頸？

## 驗證結果報告\n\n請提供詳細的驗證結果報告，為每個標準分配評分並提供具體證據。對於發現的任何問題，請提供明確的修復建議。

## 決策點\n\n- 如果發現嚴重問題：請繼續改進並解決問題\n- 如果任務已完全符合要求：請使用「complete_task」工具，標記任務為已完成並提交最終報告`;

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
      `任務成功完成：${task.name} (ID: ${
        task.id
      })，摘要：${taskSummary.substring(0, 100)}${
        taskSummary.length > 100 ? "..." : ""
      }`,
      task.id,
      "任務完成"
    );
  } catch (error) {
    console.error("記錄對話日誌時發生錯誤:", error);
  }

  const prompt = `## 任務完成確認\n\n任務 "${task.name}" (ID: \`${
    task.id
  }\`) 已於 ${new Date().toISOString()} 成功標記為完成。\n\n## 任務摘要要求\n\n請提供此次完成任務的摘要總結，包含以下關鍵要點：\n\n1. 任務目標與主要成果\n2. 實施的解決方案要點\n3. 遇到的主要挑戰及解決方法\n\n**重要提示：** 請在當前回應中提供任務摘要總結。完成本次任務摘要後，請等待用戶明確指示後再繼續執行其他任務。請勿自動開始執行下一個任務。\n\n您可以使用「list_tasks」工具查看剩餘任務，但請等待用戶明確指示再繼續。`;

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
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
