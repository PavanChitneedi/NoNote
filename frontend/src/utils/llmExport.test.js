import { describe, it, expect } from "vitest";
import {
  buildLLMText,
  buildMultiMapLLMText,
  collectWorkflowChains,
  collectWorkflowTasks,
  buildWorkflowAuditMessage,
} from "./llmExport.js";

const NT = {
  server: { label: "Server", cat: "Infra" },
  workflow_task: { label: "Task", cat: "Workflow" },
};

describe("buildLLMText", () => {
  it("groups nodes by category and lists properties", () => {
    const nodes = [
      { id: "1", type: "server", title: "web-1", properties: { IP: "10.0.0.5" } },
    ];
    const out = buildLLMText("My Map", nodes, [], NT);
    expect(out).toContain("# My Map");
    expect(out).toContain("### Infra");
    expect(out).toContain("**web-1**");
    expect(out).toContain("- IP: 10.0.0.5");
  });

  it("redacts secret-shaped keys from properties and customProps", () => {
    const nodes = [
      {
        id: "1",
        type: "server",
        title: "web-1",
        properties: { api_key: "sk-123", password: "hunter2", IP: "10.0.0.5" },
        customProps: { my_token: "abc" },
      },
    ];
    const out = buildLLMText("My Map", nodes, [], NT);
    expect(out).not.toContain("sk-123");
    expect(out).not.toContain("hunter2");
    expect(out).not.toContain("abc");
    expect(out).toContain("- IP: 10.0.0.5");
  });

  it("marks private notes without leaking content", () => {
    const nodes = [
      { id: "1", type: "server", title: "web-1", node_notes: "root password is hunter2", notes_private: true },
    ];
    const out = buildLLMText("My Map", nodes, [], NT);
    expect(out).toContain("[PRIVATE]");
    expect(out).not.toContain("hunter2");
  });

  it("includes non-private notes", () => {
    const nodes = [
      { id: "1", type: "server", title: "web-1", node_notes: "line one\nline two" },
    ];
    const out = buildLLMText("My Map", nodes, [], NT);
    expect(out).toContain("line one");
    expect(out).toContain("line two");
  });

  it("falls back to General category and raw type label when NT is missing an entry", () => {
    const nodes = [{ id: "1", type: "unknown_type", title: "thing", properties: {} }];
    const out = buildLLMText("My Map", nodes, [], NT);
    expect(out).toContain("### General");
    expect(out).toContain("_(unknown_type)_");
  });

  it("describes relationships between existing nodes, skipping edges to missing nodes", () => {
    const nodes = [
      { id: "1", type: "server", title: "A", properties: {} },
      { id: "2", type: "server", title: "B", properties: {} },
    ];
    const edges = [
      { from: "1", to: "2", edgeType: "network" },
      { from: "1", to: "missing", edgeType: "data" },
      { from_node: "2", to_node: "1", style: "bidirectional", label: "sync" },
    ];
    const out = buildLLMText("My Map", nodes, edges, NT);
    expect(out).toContain("**A** → **B**: network link");
    expect(out).toContain('**B** ↔ **A**: "sync (data flow)"');
    expect(out).not.toContain("missing");
  });

  it("omits the Relationships section when there are no edges", () => {
    const out = buildLLMText("My Map", [], [], NT);
    expect(out).not.toContain("## Relationships");
  });
});

describe("buildMultiMapLLMText", () => {
  it("combines multiple maps with a shared header", () => {
    const mapsData = [
      { title: "Map A", nodes: [], edges: [] },
      { title: "Map B", nodes: [], edges: [] },
    ];
    const out = buildMultiMapLLMText(mapsData, NT);
    expect(out).toContain("Combined context — 2 maps");
    expect(out).toContain("Maps included: Map A, Map B");
    expect(out).toContain("# Map A");
    expect(out).toContain("# Map B");
  });
});

