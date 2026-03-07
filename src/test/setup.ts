import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      ...globalThis.crypto,
      randomUUID: () => "test-uuid",
    },
  });
}

Object.defineProperty(window.HTMLElement.prototype, "scrollHeight", {
  configurable: true,
  get() {
    return 120;
  },
});

if (!navigator.clipboard) {
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    configurable: true,
  });
}

if (!window.HTMLElement.prototype.setPointerCapture) {
  Object.defineProperty(window.HTMLElement.prototype, "setPointerCapture", {
    value: vi.fn(),
    configurable: true,
  });
}

if (!window.HTMLElement.prototype.releasePointerCapture) {
  Object.defineProperty(window.HTMLElement.prototype, "releasePointerCapture", {
    value: vi.fn(),
    configurable: true,
  });
}
