import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DragSegmented } from "@/components/drag-segmented";

describe("DragSegmented UI behavior", () => {
  const options = [
    { value: "chat", label: "Chat", content: <span>Chat</span> },
    { value: "stream", label: "Stream", content: <span>Stream</span> },
    { value: "realtime", label: "Realtime", content: <span>Realtime</span> },
  ] as const;

  it("renders all options", () => {
    render(<DragSegmented options={[...options]} value="chat" onValueChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Chat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stream" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Realtime" })).toBeInTheDocument();
  });

  it("changes value on click", () => {
    const onValueChange = vi.fn();
    render(<DragSegmented options={[...options]} value="chat" onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Stream" }));

    expect(onValueChange).toHaveBeenCalledWith("stream");
  });

  it("uses drag gesture to switch segment", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <DragSegmented options={[...options]} value="chat" onValueChange={onValueChange} />
    );

    const track = container.querySelector(".relative.inline-grid") as HTMLDivElement;
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 30,
      top: 0,
      right: 300,
      bottom: 30,
      left: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(track, { pointerId: 1, clientX: 10 });
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 220 });
    fireEvent.pointerUp(track, { pointerId: 1, clientX: 220 });

    expect(onValueChange).toHaveBeenCalledWith("realtime");
  });

  it("does not emit change when pointer id differs", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <DragSegmented options={[...options]} value="chat" onValueChange={onValueChange} />
    );

    const track = container.querySelector(".relative.inline-grid") as HTMLDivElement;
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 30,
      top: 0,
      right: 300,
      bottom: 30,
      left: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(track, { pointerId: 1, clientX: 10 });
    fireEvent.pointerMove(track, { pointerId: 2, clientX: 220 });
    fireEvent.pointerUp(track, { pointerId: 2, clientX: 220 });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("suppresses accidental click right after drag", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <DragSegmented options={[...options]} value="chat" onValueChange={onValueChange} />
    );

    const track = container.querySelector(".relative.inline-grid") as HTMLDivElement;
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 30,
      top: 0,
      right: 300,
      bottom: 30,
      left: 0,
      toJSON: () => ({}),
    });

    const streamButton = screen.getByRole("button", { name: "Stream" });

    fireEvent.pointerDown(track, { pointerId: 1, clientX: 10 });
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 120 });
    fireEvent.pointerUp(track, { pointerId: 1, clientX: 120 });
    fireEvent.click(streamButton);

    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("does not trigger drag selection below movement threshold", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <DragSegmented options={[...options]} value="chat" onValueChange={onValueChange} />
    );

    const track = container.querySelector(".relative.inline-grid") as HTMLDivElement;
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 30,
      top: 0,
      right: 300,
      bottom: 30,
      left: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(track, { pointerId: 1, clientX: 100 });
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 102 });
    fireEvent.pointerUp(track, { pointerId: 1, clientX: 102 });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("clamps drag selection to first segment on far-left pointer", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <DragSegmented options={[...options]} value="stream" onValueChange={onValueChange} />
    );

    const track = container.querySelector(".relative.inline-grid") as HTMLDivElement;
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 30,
      top: 0,
      right: 300,
      bottom: 30,
      left: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(track, { pointerId: 1, clientX: 110 });
    fireEvent.pointerMove(track, { pointerId: 1, clientX: -100 });
    fireEvent.pointerUp(track, { pointerId: 1, clientX: -100 });

    expect(onValueChange).toHaveBeenCalledWith("chat");
  });

  it("clamps drag selection to last segment on far-right pointer", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <DragSegmented options={[...options]} value="stream" onValueChange={onValueChange} />
    );

    const track = container.querySelector(".relative.inline-grid") as HTMLDivElement;
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 30,
      top: 0,
      right: 300,
      bottom: 30,
      left: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(track, { pointerId: 1, clientX: 110 });
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 999 });
    fireEvent.pointerUp(track, { pointerId: 1, clientX: 999 });

    expect(onValueChange).toHaveBeenCalledWith("realtime");
  });

  it("keeps interaction working after pointer cancel", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <DragSegmented options={[...options]} value="chat" onValueChange={onValueChange} />
    );

    const track = container.querySelector(".relative.inline-grid") as HTMLDivElement;
    fireEvent.pointerDown(track, { pointerId: 1, clientX: 10 });
    fireEvent.pointerCancel(track, { pointerId: 1 });

    fireEvent.click(screen.getByRole("button", { name: "Realtime" }));
    expect(onValueChange).toHaveBeenCalledWith("realtime");
  });

  it("applies custom class names to container and buttons", () => {
    render(
      <DragSegmented
        options={[...options]}
        value="chat"
        onValueChange={vi.fn()}
        className="custom-wrapper"
        buttonClassName="custom-button"
      />
    );

    expect(document.querySelector(".custom-wrapper")).toBeInTheDocument();
    expect(document.querySelectorAll(".custom-button").length).toBe(3);
  });

  it("suppresses only one post-drag click then allows next click", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <DragSegmented options={[...options]} value="chat" onValueChange={onValueChange} />
    );

    const track = container.querySelector(".relative.inline-grid") as HTMLDivElement;
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 300,
      height: 30,
      top: 0,
      right: 300,
      bottom: 30,
      left: 0,
      toJSON: () => ({}),
    });

    const streamButton = screen.getByRole("button", { name: "Stream" });

    fireEvent.pointerDown(track, { pointerId: 1, clientX: 10 });
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 150 });
    fireEvent.pointerUp(track, { pointerId: 1, clientX: 150 });

    fireEvent.click(streamButton);
    fireEvent.click(streamButton);

    expect(onValueChange).toHaveBeenCalledTimes(2);
  });
});
