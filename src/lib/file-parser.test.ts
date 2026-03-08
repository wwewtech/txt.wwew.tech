import JSZip from "jszip";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pdfMocks = vi.hoisted(() => ({
  getDocument: vi.fn(),
  getPage: vi.fn(),
  getTextContent: vi.fn(),
}));

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: pdfMocks.getDocument,
}));

vi.mock("mammoth", () => ({
  default: {
    convertToHtml: vi.fn().mockResolvedValue({ value: "<p>DOCX CONTENT</p>" }),
    extractRawText: vi.fn().mockResolvedValue({ value: "DOCX CONTENT" }),
  },
}));

import mammoth from "mammoth";

import {
  combineToFinalTxt,
  estimateTokens,
  getExt,
  isIgnoredPath,
  parseFileWithPath,
  type ParsedItem,
} from "@/lib";

const settings = {
  ignoredDirectories: ["node_modules", ".git"],
  excludedExtensions: ["lock", "exe"],
};

async function buildZip(entries: Array<{ path: string; content: string }>) {
  const zip = new JSZip();
  entries.forEach((entry) => {
    zip.file(entry.path, entry.content);
  });
  const data = await zip.generateAsync({ type: "uint8array" });
  return new File([data], "bundle.zip", { type: "application/zip" });
}

function mockPdfPages(pages: Array<Array<Record<string, unknown>>>) {
  pdfMocks.getPage.mockImplementation(async (pageNum: number) => ({
    getTextContent: vi.fn().mockResolvedValue({
      items: pages[pageNum - 1] ?? [],
    }),
  }));
  pdfMocks.getDocument.mockReturnValue({
    promise: Promise.resolve({
      numPages: pages.length,
      getPage: pdfMocks.getPage,
    }),
  });
}

