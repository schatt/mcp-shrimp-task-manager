// 任務狀態枚舉：定義任務在工作流程中的當前階段
export var TaskStatus;
(function (TaskStatus) {
  TaskStatus["PENDING"] = "\u5F85\u8655\u7406";
  TaskStatus["IN_PROGRESS"] = "\u9032\u884C\u4E2D";
  TaskStatus["COMPLETED"] = "\u5DF2\u5B8C\u6210";
  TaskStatus["BLOCKED"] = "\u88AB\u963B\u64CB";
})(TaskStatus || (TaskStatus = {}));
// 相關文件類型：定義文件與任務的關係類型
export var RelatedFileType;
(function (RelatedFileType) {
  RelatedFileType["TO_MODIFY"] = "\u5F85\u4FEE\u6539";
  RelatedFileType["REFERENCE"] = "\u53C3\u8003\u8CC7\u6599";
  RelatedFileType["OUTPUT"] = "\u8F38\u51FA\u7D50\u679C";
  RelatedFileType["DEPENDENCY"] = "\u4F9D\u8CF4\u6587\u4EF6";
  RelatedFileType["OTHER"] = "\u5176\u4ED6";
})(RelatedFileType || (RelatedFileType = {}));
// 任務複雜度級別：定義任務的複雜程度分類
export var TaskComplexityLevel;
(function (TaskComplexityLevel) {
  TaskComplexityLevel["LOW"] = "\u4F4E\u8907\u96DC\u5EA6";
  TaskComplexityLevel["MEDIUM"] = "\u4E2D\u7B49\u8907\u96DC\u5EA6";
  TaskComplexityLevel["HIGH"] = "\u9AD8\u8907\u96DC\u5EA6";
  TaskComplexityLevel["VERY_HIGH"] = "\u6975\u9AD8\u8907\u96DC\u5EA6";
})(TaskComplexityLevel || (TaskComplexityLevel = {}));
// 任務複雜度閾值：定義任務複雜度評估的參考標準
export const TaskComplexityThresholds = {
  DESCRIPTION_LENGTH: {
    MEDIUM: 500, // 超過此字數判定為中等複雜度
    HIGH: 1000, // 超過此字數判定為高複雜度
    VERY_HIGH: 2000, // 超過此字數判定為極高複雜度
  },
  DEPENDENCIES_COUNT: {
    MEDIUM: 2, // 超過此依賴數量判定為中等複雜度
    HIGH: 5, // 超過此依賴數量判定為高複雜度
    VERY_HIGH: 10, // 超過此依賴數量判定為極高複雜度
  },
  NOTES_LENGTH: {
    MEDIUM: 200, // 超過此字數判定為中等複雜度
    HIGH: 500, // 超過此字數判定為高複雜度
    VERY_HIGH: 1000, // 超過此字數判定為極高複雜度
  },
};
