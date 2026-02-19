import type { TFile } from "obsidian";

export interface HeadingDragData {
	type: "heading-explorer-drag";
	filePath: string;
	headingText: string;
	headingLevel: number;
	headingLine: number;
}

export interface NoteDragData {
	type: "note-drag";
	filePath: string;
}

export interface MultiHeadingDragData {
	type: "multi-heading-drag";
	items: HeadingDragData[];
}

export interface TextSelectionDragData {
	type: "text-selection-drag";
	filePath: string;
	selectedText: string;
	title: string;
}

export type DragData =
	| HeadingDragData
	| NoteDragData
	| MultiHeadingDragData
	| TextSelectionDragData;

export type SidebarTab = "card-library" | "article-viewer" | "canvas-info";

export interface EdgeOptions {
	fromNode: string;
	toNode: string;
	color?: string;
	label?: string;
}

export interface ParsedHeading {
	heading: string;
	level: number;
	position: {
		start: { line: number; col: number; offset: number };
		end: { line: number; col: number; offset: number };
	};
}

export interface SearchResult {
	file: TFile;
	headings: ParsedHeading[];
}

export interface ExtractedSection {
	headingText: string;
	headingLevel: number;
	headingLine: number;
	content: string;
	children: ExtractedSection[];
}
