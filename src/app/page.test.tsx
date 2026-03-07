import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/file-parser", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/file-parser")>();

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

describe("Home central panel UI/UX", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
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

  it("sends prompt and appends user + assistant bubbles", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    await user.type(composer, "Сделай summary контекста");
    fireEvent.click(screen.getByTitle("Send"));

    expect(await screen.findByText("You")).toBeInTheDocument();
    expect(await screen.findByText("Context Engine")).toBeInTheDocument();
    expect(screen.getByText("Context Updated")).toBeInTheDocument();
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

    expect(screen.getByText(/~10 tokens/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Предпросмотр" })).toBeInTheDocument();
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
    expect(await screen.findByText("Context Engine")).toBeInTheDocument();
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
    expect(screen.getByText("файлов: 2")).toBeInTheDocument();
    expect(screen.queryByText("файлов: 1")).not.toBeInTheDocument();
  });

  it("opens preview modal and deletes context from modal action", async () => {
    render(<Home />);

    const hiddenInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = hiddenInputs[0] as HTMLInputElement;
    const file = new File(["abc"], "modal.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    const preview = await screen.findByRole("button", { name: "Предпросмотр" });
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
    render(<Home />);

    const hiddenInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = hiddenInputs[0] as HTMLInputElement;
    const file = new File(["copy me"], "copy.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const copyNodes = await screen.findAllByText("copy.txt");
    expect(copyNodes.length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Скопировать" }));

    expect(writeTextSpy).toHaveBeenCalled();
    expect(writeTextSpy.mock.calls.at(-1)?.[0]).toContain("### FILE: copy.txt");
  });

  it("closes current chat from central header and resets workspace state", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Close chat" }));

    expect(screen.getByText(/New chat \(draft\)|Новый чат \(черновик\)/)).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: "Close chat" }));
    const historyEntry = await screen.findByRole("button", { name: /История восстановление/i });
    fireEvent.click(historyEntry);

    const restored = await screen.findAllByText("История восстановление");
    expect(restored.length).toBeGreaterThan(0);
    expect(screen.getByText(/Активный чат:/)).toBeInTheDocument();
  });

  it("does not create history entry when closing an empty draft", async () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "Close chat" }));

    expect(screen.getByText(/No entries yet|Записей пока нет/)).toBeInTheDocument();
    expect(screen.getByText(/New chat \(draft\)|Новый чат \(черновик\)/)).toBeInTheDocument();
  });

  it("keeps chats isolated when switching from history", async () => {
    render(<Home />);

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = fileInputs[0] as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [new File(["one"], "first.txt", { type: "text/plain" })] } });
    await screen.findAllByText("first.txt");
    fireEvent.click(screen.getByRole("button", { name: "Close chat" }));

    fireEvent.change(fileInput, { target: { files: [new File(["two"], "second.txt", { type: "text/plain" })] } });
    await screen.findAllByText("second.txt");
    fireEvent.click(screen.getByRole("button", { name: "Close chat" }));

    const firstHistory = await screen.findByRole("button", { name: /first.txt/i });
    fireEvent.click(firstHistory);

    expect(await screen.findAllByText("first.txt")).toBeTruthy();
    expect(screen.queryByText("second.txt")).not.toBeInTheDocument();
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

    expect(screen.getByText(/New chat \(draft\)|Новый чат \(черновик\)/)).toBeInTheDocument();
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
    expect(screen.getByText(/New chat \(draft\)|Новый чат \(черновик\)/)).toBeInTheDocument();
  });

  it("closing chat while preview is open closes modal too", async () => {
    render(<Home />);

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = fileInputs[0] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["modal"], "preview.txt", { type: "text/plain" })] } });

    fireEvent.click(await screen.findByRole("button", { name: "Предпросмотр" }));
    expect(await screen.findByRole("button", { name: "Close" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close chat" }));
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

    fireEvent.click(screen.getByRole("button", { name: "Close chat" }));
    expect(await screen.findByRole("button", { name: /Заголовок из сообщения/i })).toBeInTheDocument();
  });

  it("deleting non-active history item keeps active chat unchanged", async () => {
    render(<Home />);

    const composer = await screen.findByPlaceholderText("Type something…");
    fireEvent.change(composer, { target: { value: "Чат один" } });
    fireEvent.click(screen.getByTitle("Send"));
    fireEvent.click(screen.getByRole("button", { name: "Close chat" }));

    fireEvent.change(composer, { target: { value: "Чат два" } });
    fireEvent.click(screen.getByTitle("Send"));
    await screen.findByRole("button", { name: /Чат два/i });

    const chatOneEntry = await screen.findByRole("button", { name: /Чат один/i });
    const chatOneContainer = chatOneEntry.closest("[data-history-item]") as HTMLElement;
    fireEvent.click(within(chatOneContainer).getByRole("button", { name: "Actions" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

    expect(screen.getByText(/Активный чат:/)).toBeInTheDocument();
    expect(screen.getAllByText(/Чат два|Чат два \(copy\)/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Чат один/i })).not.toBeInTheDocument();
  });

  it("restores file context cards after reopening saved chat", async () => {
    render(<Home />);

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = fileInputs[0] as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["ctx"], "ctx.txt", { type: "text/plain" })] } });
    await screen.findAllByText("ctx.txt");

    fireEvent.click(screen.getByRole("button", { name: "Close chat" }));
    fireEvent.click(await screen.findByRole("button", { name: /ctx.txt/i }));

    expect(await screen.findAllByText("ctx.txt")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Предпросмотр" })).toBeInTheDocument();
  });
});
