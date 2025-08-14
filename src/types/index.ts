// Task status enum: defines the current stage of a task in the workflow
export enum TaskStatus {
  PENDING = "pending", // Created but not yet started
  IN_PROGRESS = "in_progress", // Currently being executed
  COMPLETED = "completed", // Successfully completed and verified
  BLOCKED = "blocked", // Temporarily not executable due to dependencies
}

// Task dependency: defines prerequisite relationships between tasks
export interface TaskDependency {
  taskId: string; // The unique ID of the prerequisite task that must be completed before this task
}

// Related file types: defines how a file relates to a task
export enum RelatedFileType {
  TO_MODIFY = "TO_MODIFY", // File to be modified during the task
  REFERENCE = "REFERENCE", // Reference material or related documentation
  CREATE = "CREATE", // File to be created by the task
  DEPENDENCY = "DEPENDENCY", // Component or library file the task depends on
  OTHER = "OTHER", // Other types of related files
}

// Related file: metadata for files associated with a task
export interface RelatedFile {
  path: string; // File path (absolute or relative to project root)
  type: RelatedFileType; // Relationship type
  description?: string; // Additional description explaining relation or purpose
  lineStart?: number; // Start line of the related code block (optional)
  lineEnd?: number; // End line of the related code block (optional)
}

// Task interface: defines the complete data structure of a task
export interface Task {
  id: string; // Unique task ID
  name: string; // Concise and clear task name
  description: string; // Detailed description with implementation points and acceptance criteria
  notes?: string; // Additional notes or special handling requirements (optional)
  status: TaskStatus; // Current execution status
  dependencies: TaskDependency[]; // List of prerequisite tasks
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last updated timestamp
  completedAt?: Date; // Completion timestamp (for completed tasks)
  summary?: string; // Completion summary describing results and key decisions (for completed tasks)
  relatedFiles?: RelatedFile[]; // Related files (optional)

  // Additional field: stores the full technical analysis result
  analysisResult?: string; // Full analysis from analyze_task and reflect_task stages

  // Additional field: stores specific implementation guidance
  implementationGuide?: string; // Implementation methods, steps, and recommendations

  // Additional field: stores verification criteria and methods
  verificationCriteria?: string; // Clear verification standards, test points, and acceptance conditions
}

// Task complexity levels: classification of complexity
export enum TaskComplexityLevel {
  LOW = "Low", // Simple and straightforward tasks; usually no special handling needed
  MEDIUM = "Medium", // Some complexity but manageable
  HIGH = "High", // Complex and time-consuming; requires extra attention
  VERY_HIGH = "Very High", // Extremely complex; splitting recommended
}

// Task complexity thresholds: reference standards for assessments
export const TaskComplexityThresholds = {
  DESCRIPTION_LENGTH: {
    MEDIUM: 500, // Above this character count → Medium complexity
    HIGH: 1000, // Above this character count → High complexity
    VERY_HIGH: 2000, // Above this character count → Very High complexity
  },
  DEPENDENCIES_COUNT: {
    MEDIUM: 2, // Above this number of dependencies → Medium complexity
    HIGH: 5, // Above this number of dependencies → High complexity
    VERY_HIGH: 10, // Above this number of dependencies → Very High complexity
  },
  NOTES_LENGTH: {
    MEDIUM: 200, // Above this character count → Medium complexity
    HIGH: 500, // Above this character count → High complexity
    VERY_HIGH: 1000, // Above this character count → Very High complexity
  },
};

// Task complexity assessment result: records detailed analysis
export interface TaskComplexityAssessment {
  level: TaskComplexityLevel; // Overall complexity level
  metrics: {
    // Detailed values for assessment metrics
    descriptionLength: number; // Description length
    dependenciesCount: number; // Number of dependencies
    notesLength: number; // Notes length
    hasNotes: boolean; // Whether notes exist
  };
  recommendations: string[]; // Recommendations for handling
}
