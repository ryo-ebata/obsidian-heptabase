import type { SearchResult } from "@/types/plugin";
import type { App, TFile } from "obsidian";

const FRONTMATTER_PATTERN = /^---\n[\s\S]*?\n---\n?/;

export class HeadingParser {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async search(query: string): Promise<SearchResult[]> {
		const files = this.app.vault.getMarkdownFiles();

		if (query === "") {
			const results: SearchResult[] = [];
			for (const file of files) {
				const excerpt = await this.getExcerpt(file);
				results.push({ file, excerpt });
			}
			return results;
		}

		const lowerQuery = query.toLowerCase();

		const matched = await Promise.all(
			files.map(async (file: TFile): Promise<SearchResult | null> => {
				if (file.basename.toLowerCase().includes(lowerQuery)) {
					const excerpt = await this.getExcerpt(file);
					return { file, excerpt };
				}

				const content = await this.app.vault.read(file);
				if (content.toLowerCase().includes(lowerQuery)) {
					const excerpt = this.extractExcerpt(content);
					return { file, excerpt };
				}

				return null;
			}),
		);

		return matched.filter((r): r is SearchResult => r !== null);
	}

	private async getExcerpt(file: TFile): Promise<string> {
		const content = await this.app.vault.cachedRead(file);
		return this.extractExcerpt(content);
	}

	private extractExcerpt(content: string): string {
		const stripped = content.replace(FRONTMATTER_PATTERN, "");
		const lines = stripped.split("\n").filter((line) => line.trim() !== "");
		return lines.slice(0, 3).join("\n");
	}
}
