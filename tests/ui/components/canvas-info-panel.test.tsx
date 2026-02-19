import type { CanvasNodeData } from "@/types/obsidian-canvas";
import { CanvasInfoPanel, resolveNodeLabel } from "@/ui/components/canvas-info-panel";
import { render, screen } from "@testing-library/react";
import { App, TFile } from "obsidian";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

describe("CanvasInfoPanel", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);
	});

	it("shows empty message when no nodes are selected", () => {
		render(<CanvasInfoPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByText("No node selected")).toBeDefined();
	});

	it("applies panel layout classes", () => {
		const { container } = render(<CanvasInfoPanel />, {
			wrapper: createWrapper(app),
		});
		expect(container.querySelector(".p-2.h-full.overflow-y-auto")).not.toBeNull();
	});

	it("shows node info when a node is selected", () => {
		const file = new TFile("notes/test.md");
		const canvasView = {
			canvas: {
				getData: vi.fn().mockReturnValue({
					nodes: [
						{ id: "n1", type: "file", file: "notes/test.md", x: 0, y: 0, width: 400, height: 300 },
					],
					edges: [],
				}),
				setData: vi.fn(),
				requestSave: vi.fn(),
				createFileNode: vi.fn(),
				selection: new Set([{ id: "n1", x: 0, y: 0, width: 400, height: 300, file }]),
			},
			file: new TFile("test.canvas"),
		};
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		render(<CanvasInfoPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByText("1 node selected")).toBeDefined();
	});

	it("shows multiple nodes info", () => {
		const canvasView = {
			canvas: {
				getData: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
				setData: vi.fn(),
				requestSave: vi.fn(),
				createFileNode: vi.fn(),
				selection: new Set([
					{ id: "n1", x: 0, y: 0, width: 400, height: 300 },
					{ id: "n2", x: 500, y: 0, width: 400, height: 300 },
				]),
			},
			file: new TFile("test.canvas"),
		};
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		render(<CanvasInfoPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByText("2 nodes selected")).toBeDefined();
	});

	it("shows node count but no connections when canvasView has no edges", () => {
		const canvasView = {
			canvas: {
				getData: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
				setData: vi.fn(),
				requestSave: vi.fn(),
				createFileNode: vi.fn(),
				selection: new Set([{ id: "n1", x: 0, y: 0, width: 400, height: 300 }]),
			},
			file: new TFile("test.canvas"),
		};
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);
		render(<CanvasInfoPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByText("1 node selected")).toBeDefined();
	});

	it("shows edge label when present", () => {
		const canvasView = {
			canvas: {
				getData: vi.fn().mockReturnValue({
					nodes: [
						{ id: "n1", type: "file", file: "notes/test.md", x: 0, y: 0, width: 400, height: 300 },
						{ id: "n2", type: "file", file: "notes/other.md", x: 500, y: 0, width: 400, height: 300 },
					],
					edges: [{ id: "e1", fromNode: "n1", fromSide: "right", toNode: "n2", toSide: "left", label: "relates" }],
				}),
				setData: vi.fn(),
				requestSave: vi.fn(),
				createFileNode: vi.fn(),
				selection: new Set([{ id: "n1", x: 0, y: 0, width: 400, height: 300 }]),
			},
			file: new TFile("test.canvas"),
		};
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);
		render(<CanvasInfoPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByText("\u2192 other | relates")).toBeDefined();
	});

	it("shows incoming edge with label", () => {
		const canvasView = {
			canvas: {
				getData: vi.fn().mockReturnValue({
					nodes: [
						{ id: "n1", type: "file", file: "notes/test.md", x: 0, y: 0, width: 400, height: 300 },
						{ id: "n2", type: "file", file: "notes/source.md", x: 500, y: 0, width: 400, height: 300 },
					],
					edges: [{ id: "e1", fromNode: "n2", fromSide: "right", toNode: "n1", toSide: "left", label: "depends" }],
				}),
				setData: vi.fn(),
				requestSave: vi.fn(),
				createFileNode: vi.fn(),
				selection: new Set([{ id: "n1", x: 0, y: 0, width: 400, height: 300 }]),
			},
			file: new TFile("test.canvas"),
		};
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);
		render(<CanvasInfoPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByText("\u2190 source | depends")).toBeDefined();
	});

	it("shows incoming edge with \u2190 direction", () => {
		const canvasView = {
			canvas: {
				getData: vi.fn().mockReturnValue({
					nodes: [
						{ id: "n1", type: "file", file: "notes/test.md", x: 0, y: 0, width: 400, height: 300 },
						{ id: "n2", type: "file", file: "notes/source.md", x: 500, y: 0, width: 400, height: 300 },
					],
					edges: [{ id: "e1", fromNode: "n2", fromSide: "right", toNode: "n1", toSide: "left" }],
				}),
				setData: vi.fn(),
				requestSave: vi.fn(),
				createFileNode: vi.fn(),
				selection: new Set([{ id: "n1", x: 0, y: 0, width: 400, height: 300 }]),
			},
			file: new TFile("test.canvas"),
		};
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);
		render(<CanvasInfoPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByText("\u2190 source")).toBeDefined();
	});

	it("shows connections for a selected node", () => {
		const file = new TFile("notes/test.md");
		const canvasView = {
			canvas: {
				getData: vi.fn().mockReturnValue({
					nodes: [
						{ id: "n1", type: "file", file: "notes/test.md", x: 0, y: 0, width: 400, height: 300 },
						{
							id: "n2",
							type: "file",
							file: "notes/other.md",
							x: 500,
							y: 0,
							width: 400,
							height: 300,
						},
					],
					edges: [{ id: "e1", fromNode: "n1", fromSide: "right", toNode: "n2", toSide: "left" }],
				}),
				setData: vi.fn(),
				requestSave: vi.fn(),
				createFileNode: vi.fn(),
				selection: new Set([{ id: "n1", x: 0, y: 0, width: 400, height: 300, file }]),
			},
			file: new TFile("test.canvas"),
		};
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		render(<CanvasInfoPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByText("Connections")).toBeDefined();
		expect(screen.getByText("→ other")).toBeDefined();
	});
});

