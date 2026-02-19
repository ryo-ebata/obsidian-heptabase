import type { ParsedHeading, SearchResult } from "@/types/plugin";
import type { App, CachedMetadata, TFile } from "obsidian";

export class HeadingParser {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	searchNotes(query: string): TFile[] {
		const files = this.app.vault.getMarkdownFiles();
		if (query === "") {
			return files;
		}
		const lowerQuery = query.toLowerCase();
		return files.filter((file: TFile) => file.basename.toLowerCase().includes(lowerQuery));
	}

	getHeadings(file: TFile): ParsedHeading[] {
		const cache: CachedMetadata | null = this.app.metadataCache.getFileCache(file);
		if (!cache?.headings) {
			return [];
		}
		return cache.headings.map((h) => ({
			heading: h.heading,
			level: h.level,
			position: h.position,
		}));
	}

	searchNotesWithHeadings(query: string): SearchResult[] {
		return this.searchNotes(query).reduce<SearchResult[]>((results, file) => {
			const headings = this.getHeadings(file);
			if (headings.length > 0) {
				results.push({ file, headings });
			}
			return results;
		}, []);
	}
}
