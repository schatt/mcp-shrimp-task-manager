[English](README.md) | [中文](docs/zh/README.md)

# MCP Shrimp Task Manager

[![smithery badge](https://smithery.ai/badge/@cjo4m06/mcp-shrimp-task-manager)](https://smithery.ai/server/@cjo4m06/mcp-shrimp-task-manager)

> 🚀 An intelligent task management system based on Model Context Protocol (MCP), providing an efficient programming workflow framework for AI Agents.

Shrimp Task Manager guides Agents through structured workflows for systematic programming, enhancing task memory management mechanisms, and effectively avoiding redundant and repetitive coding work.

## ✨ Features

- **Task Planning and Analysis**: Deep understanding and analysis of complex task requirements
- **Intelligent Task Decomposition**: Automatically break down large tasks into manageable smaller tasks
- **Dependency Management**: Precisely handle dependencies between tasks, ensuring correct execution order
- **Execution Status Tracking**: Real-time monitoring of task execution progress and status
- **Task Completeness Verification**: Ensure task results meet expected requirements
- **Task Complexity Assessment**: Automatically evaluate task complexity and provide optimal handling suggestions
- **Automatic Task Summary Updates**: Automatically generate summaries upon task completion, optimizing memory performance
- **Task Memory Function**: Automatically backup task history, providing long-term memory and reference capabilities

## 🔄 Task Management Workflow

The system provides a complete task management lifecycle:

1. **Start Planning** `plan_task`: Analyze task problems, determine requirement scope
2. **In-depth Analysis** `analyze_task`: Check existing codebase to avoid duplicate work
3. **Solution Reflection** `reflect_task`: Critically review analysis results, ensure comprehensive solutions
4. **Task Decomposition** `split_tasks`: Break down complex tasks into smaller ones, establish clear dependencies
5. **Task List** `list_tasks`: View all tasks and their execution status
6. **Execute Task** `execute_task`: Execute specific tasks while assessing complexity
7. **Result Verification** `verify_task`: Comprehensively check task completion
8. **Task Completion** `complete_task`: Mark tasks as complete and generate reports, automatically update summaries
9. **Task Management** `delete_task`: Manage incomplete tasks (completed tasks remain in the system)
10. **Query Tasks** `query_task`: Search for related tasks in past memories using keywords
11. **Display Task** `get_task_detail`: Display complete task guidance

## 🧠 Task Memory Function

Shrimp Task Manager has long-term memory capabilities, automatically saving task execution history and providing reference experiences when planning new tasks.

### Key Features

- The system automatically backs up tasks to the memory directory
- Backup files are named in chronological order, in the format tasks_backup_YYYY-MM-DDThh-mm-ss.json
- Task planning Agents automatically receive guidance on how to use the memory function

### Advantages and Benefits

- **Avoid Duplicate Work**: Reference past tasks, no need to solve similar problems from scratch
- **Learn from Successful Experiences**: Utilize proven effective solutions, improve development efficiency
- **Learning and Improvement**: Identify past mistakes or inefficient solutions, continuously optimize workflows
- **Knowledge Accumulation**: Form a continuously expanding knowledge base as system usage increases

Through effective use of the task memory function, the system can continuously accumulate experience, with intelligence level and work efficiency continuously improving.

## 📚 Documentation Resources

- [System Architecture](docs/en/architecture.md): Detailed system design and data flow explanation
- [Prompt Customization Guide](docs/en/prompt-customization.md): Instructions for customizing tool prompts via environment variables

## 🔧 Installation and Usage

### Installing via Smithery

To install Shrimp Task Manager for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@cjo4m06/mcp-shrimp-task-manager):

```bash
npx -y @smithery/cli install @cjo4m06/mcp-shrimp-task-manager --client claude
```

### Manual Installation

```bash
# Install dependencies
npm install

# Build and start service
npm run build
```

## 🔌 Using with MCP-Compatible Clients

Shrimp Task Manager can be used with any client that supports the Model Context Protocol, such as Cursor IDE.

### Configuration in Cursor IDE

Shrimp Task Manager offers two configuration methods: global configuration and project-specific configuration.

#### Global Configuration

1. Open the Cursor IDE global configuration file (usually located at `~/.cursor/mcp.json`)
2. Add the following configuration in the `mcpServers` section:

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "/path/to/project/data" // 必須使用絕對路徑
      }
    }
  }
}


or

{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "npx",
      "args": ["@siage/shrimp-task-manager"],
      "env": {
        "DATA_DIR": "/mcp-shrimp-task-manager/data"
      }
    }
  }
}
```

> ⚠️ Please replace `/mcp-shrimp-task-manager` with your actual path.

#### Project-Specific Configuration

You can also set up dedicated configurations for each project to use independent data directories for different projects:

1. Create a `.cursor` directory in the project root
2. Create an `mcp.json` file in this directory with the following content:

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/path/to/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "/path/to/project/data" // Must use absolute path
      }
    }
  }
}


or

{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "npx",
      "args": ["@siage/shrimp-task-manager"],
      "env": {
        "DATA_DIR": "/path/to/project/data" // 必須使用絕對路徑
      }
    }
  }
}
```

