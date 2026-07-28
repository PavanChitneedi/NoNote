import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CommentsPanel from "./CommentsPanel.jsx";

const nodes = [
  { id: "n1", type: "note", title: "Node One" },
  { id: "n2", type: "note", title: "Node Two" },
];

function baseProps(overrides = {}) {
  return {
    comments: {},
    nodes,
    commentNode: null,
    setCommentNode: vi.fn(),
    draft: "",
    setDraft: vi.fn(),
    user: { display_name: "Alice" },
    onAdd: vi.fn(),
    onDelete: vi.fn(),
    onScrollTo: vi.fn(),
    ...overrides,
  };
}

describe("CommentsPanel", () => {
  it("shows an empty state when there are no comments on any node", () => {
    render(<CommentsPanel {...baseProps()} />);
    expect(screen.getByText("No comments on any node")).toBeInTheDocument();
  });

  it("lists nodes that have comments with their thread counts", () => {
    const comments = { n1: [{ id: "c1", author: "Alice", text: "Hi there", ts: Date.now() }] };
    render(<CommentsPanel {...baseProps({ comments })} />);
    expect(screen.getByText("Node One")).toBeInTheDocument();
    expect(screen.getByText("Hi there")).toBeInTheDocument();
    expect(screen.queryByText("Node Two")).not.toBeInTheDocument();
  });

  it("selects a node thread and scrolls to it when its header is clicked", () => {
    const comments = { n1: [{ id: "c1", author: "Alice", text: "Hi there", ts: Date.now() }] };
    const props = baseProps({ comments });
    render(<CommentsPanel {...props} />);
    fireEvent.click(screen.getByText("Node One"));
    expect(props.setCommentNode).toHaveBeenCalledWith("n1");
    expect(props.onScrollTo).toHaveBeenCalledWith("n1");
  });

  it("shows the reply box when a commentNode is active and calls onAdd with the draft text", () => {
    const props = baseProps({ commentNode: "n1", draft: "New comment" });
    render(<CommentsPanel {...props} />);
    expect(screen.getByText(/REPLY ON/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("↑"));
    expect(props.onAdd).toHaveBeenCalledWith("n1", "New comment");
  });

  it("does not add an empty/whitespace-only comment", () => {
    const props = baseProps({ commentNode: "n1", draft: "   " });
    render(<CommentsPanel {...props} />);
    fireEvent.click(screen.getByText("↑"));
    expect(props.onAdd).not.toHaveBeenCalled();
  });

  it("calls onDelete with the node id and comment id", () => {
    const comments = { n1: [{ id: "c1", author: "Alice", text: "Hi there", ts: Date.now() }] };
    const props = baseProps({ comments, commentNode: "n1" });
    render(<CommentsPanel {...props} />);
    fireEvent.click(screen.getByText("×"));
    expect(props.onDelete).toHaveBeenCalledWith("n1", "c1");
  });
});
