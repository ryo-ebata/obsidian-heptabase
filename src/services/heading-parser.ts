import type { ParsedHeading, SearchResult } from "@/types/plugin";
import type { App, CachedMetadata, TFile } from "obsidian";

export class HeadingParser {
	private app: App;

	constructor(app: App) {
		this.app = app;
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

	async search(query: string): Promise<SearchResult[]> {
		const files = this.app.vault.getMarkdownFiles();

		if (query === "") {
			return files.map((file: TFile) => ({
				file,
				headings: this.getHeadings(file),
			}));
		}

		const lowerQuery = query.toLowerCase();

		const matched = await Promise.all(
			files.map(async (file: TFile): Promise<SearchResult | null> => {
				const headings = this.getHeadings(file);

				if (file.basename.toLowerCase().includes(lowerQuery)) {
					return { file, headings };
				}

				if (headings.some((h) => h.heading.toLowerCase().includes(lowerQuery))) {
					return { file, headings };
				}

				const content = await this.app.vault.read(file);
				if (content.toLowerCase().includes(lowerQuery)) {
					return { file, headings };
				}

				return null;
			}),
		);

		return matched.filter((r): r is SearchResult => r !== null);
	}
}
