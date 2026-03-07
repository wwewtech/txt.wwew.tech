import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";

vi.mock("mammoth", () => ({
  default: {
    convertToHtml: vi.fn().mockResolvedValue({ value: "<p>DOCX CONTENT</p>" }),
    extractRawText: vi.fn().mockResolvedValue({ value: "DOCX CONTENT" }),
  },
}));

import {
  combineToFinalTxt,
  estimateTokens,
  getExt,
  isIgnoredPath,
  parseFileWithPath,
  type ParsedItem,
} from "@/lib/file-parser";

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

describe("file-parser business logic", () => {
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
    ["folder.name/readme", "name/readme"],
    ["multi.part.name.test.ts", "ts"],
  ])("extracts extension correctly for %s", (path, expected) => {
    expect(getExt(path)).toBe(expected);
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
