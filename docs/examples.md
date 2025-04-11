# 蝦米任務管理器 - 示例代碼與使用案例

本文檔提供蝦米任務管理器各功能的詳細示例代碼和實際使用案例，幫助您更好地理解和應用這些功能。

## 1. 刪除任務功能案例

### 案例：重新規劃項目架構

在一個開發週期中，您發現原本規劃的架構方案需要調整，部分任務不再適用。

#### 示例代碼：

```javascript
// 檢查當前的任務列表
const taskList = await mcp.mcp_shrimp_task_manager.list_tasks();
console.log(taskList);

// 識別需要刪除的任務
const tasksToDelete = [
  "8a7b6c5d-4e3f-2g1h-0i9j-8k7l6m5n4o3p", // "設計舊版元件庫" 任務
  "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p", // "實現舊版API介面" 任務
];

// 逐個刪除任務
for (const taskId of tasksToDelete) {
  try {
    const result = await mcp.mcp_shrimp_task_manager.delete_task({
      taskId,
    });
    console.log(`任務 ${taskId} 刪除結果:`, result);
  } catch (error) {
    console.error(`刪除任務 ${taskId} 失敗:`, error);

    // 檢查是否有依賴關係阻止刪除
    if (error.message.includes("依賴")) {
      console.log("檢測到依賴關係，需要先處理依賴任務");
      // 這裡可以添加處理依賴關係的邏輯
    }
  }
}

// 確認任務已刪除
const updatedTaskList = await mcp.mcp_shrimp_task_manager.list_tasks();
console.log(updatedTaskList);
```

### 案例：修正錯誤創建的任務

在團隊協作過程中，由於溝通不當，創建了重複或不必要的任務。

#### 示例代碼：

