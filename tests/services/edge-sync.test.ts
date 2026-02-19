import { EdgeSync } from "@/services/edge-sync";
import type { CanvasData, CanvasEdgeData, CanvasNodeData } from "@/types/obsidian-canvas";
import { App, FileManager, TFile, Vault } from "obsidian";
import { beforeEach, describe, expect, it, vi } from "vitest";

function makeNode(id: string, file?: string): CanvasNodeData {
	return {
		id,
		type: file ? "file" : "text",
		file,
		x: 0,
		y: 0,
		width: 400,
		height: 300,
	};
}

function makeEdge(id: string, fromNode: string, toNode: string, label?: string): CanvasEdgeData {
	return {
		id,
		fromNode,
		fromSide: "right",
		toNode,
		toSide: "left",
		toEnd: "arrow",
		label,
	};
}

function makeNodeMap(nodes: CanvasNodeData[]): Map<string, CanvasNodeData> {
	return new Map(nodes.map((n) => [n.id, n]));
}

describe("EdgeSync", () => {
	let app: App;
	let vault: Vault;
	let fileManager: FileManager;
	let edgeSync: EdgeSync;

	beforeEach(() => {
		app = new App();
		vault = app.vault;
		fileManager = app.fileManager;
		edgeSync = new EdgeSync(app);
	});

	describe("diffEdges", () => {
		it("detects newly added edges", () => {
			edgeSync.setSnapshot([makeEdge("e1", "n1", "n2")], makeNodeMap([]));

			const current = [makeEdge("e1", "n1", "n2"), makeEdge("e2", "n3", "n4")];
			const added = edgeSync.diffEdges(current);

			expect(added).toHaveLength(1);
			expect(added[0].id).toBe("e2");
		});

		it("returns empty array when no edges added", () => {
			edgeSync.setSnapshot([makeEdge("e1", "n1", "n2")], makeNodeMap([]));

			const current = [makeEdge("e1", "n1", "n2")];
			const added = edgeSync.diffEdges(current);

			expect(added).toHaveLength(0);
		});

		it("returns empty array when edges removed (not added)", () => {
			edgeSync.setSnapshot(
				[makeEdge("e1", "n1", "n2"), makeEdge("e2", "n3", "n4")],
				makeNodeMap([]),
			);

			const current = [makeEdge("e1", "n1", "n2")];
			const added = edgeSync.diffEdges(current);

			expect(added).toHaveLength(0);
		});

		it("detects multiple added edges", () => {
			edgeSync.setSnapshot([], makeNodeMap([]));

			const current = [makeEdge("e1", "n1", "n2"), makeEdge("e2", "n3", "n4")];
			const added = edgeSync.diffEdges(current);

			expect(added).toHaveLength(2);
		});
	});

	describe("diffRemovedEdges", () => {
		it("detects removed edges", () => {
			edgeSync.setSnapshot(
				[makeEdge("e1", "n1", "n2"), makeEdge("e2", "n3", "n4")],
				makeNodeMap([]),
			);

			const current = [makeEdge("e1", "n1", "n2")];
			const removed = edgeSync.diffRemovedEdges(current);

			expect(removed).toHaveLength(1);
			expect(removed[0].id).toBe("e2");
		});

		it("returns empty array when no edges removed", () => {
			edgeSync.setSnapshot([makeEdge("e1", "n1", "n2")], makeNodeMap([]));

			const current = [makeEdge("e1", "n1", "n2")];
			const removed = edgeSync.diffRemovedEdges(current);

			expect(removed).toHaveLength(0);
		});

		it("detects all edges removed", () => {
			edgeSync.setSnapshot(
				[makeEdge("e1", "n1", "n2"), makeEdge("e2", "n3", "n4")],
				makeNodeMap([]),
			);

			const removed = edgeSync.diffRemovedEdges([]);

			expect(removed).toHaveLength(2);
		});
	});

	describe("processNewEdge", () => {
		it("calls processFrontMatter for both files", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const edge = makeEdge("e1", "n1", "n2");

			const sourceFile = new TFile("notes/a.md");
			const targetFile = new TFile("notes/b.md");
			vault.getAbstractFileByPath = vi.fn().mockImplementation((path: string) => {
				if (path === "notes/a.md") return sourceFile;
				if (path === "notes/b.md") return targetFile;
				return null;
			});

			await edgeSync.processNewEdge(edge, { nodes, edges: [edge] });

			expect(fileManager.processFrontMatter).toHaveBeenCalledTimes(2);
			expect(fileManager.processFrontMatter).toHaveBeenCalledWith(targetFile, expect.any(Function));
			expect(fileManager.processFrontMatter).toHaveBeenCalledWith(sourceFile, expect.any(Function));
		});

		it("writes correct frontmatter keys for both files", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const edge = makeEdge("e1", "n1", "n2");

			const sourceFile = new TFile("notes/a.md");
			const targetFile = new TFile("notes/b.md");
			vault.getAbstractFileByPath = vi.fn().mockImplementation((path: string) => {
				if (path === "notes/a.md") return sourceFile;
				if (path === "notes/b.md") return targetFile;
				return null;
			});

			const captured: Array<{ file: TFile; fm: Record<string, unknown> }> = [];
			fileManager.processFrontMatter = vi.fn().mockImplementation(
				async (file: TFile, fn: (fm: Record<string, unknown>) => void) => {
					const fm: Record<string, unknown> = {};
					fn(fm);
					captured.push({ file, fm });
				},
			);

			await edgeSync.processNewEdge(edge, { nodes, edges: [edge] });

			expect(captured).toHaveLength(2);
			const targetFm = captured.find((c) => c.file === targetFile);
			const sourceFm = captured.find((c) => c.file === sourceFile);
			expect(targetFm?.fm["connections-from"]).toEqual(["[[a]]"]);
			expect(sourceFm?.fm["connections-to"]).toEqual(["[[b]]"]);
		});

		it("skips non-file nodes", async () => {
			const nodes = [makeNode("n1"), makeNode("n2", "notes/b.md")];
			const edge = makeEdge("e1", "n1", "n2");

			await edgeSync.processNewEdge(edge, { nodes, edges: [edge] });

			expect(fileManager.processFrontMatter).not.toHaveBeenCalled();
		});

		it("skips when toNode is a text node", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2")];
			const edge = makeEdge("e1", "n1", "n2");

			await edgeSync.processNewEdge(edge, { nodes, edges: [edge] });

			expect(fileManager.processFrontMatter).not.toHaveBeenCalled();
		});

		it("skips when target file not found in vault", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const edge = makeEdge("e1", "n1", "n2");

			vault.getAbstractFileByPath = vi.fn().mockReturnValue(null);

			await edgeSync.processNewEdge(edge, { nodes, edges: [edge] });

			expect(fileManager.processFrontMatter).not.toHaveBeenCalled();
		});
	});

	describe("processRemovedEdge", () => {
		it("calls processFrontMatter for both files on removal", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const edge = makeEdge("e1", "n1", "n2");
			edgeSync.setSnapshot([edge], makeNodeMap(nodes));

			const sourceFile = new TFile("notes/a.md");
			const targetFile = new TFile("notes/b.md");
			vault.getAbstractFileByPath = vi.fn().mockImplementation((path: string) => {
				if (path === "notes/a.md") return sourceFile;
				if (path === "notes/b.md") return targetFile;
				return null;
			});

			await edgeSync.processRemovedEdge(edge, []);

			expect(fileManager.processFrontMatter).toHaveBeenCalledTimes(2);
			expect(fileManager.processFrontMatter).toHaveBeenCalledWith(sourceFile, expect.any(Function));
			expect(fileManager.processFrontMatter).toHaveBeenCalledWith(targetFile, expect.any(Function));
		});

		it("skips removal when another edge exists between same pair", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const edge1 = makeEdge("e1", "n1", "n2");
			const edge2 = makeEdge("e2", "n1", "n2");
			edgeSync.setSnapshot([edge1, edge2], makeNodeMap(nodes));

			const sourceFile = new TFile("notes/a.md");
			const targetFile = new TFile("notes/b.md");
			vault.getAbstractFileByPath = vi.fn().mockImplementation((path: string) => {
				if (path === "notes/a.md") return sourceFile;
				if (path === "notes/b.md") return targetFile;
				return null;
			});

			await edgeSync.processRemovedEdge(edge1, [edge2]);

			expect(fileManager.processFrontMatter).not.toHaveBeenCalled();
		});

		it("skips removal when reverse edge exists between same pair", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const edge1 = makeEdge("e1", "n1", "n2");
			const reverseEdge = makeEdge("e2", "n2", "n1");
			edgeSync.setSnapshot([edge1, reverseEdge], makeNodeMap(nodes));

			const sourceFile = new TFile("notes/a.md");
			const targetFile = new TFile("notes/b.md");
			vault.getAbstractFileByPath = vi.fn().mockImplementation((path: string) => {
				if (path === "notes/a.md") return sourceFile;
				if (path === "notes/b.md") return targetFile;
				return null;
			});

			await edgeSync.processRemovedEdge(edge1, [reverseEdge]);

			expect(fileManager.processFrontMatter).not.toHaveBeenCalled();
		});

		it("removes connection when source is TFile but target is not", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const edge = makeEdge("e1", "n1", "n2");
			edgeSync.setSnapshot([edge], makeNodeMap(nodes));

			const sourceFile = new TFile("notes/a.md");
			vault.getAbstractFileByPath = vi.fn().mockImplementation((path: string) => {
				if (path === "notes/a.md") return sourceFile;
				return null;
			});

			await edgeSync.processRemovedEdge(edge, []);

			expect(fileManager.processFrontMatter).toHaveBeenCalledTimes(1);
			expect(fileManager.processFrontMatter).toHaveBeenCalledWith(sourceFile, expect.any(Function));
		});

		it("removes connection when target is TFile but source is not", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const edge = makeEdge("e1", "n1", "n2");
			edgeSync.setSnapshot([edge], makeNodeMap(nodes));

			const targetFile = new TFile("notes/b.md");
			vault.getAbstractFileByPath = vi.fn().mockImplementation((path: string) => {
				if (path === "notes/b.md") return targetFile;
				return null;
			});

			await edgeSync.processRemovedEdge(edge, []);

			expect(fileManager.processFrontMatter).toHaveBeenCalledTimes(1);
			expect(fileManager.processFrontMatter).toHaveBeenCalledWith(targetFile, expect.any(Function));
		});

		it("skips when node files cannot be resolved", async () => {
			const nodes = [makeNode("n1"), makeNode("n2")];
			const edge = makeEdge("e1", "n1", "n2");
			edgeSync.setSnapshot([edge], makeNodeMap(nodes));

			await edgeSync.processRemovedEdge(edge, []);

			expect(fileManager.processFrontMatter).not.toHaveBeenCalled();
		});
	});

	describe("onCanvasModified", () => {
		it("ignores non-.canvas files", async () => {
			const file = new TFile("notes/test.md");
			await edgeSync.onCanvasModified(file);

			expect(vault.read).not.toHaveBeenCalled();
		});

		it("processes new edges from .canvas file", async () => {
			const canvasFile = new TFile("test.canvas");
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const canvasData: CanvasData = {
				nodes,
				edges: [makeEdge("e1", "n1", "n2")],
			};

			vault.read = vi.fn().mockResolvedValue(JSON.stringify(canvasData));

			const sourceFile = new TFile("notes/a.md");
			const targetFile = new TFile("notes/b.md");
			vault.getAbstractFileByPath = vi.fn().mockImplementation((path: string) => {
				if (path === "notes/a.md") return sourceFile;
				if (path === "notes/b.md") return targetFile;
				return null;
			});

			edgeSync.setSnapshot([], makeNodeMap([]));

			await edgeSync.onCanvasModified(canvasFile);

			expect(fileManager.processFrontMatter).toHaveBeenCalled();
		});

		it("processes removed edges from .canvas file", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const initialEdge = makeEdge("e1", "n1", "n2");
			edgeSync.setSnapshot([initialEdge], makeNodeMap(nodes));

			const canvasFile = new TFile("test.canvas");
			const canvasData: CanvasData = { nodes, edges: [] };

			const sourceFile = new TFile("notes/a.md");
			const targetFile = new TFile("notes/b.md");
			vault.getAbstractFileByPath = vi.fn().mockImplementation((path: string) => {
				if (path === "notes/a.md") return sourceFile;
				if (path === "notes/b.md") return targetFile;
				return null;
			});
			vault.read = vi.fn().mockResolvedValue(JSON.stringify(canvasData));

			await edgeSync.onCanvasModified(canvasFile);

			expect(fileManager.processFrontMatter).toHaveBeenCalled();
		});
	});

	describe("onCanvasModified - invalid JSON", () => {
		it("returns early when canvas file contains invalid JSON", async () => {
			const canvasFile = new TFile("test.canvas");
			vault.read = vi.fn().mockResolvedValue("not valid json");
			await edgeSync.onCanvasModified(canvasFile);
			expect(fileManager.processFrontMatter).not.toHaveBeenCalled();
		});
	});

	describe("processNewEdge - source file not in vault", () => {
		it("skips when source file not found in vault", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const edge = makeEdge("e1", "n1", "n2");
			const targetFile = new TFile("notes/b.md");
			vault.getAbstractFileByPath = vi.fn().mockImplementation((path: string) => {
				if (path === "notes/b.md") return targetFile;
				return null;
			});
			await edgeSync.processNewEdge(edge, { nodes, edges: [edge] });
			expect(fileManager.processFrontMatter).not.toHaveBeenCalled();
		});
	});

	describe("initializeFromCanvas", () => {
		it("sets snapshot from canvas data", async () => {
			const canvasFile = new TFile("test.canvas");
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const canvasData: CanvasData = {
				nodes,
				edges: [makeEdge("e1", "n1", "n2"), makeEdge("e2", "n3", "n4")],
			};

			vault.read = vi.fn().mockResolvedValue(JSON.stringify(canvasData));

			await edgeSync.initializeFromCanvas(canvasFile);

			const added = edgeSync.diffEdges(canvasData.edges);
			expect(added).toHaveLength(0);
		});
	});

	describe("initializeFromCanvas - invalid JSON", () => {
		it("returns early when canvas file contains invalid JSON", async () => {
			const canvasFile = new TFile("test.canvas");
			vault.read = vi.fn().mockResolvedValue("not valid json");
			await edgeSync.initializeFromCanvas(canvasFile);
			const added = edgeSync.diffEdges([makeEdge("e1", "n1", "n2")]);
			expect(added).toHaveLength(1);
		});
	});

	describe("reset", () => {
		it("clears the snapshot", () => {
			edgeSync.setSnapshot([makeEdge("e1", "n1", "n2")], makeNodeMap([]));
			edgeSync.reset();

			const added = edgeSync.diffEdges([makeEdge("e1", "n1", "n2")]);
			expect(added).toHaveLength(1);
		});
	});
});
