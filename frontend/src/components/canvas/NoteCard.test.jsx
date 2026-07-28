import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NoteCard from "./NoteCard.jsx";

describe("NoteCard", () => {
  it("starts expanded with an editor when the note has no content", () => {
    const note = { id: "1", title: "", content: "", sensitive: false };
    render(<NoteCard note={note} canEdit={true} onChange={() => {}} onDelete={() => {}} />);
    expect(screen.getByPlaceholderText("Note title…")).toBeInTheDocument();
  });

  it("starts collapsed with a preview when the note has content", () => {
    const note = { id: "1", title: "My note", content: "<p>hello world</p>", sensitive: false };
    render(<NoteCard note={note} canEdit={true} onChange={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("hello world")).toBeInTheDocument();
    // rich text editor (only present in expanded body) should not be rendered
    expect(document.querySelector('[contenteditable]')).not.toBeInTheDocument();
  });

  it("toggles expanded state when the header is clicked", () => {
    const note = { id: "1", title: "My note", content: "<p>hello world</p>", sensitive: false };
    render(<NoteCard note={note} canEdit={true} onChange={() => {}} onDelete={() => {}} />);
    expect(document.querySelector('[contenteditable]')).not.toBeInTheDocument();
    // the title input stops propagation on click, so use the expand/collapse chevron instead
    fireEvent.click(screen.getByText("▸"));
    expect(document.querySelector('[contenteditable]')).not.toBeNull();
  });

  it("calls onChange with the updated title when editing", () => {
    const onChange = vi.fn();
    const note = { id: "1", title: "", content: "", sensitive: false };
    render(<NoteCard note={note} canEdit={true} onChange={onChange} onDelete={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Note title…"), { target: { value: "New title" } });
    expect(onChange).toHaveBeenCalledWith({ ...note, title: "New title" });
  });

  it("toggles the sensitive flag when the lock button is clicked", () => {
    const onChange = vi.fn();
    const note = { id: "1", title: "T", content: "", sensitive: false };
    render(<NoteCard note={note} canEdit={true} onChange={onChange} onDelete={() => {}} />);
    fireEvent.click(screen.getByTitle("Mark as sensitive"));
    expect(onChange).toHaveBeenCalledWith({ ...note, sensitive: true });
  });

  it("calls onDelete when the × button is clicked", () => {
    const onDelete = vi.fn();
    const note = { id: "1", title: "T", content: "", sensitive: false };
    render(<NoteCard note={note} canEdit={true} onChange={() => {}} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("×"));
    expect(onDelete).toHaveBeenCalled();
  });

  it("shows a read-only title and no delete button when canEdit is false", () => {
    const note = { id: "1", title: "Read only", content: "", sensitive: false };
    render(<NoteCard note={note} canEdit={false} onChange={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Read only")).toBeInTheDocument();
    expect(screen.queryByText("×")).not.toBeInTheDocument();
  });
});
