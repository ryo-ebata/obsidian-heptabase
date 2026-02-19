import type { TFile } from "obsidian";

export interface HeadingDragData {
	type: "heading-explorer-drag";
	filePath: string;
	headingText: string;
	headingLevel: number;
	headingLine: number;
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
