import type { HistoryItem } from "./page-types";

export function toBase64Unicode(input: string) {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function stripSyntheticFileHeader(text: string) {
  return text.replace(/^### FILE: .*\r?\n\r?\n/, "");
}

export function toTxtContext(content: string) {
  return content
    .replace(/^### FILE: .*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeCsvInput(value: string, options?: { lowercase?: boolean }) {
  const normalized = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (options?.lowercase) {
    return normalized.map((entry) => entry.toLowerCase());
  }

  return normalized;
}

export function buildHistoryShareUrl(target: HistoryItem, origin: string, pathname: string) {
  const payload = {
    title: target.title,
    tokenEstimate: target.tokenEstimate,
    updatedAt: target.updatedAt,
    prompt: target.prompt,
  };
  const encoded = toBase64Unicode(JSON.stringify(payload));
  return `${origin}${pathname}#shared=${encoded}`;
}
