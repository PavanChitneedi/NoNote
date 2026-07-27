import { describe, it, expect } from "vitest";
import { autoLayout } from "../lib/autoLayout.js";

// Minimal node builder — mirrors mkNode's shape without going through the
// full node-type registry, since autoLayout only reads x/y/w/h/type/id.
const node = (id, type = "server", extra = {}) => ({
  id, type, x: 0, y: 0, w: 220, h: 96, customProps: {}, ...extra,
});
const edge = (id, from, to) => ({ id, from, to });

const PAD = 80, LAYER_GAP = 140, NODE_GAP = 44, ANNO_GAP = 60;

describe("autoLayout — basics", () => {
  it("returns the same array unchanged for an empty node list", () => {
    const nodes = [];
    expect(autoLayout(nodes, [])).toBe(nodes);
  });

  it("places a single default-size node at the canvas padding origin", () => {
    const [n] = autoLayout([node("a")], [], "LR");
    expect(n.x).toBe(PAD);
    expect(n.y).toBe(PAD);
  });

  it("never throws on malformed input, falling back to the original nodes", () => {
    // edges referencing nonexistent nodes, and a self-loop
    const nodes = [node("a")];
    const edges = [edge("e1", "a", "a"), edge("e2", "a", "ghost")];
    expect(() => autoLayout(nodes, edges, "LR")).not.toThrow();
  });
});

describe("autoLayout — LR chain layering", () => {
  it("places a two-node chain one LAYER_GAP+node-width apart on the main axis, aligned on the cross axis", () => {
    const nodes = [node("a"), node("b")];
    const edges = [edge("e1", "a", "b")];
    const [a, b] = autoLayout(nodes, edges, "LR");
    expect(a.x).toBe(PAD);
    expect(b.x).toBe(PAD + 220 + LAYER_GAP);
    expect(a.y).toBe(b.y);
  });

  it("orders nodes by depth even out of input order (topological, not array order)", () => {
    const nodes = [node("c"), node("a"), node("b")];
    const edges = [edge("e1", "a", "b"), edge("e2", "b", "c")];
    const byId = Object.fromEntries(autoLayout(nodes, edges, "LR").map(n => [n.id, n]));
    expect(byId.a.x).toBeLessThan(byId.b.x);
    expect(byId.b.x).toBeLessThan(byId.c.x);
  });

  it("survives a cycle without infinite-looping and still places every node", () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [edge("e1", "a", "b"), edge("e2", "b", "c"), edge("e3", "c", "a")];
    const out = autoLayout(nodes, edges, "LR");
    expect(out).toHaveLength(3);
    out.forEach(n => {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    });
  });
});

describe("autoLayout — sibling spacing", () => {
  it("spaces same-depth siblings by exactly node-height + NODE_GAP when sizes are equal", () => {
    const nodes = [node("root"), node("c1"), node("c2"), node("c3")];
    const edges = [edge("e1", "root", "c1"), edge("e2", "root", "c2"), edge("e3", "root", "c3")];
    const byId = Object.fromEntries(autoLayout(nodes, edges, "LR").map(n => [n.id, n]));
    const ys = [byId.c1.y, byId.c2.y, byId.c3.y].sort((a, b) => a - b);
    expect(ys[1] - ys[0]).toBe(96 + NODE_GAP);
    expect(ys[2] - ys[1]).toBe(96 + NODE_GAP);
  });
});

describe("autoLayout — direction handling", () => {
  it("reverses the main-axis order for RL relative to LR", () => {
    const nodes = [node("a"), node("b")];
    const edges = [edge("e1", "a", "b")];
    const lr = Object.fromEntries(autoLayout(nodes, edges, "LR").map(n => [n.id, n]));
    const rl = Object.fromEntries(autoLayout(nodes, edges, "RL").map(n => [n.id, n]));
    expect(lr.a.x).toBeLessThan(lr.b.x);
    expect(rl.a.x).toBeGreaterThan(rl.b.x);
  });

  it("lays out along the y axis instead of x for TB/BT directions", () => {
    const nodes = [node("a"), node("b")];
    const edges = [edge("e1", "a", "b")];
    const [a, b] = autoLayout(nodes, edges, "TB");
    expect(a.x).toBe(b.x);
    expect(a.y).toBeLessThan(b.y);
  });
});

describe("autoLayout — note annotations", () => {
  it("pulls a single-parent note out of the graph and parks it beside its parent, vertically centered", () => {
    const nodes = [node("srv"), node("note1", "note", { w: 240, h: 160 })];
    const edges = [edge("e1", "srv", "note1")];
    const byId = Object.fromEntries(autoLayout(nodes, edges, "LR").map(n => [n.id, n]));
    const srv = byId.srv, note = byId.note1;
    expect(note.x).toBe(srv.x + srv.w + ANNO_GAP);
    expect(note.y + note.h / 2).toBeCloseTo(srv.y + srv.h / 2);
  });

  it("keeps a note shared by two parents in the graph as a normal layered node", () => {
    const nodes = [node("a"), node("b"), node("shared", "note", { w: 240, h: 160 })];
    const edges = [edge("e1", "a", "shared"), edge("e2", "b", "shared")];
    const byId = Object.fromEntries(autoLayout(nodes, edges, "LR").map(n => [n.id, n]));
    // A shared note isn't an annotation — it must land in its own downstream
    // layer, strictly after both parents on the main axis.
    expect(byId.shared.x).toBeGreaterThan(byId.a.x);
    expect(byId.shared.x).toBeGreaterThan(byId.b.x);
  });

  it("does not treat a manually-ungrouped note as an annotation even with one parent", () => {
    const nodes = [node("srv"), node("note1", "note", { w: 240, h: 160, customProps: { _ungrouped: true } })];
    const edges = [edge("e1", "srv", "note1")];
    const byId = Object.fromEntries(autoLayout(nodes, edges, "LR").map(n => [n.id, n]));
    // Ungrouped notes stay in the graph, so they get their own layer instead
    // of the fixed ANNO_GAP offset beside the parent.
    expect(byId.note1.x).not.toBe(byId.srv.x + byId.srv.w + ANNO_GAP);
    expect(byId.note1.x).toBeGreaterThan(byId.srv.x);
  });
});
