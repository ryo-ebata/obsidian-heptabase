import type { Canvas, CanvasData, CanvasEdgeData, CanvasNode } from "@/types/obsidian-canvas";
import type { EdgeOptions } from "@/types/plugin";
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
		subpath?: string,
	): CanvasNode | null {
		if (!subpath && typeof canvas.createFileNode === "function") {
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
		const newNode: {
			id: string;
			type: "file";
			file: string;
			x: number;
			y: number;
			width: number;
			height: number;
			subpath?: string;
		} = {
			id,
			type: "file" as const,
			file: file.path,
			x: position.x,
			y: position.y,
			width: this.settings.defaultNodeWidth,
			height: this.settings.defaultNodeHeight,
		};

		if (subpath) {
			newNode.subpath = subpath;
		}

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

	addEdgeToCanvas(canvas: Canvas, options: EdgeOptions): void {
		const data = canvas.getData();
		data.edges.push(this.buildEdgeData(options));
		canvas.setData(data);
		canvas.requestSave();
	}

	async addEdgeViaJson(canvasFile: TFile, options: EdgeOptions): Promise<void> {
		const raw = await this.app.vault.read(canvasFile);
		const data: CanvasData = JSON.parse(raw);
		data.edges.push(this.buildEdgeData(options));
		await this.app.vault.modify(canvasFile, JSON.stringify(data, null, "\t"));
	}

	private buildEdgeData(options: EdgeOptions): CanvasEdgeData {
		return {
			id: generateId(),
			fromNode: options.fromNode,
			fromSide: "right",
			toNode: options.toNode,
			toSide: "left",
			toEnd: "arrow",
			color: options.color,
			label: options.label,
		};
	}

	addGroupToCanvas(canvas: Canvas, nodes: CanvasNode[], label?: string): void {
		if (nodes.length === 0) {
			return;
		}

		const padding = 20;
		const bounds = this.computeBoundingBox(nodes);

		const data = canvas.getData();
		data.nodes.push({
			id: generateId(),
			type: "group",
			label,
			x: bounds.x - padding,
			y: bounds.y - padding,
			width: bounds.width + padding * 2,
			height: bounds.height + padding * 2,
		});

		canvas.setData(data);
		canvas.requestSave();
	}

	private computeBoundingBox(nodes: CanvasNode[]): {
		x: number;
		y: number;
		width: number;
		height: number;
	} {
		let minX = Number.POSITIVE_INFINITY;
		let minY = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;

		for (const node of nodes) {
			minX = Math.min(minX, node.x);
			minY = Math.min(minY, node.y);
			maxX = Math.max(maxX, node.x + node.width);
			maxY = Math.max(maxY, node.y + node.height);
		}

		return {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY,
		};
	}

	async addNodeViaJson(
		canvasFile: TFile,
		file: TFile,
		position: { x: number; y: number },
		subpath?: string,
	): Promise<void> {
		const raw = await this.app.vault.read(canvasFile);
		const data: CanvasData = JSON.parse(raw);

		const newNode: {
			id: string;
			type: "file";
			file: string;
			x: number;
			y: number;
			width: number;
			height: number;
			subpath?: string;
		} = {
			id: generateId(),
			type: "file",
			file: file.path,
			x: position.x,
			y: position.y,
			width: this.settings.defaultNodeWidth,
			height: this.settings.defaultNodeHeight,
		};

		if (subpath) {
			newNode.subpath = subpath;
		}

		data.nodes.push(newNode);
		await this.app.vault.modify(canvasFile, JSON.stringify(data, null, "\t"));
	}
}
