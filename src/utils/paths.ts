import path from "path";
import { fileURLToPath } from "url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import fs from "fs";

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

  // Handle process.env.DATA_DIR
  if (process.env.DATA_DIR) {
    if (path.isAbsolute(process.env.DATA_DIR)) {
      // For absolute DATA_DIR: return DATA_DIR/<last folder name of rootPath>
      if (rootPath) {
        const lastFolderName = path.basename(rootPath);
        const finalPath = path.join(process.env.DATA_DIR, lastFolderName);
        return finalPath;
      } else {
        // Without rootPath, return DATA_DIR directly
        return process.env.DATA_DIR;
      }
    } else {
      // For relative DATA_DIR: return rootPath/DATA_DIR or PROJECT_ROOT/DATA_DIR
      if (rootPath) {
        return path.join(rootPath, process.env.DATA_DIR);
      } else {
        // Without rootPath, use PROJECT_ROOT
        return path.join(PROJECT_ROOT, process.env.DATA_DIR);
      }
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
