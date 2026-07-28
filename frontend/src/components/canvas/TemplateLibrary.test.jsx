import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TemplateLibrary from "./TemplateLibrary.jsx";

describe("TemplateLibrary", () => {
  it("renders all built-in templates with their node/connection counts", () => {
    render(<TemplateLibrary onInsert={() => {}} />);
    expect(screen.getByText("Blank Starter")).toBeInTheDocument();
    expect(screen.getByText("Homelab Network")).toBeInTheDocument();
    expect(screen.getByText("Microservices")).toBeInTheDocument();
    expect(screen.getByText("Mind Map")).toBeInTheDocument();
  });

  it("calls onInsert with the full template object when a template is clicked", () => {
    const onInsert = vi.fn();
    render(<TemplateLibrary onInsert={onInsert} />);
    fireEvent.click(screen.getByText("Blank Starter"));
    expect(onInsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "blank", name: "Blank Starter", nodes: expect.any(Array), edges: expect.any(Array) })
    );
  });

  it("shows the correct node and connection counts for a template", () => {
    render(<TemplateLibrary onInsert={() => {}} />);
    expect(screen.getByText("2 nodes")).toBeInTheDocument();
    expect(screen.getByText("1 connections")).toBeInTheDocument();
  });
});
