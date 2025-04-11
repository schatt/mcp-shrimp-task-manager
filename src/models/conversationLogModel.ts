import { ConversationEntry, ConversationParticipant } from "../types/index.js";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { extractSummary } from "../utils/summaryExtractor.js";

// 確保獲取專案資料夾路徑
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");

// 數據文件路徑
const DATA_DIR = process.env.DATA_DIR || path.join(PROJECT_ROOT, "data");
const CONVERSATION_LOG_FILE = path.join(DATA_DIR, "conversation_log.json");

// 配置參數
const MAX_LOG_ENTRIES = 10000; // 單個日誌文件最大條目數
const MAX_ARCHIVED_LOGS = 5; // 最大歸檔日誌文件數
const LOG_ENTRY_TRIM_THRESHOLD = 8000; // 當日誌超過該條目數時進行精簡

// 確保數據目錄存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  try {
    await fs.access(CONVERSATION_LOG_FILE);
  } catch (error) {
    await fs.writeFile(CONVERSATION_LOG_FILE, JSON.stringify({ entries: [] }));
  }
}

// 讀取所有對話日誌
async function readConversationLog(): Promise<ConversationEntry[]> {
  await ensureDataDir();
  const data = await fs.readFile(CONVERSATION_LOG_FILE, "utf-8");
  const entries = JSON.parse(data).entries;

  // 將日期字串轉換回 Date 物件
  return entries.map((entry: any) => ({
    ...entry,
    timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
  }));
}

// 寫入所有對話日誌
async function writeConversationLog(
  entries: ConversationEntry[]
): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(
    CONVERSATION_LOG_FILE,
    JSON.stringify({ entries }, null, 2)
  );
}

// 獲取所有對話日誌
export async function getAllConversationEntries(): Promise<
  ConversationEntry[]
> {
  return await readConversationLog();
}

// 根據 ID 獲取對話日誌條目
export async function getConversationEntryById(
  entryId: string
): Promise<ConversationEntry | null> {
  const entries = await readConversationLog();
  return entries.find((entry) => entry.id === entryId) || null;
}

// 添加新的對話日誌條目
export async function addConversationEntry(
  participant: ConversationParticipant,
  summary: string,
  relatedTaskId?: string,
  context?: string
): Promise<ConversationEntry> {
  const entries = await readConversationLog();

  // 如果日誌條目超過閾值，進行日誌輪換
  if (entries.length >= MAX_LOG_ENTRIES) {
    await rotateLogFile();
    return addConversationEntry(participant, summary, relatedTaskId, context);
  }

  // 如果日誌條目超過精簡閾值，進行精簡處理
  if (entries.length >= LOG_ENTRY_TRIM_THRESHOLD) {
    await trimLogEntries();
  }

  // 摘要太長時自動縮減
  const processedSummary =
    summary.length > 500 ? extractSummary(summary, 300) : summary;

  const newEntry: ConversationEntry = {
    id: uuidv4(),
    timestamp: new Date(),
    participant,
    summary: processedSummary,
    relatedTaskId,
    context,
  };

  entries.push(newEntry);
  await writeConversationLog(entries);

  return newEntry;
}

// 更新對話日誌條目
export async function updateConversationEntry(
  entryId: string,
  updates: Partial<ConversationEntry>
): Promise<ConversationEntry | null> {
  const entries = await readConversationLog();
  const entryIndex = entries.findIndex((entry) => entry.id === entryId);

  if (entryIndex === -1) {
    return null;
  }

  entries[entryIndex] = {
    ...entries[entryIndex],
    ...updates,
  };

  await writeConversationLog(entries);

  return entries[entryIndex];
}

// 獲取特定任務的對話日誌條目
export async function getConversationEntriesByTaskId(
  taskId: string
): Promise<ConversationEntry[]> {
  const entries = await readConversationLog();
  return entries.filter((entry) => entry.relatedTaskId === taskId);
}

// 刪除對話日誌條目
export async function deleteConversationEntry(
  entryId: string
): Promise<{ success: boolean; message: string }> {
  const entries = await readConversationLog();
  const initialLength = entries.length;

  const filteredEntries = entries.filter((entry) => entry.id !== entryId);

  if (filteredEntries.length === initialLength) {
    return {
      success: false,
      message: `找不到 ID 為 ${entryId} 的對話日誌條目`,
    };
  }

  await writeConversationLog(filteredEntries);
  return { success: true, message: "對話日誌條目已成功刪除" };
}