function makeNodeMap(nodes: CanvasNodeData[]): Map<string, CanvasNodeData> {
	return new Map(nodes.map((n) => [n.id, n]));
}

describe("resolveNodeLabel", () => {
	it("returns basename for file node", () => {
		const nodeMap = makeNodeMap([
			{ id: "n1", type: "file", file: "notes/My Note.md", x: 0, y: 0, width: 400, height: 300 },
		]);
		expect(resolveNodeLabel("n1", nodeMap)).toBe("My Note");
	});

	it("returns first 30 chars of text for text node", () => {
		const longText = "A".repeat(50);
		const nodeMap = makeNodeMap([
			{ id: "n1", type: "text", text: longText, x: 0, y: 0, width: 400, height: 300 },
		]);
		expect(resolveNodeLabel("n1", nodeMap)).toBe(`${"A".repeat(30)}...`);
	});

	it("returns full text when under 30 chars", () => {
		const nodeMap = makeNodeMap([
			{ id: "n1", type: "text", text: "Short text", x: 0, y: 0, width: 400, height: 300 },
		]);
		expect(resolveNodeLabel("n1", nodeMap)).toBe("Short text");
	});

	it("returns nodeId when node not found", () => {
		const nodeMap = makeNodeMap([]);
		expect(resolveNodeLabel("unknown", nodeMap)).toBe("unknown");
	});

	it("returns nodeId for node without file or text", () => {
		const nodeMap = makeNodeMap([
			{ id: "n1", type: "link", url: "https://example.com", x: 0, y: 0, width: 400, height: 300 },
		]);
		expect(resolveNodeLabel("n1", nodeMap)).toBe("n1");
	});

	it("removes .md extension from file path", () => {
		const nodeMap = makeNodeMap([
			{ id: "n1", type: "file", file: "folder/subfolder/deep.md", x: 0, y: 0, width: 400, height: 300 },
		]);
		expect(resolveNodeLabel("n1", nodeMap)).toBe("deep");
	});
});
