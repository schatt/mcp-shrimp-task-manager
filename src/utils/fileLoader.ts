import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { RelatedFile, RelatedFileType } from "../types/index.js";
import { extractSummary } from "./summaryExtractor.js";

// 確保獲取專案資料夾路徑
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");

/**
 * 讀取文件內容
 * @param filePath 文件路徑
 * @returns 文件內容
 */
export async function readFileContent(
  filePath: string
): Promise<string | null> {
  try {
    // 如果是相對路徑，轉換為絕對路徑
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(PROJECT_ROOT, filePath);

    // 檢查文件是否存在
    try {
      await fs.access(absolutePath);
    } catch (error) {
      console.error(`文件 ${absolutePath} 不存在或無法訪問`);
      return null;
    }

    // 讀取文件內容
    const content = await fs.readFile(absolutePath, "utf-8");
    return content;
  } catch (error) {
    console.error(`讀取文件 ${filePath} 時發生錯誤:`, error);
    return null;
  }
}

/**
 * 讀取文件指定行範圍的內容
 * @param filePath 文件路徑
 * @param startLine 起始行（1-based）
 * @param endLine 結束行（1-based）
 * @returns 指定行範圍的內容
 */
export async function readFileLines(
  filePath: string,
  startLine: number = 1,
  endLine?: number
): Promise<string | null> {
  const content = await readFileContent(filePath);

  if (!content) {
    return null;
  }

  const lines = content.split("\n");

  // 確保行號在有效範圍內
  const start = Math.max(1, startLine) - 1; // 轉為0-based
  const end = endLine ? Math.min(lines.length, endLine) : lines.length;

  if (start >= lines.length || start >= end) {
    return null;
  }

  return lines.slice(start, end).join("\n");
}

/**
 * 提取文件中的關鍵代碼段
 * @param content 文件內容
 * @param maxLength 最大長度限制
 * @returns 提取的關鍵代碼段
 */
export function extractKeyCodeSegments(
  content: string,
  maxLength: number = 3000
): string {
  if (!content || content.length <= maxLength) {
    return content;
  }

  // 分割為代碼塊
  const lines = content.split("\n");

  // 計算每行的權重
  const lineWeights = lines.map((line, index) => {
    let weight = 1;

    // 空行或只有空白字符的行權重較低
    if (line.trim().length === 0) {
      weight *= 0.2;
      return { index, weight, line };
    }

    // 註釋行通常重要性較低，但類似文檔的註釋可能重要
    if (
      line.trim().startsWith("//") ||
      line.trim().startsWith("/*") ||
      line.trim().startsWith("*")
    ) {
      if (
        line.includes("@param") ||
        line.includes("@returns") ||
        line.includes("@description")
      ) {
        weight *= 1.5; // 文檔註釋可能更重要
      } else {
        weight *= 0.5; // 普通註釋
      }
    }

    // 函數或類定義通常很重要
    if (
      line.includes("function") ||
      line.includes("class ") ||
      line.includes("interface ") ||
      line.includes("type ") ||
      line.includes("enum ") ||
      line.includes("const ") ||
      line.includes("export ")
    ) {
      weight *= 2.0;
    }

    // 導入語句也相對重要
    if (line.includes("import ")) {
      weight *= 1.5;
    }

    // 包含關鍵字的行可能更重要
    const keywords = [
      "async",
      "await",
      "return",
      "if",
      "else",
      "switch",
      "case",
      "for",
      "while",
      "try",
      "catch",
      "throw",
    ];
    keywords.forEach((keyword) => {
      if (line.includes(keyword)) {
        weight *= 1.2;
      }
    });

    return { index, weight, line };
  });

  // 按權重排序並選擇最重要的部分
  const sortedLines = [...lineWeights].sort((a, b) => b.weight - a.weight);
  const selectedIndices = new Set<number>();

  // 選擇權重最高的行，但也考慮上下文，直到達到長度限制
  let totalLength = 0;
  let currentIndex = 0;

  while (totalLength < maxLength && currentIndex < sortedLines.length) {
    const { index, line } = sortedLines[currentIndex];

    // 已選擇該行，跳過
    if (selectedIndices.has(index)) {
      currentIndex++;
      continue;
    }

    // 加入該行
    selectedIndices.add(index);
    totalLength += line.length + 1; // +1 為換行符

    // 加入上下文（前後各一行）
    if (index > 0 && !selectedIndices.has(index - 1)) {
      selectedIndices.add(index - 1);
      totalLength += lines[index - 1].length + 1;
    }

    if (index < lines.length - 1 && !selectedIndices.has(index + 1)) {
      selectedIndices.add(index + 1);
      totalLength += lines[index + 1].length + 1;
    }

    currentIndex++;
  }

  // 按原始順序重新組合選中的行
  const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
  let result = "";
  let lastIndex = -1;

  for (const index of sortedIndices) {
    if (lastIndex !== -1 && index > lastIndex + 1) {
      result += "\n// ... 省略部分代碼 ...\n";
    }
    result += lines[index] + "\n";
    lastIndex = index;
  }

  return result;
}