// 根據時間範圍獲取對話日誌條目
export async function getConversationEntriesByDateRange(
  startDate: Date,
  endDate: Date
): Promise<ConversationEntry[]> {
  const entries = await readConversationLog();

  return entries.filter((entry) => {
    const entryTime = entry.timestamp.getTime();
    return entryTime >= startDate.getTime() && entryTime <= endDate.getTime();
  });
}

// 清除所有對話日誌
export async function clearAllConversationEntries(): Promise<void> {
  await writeConversationLog([]);
}

// 獲取分頁的對話日誌條目
export async function getPaginatedConversationEntries(
  limit: number = 10,
  offset: number = 0,
  taskId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ entries: ConversationEntry[]; total: number }> {
  let entries = await readConversationLog();

  // 根據任務 ID 過濾
  if (taskId) {
    entries = entries.filter((entry) => entry.relatedTaskId === taskId);
  }

  // 根據日期範圍過濾
  if (startDate && endDate) {
    entries = entries.filter((entry) => {
      const entryTime = entry.timestamp.getTime();
      return entryTime >= startDate.getTime() && entryTime <= endDate.getTime();
    });
  } else if (startDate) {
    entries = entries.filter(
      (entry) => entry.timestamp.getTime() >= startDate.getTime()
    );
  } else if (endDate) {
    entries = entries.filter(
      (entry) => entry.timestamp.getTime() <= endDate.getTime()
    );
  }

  // 按時間排序（降序，最新的在前）
  entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const total = entries.length;
  const paginatedEntries = entries.slice(offset, offset + limit);

  return { entries: paginatedEntries, total };
}

/**
 * 日誌文件輪換功能 - 將當前日誌歸檔並創建新的空日誌
 */
async function rotateLogFile(): Promise<void> {
  console.log("執行日誌輪換操作...");

  try {
    // 確保目錄存在
    await ensureDataDir();

    // 檢查當前日誌文件是否存在
    try {
      await fs.access(CONVERSATION_LOG_FILE);
    } catch (error) {
      // 如果不存在，創建空文件並返回
      await fs.writeFile(
        CONVERSATION_LOG_FILE,
        JSON.stringify({ entries: [] })
      );
      return;
    }

    // 生成歸檔文件名 (conversation_log_時間戳.json)
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "");
    const archiveFileName = `conversation_log_${timestamp}.json`;
    const archiveFilePath = path.join(DATA_DIR, archiveFileName);

    // 將當前日誌複製到歸檔文件
    await fs.copyFile(CONVERSATION_LOG_FILE, archiveFilePath);

    // 創建新的空日誌文件
    await fs.writeFile(CONVERSATION_LOG_FILE, JSON.stringify({ entries: [] }));

    // 清理過多的歸檔文件
    await cleanupArchivedLogs();

    console.log(`日誌輪換完成，歸檔文件: ${archiveFileName}`);
  } catch (error) {
    console.error("日誌輪換過程中發生錯誤:", error);
    // 即使輪換失敗，也要確保主日誌文件存在
    try {
      await fs.writeFile(
        CONVERSATION_LOG_FILE,
        JSON.stringify({ entries: [] })
      );
    } catch (innerError) {
      console.error("創建新日誌文件失敗:", innerError);
    }
  }
}

/**
 * 清理過舊的歸檔日誌文件
 */
async function cleanupArchivedLogs(): Promise<void> {
  try {
    // 讀取數據目錄中的所有文件
    const files = await fs.readdir(DATA_DIR);

    // 過濾出歸檔日誌文件
    const archivedLogs = files
      .filter(
        (file) => file.startsWith("conversation_log_") && file.endsWith(".json")
      )
      .map((file) => ({
        name: file,
        path: path.join(DATA_DIR, file),
        // 從文件名中提取時間戳
        timestamp: file.replace("conversation_log_", "").replace(".json", ""),
      }))
      // 按時間戳降序排序（最新的在前）
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // 如果歸檔日誌文件數量超過最大保留數量，刪除最舊的
    if (archivedLogs.length > MAX_ARCHIVED_LOGS) {
      const logsToDelete = archivedLogs.slice(MAX_ARCHIVED_LOGS);
      for (const log of logsToDelete) {
        try {
          await fs.unlink(log.path);
          console.log(`已刪除過舊的日誌歸檔: ${log.name}`);
        } catch (error) {
          console.error(`刪除日誌歸檔 ${log.name} 失敗:`, error);
        }
      }
    }
  } catch (error) {
    console.error("清理歸檔日誌時發生錯誤:", error);
  }
}

