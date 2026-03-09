import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    parseFileWithPath: vi.fn(async (_file, path) => ({
      id: `id-${path}`,
      name: path.split("/").pop() ?? path,
      path,
      size: 10,
      kind: "file",
      text: `### FILE: ${path}\n\nhello`,
      tokenEstimate: 10,
      sourceType: "txt",
    })),
  };
});

import Home from "@/app/page";
import { resetHomeStores } from "@/features/home/store/reset-home-stores";

const UI_PREFS_KEY = "txt-wwew-tech-ui-prefs";

async function waitForSidebar() {
  await waitFor(() => {
    const heading = Array.from(document.querySelectorAll("p")).find(
      (p) => /^системные команды$|^system commands$/i.test(p.textContent?.trim() ?? "")
    );
    expect(heading).toBeTruthy();
  });
}

function clickAddButton() {
  const addBtn = Array.from(document.querySelectorAll("button")).find(
    (b) => /^новая$|^new$/i.test(b.title?.trim() ?? "")
  );
  if (!addBtn) throw new Error("Add (+) button not found");
  fireEvent.click(addBtn);
}

async function addCommand(text) {
  clickAddButton();
  const textarea = await waitFor(() => {
    const el = Array.from(document.querySelectorAll("textarea")).find(
      (ta) => /команду|command/i.test(ta.placeholder)
    );
    if (!el) throw new Error("Command add-form textarea not visible");
    return el;
  });
  await userEvent.type(textarea, text);
  const saveBtn = Array.from(document.querySelectorAll("button")).find(
    (b) => /^сохранить$|^save$/i.test(b.textContent?.trim() ?? "")
  );
  if (!saveBtn) throw new Error("Save button not found");
  fireEvent.click(saveBtn);
}

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  resetHomeStores();
});

