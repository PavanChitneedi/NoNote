import { describe, it, expect } from "vitest";
import { nrm, port, buildBundle, TRUNK_MIN, TRUNK_MAX } from "./NodeCanvas.jsx";

describe("nrm", () => {
  it("returns the outward face normal for each side", () => {
    expect(nrm("right")).toEqual({ dx: 1, dy: 0 });
    expect(nrm("left")).toEqual({ dx: -1, dy: 0 });
    expect(nrm("top")).toEqual({ dx: 0, dy: -1 });
    expect(nrm("bottom")).toEqual({ dx: 0, dy: 1 });
  });
});

describe("port", () => {
  const box = { x: 100, y: 200, w: 40, h: 20 };

  it("places a port on the right face at the given cross-fraction", () => {
    expect(port(box, "right", 0.5)).toEqual({ x: 140, y: 210 });
  });

  it("places a port on the left face", () => {
    expect(port(box, "left", 0)).toEqual({ x: 100, y: 200 });
  });

  it("places a port on the top face", () => {
    expect(port(box, "top", 1)).toEqual({ x: 140, y: 200 });
  });

  it("places a port on the bottom face", () => {
    expect(port(box, "bottom", 0.5)).toEqual({ x: 120, y: 220 });
  });
});

describe("buildBundle", () => {
  // A source box on the left, fanning out rightward to three targets stacked
  // vertically well clear of it — the common switch/router fan-out shape.
  const trunkPt = { x: 100, y: 100 };
  const branchSpecs = [
    { id: "e1", entry: { x: 300, y: 40 }, gap: 60, targetId: "t1" },
    { id: "e2", entry: { x: 300, y: 100 }, gap: 0, targetId: "t2" },
    { id: "e3", entry: { x: 300, y: 160 }, gap: 60, targetId: "t3" },
  ];

  it("builds a clear stem, spine, and one branch per target when nothing is in the way", () => {
    const built = buildBundle(trunkPt, "right", branchSpecs, [], null);
    expect(built).not.toBeNull();
    expect(built.stemPts[0]).toEqual(trunkPt);
    expect(Object.keys(built.branchPts).sort()).toEqual(["e1", "e2", "e3"]);
    // Every branch ends exactly at its own entry point.
    branchSpecs.forEach(b => {
      const seg = built.branchPts[b.id];
      expect(seg[seg.length - 1]).toEqual(b.entry);
    });
  });

  it("clamps the spine offset within [TRUNK_MIN, TRUNK_MAX] based on branch gap", () => {
    const built = buildBundle(trunkPt, "right", branchSpecs, [], null);
    const spineX = built.spinePts[0].x;
    expect(spineX - trunkPt.x).toBeGreaterThanOrEqual(TRUNK_MIN);
    expect(spineX - trunkPt.x).toBeLessThanOrEqual(TRUNK_MAX);
  });

  it("returns null when an obstacle blocks the shared stem/spine corridor", () => {
    // A box sitting directly between the trunk and the spine.
    const obstacles = [{ id: "blocker", x: 105, y: 90, w: 20, h: 20 }];
    const built = buildBundle(trunkPt, "right", branchSpecs, obstacles, null);
    expect(built).toBeNull();
  });

  it("returns null when an unrelated obstacle blocks a branch's own leg", () => {
    // Sits directly on e1's junction(140,40) → entry(300,40) leg, and isn't
    // any branch's own target — nothing filters it out.
    const obstacles = [{ id: "wall", x: 200, y: 30, w: 50, h: 20 }];
    const built = buildBundle(trunkPt, "right", branchSpecs, obstacles, null);
    expect(built).toBeNull();
  });

  it("does not reject a branch for colliding with its own target box", () => {
    // Same position as the blocking obstacle above, but its id matches e1's
    // own targetId — buildBundle must exclude a branch's own target from
    // that branch's own obstacle check.
    const obstacles = [{ id: "t1", x: 200, y: 30, w: 50, h: 20 }];
    const built = buildBundle(trunkPt, "right", branchSpecs, obstacles, null);
    expect(built).not.toBeNull();
    expect(built.branchPts.e1[built.branchPts.e1.length - 1]).toEqual(branchSpecs[0].entry);
  });

  it("routes the spine past the far edge of a clearBox instead of stopping at the default offset", () => {
    // A note box sitting right where the default trunk offset would land.
    const clearBox = { x: 105, y: 80, w: 150, h: 40 };
    const built = buildBundle(trunkPt, "right", branchSpecs, [], clearBox);
    expect(built).not.toBeNull();
    const spineX = built.spinePts[0].x;
    expect(spineX).toBeGreaterThanOrEqual(clearBox.x + clearBox.w + 20);
  });

  it("builds vertical (top/bottom) bundles using y as the main axis", () => {
    const vTrunkPt = { x: 200, y: 50 };
    const vBranches = [
      { id: "e1", entry: { x: 100, y: 250 }, gap: 100 },
      { id: "e2", entry: { x: 300, y: 250 }, gap: 100 },
    ];
    const built = buildBundle(vTrunkPt, "bottom", vBranches, [], null);
    expect(built).not.toBeNull();
    // Spine runs horizontally (constant y) below the trunk.
    expect(built.spinePts[0].y).toEqual(built.spinePts[1].y);
    expect(built.spinePts[0].y).toBeGreaterThan(vTrunkPt.y);
  });
});