/**
 * 對日誌條目進行精簡，移除不重要的舊條目
 */
async function trimLogEntries(): Promise<void> {
  try {
    const entries = await readConversationLog();

    // 如果條目數量未達到精簡閾值，不進行處理
    if (entries.length < LOG_ENTRY_TRIM_THRESHOLD) {
      return;
    }

    console.log(
      `日誌條目數量(${entries.length})超過精簡閾值(${LOG_ENTRY_TRIM_THRESHOLD})，進行精簡處理...`
    );

    // 策略：保留最新的75%條目，優先移除一般日誌，保留錯誤和重要操作
    const entriesToKeep = Math.floor(entries.length * 0.75);

    // 先按重要性對條目進行分類
    const errorEntries = entries.filter(
      (entry) =>
        entry.context?.includes("錯誤") ||
        entry.context?.includes("失敗") ||
        entry.summary.includes("錯誤") ||
        entry.summary.includes("失敗")
    );

    const taskEntries = entries.filter(
      (entry) =>
        entry.relatedTaskId && !errorEntries.some((e) => e.id === entry.id)
    );

    const generalEntries = entries.filter(
      (entry) =>
        !errorEntries.some((e) => e.id === entry.id) &&
        !taskEntries.some((e) => e.id === entry.id)
    );

    // 確定每類保留多少條目
    const totalToRemove = entries.length - entriesToKeep;

    // 優先從一般日誌中移除
    let trimmedGeneralEntries = generalEntries;
    if (generalEntries.length > totalToRemove) {
      // 按時間排序，移除最舊的
      trimmedGeneralEntries = generalEntries
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, generalEntries.length - totalToRemove);
    } else {
      // 如果一般日誌不夠，需要從任務日誌中移除
      trimmedGeneralEntries = [];
      const remainingToRemove = totalToRemove - generalEntries.length;

      if (remainingToRemove > 0 && taskEntries.length > remainingToRemove) {
        const trimmedTaskEntries = taskEntries
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, taskEntries.length - remainingToRemove);

        // 合併保留的條目
        const newEntries = [
          ...errorEntries,
          ...trimmedTaskEntries,
          ...trimmedGeneralEntries,
        ];
        await writeConversationLog(newEntries);

        console.log(
          `日誌精簡完成: 從 ${entries.length} 條減少到 ${newEntries.length} 條`
        );
        return;
      }
    }

    // 合併保留的條目
    const newEntries = [
      ...errorEntries,
      ...taskEntries,
      ...trimmedGeneralEntries,
    ];
    await writeConversationLog(newEntries);

    console.log(
      `日誌精簡完成: 從 ${entries.length} 條減少到 ${newEntries.length} 條`
    );
  } catch (error) {
    console.error("精簡日誌條目時發生錯誤:", error);
  }
}

/**
 * 獲取所有歸檔日誌文件列表
 */
export async function getArchivedLogFiles(): Promise<string[]> {
  try {
    // 確保目錄存在
    await ensureDataDir();

    const files = await fs.readdir(DATA_DIR);

    // 過濾出歸檔日誌文件
    return files
      .filter(
        (file) => file.startsWith("conversation_log_") && file.endsWith(".json")
      )
      .sort()
      .reverse(); // 最新的在前
  } catch (error) {
    console.error("獲取歸檔日誌文件列表時發生錯誤:", error);
    return [];
  }
}

/**
 * 讀取特定歸檔日誌文件
 */
export async function readArchivedLog(
  archiveFileName: string
): Promise<ConversationEntry[]> {
  // 安全性檢查：確保文件名格式正確
  if (!archiveFileName.match(/^conversation_log_[\d-]+T[\d-]+\.json$/)) {
    throw new Error("無效的歸檔日誌文件名");
  }

  const archiveFilePath = path.join(DATA_DIR, archiveFileName);

  try {
    await fs.access(archiveFilePath);
    const data = await fs.readFile(archiveFilePath, "utf-8");
    const entries = JSON.parse(data).entries;

    // 將日期字串轉換回 Date 物件
    return entries.map((entry: any) => ({
      ...entry,
      timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
    }));
  } catch (error) {
    console.error(`讀取歸檔日誌 ${archiveFileName} 時發生錯誤:`, error);
    return [];
  }
}
