import { CanvasOperator } from "@/services/canvas-operator";
import { FileCreator } from "@/services/file-creator";
import type { Canvas } from "@/types/obsidian-canvas";
import type { TFile } from "obsidian";

export class QuickCardCreator {
	constructor(
		private fileCreator: FileCreator,
		private canvasOperator: CanvasOperator,
	) {}

	async createCardAtPosition(
		canvas: Canvas,
		canvasFile: TFile,
		position: { x: number; y: number },
		defaultTitle: string,
	): Promise<TFile> {
		const file = await this.fileCreator.createFile(defaultTitle, `# ${defaultTitle}`, canvasFile);
		this.canvasOperator.addNodeToCanvas(canvas, file, position);
		return file;
	}
}
