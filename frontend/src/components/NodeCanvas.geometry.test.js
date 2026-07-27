import { describe, it, expect } from "vitest";
import {
  rectEdgePoint,
  pickBestSides,
  computePortMap,
  roundedPolyPath,
  segHitsRects,
} from "../lib/edgeRouting.js";
import {
  parseNotes,
  serializeNotes,
  stripHtml,
} from "../lib/notesFormat.js";

describe("rectEdgePoint", () => {
  it("returns the node center when the target is exactly at the center", () => {
    const node = { x: 0, y: 0 };
    expect(rectEdgePoint(node, 100, 50, 50, 25)).toEqual({ x: 50, y: 25 });
  });

  it("clips to the right edge when the target is directly to the right", () => {
    const node = { x: 0, y: 0 };
    const pt = rectEdgePoint(node, 100, 50, 1000, 25);
    expect(pt.x).toBeCloseTo(100);
    expect(pt.y).toBeCloseTo(25);
  });

  it("clips to the bottom edge when the target is directly below", () => {
    const node = { x: 0, y: 0 };
    const pt = rectEdgePoint(node, 100, 50, 50, 1000);
    expect(pt.x).toBeCloseTo(50);
    expect(pt.y).toBeCloseTo(50);
  });

  it("clips to a corner-adjacent point on the dominant axis for a diagonal target", () => {
    const node = { x: 0, y: 0 };
    // Target is further right than down relative to half-extents, so it should
    // hit the right face (scaled by the horizontal ratio), not the corner exactly.
    const pt = rectEdgePoint(node, 100, 100, 1000, 60);
    expect(pt.x).toBeCloseTo(100);
  });
});

describe("pickBestSides", () => {
  it("picks right→left when the target is further to the right", () => {
    expect(pickBestSides(0, 0, 100, 100, 500, 10, 100, 100)).toEqual({ from: "right", to: "left" });
  });

  it("picks left→right when the target is further to the left", () => {
    expect(pickBestSides(500, 0, 100, 100, 0, 10, 100, 100)).toEqual({ from: "left", to: "right" });
  });

  it("picks bottom→top when the target is further below", () => {
    expect(pickBestSides(0, 0, 100, 100, 10, 500, 100, 100)).toEqual({ from: "bottom", to: "top" });
  });

  it("picks top→bottom when the target is further above", () => {
    expect(pickBestSides(0, 500, 100, 100, 10, 0, 100, 100)).toEqual({ from: "top", to: "bottom" });
  });

  it("always returns opposite faces, never same-side pairs", () => {
    const combos = [
      [0, 0, 100, 100, 500, 500, 100, 100],
      [500, 500, 100, 100, 0, 0, 100, 100],
      [0, 0, 100, 100, 0, 500, 100, 100],
    ];
    const opposite = { right: "left", left: "right", top: "bottom", bottom: "top" };
    combos.forEach(args => {
      const { from, to } = pickBestSides(...args);
      expect(opposite[from]).toBe(to);
    });
  });

  it("breaks a horizontal/vertical tie toward horizontal", () => {
    expect(pickBestSides(0, 0, 100, 100, 100, 100, 100, 100)).toEqual({ from: "right", to: "left" });
  });
});

describe("computePortMap", () => {
  const n = (id, x, y, w = 220, h = 96) => ({ id, x, y, w, h });

  it("returns an empty map when there are no edges", () => {
    expect(computePortMap([n("a", 0, 0)], [])).toEqual({});
  });

  it("assigns the center port (0.5) to a single edge on a face", () => {
    const nodes = [n("a", 0, 0), n("b", 500, 0)];
    const edges = [{ id: "e1", from: "a", to: "b" }];
    const tMap = computePortMap(nodes, edges);
    expect(tMap["e1:from"]).toBe(0.5);
    expect(tMap["e1:to"]).toBe(0.5);
  });

  it("spreads three edges leaving the same face across 0.2/0.5/0.8, ordered by target position", () => {
    const nodes = [
      n("a", 0, 200),
      n("top", 500, 0),
      n("mid", 500, 200),
      n("bot", 500, 400),
    ];
    // Add edges out of order to verify sorting-by-rank, not array order.
    const edges = [
      { id: "e_bot", from: "a", to: "bot" },
      { id: "e_top", from: "a", to: "top" },
      { id: "e_mid", from: "a", to: "mid" },
    ];
    const tMap = computePortMap(nodes, edges);
    expect(tMap["e_top:from"]).toBeCloseTo(0.2);
    expect(tMap["e_mid:from"]).toBeCloseTo(0.5);
    expect(tMap["e_bot:from"]).toBeCloseTo(0.8);
  });

  it("ignores edges referencing a missing node instead of throwing", () => {
    const nodes = [n("a", 0, 0)];
    const edges = [{ id: "e1", from: "a", to: "ghost" }];
    expect(() => computePortMap(nodes, edges)).not.toThrow();
    expect(computePortMap(nodes, edges)).toEqual({});
  });
});