/**
 * 識別代碼中的關鍵區塊（如函數定義、類定義等）
 * @param content 文件內容
 * @returns 關鍵代碼區塊的數組，每個元素包含開始行、結束行和重要性評分
 */
export function identifyCodeBlocks(
  content: string
): { start: number; end: number; importance: number; title: string }[] {
  if (!content) return [];

  const lines = content.split("\n");
  const blocks: {
    start: number;
    end: number;
    importance: number;
    title: string;
  }[] = [];

  // 正則表達式匹配常見的代碼塊開始模式
  const blockStartPatterns = [
    {
      pattern: /^\s*(export\s+)?(async\s+)?function\s+(\w+)/,
      type: "函數",
      importance: 2.0,
    },
    { pattern: /^\s*(export\s+)?class\s+(\w+)/, type: "類", importance: 2.0 },
    {
      pattern: /^\s*(export\s+)?interface\s+(\w+)/,
      type: "介面",
      importance: 1.8,
    },
    { pattern: /^\s*(export\s+)?type\s+(\w+)/, type: "類型", importance: 1.8 },
    { pattern: /^\s*(export\s+)?enum\s+(\w+)/, type: "枚舉", importance: 1.8 },
    { pattern: /^\s*(export\s+)?const\s+(\w+)/, type: "常量", importance: 1.5 },
    { pattern: /^\s*(\/\*\*|\*\s+@)/, type: "文檔", importance: 1.3 },
  ];

  let inBlock = false;
  let currentBlock: {
    start: number;
    end: number;
    importance: number;
    title: string;
  } | null = null;
  let bracketCount = 0;

  // 分析每一行
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 如果不在塊中，檢查是否是塊的開始
    if (!inBlock) {
      for (const { pattern, type, importance } of blockStartPatterns) {
        const match = line.match(pattern);
        if (match) {
          // 獲取識別碼名稱（如函數名、類名等）
          const name = match[3] || match[2];
          currentBlock = {
            start: i,
            end: i,
            importance,
            title: name ? `${type}: ${name}` : type,
          };
          inBlock = true;
          bracketCount =
            (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

          // 如果整個塊在一行內完成
          if (bracketCount === 0 && line.includes("{") && line.includes("}")) {
            blocks.push(currentBlock);
            inBlock = false;
            currentBlock = null;
          }
          break;
        }
      }
    } else {
      // 已在代碼塊中，計算花括號計數
      bracketCount += (line.match(/{/g) || []).length;
      bracketCount -= (line.match(/}/g) || []).length;

      // 如果括號平衡，塊結束
      if (bracketCount <= 0) {
        if (currentBlock) {
          currentBlock.end = i;
          blocks.push(currentBlock);
        }
        inBlock = false;
        currentBlock = null;
      }
    }
  }

  return blocks;
}

/**
 * 智能提取文件內容，優先提取最相關的代碼塊
 * @param content 完整文件內容
 * @param maxLength 最大長度限制
 * @param extractComments 是否提取註釋塊
 * @returns 提取後的內容
 */
