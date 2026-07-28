import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NodeSidebar from "./NodeSidebar.jsx";

describe("NodeSidebar", () => {
  it("renders a minimal collapsed bar and expands on click", () => {
    const onToggleCollapse = vi.fn();
    render(<NodeSidebar cats={{}} addNode={() => {}} canEdit={true} collapsed={true} onToggleCollapse={onToggleCollapse} />);
    expect(screen.getByText("NODES")).toBeInTheDocument();
    fireEvent.click(screen.getByText("›"));
    expect(onToggleCollapse).toHaveBeenCalled();
  });

  it("renders category headers and node type labels in full mode", () => {
    render(<NodeSidebar cats={{}} addNode={() => {}} canEdit={true} collapsed={false} />);
    expect(screen.getByText("Note")).toBeInTheDocument();
    expect(screen.getByText("GENERAL")).toBeInTheDocument();
  });

  it("filters node types by the search box", () => {
    render(<NodeSidebar cats={{}} addNode={() => {}} canEdit={true} collapsed={false} />);
    fireEvent.change(screen.getByPlaceholderText("Search types…"), { target: { value: "router" } });
    expect(screen.getByText("Router")).toBeInTheDocument();
    expect(screen.queryByText("Note")).not.toBeInTheDocument();
  });

  it("calls addNode with the type key when a node type is clicked (canEdit true)", () => {
    const addNode = vi.fn();
    render(<NodeSidebar cats={{}} addNode={addNode} canEdit={true} collapsed={false} />);
    fireEvent.click(screen.getByText("Note"));
    expect(addNode).toHaveBeenCalledWith("note");
  });

  it("does not call addNode when canEdit is false", () => {
    const addNode = vi.fn();
    render(<NodeSidebar cats={{}} addNode={addNode} canEdit={false} collapsed={false} />);
    fireEvent.click(screen.getByText("Note"));
    expect(addNode).not.toHaveBeenCalled();
    expect(screen.getByText("View only")).toBeInTheDocument();
  });

  it("shows a Recently Used section when recentTypes is provided", () => {
    render(<NodeSidebar cats={{}} addNode={() => {}} canEdit={true} collapsed={false} recentTypes={["note", "router"]} />);
    expect(screen.getByText("RECENT")).toBeInTheDocument();
  });
});
