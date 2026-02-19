import type { TFile } from "obsidian";

export interface CanvasNodeData {
	id: string;
	type: "file" | "text" | "link" | "group";
	file?: string;
	text?: string;
	url?: string;
	x: number;
	y: number;
	width: number;
	height: number;
	color?: string;
	subpath?: string;
}

export interface CanvasEdgeData {
	id: string;
	fromNode: string;
	fromSide: "top" | "right" | "bottom" | "left";
	toNode: string;
	toSide: "top" | "right" | "bottom" | "left";
	color?: string;
	label?: string;
}

export interface CanvasData {
	nodes: CanvasNodeData[];
	edges: CanvasEdgeData[];
}

export interface CanvasView {
	canvas: Canvas;
	file: TFile;
}

export interface Canvas {
	getData(): CanvasData;
	setData(data: CanvasData): void;
	requestSave(): void;
	createFileNode(options: {
		file: TFile;
		pos: { x: number; y: number };
		size?: { width: number; height: number };
		save?: boolean;
	}): CanvasNode;
}

export interface CanvasNode {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	file?: TFile;
}
