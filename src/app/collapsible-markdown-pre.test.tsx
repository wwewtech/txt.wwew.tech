import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CollapsibleMarkdownPre } from "@/app/page";

describe("CollapsibleMarkdownPre", () => {
  it("keeps manual collapsed state across rerender with same content", () => {
    const codeNode = (
      <code className="language-txt">{"1\n2\n3\n4\n5\n6\n7\n8\n9"}</code>
    );

    const { rerender } = render(<CollapsibleMarkdownPre>{codeNode}</CollapsibleMarkdownPre>);

    const getToggleButton = () => screen.getByRole("button", { name: "Toggle code block" });

    expect(getToggleButton()).toHaveTextContent("Expand");
    expect(screen.getByText(/Code hidden/i)).toBeInTheDocument();

    fireEvent.click(getToggleButton());
    expect(getToggleButton()).toHaveTextContent("Collapse");

    fireEvent.click(getToggleButton());
    expect(getToggleButton()).toHaveTextContent("Expand");
    expect(screen.getByText(/Code hidden/i)).toBeInTheDocument();

    rerender(<CollapsibleMarkdownPre>{codeNode}</CollapsibleMarkdownPre>);

    expect(getToggleButton()).toHaveTextContent("Expand");
    expect(getToggleButton()).not.toHaveTextContent("Collapse");
    expect(screen.getByText(/Code hidden/i)).toBeInTheDocument();
  });
});
