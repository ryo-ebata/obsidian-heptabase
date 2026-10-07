import type { Canvas, CanvasData, CanvasEdgeData, CanvasNode } from "@/types/obsidian-canvas";
import type { EdgeOptions } from "@/types/plugin";
import type { HeptabaseSettings } from "@/types/settings";
import { generateId } from "@/utils/id-generator";
import type { App, TFile } from "obsidian";
import { CanvasHistory } from "@/services/canvas-history";

export type CanvasLayoutAction =
	| "align-left"
	| "align-top"
	| "distribute-horizontal"
	| "distribute-vertical";

export class CanvasOperator {
	constructor(
		private app: App,
		private settings: HeptabaseSettings,
		private history = new CanvasHistory(),
	) {}

	addNodeToCanvas(
		canvas: Canvas,
		file: TFile,
		position: { x: number; y: number },
		subpath?: string,
	): CanvasNode | null {
		if (!subpath && typeof canvas.createFileNode === "function") {
			const before = canvas.getData();
			const node = canvas.createFileNode({
				file,
				pos: position,
				size: {
					width: this.settings.defaultNodeWidth,
					height: this.settings.defaultNodeHeight,
				},
				save: true,
			});
			this.history.record(canvas, before, canvas.getData());
			return node;
		}

		const data = canvas.getData();
		if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
			return null;
		}
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

		const before = cloneCanvasData(data);
		data.nodes.push(newNode);
		canvas.setData(data);
		canvas.requestSave();
		this.history.record(canvas, before, data);

		return {
			id,
			x: position.x,
			y: position.y,
			width: this.settings.defaultNodeWidth,
			height: this.settings.defaultNodeHeight,
			file,
		};
	}

	addEdgeToCanvas(canvas: Canvas, options: EdgeOptions): boolean {
		if (options.fromNode === options.toNode) return false;
		const data = canvas.getData();
		if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
			return false;
		}
		if (
			!data.nodes.some((node) => node.id === options.fromNode) ||
			!data.nodes.some((node) => node.id === options.toNode)
		) {
			return false;
		}
		if (
			data.edges.some(
				(edge) => edge.fromNode === options.fromNode && edge.toNode === options.toNode,
			)
		) {
			return false;
		}
		const before = cloneCanvasData(data);
		data.edges.push(this.buildEdgeData(options));
		canvas.setData(data);
		canvas.requestSave();
		this.history.record(canvas, before, data);
		return true;
	}

	async addEdgeViaJson(canvasFile: TFile, options: EdgeOptions): Promise<void> {
		if (options.fromNode === options.toNode) return;
		const raw = await this.app.vault.read(canvasFile);
		let data: CanvasData;
		try {
			data = JSON.parse(raw);
		} catch {
			return;
		}
		if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
			return;
		}
		if (
			!data.nodes.some((node) => node.id === options.fromNode) ||
			!data.nodes.some((node) => node.id === options.toNode)
		) {
			return;
		}
		if (
			data.edges.some(
				(edge) => edge.fromNode === options.fromNode && edge.toNode === options.toNode,
			)
		) {
			return;
		}
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

	addGroupToCanvas(canvas: Canvas, nodes: CanvasNode[], label?: string): boolean {
		if (nodes.length === 0) {
			return false;
		}

		const padding = 20;
		const bounds = this.computeBoundingBox(nodes);

		const data = canvas.getData();
		if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
			return false;
		}
		const before = cloneCanvasData(data);
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
		this.history.record(canvas, before, data);
		return true;
	}

	arrangeNodes(canvas: Canvas, nodeIds: string[], action: CanvasLayoutAction): boolean {
		const minimumNodes = action.startsWith("align") ? 2 : 3;
		const selectedIds = new Set(nodeIds);
		const data = canvas.getData();
		if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
			return false;
		}

		const nodes = data.nodes.filter((node) => selectedIds.has(node.id));
		if (nodes.length < minimumNodes) {
			return false;
		}

		const before = cloneCanvasData(data);
		switch (action) {
			case "align-left": {
				const left = Math.min(...nodes.map((node) => node.x));
				for (const node of nodes) node.x = left;
				break;
			}
			case "align-top": {
				const top = Math.min(...nodes.map((node) => node.y));
				for (const node of nodes) node.y = top;
				break;
			}
			case "distribute-horizontal":
				this.distributeNodes(nodes, "x", "width");
				break;
			case "distribute-vertical":
				this.distributeNodes(nodes, "y", "height");
				break;
		}

		if (
			nodes.every((node) => {
				const previous = before.nodes.find((candidate) => candidate.id === node.id);
				return previous?.x === node.x && previous.y === node.y;
			})
		) {
			return false;
		}

		canvas.setData(data);
		canvas.requestSave();
		this.history.record(canvas, before, data);
		return true;
	}

	undo(canvas: Canvas): boolean {
		return this.history.undo(canvas);
	}

	redo(canvas: Canvas): boolean {
		return this.history.redo(canvas);
	}

	getHistoryState(canvas: Canvas): { canUndo: boolean; canRedo: boolean } {
		return this.history.getState(canvas);
	}

	onHistoryChange(canvas: Canvas, listener: () => void): () => void {
		return this.history.subscribe(canvas, listener);
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

	private distributeNodes(
		nodes: CanvasData["nodes"],
		positionKey: "x" | "y",
		sizeKey: "width" | "height",
	): void {
		const sorted = nodes.toSorted(
			(a, b) => a[positionKey] - b[positionKey] || a.id.localeCompare(b.id),
		);
		const first = sorted[0]!;
		const last = sorted.at(-1)!;
		const start = first[positionKey];
		const end = last[positionKey] + last[sizeKey];
		const totalSize = sorted.reduce((sum, node) => sum + node[sizeKey], 0);
		const gap = (end - start - totalSize) / (sorted.length - 1);

		let cursor = start;
		for (const node of sorted) {
			node[positionKey] = cursor;
			cursor += node[sizeKey] + gap;
		}
	}

	async addNodeViaJson(
		canvasFile: TFile,
		file: TFile,
		position: { x: number; y: number },
		subpath?: string,
	): Promise<void> {
		const raw = await this.app.vault.read(canvasFile);
		let data: CanvasData;
		try {
			data = JSON.parse(raw);
		} catch {
			return;
		}
		if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
			return;
		}

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

function cloneCanvasData(data: CanvasData): CanvasData {
	return structuredClone(data);
}
