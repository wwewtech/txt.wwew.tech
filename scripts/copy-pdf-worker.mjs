import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(
  root,
  "node_modules",
  "pdfjs-dist",
  "legacy",
  "build",
  "pdf.worker.min.mjs"
);
const publicDir = path.join(root, "public");
const targetPath = path.join(publicDir, "pdf.worker.min.mjs");

await mkdir(publicDir, { recursive: true });
await copyFile(sourcePath, targetPath);

console.log("Copied pdf.worker.min.mjs to /public");