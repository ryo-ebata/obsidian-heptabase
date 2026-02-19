import { BacklinkWriter } from "@/services/backlink-writer";
import type { CanvasData, CanvasEdgeData, CanvasNodeData } from "@/types/obsidian-canvas";
import { TFile, type App } from "obsidian";

export class EdgeSync {
	private app: App;
	private backlinkWriter: BacklinkWriter;
	private edgeSnapshot: Map<string, CanvasEdgeData> = new Map();
	private nodeSnapshot: Map<string, CanvasNodeData> = new Map();

	constructor(app: App) {
		this.app = app;
		this.backlinkWriter = new BacklinkWriter(app);
	}

	async onCanvasModified(file: TFile): Promise<void> {
		if (!file.path.endsWith(".canvas")) {
			return;
		}

		const raw = await this.app.vault.read(file);
		let canvasData: CanvasData;
		try {
			canvasData = JSON.parse(raw);
		} catch {
			return;
		}

		const removedEdges = this.diffRemovedEdges(canvasData.edges);
		for (const edge of removedEdges) {
			await this.processRemovedEdge(edge, canvasData.edges);
		}

		const newEdges = this.diffEdges(canvasData.edges);
		for (const edge of newEdges) {
			await this.processNewEdge(edge, canvasData);
		}

		this.setSnapshot(canvasData.edges, new Map(canvasData.nodes.map((n) => [n.id, n])));
	}

	diffEdges(currentEdges: CanvasEdgeData[]): CanvasEdgeData[] {
		return currentEdges.filter((edge) => !this.edgeSnapshot.has(edge.id));
	}

	diffRemovedEdges(currentEdges: CanvasEdgeData[]): CanvasEdgeData[] {
		const currentIds = new Set(currentEdges.map((e) => e.id));
		const removed: CanvasEdgeData[] = [];
		for (const [id, edge] of this.edgeSnapshot) {
			if (!currentIds.has(id)) {
				removed.push(edge);
			}
		}
		return removed;
	}

	async processNewEdge(edge: CanvasEdgeData, canvasData: CanvasData): Promise<void> {
		const fromNode = canvasData.nodes.find((n) => n.id === edge.fromNode);
		const toNode = canvasData.nodes.find((n) => n.id === edge.toNode);

		if (!fromNode?.file || !toNode?.file) {
			return;
		}

		const targetFile = this.app.vault.getAbstractFileByPath(toNode.file);
		if (!(targetFile instanceof TFile)) {
			return;
		}

		const sourceFile = this.app.vault.getAbstractFileByPath(fromNode.file);
		if (!(sourceFile instanceof TFile)) {
			return;
		}

		const fromBasename = sourceFile.basename;
		const toBasename = targetFile.basename;

		await this.backlinkWriter.addConnection(targetFile, fromBasename, "<-");
		await this.backlinkWriter.addConnection(sourceFile, toBasename, "->");
	}

	async processRemovedEdge(
		edge: CanvasEdgeData,
		currentEdges: CanvasEdgeData[],
	): Promise<void> {
		const fromNode = this.nodeSnapshot.get(edge.fromNode);
		const toNode = this.nodeSnapshot.get(edge.toNode);

		if (!fromNode?.file || !toNode?.file) {
			return;
		}

		const hasRemainingEdge = currentEdges.some(
			(e) =>
				(e.fromNode === edge.fromNode && e.toNode === edge.toNode) ||
				(e.fromNode === edge.toNode && e.toNode === edge.fromNode),
		);

		if (hasRemainingEdge) {
			return;
		}

		const sourceFile = this.app.vault.getAbstractFileByPath(fromNode.file);
		const targetFile = this.app.vault.getAbstractFileByPath(toNode.file);

		if (sourceFile instanceof TFile) {
			const toBasename = targetFile instanceof TFile ? targetFile.basename : toNode.file.replace(/\.md$/, "");
			await this.backlinkWriter.removeConnection(sourceFile, toBasename, "->");
		}

		if (targetFile instanceof TFile) {
			const fromBasename = sourceFile instanceof TFile ? sourceFile.basename : fromNode.file.replace(/\.md$/, "");
			await this.backlinkWriter.removeConnection(targetFile, fromBasename, "<-");
		}
	}

	async initializeFromCanvas(canvasFile: TFile): Promise<void> {
		const raw = await this.app.vault.read(canvasFile);
		let canvasData: CanvasData;
		try {
			canvasData = JSON.parse(raw);
		} catch {
			return;
		}

		this.setSnapshot(canvasData.edges, new Map(canvasData.nodes.map((n) => [n.id, n])));
	}

	setSnapshot(edges: CanvasEdgeData[], nodeMap: Map<string, CanvasNodeData>): void {
		this.edgeSnapshot = new Map(edges.map((e) => [e.id, e]));
		this.nodeSnapshot = nodeMap;
	}

	reset(): void {
		this.edgeSnapshot = new Map();
		this.nodeSnapshot = new Map();
	}
}
