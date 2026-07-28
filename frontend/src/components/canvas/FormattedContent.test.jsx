import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FormattedContent from "./FormattedContent.jsx";

describe("FormattedContent", () => {
  it("renders nothing for empty content", () => {
    const { container } = render(<FormattedContent content="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a heading line as bold text", () => {
    render(<FormattedContent content="### Section Title" />);
    expect(screen.getByText("Section Title")).toBeInTheDocument();
  });

  it("renders bullet list items", () => {
    render(<FormattedContent content={"- one\n- two"} />);
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
  });

  it("renders a fenced code block", () => {
    render(<FormattedContent content={"```js\nconsole.log(1)\n```"} />);
    expect(screen.getByText("console.log(1)")).toBeInTheDocument();
  });

  it("renders bold/italic/inline-code inline formatting", () => {
    render(<FormattedContent content="**bold** *italic* `code`" />);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("italic").tagName).toBe("EM");
    expect(screen.getByText("code").tagName).toBe("CODE");
  });

  it("renders a blockquote line", () => {
    render(<FormattedContent content="> quoted text" />);
    expect(screen.getByText("quoted text")).toBeInTheDocument();
  });
});
