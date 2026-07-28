import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RichTextEditor from "./RichTextEditor.jsx";

beforeEach(() => {
  document.execCommand = vi.fn();
});

describe("RichTextEditor", () => {
  it("renders the initial HTML value inside the editable area", () => {
    const { container } = render(<RichTextEditor value="<p>hello</p>" onChange={() => {}} />);
    expect(container.querySelector('[contenteditable]').innerHTML).toBe("<p>hello</p>");
  });

  it("calls onChange with the new innerHTML when the user types", () => {
    const onChange = vi.fn();
    const { container } = render(<RichTextEditor value="" onChange={onChange} />);
    const editable = container.querySelector('[contenteditable]');
    editable.innerHTML = "<p>typed</p>";
    fireEvent.input(editable);
    expect(onChange).toHaveBeenCalledWith("<p>typed</p>");
  });

  it("runs document.execCommand and calls onChange when the Bold button is clicked", () => {
    const onChange = vi.fn();
    render(<RichTextEditor value="" onChange={onChange} />);
    fireEvent.mouseDown(screen.getByTitle("Bold (Ctrl+B)"));
    expect(document.execCommand).toHaveBeenCalledWith("bold", false, null);
    expect(onChange).toHaveBeenCalled();
  });

  it("reveals advanced formatting tools when ⋯ is clicked", () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    expect(screen.queryByTitle("Superscript")).not.toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTitle("More formatting tools"));
    expect(screen.getByTitle("Superscript")).toBeInTheDocument();
  });

  it("disables the editable area when disabled is true", () => {
    const { container } = render(<RichTextEditor value="" onChange={() => {}} disabled={true} />);
    expect(container.querySelector('[contenteditable]')).toHaveAttribute("contenteditable", "false");
  });
});
