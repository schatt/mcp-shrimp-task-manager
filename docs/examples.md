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

## 4. 清除所有任務功能案例

### 案例：項目重新規劃

在完成一個階段性目標後，團隊決定重新規劃剩餘的項目工作，需要清除所有未完成的任務。

#### 示例代碼：

```javascript
// 1. 首先導出現有任務作為備份
const currentTasks = await mcp.mcp_shrimp_task_manager.list_tasks();
console.log("備份現有任務列表：", currentTasks);

// 2. 記錄已完成任務數量（這些任務不會被刪除）
const completedTasksMatch =
  currentTasks.content[0].text.match(/已完成: (\d+) 個任務/);
const completedTasksCount = completedTasksMatch
  ? parseInt(completedTasksMatch[1])
  : 0;
console.log(`已完成任務數量: ${completedTasksCount} (這些任務將被保留)`);

// 3. 執行清除操作（必須設置確認參數）
try {
  const clearResult = await mcp.mcp_shrimp_task_manager.clear_all_tasks({
    confirm: true, // 必須明確確認才能執行清除
  });

  console.log("清除結果:", clearResult);

  // 4. 提取備份文件路徑信息
  const backupPathMatch =
    clearResult.content[0].text.match(/備份文件: (.*\.json)/);
  const backupPath = backupPathMatch ? backupPathMatch[1] : "備份文件路徑未知";
  console.log(`數據已備份到: ${backupPath}`);
} catch (error) {
  console.error("清除操作失敗:", error);
}

// 5. 確認清除結果
const remainingTasks = await mcp.mcp_shrimp_task_manager.list_tasks();
console.log("清除後的任務列表:", remainingTasks);

// 6. 開始新的任務規劃
await mcp.mcp_shrimp_task_manager.plan_task({
  description: "項目第二階段：優化用戶體驗並擴展功能",
  requirements: "改進性能、美化界面、增加新功能模塊",
});
```

### 案例：測試環境重置

在進行系統測試後，需要將環境重置為初始狀態，同時保留已完成任務的歷史記錄。

#### 示例代碼：

```javascript
// 1. 查詢當前環境狀態
const beforeReset = await mcp.mcp_shrimp_task_manager.list_tasks();
console.log("重置前狀態:", beforeReset);

// 2. 記錄重要測試結果
const testResults = "測試發現3個UI問題，2個性能瓶頸，均已記錄到測試報告";
console.log(`測試結果摘要: ${testResults}`);

// 3. 執行環境重置
await mcp.mcp_shrimp_task_manager.clear_all_tasks({
  confirm: true,
});

// 4. 確認重置結果
const afterReset = await mcp.mcp_shrimp_task_manager.list_tasks();
console.log("重置後狀態:", afterReset);

// 5. 記錄重置操作到系統日誌
await mcp.mcp_shrimp_task_manager.list_conversation_log({
  limit: 1, // 只獲取最新的一條日誌
});
```

## 5. 更新任務功能案例

### 案例：調整任務範圍

在進行過程中發現任務需求有變化，需要調整任務描述和範圍。

#### 示例代碼：

