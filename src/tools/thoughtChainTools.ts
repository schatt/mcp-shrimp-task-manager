import { z } from "zod";
import { ThoughtData, ThoughtStage } from "../types/index.js";

/**
 * 格式化思維內容，返回美觀的格式化輸出
 * @param thoughtData 思維資料
 * @returns 格式化後的思維輸出
 */
function formatThought(thoughtData: ThoughtData): string {
  // 創建基本思維標題，包含編號、總數和階段
  const thoughtHeader = `## 思維 ${thoughtData.thoughtNumber}/${thoughtData.totalThoughts} - ${thoughtData.stage}`;

  // 格式化思維正文
  const thoughtContent = thoughtData.thought;

  // 準備可選元素的陣列
  const optionalElements: string[] = [];

  // 如果有標籤，則添加到可選元素
  if (thoughtData.tags && thoughtData.tags.length > 0) {
    optionalElements.push(`**標籤:** ${thoughtData.tags.join(", ")}`);
  }

  // 如果有使用的公理，則添加到可選元素
  if (thoughtData.axioms_used && thoughtData.axioms_used.length > 0) {
    optionalElements.push(
      `**使用的原則:** ${thoughtData.axioms_used.join(", ")}`
    );
  }

  // 如果有挑戰的假設，則添加到可選元素
  if (
    thoughtData.assumptions_challenged &&
    thoughtData.assumptions_challenged.length > 0
  ) {
    optionalElements.push(
      `**挑戰的假設:** ${thoughtData.assumptions_challenged.join(", ")}`
    );
  }

  // 添加下一步指示
  const nextStepIndication = thoughtData.nextThoughtNeeded
    ? "需要更多思考，繼續使用 「process_thought」 工具思考找尋答案"
    : "思考完成。下一步使用「analyze_task」 提交分析結果\n1. **任務摘要** - 目標、範圍、挑戰和限制條件\n2. **初步解答構想** - 可行的技術方案和實施計劃";

  // 組合所有元素
  return [
    thoughtHeader,
    thoughtContent,
    ...optionalElements,
    `\n*${nextStepIndication}*`,
  ].join("\n\n");
}

/**
 * processThought工具的參數結構
 */
export const processThoughtSchema = z.object({
  thought: z
    .string()
    .min(1, {
      message: "思維內容不能為空，請提供有效的思考內容",
    })
    .describe("思維內容"),
  thought_number: z
    .number()
    .int()
    .positive({
      message: "思維編號必須是正整數",
    })
    .describe("當前思維編號"),
  total_thoughts: z
    .number()
    .int()
    .positive({
      message: "總思維數必須是正整數",
    })
    .describe("預計總思維數量，如果需要更多的思考可以隨時變更"),
  next_thought_needed: z.boolean().describe("是否需要下一步思維"),
  stage: z
    .string()
    .min(1, {
      message: "思維階段不能為空，請提供有效的思考階段",
    })
    .describe(
      "思考階段，可以選擇的階段有：問題定義、收集資訊、研究、分析、綜合、結論、質疑、規劃"
    ),
  tags: z.array(z.string()).optional().describe("思維標籤，是一個陣列字串"),
  axioms_used: z
    .array(z.string())
    .optional()
    .describe("使用的公理，是一個陣列字串"),
  assumptions_challenged: z
    .array(z.string())
    .optional()
    .describe("挑戰的假設，是一個陣列字串"),
});

/**
 * 處理單一思維並返回格式化輸出
 */
export async function processThought(
  params: z.infer<typeof processThoughtSchema>
) {
  try {
    // 將參數轉換為規範的ThoughtData格式
    const thoughtData: ThoughtData = {
      thought: params.thought,
      thoughtNumber: params.thought_number,
      totalThoughts: params.total_thoughts,
      nextThoughtNeeded: params.next_thought_needed,
      stage: params.stage,
      tags: params.tags,
      axioms_used: params.axioms_used,
      assumptions_challenged: params.assumptions_challenged,
    };

    // 確保思維編號不超過總思維數
    if (thoughtData.thoughtNumber > thoughtData.totalThoughts) {
      // 自動調整總思維數量
      thoughtData.totalThoughts = thoughtData.thoughtNumber;
    }

    // 格式化思維輸出
    const formattedThought = formatThought(thoughtData);

    // 返回成功響應
    return {
      content: [
        {
          type: "text" as const,
          text: formattedThought,
        },
      ],
    };
  } catch (error) {
    // 捕獲並處理所有未預期的錯誤
    const errorMessage = error instanceof Error ? error.message : "未知錯誤";
    return {
      content: [
        {
          type: "text" as const,
          text: `處理思維時發生錯誤: ${errorMessage}`,
        },
      ],
    };
  }
}
