import type { Canvas, CanvasData, CanvasNode } from "@/types/obsidian-canvas";
import type { HeptabaseSettings } from "@/types/settings";
import { generateId } from "@/utils/id-generator";
import type { App, TFile } from "obsidian";

export class CanvasOperator {
	constructor(
		private app: App,
		private settings: HeptabaseSettings,
	) {}

	addNodeToCanvas(
		canvas: Canvas,
		file: TFile,
		position: { x: number; y: number },
	): CanvasNode | null {
		if (typeof canvas.createFileNode === "function") {
			return canvas.createFileNode({
				file,
				pos: position,
				size: {
					width: this.settings.defaultNodeWidth,
					height: this.settings.defaultNodeHeight,
				},
				save: true,
			});
		}

		const data = canvas.getData();
		const id = generateId();
		const newNode = {
			id,
			type: "file" as const,
			file: file.path,
			x: position.x,
			y: position.y,
			width: this.settings.defaultNodeWidth,
			height: this.settings.defaultNodeHeight,
		};

		data.nodes.push(newNode);
		canvas.setData(data);
		canvas.requestSave();

		return {
			id,
			x: position.x,
			y: position.y,
			width: this.settings.defaultNodeWidth,
			height: this.settings.defaultNodeHeight,
			file,
		};
	}

	async addNodeViaJson(
		canvasFile: TFile,
		file: TFile,
		position: { x: number; y: number },
	): Promise<void> {
		const raw = await this.app.vault.read(canvasFile);
		const data: CanvasData = JSON.parse(raw);

		data.nodes.push({
			id: generateId(),
			type: "file",
			file: file.path,
			x: position.x,
			y: position.y,
			width: this.settings.defaultNodeWidth,
			height: this.settings.defaultNodeHeight,
		});

		await this.app.vault.modify(canvasFile, JSON.stringify(data, null, "\t"));
	}
}
