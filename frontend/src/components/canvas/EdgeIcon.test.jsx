import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import EdgeIcon from "./EdgeIcon.jsx";

describe("EdgeIcon", () => {
  it("renders nothing for an unknown style key", () => {
    const { container } = render(<EdgeIcon styleKey="not-a-real-style" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an svg with a line for a basic arrow style", () => {
    const { container } = render(<EdgeIcon styleKey="arrow" size={40} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(container.querySelector("line")).toBeInTheDocument();
    // arrow style has an end marker
    expect(container.querySelector("polygon")).toBeInTheDocument();
  });

  it("renders a plain line style without an arrowhead polygon", () => {
    const { container } = render(<EdgeIcon styleKey="line" />);
    expect(container.querySelector("line")).toBeInTheDocument();
    expect(container.querySelector("polygon")).not.toBeInTheDocument();
  });

  it("renders a wave path for wave styles", () => {
    const { container } = render(<EdgeIcon styleKey="wave" />);
    expect(container.querySelector("path")).toBeInTheDocument();
    expect(container.querySelector("line")).not.toBeInTheDocument();
  });

  it("renders two parallel lines for the double style", () => {
    const { container } = render(<EdgeIcon styleKey="double" />);
    expect(container.querySelectorAll("line").length).toBe(2);
  });
});
