import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Recursively copy files with directory structure
async function copyFilesRecursive(src, dest) {
  try {
    const stats = await fs.promises.stat(src);
    
    if (stats.isDirectory()) {
      // Create destination directory if it doesn't exist
      await fs.promises.mkdir(dest, { recursive: true });
      
      // Read directory contents
      const items = await fs.promises.readdir(src);
      
      // Copy each item
      for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        await copyFilesRecursive(srcPath, destPath);
      }
    } else {
      // Copy file
      await fs.promises.copyFile(src, dest);
    }
  } catch (error) {
    console.error(`Error copying ${src} to ${dest}:`, error.message);
  }
}

// Copy markdown files
async function copyMarkdownFiles() {
  const srcDir = path.join(PROJECT_ROOT, "src");
  const destDir = path.join(PROJECT_ROOT, "dist");
  
  try {
    // Find all markdown files recursively
    async function findMarkdownFiles(dir, relativePath = "") {
      const items = await fs.promises.readdir(dir);
      const markdownFiles = [];
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativeItemPath = path.join(relativePath, item);
        const stats = await fs.promises.stat(fullPath);
        
        if (stats.isDirectory()) {
          markdownFiles.push(...await findMarkdownFiles(fullPath, relativeItemPath));
        } else if (item.endsWith('.md')) {
          markdownFiles.push({ src: fullPath, dest: path.join(destDir, relativeItemPath) });
        }
      }
      
      return markdownFiles;
    }
    
    const markdownFiles = await findMarkdownFiles(srcDir);
    
    // Copy each markdown file
    for (const { src, dest } of markdownFiles) {
      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
      await fs.promises.copyFile(src, dest);
      console.log(`📄 Copied: ${path.relative(PROJECT_ROOT, src)} → ${path.relative(PROJECT_ROOT, dest)}`);
    }
    
    console.log(`✅ Copied ${markdownFiles.length} markdown files`);
  } catch (error) {
    console.error("Error copying markdown files:", error.message);
  }
}

// Copy public files
async function copyPublicFiles() {
  const srcDir = path.join(PROJECT_ROOT, "src", "public");
  const destDir = path.join(PROJECT_ROOT, "dist", "public");
  
  try {
    await copyFilesRecursive(srcDir, destDir);
    console.log("✅ Copied public files");
  } catch (error) {
    console.error("Error copying public files:", error.message);
  }
}

// Main function
async function main() {
  console.log("🚀 Starting asset copy process...");
  
  await copyMarkdownFiles();
  await copyPublicFiles();
  
  console.log("✅ Asset copy process completed!");
}

main().catch(console.error);