describe("roundedPolyPath", () => {
  it("returns an empty string for fewer than two distinct points", () => {
    expect(roundedPolyPath([{ x: 0, y: 0 }])).toBe("");
    expect(roundedPolyPath([{ x: 0, y: 0 }, { x: 0, y: 0 }])).toBe("");
  });

  it("builds a straight two-point path with a plain M/L, no rounding needed", () => {
    const d = roundedPolyPath([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    expect(d).toBe("M 0 0 L 100 0");
  });

  it("collapses consecutive duplicate points before building the path", () => {
    const d = roundedPolyPath([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 0 }]);
    expect(d).toBe("M 0 0 L 100 0");
  });

  it("inserts a rounded corner (L then Q) for a right-angle bend", () => {
    const d = roundedPolyPath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 14);
    expect(d).toContain("M 0 0");
    expect(d).toContain("Q 100 0");
    expect(d.endsWith("L 100 100")).toBe(true);
  });

  it("caps the corner radius so it never exceeds half the shorter adjacent segment", () => {
    // Segments are only 10px long, radius requested is 14 — must clamp to 5.
    const d = roundedPolyPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], 14);
    expect(d).toContain("L 5 0");
  });
});

describe("segHitsRects", () => {
  const rects = [{ x: 100, y: 100, w: 50, h: 50 }];

  it("detects a segment that crosses through an obstacle", () => {
    expect(segHitsRects(0, 120, 300, 120, rects)).toBe(true);
  });

  it("clears a segment that passes well outside the obstacle and its padding", () => {
    expect(segHitsRects(0, 0, 300, 0, rects)).toBe(false);
  });

  it("counts the padding margin around the obstacle", () => {
    // Segment runs 2px above the rect's top edge — inside the default 8px pad.
    expect(segHitsRects(0, 98, 300, 98, rects, 8)).toBe(true);
    expect(segHitsRects(0, 98, 300, 98, rects, 0)).toBe(false);
  });
});

describe("notes parsing round-trip", () => {
  it("round-trips a normal notes array through serialize/parse", () => {
    const notes = [{ id: "1", title: "T", content: "C", sensitive: false }];
    const raw = serializeNotes(notes);
    expect(parseNotes(raw)).toEqual(notes);
  });

  it("returns an empty array for null/undefined/empty input", () => {
    expect(parseNotes(null)).toEqual([]);
    expect(parseNotes(undefined)).toEqual([]);
    expect(parseNotes("")).toEqual([]);
  });

  it("wraps a plain non-JSON string as a single note", () => {
    const [note] = parseNotes("just some free text");
    expect(note.content).toBe("just some free text");
    expect(note.title).toBe("");
  });

  it("recovers a single JSON-object note serialized without the array wrapper (corruption case)", () => {
    const corrupted = JSON.stringify({ id: "1", title: "T", content: "C" });
    const notes = parseNotes(corrupted);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ id: "1", title: "T", content: "C" });
  });

  it("recovers nested double-serialized notes (a note whose content is itself a notes array)", () => {
    const inner = [{ id: "inner-1", title: "Inner", content: "hi" }];
    const corrupted = [{ id: "outer", title: "", content: JSON.stringify(inner) }];
    const notes = parseNotes(corrupted);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ id: "inner-1", title: "Inner", content: "hi" });
  });

  it("serializeNotes always produces a JSON array string, even for non-array input", () => {
    expect(serializeNotes(null)).toBe("[]");
    expect(serializeNotes(undefined)).toBe("[]");
    expect(serializeNotes("not an array")).toBe("[]");
  });
});

describe("stripHtml", () => {
  it("removes tags and collapses whitespace", () => {
    expect(stripHtml("<p>Hello   <b>world</b></p>")).toBe("Hello world");
  });

  it("returns an empty string for falsy input", () => {
    expect(stripHtml(null)).toBe("");
    expect(stripHtml(undefined)).toBe("");
    expect(stripHtml("")).toBe("");
  });
});