export function smartExtractFileContent(
  content: string,
  maxLength: number = 3000,
  extractComments: boolean = true
): string {
  if (!content || content.length <= maxLength) {
    return content;
  }

  // 識別代碼塊
  const codeBlocks = identifyCodeBlocks(content);

  // 如果沒有識別到代碼塊，回退到原有方法
  if (codeBlocks.length === 0) {
    return extractKeyCodeSegments(content, maxLength);
  }

  // 按重要性排序代碼塊
  const sortedBlocks = [...codeBlocks].sort(
    (a, b) => b.importance - a.importance
  );

  // 提取最重要的代碼塊，同時考慮長度限制
  const lines = content.split("\n");
  let result = "";
  let totalLength = 0;

  for (const block of sortedBlocks) {
    // 計算此塊長度
    const blockContent = lines.slice(block.start, block.end + 1).join("\n");
    const blockLength = blockContent.length;

    // 如果加入此塊會超出長度限制
    if (totalLength + blockLength > maxLength) {
      // 檢查是否可以提取部分內容
      if (totalLength < maxLength) {
        const remainingLength = maxLength - totalLength;
        const partialContent = extractKeyCodeSegments(
          blockContent,
          remainingLength
        );
        result += `\n// === ${block.title} (部分內容) ===\n${partialContent}\n`;
      }
      break;
    }

    // 加入完整塊
    result += `\n// === ${block.title} ===\n${blockContent}\n`;
    totalLength += blockLength;
  }

  return result.trim();
}

/**
 * 加載任務相關文件的內容
 * @param relatedFiles 相關文件列表
 * @param maxTotalLength 所有文件內容的最大總長度
 * @returns 載入的文件內容
 */
export async function loadTaskRelatedFiles(
  relatedFiles: RelatedFile[],
  maxTotalLength: number = 15000 // 增加默認上下文長度
): Promise<{ content: string; summary: string }> {
  if (!relatedFiles || relatedFiles.length === 0) {
    return {
      content: "",
      summary: "無相關文件",
    };
  }

  let totalContent = "";
  let filesSummary = `## 相關文件內容摘要 (共 ${relatedFiles.length} 個文件)\n\n`;
  let totalLength = 0;

  // 按文件類型優先級排序（首先處理待修改的文件）
  const priorityOrder: Record<RelatedFileType, number> = {
    [RelatedFileType.TO_MODIFY]: 1,
    [RelatedFileType.REFERENCE]: 2,
    [RelatedFileType.DEPENDENCY]: 3,
    [RelatedFileType.OUTPUT]: 4,
    [RelatedFileType.OTHER]: 5,
  };

  const sortedFiles = [...relatedFiles].sort(
    (a, b) => priorityOrder[a.type] - priorityOrder[b.type]
  );

  // 處理每個文件
  for (const file of sortedFiles) {
    if (totalLength >= maxTotalLength) {
      filesSummary += `\n### 已達到上下文長度限制，部分文件未載入\n`;
      break;
    }

    let fileContent: string | null;

    // 如果指定了行範圍，只讀取指定行
    if (file.lineStart && file.lineEnd) {
      fileContent = await readFileLines(
        file.path,
        file.lineStart,
        file.lineEnd
      );
    } else {
      fileContent = await readFileContent(file.path);
    }

    if (!fileContent) {
      filesSummary += `\n### ${file.type}: ${file.path}\n無法讀取文件內容或文件不存在\n`;
      continue;
    }

    // 提取關鍵代碼段或摘要
    const maxLengthPerFile = Math.min(
      5000, // 增加每個文件允許的最大長度
      maxTotalLength / sortedFiles.length
    );

    // 根據文件類型選擇不同的提取策略
    let extractedContent = "";

    // 對於代碼文件，使用智能提取；對於文本文件，使用傳統提取
    const isCodeFile =
      /\.(js|ts|jsx|tsx|java|c|cpp|py|go|rb|php|cs|h|swift|kt)$/i.test(
        file.path
      );

    if (isCodeFile) {
      extractedContent = smartExtractFileContent(fileContent, maxLengthPerFile);
    } else {
      extractedContent = extractKeyCodeSegments(fileContent, maxLengthPerFile);
    }

    // 添加到總內容
    const fileHeader = `\n### ${file.type}: ${file.path}${
      file.description ? ` - ${file.description}` : ""
    }${
      file.lineStart && file.lineEnd
        ? ` (行 ${file.lineStart}-${file.lineEnd})`
        : ""
    }\n\n`;

    totalContent += fileHeader + "```\n" + extractedContent + "\n```\n\n";
    filesSummary += `- **${file.path}**${
      file.description ? ` - ${file.description}` : ""
    } (${extractedContent.length} 字符)\n`;

    totalLength += extractedContent.length + fileHeader.length + 8; // 8 for "```\n" and "\n```"
  }

  return {
    content: totalContent,
    summary: filesSummary,
  };
}
