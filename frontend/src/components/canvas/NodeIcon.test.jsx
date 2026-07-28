import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FileText } from "lucide-react";
import NodeIcon from "./NodeIcon.jsx";

describe("NodeIcon", () => {
  it("renders nothing when icon is falsy", () => {
    const { container } = render(<NodeIcon icon={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an emoji string as a span", () => {
    const { container } = render(<NodeIcon icon="🚀" size={24} />);
    const span = container.querySelector("span");
    expect(span).toHaveTextContent("🚀");
    expect(span).toHaveStyle({ fontSize: "24px" });
  });

  it("renders a lucide component icon as an svg", () => {
    const { container } = render(<NodeIcon icon={FileText} size={18} color="#fff" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
