import { z } from "zod";
import {
  getAllConversationEntries,
  getConversationEntriesByTaskId,
  getPaginatedConversationEntries,
  clearAllConversationEntries,
  getArchivedLogFiles,
  readArchivedLog,
} from "../models/conversationLogModel.js";
import { getTaskById } from "../models/taskModel.js";
import { ListConversationLogArgs } from "../types/index.js";

// 列出對話日誌工具
export const listConversationLogSchema = z
  .object({
    taskId: z
      .string()
      .uuid({ message: "任務ID格式無效，請提供有效的UUID格式" })
      .optional()
      .describe("按任務 ID 過濾對話記錄（選填）"),
    startDate: z
      .string()
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        {
          message:
            "起始日期格式無效，請使用ISO日期格式，例如：2025-04-11T12:13:49.751Z",
        }
      )
      .optional()
      .describe("起始日期過濾，格式為 ISO 日期字串（選填）"),
    endDate: z
      .string()
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        {
          message:
            "結束日期格式無效，請使用ISO日期格式，例如：2025-04-11T12:13:49.751Z",
        }
      )
      .optional()
      .describe("結束日期過濾，格式為 ISO 日期字串（選填）"),
    limit: z
      .number()
      .int({ message: "限制必須是整數" })
      .positive({ message: "限制必須是正數" })
      .max(100, { message: "限制不能超過100條記錄" })
      .default(20)
      .describe("返回結果數量限制，最大 100（預設：20）"),
    offset: z
      .number()
      .int({ message: "偏移量必須是整數" })
      .nonnegative({ message: "偏移量不能為負數" })
      .default(0)
      .describe("分頁偏移量（預設：0）"),
  })
  .refine(
    (data) => {
      // 驗證起始日期和結束日期的順序
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return start <= end;
      }
      return true;
    },
    {
      message: "起始日期必須早於或等於結束日期",
      path: ["endDate"],
    }
  );

export async function listConversationLog({
  taskId,
  startDate,
  endDate,
  limit,
  offset,
}: z.infer<typeof listConversationLogSchema>) {
  // 將日期字串轉換為 Date 物件
  const startDateObj = startDate ? new Date(startDate) : undefined;
  const endDateObj = endDate ? new Date(endDate) : undefined;

  // 驗證日期格式
  if (startDate && isNaN(startDateObj?.getTime() ?? NaN)) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 參數錯誤\n\n起始日期格式無效。請使用 ISO 日期字串格式（例如：2023-01-01T00:00:00Z）。`,
        },
      ],
      isError: true,
    };
  }

  if (endDate && isNaN(endDateObj?.getTime() ?? NaN)) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 參數錯誤\n\n結束日期格式無效。請使用 ISO 日期字串格式（例如：2023-01-01T00:00:00Z）。`,
        },
      ],
      isError: true,
    };
  }

  // 如果指定了任務 ID，檢查任務是否存在
  let taskInfo = "";
  if (taskId) {
    const task = await getTaskById(taskId);
    if (!task) {
      return {
        content: [
          {
            type: "text" as const,
            text: `## 參數錯誤\n\n找不到 ID 為 \`${taskId}\` 的任務。請使用「list_tasks」工具確認有效的任務 ID 後再試。`,
          },
        ],
        isError: true,
      };
    }
    taskInfo = `任務：${task.name} (ID: \`${task.id}\`)`;
  }

  // 獲取分頁的對話日誌
  const { entries, total } = await getPaginatedConversationEntries(
    limit,
    offset,
    taskId,
    startDateObj,
    endDateObj
  );

  if (entries.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 查詢結果\n\n未找到符合條件的對話日誌記錄。${
            taskId ? `\n\n${taskInfo}` : ""
          }`,
        },
      ],
    };
  }

  // 構建過濾條件描述
  const filterDescs = [];
  if (taskInfo) filterDescs.push(taskInfo);
  if (startDateObj) filterDescs.push(`開始日期：${startDateObj.toISOString()}`);
  if (endDateObj) filterDescs.push(`結束日期：${endDateObj.toISOString()}`);
  const filterDesc =
    filterDescs.length > 0 ? `\n\n過濾條件：${filterDescs.join("，")}` : "";

  // 構建分頁信息
  const pageInfo = `\n\n當前顯示：第 ${offset + 1} 到 ${Math.min(
    offset + limit,
    total
  )} 條，共 ${total} 條記錄`;

  // 構建分頁導航提示
  let navTips = "";
  if (total > limit) {
    const prevPageAvailable = offset > 0;
    const nextPageAvailable = offset + limit < total;

    navTips = "\n\n分頁導航：";
    if (prevPageAvailable) {
      const prevOffset = Math.max(0, offset - limit);
      navTips += `\n- 上一頁：使用 offset=${prevOffset}`;
    }
    if (nextPageAvailable) {
      const nextOffset = offset + limit;
      navTips += `\n- 下一頁：使用 offset=${nextOffset}`;
    }
  }

  // 格式化對話日誌列表
  const formattedEntries = entries
    .map((entry, index) => {
      const entryNumber = offset + index + 1;
      return `### ${entryNumber}. ${entry.participant} (${new Date(
        entry.timestamp
      ).toISOString()})\n${
        entry.relatedTaskId ? `關聯任務：\`${entry.relatedTaskId}\`\n` : ""
      }${entry.context ? `上下文：${entry.context}\n` : ""}摘要：${
        entry.summary
      }`;
    })
    .join("\n\n");

  const result = `## 對話日誌查詢結果${filterDesc}${pageInfo}\n\n${formattedEntries}${navTips}`;

  return {
    content: [
      {
        type: "text" as const,
        text: result,
      },
    ],
  };
}

