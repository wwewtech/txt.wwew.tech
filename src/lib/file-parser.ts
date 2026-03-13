import JSZip from "jszip";
import mammoth from "mammoth";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { createId } from "./utils";

export type ParseSettings = {
  ignoredDirectories: string[];
  excludedExtensions: string[];
};

export type ParsedItem = {
  id: string;
  name: string;
  path: string;
  size: number;
  kind: "file" | "archive";
  text: string;
  tokenEstimate: number;
  sourceType: string;
  addedAt?: string;
  children?: ParsedItem[];
  error?: string;
};

const textExtensions = new Set([
  "txt",
  "md",
  "json",
  "js",
  "ts",
  "tsx",
  "jsx",
  "css",
  "scss",
  "html",
  "xml",
  "yaml",
  "yml",
  "csv",
  "log",
  "py",
  "java",
  "go",
  "rs",
  "c",
  "cpp",
  "h",
  "hpp",
  "php",
  "rb",
  "sql",
  "toml",
  "ini",
  "env",
  "sh",
  "bat",
  "ps1",
]);

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function getExt(path: string) {
  const normalized = path.replaceAll("\\", "/");
  const fileName = normalized.split("/").pop() ?? normalized;
  const index = fileName.lastIndexOf(".");
  if (index === -1) return "";
  if (index === fileName.length - 1) return "";
  return fileName.slice(index + 1).toLowerCase();
}

export function isIgnoredPath(path: string, settings: ParseSettings) {
  const normalized = path.replaceAll("\\", "/").toLowerCase();
  const segments = normalized.split("/");

  if (
    settings.ignoredDirectories.some((dir) =>
      segments.includes(dir.trim().toLowerCase())
    )
  ) {
    return true;
  }

  const ext = getExt(normalized);
  const excludedExtensions = settings.excludedExtensions
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (ext && excludedExtensions.includes(ext)) {
    return true;
  }

  return false;
}

function toId() {
  return createId();
}

function decorateForLlm(path: string, content: string) {
  return `### FILE: ${path}\n\n${content.trim()}\n`;
}

type PdfTextItemLike = {
  str?: unknown;
  hasEOL?: unknown;
  transform?: unknown;
  height?: unknown;
  width?: unknown;
};

function collapseSpacedPdfWord(match: string) {
  const parts = match.split(/\s+/).filter(Boolean);
  const singleLetterParts = parts.filter((part) => part.length === 1).length;
  const shouldCollapse =
    parts.length >= 4 &&
    singleLetterParts >= Math.ceil(parts.length / 2) &&
    parts.every((part) => /^[A-Za-zА-Яа-яЁё]{1,3}$/.test(part));

  return shouldCollapse ? parts.join("") : match;
}

function cleanPdfText(text: string) {
  if (!text.trim()) return "";

  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\[Page \d+\]/gi, "")
    .replace(/^\s*\d+\s*$/gm, "")
    .replace(/-\s*\n\s*/g, "")
    .replace(
      /\b(?:[A-Za-zА-Яа-яЁё]{1,3}\s+){3,}[A-Za-zА-Яа-яЁё]{1,3}\b/g,
      collapseSpacedPdfWord
    )
    .replace(/\s+([.,!?:;])/g, "$1")
    .replace(/([A-Za-zА-Яа-яЁё])\s*\.\s*([A-Za-zА-Яа-яЁё])/g, "$1.$2")
    .replace(/([,!?:;])(?=[^\s\n])/g, "$1 ")
    .replace(/([\p{L}\p{N}])\s[-–—]\s([\p{L}\p{N}])/gu, "$1-$2")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/([^\n])\s•/g, "$1\n•")
    .replace(/([^\n])\s(\d+\.)/g, "$1\n$2")
    .replace(/(^|\n)(\d+\.)(?=\S)/g, "$1$2 ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

function shouldInsertSpaceBetweenPdfItems(
  previousToken: string,
  nextToken: string,
  gap: number,
  itemHeight: number
) {
  if (!previousToken || !nextToken) return false;
  if (previousToken === "•") return true;
  if (/^[.,!?:;)\]%]/.test(nextToken)) return false;
  if (/^[([{]$/.test(previousToken)) return false;
  if (/^[-–—]$/.test(previousToken) || /^[-–—]$/.test(nextToken)) {
    return gap > Math.max(1, itemHeight * 0.75);
  }
  if (gap <= Math.max(1, itemHeight * 0.45)) return false;
  return /[\p{L}\p{N}]$/u.test(previousToken) && /^[\p{L}\p{N}]/u.test(nextToken);
}

function formatPdfPageText(items: PdfTextItemLike[]) {
  let pageText = "";
  let previousY: number | null = null;
  let previousXEnd: number | null = null;
  let previousHeight: number | null = null;
  let previousToken = "";

  for (const item of items) {
    const raw = typeof item.str === "string" ? item.str : "";
    const token = raw.replace(/\s+/g, " ").trim();
    if (!token) continue;

    const y =
      Array.isArray(item.transform) && typeof item.transform[5] === "number"
        ? item.transform[5]
        : null;
    const x =
      Array.isArray(item.transform) && typeof item.transform[4] === "number"
        ? item.transform[4]
        : null;
    const itemHeight = typeof item.height === "number" ? item.height : 10;
    const itemWidth = typeof item.width === "number" ? item.width : token.length * (itemHeight * 0.5);

    if (previousY !== null && y !== null) {
      const dy = Math.abs(y - previousY);
      if (dy > itemHeight * 0.5) {
        pageText += dy > itemHeight * 1.5 ? "\n\n" : "\n";
        previousXEnd = null;
      } else {
        const gap = x !== null && previousXEnd !== null ? x - previousXEnd : 0;
        if (
          shouldInsertSpaceBetweenPdfItems(
            previousToken,
            token,
            gap,
            previousHeight ?? itemHeight
          ) &&
          !pageText.endsWith(" ") &&
          !pageText.endsWith("\n")
        ) {
          pageText += " ";
        }
      }
    }

    pageText += token;

    if (item.hasEOL === true) {
      pageText += "\n";
      previousXEnd = null;
    }

    if (y !== null) {
      previousY = y;
    }
    if (x !== null) {
      previousXEnd = x + itemWidth;
    }
    previousHeight = itemHeight;
    previousToken = token;
  }

  return pageText.trim();
}

async function parsePdf(file: Blob) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc ||= "/pdf.worker.min.mjs";
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const pdf = await loadingTask.promise;
  const chunks: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const text = await page.getTextContent();
    const pageText = formatPdfPageText(text.items as PdfTextItemLike[]);
    chunks.push(`\n[Page ${pageNum}]\n${pageText}`);
  }

  return cleanPdfText(chunks.join("\n"));
}

