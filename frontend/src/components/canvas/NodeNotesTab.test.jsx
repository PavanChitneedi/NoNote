import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import NodeNotesTab from "./NodeNotesTab.jsx";

function makeNode(overrides = {}) {
  return { id: "n1", node_notes: "", notes: [], notes_private: false, updated_at: null, ...overrides };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("NodeNotesTab", () => {
  it("renders the textarea with the node's existing notes text", () => {
    render(<NodeNotesTab node={makeNode({ node_notes: "hello there" })} canEdit={true} t={{ color: "#000" }} onUpdate={() => {}} />);
    expect(screen.getByPlaceholderText(/Write anything/)).toHaveValue("hello there");
  });

  it("debounces onUpdate calls after typing", () => {
    const onUpdate = vi.fn();
    render(<NodeNotesTab node={makeNode()} canEdit={true} t={{ color: "#000" }} onUpdate={onUpdate} />);
    fireEvent.change(screen.getByPlaceholderText(/Write anything/), { target: { value: "new text" } });
    expect(onUpdate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    expect(onUpdate).toHaveBeenCalledWith({ node_notes: "new text", notes_private: false });
  });

  it("toggles preview mode and renders formatted content", () => {
    render(<NodeNotesTab node={makeNode({ node_notes: "**bold text**" })} canEdit={true} t={{ color: "#000" }} onUpdate={() => {}} />);
    fireEvent.click(screen.getByTitle("Preview"));
    expect(screen.getByText("bold text")).toBeInTheDocument();
  });

  it("toggles the private flag via onUpdate when the switch is clicked", () => {
    const onUpdate = vi.fn();
    render(<NodeNotesTab node={makeNode()} canEdit={true} t={{ color: "#000" }} onUpdate={onUpdate} />);
    const label = screen.getByText(/Public — visible to everyone/);
    const toggle = within(label.parentElement).getByRole("button");
    fireEvent.click(toggle);
    expect(onUpdate).toHaveBeenCalledWith({ notes_private: true });
  });

  it("appends a timestamped entry when + Entry is clicked", () => {
    render(<NodeNotesTab node={makeNode({ node_notes: "existing" })} canEdit={true} t={{ color: "#000" }} onUpdate={() => {}} />);
    fireEvent.click(screen.getByText("+ Entry"));
    const textarea = screen.getByPlaceholderText(/Write anything/);
    expect(textarea.value).toContain("existing");
    expect(textarea.value).toContain("---");
  });

  it("is read-only and hides edit controls when canEdit is false", () => {
    render(<NodeNotesTab node={makeNode({ node_notes: "text" })} canEdit={false} t={{ color: "#000" }} onUpdate={() => {}} />);
    expect(screen.getByDisplayValue("text")).toHaveAttribute("readonly");
    expect(screen.queryByText("+ Entry")).not.toBeInTheDocument();
  });
});