// 清除所有對話日誌工具
export const clearConversationLogSchema = z.object({
  confirm: z
    .boolean()
    .refine((val) => val === true, {
      message:
        "必須明確確認清除操作，請將 confirm 參數設置為 true 以確認此危險操作",
    })
    .describe("確認刪除所有日誌記錄（此操作不可逆）"),
});

export async function clearConversationLog({
  confirm,
}: z.infer<typeof clearConversationLogSchema>) {
  if (!confirm) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 操作取消\n\n未確認清除操作。如要清除所有對話日誌，請將 confirm 參數設為 true。`,
        },
      ],
    };
  }

  // 執行清除操作
  await clearAllConversationEntries();

  return {
    content: [
      {
        type: "text" as const,
        text: `## 操作成功\n\n所有對話日誌已成功清除。`,
      },
    ],
  };
}

// 列出歸檔日誌工具
export const listArchivedLogsSchema = z.object({
  includeDetails: z
    .boolean()
    .default(false)
    .describe("是否包含歸檔文件的詳細信息（預設：否）"),
});

export async function listArchivedLogs({
  includeDetails = false,
}: z.infer<typeof listArchivedLogsSchema>) {
  const archiveFiles = await getArchivedLogFiles();

  let content = "";

  if (archiveFiles.length === 0) {
    content = "## 日誌歸檔\n\n目前沒有任何日誌歸檔文件。";
  } else {
    content = "## 日誌歸檔文件\n\n";

    if (includeDetails) {
      // 為每個歸檔文件獲取更多詳細信息
      const detailedFiles = await Promise.all(
        archiveFiles.map(async (file) => {
          try {
            const entries = await readArchivedLog(file);
            const timestamp = file
              .replace("conversation_log_", "")
              .replace(".json", "");
            const formattedDate = new Date(
              timestamp.replace(/-/g, ":").replace("T", " ")
            ).toLocaleString();

            return {
              filename: file,
              date: formattedDate,
              entriesCount: entries.length,
              firstEntry: entries.length > 0 ? entries[0] : null,
              lastEntry:
                entries.length > 0 ? entries[entries.length - 1] : null,
            };
          } catch (error) {
            return {
              filename: file,
              date: "未知",
              entriesCount: 0,
              error: (error as Error).message,
            };
          }
        })
      );

      // 格式化輸出
      content += detailedFiles
        .map((file, index) => {
          let fileInfo = `${index + 1}. **${file.filename}**\n`;
          fileInfo += `   - 創建日期: ${file.date}\n`;
          fileInfo += `   - 條目數量: ${file.entriesCount}\n`;

          if (file.firstEntry) {
            const firstDate = new Date(
              file.firstEntry.timestamp
            ).toLocaleString();
            fileInfo += `   - 最早條目: ${firstDate}\n`;
          }

          if (file.lastEntry) {
            const lastDate = new Date(
              file.lastEntry.timestamp
            ).toLocaleString();
            fileInfo += `   - 最晚條目: ${lastDate}\n`;
          }

          if (file.error) {
            fileInfo += `   - 錯誤: ${file.error}\n`;
          }

          return fileInfo;
        })
        .join("\n");
    } else {
      // 簡單列出歸檔文件名
      content += archiveFiles
        .map((file, index) => {
          // 從文件名提取日期
          const timestamp = file
            .replace("conversation_log_", "")
            .replace(".json", "");
          const formattedDate = new Date(
            timestamp.replace(/-/g, ":").replace("T", " ")
          ).toLocaleString();
          return `${index + 1}. **${file}** (${formattedDate})`;
        })
        .join("\n");
    }

    content += "\n\n使用讀取歸檔日誌工具可查看特定歸檔文件的內容。";
  }

  return {
    content: [
      {
        type: "text" as const,
        text: content,
      },
    ],
  };
}

