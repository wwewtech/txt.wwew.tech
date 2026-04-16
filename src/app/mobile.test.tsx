/**
 * Mobile-specific tests:
 * - Mobile header (hamburger / settings buttons)
 * - Vaul Drawer open / close for left & right panels
 * - Display section (uiScale presets, compact mode, font-size offset)
 * - CSS custom property --ui-scale updated on document
 * - localStorage persistence of viewMode, sortMode, uiScale, compactMode, settings
 * - useDeviceDetect hook (unit)
 * - MobileDrawer component (unit)
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

async function flushEffects() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function renderHome() {
  render(<Home />);
  await flushEffects();
}

vi.mock("@/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib")>();
  return {
    ...actual,
    parseFileWithPath: vi.fn(async (_file: File, path: string) => ({
      id: `id-${path}`,
      name: path.split("/").pop() ?? path,
      path,
      size: 10,
      kind: "file" as const,
      text: `### FILE: ${path}\n\nhello`,
      tokenEstimate: 10,
      sourceType: "txt",
    })),
  };
});

import Home from "@/app/page";
import { MobileDrawer } from "@/components";
import { useDeviceDetect } from "@/hooks/use-device-detect";

// ─── constants ─────────────────────────────────────────────────────────────
const UI_PREFS_KEY = "txt-wwew-tech-ui-prefs";

// ─── helpers ───────────────────────────────────────────────────────────────

/**
 * Open the Display section inside the right sidebar.
 * Uses direct DOM mutation (details.open = true) because jsdom does not
 * implement the native toggle behaviour of <details>/<summary>.
 */
async function openDisplaySection() {
  await waitFor(() => {
    const summaries = Array.from(document.querySelectorAll("summary"));
    expect(summaries.some((s) => /display|отображение/i.test(s.textContent ?? ""))).toBe(true);
  });
  const displaySummary = Array.from(document.querySelectorAll("summary")).find(
    (s) => /display|отображение/i.test(s.textContent ?? "")
  );
  if (displaySummary?.parentElement) {
    (displaySummary.parentElement as HTMLDetailsElement).open = true;
  }
}

async function applyDisplayChanges() {
  fireEvent.click(await screen.findByRole("button", { name: /apply and refresh|применить и обновить/i }));
}