async function parseDocx(file: Blob) {
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  turndown.use(gfm);

  const markdown = turndown.turndown(htmlResult.value || "").trim();
  if (markdown) return markdown;

  const fallback = await mammoth.extractRawText({ arrayBuffer });
  return fallback.value.trim();
}

async function parseBlob(path: string, blob: Blob, size: number, settings: ParseSettings): Promise<ParsedItem> {
  const ext = getExt(path);

  if (isIgnoredPath(path, settings)) {
    return {
      id: toId(),
      name: path.split("/").at(-1) ?? path,
      path,
      size,
      kind: "file",
      sourceType: ext || "unknown",
      text: "",
      tokenEstimate: 0,
      error: "Skipped by filters",
    };
  }

  try {
    let content = "";

    if (ext === "pdf") {
      content = await parsePdf(blob);
    } else if (ext === "docx") {
      content = await parseDocx(blob);
    } else if (textExtensions.has(ext) || blob.type.startsWith("text/")) {
      content = await blob.text();
    } else {
      return {
        id: toId(),
        name: path.split("/").at(-1) ?? path,
        path,
        size,
        kind: "file",
        sourceType: ext || "unknown",
        text: "",
        tokenEstimate: 0,
        error: "Unsupported format",
      };
    }

    const llmText = decorateForLlm(path, content);

    return {
      id: toId(),
      name: path.split("/").at(-1) ?? path,
      path,
      size,
      kind: "file",
      sourceType: ext || "unknown",
      text: llmText,
      tokenEstimate: estimateTokens(llmText),
    };
  } catch (error) {
    return {
      id: toId(),
      name: path.split("/").at(-1) ?? path,
      path,
      size,
      kind: "file",
      sourceType: ext || "unknown",
      text: "",
      tokenEstimate: 0,
      error: error instanceof Error ? error.message : "Parse error",
    };
  }
}

export async function parseFileWithPath(file: File, path: string, settings: ParseSettings) {
  const ext = getExt(path);

  if (ext === "zip") {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const parsedChildren: ParsedItem[] = [];

    const entries = Object.values(zip.files).filter((entry) => !entry.dir);
    for (const entry of entries) {
      const blob = await entry.async("blob");
      const parsed = await parseBlob(`${path}/${entry.name}`, blob, blob.size, settings);
      if (!parsed.error || parsed.error === "Skipped by filters") {
        parsedChildren.push(parsed);
      }
    }

    const text = parsedChildren
      .filter((item) => item.text)
      .map((item) => item.text)
      .join("\n\n");

    return {
      id: toId(),
      name: file.name,
      path,
      size: file.size,
      kind: "archive" as const,
      sourceType: "zip",
      children: parsedChildren,
      text,
      tokenEstimate: estimateTokens(text),
    };
  }

  return parseBlob(path, file, file.size, settings);
}

export function combineToFinalTxt(
  items: ParsedItem[],
  userPrompt: string,
  generatedAt?: string
) {
  const header = [
    "# LLM Context Bundle",
    generatedAt ? `Generated: ${generatedAt}` : undefined,
    userPrompt.trim() ? `Prompt: ${userPrompt.trim()}` : "Prompt: (empty)",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  const body = items
    .flatMap((item) => {
      if (item.kind === "archive") {
        return [
          `## ARCHIVE: ${item.path}`,
          item.children
            ?.filter((child) => child.text)
            .map((child) => child.text)
            .join("\n\n") ?? "",
        ].join("\n\n");
      }
      return item.text;
    })
    .filter(Boolean)
    .join("\n\n");

  return `${header}${body}`.trim();
}