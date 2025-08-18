import path from "path";
import { fileURLToPath } from "url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import fs from "fs";
import { getProjectDataDir, getProjectTasksFilePath, getProjectMemoryDir } from "../models/projectModel.js";

// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");

// Global server instance
let globalServer: Server | null = null;

/**
 * Set the global server instance
 */
export function setGlobalServer(server: Server): void {
  globalServer = server;
}

/**
 * Get the global server instance
 */
export function getGlobalServer(): Server | null {
  return globalServer;
}

/**
 * Resolve DATA_DIR path.
 * If a server exists and supports listRoots, use the first file:// root + "/data".
 * Otherwise, fall back to env or project root.
 */
export async function getDataDir(): Promise<string> {
  // Prioritize DATA_DIR environment variable to avoid MCP server issues
  if (process.env.DATA_DIR) {
    if (path.isAbsolute(process.env.DATA_DIR)) {
      return process.env.DATA_DIR;
    } else {
      // For relative DATA_DIR, use PROJECT_ROOT
      return path.join(PROJECT_ROOT, process.env.DATA_DIR);
    }
  }

  const server = getGlobalServer();
  let rootPath: string | null = null;

  if (server) {
    try {
      const roots = await server.listRoots();

      // Find the first file:// root
      if (roots.roots && roots.roots.length > 0) {
        const firstFileRoot = roots.roots.find((root) =>
          root.uri.startsWith("file://")
        );
        if (firstFileRoot) {
          // Extract actual path from file:// URI
          // Windows: file:///C:/path -> C:/path
          // Unix: file:///path -> /path
          if (process.platform === 'win32') {
            rootPath = firstFileRoot.uri.replace("file:///", "").replace(/\//g, "\\");
          } else {
            rootPath = firstFileRoot.uri.replace("file://", "");
          }
        }
      }
    } catch (error) {
      // Silently handle error - console not supported in MCP
    }
  }

  // Default logic when DATA_DIR is not set
  if (rootPath) {
    return path.join(rootPath, "data");
  }

  // Finally, fall back to project root
  return path.join(PROJECT_ROOT, "data");
}

/**
 * Get tasks file path
 */
export async function getTasksFilePath(): Promise<string> {
  const dataDir = await getDataDir();
  return path.join(dataDir, "tasks.json");
}

/**
 * Get memory directory path
 */
export async function getMemoryDir(): Promise<string> {
  const dataDir = await getDataDir();
  return path.join(dataDir, "memory");
}

/**
 * Get project-aware memory directory path
 */
export async function getProjectMemoryDirPath(projectName?: string): Promise<string> {
  return await getProjectMemoryDir(projectName);
}

/**
 * Get project-aware tasks file path
 */
export async function getProjectTasksFilePathPath(projectName?: string): Promise<string> {
  return await getProjectTasksFilePath(projectName);
}

/**
 * Get project-aware data directory
 */
export async function getProjectDataDirPath(projectName?: string): Promise<string> {
  return await getProjectDataDir(projectName);
}

/**
 * Get WebGUI file path
 */
export async function getWebGuiFilePath(): Promise<string> {
  const dataDir = await getDataDir();
  return path.join(dataDir, "WebGUI.md");
}

/**
 * Get project root
 */
export function getProjectRoot(): string {
  return PROJECT_ROOT;
}
