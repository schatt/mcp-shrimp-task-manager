import { z } from "zod";
import {
  getAllTasks,
  getTaskById,
  updateTaskStatus,
  canExecuteTask,
  batchCreateOrUpdateTasks,
  deleteTask as modelDeleteTask,
} from "../models/taskModel.js";
import { TaskStatus } from "../types/index.js";

// 開始規劃工具
export const planTaskSchema = z.object({
  description: z
    .string()
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
    .describe("結構化的任務摘要，包含任務目標、範圍與關鍵技術挑戰"),
  initialConcept: z
    .string()
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
export const reflectTaskSchema = z.object({
  summary: z
    .string()
    .describe("結構化的任務摘要，保持與分析階段一致以確保連續性"),
  analysis: z
    .string()
    .describe("完整詳盡的技術分析結果，包括所有技術細節、依賴組件和實施方案"),
});

export async function reflectTask({
  summary,
  analysis,
}: z.infer<typeof reflectTaskSchema>) {
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
export const splitTasksSchema = z.object({
  isOverwrite: z
    .boolean()
    .describe(
      "任務覆蓋模式選擇（true：清除並覆蓋所有現有任務；false：保留現有任務並新增）"
    ),
  tasks: z
    .array(
      z.object({
        name: z.string().describe("簡潔明確的任務名稱，應能清晰表達任務目的"),
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
});

export async function splitTasks({
  isOverwrite,
  tasks,
}: z.infer<typeof splitTasksSchema>) {
  // 批量創建任務
  const createdTasks = await batchCreateOrUpdateTasks(tasks, isOverwrite);

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
        result += `### ${index + 1}. ${task.name}\n`;
        result += `- **ID:** \`${task.id}\`\n`;
        result += `- **描述:** ${task.description}\n`;
        if (task.notes) {
          result += `- **注意事項:** ${task.notes}\n`;
        }
        if (task.dependencies.length > 0) {
          result += `- **依賴任務:** ${task.dependencies
            .map((d) => `\`${d.taskId}\``)
            .join(", ")}\n`;
        }

        // 添加時間相關訊息
        result += `- **創建時間:** ${task.createdAt.toISOString()}\n`;
        if (task.status === TaskStatus.COMPLETED && task.completedAt) {
          result += `- **完成時間:** ${task.completedAt.toISOString()}\n`;
        }

        result += "\n";
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

  // 更新任務狀態為進行中
  await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);

  const prompt = `## 任務執行指示\n\n### 任務詳情\n\n- **名稱:** ${
    task.name
  }\n- **ID:** \`${task.id}\`\n- **描述:** ${task.description}\n${
    task.notes ? `- **注意事項:** ${task.notes}\n` : ""
  }

## 執行指引\n\n1. 請仔細分析任務要求，確保理解所有細節和約束條件
2. 設計詳細的執行方案，包括具體步驟和技術選擇
3. 系統性地實施您的方案，遵循最佳實踐和項目慣例
4. 完整記錄您的實施過程，包括重要決策點和遇到的挑戰

## 質量保證\n\n- 確保代碼符合專案編碼標準和架構設計
- 實施適當的錯誤處理和邊緣情況檢查
- 優化性能和資源使用

## 下一步行動\n\n完成實施後，必須使用「verify_task」工具進行全面驗證，確保所有功能和要求均已正確實現。`;

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
    .describe(
      "待標記為完成的任務唯一標識符，必須是狀態為「進行中」的有效任務ID"
    ),
});

export async function completeTask({
  taskId,
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

  // 更新任務狀態為已完成
  await updateTaskStatus(taskId, TaskStatus.COMPLETED);

  const prompt = `## 任務完成確認\n\n任務 "${task.name}" (ID: \`${
    task.id
  }\`) 已於 ${new Date().toISOString()} 成功標記為完成。\n\n## 任務報告要求\n\n請提供全面且結構化的任務完成報告，必須包含以下章節：\n\n### 1. 任務概述 (20%)\n- 簡要說明任務目標及其在整體系統中的角色\n- 概述任務的範圍和界限\n- 說明任務的重要性和價值\n\n### 2. 實施摘要 (30%)\n- 詳述採用的技術方案和架構決策\n- 說明關鍵算法和數據結構的選擇\n- 列出使用的外部依賴和API\n\n### 3. 挑戰與解決方案 (20%)\n- 描述在實施過程中遇到的主要技術挑戰\n- 解釋每個挑戰的解決方案及其理由\n- 討論探索過但未採用的替代方案\n\n### 4. 質量保證措施 (15%)\n- 總結執行的測試類型和範圍\n- 報告性能測量結果（如適用）\n- 描述實施的安全措施（如適用）\n\n### 5. 後續步驟與建議 (15%)\n- 提出可能的進一步改進或優化\n- 識別潛在的風險或技術債務\n- 建議下一步行動和優先事項`;

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
          text: `## 操作被拒絕\n\n任務 "${task.name}" (ID: \`${task.id}\`) 已完成，不允許刪除已完成的任務。\n\n如需清理任務，請聯絡系統管理員。`,
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
