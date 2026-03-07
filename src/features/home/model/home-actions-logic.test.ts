import { describe, expect, it } from "vitest";

import { type HistoryItem } from "./page-types";
import {
  buildHistoryShareUrl,
  normalizeCsvInput,
  stripSyntheticFileHeader,
  toBase64Unicode,
  toTxtContext,
} from "./home-actions-logic";

function decodeBase64Unicode(base64: string) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function makeHistoryItem(overrides: Partial<HistoryItem> = {}): HistoryItem {
  return {
    id: "h1",
    title: "Share me",
    updatedAt: "2026-01-01T00:00:00.000Z",
    tokenEstimate: 12,
    finalText: "# LLM Context Bundle",
    prompt: "hello",
    items: [],
    chatMessages: [],
    ...overrides,
  };
}

describe("home-actions-logic", () => {
  it("toBase64Unicode preserves unicode content", () => {
    const source = "Привет 👋 Hello";
    const encoded = toBase64Unicode(source);
    const decoded = decodeBase64Unicode(encoded);

    expect(decoded).toBe(source);
  });

  it("stripSyntheticFileHeader removes only synthetic prefix", () => {
    const withHeader = "### FILE: src/a.ts\n\nconst a = 1";
    const withoutHeader = stripSyntheticFileHeader(withHeader);

    expect(withoutHeader).toBe("const a = 1");
    expect(stripSyntheticFileHeader("const a = 1")).toBe("const a = 1");
  });

  it("toTxtContext removes FILE markers and compresses blank lines", () => {
    const content = [
      "### FILE: src/a.ts",
      "",
      "alpha",
      "",
      "",
      "",
      "### FILE: src/b.ts",
      "",
      "beta",
      "",
    ].join("\n");

    expect(toTxtContext(content)).toBe("alpha\n\nbeta");
  });

  it("normalizeCsvInput trims values, removes empty items and optionally lowercases", () => {
    expect(normalizeCsvInput(" a,  b ,, c ")).toEqual(["a", "b", "c"]);
    expect(normalizeCsvInput(" TS, Js , MD ", { lowercase: true })).toEqual(["ts", "js", "md"]);
  });

  it("buildHistoryShareUrl includes encoded payload in hash", () => {
    const item = makeHistoryItem({ title: "Session 1", prompt: "Architect it" });

    const url = buildHistoryShareUrl(item, "https://txt.wwew.tech", "/");
    expect(url.startsWith("https://txt.wwew.tech/#shared=")).toBe(true);

    const encoded = url.split("#shared=")[1] ?? "";
    const decodedPayload = JSON.parse(decodeBase64Unicode(encoded)) as {
      title: string;
      tokenEstimate: number;
      updatedAt: string;
      prompt: string;
    };

    expect(decodedPayload).toEqual({
      title: "Session 1",
      tokenEstimate: 12,
      updatedAt: "2026-01-01T00:00:00.000Z",
      prompt: "Architect it",
    });
  });
});
