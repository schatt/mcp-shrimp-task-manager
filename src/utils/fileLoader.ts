import { RelatedFile, RelatedFileType } from "../types/index.js";

/**
 * Generate a content summary for task-related files.
 *
 * This function creates a summary from a list of RelatedFile objects without
 * reading actual file contents. It produces a lightweight, formatted summary
 * based on file metadata (path, type, description, etc.), suitable when
 * contextual info is needed but file I/O is not desired.
 *
 * @param relatedFiles The list of related files with metadata
 * @param maxTotalLength Maximum total length for generated content to avoid oversized output
 * @returns An object with two fields:
 *   - content: Detailed info for each file including basic metadata and hints
 *   - summary: A concise overview list for quick scanning
 */
export async function loadTaskRelatedFiles(
  relatedFiles: RelatedFile[],
  maxTotalLength: number = 15000 // Control total generated content length
): Promise<{ content: string; summary: string }> {
  if (!relatedFiles || relatedFiles.length === 0) {
    return {
      content: "",
      summary: "No related files",
    };
  }

  let totalContent = "";
  let filesSummary = `## Related Files Summary (total ${relatedFiles.length})\n\n`;
  let totalLength = 0;

  // Sort by file type priority (modify first)
  const priorityOrder: Record<RelatedFileType, number> = {
    [RelatedFileType.TO_MODIFY]: 1,
    [RelatedFileType.REFERENCE]: 2,
    [RelatedFileType.DEPENDENCY]: 3,
    [RelatedFileType.CREATE]: 4,
    [RelatedFileType.OTHER]: 5,
  };

  const sortedFiles = [...relatedFiles].sort(
    (a, b) => priorityOrder[a.type] - priorityOrder[b.type]
  );

  // Process each file
  for (const file of sortedFiles) {
    if (totalLength >= maxTotalLength) {
      filesSummary += `\n### Context length limit reached; some files were not included\n`;
      break;
    }

    // Generate basic file info
    const fileInfo = generateFileInfo(file);

    // Append to total content
    const fileHeader = `\n### ${file.type}: ${file.path}${
      file.description ? ` - ${file.description}` : ""
    }${file.lineStart && file.lineEnd ? ` (lines ${file.lineStart}-${file.lineEnd})` : ""}\n\n`;

    totalContent += fileHeader + "```\n" + fileInfo + "\n```\n\n";
    filesSummary += `- **${file.path}**${
      file.description ? ` - ${file.description}` : ""
    } (${fileInfo.length} chars)\n`;

    totalLength += fileInfo.length + fileHeader.length + 8; // 8 for "```\n" and "\n```"
  }

  return {
    content: totalContent,
    summary: filesSummary,
  };
}

/**
 * Generate formatted basic information for a file from metadata only.
 * Does not read the actual file content.
 */
function generateFileInfo(file: RelatedFile): string {
  let fileInfo = `File: ${file.path}\n`;
  fileInfo += `Type: ${file.type}\n`;

  if (file.description) {
    fileInfo += `Description: ${file.description}\n`;
  }

  if (file.lineStart && file.lineEnd) {
    fileInfo += `Line Range: ${file.lineStart}-${file.lineEnd}\n`;
  }

  fileInfo += `To view actual content, open the file directly: ${file.path}\n`;

  return fileInfo;
}