```javascript
// 首先列出所有任務，識別重複項
const allTasks = await mcp.mcp_shrimp_task_manager.list_tasks();

// 假設我們發現兩個名稱相似的任務實際是同一個任務
const duplicateTasks = allTasks.content[0].text.match(
  /ID: `([^`]+)`.*名稱: "用戶註冊功能"/g
);

if (duplicateTasks && duplicateTasks.length > 1) {
  // 提取第二個重複任務的ID
  const duplicateTaskId = duplicateTasks[1].match(/ID: `([^`]+)`/)[1];

  // 刪除重複的任務
  await mcp.mcp_shrimp_task_manager.delete_task({
    taskId: duplicateTaskId,
  });

  console.log(`已刪除重複的任務: ${duplicateTaskId}`);
}
```

## 2. 任務複雜度自適應處理案例

### 案例：處理高複雜度的系統重構任務

您需要執行一個涉及多個子系統的大型重構任務，系統識別出這是一個高複雜度任務。

#### 示例代碼：

```javascript
// 執行複雜任務
const executeResult = await mcp.mcp_shrimp_task_manager.execute_task({
  taskId: "complex-task-uuid-here",
});

// 解析複雜度評估結果
const complexityMatch = executeResult.content[0].text.match(/複雜度級別: (.*)/);
if (complexityMatch && complexityMatch[1].includes("高複雜度")) {
  console.log("檢測到高複雜度任務，準備拆分...");

  // 根據複雜度評估建議拆分任務
  await mcp.mcp_shrimp_task_manager.split_tasks({
    isOverwrite: false,
    tasks: [
      {
        name: "重構階段1：數據模型更新",
        description: "更新系統核心數據模型，確保向後兼容性",
        notes: "需專注於資料遷移計劃",
      },
      {
        name: "重構階段2：API改造",
        description: "基於新數據模型更新API層",
        dependencies: ["重構階段1：數據模型更新"],
      },
      {
        name: "重構階段3：前端適配",
        description: "更新前端代碼以兼容新API",
        dependencies: ["重構階段2：API改造"],
      },
    ],
  });

  // 列出拆分後的任務
  await mcp.mcp_shrimp_task_manager.list_tasks();
}
```

### 案例：建立複雜任務的里程碑

對於複雜任務，設置明確的里程碑和檢查點可以幫助跟蹤進度。

#### 示例代碼：

```javascript
// 執行中等複雜度的任務
const taskResult = await mcp.mcp_shrimp_task_manager.execute_task({
  taskId: "medium-complexity-task-uuid",
});

// 查看系統建議
console.log("系統複雜度評估建議:", taskResult);

// 根據建議設置里程碑
const today = new Date();
const milestones = [
  {
    name: "需求分析完成",
    deadline: new Date(today.setDate(today.getDate() + 2))
      .toISOString()
      .split("T")[0],
  },
  {
    name: "核心功能實現",
    deadline: new Date(today.setDate(today.getDate() + 5))
      .toISOString()
      .split("T")[0],
  },
  {
    name: "整合測試完成",
    deadline: new Date(today.setDate(today.getDate() + 3))
      .toISOString()
      .split("T")[0],
  },
  {
    name: "文檔編寫與部署",
    deadline: new Date(today.setDate(today.getDate() + 2))
      .toISOString()
      .split("T")[0],
  },
];

console.log("為複雜任務設置的里程碑:", milestones);

// 記錄里程碑到任務注記（假設我們有更新任務的API）
// 在實際場景中，您可能需要將這些里程碑記錄到專門的文檔或項目管理工具
```

## 3. 任務摘要自動更新機制案例

### 案例：完成關鍵功能並提供詳細摘要

您剛完成了一個重要的系統功能，需要記錄詳細的實施過程和決策理由。

#### 示例代碼：

```javascript
// 完成任務並提供詳細摘要
await mcp.mcp_shrimp_task_manager.complete_task({
  taskId: "auth-system-task-uuid",
  summary: `成功實現多因素認證系統，包括以下關鍵組件：
  
1. 核心認證流程：使用 JWT + 刷新令牌架構，支持多設備同時登入，令牌有效期為30分鐘，刷新令牌7天。
  
2. 因素實現：
   - 知識因素：密碼採用 Argon2id 算法加鹽哈希存儲
   - 設備因素：實現基於 FIDO2/WebAuthn 的無密碼認證
   - 所有權因素：支持 TOTP 和 HOTP 兩種一次性密碼標準
  
3. 安全增強措施：
   - 實現漸進式登入延遲，防止暴力破解
   - IP變動時要求額外驗證
   - 可疑活動檢測與自動鎖定
  
4. 性能優化：
   - 認證流程平均響應時間降低40%
   - 使用Redis作為令牌存儲，支持水平擴展
   - 實現分層緩存策略，降低數據庫壓力
  
遇到並解決的主要挑戰：(1)跨域認證問題；(2)移動設備上的WebAuthn兼容性；(3)離線驗證機制。`,
});

// 列出任務，確認摘要已更新
const tasks = await mcp.mcp_shrimp_task_manager.list_tasks();
console.log(tasks);
```

### 案例：使用自動生成的摘要

對於較簡單的任務，可以讓系統自動生成摘要。

#### 示例代碼：

```javascript
// 完成任務，讓系統自動生成摘要
await mcp.mcp_shrimp_task_manager.complete_task({
  taskId: "simple-logging-task-uuid",
});

// 檢查生成的摘要
const taskList = await mcp.mcp_shrimp_task_manager.list_tasks();
const completedTasks = taskList.content[0].text.match(/已完成.*?\n\n/gs);

if (completedTasks) {
  const relevantTask = completedTasks.find((task) =>
    task.includes("simple-logging-task-uuid")
  );
  const summaryMatch = relevantTask.match(/摘要: (.*?)(?:\n|$)/);

  if (summaryMatch) {
    console.log("系統自動生成的摘要:", summaryMatch[1]);
  }
}
```

## 4. 工作日誌功能案例

### 案例：追蹤關鍵任務的執行歷程

在復盤專案時，需要了解某個關鍵任務的完整執行過程和決策點。

#### 示例代碼：

```javascript
// 查詢特定任務的日誌
const taskLogs = await mcp.mcp_shrimp_task_manager.list_conversation_log({
  taskId: "key-feature-task-uuid",
  limit: 50, // 獲取更多記錄
});

// 分析日誌中的關鍵決策點
const decisionPoints = taskLogs.entries.filter(
  (entry) =>
    entry.summary.includes("決定") ||
    entry.summary.includes("選擇") ||
    entry.summary.includes("決策")
);

console.log("任務執行過程中的關鍵決策點:", decisionPoints);

// 分析遇到的挑戰
const challenges = taskLogs.entries.filter(
  (entry) =>
    entry.summary.includes("問題") ||
    entry.summary.includes("挑戰") ||
    entry.summary.includes("困難") ||
    entry.summary.includes("錯誤")
);

console.log("任務執行過程中遇到的挑戰:", challenges);

// 組織執行時間線
const timeline = taskLogs.entries
  .map((entry) => ({
    time: new Date(entry.timestamp),
    action:
      entry.summary.substring(0, 100) +
      (entry.summary.length > 100 ? "..." : ""),
    participant: entry.participant,
  }))
  .sort((a, b) => a.time - b.time);

console.log("任務執行時間線:", timeline);
```

### 案例：項目結束後清理不必要的日誌

在項目完成後，需要清理積累的大量日誌，但保留關鍵記錄。

#### 示例代碼：

```javascript
// 首先，提取重要日誌並保存
const allLogs = await mcp.mcp_shrimp_task_manager.list_conversation_log({
  limit: 1000, // 嘗試獲取大量日誌
  offset: 0,
});

// 識別關鍵日誌（例如重要決策、錯誤解決方案等）
const keyLogs = allLogs.entries.filter((entry) => {
  // 過濾出重要性高的日誌
  const isDecision =
    entry.summary.includes("決策") || entry.summary.includes("選擇方案");
  const isError =
    entry.summary.includes("修復錯誤") || entry.summary.includes("解決問題");
  const isMilestone =
    entry.summary.includes("里程碑") || entry.summary.includes("階段完成");

  return isDecision || isError || isMilestone;
});

// 將關鍵日誌保存到外部文件（示例）
console.log("保存的關鍵日誌數量:", keyLogs.length);
console.log("關鍵日誌示例:", keyLogs.slice(0, 3));

// 確認已保存重要日誌後，清除系統中的全部日誌
const confirmation = window.confirm(
  "已保存關鍵日誌，是否清除系統中的所有日誌記錄？"
);

if (confirmation) {
  await mcp.mcp_shrimp_task_manager.clear_conversation_log({
    confirm: true,
  });
  console.log("所有日誌已清除");
}
```

## 5. 綜合案例：完整項目流程

以下是一個完整的項目工作流程示例，從規劃到完成，使用蝦米任務管理器的各項功能。

### 案例：開發一個用戶資料分析儀表板

#### 階段 1：項目規劃與任務拆分

```javascript
// 開始規劃
await mcp.mcp_shrimp_task_manager.plan_task({
  description:
    "開發一個用戶資料分析儀表板，用於可視化用戶行為數據，支持多維度分析和報表導出功能。",
  requirements:
    "技術棧要求使用React前端和Node.js後端，數據視覺化採用ECharts或D3.js，需支持千萬級用戶數據的實時分析。",
});

// 分析問題
await mcp.mcp_shrimp_task_manager.analyze_task({
  summary: "用戶資料分析儀表板開發項目，集成多維數據可視化和報表導出功能",
  initialConcept:
    "採用模塊化設計，前端使用React+Redux+ECharts，後端使用Node.js+Express+MongoDB，實現數據流水線處理和快速響應的數據查詢API。",
});

// 反思構想
await mcp.mcp_shrimp_task_manager.reflect_task({
  summary: "用戶資料分析儀表板開發項目，集成多維數據可視化和報表導出功能",
  analysis:
    "經過詳細分析，決定採用以下技術方案：\n1. 前端框架：React 18 + TypeScript\n2. 狀態管理：Redux Toolkit + RTK Query\n3. 視覺化庫：ECharts 5 (適合複雜數據視覺化)\n4. 後端API：Node.js + Express + MongoDB聚合查詢\n5. 數據處理：採用分層緩存策略，通過Redis緩存熱門查詢\n6. 報表導出：使用server-side生成PDF和CSV\n...",
});

// 拆分任務
await mcp.mcp_shrimp_task_manager.split_tasks({
  isOverwrite: false,
  tasks: [
    {
      name: "設計系統架構",
      description:
        "定義系統整體架構，包括前後端技術選型、數據流、API設計和部署架構",
      notes: "需考慮系統擴展性和性能要求",
    },
    {
      name: "開發資料處理後端",
      description: "實現資料處理引擎，支持大數據量查詢和聚合分析",
      dependencies: ["設計系統架構"],
    },
    {
      name: "實現資料視覺化元件",
      description: "開發可重用的視覺化圖表元件，支持多種數據展示形式",
      dependencies: ["設計系統架構"],
    },
    {
      name: "搭建儀表板界面",
      description: "根據UI設計實現儀表板界面，包括布局、過濾器和用戶交互",
      dependencies: ["設計系統架構"],
    },
    {
      name: "整合資料和視覺化",
      description: "連接後端API和前端視覺化元件，實現數據實時更新和交互",
      dependencies: [
        "開發資料處理後端",
        "實現資料視覺化元件",
        "搭建儀表板界面",
      ],
    },
    {
      name: "開發報表導出功能",
      description: "實現多格式報表導出功能，支持PDF、CSV等格式",
      dependencies: ["整合資料和視覺化"],
    },
    {
      name: "系統測試與優化",
      description:
        "進行系統整體測試，包括功能測試、性能測試和壓力測試，針對性優化",
      dependencies: ["整合資料和視覺化", "開發報表導出功能"],
    },
  ],
});
```

#### 階段 2：任務執行與複雜度處理

```javascript
// 列出所有任務
const tasks = await mcp.mcp_shrimp_task_manager.list_tasks();
console.log(tasks);

// 找出第一個待執行的任務
const pendingTasks = tasks.content[0].text.match(/待處理.*?ID: `([^`]+)`/gs);
const firstTaskId = pendingTasks[0].match(/ID: `([^`]+)`/)[1];

// 執行架構設計任務
const executeResult = await mcp.mcp_shrimp_task_manager.execute_task({
  taskId: firstTaskId,
});

// 檢查複雜度評估
if (executeResult.content[0].text.includes("高複雜度")) {
  console.log("架構設計是高複雜度任務，需要特別關注");

  // 可以進一步拆分架構設計任務
  await mcp.mcp_shrimp_task_manager.split_tasks({
    isOverwrite: false,
    tasks: [
      {
        name: "前端架構設計",
        description: "設計前端架構，包括組件結構、狀態管理和路由設計",
        dependencies: [],
      },
      {
        name: "後端架構設計",
        description: "設計後端架構，包括API結構、數據模型和緩存策略",
        dependencies: [],
      },
      {
        name: "整合前後端架構",
        description: "確保前後端架構協同工作，定義數據交換格式和API契約",
        dependencies: ["前端架構設計", "後端架構設計"],
      },
    ],
  });
}
```

#### 階段 3：完成任務與提供摘要

```javascript
// 驗證任務
await mcp.mcp_shrimp_task_manager.verify_task({
  taskId: "architecture-task-uuid",
});

// 完成任務並提供詳細摘要
await mcp.mcp_shrimp_task_manager.complete_task({
  taskId: "architecture-task-uuid",
  summary: `成功設計完成系統整體架構，採用了以下關鍵技術決策：
  
1. 採用微服務架構，將資料處理和視覺化渲染分離，提高系統靈活性
2. 前端技術棧：React 18 + TypeScript + ECharts 5，組件採用原子設計模式
3. 後端技術棧：Node.js + Express + MongoDB，採用資料聚合管道處理複雜查詢
4. 快取策略：三層緩存（應用內存、Redis、持久化存儲），針對不同數據生命週期優化
5. 擴展性設計：水平擴展的API服務，事件驅動的資料處理管道
  
解決的主要挑戰：(1)大數據量分析性能瓶頸；(2)多維度數據實時更新一致性；(3)跨設備體驗一致性

測試結果顯示架構可支持超過1000萬用戶記錄的快速分析，查詢響應時間控制在200ms以內，比目標性能指標提升了35%。`,
});
```

#### 階段 4：查詢任務日誌和維護

```javascript
// 查詢任務執行日誌
const taskLogs = await mcp.mcp_shrimp_task_manager.list_conversation_log({
  taskId: "architecture-task-uuid",
});

// 分析日誌，找出關鍵決策點
const decisions = taskLogs.entries.filter(
  (entry) => entry.summary.includes("決定") || entry.summary.includes("選擇")
);

console.log("架構設計過程中的關鍵決策:", decisions);

// 清理不必要的任務（假設有些子任務變得不必要）
await mcp.mcp_shrimp_task_manager.delete_task({
  taskId: "unnecessary-subtask-uuid",
});

// 最終檢查任務狀態
const finalTaskList = await mcp.mcp_shrimp_task_manager.list_tasks();
console.log("當前任務狀態:", finalTaskList);
```

## 結論

以上示例展示了蝦米任務管理器在不同場景下的使用方法。通過這些具體案例，您可以了解如何：

1. 使用刪除任務功能維護任務列表的整潔和準確性
2. 利用任務複雜度自適應處理功能合理規劃和分解複雜任務
3. 通過任務摘要自動更新機制記錄關鍵實施細節和決策
4. 使用工作日誌功能追蹤項目進展和關鍵決策點

這些功能共同提供了一個強大的任務管理框架，幫助您更有效地規劃、執行和監控項目。
