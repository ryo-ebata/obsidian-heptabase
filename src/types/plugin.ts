import type { TFile } from "obsidian";

export interface NoteDragData {
	type: "note-drag";
	filePath: string;
}

export interface TextSelectionDragData {
	type: "text-selection-drag";
	filePath: string;
	selectedText: string;
	title: string;
}

export type DragData = NoteDragData | TextSelectionDragData;

export type SidebarTab = "card-library" | "article-viewer";

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
	excerpt: string;
}

export interface ExtractedSection {
	headingText: string;
	headingLevel: number;
	headingLine: number;
	content: string;
	children: ExtractedSection[];
}