// 讀取特定歸檔日誌工具
export const readArchivedLogSchema = z.object({
  filename: z
    .string()
    .min(1, { message: "文件名不能為空" })
    .refine((val) => val.match(/^conversation_log_[\d-]+T[\d-]+\.json$/), {
      message:
        "無效的歸檔日誌文件名，正確格式為 'conversation_log_[timestamp].json'",
    })
    .describe("歸檔日誌文件名，格式為 'conversation_log_[timestamp].json'"),
  limit: z
    .number()
    .int({ message: "限制必須是整數" })
    .positive({ message: "限制必須是正數" })
    .max(100, { message: "限制不能超過100條記錄" })
    .default(50)
    .describe("返回結果數量限制，最大 100（預設：50）"),
  offset: z
    .number()
    .int({ message: "偏移量必須是整數" })
    .nonnegative({ message: "偏移量不能為負數" })
    .default(0)
    .describe("分頁起始位置（預設：0）"),
});

export async function readArchivedLogTool({
  filename,
  limit = 50,
  offset = 0,
}: z.infer<typeof readArchivedLogSchema>) {
  try {
    // 安全性檢查：確保文件名格式正確
    if (!filename.match(/^conversation_log_[\d-]+T[\d-]+\.json$/)) {
      return {
        content: [
          {
            type: "text" as const,
            text: "## 錯誤\n\n無效的歸檔日誌文件名。正確格式為 'conversation_log_[timestamp].json'。",
          },
        ],
        isError: true,
      };
    }

    const entries = await readArchivedLog(filename);

    // 分頁處理
    const paginatedEntries = entries.slice(offset, offset + limit);
    const total = entries.length;

    let content = `## 歸檔日誌: ${filename}\n\n`;

    if (paginatedEntries.length === 0) {
      content += "此歸檔文件沒有任何日誌條目。";
    } else {
      // 添加分頁信息
      content += `顯示 ${Math.min(total, offset + 1)}-${Math.min(
        total,
        offset + limit
      )} 條，共 ${total} 條\n\n`;

      // 格式化日誌條目
      content += paginatedEntries
        .map((entry, index) => {
          const date = new Date(entry.timestamp).toLocaleString();
          let entryContent = `### ${offset + index + 1}. ${date} (${
            entry.participant
          })\n`;

          if (entry.context) {
            entryContent += `**上下文:** ${entry.context}\n`;
          }

          if (entry.relatedTaskId) {
            entryContent += `**相關任務:** ${entry.relatedTaskId}\n`;
          }

          entryContent += `\n${entry.summary}\n`;

          return entryContent;
        })
        .join("\n\n");

      // 添加導航鏈接
      if (offset > 0 || offset + limit < total) {
        content += "\n\n### 分頁導航\n";

        if (offset > 0) {
          const prevOffset = Math.max(0, offset - limit);
          content += `- 上一頁 (${prevOffset + 1}-${Math.min(
            total,
            prevOffset + limit
          )})\n`;
        }

        if (offset + limit < total) {
          const nextOffset = offset + limit;
          content += `- 下一頁 (${nextOffset + 1}-${Math.min(
            total,
            nextOffset + limit
          )})\n`;
        }
      }
    }

    return {
      content: [
        {
          type: "text" as const,
          text: content,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 錯誤\n\n讀取歸檔日誌時發生錯誤: ${
            (error as Error).message
          }`,
        },
      ],
      isError: true,
    };
  }
}