```javascript
// 1. 獲取需要更新的任務ID
const taskList = await mcp.mcp_shrimp_task_manager.list_tasks();
const taskIdMatch = taskList.content[0].text.match(
  /ID: `([^`]+)`.*名稱: "實現用戶註冊功能"/
);
const taskId = taskIdMatch ? taskIdMatch[1] : null;

if (!taskId) {
  console.error("找不到目標任務");
  return;
}

// 2. 更新任務內容
const updateResult = await mcp.mcp_shrimp_task_manager.update_task({
  taskId,
  name: "實現用戶註冊和驗證功能",
  description:
    "設計並實現用戶註冊流程，包括：\n1. 基本信息註冊\n2. 電子郵件驗證\n3. 手機號碼驗證\n4. 安全問題設置\n5. 初始偏好設定",
  notes: "更新原因：產品團隊要求增加電子郵件和手機驗證步驟，提高帳戶安全性",
});

console.log("任務更新結果:", updateResult);

// 3. 通知團隊成員任務範圍變更
console.log("已通知團隊成員任務範圍已擴大，包含更多驗證步驟");

// 4. 記錄變更歷史
const changeLog = `
變更日期: ${new Date().toISOString()}
變更內容: 擴展任務範圍，增加郵件和手機驗證步驟
變更原因: 提高帳戶安全性
請求方: 產品團隊
`;
console.log("變更日誌:", changeLog);
```

### 案例：澄清任務描述

發現任務描述不夠清晰，開發人員需要更多細節以正確實現功能。

#### 示例代碼：

```javascript
// 1. 找到需要澄清的任務
const allTasks = await mcp.mcp_shrimp_task_manager.list_tasks();
const taskIdMatch = allTasks.content[0].text.match(
  /ID: `([^`]+)`.*名稱: "優化數據庫查詢"/
);
const taskId = taskIdMatch ? taskIdMatch[1] : null;

if (!taskId) {
  console.error("找不到目標任務");
  return;
}

// 2. 添加更詳細的技術說明
await mcp.mcp_shrimp_task_manager.update_task({
  taskId,
  description:
    "優化產品列表和用戶資料頁面的數據庫查詢性能，目標是將頁面載入時間從當前的2.5秒降低到1秒以內。技術要求：\n1. 分析並優化現有SQL查詢\n2. 添加適當的索引\n3. 實現查詢結果緩存\n4. 考慮使用數據庫讀寫分離\n5. 測量並報告性能改進",
  notes:
    "性能瓶頸主要出現在產品過濾和排序操作上，特別是當產品數量超過1000個時。可考慮使用Redis緩存熱門查詢結果。",
});

// 3. 複查更新後的任務描述
const updatedTask = await mcp.mcp_shrimp_task_manager.execute_task({
  taskId,
});

console.log("已更新的任務詳情:", updatedTask);
```

## 6. 任務相關文件位置記錄功能案例

### 案例：記錄複雜重構任務的相關文件

在進行大型代碼重構時，需要記錄涉及的所有相關文件，以便更好地跟蹤和管理變更。

#### 示例代碼：

```javascript
// 1. 建立重構任務
await mcp.mcp_shrimp_task_manager.split_tasks({
  isOverwrite: false,
  tasks: [
    {
      name: "重構認證系統",
      description:
        "將現有的基於Session的認證系統重構為JWT令牌認證，提高系統擴展性和安全性",
      notes: "重構過程中需確保向後兼容，不影響現有用戶",
    },
  ],
});

// 2. 獲取新創建的任務ID
const taskList = await mcp.mcp_shrimp_task_manager.list_tasks();
const taskIdMatch = taskList.content[0].text.match(
  /ID: `([^`]+)`.*名稱: "重構認證系統"/
);
const taskId = taskIdMatch ? taskIdMatch[1] : null;

if (!taskId) {
  console.error("找不到重構任務");
  return;
}

// 3. 記錄所有相關文件
await mcp.mcp_shrimp_task_manager.update_task_files({
  taskId,
  relatedFiles: [
    // 需要修改的核心文件
    {
      path: "src/services/authService.js",
      type: "待修改",
      description: "認證服務核心邏輯，需將session邏輯替換為JWT",
      lineStart: 24,
      lineEnd: 156,
    },
    {
      path: "src/middleware/auth.js",
      type: "待修改",
      description: "認證中間件，需更新驗證邏輯",
      lineStart: 5,
      lineEnd: 42,
    },
    {
      path: "src/controllers/userController.js",
      type: "待修改",
      description: "用戶控制器，需更新登入和註銷邏輯",
      lineStart: 78,
      lineEnd: 142,
    },

    // 參考資料
    {
      path: "docs/auth-system-design.md",
      type: "參考資料",
      description: "認證系統設計文檔，包含JWT切換的要求和規範",
    },
    {
      path: "package.json",
      type: "參考資料",
      description: "檢查已安裝的依賴，可能需要添加jsonwebtoken套件",
      lineStart: 10,
      lineEnd: 25,
    },

    // 依賴的組件
    {
      path: "src/utils/crypto.js",
      type: "依賴文件",
      description: "加密工具，JWT簽名將使用此模塊",
      lineStart: 15,
      lineEnd: 35,
    },

    // 需要創建的新文件
    {
      path: "src/config/jwt.js",
      type: "輸出結果",
      description: "新的JWT配置文件，需要創建",
    },
    {
      path: "src/utils/tokenManager.js",
      type: "輸出結果",
      description: "新的令牌管理工具，處理JWT的創建、驗證和刷新",
    },
  ],
});

// 4. 查看更新後的任務詳情
const taskWithFiles = await mcp.mcp_shrimp_task_manager.execute_task({
  taskId,
});

console.log("帶有相關文件信息的任務:", taskWithFiles);
```

### 案例：記錄 Bug 修復相關的代碼文件

在處理複雜 Bug 時，記錄相關文件位置以便快速定位問題。

#### 示例代碼：

```javascript
// 1. 創建bug修復任務
await mcp.mcp_shrimp_task_manager.split_tasks({
  isOverwrite: false,
  tasks: [
    {
      name: "修復購物車計算錯誤",
      description: "修復在添加多個相同產品到購物車時總價計算錯誤的問題",
      notes:
        "此問題只在特定情況下出現：當用戶添加同一產品超過10個且應用了折扣優惠",
    },
  ],
});

// 2. 獲取新創建的任務ID
const taskList = await mcp.mcp_shrimp_task_manager.list_tasks();
const taskIdMatch = taskList.content[0].text.match(
  /ID: `([^`]+)`.*名稱: "修復購物車計算錯誤"/
);
const taskId = taskIdMatch ? taskIdMatch[1] : null;

if (!taskId) {
  console.error("找不到bug修復任務");
  return;
}

// 3. 添加問題相關文件
await mcp.mcp_shrimp_task_manager.update_task_files({
  taskId,
  relatedFiles: [
    // 包含錯誤代碼的文件
    {
      path: "src/services/cartService.js",
      type: "待修改",
      description: "購物車服務，計算總價的邏輯有誤",
      lineStart: 87,
      lineEnd: 104,
    },
    {
      path: "src/utils/priceCalculator.js",
      type: "待修改",
      description: "價格計算工具，折扣邏輯實現有誤",
      lineStart: 45,
      lineEnd: 65,
    },

    // 測試用例
    {
      path: "tests/cart.test.js",
      type: "參考資料",
      description: "現有測試用例，需要擴展以覆蓋發現的錯誤場景",
      lineStart: 120,
      lineEnd: 150,
    },

    // 錯誤報告
    {
      path: "docs/bug-reports/cart-calculation-issue.md",
      type: "參考資料",
      description: "詳細的錯誤報告，包含用戶報告的具體場景和截圖",
    },
  ],
});

// 4. 執行任務，自動加載相關文件
await mcp.mcp_shrimp_task_manager.execute_task({
  taskId,
});
```

