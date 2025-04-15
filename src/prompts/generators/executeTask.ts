/**
 * executeTask prompt 生成器
 * 負責將模板和參數組合成最終的 prompt
 */

import { loadPrompt, generatePrompt } from "../loader.js";
import * as templates from "../templates/executeTask.js";
import { Task, TaskStatus } from "../../types/index.js";

/**
 * 任務複雜度級別的介面
 */
interface TaskComplexityLevel {
  VERY_HIGH: string;
  HIGH: string;
  MEDIUM: string;
  LOW: string;
  VERY_LOW: string;
}

/**
 * 任務複雜度評估的介面
 */
interface ComplexityAssessment {
  level: string;
  metrics: {
    descriptionLength: number;
    dependenciesCount: number;
  };
  recommendations?: string[];
}

/**
 * executeTask prompt 參數介面
 */
export interface ExecuteTaskPromptParams {
  task: Task;
  complexityAssessment?: ComplexityAssessment;
  relatedFilesSummary?: string;
  dependencyTasks?: Task[];
  potentialFiles?: string[];
}

/**
 * 獲取複雜度級別的樣式文字
 * @param level 複雜度級別
 * @returns 樣式文字
 */
function getComplexityStyle(level: string): string {
  switch (level) {
    case "VERY_HIGH":
      return "⚠️ **警告：此任務複雜度極高** ⚠️";
    case "HIGH":
      return "⚠️ **注意：此任務複雜度較高**";
    case "MEDIUM":
      return "**提示：此任務具有一定複雜性**";
    default:
      return "";
  }
}

/**
 * 獲取 executeTask 的完整 prompt
 * @param params prompt 參數
 * @returns 生成的 prompt
 */
export function getExecuteTaskPrompt(params: ExecuteTaskPromptParams): string {
  const {
    task,
    complexityAssessment,
    relatedFilesSummary,
    dependencyTasks,
    potentialFiles,
  } = params;

  // 處理注意事項
  const notes = task.notes ? `**注意事項:** ${task.notes}\n` : "";

  // 開始構建基本 prompt
  let basePrompt = generatePrompt(templates.executeTaskTemplate, {
    name: task.name,
    id: task.id,
    description: task.description,
    notes: notes,
  });

  // 添加實現指南（如果有）
  if (task.implementationGuide) {
    basePrompt += generatePrompt(templates.implementationGuideTemplate, {
      implementationGuide: task.implementationGuide,
    });
  }

  // 添加驗證標準（如果有）
  if (task.verificationCriteria) {
    basePrompt += generatePrompt(templates.verificationCriteriaTemplate, {
      verificationCriteria: task.verificationCriteria,
    });
  }

  // 添加分析結果（如果有）
  if (task.analysisResult) {
    basePrompt += generatePrompt(templates.analysisResultTemplate, {
      analysisResult: task.analysisResult,
    });
  }

  // 添加依賴任務完成摘要（如果有）
  if (dependencyTasks && dependencyTasks.length > 0) {
    const completedDependencyTasks = dependencyTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED && t.summary
    );

    if (completedDependencyTasks.length > 0) {
      basePrompt += templates.dependencyTaskSummaryTemplate;

      for (const depTask of completedDependencyTasks) {
        basePrompt += generatePrompt(templates.dependencyTaskItemTemplate, {
          name: depTask.name,
          summary: depTask.summary || "*無完成摘要*",
        });
      }
    }
  }

  // 添加相關文件（如果有）
  if (relatedFilesSummary) {
    basePrompt += generatePrompt(templates.relatedFilesSummaryTemplate, {
      relatedFilesSummary: relatedFilesSummary,
    });
  } else {
    // 無相關文件
    basePrompt += templates.noRelatedFilesTemplate;

    // 添加潛在相關文件建議（如果有）
    if (potentialFiles && potentialFiles.length > 0) {
      const potentialFilesStr = potentialFiles
        .map((file) => `- 含有 "${file}" 的文件\n`)
        .join("");

      basePrompt += generatePrompt(templates.recommendedFilesTemplate, {
        potentialFiles: potentialFilesStr,
      });
    }
  }

  // 添加複雜度評估（如果有）
  if (complexityAssessment) {
    basePrompt += generatePrompt(templates.complexityAssessmentTemplate, {
      level: complexityAssessment.level,
    });

    // 添加複雜度警告樣式（如果需要）
    const complexityStyle = getComplexityStyle(complexityAssessment.level);
    if (complexityStyle) {
      basePrompt += generatePrompt(templates.complexityWarningTemplate, {
        complexityStyle: complexityStyle,
      });
    }

    // 添加評估指標
    basePrompt += templates.assessmentMetricsTemplate;
    basePrompt += generatePrompt(templates.descriptionLengthMetric, {
      descriptionLength: complexityAssessment.metrics.descriptionLength,
    });
    basePrompt += generatePrompt(templates.dependenciesCountMetric, {
      dependenciesCount: complexityAssessment.metrics.dependenciesCount,
    });

    // 添加處理建議（如果有）
    if (
      complexityAssessment.recommendations &&
      complexityAssessment.recommendations.length > 0
    ) {
      basePrompt += templates.handlingRecommendationsTemplate;
      if (complexityAssessment.recommendations[0]) {
        basePrompt += generatePrompt(templates.handlingRecommendation1, {
          recommendation1: complexityAssessment.recommendations[0],
        });
      }
      if (complexityAssessment.recommendations[1]) {
        basePrompt += generatePrompt(templates.handlingRecommendation2, {
          recommendation2: complexityAssessment.recommendations[1],
        });
      }
    }
  }

  // 添加執行步驟
  basePrompt += templates.executionStepsTemplate;
  basePrompt += templates.executionStep1;
  basePrompt += templates.executionStep2;
  basePrompt += templates.executionStep3;
  basePrompt += templates.executionStep4;

  // 添加質量要求
  basePrompt += templates.qualityRequirementsTemplate;
  basePrompt += templates.qualityRequirement1;
  basePrompt += templates.qualityRequirement2;
  basePrompt += templates.qualityRequirement3;

  // 添加完成提示
  basePrompt += templates.completionReminderTemplate;

  // 載入可能的自定義 prompt
  return loadPrompt(basePrompt, "EXECUTE_TASK");
}