describe("collectWorkflowChains", () => {
  it("treats a lone workflow_task node as a single-step chain", () => {
    const nodes = [{ id: "t1", type: "workflow_task", title: "Backup", properties: { Duration: "30m", Frequency: "daily" } }];
    const chains = collectWorkflowChains(nodes, []);
    expect(chains).toHaveLength(1);
    expect(chains[0].steps).toHaveLength(1);
    expect(chains[0].totalMinutesPerMonth).toBe(30 * 30);
  });

  it("walks a linear chain of linked task nodes in order", () => {
    const nodes = [
      { id: "t1", type: "workflow_task", title: "Step 1", properties: { Duration: "10m", Frequency: "daily" } },
      { id: "t2", type: "workflow_task", title: "Step 2", properties: { Duration: "20m", Frequency: "daily" } },
    ];
    const edges = [{ from: "t1", to: "t2" }];
    const chains = collectWorkflowChains(nodes, edges);
    expect(chains).toHaveLength(1);
    expect(chains[0].steps.map(s => s.id)).toEqual(["t1", "t2"]);
    expect(chains[0].totalMinutesPerMonth).toBe(10 * 30 + 20 * 30);
  });

  it("ignores edges between non-workflow_task nodes", () => {
    const nodes = [
      { id: "t1", type: "workflow_task", title: "Step 1", properties: {} },
      { id: "s1", type: "server", title: "Server", properties: {} },
    ];
    const edges = [{ from: "t1", to: "s1" }];
    const chains = collectWorkflowChains(nodes, edges);
    expect(chains).toHaveLength(1);
    expect(chains[0].steps).toHaveLength(1);
  });

  it("handles a cycle without infinite looping, covering leftover nodes as single-step chains", () => {
    const nodes = [
      { id: "t1", type: "workflow_task", title: "A", properties: {} },
      { id: "t2", type: "workflow_task", title: "B", properties: {} },
    ];
    const edges = [
      { from: "t1", to: "t2" },
      { from: "t2", to: "t1" },
    ];
    const chains = collectWorkflowChains(nodes, edges);
    const totalSteps = chains.reduce((n, c) => n + c.steps.length, 0);
    expect(totalSteps).toBe(2);
  });

  it("defaults unparseable duration/frequency instead of throwing", () => {
    const nodes = [{ id: "t1", type: "workflow_task", title: "Weird", properties: { Duration: "??", Frequency: "??" } }];
    const chains = collectWorkflowChains(nodes, []);
    expect(chains[0].totalMinutesPerMonth).toBe(Math.round(15 * 4.3));
  });
});

describe("collectWorkflowTasks", () => {
  it("returns a flat list of workflow_task nodes with computed minutesPerMonth", () => {
    const nodes = [
      { id: "t1", type: "workflow_task", title: "Backup", properties: { Duration: "1h", Frequency: "weekly" } },
      { id: "s1", type: "server", title: "Server" },
    ];
    const tasks = collectWorkflowTasks(nodes);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ id: "t1", title: "Backup", minutesPerMonth: Math.round(60 * 4.3) });
  });
});

describe("buildWorkflowAuditMessage", () => {
  it("includes map title, chain summary, and the enforced JSON response instruction", () => {
    const nodes = [{ id: "t1", type: "workflow_task", title: "Backup", properties: { Duration: "10m", Frequency: "daily" } }];
    const msg = buildWorkflowAuditMessage(nodes, [], "My Map");
    expect(msg).toContain('Map: "My Map"');
    expect(msg).toContain("Workflows found (1)");
    expect(msg).toContain('id:t1 | "Backup"');
    expect(msg).toContain("Respond ONLY with JSON:");
  });

  it("falls back to Untitled when mapTitle is missing", () => {
    const msg = buildWorkflowAuditMessage([], [], undefined);
    expect(msg).toContain('Map: "Untitled"');
    expect(msg).toContain("Workflows found (0)");
  });
});
