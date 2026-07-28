import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ExportModal from "./ExportModal.jsx";

const nodes = [{ id: "n1", type: "note", title: "Node 1", x: 0, y: 0, w: 220, h: 96 }];
const edges = [];

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});

describe("ExportModal", () => {
  it("shows LLM export text by default, generated from exportLLM()", () => {
    const exportLLM = vi.fn(() => "LLM EXPORT TEXT");
    render(<ExportModal nodes={nodes} edges={edges} mapTitle="My Map" exportLLM={exportLLM} onClose={() => {}} />);
    expect(exportLLM).toHaveBeenCalled();
    expect(screen.getByText("LLM EXPORT TEXT")).toBeInTheDocument();
  });

  it("switches to JSON tab and shows the serialized map", () => {
    const exportLLM = vi.fn(() => "LLM EXPORT TEXT");
    render(<ExportModal nodes={nodes} edges={edges} mapTitle="My Map" exportLLM={exportLLM} onClose={() => {}} />);
    fireEvent.click(screen.getByText("{ } JSON"));
    expect(screen.getByText(/"title": "My Map"/)).toBeInTheDocument();
  });

  it("calls onClose when the × button is clicked", () => {
    const onClose = vi.fn();
    render(<ExportModal nodes={nodes} edges={edges} mapTitle="My Map" exportLLM={() => ""} onClose={onClose} />);
    fireEvent.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalled();
  });

  it("copies the current tab content to the clipboard and shows a confirmation", async () => {
    render(<ExportModal nodes={nodes} edges={edges} mapTitle="My Map" exportLLM={() => "hello"} onClose={() => {}} />);
    fireEvent.click(screen.getByText("📋 COPY"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
    expect(await screen.findByText("✓ COPIED")).toBeInTheDocument();
  });
});