## 7. 優化任務執行時的上下文記憶功能案例

### 案例：處理跨多個文件的複雜任務

實現一個需要理解和修改多個相關文件的功能，利用增強的上下文記憶功能。

#### 示例代碼：

```javascript
// 1. 創建複雜任務
await mcp.mcp_shrimp_task_manager.split_tasks({
  isOverwrite: false,
  tasks: [
    {
      name: "實現多租戶數據隔離",
      description:
        "在現有系統中實現多租戶數據隔離功能，確保不同租戶的數據完全隔離，同時共享應用代碼和基礎設施",
      notes: "這是一項複雜的架構變更，需要修改多個核心組件",
    },
  ],
});

// 2. 獲取新創建的任務ID
const taskList = await mcp.mcp_shrimp_task_manager.list_tasks();
const taskIdMatch = taskList.content[0].text.match(
  /ID: `([^`]+)`.*名稱: "實現多租戶數據隔離"/
);
const taskId = taskIdMatch ? taskIdMatch[1] : null;

if (!taskId) {
  console.error("找不到多租戶任務");
  return;
}

// 3. 關聯核心相關文件
await mcp.mcp_shrimp_task_manager.update_task_files({
  taskId,
  relatedFiles: [
    // 數據庫連接和模型
    {
      path: "src/config/database.js",
      type: "待修改",
      description: "數據庫配置，需改為支持多租戶連接池",
      lineStart: 10,
      lineEnd: 45,
    },
    {
      path: "src/models/baseModel.js",
      type: "待修改",
      description: "所有模型的基類，需添加租戶ID過濾",
      lineStart: 5,
      lineEnd: 50,
    },

    // 中間件和上下文
    {
      path: "src/middleware/tenantContext.js",
      type: "輸出結果",
      description: "需要創建的新租戶上下文中間件",
    },
    {
      path: "src/utils/requestContext.js",
      type: "待修改",
      description: "請求上下文工具，需增加租戶信息傳遞",
      lineStart: 15,
      lineEnd: 40,
    },

    // 身份驗證相關
    {
      path: "src/services/authService.js",
      type: "待修改",
      description: "認證服務，需在令牌中包含租戶信息",
      lineStart: 50,
      lineEnd: 120,
    },
  ],
});

// 4. 執行任務，系統會自動加載相關文件和上下文
const executionResult = await mcp.mcp_shrimp_task_manager.execute_task({
  taskId,
});

// 5. 在任務執行過程中，發現需要更多相關文件，動態添加
await mcp.mcp_shrimp_task_manager.update_task_files({
  taskId,
  relatedFiles: [
    // 新發現的相關文件
    {
      path: "src/services/userService.js",
      type: "待修改",
      description: "用戶服務也需更新以支持多租戶",
      lineStart: 25,
      lineEnd: 75,
    },
    {
      path: "docs/architecture/multi-tenant-design.md",
      type: "參考資料",
      description: "多租戶架構設計文檔，提供實現指導",
    },
  ],
});

// 6. 繼續執行任務，系統會結合新添加的文件和之前的上下文
await mcp.mcp_shrimp_task_manager.execute_task({
  taskId,
});

// 7. 任務完成後，記錄完整的實現摘要
await mcp.mcp_shrimp_task_manager.complete_task({
  taskId,
  summary:
    "成功實現多租戶數據隔離功能，採用了基於中間件的動態租戶識別和數據過濾方案。主要更改包括：(1)實現了租戶上下文中間件，自動從請求中提取租戶標識；(2)增強了數據庫連接池，支持租戶專用連接；(3)修改了基礎模型類，所有查詢自動應用租戶過濾；(4)更新了認證服務，在JWT令牌中包含租戶信息；(5)實現了請求間租戶上下文的傳遞機制。所有修改均經過單元測試和集成測試驗證，確保數據完全隔離且性能影響最小化。",
});
```

### 案例：長時間進行的開發任務

在需要多次中斷和恢復的長期開發任務中，利用上下文記憶功能保持連續性。

#### 示例代碼：

```javascript
// 假設我們有一個已經進行了一段時間的長期任務
const taskId = "existing-long-term-task-id";

// 1. 恢復到之前的工作狀態，系統會自動加載任務相關文件和執行歷史
const taskContext = await mcp.mcp_shrimp_task_manager.execute_task({
  taskId,
});

console.log("恢復任務上下文:", taskContext);

// 2. 記錄新的發現和決策
const developmentLog = `
開發日誌 - ${new Date().toISOString()}

今天解決了用戶認證頁面的以下問題：
1. 修復了表單驗證錯誤信息不顯示的問題
2. 優化了密碼強度檢查算法
3. 決定使用漸進式登入延遲策略防止暴力破解

待解決問題：
- OAuth提供商回調處理邏輯複雜，需要重構
- 移動端視圖適配問題
`;

console.log(developmentLog);

// 3. 更新任務相關文件，記錄今天處理的內容
await mcp.mcp_shrimp_task_manager.update_task_files({
  taskId,
  relatedFiles: [
    // 今天修改的文件
    {
      path: "src/components/LoginForm.jsx",
      type: "待修改",
      description: "登入表單組件，已修復驗證錯誤顯示問題",
      lineStart: 45,
      lineEnd: 95,
    },
    {
      path: "src/utils/passwordStrength.js",
      type: "待修改",
      description: "密碼強度檢查工具，已優化算法",
      lineStart: 10,
      lineEnd: 50,
    },
    {
      path: "src/middleware/rateLimit.js",
      type: "待修改",
      description: "添加了漸進式登入延遲功能",
      lineStart: 25,
      lineEnd: 65,
    },

    // 明天需要處理的文件
    {
      path: "src/services/oauthService.js",
      type: "待修改",
      description: "OAuth服務需要重構，明天處理",
      lineStart: 80,
      lineEnd: 180,
    },
    {
      path: "src/styles/mobile.css",
      type: "待修改",
      description: "需要改進移動端樣式適配",
      lineStart: 120,
      lineEnd: 200,
    },
  ],
});

// 4. 更新任務注記，記錄進度和計劃
await mcp.mcp_shrimp_task_manager.update_task({
  taskId,
  notes:
    "已完成認證頁面的基本功能和安全增強。下一步將重構OAuth服務並改進移動端適配。預計還需3天完成所有計劃工作。",
});
```

## 結論

以上示例展示了蝦米任務管理器在不同場景下的使用方法。通過這些具體案例，您可以了解如何：

1. 使用刪除任務功能維護任務列表的整潔和準確性
2. 利用任務複雜度自適應處理功能合理規劃和分解複雜任務
3. 通過任務摘要自動更新機制記錄關鍵實施細節和決策
4. 使用工作日誌功能追蹤項目進展和關鍵決策點

這些功能共同提供了一個強大的任務管理框架，幫助您更有效地規劃、執行和監控項目。