describe("file-parser business logic", () => {
  beforeEach(() => {
    pdfMocks.getDocument.mockReset();
    pdfMocks.getPage.mockReset();
    pdfMocks.getTextContent.mockReset();
    vi.mocked(mammoth.convertToHtml).mockReset();
    vi.mocked(mammoth.extractRawText).mockReset();
    vi.mocked(mammoth.convertToHtml).mockResolvedValue({ value: "<p>DOCX CONTENT</p>" });
    vi.mocked(mammoth.extractRawText).mockResolvedValue({ value: "DOCX CONTENT" });
  });

  it("estimateTokens returns at least 1", () => {
    expect(estimateTokens("")).toBe(1);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcde")).toBe(2);
  });

  it("getExt normalizes extension to lowercase", () => {
    expect(getExt("dir/sample.TSX")).toBe("tsx");
    expect(getExt("no-extension")).toBe("");
  });

  it.each([
    ["archive.tar.gz", "gz"],
    ["/nested/path/file.JSON", "json"],
    ["C:/tmp/report.FINAL.Docx", "docx"],
    [".env.local", "local"],
    ["folder.name/readme", ""],
    ["multi.part.name.test.ts", "ts"],
  ])("extracts extension correctly for %s", (path, expected) => {
    expect(getExt(path)).toBe(expected);
  });

  it("returns empty extension when dot appears only in parent directory", () => {
    expect(getExt("workspace.v2/src/readme")).toBe("");
    expect(getExt("workspace.v2/src/readme.")).toBe("");
  });

  it("isIgnoredPath ignores by directory", () => {
    expect(isIgnoredPath("project/node_modules/a.ts", settings)).toBe(true);
    expect(isIgnoredPath("project/src/a.ts", settings)).toBe(false);
  });

  it("isIgnoredPath ignores by extension", () => {
    expect(isIgnoredPath("project/yarn.lock", settings)).toBe(true);
    expect(isIgnoredPath("project/file.txt", settings)).toBe(false);
  });

  it.each([
    ["PROJECT/NODE_MODULES/a.ts", true],
    ["project/.GIT/config", true],
    ["project/src/index.EXE", true],
    ["project/src/index.lock", true],
    ["project/src/index.ts", false],
    ["project/src/node_modules_like/index.ts", false],
  ])("resolves ignore rules for %s", (path, expected) => {
    expect(isIgnoredPath(path, settings)).toBe(expected);
  });

  it("handles ignore settings with extra spaces", () => {
    const custom = {
      ignoredDirectories: ["  cache  ", " tmp"],
      excludedExtensions: [" log  ", "bak "],
    };

    expect(isIgnoredPath("a/cache/file.ts", custom)).toBe(true);
    expect(isIgnoredPath("a/tmp/file.ts", custom)).toBe(true);
    expect(isIgnoredPath("a/file.LOG", custom)).toBe(true);
    expect(isIgnoredPath("a/file.bak", custom)).toBe(true);
    expect(isIgnoredPath("a/file.ts", custom)).toBe(false);
  });

  it("parses text file and decorates llm payload", async () => {
    const file = new File(["hello parser"], "note.txt", { type: "text/plain" });
    const result = await parseFileWithPath(file, "notes/note.txt", settings);

    expect(result.kind).toBe("file");
    expect(result.error).toBeUndefined();
    expect(result.text).toContain("### FILE: notes/note.txt");
    expect(result.text).toContain("hello parser");
    expect(result.tokenEstimate).toBeGreaterThan(0);
  });

  it("parses text/* mime even without extension", async () => {
    const file = new File(["plain text payload"], "README", { type: "text/plain" });
    const result = await parseFileWithPath(file, "README", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("### FILE: README");
    expect(result.sourceType).toBe("unknown");
  });

  it("parses known source extension with unknown mime", async () => {
    const file = new File(["export const x = 1;"], "index.ts", { type: "application/octet-stream" });
    const result = await parseFileWithPath(file, "src/index.ts", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("export const x = 1;");
    expect(result.sourceType).toBe("ts");
  });

  it("trims source content in llm decoration", async () => {
    const file = new File(["\n\n  hello world  \n\n"], "trim.txt", { type: "text/plain" });
    const result = await parseFileWithPath(file, "trim.txt", settings);

    expect(result.text).toContain("### FILE: trim.txt\n\nhello world\n");
    expect(result.text).not.toContain("\n\n\n");
  });

  it("parses empty text file into non-empty llm block", async () => {
    const file = new File([""], "empty.txt", { type: "text/plain" });
    const result = await parseFileWithPath(file, "empty.txt", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("### FILE: empty.txt");
    expect(result.tokenEstimate).toBeGreaterThan(0);
  });

  it("returns skipped marker for filtered file", async () => {
    const file = new File(["ignored"], "yarn.lock", { type: "text/plain" });
    const result = await parseFileWithPath(file, "project/yarn.lock", settings);

    expect(result.error).toBe("Skipped by filters");
    expect(result.tokenEstimate).toBe(0);
  });

  it("returns unsupported format for unknown binary", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "bin.data", {
      type: "application/octet-stream",
    });
    const result = await parseFileWithPath(file, "bin.data", settings);

    expect(result.error).toBe("Unsupported format");
    expect(result.text).toBe("");
  });

  it("parses docx via mammoth extractor", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "doc.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const result = await parseFileWithPath(file, "docs/doc.docx", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("DOCX CONTENT");
    expect(result.sourceType).toBe("docx");
  });

  it("converts docx html output into markdown", async () => {
    vi.mocked(mammoth.convertToHtml).mockResolvedValueOnce({
      value: "<h1>Title</h1><p>Body</p><ul><li>First</li><li>Second</li></ul>",
    });

    const file = new File([new Uint8Array([1, 2, 3])], "rich.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const result = await parseFileWithPath(file, "docs/rich.docx", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("# Title");
    expect(result.text).toContain("Body");
    expect(result.text).toMatch(/-\s+First/);
    expect(result.text).toMatch(/-\s+Second/);
  });

  it("falls back to mammoth raw text when docx html output is empty", async () => {
    vi.mocked(mammoth.convertToHtml).mockResolvedValueOnce({ value: "" });
    vi.mocked(mammoth.extractRawText).mockResolvedValueOnce({ value: "RAW DOCX CONTENT" });

    const file = new File([new Uint8Array([1, 2, 3])], "fallback.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const result = await parseFileWithPath(file, "docs/fallback.docx", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("RAW DOCX CONTENT");
    expect(mammoth.extractRawText).toHaveBeenCalledTimes(1);
  });

  it("keeps a valid llm block for an empty docx result", async () => {
    vi.mocked(mammoth.convertToHtml).mockResolvedValueOnce({ value: "" });
    vi.mocked(mammoth.extractRawText).mockResolvedValueOnce({ value: "" });

    const file = new File([new Uint8Array([1, 2, 3])], "empty.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const result = await parseFileWithPath(file, "docs/empty.docx", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("### FILE: docs/empty.docx");
    expect(result.tokenEstimate).toBeGreaterThan(0);
  });

  it("normalizes extracted pdf text into readable prose", async () => {
    pdfMocks.getTextContent.mockResolvedValue({
      items: [
        { str: "Аннотация", transform: [1, 0, 0, 1, 10, 720], height: 16, width: 80 },
        { str: "В", transform: [1, 0, 0, 1, 10, 680], height: 12, width: 8 },
        { str: "э", transform: [1, 0, 0, 1, 25, 680], height: 12, width: 8 },
        { str: "ксперименте", transform: [1, 0, 0, 1, 38, 680], height: 12, width: 90 },
        { str: "использовались", transform: [1, 0, 0, 1, 140, 680], height: 12, width: 110 },
        { str: "SPA", transform: [1, 0, 0, 1, 10, 664], height: 12, width: 28 },
        { str: "-", transform: [1, 0, 0, 1, 44, 664], height: 12, width: 6 },
        { str: "приложения.", transform: [1, 0, 0, 1, 55, 664], height: 12, width: 86 },
        { str: "•", transform: [1, 0, 0, 1, 10, 628], height: 12, width: 8 },
        { str: "Lazy", transform: [1, 0, 0, 1, 26, 628], height: 12, width: 36 },
        { str: "Loading", transform: [1, 0, 0, 1, 68, 628], height: 12, width: 52 },
        { str: "•", transform: [1, 0, 0, 1, 10, 612], height: 12, width: 8 },
        { str: "Greedy", transform: [1, 0, 0, 1, 26, 612], height: 12, width: 46 },
        { str: "Prefetching", transform: [1, 0, 0, 1, 78, 612], height: 12, width: 74 },
        { str: "2", transform: [1, 0, 0, 1, 10, 580], height: 10, width: 8, hasEOL: true },
      ],
    });
    pdfMocks.getPage.mockResolvedValue({
      getTextContent: pdfMocks.getTextContent,
    });
    pdfMocks.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: pdfMocks.getPage,
      }),
    });

    const file = new File([new Uint8Array([37, 80, 68, 70])], "layout.pdf", {
      type: "application/pdf",
    });
    const result = await parseFileWithPath(file, "docs/layout.pdf", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).not.toContain("[Page 1]");
    expect(result.text).toContain("Аннотация\n\nВ эксперименте использовались\nSPA-приложения.");
    expect(result.text).toContain("\n\n• Lazy Loading\n• Greedy Prefetching");
    expect(result.text).not.toMatch(/\b2\b/);
    expect(pdfMocks.getDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(ArrayBuffer),
      })
    );
    expect((await import("pdfjs-dist/legacy/build/pdf.mjs")).GlobalWorkerOptions.workerSrc).toBe(
      "/pdf.worker.min.mjs"
    );
  });

  it("preserves line breaks and paragraph breaks from vertical offsets", async () => {
    mockPdfPages([
      [
        { str: "Введение", transform: [1, 0, 0, 1, 10, 720], height: 18, width: 80 },
        { str: "Первая", transform: [1, 0, 0, 1, 10, 680], height: 12, width: 50 },
        { str: "строка", transform: [1, 0, 0, 1, 70, 680], height: 12, width: 55 },
        { str: "Вторая", transform: [1, 0, 0, 1, 10, 664], height: 12, width: 50 },
        { str: "строка.", transform: [1, 0, 0, 1, 72, 664], height: 12, width: 55 },
      ],
    ]);

    const file = new File([new Uint8Array([37, 80, 68, 70])], "paragraphs.pdf", {
      type: "application/pdf",
    });
    const result = await parseFileWithPath(file, "docs/paragraphs.pdf", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("Введение\n\nПервая строка\nВторая строка.");
  });

  it("keeps punctuation attached while preserving structured lines", async () => {
    mockPdfPages([
      [
        { str: "Next", transform: [1, 0, 0, 1, 10, 700], height: 12, width: 32 },
        { str: ".", transform: [1, 0, 0, 1, 44, 700], height: 12, width: 4 },
        { str: "js", transform: [1, 0, 0, 1, 50, 700], height: 12, width: 14 },
        { str: "работает", transform: [1, 0, 0, 1, 74, 700], height: 12, width: 60 },
        { str: ",", transform: [1, 0, 0, 1, 136, 700], height: 12, width: 4 },
        { str: "быстро", transform: [1, 0, 0, 1, 144, 700], height: 12, width: 48 },
        { str: "!", transform: [1, 0, 0, 1, 194, 700], height: 12, width: 4 },
      ],
    ]);

    const file = new File([new Uint8Array([37, 80, 68, 70])], "punctuation.pdf", {
      type: "application/pdf",
    });
    const result = await parseFileWithPath(file, "docs/punctuation.pdf", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("Next.js работает, быстро!");
    expect(result.text).not.toContain("Next . js");
    expect(result.text).not.toContain("работает ,");
  });

  it("removes standalone page numbers and preserves page order across multiple pages", async () => {
    mockPdfPages([
      [
        { str: "Первая", transform: [1, 0, 0, 1, 10, 700], height: 12, width: 42 },
        { str: "страница", transform: [1, 0, 0, 1, 60, 700], height: 12, width: 60 },
        { str: "1", transform: [1, 0, 0, 1, 10, 660], height: 10, width: 8, hasEOL: true },
      ],
      [
        { str: "Вторая", transform: [1, 0, 0, 1, 10, 700], height: 12, width: 42 },
        { str: "страница", transform: [1, 0, 0, 1, 60, 700], height: 12, width: 60 },
        { str: "2", transform: [1, 0, 0, 1, 10, 660], height: 10, width: 8, hasEOL: true },
      ],
    ]);

    const file = new File([new Uint8Array([37, 80, 68, 70])], "pages.pdf", {
      type: "application/pdf",
    });
    const result = await parseFileWithPath(file, "docs/pages.pdf", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("Первая страница");
    expect(result.text).toContain("Вторая страница");
    expect(result.text.indexOf("Первая страница")).toBeLessThan(result.text.indexOf("Вторая страница"));
    expect(result.text).not.toMatch(/\n1\n|\n2\n/);
  });

  it("keeps numbered list items on separate lines", async () => {
    mockPdfPages([
      [
        { str: "1.", transform: [1, 0, 0, 1, 10, 700], height: 12, width: 12 },
        { str: "Первый", transform: [1, 0, 0, 1, 28, 700], height: 12, width: 44 },
        { str: "пункт", transform: [1, 0, 0, 1, 78, 700], height: 12, width: 40 },
        { str: "2.", transform: [1, 0, 0, 1, 10, 684], height: 12, width: 12 },
        { str: "Второй", transform: [1, 0, 0, 1, 28, 684], height: 12, width: 46 },
        { str: "пункт", transform: [1, 0, 0, 1, 80, 684], height: 12, width: 40 },
      ],
    ]);

    const file = new File([new Uint8Array([37, 80, 68, 70])], "list.pdf", {
      type: "application/pdf",
    });
    const result = await parseFileWithPath(file, "docs/list.pdf", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("1. Первый пункт\n2. Второй пункт");
  });

  it("normalizes pdf files inside zip archives", async () => {
    mockPdfPages([
      [
        { str: "Отчет", transform: [1, 0, 0, 1, 10, 720], height: 18, width: 50 },
        { str: "SPA", transform: [1, 0, 0, 1, 10, 684], height: 12, width: 28 },
        { str: "-", transform: [1, 0, 0, 1, 44, 684], height: 12, width: 6 },
        { str: "приложения", transform: [1, 0, 0, 1, 54, 684], height: 12, width: 84 },
      ],
    ]);

    const zip = new JSZip();
    zip.file("docs/report.pdf", new Uint8Array([37, 80, 68, 70]));
    const data = await zip.generateAsync({ type: "uint8array" });
    const file = new File([data], "pdf-bundle.zip", { type: "application/zip" });

    const result = await parseFileWithPath(file, "pdf-bundle.zip", settings);

    expect(result.kind).toBe("archive");
    expect(result.children?.some((child) => child.path.endsWith("docs/report.pdf"))).toBe(true);
    expect(result.text).toContain("### FILE: pdf-bundle.zip/docs/report.pdf");
    expect(result.text).toContain("Отчет\n\nSPA-приложения");
  });

  it("parses mixed zip archives with text, docx and pdf entries", async () => {
    mockPdfPages([
      [
        { str: "PDF", transform: [1, 0, 0, 1, 10, 700], height: 12, width: 24 },
        { str: "section", transform: [1, 0, 0, 1, 42, 700], height: 12, width: 44 },
      ],
    ]);
    vi.mocked(mammoth.convertToHtml).mockResolvedValueOnce({
      value: "<h2>Docx title</h2><p>Docx body</p>",
    });

    const zip = new JSZip();
    zip.file("notes/readme.txt", "hello zip");
    zip.file("docs/guide.docx", new Uint8Array([1, 2, 3]));
    zip.file("docs/source.pdf", new Uint8Array([37, 80, 68, 70]));
    const data = await zip.generateAsync({ type: "uint8array" });
    const file = new File([data], "mixed-assets.zip", { type: "application/zip" });

    const result = await parseFileWithPath(file, "mixed-assets.zip", settings);

    expect(result.kind).toBe("archive");
    expect(result.children?.length).toBe(3);
    expect(result.text).toContain("### FILE: mixed-assets.zip/notes/readme.txt");
    expect(result.text).toContain("### FILE: mixed-assets.zip/docs/guide.docx");
    expect(result.text).toContain("### FILE: mixed-assets.zip/docs/source.pdf");
    expect(result.text).toContain("# Docx title");
    expect(result.text).toContain("PDF section");
  });

  it("drops docx entries that fail to parse from zip children and archive text", async () => {
    vi.mocked(mammoth.convertToHtml).mockRejectedValueOnce(new Error("docx parse failed"));

    const zip = new JSZip();
    zip.file("docs/broken.docx", new Uint8Array([1, 2, 3]));
    zip.file("notes/ok.txt", "still here");
    const data = await zip.generateAsync({ type: "uint8array" });
    const file = new File([data], "broken-docx.zip", { type: "application/zip" });

    const result = await parseFileWithPath(file, "broken-docx.zip", settings);

    expect(result.kind).toBe("archive");
    expect(result.children?.some((child) => child.path.endsWith("broken.docx"))).toBe(false);
    expect(result.text).toContain("### FILE: broken-docx.zip/notes/ok.txt");
    expect(result.text).not.toContain("broken-docx.zip/docs/broken.docx");
  });

  it("keeps spaced Latin letters merged without flattening surrounding paragraphs", async () => {
    mockPdfPages([
      [
        { str: "Threshold", transform: [1, 0, 0, 1, 10, 720], height: 16, width: 70 },
        { str: "T", transform: [1, 0, 0, 1, 10, 680], height: 12, width: 8 },
        { str: "h", transform: [1, 0, 0, 1, 28, 680], height: 12, width: 8 },
        { str: "r", transform: [1, 0, 0, 1, 46, 680], height: 12, width: 8 },
        { str: "e", transform: [1, 0, 0, 1, 64, 680], height: 12, width: 8 },
        { str: "s", transform: [1, 0, 0, 1, 82, 680], height: 12, width: 8 },
        { str: "h", transform: [1, 0, 0, 1, 100, 680], height: 12, width: 8 },
        { str: "o", transform: [1, 0, 0, 1, 118, 680], height: 12, width: 8 },
        { str: "l", transform: [1, 0, 0, 1, 136, 680], height: 12, width: 8 },
        { str: "d", transform: [1, 0, 0, 1, 154, 680], height: 12, width: 8 },
      ],
    ]);

    const file = new File([new Uint8Array([37, 80, 68, 70])], "threshold.pdf", {
      type: "application/pdf",
    });
    const result = await parseFileWithPath(file, "docs/threshold.pdf", settings);

    expect(result.error).toBeUndefined();
    expect(result.text).toContain("Threshold\n\nThreshold");
    expect(result.text).not.toContain("T h r e s h o l d");
  });

  it("parses DOCX extension case-insensitively", async () => {
    const file = new File([new Uint8Array([1, 2])], "Caps.DOCX", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const result = await parseFileWithPath(file, "docs/Caps.DOCX", settings);

    expect(result.error).toBeUndefined();
    expect(result.sourceType).toBe("docx");
    expect(result.text).toContain("DOCX CONTENT");
  });

  it("surfaces parse errors from unreadable blob", async () => {
    const file = new File(["abc"], "broken.txt", { type: "text/plain" });
    const arrayBufferSpy = vi.spyOn(file, "arrayBuffer").mockRejectedValue(new Error("read failed"));
    const result = await parseFileWithPath(file, "broken.docx", settings);

    expect(result.error).toBe("read failed");
    expect(result.tokenEstimate).toBe(0);
    arrayBufferSpy.mockRestore();
  });

  it("parses zip archive and keeps children", async () => {
    const zip = new JSZip();
    zip.file("src/main.ts", "console.log('ok');");
    zip.file("src/readme.lock", "filtered");
    const data = await zip.generateAsync({ type: "uint8array" });
    const file = new File([data], "bundle.zip", { type: "application/zip" });

    const result = await parseFileWithPath(file, "bundle.zip", settings);

    expect(result.kind).toBe("archive");
    expect(result.sourceType).toBe("zip");
    expect(result.children?.length).toBe(2);
    expect(result.children?.some((child) => child.error === "Skipped by filters")).toBe(true);
    expect(result.text).toContain("### FILE: bundle.zip/src/main.ts");
  });

  it("parses nested zip structure and keeps normalized prefixed paths", async () => {
    const file = await buildZip([
      { path: "apps/web/src/app.ts", content: "console.log('web')" },
      { path: "apps/api/src/server.ts", content: "console.log('api')" },
    ]);

    const result = await parseFileWithPath(file, "workspace.zip", settings);

    expect(result.kind).toBe("archive");
    expect(result.children?.[0].path.startsWith("workspace.zip/")).toBe(true);
    expect(result.children?.every((child) => child.path.includes("workspace.zip/"))).toBe(true);
  });

  it("skips ignored files inside zip but keeps entry metadata", async () => {
    const file = await buildZip([
      { path: "node_modules/a.ts", content: "x" },
      { path: "src/main.ts", content: "y" },
    ]);
    const result = await parseFileWithPath(file, "repo.zip", settings);

    const skipped = result.children?.find((child) => child.error === "Skipped by filters");
    const parsed = result.children?.find((child) => !child.error);

    expect(skipped).toBeDefined();
    expect(parsed?.text).toContain("### FILE: repo.zip/src/main.ts");
    expect(result.text).not.toContain("repo.zip/node_modules/a.ts");
  });

  it("drops unsupported files from archive children and excludes them from archive text", async () => {
    const zip = new JSZip();
    zip.file("src/main.ts", "const ok = true");
    zip.file("assets/image.bin", new Uint8Array([1, 2, 3]));
    const data = await zip.generateAsync({ type: "uint8array" });
    const file = new File([data], "mix.zip", { type: "application/zip" });

    const result = await parseFileWithPath(file, "mix.zip", settings);

    expect(result.children?.some((child) => child.path.includes("image.bin"))).toBe(false);
    expect(result.text).toContain("### FILE: mix.zip/src/main.ts");
    expect(result.text).not.toContain("mix.zip/assets/image.bin");
  });

  it("returns archive with token estimate 1 for empty zip", async () => {
    const zip = new JSZip();
    const data = await zip.generateAsync({ type: "uint8array" });
    const file = new File([data], "empty.zip", { type: "application/zip" });

    const result = await parseFileWithPath(file, "empty.zip", settings);

    expect(result.kind).toBe("archive");
    expect(result.children).toEqual([]);
    expect(result.tokenEstimate).toBe(1);
  });

  it("processes multiple zip files independently", async () => {
    const fileA = await buildZip([{ path: "a.ts", content: "A" }]);
    const fileB = await buildZip([{ path: "b.ts", content: "B" }]);

    const [resultA, resultB] = await Promise.all([
      parseFileWithPath(fileA, "a.zip", settings),
      parseFileWithPath(fileB, "b.zip", settings),
    ]);

    expect(resultA.text).toContain("a.zip/a.ts");
    expect(resultB.text).toContain("b.zip/b.ts");
    expect(resultA.text).not.toContain("b.zip");
  });

  it("combineToFinalTxt builds expected headers and archive body", () => {
    const items: ParsedItem[] = [
      {
        id: "1",
        name: "a.txt",
        path: "a.txt",
        size: 10,
        kind: "file",
        text: "### FILE: a.txt\n\nalpha",
        tokenEstimate: 5,
        sourceType: "txt",
      },
      {
        id: "2",
        name: "bundle.zip",
        path: "bundle.zip",
        size: 20,
        kind: "archive",
        sourceType: "zip",
        tokenEstimate: 10,
        text: "",
        children: [
          {
            id: "2-1",
            name: "b.txt",
            path: "bundle.zip/b.txt",
            size: 5,
            kind: "file",
            text: "### FILE: bundle.zip/b.txt\n\nbeta",
            tokenEstimate: 5,
            sourceType: "txt",
          },
        ],
      },
    ];

    const output = combineToFinalTxt(items, "Use concise style", "2026-01-01T00:00:00.000Z");

    expect(output).toContain("# LLM Context Bundle");
    expect(output).toContain("Generated: 2026-01-01T00:00:00.000Z");
    expect(output).toContain("Prompt: Use concise style");
    expect(output).toContain("## ARCHIVE: bundle.zip");
    expect(output).toContain("### FILE: a.txt");
    expect(output).toContain("### FILE: bundle.zip/b.txt");
  });

  it("combineToFinalTxt keeps empty prompt marker", () => {
    const output = combineToFinalTxt([], "   ");
    expect(output).toContain("Prompt: (empty)");
  });

  it("combineToFinalTxt trims prompt value in header", () => {
    const output = combineToFinalTxt([], "   Keep concise output   ");
    expect(output).toContain("Prompt: Keep concise output");
    expect(output).not.toContain("Prompt:    Keep concise output");
  });

  it("combineToFinalTxt omits Generated line when timestamp is missing", () => {
    const output = combineToFinalTxt([], "x");
    expect(output).not.toContain("Generated:");
  });

  it("combineToFinalTxt preserves source order", () => {
    const items: ParsedItem[] = [
      {
        id: "1",
        name: "first",
        path: "first.txt",
        size: 1,
        kind: "file",
        text: "### FILE: first.txt\n\n1",
        tokenEstimate: 1,
        sourceType: "txt",
      },
      {
        id: "2",
        name: "second",
        path: "second.txt",
        size: 1,
        kind: "file",
        text: "### FILE: second.txt\n\n2",
        tokenEstimate: 1,
        sourceType: "txt",
      },
    ];

    const output = combineToFinalTxt(items, "order");
    expect(output.indexOf("first.txt")).toBeLessThan(output.indexOf("second.txt"));
  });

  it("combineToFinalTxt includes archive header even with no children", () => {
    const items: ParsedItem[] = [
      {
        id: "a",
        name: "empty.zip",
        path: "empty.zip",
        size: 1,
        kind: "archive",
        text: "",
        tokenEstimate: 1,
        sourceType: "zip",
        children: [],
      },
    ];

    const output = combineToFinalTxt(items, "archive");
    expect(output).toContain("## ARCHIVE: empty.zip");
  });

  it("combineToFinalTxt skips child entries without text", () => {
    const items: ParsedItem[] = [
      {
        id: "a",
        name: "bundle.zip",
        path: "bundle.zip",
        size: 1,
        kind: "archive",
        text: "",
        tokenEstimate: 1,
        sourceType: "zip",
        children: [
          {
            id: "x",
            name: "empty.ts",
            path: "bundle.zip/empty.ts",
            size: 1,
            kind: "file",
            text: "",
            tokenEstimate: 0,
            sourceType: "ts",
          },
          {
            id: "y",
            name: "ok.ts",
            path: "bundle.zip/ok.ts",
            size: 1,
            kind: "file",
            text: "### FILE: bundle.zip/ok.ts\n\nconst ok = true",
            tokenEstimate: 3,
            sourceType: "ts",
          },
        ],
      },
    ];

    const output = combineToFinalTxt(items, "x");
    expect(output).toContain("bundle.zip/ok.ts");
    expect(output).not.toContain("bundle.zip/empty.ts");
  });

  it("combineToFinalTxt keeps non-empty body when prompt is empty", () => {
    const items: ParsedItem[] = [
      {
        id: "1",
        name: "a",
        path: "a.txt",
        size: 1,
        kind: "file",
        text: "### FILE: a.txt\n\nA",
        tokenEstimate: 1,
        sourceType: "txt",
      },
    ];
    const output = combineToFinalTxt(items, "");
    expect(output).toContain("### FILE: a.txt");
    expect(output).toContain("Prompt: (empty)");
  });

  it("combineToFinalTxt does not duplicate separators on sparse content", () => {
    const items: ParsedItem[] = [
      {
        id: "1",
        name: "a",
        path: "a.txt",
        size: 1,
        kind: "file",
        text: "",
        tokenEstimate: 0,
        sourceType: "txt",
      },
      {
        id: "2",
        name: "b",
        path: "b.txt",
        size: 1,
        kind: "file",
        text: "### FILE: b.txt\n\nB",
        tokenEstimate: 1,
        sourceType: "txt",
      },
    ];

    const output = combineToFinalTxt(items, "prompt");
    expect(output).toContain("### FILE: b.txt");
    expect(output).not.toContain("\n\n\n\n\n");
  });
});
