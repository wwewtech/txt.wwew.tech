import { afterEach, describe, expect, it, vi } from "vitest";

import { createId } from "./utils";

describe("createId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses crypto.randomUUID when available", () => {
    const randomUUID = vi.fn(() => "uuid-from-randomUUID");
    const getRandomValues = vi.fn();

    vi.stubGlobal("crypto", {
      randomUUID,
      getRandomValues,
    });

    const id = createId();

    expect(id).toBe("uuid-from-randomUUID");
    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(getRandomValues).not.toHaveBeenCalled();
  });

  it("builds RFC4122-like uuid from getRandomValues when randomUUID is unavailable", () => {
    const getRandomValues = vi.fn((array: Uint8Array) => {
      for (let index = 0; index < array.length; index += 1) {
        array[index] = index;
      }
      return array;
    });

    vi.stubGlobal("crypto", {
      getRandomValues,
    });

    const id = createId();

    expect(id).toBe("00010203-0405-4607-8809-0a0b0c0d0e0f");
    expect(getRandomValues).toHaveBeenCalledTimes(1);
  });

  it("returns UUID-like value with expected segment lengths for getRandomValues branch", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (array: Uint8Array) => {
        for (let index = 0; index < array.length; index += 1) {
          array[index] = 255 - index;
        }
        return array;
      },
    });

    const id = createId();

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("forces version 4 and RFC4122 variant bits in getRandomValues branch", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (array: Uint8Array) => {
        array.fill(0);
        return array;
      },
    });

    const id = createId();

    expect(id.split("-")[2][0]).toBe("4");
    expect(["8", "9", "a", "b"]).toContain(id.split("-")[3][0]);
  });

  it("falls back to date+math string when crypto is unavailable", () => {
    vi.stubGlobal("crypto", undefined);
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);

    const id = createId();
    const expected = `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    expect(id).toBe(expected);
  });
});
