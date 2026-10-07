import { BacklinkWriter } from "@/services/backlink-writer";
import type { CanvasData, CanvasEdgeData, CanvasNodeData } from "@/types/obsidian-canvas";
import { TFile, type App } from "obsidian";

export class EdgeSync {
	private app: App;
	private backlinkWriter: BacklinkWriter;
	private canvasSnapshots = new WeakMap<TFile, CanvasSnapshot>();
	private modificationQueues = new WeakMap<TFile, Promise<void>>();
	private edgeSnapshot: Map<string, CanvasEdgeData> = new Map();
	private nodeSnapshot: Map<string, CanvasNodeData> = new Map();

	constructor(app: App) {
		this.app = app;
		this.backlinkWriter = new BacklinkWriter(app);
	}

	async onCanvasModified(file: TFile): Promise<void> {
		const previous = this.modificationQueues.get(file) ?? Promise.resolve();
		const current = previous.catch(() => undefined).then(() => this.processCanvasModified(file));
		this.modificationQueues.set(file, current);
		try {
			await current;
		} finally {
			if (this.modificationQueues.get(file) === current) {
				this.modificationQueues.delete(file);
			}
		}
	}

	private async processCanvasModified(file: TFile): Promise<void> {
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

		// A partially written or manually edited Canvas file must not crash the
		// metadata sync listener.
		if (!Array.isArray(canvasData?.edges) || !Array.isArray(canvasData?.nodes)) {
			return;
		}

		const snapshot = this.canvasSnapshots.get(file) ?? EMPTY_SNAPSHOT;
		const removedEdges = this.diffRemovedEdges(canvasData.edges, snapshot);
		for (const edge of removedEdges) {
			await this.processRemovedEdge(edge, canvasData.edges, snapshot);
		}

		const newEdges = this.diffEdges(canvasData.edges, snapshot);
		for (const edge of newEdges) {
			await this.processNewEdge(edge, canvasData);
		}

		this.canvasSnapshots.set(file, {
			edges: new Map(canvasData.edges.map((edge) => [edge.id, edge])),
			nodes: new Map(canvasData.nodes.map((node) => [node.id, node])),
		});
	}

	diffEdges(currentEdges: CanvasEdgeData[], snapshot?: CanvasSnapshot): CanvasEdgeData[] {
		const edges = snapshot?.edges ?? this.edgeSnapshot;
		return currentEdges.filter((edge) => !edges.has(edge.id));
	}

	diffRemovedEdges(currentEdges: CanvasEdgeData[], snapshot?: CanvasSnapshot): CanvasEdgeData[] {
		const edges = snapshot?.edges ?? this.edgeSnapshot;
		const currentIds = new Set(currentEdges.map((e) => e.id));
		const removed: CanvasEdgeData[] = [];
		for (const [id, edge] of edges) {
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
		snapshot?: CanvasSnapshot,
	): Promise<void> {
		const nodes = snapshot?.nodes ?? this.nodeSnapshot;
		const fromNode = nodes.get(edge.fromNode);
		const toNode = nodes.get(edge.toNode);

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
			const toBasename =
				targetFile instanceof TFile ? targetFile.basename : toNode.file.replace(/\.md$/, "");
			await this.backlinkWriter.removeConnection(sourceFile, toBasename, "->");
		}

		if (targetFile instanceof TFile) {
			const fromBasename =
				sourceFile instanceof TFile ? sourceFile.basename : fromNode.file.replace(/\.md$/, "");
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

		if (!Array.isArray(canvasData?.edges) || !Array.isArray(canvasData?.nodes)) {
			return;
		}

		this.setSnapshot(canvasData.edges, new Map(canvasData.nodes.map((n) => [n.id, n])));
		this.canvasSnapshots.set(canvasFile, {
			edges: new Map(canvasData.edges.map((edge) => [edge.id, edge])),
			nodes: new Map(canvasData.nodes.map((node) => [node.id, node])),
		});
	}

	setSnapshot(edges: CanvasEdgeData[], nodeMap: Map<string, CanvasNodeData>): void {
		this.edgeSnapshot = new Map(edges.map((e) => [e.id, e]));
		this.nodeSnapshot = nodeMap;
	}

	reset(): void {
		this.canvasSnapshots = new WeakMap();
		this.modificationQueues = new WeakMap();
		this.edgeSnapshot = new Map();
		this.nodeSnapshot = new Map();
	}
}

interface CanvasSnapshot {
	edges: Map<string, CanvasEdgeData>;
	nodes: Map<string, CanvasNodeData>;
}

const EMPTY_SNAPSHOT: CanvasSnapshot = { edges: new Map(), nodes: new Map() };