// ─── beforeEach ────────────────────────────────────────────────────────────
beforeEach(() => {
  document.documentElement.style.removeProperty("--ui-scale");
  document.documentElement.classList.remove("compact");
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. Mobile header
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Mobile header", () => {
  it("renders hamburger (Open navigation) button", async () => {
    await renderHome();
    expect(await screen.findByRole("button", { name: /open navigation/i })).toBeInTheDocument();
  });

  it("renders settings (Open settings) button", async () => {
    await renderHome();
    expect(await screen.findByRole("button", { name: /open settings/i })).toBeInTheDocument();
  });

  it("renders txt.wwew.tech brand label in mobile header", async () => {
    await renderHome();
    expect((await screen.findAllByText("txt.wwew.tech")).length).toBeGreaterThan(0);
  });

  it("clicking hamburger opens left mobile drawer (overlay appears)", async () => {
    await renderHome();
    await screen.findByRole("button", { name: /open navigation/i });

    fireEvent.click(screen.getByRole("button", { name: /open navigation/i }));

    await waitFor(() => {
      expect(document.querySelector(".bg-black\\/50")).toBeInTheDocument();
    });
  });

  it("clicking settings button opens right mobile drawer (overlay appears)", async () => {
    await renderHome();
    await screen.findByRole("button", { name: /open settings/i });

    fireEvent.click(screen.getByRole("button", { name: /open settings/i }));

    await waitFor(() => {
      expect(document.querySelector(".bg-black\\/50")).toBeInTheDocument();
    });
  });

  it("right drawer surfaces settings summaries when opened", async () => {
    await renderHome();
    await screen.findByRole("button", { name: /open settings/i });

    fireEvent.click(screen.getByRole("button", { name: /open settings/i }));

    await waitFor(() => {
      expect(document.querySelectorAll("summary").length).toBeGreaterThan(0);
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. Display section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("Display section", () => {
  it("Display section is found in sidebar", async () => {
    await renderHome();
    await openDisplaySection();
    expect(document.querySelector("details[open]")).toBeInTheDocument();
  });

  it("UI Scale shows 100% by default", async () => {
    await renderHome();
    await openDisplaySection();
    await waitFor(() => expect(screen.getByText("100%")).toBeInTheDocument());
  });

  it("Compact preset sets scale to 90%", async () => {
    await renderHome();
    await openDisplaySection();

    fireEvent.click(await screen.findByRole("button", { name: /^compact$|^компакт$/i }));
    await waitFor(() => expect(screen.getByText("90%")).toBeInTheDocument());
  });

  it("Default preset restores scale to 100%", async () => {
    await renderHome();
    await openDisplaySection();

    fireEvent.click(await screen.findByRole("button", { name: /^compact$|^компакт$/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^default$|^по умолчанию$/i }));
    await waitFor(() => expect(screen.getByText("100%")).toBeInTheDocument());
  });

  it("Large preset sets scale to 115%", async () => {
    await renderHome();
    await openDisplaySection();

    fireEvent.click(await screen.findByRole("button", { name: /^large$|^крупный$/i }));
    await waitFor(() => expect(screen.getByText("115%")).toBeInTheDocument());
  });

  it("--ui-scale CSS var on <html> tracks uiScale / 100", async () => {
    await renderHome();
    await openDisplaySection();

    fireEvent.click(await screen.findByRole("button", { name: /^large$|^крупный$/i }));
    await applyDisplayChanges();
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--ui-scale")).toBe("1.15");
    });
  });

  it("--ui-scale CSS var is 1 at default", async () => {
    await renderHome();
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--ui-scale")).toBe("1");
    });
  });

  it("Compact Mode button is aria-pressed=false by default", async () => {
    await renderHome();
    await openDisplaySection();

    const toggle = await screen.findByRole("button", { name: /compact mode|компактный режим/i });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("Compact Mode toggled ON → aria-pressed=true", async () => {
    await renderHome();
    await openDisplaySection();

    const toggle = await screen.findByRole("button", { name: /compact mode|компактный режим/i });
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute("aria-pressed", "true"));
  });

  it("Compact Mode adds .compact class to <html>", async () => {
    await renderHome();
    await openDisplaySection();

    const toggle = await screen.findByRole("button", { name: /compact mode|компактный режим/i });
    fireEvent.click(toggle);
    await applyDisplayChanges();
    await waitFor(() => expect(document.documentElement.classList.contains("compact")).toBe(true));
  });

  it("Compact Mode toggled OFF removes .compact class from <html>", async () => {
    await renderHome();
    await openDisplaySection();

    const toggle = await screen.findByRole("button", { name: /compact mode|компактный режим/i });
    fireEvent.click(toggle); // on
    fireEvent.click(toggle); // off
    await waitFor(() => expect(document.documentElement.classList.contains("compact")).toBe(false));
  });

  it("Font size + increments offset from 0 to +1", async () => {
    await renderHome();
    await openDisplaySection();

    const baseEl = await screen.findByText("Base");
    const row = baseEl.closest("div.flex")!;
    const plusBtn = Array.from(row.querySelectorAll<HTMLButtonElement>("button")).at(-1)!;

    fireEvent.click(plusBtn);
    // Multiple +1 nodes may appear (value label + centre label) — either is fine
    await waitFor(() => expect(screen.getAllByText("+1").length).toBeGreaterThan(0));
  });

  it("Font size − decrements offset from 0 to −1", async () => {
    await renderHome();
    await openDisplaySection();

    const baseEl = await screen.findByText("Base");
    const row = baseEl.closest("div.flex")!;
    const minusBtn = row.querySelectorAll<HTMLButtonElement>("button")[0];

    fireEvent.click(minusBtn);
    await waitFor(() => expect(screen.getAllByText("-1").length).toBeGreaterThan(0));
  });

  it("Font size offset clamped at +4", async () => {
    await renderHome();
    await openDisplaySection();

    const baseEl = await screen.findByText("Base");
    const row = baseEl.closest("div.flex")!;
    const plusBtn = Array.from(row.querySelectorAll<HTMLButtonElement>("button")).at(-1)!;

    for (let i = 0; i < 10; i++) fireEvent.click(plusBtn);
    await waitFor(() => expect(screen.getAllByText("+4").length).toBeGreaterThan(0));
  });

  it("Font size offset clamped at −2", async () => {
    await renderHome();
    await openDisplaySection();

    const baseEl = await screen.findByText("Base");
    const row = baseEl.closest("div.flex")!;
    const minusBtn = row.querySelectorAll<HTMLButtonElement>("button")[0];

    for (let i = 0; i < 10; i++) fireEvent.click(minusBtn);
    await waitFor(() => expect(screen.getAllByText("-2").length).toBeGreaterThan(0));
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. localStorage persistence
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("localStorage persistence", () => {
  it("writes viewMode=cards on initial render", async () => {
    await renderHome();
    await waitFor(() => {
      const s = JSON.parse(window.localStorage.getItem(UI_PREFS_KEY) ?? "null");
      expect(s?.viewMode).toBe("cards");
    });
  });

  it("writes sortMode=latest on initial render", async () => {
    await renderHome();
    await waitFor(() => {
      const s = JSON.parse(window.localStorage.getItem(UI_PREFS_KEY) ?? "null");
      expect(s?.sortMode).toBe("latest");
    });
  });

  it("writes settings.ignoredDirectories with node_modules", async () => {
    await renderHome();
    await waitFor(() => {
      const s = JSON.parse(window.localStorage.getItem(UI_PREFS_KEY) ?? "null");
      expect(s?.settings?.ignoredDirectories).toContain("node_modules");
    });
  });

  it("writes settings.excludedExtensions with lock", async () => {
    await renderHome();
    await waitFor(() => {
      const s = JSON.parse(window.localStorage.getItem(UI_PREFS_KEY) ?? "null");
      expect(s?.settings?.excludedExtensions).toContain("lock");
    });
  });

  it("persists uiScale=115 after Large preset click", async () => {
    await renderHome();
    await openDisplaySection();
    fireEvent.click(await screen.findByRole("button", { name: /^large$|^крупный$/i }));
    await applyDisplayChanges();

    await waitFor(() => {
      const s = JSON.parse(window.localStorage.getItem(UI_PREFS_KEY) ?? "null");
      expect(s?.uiScale).toBe(115);
    });
  });

  it("persists compactMode=true after toggle", async () => {
    await renderHome();
    await openDisplaySection();
    fireEvent.click(await screen.findByRole("button", { name: /compact mode|компактный режим/i }));
    await applyDisplayChanges();

    await waitFor(() => {
      const s = JSON.parse(window.localStorage.getItem(UI_PREFS_KEY) ?? "null");
      expect(s?.compactMode).toBe(true);
    });
  });

  it("persists fontSizeOffset=1 after + click", async () => {
    await renderHome();
    await openDisplaySection();

    const baseEl = await screen.findByText("Base");
    const plusBtn = Array.from(
      baseEl.closest("div.flex")!.querySelectorAll<HTMLButtonElement>("button")
    ).at(-1)!;
    fireEvent.click(plusBtn);
    await applyDisplayChanges();

    await waitFor(() => {
      const s = JSON.parse(window.localStorage.getItem(UI_PREFS_KEY) ?? "null");
      expect(s?.fontSizeOffset).toBe(1);
    });
  });

  it("restores uiScale=90 from localStorage on mount", async () => {
    window.localStorage.setItem(UI_PREFS_KEY, JSON.stringify({ uiScale: 90 }));
    await renderHome();
    await openDisplaySection();
    await waitFor(() => expect(screen.getByText("90%")).toBeInTheDocument());
  });

  it("restores compactMode=true on mount", async () => {
    window.localStorage.setItem(UI_PREFS_KEY, JSON.stringify({ compactMode: true }));
    await renderHome();
    await openDisplaySection();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /compact mode|компактный режим/i }))
        .toHaveAttribute("aria-pressed", "true");
    });
  });

  it("restores sortMode=name on mount", async () => {
    window.localStorage.setItem(UI_PREFS_KEY, JSON.stringify({ sortMode: "name" }));
    await renderHome();
    await waitFor(() => {
      const s = JSON.parse(window.localStorage.getItem(UI_PREFS_KEY) ?? "null");
      expect(s?.sortMode).toBe("name");
    });
  });

  it("clamps uiScale at 150 on out-of-range restore", async () => {
    window.localStorage.setItem(UI_PREFS_KEY, JSON.stringify({ uiScale: 999 }));
    await renderHome();
    await openDisplaySection();
    await waitFor(() => expect(screen.getByText("150%")).toBeInTheDocument());
  });

  it("clamps uiScale at 75 on too-low restore", async () => {
    window.localStorage.setItem(UI_PREFS_KEY, JSON.stringify({ uiScale: 10 }));
    await renderHome();
    await openDisplaySection();
    await waitFor(() => expect(screen.getByText("75%")).toBeInTheDocument());
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. useDeviceDetect – unit
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("useDeviceDetect", () => {
  function setWidth(w: number) {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: w });
  }

  it("isDesktop=true for width >= 1280", () => {
    setWidth(1440);
    const { result } = renderHook(() => useDeviceDetect());
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
  });

  it("isMobile=true for width < 768", () => {
    setWidth(375);
    const { result } = renderHook(() => useDeviceDetect());
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it("isTablet=true for width 768–1279", () => {
    setWidth(1024);
    const { result } = renderHook(() => useDeviceDetect());
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it("boundary: width=768 → tablet", () => {
    setWidth(768);
    const { result } = renderHook(() => useDeviceDetect());
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
  });

  it("boundary: width=767 → mobile", () => {
    setWidth(767);
    const { result } = renderHook(() => useDeviceDetect());
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
  });

  it("boundary: width=1280 → desktop", () => {
    setWidth(1280);
    const { result } = renderHook(() => useDeviceDetect());
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isTablet).toBe(false);
  });

  it("boundary: width=1279 → tablet", () => {
    setWidth(1279);
    const { result } = renderHook(() => useDeviceDetect());
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it("isTouchDevice is a boolean", () => {
    setWidth(1440);
    const { result } = renderHook(() => useDeviceDetect());
    expect(typeof result.current.isTouchDevice).toBe("boolean");
  });

  it("exactly one of isMobile/isTablet/isDesktop is true for any width", () => {
    for (const w of [320, 375, 767, 768, 1023, 1024, 1279, 1280, 1440, 1920]) {
      setWidth(w);
      const { result } = renderHook(() => useDeviceDetect());
      const trueCount = [
        result.current.isMobile,
        result.current.isTablet,
        result.current.isDesktop,
      ].filter(Boolean).length;
      expect(trueCount, `width=${w}`).toBe(1);
    }
  });

  it("updates to isMobile after resize from desktop", async () => {
    setWidth(1440);
    const { result } = renderHook(() => useDeviceDetect());
    expect(result.current.isDesktop).toBe(true);

    act(() => {
      setWidth(375);
      window.dispatchEvent(new Event("resize"));
    });
    await waitFor(() => expect(result.current.isMobile).toBe(true));
  });

  it("updates to isDesktop after resize from mobile", async () => {
    setWidth(375);
    const { result } = renderHook(() => useDeviceDetect());
    expect(result.current.isMobile).toBe(true);

    act(() => {
      setWidth(1440);
      window.dispatchEvent(new Event("resize"));
    });
    await waitFor(() => expect(result.current.isDesktop).toBe(true));
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. MobileDrawer – unit
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("MobileDrawer", () => {
  it("renders children when open=true", () => {
    render(
      <MobileDrawer open={true} onOpenChange={() => {}}>
        <div data-testid="dc">Hello</div>
      </MobileDrawer>
    );
    expect(screen.getByTestId("dc")).toBeInTheDocument();
  });

  it("does not render children when open=false", () => {
    render(
      <MobileDrawer open={false} onOpenChange={() => {}}>
        <div data-testid="dc-closed">Hidden</div>
      </MobileDrawer>
    );
    expect(screen.queryByTestId("dc-closed")).not.toBeInTheDocument();
  });

  it("renders overlay when open=true", () => {
    render(
      <MobileDrawer open={true} onOpenChange={() => {}}>
        <span>X</span>
      </MobileDrawer>
    );
    expect(document.querySelector(".bg-black\\/50")).toBeInTheDocument();
  });

  it("no overlay when open=false", () => {
    render(
      <MobileDrawer open={false} onOpenChange={() => {}}>
        <span>X</span>
      </MobileDrawer>
    );
    expect(document.querySelector(".bg-black\\/50")).not.toBeInTheDocument();
  });

  it("renders bottom handle bar for direction=bottom", () => {
    render(
      <MobileDrawer open={true} onOpenChange={() => {}} direction="bottom">
        <div>Bottom</div>
      </MobileDrawer>
    );
    expect(document.querySelector(".h-1\\.5.w-12.shrink-0.rounded-full")).toBeInTheDocument();
  });

  it("no bottom handle bar for direction=left", () => {
    render(
      <MobileDrawer open={true} onOpenChange={() => {}} direction="left">
        <div>Left</div>
      </MobileDrawer>
    );
    expect(document.querySelector(".h-1\\.5.w-12.shrink-0.rounded-full")).not.toBeInTheDocument();
  });

  it("no bottom handle bar for direction=right", () => {
    render(
      <MobileDrawer open={true} onOpenChange={() => {}} direction="right">
        <div>Right</div>
      </MobileDrawer>
    );
    expect(document.querySelector(".h-1\\.5.w-12.shrink-0.rounded-full")).not.toBeInTheDocument();
  });

  it("onOpenChange prop is a function (wiring test)", () => {
    const onChange = vi.fn();
    render(
      <MobileDrawer open={true} onOpenChange={onChange} direction="left">
        <div>Content</div>
      </MobileDrawer>
    );
    // Verify drawer mounted successfully with an onChange handler
    expect(document.querySelector(".bg-black\\/50")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled(); // not called until user interaction
  });
});
