import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PropsPanel from "./PropsPanel.jsx";

function makeNode(overrides = {}) {
  return {
    id: "n1", type: "note", title: "My Node", w: 220, h: 96,
    properties: {}, customProps: {}, notes: [], collapsed: false,
    ...overrides,
  };
}

function baseProps(overrides = {}) {
  return {
    node: makeNode(), edges: [], nodes: [makeNode()], isMobile: false, canEdit: true,
    onClose: vi.fn(), onUpdate: vi.fn(), onUpdateProp: vi.fn(), onUpdateCustom: vi.fn(),
    onDeleteCustom: vi.fn(), onAddCustom: vi.fn(), onRenameCustom: vi.fn(),
    onUpdateEdge: vi.fn(), onDeleteEdge: vi.fn(), onResetSize: vi.fn(), onUpdateNotes: vi.fn(),
    onStartEditTitle: vi.fn(), onToggleCollapse: vi.fn(),
    ...overrides,
  };
}

describe("PropsPanel", () => {
  it("renders the node title, type label and size fields", () => {
    render(<PropsPanel {...baseProps()} />);
    expect(screen.getByDisplayValue("My Node")).toBeInTheDocument();
    expect(screen.getByText("NOTE")).toBeInTheDocument();
    expect(screen.getByDisplayValue("220")).toBeInTheDocument();
    expect(screen.getByDisplayValue("96")).toBeInTheDocument();
  });

  it("calls onUpdate when the title is changed", () => {
    const props = baseProps();
    render(<PropsPanel {...props} />);
    fireEvent.change(screen.getByDisplayValue("My Node"), { target: { value: "Renamed" } });
    expect(props.onUpdate).toHaveBeenCalledWith("n1", { title: "Renamed" });
  });

  it("calls onClose and onToggleCollapse from the header buttons", () => {
    const props = baseProps();
    render(<PropsPanel {...props} />);
    fireEvent.click(screen.getByText("×"));
    expect(props.onClose).toHaveBeenCalled();
    fireEvent.click(screen.getByText("◀ COLLAPSE"));
    expect(props.onToggleCollapse).toHaveBeenCalled();
  });

  it("disables inputs and hides the add-custom button when canEdit is false", () => {
    render(<PropsPanel {...baseProps({ canEdit: false })} />);
    expect(screen.getByDisplayValue("My Node")).toBeDisabled();
    expect(screen.queryByText("+ ADD")).not.toBeInTheDocument();
  });

  it("renders custom properties and calls onUpdateCustom when a value changes", () => {
    const props = baseProps({ node: makeNode({ customProps: { env: "prod" } }) });
    render(<PropsPanel {...props} />);
    fireEvent.change(screen.getByDisplayValue("prod"), { target: { value: "staging" } });
    expect(props.onUpdateCustom).toHaveBeenCalledWith("n1", "env", "staging");
  });

  it("shows connections and calls onDeleteEdge when a connection is removed", () => {
    const other = makeNode({ id: "n2", title: "Other Node" });
    const props = baseProps({
      node: makeNode(),
      nodes: [makeNode(), other],
      edges: [{ id: "e1", from: "n1", to: "n2", label: "" }],
    });
    render(<PropsPanel {...props} />);
    expect(screen.getByText("Other Node")).toBeInTheDocument();
    const labelInput = screen.getByPlaceholderText("label");
    const deleteBtn = labelInput.parentElement.querySelector("button");
    fireEvent.click(deleteBtn);
    expect(props.onDeleteEdge).toHaveBeenCalledWith("e1");
  });

  it("adds a note when + ADD NOTE is clicked", () => {
    const props = baseProps();
    render(<PropsPanel {...props} />);
    fireEvent.click(screen.getByText("+ ADD NOTE"));
    expect(props.onUpdateNotes).toHaveBeenCalledWith("n1", expect.arrayContaining([
      expect.objectContaining({ title: "", content: "", sensitive: false }),
    ]));
  });
});
