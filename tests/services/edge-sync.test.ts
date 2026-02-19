import { EdgeSync } from "@/services/edge-sync";
import type { CanvasData, CanvasEdgeData, CanvasNodeData } from "@/types/obsidian-canvas";
import { App, TFile, Vault } from "obsidian";
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

function makeEdge(id: string, fromNode: string, toNode: string): CanvasEdgeData {
	return {
		id,
		fromNode,
		fromSide: "right",
		toNode,
		toSide: "left",
		toEnd: "arrow",
	};
}

describe("EdgeSync", () => {
	let app: App;
	let vault: Vault;
	let edgeSync: EdgeSync;
	const sectionName = "Connections";

	beforeEach(() => {
		app = new App();
		vault = app.vault;
		edgeSync = new EdgeSync(app, sectionName);
	});

	describe("diffEdges", () => {
		it("detects newly added edges", () => {
			edgeSync.setSnapshot([makeEdge("e1", "n1", "n2")]);

			const current = [makeEdge("e1", "n1", "n2"), makeEdge("e2", "n3", "n4")];
			const added = edgeSync.diffEdges(current);

			expect(added).toHaveLength(1);
			expect(added[0].id).toBe("e2");
		});

		it("returns empty array when no edges added", () => {
			edgeSync.setSnapshot([makeEdge("e1", "n1", "n2")]);

			const current = [makeEdge("e1", "n1", "n2")];
			const added = edgeSync.diffEdges(current);

			expect(added).toHaveLength(0);
		});

		it("returns empty array when edges removed (not added)", () => {
			edgeSync.setSnapshot([makeEdge("e1", "n1", "n2"), makeEdge("e2", "n3", "n4")]);

			const current = [makeEdge("e1", "n1", "n2")];
			const added = edgeSync.diffEdges(current);

			expect(added).toHaveLength(0);
		});

		it("detects multiple added edges", () => {
			edgeSync.setSnapshot([]);

			const current = [makeEdge("e1", "n1", "n2"), makeEdge("e2", "n3", "n4")];
			const added = edgeSync.diffEdges(current);

			expect(added).toHaveLength(2);
		});
	});

	describe("processNewEdge", () => {
		it("creates backlink for file-to-file edge", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const edge = makeEdge("e1", "n1", "n2");

			const sourceFile = new TFile("notes/a.md");
			const targetFile = new TFile("notes/b.md");
			vault.getAbstractFileByPath = vi.fn().mockImplementation((path: string) => {
				if (path === "notes/a.md") return sourceFile;
				if (path === "notes/b.md") return targetFile;
				return null;
			});
			vault.read = vi.fn().mockResolvedValue("# Note B\n\nContent.");

			await edgeSync.processNewEdge(edge, { nodes, edges: [edge] });

			expect(vault.modify).toHaveBeenCalled();
			const modifiedContent = vault.modify.mock.calls[0][1] as string;
			expect(modifiedContent).toContain("## Connections");
			expect(modifiedContent).toContain("- [[a]]");
		});

		it("skips non-file nodes", async () => {
			const nodes = [makeNode("n1"), makeNode("n2", "notes/b.md")];
			const edge = makeEdge("e1", "n1", "n2");

			await edgeSync.processNewEdge(edge, { nodes, edges: [edge] });

			expect(vault.modify).not.toHaveBeenCalled();
		});

		it("skips when toNode is a text node", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2")];
			const edge = makeEdge("e1", "n1", "n2");

			await edgeSync.processNewEdge(edge, { nodes, edges: [edge] });

			expect(vault.modify).not.toHaveBeenCalled();
		});

		it("skips when target file not found in vault", async () => {
			const nodes = [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")];
			const edge = makeEdge("e1", "n1", "n2");

			vault.getAbstractFileByPath = vi.fn().mockReturnValue(null);

			await edgeSync.processNewEdge(edge, { nodes, edges: [edge] });

			expect(vault.modify).not.toHaveBeenCalled();
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
			const canvasData: CanvasData = {
				nodes: [makeNode("n1", "notes/a.md"), makeNode("n2", "notes/b.md")],
				edges: [makeEdge("e1", "n1", "n2")],
			};

			vault.read = vi.fn().mockResolvedValue(JSON.stringify(canvasData));

			const targetFile = new TFile("notes/b.md");
			vault.getAbstractFileByPath = vi.fn().mockImplementation((path: string) => {
				if (path === "notes/b.md") return targetFile;
				return null;
			});

			edgeSync.setSnapshot([]);

			await edgeSync.onCanvasModified(canvasFile);

			expect(vault.modify).toHaveBeenCalled();
		});
	});

	describe("initializeFromCanvas", () => {
		it("sets snapshot from canvas data", async () => {
			const canvasFile = new TFile("test.canvas");
			const canvasData: CanvasData = {
				nodes: [],
				edges: [makeEdge("e1", "n1", "n2"), makeEdge("e2", "n3", "n4")],
			};

			vault.read = vi.fn().mockResolvedValue(JSON.stringify(canvasData));

			await edgeSync.initializeFromCanvas(canvasFile);

			const added = edgeSync.diffEdges(canvasData.edges);
			expect(added).toHaveLength(0);
		});
	});

	describe("reset", () => {
		it("clears the snapshot", () => {
			edgeSync.setSnapshot([makeEdge("e1", "n1", "n2")]);
			edgeSync.reset();

			const added = edgeSync.diffEdges([makeEdge("e1", "n1", "n2")]);
			expect(added).toHaveLength(1);
		});
	});
});
