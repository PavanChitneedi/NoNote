import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ContextMenu from "./ContextMenu.jsx";

const nodes = [{ id: "n1", type: "note", title: "My Node", collapsed: false }];
const edges = [{ id: "e1", from: "n1", to: "n2" }];

function baseProps(overrides = {}) {
  return {
    x: 10, y: 10, nodeId: "n1", nodes, selected: new Set(), edges,
    canEdit: true, onClose: vi.fn(),
    onDuplicate: vi.fn(), onDelete: vi.fn(), onCollapse: vi.fn(), onConnect: vi.fn(),
    onEditTitle: vi.fn(), onSelectAll: vi.fn(), onProps: vi.fn(),
    ...overrides,
  };
}

describe("ContextMenu", () => {
  it("renders nothing when the node is not found", () => {
    const { container } = render(<ContextMenu {...baseProps({ nodeId: "missing" })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the node title and connection count", () => {
    render(<ContextMenu {...baseProps()} />);
    expect(screen.getByText("My Node")).toBeInTheDocument();
    expect(screen.getByText(/1 connections/)).toBeInTheDocument();
  });

  it("shows a view-only message and no edit actions when canEdit is false", () => {
    render(<ContextMenu {...baseProps({ canEdit: false })} />);
    expect(screen.getByText("View-only mode")).toBeInTheDocument();
    expect(screen.queryByText("Delete node")).not.toBeInTheDocument();
  });

  it("calls onDelete and onClose when Delete is clicked", () => {
    const props = baseProps();
    render(<ContextMenu {...props} />);
    fireEvent.click(screen.getByText("Delete node"));
    expect(props.onDelete).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  it("labels the duplicate/delete actions for multi-select when several nodes are selected", () => {
    const props = baseProps({ selected: new Set(["n1", "n2"]) });
    render(<ContextMenu {...props} />);
    expect(screen.getByText("Duplicate 2 nodes")).toBeInTheDocument();
    expect(screen.getByText("Delete 2 nodes")).toBeInTheDocument();
  });

  it("calls onCollapse when the collapse/expand item is clicked", () => {
    const props = baseProps();
    render(<ContextMenu {...props} />);
    fireEvent.click(screen.getByText("Collapse"));
    expect(props.onCollapse).toHaveBeenCalled();
  });
});
