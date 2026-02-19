import { CanvasOperator } from "@/services/canvas-operator";
import type { Canvas, CanvasData, CanvasNode } from "@/types/obsidian-canvas";
import { DEFAULT_SETTINGS } from "@/types/settings";
import { App, TFile } from "obsidian";
import { beforeEach, describe, expect, it, vi } from "vitest";

function createMockCanvas(): Canvas {
	return {
		createFileNode: vi
			.fn()
			.mockReturnValue({ id: "new-node", x: 100, y: 200, width: 400, height: 300 }),
		getData: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
		setData: vi.fn(),
		requestSave: vi.fn(),
	};
}

function createMockCanvasNoApi(): Canvas {
	return {
		createFileNode: undefined as never,
		getData: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
		setData: vi.fn(),
		requestSave: vi.fn(),
	};
}

describe("CanvasOperator", () => {
	let app: App;
	let operator: CanvasOperator;

	beforeEach(() => {
		app = new App();
		operator = new CanvasOperator(app, DEFAULT_SETTINGS);
	});

	describe("addNodeToCanvas - when createFileNode is available", () => {
		it("calls createFileNode with correct parameters", () => {
			const canvas = createMockCanvas();
			const file = new TFile("notes/test.md");

			operator.addNodeToCanvas(canvas, file, { x: 100, y: 200 });

			expect(canvas.createFileNode).toHaveBeenCalledWith({
				file,
				pos: { x: 100, y: 200 },
				size: {
					width: DEFAULT_SETTINGS.defaultNodeWidth,
					height: DEFAULT_SETTINGS.defaultNodeHeight,
				},
				save: true,
			});
		});

		it("returns a CanvasNode", () => {
			const canvas = createMockCanvas();
			const file = new TFile("notes/test.md");

			const result = operator.addNodeToCanvas(canvas, file, { x: 100, y: 200 });

			expect(result).not.toBeNull();
			expect(result?.id).toBe("new-node");
			expect(result?.x).toBe(100);
			expect(result?.y).toBe(200);
		});
	});

	describe("addNodeToCanvas - when createFileNode is undefined (fallback)", () => {
		it("uses getData/setData/requestSave for JSON manipulation", () => {
			const canvas = createMockCanvasNoApi();
			const file = new TFile("notes/fallback.md");

			operator.addNodeToCanvas(canvas, file, { x: 300, y: 400 });

			expect(canvas.getData).toHaveBeenCalled();
			expect(canvas.setData).toHaveBeenCalled();
			expect(canvas.requestSave).toHaveBeenCalled();
		});

		it("adds correct node data", () => {
			const canvas = createMockCanvasNoApi();
			const file = new TFile("notes/fallback.md");

			operator.addNodeToCanvas(canvas, file, { x: 300, y: 400 });

			const setDataCall = vi.mocked(canvas.setData).mock.calls[0][0];
			expect(setDataCall.nodes).toHaveLength(1);

			const node = setDataCall.nodes[0];
			expect(node.type).toBe("file");
			expect(node.file).toBe("notes/fallback.md");
			expect(node.x).toBe(300);
			expect(node.y).toBe(400);
			expect(node.width).toBe(DEFAULT_SETTINGS.defaultNodeWidth);
			expect(node.height).toBe(DEFAULT_SETTINGS.defaultNodeHeight);
			expect(node.id).toMatch(/^[0-9a-f]{16}$/);
		});

		it("returns a CanvasNode-compatible object", () => {
			const canvas = createMockCanvasNoApi();
			const file = new TFile("notes/fallback.md");

			const result = operator.addNodeToCanvas(canvas, file, { x: 300, y: 400 });

			expect(result).not.toBeNull();
			expect(result?.x).toBe(300);
			expect(result?.y).toBe(400);
			expect(result?.width).toBe(DEFAULT_SETTINGS.defaultNodeWidth);
			expect(result?.height).toBe(DEFAULT_SETTINGS.defaultNodeHeight);
			expect(result?.id).toMatch(/^[0-9a-f]{16}$/);
		});

		it("preserves existing nodes while adding a new node", () => {
			const existingData: CanvasData = {
				nodes: [
					{ id: "existing", type: "text", text: "hello", x: 0, y: 0, width: 200, height: 100 },
				],
				edges: [],
			};
			const canvas = createMockCanvasNoApi();
			vi.mocked(canvas.getData).mockReturnValue(existingData);
			const file = new TFile("notes/new.md");

			operator.addNodeToCanvas(canvas, file, { x: 500, y: 500 });

			const setDataCall = vi.mocked(canvas.setData).mock.calls[0][0];
			expect(setDataCall.nodes).toHaveLength(2);
			expect(setDataCall.nodes[0].id).toBe("existing");
			expect(setDataCall.nodes[1].file).toBe("notes/new.md");
		});
	});

	describe("addNodeToCanvas - with subpath (reference mode)", () => {
		it("uses JSON manipulation instead of createFileNode when subpath is provided", () => {
			const canvas = createMockCanvas();
			const file = new TFile("notes/test.md");

			operator.addNodeToCanvas(canvas, file, { x: 100, y: 200 }, "#Section A");

			expect(canvas.createFileNode).not.toHaveBeenCalled();
			expect(canvas.getData).toHaveBeenCalled();
			expect(canvas.setData).toHaveBeenCalled();
			expect(canvas.requestSave).toHaveBeenCalled();
		});

		it("includes subpath in node data", () => {
			const canvas = createMockCanvas();
			vi.mocked(canvas.getData).mockReturnValue({ nodes: [], edges: [] });
			const file = new TFile("notes/test.md");

			operator.addNodeToCanvas(canvas, file, { x: 100, y: 200 }, "#Section A");

			const setDataCall = vi.mocked(canvas.setData).mock.calls[0][0];
			expect(setDataCall.nodes).toHaveLength(1);

			const node = setDataCall.nodes[0];
			expect(node.type).toBe("file");
			expect(node.file).toBe("notes/test.md");
			expect(node.subpath).toBe("#Section A");
			expect(node.x).toBe(100);
			expect(node.y).toBe(200);
		});

		it("returns a CanvasNode-compatible object", () => {
			const canvas = createMockCanvas();
			vi.mocked(canvas.getData).mockReturnValue({ nodes: [], edges: [] });
			const file = new TFile("notes/test.md");

			const result = operator.addNodeToCanvas(canvas, file, { x: 100, y: 200 }, "#Section A");

			expect(result).not.toBeNull();
			expect(result?.x).toBe(100);
			expect(result?.y).toBe(200);
			expect(result?.id).toMatch(/^[0-9a-f]{16}$/);
		});

		it("does not use createFileNode even when it is available", () => {
			const canvas = createMockCanvas();
			vi.mocked(canvas.getData).mockReturnValue({ nodes: [], edges: [] });
			const file = new TFile("notes/test.md");

			operator.addNodeToCanvas(canvas, file, { x: 0, y: 0 }, "#Heading");

			expect(canvas.createFileNode).not.toHaveBeenCalled();
		});
	});

	describe("addNodeViaJson", () => {
		it("reads JSON, parses, adds node, and writes back", async () => {
			const canvasFile = new TFile("canvas/test.canvas");
			const file = new TFile("notes/via-json.md");
			const emptyData: CanvasData = { nodes: [], edges: [] };
			app.vault.read = vi.fn().mockResolvedValue(JSON.stringify(emptyData));
			app.vault.modify = vi.fn().mockResolvedValue(undefined);

			await operator.addNodeViaJson(canvasFile, file, { x: 150, y: 250 });

			expect(app.vault.read).toHaveBeenCalledWith(canvasFile);
			expect(app.vault.modify).toHaveBeenCalled();

			const modifyCall = vi.mocked(app.vault.modify).mock.calls[0];
			const savedData: CanvasData = JSON.parse(modifyCall[1] as string);
			expect(savedData.nodes).toHaveLength(1);

			const node = savedData.nodes[0];
			expect(node.type).toBe("file");
			expect(node.file).toBe("notes/via-json.md");
			expect(node.x).toBe(150);
			expect(node.y).toBe(250);
			expect(node.width).toBe(DEFAULT_SETTINGS.defaultNodeWidth);
			expect(node.height).toBe(DEFAULT_SETTINGS.defaultNodeHeight);
			expect(node.id).toMatch(/^[0-9a-f]{16}$/);
		});

		it("preserves existing nodes while adding a new node", async () => {
			const canvasFile = new TFile("canvas/test.canvas");
			const file = new TFile("notes/additional.md");
			const existingData: CanvasData = {
				nodes: [
					{
						id: "abc123",
						type: "file",
						file: "old.md",
						x: 0,
						y: 0,
						width: 400,
						height: 300,
					},
				],
				edges: [
					{
						id: "edge1",
						fromNode: "abc123",
						fromSide: "right",
						toNode: "xyz",
						toSide: "left",
					},
				],
			};
			app.vault.read = vi.fn().mockResolvedValue(JSON.stringify(existingData));
			app.vault.modify = vi.fn().mockResolvedValue(undefined);

			await operator.addNodeViaJson(canvasFile, file, { x: 500, y: 0 });

			const modifyCall = vi.mocked(app.vault.modify).mock.calls[0];
			const savedData: CanvasData = JSON.parse(modifyCall[1] as string);
			expect(savedData.nodes).toHaveLength(2);
			expect(savedData.nodes[0].id).toBe("abc123");
			expect(savedData.nodes[1].file).toBe("notes/additional.md");
			expect(savedData.edges).toHaveLength(1);
		});

		it("includes subpath in node data when provided", async () => {
			const canvasFile = new TFile("canvas/test.canvas");
			const file = new TFile("notes/via-json.md");
			const emptyData: CanvasData = { nodes: [], edges: [] };
			app.vault.read = vi.fn().mockResolvedValue(JSON.stringify(emptyData));
			app.vault.modify = vi.fn().mockResolvedValue(undefined);

			await operator.addNodeViaJson(canvasFile, file, { x: 150, y: 250 }, "#Section B");

			const modifyCall = vi.mocked(app.vault.modify).mock.calls[0];
			const savedData: CanvasData = JSON.parse(modifyCall[1] as string);
			expect(savedData.nodes).toHaveLength(1);

			const node = savedData.nodes[0];
			expect(node.subpath).toBe("#Section B");
			expect(node.file).toBe("notes/via-json.md");
		});

		it("does not include subpath when not provided", async () => {
			const canvasFile = new TFile("canvas/test.canvas");
			const file = new TFile("notes/no-subpath.md");
			const emptyData: CanvasData = { nodes: [], edges: [] };
			app.vault.read = vi.fn().mockResolvedValue(JSON.stringify(emptyData));
			app.vault.modify = vi.fn().mockResolvedValue(undefined);

			await operator.addNodeViaJson(canvasFile, file, { x: 0, y: 0 });

			const modifyCall = vi.mocked(app.vault.modify).mock.calls[0];
			const savedData: CanvasData = JSON.parse(modifyCall[1] as string);
			expect(savedData.nodes[0].subpath).toBeUndefined();
		});

		it("writes JSON back with tab indentation", async () => {
			const canvasFile = new TFile("canvas/test.canvas");
			const file = new TFile("notes/formatted.md");
			const emptyData: CanvasData = { nodes: [], edges: [] };
			app.vault.read = vi.fn().mockResolvedValue(JSON.stringify(emptyData));
			app.vault.modify = vi.fn().mockResolvedValue(undefined);

			await operator.addNodeViaJson(canvasFile, file, { x: 0, y: 0 });

			const modifyCall = vi.mocked(app.vault.modify).mock.calls[0];
			const rawJson = modifyCall[1] as string;
			expect(rawJson).toContain("\t");
		});
	});

	describe("addEdgeToCanvas", () => {
		it("adds an edge via JSON manipulation", () => {
			const canvas = createMockCanvas();
			vi.mocked(canvas.getData).mockReturnValue({ nodes: [], edges: [] });

			operator.addEdgeToCanvas(canvas, {
				fromNode: "node-a",
				toNode: "node-b",
			});

			expect(canvas.setData).toHaveBeenCalled();
			expect(canvas.requestSave).toHaveBeenCalled();

			const setDataCall = vi.mocked(canvas.setData).mock.calls[0][0];
			expect(setDataCall.edges).toHaveLength(1);

			const edge = setDataCall.edges[0];
			expect(edge.fromNode).toBe("node-a");
			expect(edge.toNode).toBe("node-b");
			expect(edge.fromSide).toBe("right");
			expect(edge.toSide).toBe("left");
			expect(edge.toEnd).toBe("arrow");
			expect(edge.id).toMatch(/^[0-9a-f]{16}$/);
		});

		it("applies custom color and label", () => {
			const canvas = createMockCanvas();
			vi.mocked(canvas.getData).mockReturnValue({ nodes: [], edges: [] });

			operator.addEdgeToCanvas(canvas, {
				fromNode: "node-a",
				toNode: "node-b",
				color: "1",
				label: "relates to",
			});

			const setDataCall = vi.mocked(canvas.setData).mock.calls[0][0];
			const edge = setDataCall.edges[0];
			expect(edge.color).toBe("1");
			expect(edge.label).toBe("relates to");
		});

		it("preserves existing edges", () => {
			const canvas = createMockCanvas();
			vi.mocked(canvas.getData).mockReturnValue({
				nodes: [],
				edges: [
					{
						id: "existing-edge",
						fromNode: "a",
						fromSide: "right",
						toNode: "b",
						toSide: "left",
					},
				],
			});

			operator.addEdgeToCanvas(canvas, {
				fromNode: "c",
				toNode: "d",
			});

			const setDataCall = vi.mocked(canvas.setData).mock.calls[0][0];
			expect(setDataCall.edges).toHaveLength(2);
			expect(setDataCall.edges[0].id).toBe("existing-edge");
		});
	});

	describe("addEdgeViaJson", () => {
		it("reads JSON, adds edge, and writes back", async () => {
			const canvasFile = new TFile("canvas/test.canvas");
			const emptyData = { nodes: [], edges: [] };
			app.vault.read = vi.fn().mockResolvedValue(JSON.stringify(emptyData));
			app.vault.modify = vi.fn().mockResolvedValue(undefined);

			await operator.addEdgeViaJson(canvasFile, {
				fromNode: "node-1",
				toNode: "node-2",
			});

			expect(app.vault.read).toHaveBeenCalledWith(canvasFile);
			expect(app.vault.modify).toHaveBeenCalled();

			const modifyCall = vi.mocked(app.vault.modify).mock.calls[0];
			const savedData = JSON.parse(modifyCall[1] as string);
			expect(savedData.edges).toHaveLength(1);
			expect(savedData.edges[0].fromNode).toBe("node-1");
			expect(savedData.edges[0].toNode).toBe("node-2");
			expect(savedData.edges[0].toEnd).toBe("arrow");
		});
	});

	describe("addGroupToCanvas", () => {
		const GROUP_PADDING = 20;

		it("adds a group node encompassing the selected nodes", () => {
			const canvas = createMockCanvas();
			vi.mocked(canvas.getData).mockReturnValue({ nodes: [], edges: [] });

			const nodes: CanvasNode[] = [
				{ id: "a", x: 0, y: 0, width: 400, height: 300 },
				{ id: "b", x: 500, y: 100, width: 400, height: 300 },
			];

			operator.addGroupToCanvas(canvas, nodes);

			expect(canvas.setData).toHaveBeenCalled();
			expect(canvas.requestSave).toHaveBeenCalled();

			const setDataCall = vi.mocked(canvas.setData).mock.calls[0][0];
			expect(setDataCall.nodes).toHaveLength(1);

			const group = setDataCall.nodes[0];
			expect(group.type).toBe("group");
			expect(group.x).toBe(0 - GROUP_PADDING);
			expect(group.y).toBe(0 - GROUP_PADDING);
			expect(group.width).toBe(900 + GROUP_PADDING * 2);
			expect(group.height).toBe(400 + GROUP_PADDING * 2);
			expect(group.id).toMatch(/^[0-9a-f]{16}$/);
		});

		it("adds a group with a label", () => {
			const canvas = createMockCanvas();
			vi.mocked(canvas.getData).mockReturnValue({ nodes: [], edges: [] });

			const nodes: CanvasNode[] = [{ id: "a", x: 100, y: 100, width: 200, height: 200 }];

			operator.addGroupToCanvas(canvas, nodes, "My Section");

			const setDataCall = vi.mocked(canvas.setData).mock.calls[0][0];
			const group = setDataCall.nodes[0];
			expect(group.label).toBe("My Section");
		});

		it("does nothing when no nodes are provided", () => {
			const canvas = createMockCanvas();

			operator.addGroupToCanvas(canvas, []);

			expect(canvas.setData).not.toHaveBeenCalled();
		});

		it("handles single node correctly", () => {
			const canvas = createMockCanvas();
			vi.mocked(canvas.getData).mockReturnValue({ nodes: [], edges: [] });

			const nodes: CanvasNode[] = [{ id: "a", x: 50, y: 75, width: 400, height: 300 }];

			operator.addGroupToCanvas(canvas, nodes);

			const setDataCall = vi.mocked(canvas.setData).mock.calls[0][0];
			const group = setDataCall.nodes[0];
			expect(group.x).toBe(50 - GROUP_PADDING);
			expect(group.y).toBe(75 - GROUP_PADDING);
			expect(group.width).toBe(400 + GROUP_PADDING * 2);
			expect(group.height).toBe(300 + GROUP_PADDING * 2);
		});

		it("preserves existing nodes", () => {
			const canvas = createMockCanvas();
			vi.mocked(canvas.getData).mockReturnValue({
				nodes: [{ id: "existing", type: "text", text: "hi", x: 0, y: 0, width: 100, height: 50 }],
				edges: [],
			});

			const nodes: CanvasNode[] = [{ id: "a", x: 0, y: 0, width: 200, height: 200 }];

			operator.addGroupToCanvas(canvas, nodes);

			const setDataCall = vi.mocked(canvas.setData).mock.calls[0][0];
			expect(setDataCall.nodes).toHaveLength(2);
			expect(setDataCall.nodes[0].id).toBe("existing");
		});
	});

	describe("edge cases", () => {
		it("fallback works with empty canvas data", () => {
			const canvas = createMockCanvasNoApi();
			vi.mocked(canvas.getData).mockReturnValue({ nodes: [], edges: [] });
			const file = new TFile("notes/empty-canvas.md");

			const result = operator.addNodeToCanvas(canvas, file, { x: 0, y: 0 });

			expect(result).not.toBeNull();
			const setDataCall = vi.mocked(canvas.setData).mock.calls[0][0];
			expect(setDataCall.nodes).toHaveLength(1);
			expect(setDataCall.edges).toHaveLength(0);
		});
	});
});
