import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InlineNodeEditor from "./InlineNodeEditor.jsx";

// NOTE: tab === 'notes' | 'live' | 'ai' render <NodeNotesTab>/<IntegrationPanel>/<NodeAIChat>
// which this file does not import (they're only imported by the parent NodeCanvas.jsx that
// composes InlineNodeEditor together with those siblings). Rendering with those tab values
// throws a ReferenceError in isolation, so these tests stick to 'props' | 'type' | 'conns'
// which are fully self-contained. Flagged separately — not fixed here since this is a
// test-only task.

function makeNode(overrides = {}) {
  return {
    id: "n1", type: "note", title: "My Node", description: "", w: 220, h: 96,
    properties: {}, customProps: {}, notes: [],
    ...overrides,
  };
}

function baseProps(overrides = {}) {
  return {
    node: makeNode(), x: 10, y: 10, tab: "props", nodes: [makeNode()], edges: [], canEdit: true,
    mapId: "map1", mapTitle: "Test Map",
    onTabChange: vi.fn(), onClose: vi.fn(), onUpdate: vi.fn(), onUpdateNotes: vi.fn(),
    onChangeType: vi.fn(), onUpdateCustom: vi.fn(), onDeleteCustom: vi.fn(), onAddCustom: vi.fn(),
    onRenameCustom: vi.fn(), onUpdateProp: vi.fn(),
    ...overrides,
  };
}

describe("InlineNodeEditor", () => {
  it("renders the header with the node title and calls onUpdate when it changes", () => {
    const props = baseProps();
    render(<InlineNodeEditor {...props} />);
    const titleInput = screen.getByDisplayValue("My Node");
    fireEvent.change(titleInput, { target: { value: "Renamed" } });
    expect(props.onUpdate).toHaveBeenCalledWith({ title: "Renamed" });
  });

  it("calls onClose when the × button is clicked", () => {
    const props = baseProps();
    render(<InlineNodeEditor {...props} />);
    fireEvent.click(screen.getByText("×"));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("calls onTabChange with the target tab id when a tab button is clicked (without switching content)", () => {
    const props = baseProps({ tab: "props" });
    render(<InlineNodeEditor {...props} />);
    fireEvent.click(screen.getByText(/Type/));
    expect(props.onTabChange).toHaveBeenCalledWith("type");
  });

  it("shows template properties on the props tab and edits them via onUpdate", () => {
    const props = baseProps({ node: makeNode({ properties: { IP: "10.0.0.1" } }) });
    render(<InlineNodeEditor {...props} />);
    expect(screen.getByText("IP")).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("10.0.0.1"), { target: { value: "10.0.0.2" } });
    expect(props.onUpdate).toHaveBeenCalledWith({ properties: { IP: "10.0.0.2" } });
  });

  it("shows the type tab with the current type highlighted, and switches type when a new one is clicked (no existing property values)", () => {
    const props = baseProps({ tab: "type" });
    render(<InlineNodeEditor {...props} />);
    expect(screen.getByText(/Current type:/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Router"));
    expect(props.onChangeType).toHaveBeenCalledWith("router");
  });

  it("shows a confirmation dialog before switching type when the node has property values set", () => {
    const props = baseProps({ tab: "type", node: makeNode({ properties: { IP: "10.0.0.1" } }) });
    render(<InlineNodeEditor {...props} />);
    fireEvent.click(screen.getByText("Router"));
    expect(props.onChangeType).not.toHaveBeenCalled();
    expect(screen.getByText("Change node type?")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Change + Keep Props"));
    expect(props.onChangeType).toHaveBeenCalledWith("router");
  });

  it("shows an empty-state message on the connections tab when there are no edges", () => {
    render(<InlineNodeEditor {...baseProps({ tab: "conns" })} />);
    expect(screen.getByText(/No connections yet/)).toBeInTheDocument();
  });

  it("disables the title input when canEdit is false", () => {
    render(<InlineNodeEditor {...baseProps({ canEdit: false })} />);
    expect(screen.getByDisplayValue("My Node")).toBeDisabled();
  });
});