### ⚠️ Important Configuration Notes

The **DATA_DIR parameter** is the directory where Shrimp Task Manager stores task data, conversation logs, and other information. Setting this parameter correctly is crucial for the normal operation of the system. This parameter must use an **absolute path**; using a relative path may cause the system to incorrectly locate the data directory, resulting in data loss or function failure.

> **Warning**: Using relative paths may cause the following issues:
>
> - Data files not found, causing system initialization failure
> - Task status loss or inability to save correctly
> - Inconsistent application behavior across different environments
> - System crashes or failure to start

### 🔧 Environment Variable Configuration

Shrimp Task Manager supports customizing prompt behavior through environment variables, allowing you to fine-tune AI assistant responses without modifying code. You can set these variables in the configuration or through an `.env` file:

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/path/to/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "/path/to/project/data",
        "MCP_PROMPT_PLAN_TASK": "Custom planning guidance...",
        "MCP_PROMPT_EXECUTE_TASK_APPEND": "Additional execution instructions...",
        "ENABLE_THOUGHT_CHAIN": "true"
      }
    }
  }
}
```

There are two customization methods:

- **Override Mode** (`MCP_PROMPT_[FUNCTION_NAME]`): Completely replace the default prompt
- **Append Mode** (`MCP_PROMPT_[FUNCTION_NAME]_APPEND`): Add content to the existing prompt

Additionally, there are other system configuration variables:

- **DATA_DIR**: Specifies the directory where task data is stored
- **ENABLE_THOUGHT_CHAIN**: Controls the thinking model in task planning workflow. When set to `true` (default), the system guides users to use the `process_thought` tool for step-by-step reasoning. When set to `false`, the system directly uses `analyze_task` to submit analysis results, skipping the detailed thinking process.

For detailed instructions on customizing prompts, including supported parameters and examples, see the [Prompt Customization Guide](docs/en/prompt-customization.md).

## 💡 System Prompt Guidance

### Cursor IDE Configuration

You can enable Cursor Settings => Features => Custom modes, and configure the following two modes:

#### TaskPlanner Mode

```
You are a professional task planning expert. You must interact with users, analyze their needs, and collect project-related information. Finally, you must use "plan_task" to create tasks. When the task is created, you must summarize it and inform the user to use the "TaskExecutor" mode to execute the task.
You must focus on task planning. Do not use "execute_task" to execute tasks.
Serious warning: you are a task planning expert, you cannot modify the program code directly, you can only plan tasks, and you cannot modify the program code directly, you can only plan tasks.
```

#### TaskExecutor Mode

```
You are a professional task execution expert. When a user specifies a task to execute, use "execute_task" to execute the task.
If no task is specified, use "list_tasks" to find unexecuted tasks and execute them.
When the execution is completed, a summary must be given to inform the user of the conclusion.
You can only perform one task at a time, and when a task is completed, you are prohibited from performing the next task unless the user explicitly tells you to.
If the user requests "continuous mode", all tasks will be executed in sequence.
```

> 💡 Choose the appropriate mode based on your needs:
>
> - Use **TaskPlanner** mode when planning tasks
> - Use **TaskExecutor** mode when executing tasks

### Using with Other Tools

If your tool doesn't support Custom modes, you can:

- Manually paste the appropriate prompts at different stages
- Or directly use simple commands like `Please plan the following task: ......` or `Please start executing the task...`

## 🛠️ Available Tools Overview

After configuration, you can use the following tools:

| Category                | Tool Name         | Description                            |
| ----------------------- | ----------------- | -------------------------------------- |
| **Task Planning**       | `plan_task`       | Start planning tasks                   |
| **Task Analysis**       | `analyze_task`    | In-depth analysis of task requirements |
| **Solution Assessment** | `reflect_task`    | Reflect and improve solution concepts  |
| **Task Management**     | `split_tasks`     | Break tasks into subtasks              |
|                         | `list_tasks`      | Display all tasks and status           |
|                         | `query_task`      | Search and list tasks                  |
|                         | `get_task_detail` | Display complete task details          |
|                         | `delete_task`     | Delete incomplete tasks                |
| **Task Execution**      | `execute_task`    | Execute specific tasks                 |
|                         | `verify_task`     | Verify task completion                 |
|                         | `complete_task`   | Mark tasks as completed                |

## 🔧 Technical Implementation

- **Node.js**: High-performance JavaScript runtime environment
- **TypeScript**: Provides type-safe development environment
- **MCP SDK**: Interface for seamless interaction with large language models
- **UUID**: Generate unique and reliable task identifiers

## 📄 License

This project is released under the MIT License