describe("System commands panel", () => {
  it("shows empty-state text when no commands exist", async () => {
    render(<Home />);
    await waitForSidebar();
    const emptyEl = Array.from(document.querySelectorAll("p")).find(
      (p) => /команд пока нет|no commands yet/i.test(p.textContent ?? "")
    );
    expect(emptyEl).toBeTruthy();
  });

  it("shows the add + button when no commands exist", async () => {
    render(<Home />);
    await waitForSidebar();
    const addBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => /^новая$|^new$/i.test(b.title?.trim() ?? "")
    );
    expect(addBtn).toBeDefined();
  });

  it("opens the add-form when + is clicked", async () => {
    render(<Home />);
    await waitForSidebar();
    clickAddButton();
    await waitFor(() => {
      const ta = Array.from(document.querySelectorAll("textarea")).find(
        (t) => /команду|command/i.test(t.placeholder)
      );
      expect(ta).toBeInTheDocument();
    });
  });

  it("Save button is disabled while textarea is empty", async () => {
    render(<Home />);
    await waitForSidebar();
    clickAddButton();
    await waitFor(() => {
      const ta = Array.from(document.querySelectorAll("textarea")).find(
        (t) => /команду|command/i.test(t.placeholder)
      );
      expect(ta).toBeInTheDocument();
    });
    const saveBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => /^сохранить$|^save$/i.test(b.textContent?.trim() ?? "")
    );
    expect(saveBtn).toBeDefined();
    expect(saveBtn.disabled).toBe(true);
  });

  it("closes add-form on Cancel without adding a command", async () => {
    render(<Home />);
    await waitForSidebar();
    clickAddButton();
    await waitFor(() =>
      expect(
        Array.from(document.querySelectorAll("textarea")).find(
          (t) => /команду|command/i.test(t.placeholder)
        )
      ).toBeInTheDocument()
    );
    const cancelBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => /^отмена$|^cancel$/i.test(b.textContent?.trim() ?? "")
    );
    expect(cancelBtn).toBeDefined();
    fireEvent.click(cancelBtn);
    await waitFor(() => {
      const el = Array.from(document.querySelectorAll("textarea")).find(
        (ta) => /команду|command/i.test(ta.placeholder)
      );
      expect(el).toBeFalsy();
    });
  });

  it("adds a command and renders it in the list", async () => {
    render(<Home />);
    await waitForSidebar();
    await addCommand("Focus on architecture");
    expect(await screen.findByText("Focus on architecture")).toBeInTheDocument();
  });

  it("hides empty-state text after a command is added", async () => {
    render(<Home />);
    await waitForSidebar();
    await addCommand("Do something");
    await waitFor(() =>
      expect(
        Array.from(document.querySelectorAll("p")).find(
          (p) => /команд пока нет|no commands yet/i.test(p.textContent ?? "")
        )
      ).toBeFalsy()
    );
  });

  it("applies a command to the prompt textarea on click", async () => {
    render(<Home />);
    await waitForSidebar();
    await addCommand("My custom instruction");
    const cmdButton = await screen.findByText("My custom instruction");
    fireEvent.click(cmdButton);
    const promptTA = Array.from(document.querySelectorAll("textarea")).find(
      (t) => /сообщение|type something/i.test(t.placeholder)
    );
    expect(promptTA?.value).toMatch("My custom instruction");
  });

  it("shows edit textarea when Pencil button is clicked", async () => {
    render(<Home />);
    await waitForSidebar();
    await addCommand("Original text");
    const editBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => /^изменить$|^edit$/i.test(b.title?.trim() ?? "")
    );
    expect(editBtn).toBeDefined();
    fireEvent.click(editBtn);
    const editTA = Array.from(document.querySelectorAll("textarea")).find(
      (t) => !t.placeholder
    );
    expect(editTA).toBeInTheDocument();
    expect(editTA?.value).toBe("Original text");
  });

  it("saves the edited command text", async () => {
    render(<Home />);
    await waitForSidebar();
    await addCommand("Before edit");
    const editBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => /^изменить$|^edit$/i.test(b.title?.trim() ?? "")
    );
    fireEvent.click(editBtn);
    const editTA = Array.from(document.querySelectorAll("textarea")).find(
      (t) => !t.placeholder
    );
    fireEvent.change(editTA, { target: { value: "After edit" } });
    const saveBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => /^сохранить$|^save$/i.test(b.textContent?.trim() ?? "")
    );
    fireEvent.click(saveBtn);
    expect(await screen.findByText("After edit")).toBeInTheDocument();
    expect(screen.queryByText("Before edit")).not.toBeInTheDocument();
  });

  it("cancels editing without changing command text", async () => {
    render(<Home />);
    await waitForSidebar();
    await addCommand("Stable text");
    const editBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => /^изменить$|^edit$/i.test(b.title?.trim() ?? "")
    );
    fireEvent.click(editBtn);
    const editTA = Array.from(document.querySelectorAll("textarea")).find(
      (t) => !t.placeholder
    );
    fireEvent.change(editTA, { target: { value: "Discarded change" } });
    const cancelBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => /^отмена$|^cancel$/i.test(b.textContent?.trim() ?? "")
    );
    fireEvent.click(cancelBtn);
    expect(await screen.findByText("Stable text")).toBeInTheDocument();
    expect(screen.queryByText("Discarded change")).not.toBeInTheDocument();
  });

  it("removes a command when the delete button is clicked", async () => {
    render(<Home />);
    await waitForSidebar();
    await addCommand("Command to delete");
    const deleteBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => /^удалить$|^delete$/i.test(b.title?.trim() ?? "")
    );
    expect(deleteBtn).toBeDefined();
    fireEvent.click(deleteBtn);
    await waitFor(() =>
      expect(screen.queryByText("Command to delete")).not.toBeInTheDocument()
    );
    const emptyEl = Array.from(document.querySelectorAll("p")).find(
      (p) => /команд пока нет|no commands yet/i.test(p.textContent ?? "")
    );
    expect(emptyEl).toBeTruthy();
  });

  it("persists commands to localStorage", async () => {
    render(<Home />);
    await waitForSidebar();
    await addCommand("Persistent cmd");
    await waitFor(() => {
      const raw = window.localStorage.getItem(UI_PREFS_KEY);
      expect(raw).not.toBeNull();
      const prefs = JSON.parse(raw);
      expect(prefs.systemCommands).toEqual(["Persistent cmd"]);
    });
  });

  it("restores commands from localStorage on remount", async () => {
    window.localStorage.setItem(
      UI_PREFS_KEY,
      JSON.stringify({ systemCommands: ["Restored cmd"] })
    );
    render(<Home />);
    expect(await screen.findByText("Restored cmd")).toBeInTheDocument();
  });

  it("commands list container has overflow-y-auto and max-h class", async () => {
    window.localStorage.setItem(
      UI_PREFS_KEY,
      JSON.stringify({ systemCommands: ["cmd1", "cmd2", "cmd3"] })
    );
    render(<Home />);
    await screen.findByText("cmd1");
    const scrollable = document.querySelector(".overflow-y-auto.max-h-52");
    expect(scrollable).toBeInTheDocument();
  });
});
