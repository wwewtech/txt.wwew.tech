import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
import { parseFileWithPath, type ParsedItem } from "@/lib";

function makeParsedItem(path: string, overrides: Partial<ParsedItem> = {}): ParsedItem {
  return {
    id: `id-${path}`,
    name: path.split("/").pop() ?? path,
    path,
    size: 10,
    kind: "file",
    text: `### FILE: ${path}\n\nhello`,
    tokenEstimate: 10,
    sourceType: "txt",
    ...overrides,
  };
}

const parseFileWithPathMock = vi.mocked(parseFileWithPath);

function clickNewChat() {
  fireEvent.click(screen.getAllByRole("button", { name: /^New chat$|^Новый чат$/i })[0]);
}

describe("Home central panel UI/UX", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    parseFileWithPathMock.mockImplementation(async (_file: File, path: string) => makeParsedItem(path));
  });

  it("renders chat composer and top controls", async () => {
    render(<Home />);

    expect(await screen.findByPlaceholderText("Type something…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stream" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Realtime" })).toBeInTheDocument();
  });

  it("switches markdown toggle to raw mode", async () => {
    render(<Home />);

    const toggle = await screen.findByRole("button", { name: /Markdown ON|Raw/i });
    fireEvent.click(toggle);

    expect(screen.getByRole("button", { name: "Raw" })).toBeInTheDocument();
  });

  it("sends prompt and appends user bubble", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "Сделай summary контекста");
    fireEvent.click(screen.getByTitle("Send"));

    expect(await screen.findByText("You")).toBeInTheDocument();
    expect(screen.getAllByText("Сделай summary контекста").length).toBeGreaterThan(0);
  });

  it("uploads file through hidden input and shows context card", async () => {
    render(<Home />);

    const hiddenInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = hiddenInputs[0] as HTMLInputElement;
    const file = new File(["abc"], "hello.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(async () => {
      const nodes = await screen.findAllByText("hello.txt");
      expect(nodes.length).toBeGreaterThan(0);
    });

    expect((await screen.findAllByText(/~10 tokens/)).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Preview|Предпросмотр/i })).toBeInTheDocument();
  });

  it("sends prompt by Enter and keeps Shift+Enter as multiline", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");

    await user.type(composer, "Строка 1");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.type(composer, "Строка 2");
    expect(composer).toHaveValue("Строка 1\nСтрока 2");

    await user.keyboard("{Enter}");
    expect(await screen.findByText("You")).toBeInTheDocument();
    expect(screen.getAllByText(/Строка 1/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Строка 2/).length).toBeGreaterThan(0);
  });

  it("groups uploaded files by folder root into one context card", async () => {
    render(<Home />);

    const hiddenInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = hiddenInputs[0] as HTMLInputElement;
    const fileA = new File(["a"], "a.txt", { type: "text/plain" });
    const fileB = new File(["b"], "b.txt", { type: "text/plain" });
    Object.defineProperty(fileA, "webkitRelativePath", { value: "project/src/a.txt" });
    Object.defineProperty(fileB, "webkitRelativePath", { value: "project/src/b.txt" });

    fireEvent.change(fileInput, { target: { files: [fileA, fileB] } });

    const projectNodes = await screen.findAllByText("project");
    expect(projectNodes.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/файлов:\s*2|files:\s*2/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/файлов:\s*1|files:\s*1/i)).not.toBeInTheDocument();
  });

  it("renders per-file actions for each item inside grouped context", async () => {
    render(<Home />);

    const hiddenInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = hiddenInputs[0] as HTMLInputElement;
    const fileA = new File(["a"], "a.txt", { type: "text/plain" });
    const fileB = new File(["b"], "b.txt", { type: "text/plain" });
    Object.defineProperty(fileA, "webkitRelativePath", { value: "project/src/a.txt" });
    Object.defineProperty(fileB, "webkitRelativePath", { value: "project/src/b.txt" });

    fireEvent.change(fileInput, { target: { files: [fileA, fileB] } });

    const itemACard = (await screen.findAllByText("a.txt"))[0].closest(".rounded-xl") as HTMLElement;
    const itemBCard = (await screen.findAllByText("b.txt"))[0].closest(".rounded-xl") as HTMLElement;

    [itemACard, itemBCard].forEach((card) => {
      expect(within(card).getByRole("button", { name: /Preview|Предпросмотр/i })).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: "TXT" })).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: "MD" })).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: /Download|Скачать/i })).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: /Edit|Изменить/i })).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: /Delete|Удалить/i })).toBeInTheDocument();
    });
  });

  it("opens preview modal and deletes context from modal action", async () => {
    render(<Home />);

    const hiddenInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = hiddenInputs[0] as HTMLInputElement;
    const file = new File(["abc"], "modal.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    const preview = await screen.findByRole("button", { name: /Preview|Предпросмотр/i });
    fireEvent.click(preview);

    const modalNodes = await screen.findAllByText("modal.txt");
    expect(modalNodes.length).toBeGreaterThan(0);
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByText("modal.txt")).not.toBeInTheDocument();
    });
  });

  it("copies aggregated context text from card action", async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const user = userEvent.setup();
    render(<Home />);

    const hiddenInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = hiddenInputs[0] as HTMLInputElement;
    const file = new File(["copy me"], "copy.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const copyNodes = await screen.findAllByText("copy.txt");
    expect(copyNodes.length).toBeGreaterThan(0);
    const card = copyNodes[0].closest(".group") as HTMLElement;
    await user.click(within(card).getByRole("button", { name: "MD" }));

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalled();
    });
    expect(writeTextSpy.mock.calls.at(-1)?.[0]).toContain("### FILE: copy.txt");
  });

  it("edits context from card action", async () => {
    render(<Home />);

    const hiddenInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = hiddenInputs[0] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["initial"], "edit-context.txt", { type: "text/plain" })] } });

    const nameNode = (await screen.findAllByText("edit-context.txt"))[0];
    const card = nameNode.closest(".group") as HTMLElement;
    fireEvent.click(within(card).getByRole("button", { name: "Edit" }));
    fireEvent.change(await screen.findByPlaceholderText(/Введите новый контекст|Enter updated context/i), {
      target: { value: "UPDATED CONTEXT" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Save$|^Сохранить$/i }));
    fireEvent.click(within(card).getByRole("button", { name: /Preview|Предпросмотр/i }));

    expect(await screen.findByText("UPDATED CONTEXT")).toBeInTheDocument();
  });

  it("cancel in edit dialog keeps original context", async () => {
    render(<Home />);

    const hiddenInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = hiddenInputs[0] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["initial"], "cancel-edit.txt", { type: "text/plain" })] } });

    const nameNode = (await screen.findAllByText("cancel-edit.txt"))[0];
    const card = nameNode.closest(".group") as HTMLElement;
    fireEvent.click(within(card).getByRole("button", { name: "Edit" }));
    fireEvent.change(await screen.findByPlaceholderText(/Введите новый контекст|Enter updated context/i), {
      target: { value: "SHOULD NOT SAVE" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Cancel$|^Отмена$/i }));
    fireEvent.click(within(card).getByRole("button", { name: /Preview|Предпросмотр/i }));

    expect(screen.queryByText("SHOULD NOT SAVE")).not.toBeInTheDocument();
    expect(await screen.findByText("hello")).toBeInTheDocument();
  });

  it("starts new chat and resets workspace state", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const hiddenInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = hiddenInputs[0] as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(["state"], "state.txt", { type: "text/plain" })] },
    });
    await screen.findAllByText("state.txt");

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "Проверка закрытия");

    clickNewChat();

    expect(screen.getByText(/LLM Context Builder|Сборщик LLM-контекста/)).toBeInTheDocument();
    expect(screen.queryByText("state.txt")).not.toBeInTheDocument();
    expect(composer).toHaveValue("");
  });

  it("restores closed chat from history with its messages", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "История восстановление");
    fireEvent.click(screen.getByTitle("Send"));

    await screen.findByText("You");
    await waitFor(() => {
      expect(screen.getAllByText("История восстановление").length).toBeGreaterThan(0);
    });

    clickNewChat();
    const historyEntry = await screen.findByRole("button", { name: /История восстановление/i });
    fireEvent.click(historyEntry);

    const restored = await screen.findAllByText("История восстановление");
    expect(restored.length).toBeGreaterThan(0);
    expect(screen.getByText(/LLM Context Builder|Сборщик LLM-контекста/)).toBeInTheDocument();
  });

  it("does not create history entry when closing an empty draft", async () => {
    render(<Home />);

    clickNewChat();

    expect(screen.getByText(/No entries yet|Записей пока нет/)).toBeInTheDocument();
    expect(screen.getByText(/LLM Context Builder|Сборщик LLM-контекста/)).toBeInTheDocument();
  });

  it("keeps chats isolated when switching from history", async () => {
    render(<Home />);
    const timeline = document.querySelector(".mx-auto.flex.w-full.max-w-3xl.flex-col.gap-3") as HTMLElement;

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = fileInputs[0] as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [new File(["one"], "first.txt", { type: "text/plain" })] } });
    await screen.findAllByText("first.txt");
    clickNewChat();

    fireEvent.change(fileInput, { target: { files: [new File(["two"], "second.txt", { type: "text/plain" })] } });
    await screen.findAllByText("second.txt");
    clickNewChat();

    const firstHistory = await screen.findByRole("button", { name: /first.txt/i });
    fireEvent.click(firstHistory);

    expect(await within(timeline).findAllByText("first.txt")).toBeTruthy();
    expect(within(timeline).queryByText("second.txt")).not.toBeInTheDocument();
  });

  it("deleting active chat from history resets center to draft", async () => {
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    fireEvent.change(composer, { target: { value: "Удаляем активный" } });
    fireEvent.click(screen.getByTitle("Send"));

    const activeHistoryBtn = await screen.findByRole("button", { name: /Удаляем активный/i });
    fireEvent.click(activeHistoryBtn);

    const historyItems = document.querySelectorAll("[data-history-item]");
    const target = historyItems[0] as HTMLElement;
    fireEvent.click(within(target).getByRole("button", { name: "Actions" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

    expect(screen.getByText(/LLM Context Builder|Сборщик LLM-контекста/)).toBeInTheDocument();
  });

  it("left New chat keeps history entries but clears current center state", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "Левый new chat");
    fireEvent.click(screen.getByTitle("Send"));
    await screen.findByRole("button", { name: /Левый new chat/i });

    fireEvent.click(screen.getByRole("button", { name: /^New chat$/ }));

    expect(screen.getByRole("button", { name: /Левый new chat/i })).toBeInTheDocument();
    expect(composer).toHaveValue("");
    expect(screen.getByText(/LLM Context Builder|Сборщик LLM-контекста/)).toBeInTheDocument();
  });

  it("starting new chat while preview is open closes modal too", async () => {
    render(<Home />);

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = fileInputs[0] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["modal"], "preview.txt", { type: "text/plain" })] } });

    fireEvent.click(await screen.findByRole("button", { name: /Preview|Предпросмотр/i }));
    expect(await screen.findByRole("button", { name: "Close" })).toBeInTheDocument();

    clickNewChat();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });
  });

  it("does not send anything when composer is empty", async () => {
    render(<Home />);

    fireEvent.click(screen.getByTitle("Send"));

    expect(screen.queryByText("You")).not.toBeInTheDocument();
    expect(screen.queryByText("Context Engine")).not.toBeInTheDocument();
  });

  it("uses first user message as history title when prompt became empty", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "Заголовок из сообщения");
    fireEvent.click(screen.getByTitle("Send"));

    clickNewChat();
    expect(await screen.findByRole("button", { name: /Заголовок из сообщения/i })).toBeInTheDocument();
  });

  it("deleting non-active history item keeps active chat unchanged", async () => {
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    fireEvent.change(composer, { target: { value: "Чат один" } });
    fireEvent.click(screen.getByTitle("Send"));
    clickNewChat();

    fireEvent.change(composer, { target: { value: "Чат два" } });
    fireEvent.click(screen.getByTitle("Send"));
    await screen.findByRole("button", { name: /Чат два/i });

    const chatOneEntry = await screen.findByRole("button", { name: /Чат один/i });
    const chatOneContainer = chatOneEntry.closest("[data-history-item]") as HTMLElement;
    fireEvent.click(within(chatOneContainer).getByRole("button", { name: "Actions" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

    expect(screen.getByText(/LLM Context Builder|Сборщик LLM-контекста/)).toBeInTheDocument();
    expect(screen.getAllByText(/Чат два|Чат два \(copy\)/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Чат один/i })).not.toBeInTheDocument();
  });

  it("does not auto-save when autosave is off", async () => {
    const user = userEvent.setup();
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Autosave: ON|Автосейв: ON/i }));

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "Не сохраняй автоматически");
    fireEvent.click(screen.getByTitle("Send"));
    clickNewChat();

    expect(screen.getByText(/No entries yet|Записей пока нет/)).toBeInTheDocument();
  });

  it("restores file context cards after reopening saved chat", async () => {
    render(<Home />);

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = fileInputs[0] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["ctx"], "ctx.txt", { type: "text/plain" })] } });
    await screen.findAllByText("ctx.txt");

    clickNewChat();
    fireEvent.click(await screen.findByRole("button", { name: /ctx.txt/i }));

    expect(await screen.findAllByText("ctx.txt")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Preview|Предпросмотр/i })).toBeInTheDocument();
  });

  it("[extra 01] renders initial drop hint", () => {
    render(<Home />);
    expect(
      screen.getByText(/Перетащи файлы, архивы или папки сюда|Drop files, archives, or folders here|Add files to see final context/i)
    ).toBeInTheDocument();
  });

  it("[extra 02] renders markdown table in chat bubble", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "| a | b |\n| - | - |\n| 1 | 2 |");
    fireEvent.click(screen.getByTitle("Send"));

    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("[extra 03] renders inline math with katex", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "Инлайн: $a^2+b^2=c^2$");
    fireEvent.click(screen.getByTitle("Send"));

    await screen.findByText("You");
    expect(document.querySelector(".katex")).toBeTruthy();
  });

  it("[extra 04] renders block math with katex-display", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "$$\n\\int_0^1 x^2 dx\n$$");
    fireEvent.click(screen.getByTitle("Send"));

    await screen.findByText("You");
    expect(document.querySelector(".katex-display")).toBeTruthy();
  });

  it("[extra 05] raw mode keeps markdown as plain text", async () => {
    const user = userEvent.setup();
    render(<Home />);

    fireEvent.click(await screen.findByRole("button", { name: /Markdown ON|Raw/i }));
    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "| a | b |\n| - | - |\n| 1 | 2 |");
    fireEvent.click(screen.getByTitle("Send"));

    const rawMatches = await screen.findAllByText((text) => text.includes("| a | b |"));
    expect(rawMatches.length).toBeGreaterThan(0);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("[extra 06] markdown code fence renders code panel", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "```ts\nconst x = 1\n```");
    fireEvent.click(screen.getByTitle("Send"));

    expect(await screen.findByText("ts")).toBeInTheDocument();
  });

  it("[extra 06.1] keeps chronological order between context card and later prompt", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const timeline = document.querySelector(".mx-auto.flex.w-full.max-w-3xl.flex-col.gap-3") as HTMLElement;

    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(["x"], "timeline.txt", { type: "text/plain" })] },
    });

    const contextNode = await within(timeline).findByText("timeline.txt", { selector: "p.text-sm.font-medium" });

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "сообщение после файла");
    fireEvent.click(screen.getByTitle("Send"));

    const messageNode = await within(timeline).findByText("сообщение после файла", { selector: "pre" });
    expect(Boolean(contextNode.compareDocumentPosition(messageNode) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it("[extra 07] hides right sidebar", async () => {
    render(<Home />);

    fireEvent.click(screen.getByTitle(/Hide right sidebar|Скрыть правую панель/));
    expect(screen.getByTitle(/Open right sidebar|Открыть правую панель/)).toBeInTheDocument();
  });

  it("[extra 08] reopens right sidebar", async () => {
    render(<Home />);

    fireEvent.click(screen.getByTitle(/Hide right sidebar|Скрыть правую панель/));
    fireEvent.click(screen.getByTitle(/Open right sidebar|Открыть правую панель/));
    expect(screen.getByText(/Settings|Настройки/)).toBeInTheDocument();
  });

  it("[extra 09] quick prompt appends text to composer", async () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Сфокусируй ответ на архитектуре решения|Focus on solution architecture/i }));
    expect(await screen.findByDisplayValue(/Сфокусируй ответ на архитектуре решения|Focus on solution architecture/i)).toBeInTheDocument();
  });

  it("[extra 11] selects all visible files", async () => {
    render(<Home />);

    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: {
        files: [
          new File(["a"], "aa.txt", { type: "text/plain" }),
          new File(["b"], "bb.txt", { type: "text/plain" }),
        ],
      },
    });

    await screen.findAllByText(/aa.txt|bb.txt/);
    fireEvent.click(screen.getByRole("button", { name: /visible/i }));
    expect(screen.getByText(/selected: 2/i)).toBeInTheDocument();
  });

  it("[extra 12] removes selected files", async () => {
    render(<Home />);

    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: {
        files: [
          new File(["a"], "rm-a.txt", { type: "text/plain" }),
          new File(["b"], "rm-b.txt", { type: "text/plain" }),
        ],
      },
    });

    await screen.findAllByText(/rm-a.txt|rm-b.txt/);
    fireEvent.click(screen.getByRole("button", { name: /visible/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Remove$/i }));
    expect(screen.queryByText("rm-a.txt")).not.toBeInTheDocument();
    expect(screen.queryByText("rm-b.txt")).not.toBeInTheDocument();
  });

  it("[extra 13] filter input narrows visible count", async () => {
    render(<Home />);

    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: {
        files: [
          new File(["a"], "alpha.txt", { type: "text/plain" }),
          new File(["b"], "beta.txt", { type: "text/plain" }),
        ],
      },
    });

    await screen.findAllByText(/alpha.txt|beta.txt/);
    fireEvent.change(screen.getByPlaceholderText(/Filter|Фильтр/i), { target: { value: "alpha" } });
    expect(screen.getByText(/visible: 1/i)).toBeInTheDocument();
  });

  it("[extra 14] include prompt off excludes prompt from copied draft", async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "PROMPT-HIDDEN");

    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["a"], "draft.txt", { type: "text/plain" })] } });
    await screen.findAllByText("draft.txt");

    await user.click(screen.getByLabelText(/Include prompt|Включать prompt|Включать промпт/i));
    await user.click(screen.getByRole("button", { name: /Draft|Черновик/ }));

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalled();
    });

    const copied = String(writeTextSpy.mock.calls.at(-1)?.[0] ?? "");
    expect(copied).not.toContain("PROMPT-HIDDEN");
  });

  it("[extra 15] anonymous mode prevents history records", async () => {
    const user = userEvent.setup();
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Anonymous chat|Анонимный чат/i }));
    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "private session");
    fireEvent.click(screen.getByTitle("Send"));
    clickNewChat();

    expect(screen.getByText(/No entries yet|Записей пока нет/)).toBeInTheDocument();
  });

  it("[extra 16] export txt uses object URL lifecycle", async () => {
    const createSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<Home />);

    fireEvent.click(screen.getByTitle(/Download \.txt|Скачать \.txt/i));

    expect(createSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith("blob:fake");
  });

  it("[extra 17] share action copies encoded url", async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "share me");
    fireEvent.click(screen.getByTitle("Send"));
    clickNewChat();

    const historyItem = await screen.findByRole("button", { name: /share me/i });
    const container = historyItem.closest("[data-history-item]") as HTMLElement;
    await user.click(within(container).getByRole("button", { name: "Actions" }));
    await user.click(await screen.findByRole("button", { name: /Share|Поделиться/ }));

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalled();
    });

    expect(String(writeTextSpy.mock.calls.at(-1)?.[0] ?? "")).toContain("#shared=");
  });

  it("[extra 18] duplicate action creates copy entry", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "dup source");
    fireEvent.click(screen.getByTitle("Send"));
    clickNewChat();

    const historyItem = await screen.findByRole("button", { name: /dup source/i });
    const container = historyItem.closest("[data-history-item]") as HTMLElement;
    fireEvent.click(within(container).getByRole("button", { name: "Actions" }));
    fireEvent.click(await screen.findByRole("button", { name: /Duplicate|Сделать копию/ }));

    expect(await screen.findByRole("button", { name: /dup source \(copy\)/i })).toBeInTheDocument();
  });

  it("[extra 19] rename action updates history title", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "rename source");
    fireEvent.click(screen.getByTitle("Send"));
    clickNewChat();

    const historyItem = await screen.findByRole("button", { name: /rename source/i });
    const container = historyItem.closest("[data-history-item]") as HTMLElement;
    fireEvent.click(within(container).getByRole("button", { name: "Actions" }));
    fireEvent.click(await screen.findByRole("button", { name: /Rename|Переименовать/ }));
    fireEvent.change(await screen.findByPlaceholderText(/Введите название чата|Enter chat title/i), {
      target: { value: "Renamed chat" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Save$|^Сохранить$/i }));

    expect(await screen.findByRole("button", { name: /Renamed chat/i })).toBeInTheDocument();
  });

  it("[extra 19.1] closing rename dialog keeps original title", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "keep old title");
    fireEvent.click(screen.getByTitle("Send"));
    clickNewChat();

    const historyItem = await screen.findByRole("button", { name: /keep old title/i });
    const container = historyItem.closest("[data-history-item]") as HTMLElement;
    fireEvent.click(within(container).getByRole("button", { name: "Actions" }));
    fireEvent.click(await screen.findByRole("button", { name: /Rename|Переименовать/ }));
    fireEvent.change(await screen.findByPlaceholderText(/Введите название чата|Enter chat title/i), {
      target: { value: "Should not rename" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Close$|^Закрыть$/i }));

    expect(await screen.findByRole("button", { name: /keep old title/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Should not rename/i })).not.toBeInTheDocument();
  });

  it("[extra 20] copy prompt action writes prompt text", async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "copy prompt content");
    clickNewChat();

    const historyItem = await screen.findByRole("button", { name: /copy prompt content/i });
    const container = historyItem.closest("[data-history-item]") as HTMLElement;
    await user.click(within(container).getByRole("button", { name: "Actions" }));
    await user.click(await screen.findByRole("button", { name: /Copy prompt|Копировать prompt|Копировать промпт/ }));

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalled();
    });

    expect(String(writeTextSpy.mock.calls.at(-1)?.[0] ?? "")).toContain("copy prompt content");
  });

  it("[extra 21] copy final action writes final context", async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const user = userEvent.setup();
    render(<Home />);

    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["x"], "final.txt", { type: "text/plain" })] } });
    await screen.findAllByText("final.txt");

    clickNewChat();
    const historyItem = await screen.findByRole("button", { name: /final.txt/i });
    const container = historyItem.closest("[data-history-item]") as HTMLElement;
    await user.click(within(container).getByRole("button", { name: "Actions" }));
    await user.click(await screen.findByRole("button", { name: /Copy final|Копировать итог/ }));

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalled();
    });

    expect(String(writeTextSpy.mock.calls.at(-1)?.[0] ?? "")).toContain("# LLM Context Bundle");
  });

  it("[extra 22] outside click closes history menu", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "outside menu");
    fireEvent.click(screen.getByTitle("Send"));
    clickNewChat();

    const historyItem = await screen.findByRole("button", { name: /outside menu/i });
    const container = historyItem.closest("[data-history-item]") as HTMLElement;
    fireEvent.click(within(container).getByRole("button", { name: "Actions" }));
    expect(await screen.findByRole("button", { name: /Delete|Удалить/ })).toBeInTheDocument();

    fireEvent.click(document.body);
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Delete|Удалить/ })).not.toBeInTheDocument();
    });
  });

  it("[extra 23] preview down button scrolls to bottom", async () => {
    render(<Home />);

    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["x"], "scroll.txt", { type: "text/plain" })] } });
    fireEvent.click(await screen.findByRole("button", { name: /Preview|Предпросмотр/i }));

    const container = document.querySelector(".preview-scroll") as HTMLDivElement;
    Object.defineProperty(container, "scrollHeight", { value: 777, configurable: true });
    container.scrollTop = 0;

    fireEvent.click(screen.getByRole("button", { name: /^Down$|^Вниз$/ }));
    expect(container.scrollTop).toBe(777);
  });

  it("[extra 24] resizing separator changes sidebar width variable", () => {
    render(<Home />);

    const separator = screen.getByRole("separator");
    fireEvent.mouseDown(separator);
    fireEvent.mouseMove(window, { clientX: 900 });
    fireEvent.mouseUp(window);

    const host = document.querySelector("div[style*='--right-sidebar-width']") as HTMLDivElement;
    expect(host.style.getPropertyValue("--right-sidebar-width")).not.toBe("320px");
  });

  it("[extra 25] build selected copies only selected context", async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const user = userEvent.setup();
    render(<Home />);

    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: {
        files: [
          new File(["x"], "sel-a.txt", { type: "text/plain" }),
          new File(["y"], "sel-b.txt", { type: "text/plain" }),
        ],
      },
    });

    await screen.findAllByText(/sel-a.txt|sel-b.txt/);
    const fileCheckboxes = screen
      .getAllByRole("checkbox")
      .filter((input) => input.className.includes("h-3.5"));
    await user.click(fileCheckboxes[0]);
    await user.click(screen.getByRole("button", { name: /Build selected|Собрать selected|Собрать выбранное/ }));

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalled();
    });

    const copied = String(writeTextSpy.mock.calls.at(-1)?.[0] ?? "");
    expect(copied).toContain("sel-a.txt");
    expect(copied).not.toContain("sel-b.txt");
  });

  it("[extra 26] deleting single file from list removes item", async () => {
    render(<Home />);

    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["x"], "single-del.txt", { type: "text/plain" })] } });
    await screen.findAllByText("single-del.txt");

    const deleteButtons = Array.from(document.querySelectorAll("button.text-red-500")) as HTMLButtonElement[];
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(screen.queryByText("single-del.txt")).not.toBeInTheDocument();
    });
  });

  it("[extra 27] close button hides preview modal", async () => {
    render(<Home />);

    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["x"], "modal-close.txt", { type: "text/plain" })] } });
    fireEvent.click(await screen.findByRole("button", { name: /Preview|Предпросмотр/i }));

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });
  });

  it("[extra 28] markdown toggle can be switched back and forth", async () => {
    render(<Home />);

    const toggle = await screen.findByRole("button", { name: /Markdown ON|Raw/i });
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Raw" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Raw" }));
    expect(screen.getByRole("button", { name: "Markdown ON" })).toBeInTheDocument();
  });

  it("[extra 29] activity log records file upload", async () => {
    render(<Home />);

    const fileInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["x"], "activity-file.txt", { type: "text/plain" })] } });

    expect(await screen.findByText(/Загрузка:\s*1\s*шт\.|Upload:\s*1\s*item\(s\)/i)).toBeInTheDocument();
  });

  it("[extra 30] activity log records prompt send", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "activity prompt");
    fireEvent.click(screen.getByTitle("Send"));

    expect(await screen.findByText(/Prompt отправлен в контекстную ленту|Prompt sent to context timeline/)).toBeInTheDocument();
  });
});
