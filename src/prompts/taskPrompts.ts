import { z } from "zod";
import { Task } from "../types/index.js";
import { getTaskById, getAllTasks } from "../models/taskModel.js";

// 開始規劃提示
export const planTaskPromptSchema = z.object({
  description: z
    .string()
    .describe("完整詳細的任務問題描述，應包含任務目標、背景及預期成果"),
  requirements: z
    .string()
    .optional()
    .describe("任務的特定技術要求、業務約束條件或品質標準（選填）"),
});

export function planTaskPrompt({
  description,
  requirements,
}: z.infer<typeof planTaskPromptSchema>) {
  let prompt = `## 任務分析請求\n\n請仔細分析以下任務問題，理解其核心要求、範圍和約束條件：\n\n\`\`\`\n${description}\n\`\`\`\n\n`;

  if (requirements) {
    prompt += `## 附加要求與限制條件\n\n請確保方案完全符合以下要求：\n\n\`\`\`\n${requirements}\n\`\`\`\n\n`;
  }

  prompt += `## 分析指引\n\n請執行以下步驟進行全面分析：\n\n1. 定義問題域和範圍界限\n2. 識別關鍵技術挑戰和決策點\n3. 評估可行的技術方案和架構選擇\n4. 考慮潛在的系統限制和擴展需求\n5. 識別成功標準和驗收條件\n\n如有任何疑問或需要澄清的部分，請立即向用戶提出具體問題。\n\n## 交付成果要求\n\n完成分析後，請提供：\n\n1. **結構化任務摘要** - 準確概括任務的目標、範圍及關鍵挑戰\n2. **初步解答構想** - 提出技術可行的解決方案，包括實施策略和關鍵技術選擇\n\n完成分析後，必須使用「分析問題」工具提交完整的分析結果。`;

  return {
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: prompt,
        },
      },
    ],
  };
}

// 執行任務提示
export const executeTaskPromptSchema = z.object({
  taskId: z
    .string()
    .describe("待執行任務的唯一標識符，必須是系統中存在的有效任務ID"),
});

export async function executeTaskPrompt({
  taskId,
}: z.infer<typeof executeTaskPromptSchema>) {
  const task = await getTaskById(taskId);

  if (!task) {
    throw new Error(`找不到 ID 為 ${taskId} 的任務`);
  }

  // 獲取依賴任務的名稱，以便更直觀地顯示
  let dependenciesText = "";
  if (task.dependencies && task.dependencies.length > 0) {
    const allTasks = await getAllTasks();
    const depTasksInfo = task.dependencies.map((dep) => {
      const depTask = allTasks.find((t) => t.id === dep.taskId);
      return depTask
        ? `"${depTask.name}" (ID: \`${dep.taskId}\`)`
        : `ID: \`${dep.taskId}\``;
    });
    dependenciesText = `\n\n### 依賴任務\n前置任務：${depTasksInfo.join(", ")}`;
  }

  const prompt = `## 任務執行指示\n\n### 任務詳情\n\n- **名稱:** ${
    task.name
  }\n- **ID:** \`${task.id}\`\n- **描述:** ${task.description}\n${
    task.notes ? `- **注意事項:** ${task.notes}\n` : ""
  }${dependenciesText}

## 專注限制\n\n請嚴格遵守以下操作範圍限制：\n\n- 僅執行本任務描述中明確定義的操作，不進行任何額外修改\n- 所有變更必須直接關聯任務目標，非必要不修改其他部分\n- 如發現潛在問題但不在任務範圍內，請僅做記錄不做修改\n- 確保變更對系統其他部分的影響降至最低，保持代碼一致性

## 執行框架\n\n請嚴格按照以下階段性流程執行任務：\n\n### 1. 需求分析 (20%)\n- 詳細分析任務描述和注意事項\n- 明確定義成功標準和驗收條件\n- 識別潛在的邊緣情況和例外狀況\n\n### 2. 技術規劃 (20%)\n- 設計詳細的技術實施方案\n- 確定所需的技術組件和依賴項\n- 制定清晰的步驟順序和里程碑\n\n### 3. 系統化實施 (40%)\n- 按照規劃順序逐步實施解決方案\n- 嚴格遵循最佳編碼實踐和架構模式\n- 確保代碼可讀性、可維護性和效能\n\n### 4. 自我驗證 (20%)\n- 對照任務需求檢查實現的完整性\n- 測試不同輸入和情境下的功能正確性\n- 優化性能並消除任何潛在風險\n\n## 注意事項\n- 如發現技術障礙或需求不明確，請立即提出具體問題\n- 在實施過程中記錄關鍵決策點和技術選擇理由\n- 考慮解決方案與現有系統的整合性和兼容性\n\n## 下一步行動\n\n完成實施後，必須使用「檢驗任務」工具進行全面驗證，確保所有功能和要求均已正確實現。`;

  return {
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: prompt,
        },
      },
    ],
  };
}

// 檢驗任務提示
export const verifyTaskPromptSchema = z.object({
  taskId: z
    .string()
    .describe("待驗證任務的唯一標識符，必須是狀態為「進行中」的有效任務ID"),
});

export async function verifyTaskPrompt({
  taskId,
}: z.infer<typeof verifyTaskPromptSchema>) {
  const task = await getTaskById(taskId);

  if (!task) {
    throw new Error(`找不到 ID 為 ${taskId} 的任務`);
  }

  const prompt = `## 任務驗證評估\n\n### 任務資料\n\n- **名稱:** ${
    task.name
  }\n- **ID:** \`${task.id}\`\n- **描述:** ${task.description}\n${
    task.notes ? `- **注意事項:** ${task.notes}\n` : ""
  }

## 完整性驗證標準\n\n請對實現結果進行全面且嚴格的評估，基於以下關鍵標準：

### 1. 需求符合性 (30%)\n- 實現是否完全符合任務描述中的所有功能需求？\n- 是否遵循了所有注意事項和約束條件？\n- 是否處理了所有業務邏輯的邊緣情況？

### 2. 技術實現質量 (30%)\n- 代碼是否遵循了項目的架構模式和設計原則？\n- 是否有適當的錯誤處理和防禦性編程？\n- 實現是否簡潔高效，避免了不必要的複雜性？

### 3. 集成與兼容性 (20%)\n- 實現是否與現有系統無縫集成？\n- 是否考慮了與其他組件的相互作用？\n- 是否保持了向前和向後兼容性（如適用）？

### 4. 性能與可擴展性 (20%)\n- 實現是否考慮了性能優化？\n- 系統是否能夠處理預期的負載和擴展需求？\n- 是否避免了可能的資源洩漏或瓶頸？

## 驗證流程\n\n請執行以下驗證步驟：\n\n1. 從用戶視角測試功能的完整性和正確性\n2. 評估代碼質量和技術實現的優雅程度\n3. 檢查是否有潛在的安全風險或性能問題\n4. 對照原始需求，確保所有功能點均已實現\n\n## 驗證結果報告\n\n請提供詳細的評估報告，為每個標準分配評分並提供具體證據。對於發現的任何問題，請提供明確的修復建議。\n\n## 決策點\n\n- 如發現嚴重問題：請繼續完善實現，解決所有識別出的問題\n- 如確認任務已完全符合要求：請使用「完成任務」工具，標記任務為已完成並提交最終報告`;

  return {
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: prompt,
        },
      },
    ],
  };
}
