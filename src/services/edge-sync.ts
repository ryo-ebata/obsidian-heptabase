import { BacklinkWriter } from "@/services/backlink-writer";
import type { CanvasData, CanvasEdgeData } from "@/types/obsidian-canvas";
import { TFile, type App } from "obsidian";

export class EdgeSync {
	private app: App;
	private sectionName: string;
	private backlinkWriter: BacklinkWriter;
	private edgeSnapshot: Map<string, CanvasEdgeData> = new Map();

	constructor(app: App, sectionName: string) {
		this.app = app;
		this.sectionName = sectionName;
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

		const newEdges = this.diffEdges(canvasData.edges);
		for (const edge of newEdges) {
			await this.processNewEdge(edge, canvasData);
		}

		this.setSnapshot(canvasData.edges);
	}

	diffEdges(currentEdges: CanvasEdgeData[]): CanvasEdgeData[] {
		return currentEdges.filter((edge) => !this.edgeSnapshot.has(edge.id));
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

		const fromFile = this.app.vault.getAbstractFileByPath(fromNode.file);
		const fromBasename =
			fromFile instanceof TFile ? fromFile.basename : fromNode.file.replace(/\.md$/, "");

		await this.backlinkWriter.appendToConnectionsSection(
			targetFile,
			fromBasename,
			this.sectionName,
		);
	}

	async initializeFromCanvas(canvasFile: TFile): Promise<void> {
		const raw = await this.app.vault.read(canvasFile);
		let canvasData: CanvasData;
		try {
			canvasData = JSON.parse(raw);
		} catch {
			return;
		}

		this.setSnapshot(canvasData.edges);
	}

	setSnapshot(edges: CanvasEdgeData[]): void {
		this.edgeSnapshot = new Map(edges.map((e) => [e.id, e]));
	}

	reset(): void {
		this.edgeSnapshot = new Map();
	}
}
