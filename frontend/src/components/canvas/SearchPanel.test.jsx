import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileText } from "lucide-react";
import SearchPanel from "./SearchPanel.jsx";

const t = { icon: FileText, color: "#FFD93D", label: "Note" };
const nodes = [{ id: "n1", x: 10, y: 20, title: "Router config" }];
const edges = [];

function makeResult(overrides = {}) {
  return { node: nodes[0], t, hits: [{ field: "title", snippet: "Router config" }], ...overrides };
}

function baseProps(overrides = {}) {
  return {
    query: "", setQuery: vi.fn(), field: "all", setField: vi.fn(),
    results: [], onSelect: vi.fn(), onClose: vi.fn(), nodes, edges,
    ...overrides,
  };
}

describe("SearchPanel", () => {
  it("shows the empty-search helper state when there is no query", () => {
    render(<SearchPanel {...baseProps()} />);
    expect(screen.getByText("Search across all your nodes")).toBeInTheDocument();
  });

  it("shows a no-results message for a query with no matches", () => {
    render(<SearchPanel {...baseProps({ query: "xyz", results: [] })} />);
    expect(screen.getByText('No results for "xyz"')).toBeInTheDocument();
  });

  it("calls setQuery when typing in the search input", () => {
    const props = baseProps();
    render(<SearchPanel {...props} />);
    fireEvent.change(screen.getByPlaceholderText("Search nodes, notes, properties…"), { target: { value: "router" } });
    expect(props.setQuery).toHaveBeenCalledWith("router");
  });

  it("renders results and calls onSelect when a result is clicked", () => {
    const props = baseProps({ query: "router", results: [makeResult()] });
    render(<SearchPanel {...props} />);
    // Title text is split across a <mark> highlight span, so click a plain-text
    // footer element instead — the click bubbles up to the row's onClick.
    fireEvent.click(screen.getByText("x:10 y:20"));
    expect(props.onSelect).toHaveBeenCalledWith(makeResult());
  });

  it("calls setField when a field filter button is clicked", () => {
    const props = baseProps();
    render(<SearchPanel {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Title" }));
    expect(props.setField).toHaveBeenCalledWith("title");
  });

  it("calls onClose on Escape key and onSelect on Enter for the active result", () => {
    const props = baseProps({ query: "router", results: [makeResult()] });
    render(<SearchPanel {...props} />);
    const input = screen.getByPlaceholderText("Search nodes, notes, properties…");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onSelect).toHaveBeenCalledWith(makeResult());
    fireEvent.keyDown(input, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalled();
  });
});
