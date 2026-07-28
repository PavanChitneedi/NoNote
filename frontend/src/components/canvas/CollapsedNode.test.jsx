import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileText } from "lucide-react";
import CollapsedNode from "./CollapsedNode.jsx";

const t = { icon: FileText, color: "#FFD93D", label: "Note" };

function makeNode(overrides = {}) {
  return {
    id: "n1", x: 10, y: 20, title: "My Note",
    properties: { Make: "Dell" }, notes: [], customProps: {},
    ...overrides,
  };
}

describe("CollapsedNode", () => {
  it("renders the node title", () => {
    render(<CollapsedNode node={makeNode()} t={t} isSel={false} canEdit={true} mode="select" />);
    expect(screen.getByText("My Note")).toBeInTheDocument();
  });

  it("shows the expand button when canEdit is true and calls onToggleCollapse", () => {
    const onToggleCollapse = vi.fn();
    render(<CollapsedNode node={makeNode()} t={t} isSel={false} canEdit={true} mode="select" onToggleCollapse={onToggleCollapse} />);
    fireEvent.click(screen.getByTitle("Expand node (⊞)"));
    expect(onToggleCollapse).toHaveBeenCalled();
  });

  it("hides the expand button when canEdit is false", () => {
    render(<CollapsedNode node={makeNode()} t={t} isSel={false} canEdit={false} mode="select" />);
    expect(screen.queryByTitle("Expand node (⊞)")).not.toBeInTheDocument();
  });

  it("shows a status dot for properties and calls onClick when clicked", () => {
    const onClick = vi.fn();
    const { container } = render(
      <CollapsedNode node={makeNode()} t={t} isSel={false} canEdit={true} mode="select" onClick={onClick} />
    );
    fireEvent.click(container.querySelector(".nn-node"));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByTitle("Has properties")).toBeInTheDocument();
  });

  it("shows a hover tooltip with property entries on mouse enter", () => {
    const { container } = render(
      <CollapsedNode node={makeNode({ properties: { Make: "Dell", Model: "R720" } })} t={t} isSel={false} canEdit={true} mode="select" />
    );
    fireEvent.mouseEnter(container.querySelector(".nn-node"));
    expect(screen.getByText("Make:")).toBeInTheDocument();
    expect(screen.getByText("Dell")).toBeInTheDocument();
  });
});
