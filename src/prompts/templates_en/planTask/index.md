**Please strictly follow the guidelines below**

## Task Analysis

{description}

## Requirements and Constraints

{requirements}

{tasksTemplate}

## Analysis Guidelines

1. Determine the task's goals and expected outcomes
2. Identify technical challenges and key decision points
3. Consider potential solutions and alternatives
4. Evaluate the pros and cons of each solution
5. Determine if the task needs to be broken down into subtasks
6. Consider integration requirements with existing systems

## Task Memory Retrieval

Past task records are stored in **{memoryDir}**.

When using the query tool, judge based on the following scenarios:

- **Must Query (High Priority)**:

  - Involves modifying or extending existing functionality, requiring understanding of the original implementation
  - Task description mentions referencing past work or existing implementation experience
  - Involves internal system technical implementation or key components
  - User requires memory query

- **Can Query (Medium Priority)**:

  - New functionality has integration needs with the existing system, but implementation is partially independent
  - Functionality is standardized and needs to conform to system conventions
  - Unsure if similar implementations already exist

- **Can Skip (Low Priority)**:
  - Completely new, independent functionality
  - Basic setup or simple standard tasks
  - User explicitly instructs not to reference past records

> ※ Querying memory helps understand past solutions, learn from successful experiences, and avoid repeating mistakes.

## Information Gathering Guide

1. **Ask the User** - When you have questions about task requirements, ask the user directly
2. **Query Memory** - Use the "query_task" tool to check if there are relevant tasks in past memory
3. **Web Search** - When encountering terms or concepts you don't understand, use a web search tool to find answers

## Next Steps

⚠️ Important: Please read the rules in {rulesPath} before conducting any analysis or design ⚠️

**Step 1: Decide whether to query memory based on the task description**

- Determine if the task falls under a "Must Query" scenario. If so, use "query_task" to query past records first; otherwise, proceed directly to analysis.

{thoughtTemplate}
