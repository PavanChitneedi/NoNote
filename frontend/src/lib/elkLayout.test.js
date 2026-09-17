import { describe, it, expect } from "vitest";
import { elkAutoLayout } from "./elkLayout.js";

const node = (id, type = "server", extra = {}) => ({
  id, type, x: 0, y: 0, w: 220, h: 96, customProps: {}, ...extra,
});
const edge = (id, from, to) => ({ id, from, to });

const overlap = (a, b) =>
  a.x < b.x + (b.w || 220) && a.x + (a.w || 220) > b.x &&
  a.y < b.y + (b.h || 96) && a.y + (a.h || 96) > b.y;

describe("elkAutoLayout — basics", () => {
  it("returns the same array unchanged for an empty node list", async () => {
    const nodes = [];
    expect(await elkAutoLayout(nodes, [])).toBe(nodes);
  });

  it("never throws on malformed input, falling back gracefully", async () => {
    const nodes = [node("a")];
    const edges = [edge("e1", "a", "a"), edge("e2", "a", "ghost")];
    await expect(elkAutoLayout(nodes, edges, "LR")).resolves.toBeDefined();
  });
});

describe("elkAutoLayout — LR chain layering", () => {
  it("lays out a simple chain left-to-right with increasing x per depth", async () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [edge("e1", "a", "b"), edge("e2", "b", "c")];
    const byId = Object.fromEntries((await elkAutoLayout(nodes, edges, "LR")).map(n => [n.id, n]));
    expect(byId.a.x).toBeLessThan(byId.b.x);
    expect(byId.b.x).toBeLessThan(byId.c.x);
  });

  it("orders nodes by depth even out of input order (topological, not array order)", async () => {
    const nodes = [node("c"), node("a"), node("b")];
    const edges = [edge("e1", "a", "b"), edge("e2", "b", "c")];
    const byId = Object.fromEntries((await elkAutoLayout(nodes, edges, "LR")).map(n => [n.id, n]));
    expect(byId.a.x).toBeLessThan(byId.b.x);
    expect(byId.b.x).toBeLessThan(byId.c.x);
  });

  it("survives a cycle without throwing and still places every node", async () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [edge("e1", "a", "b"), edge("e2", "b", "c"), edge("e3", "c", "a")];
    const out = await elkAutoLayout(nodes, edges, "LR");
    expect(out).toHaveLength(3);
    out.forEach(n => {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    });
  });
});

describe("elkAutoLayout — note-stack collapsing", () => {
  it("collapses a 2+-note stack onto a single shared position", async () => {
    const nodes = [
      node("parent"),
      node("n1", "note"),
      node("n2", "note"),
    ];
    const edges = [edge("e1", "parent", "n1"), edge("e2", "parent", "n2")];
    const byId = Object.fromEntries((await elkAutoLayout(nodes, edges, "LR")).map(n => [n.id, n]));
    expect(byId.n1.x).toBe(byId.n2.x);
    expect(byId.n1.y).toBe(byId.n2.y);
  });

  it("does not collapse a single-parent note marked _ungrouped", async () => {
    const nodes = [
      node("parent"),
      node("n1", "note"),
      node("n2", "note", { customProps: { _ungrouped: true } }),
    ];
    const edges = [edge("e1", "parent", "n1"), edge("e2", "parent", "n2")];
    const byId = Object.fromEntries((await elkAutoLayout(nodes, edges, "LR")).map(n => [n.id, n]));
    // n2 opted out via _ungrouped, so it stays a core node positioned by ELK
    // itself; n1 is placed beside its parent as a lone annotation instead —
    // either way they don't land on the same point.
    expect(byId.n1.x === byId.n2.x && byId.n1.y === byId.n2.y).toBe(false);
  });

  it("places a lone single-parent annotation note immediately beside its parent, not off with ELK's other core children", async () => {
    // Regression test: an earlier version routed every note through an ELK
    // graph edge like any other target, so ELK's own layered algorithm could
    // scatter a node's own annotation arbitrarily far away in the next
    // layer — which then broke buildBundle's assumption (in edgeRouting.js)
    // that an annotation sits right beside its parent, silently failing
    // bundling for any node with its own note attached.
    const nodes = [
      node("parent"),
      node("note", "note"),
      node("a"), node("b"), node("c"), node("d"), node("e"),
    ];
    const edges = [
      edge("e0", "parent", "note"),
      edge("e1", "parent", "a"), edge("e2", "parent", "b"), edge("e3", "parent", "c"),
      edge("e4", "parent", "d"), edge("e5", "parent", "e"),
    ];
    const byId = Object.fromEntries((await elkAutoLayout(nodes, edges, "LR")).map(n => [n.id, n]));
    const dist = Math.abs(byId.note.x - byId.parent.x) + Math.abs(byId.note.y - byId.parent.y);
    // Real core-to-core layer spacing here is 160px+ node width; a properly
    // beside-parked annotation sits within roughly one node-width of it.
    expect(dist).toBeLessThan(400);
  });
});

describe("elkAutoLayout — no-overlap and root-centering", () => {
  it("produces no overlapping node boxes on a representative fan-out graph", async () => {
    const nodes = [
      node("root"),
      node("a"), node("b"), node("c"), node("d"), node("e"),
    ];
    const edges = [
      edge("e1", "root", "a"), edge("e2", "root", "b"), edge("e3", "root", "c"),
      edge("e4", "root", "d"), edge("e5", "root", "e"),
    ];
    const out = await elkAutoLayout(nodes, edges, "LR");
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        expect(overlap(out[i], out[j])).toBe(false);
      }
    }
  });

  it("centers an isolated single-child root chain on the diagram's true vertical midpoint", async () => {
    const nodes = [
      node("root"), node("mid"),
      node("a"), node("b"), node("c"), node("d"), node("e"),
    ];
    const edges = [
      edge("e0", "root", "mid"),
      edge("e1", "mid", "a"), edge("e2", "mid", "b"), edge("e3", "mid", "c"),
      edge("e4", "mid", "d"), edge("e5", "mid", "e"),
    ];
    const out = await elkAutoLayout(nodes, edges, "LR");
    const byId = Object.fromEntries(out.map(n => [n.id, n]));
    const minY = Math.min(...out.map(n => n.y));
    const maxY = Math.max(...out.map(n => n.y + (n.h || 96)));
    const trueCenter = (minY + maxY) / 2;
    expect(Math.abs((byId.root.y + (byId.root.h || 96) / 2) - trueCenter)).toBeLessThan(2);
  });
});

describe("elkAutoLayout — TB direction", () => {
  it("lays out a simple chain top-to-bottom with increasing y per depth", async () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [edge("e1", "a", "b"), edge("e2", "b", "c")];
    const byId = Object.fromEntries((await elkAutoLayout(nodes, edges, "TB")).map(n => [n.id, n]));
    expect(byId.a.y).toBeLessThan(byId.b.y);
    expect(byId.b.y).toBeLessThan(byId.c.y);
  });
});
