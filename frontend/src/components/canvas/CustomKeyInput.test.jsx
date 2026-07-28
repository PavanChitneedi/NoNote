import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CustomKeyInput from "./CustomKeyInput.jsx";

const baseNode = {
  properties: { IP: "1.2.3.4" },
  customProps: { foo: "bar", other: "baz" },
};

describe("CustomKeyInput", () => {
  it("renders the current key value", () => {
    render(<CustomKeyInput propKey="foo" node={baseNode} canEdit={true} onRename={() => {}} />);
    expect(screen.getByPlaceholderText("property name")).toHaveValue("foo");
  });

  it("is disabled when canEdit is false", () => {
    render(<CustomKeyInput propKey="foo" node={baseNode} canEdit={false} onRename={() => {}} />);
    expect(screen.getByPlaceholderText("property name")).toBeDisabled();
  });

  it("calls onRename with the new key on blur when the name is valid and unused", () => {
    const onRename = vi.fn();
    render(<CustomKeyInput propKey="foo" node={baseNode} canEdit={true} onRename={onRename} />);
    const input = screen.getByPlaceholderText("property name");
    fireEvent.change(input, { target: { value: "newname" } });
    fireEvent.blur(input);
    expect(onRename).toHaveBeenCalledWith("foo", "newname");
  });

  it("shows an error and does not rename when the new name is already taken", () => {
    const onRename = vi.fn();
    render(<CustomKeyInput propKey="foo" node={baseNode} canEdit={true} onRename={onRename} />);
    const input = screen.getByPlaceholderText("property name");
    fireEvent.change(input, { target: { value: "other" } });
    expect(screen.getByText("Name already used by another property")).toBeInTheDocument();
    fireEvent.blur(input);
    expect(onRename).not.toHaveBeenCalled();
    expect(input).toHaveValue("foo");
  });

  it("reverts to the original key when blurred empty", () => {
    const onRename = vi.fn();
    render(<CustomKeyInput propKey="foo" node={baseNode} canEdit={true} onRename={onRename} />);
    const input = screen.getByPlaceholderText("property name");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onRename).not.toHaveBeenCalled();
    expect(input).toHaveValue("foo");
  });
});
