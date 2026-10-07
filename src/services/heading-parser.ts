import type { ParsedHeading, SearchResult } from "@/types/plugin";
import type { App, TFile } from "obsidian";

const FRONTMATTER_PATTERN = /^---\n[\s\S]*?\n---\n?/;
const SEARCH_CONCURRENCY = 8;

export class HeadingParser {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async search(query: string): Promise<SearchResult[]> {
		const files = this.app.vault.getMarkdownFiles();
		const normalizedQuery = query.trim();

		if (normalizedQuery === "") {
			const results = await mapWithConcurrency(
				files,
				SEARCH_CONCURRENCY,
				async (file): Promise<SearchResult | null> => {
					try {
						const excerpt = await this.getExcerpt(file);
						return this.buildResult(file, excerpt);
					} catch {
						// A single unreadable note must not break the entire library.
						return null;
					}
				},
			);
			return results.filter((result): result is SearchResult => result !== null);
		}

		const lowerQuery = normalizedQuery.toLowerCase();

		const matched = await mapWithConcurrency(
			files,
			SEARCH_CONCURRENCY,
			async (file: TFile): Promise<SearchResult | null> => {
				try {
					if (file.basename.toLowerCase().includes(lowerQuery)) {
						const excerpt = await this.getExcerpt(file, normalizedQuery);
						return this.buildResult(file, excerpt);
					}

					const content = await this.app.vault.read(file);
					const searchableContent = prepareExcerptContent(content);
					if (searchableContent.toLowerCase().includes(lowerQuery)) {
						const excerpt = this.extractExcerpt(content, normalizedQuery);
						return this.buildResult(file, excerpt);
					}
				} catch {
					return null;
				}

				return null;
			},
		);

		return matched.filter((r): r is SearchResult => r !== null);
	}

	private getHeadings(file: TFile): ParsedHeading[] {
		return (this.app.metadataCache.getFileCache(file)?.headings ?? []).map((heading) => ({
			heading: heading.heading,
			level: heading.level,
			position: heading.position,
		}));
	}

	private buildResult(file: TFile, excerpt: string): SearchResult {
		return {
			file,
			excerpt,
			headings: this.getHeadings(file),
			tags: this.getTags(file),
			folder: file.parent?.path || "/",
			modifiedTime: file.stat.mtime,
		};
	}

	private getTags(file: TFile): string[] {
		const cache = this.app.metadataCache.getFileCache(file);
		const inlineTags = (cache?.tags ?? []).map(({ tag }) => tag.replace(/^#/, ""));
		const frontmatterTags = normalizeTags(cache?.frontmatter?.tags);
		return [...new Set([...inlineTags, ...frontmatterTags])].toSorted((a, b) => a.localeCompare(b));
	}

	private async getExcerpt(file: TFile, query?: string): Promise<string> {
		const content = await this.app.vault.cachedRead(file);
		return this.extractExcerpt(content, query);
	}

	private extractExcerpt(content: string, query?: string): string {
		const lines = prepareExcerptContent(content).split("\n");
		const contentIndices = lines
			.map((line, index) => (isExcerptLine(line) && line.trim() ? index : -1))
			.filter((index) => index >= 0);
		if (contentIndices.length === 0) return "";

		let selectedIndices = contentIndices.slice(0, 3);
		if (query) {
			const lowerQuery = query.toLowerCase();
			const matchIndex = lines.findIndex((line) => line.toLowerCase().includes(lowerQuery));
			if (matchIndex >= 0) {
				const contentPosition = contentIndices.indexOf(matchIndex);
				if (contentPosition >= 0) {
					const start = Math.max(0, Math.min(contentPosition - 1, contentIndices.length - 3));
					selectedIndices = contentIndices.slice(start, start + 3);
				} else {
					const before = contentIndices.filter((index) => index < matchIndex).slice(-1);
					const after = contentIndices.filter((index) => index > matchIndex).slice(0, 2);
					selectedIndices = [...before, ...after];
				}
			}
		}

		return formatExcerpt(lines, selectedIndices);
	}
}

function prepareExcerptContent(content: string): string {
	return removeFencedCodeBlocks(content.replace(FRONTMATTER_PATTERN, ""));
}

function formatExcerpt(lines: string[], selectedIndices: number[]): string {
	if (selectedIndices.length === 0) return "";
	const selected = new Set(selectedIndices);
	const output: string[] = [];
	const start = selectedIndices[0]!;
	const end = selectedIndices[selectedIndices.length - 1]!;

	for (let index = start; index <= end; index++) {
		const line = lines[index]!;
		if (selected.has(index)) {
			output.push(line.trimEnd());
		} else if ((!line.trim() || !isExcerptLine(line)) && output.at(-1) !== "") {
			output.push("");
		}
	}

	while (output.at(-1) === "") output.pop();
	return output.join("\n");
}

function removeFencedCodeBlocks(content: string): string {
	const keptLines: string[] = [];
	let closingFence: RegExp | null = null;

	for (const line of content.split("\n")) {
		if (closingFence) {
			if (closingFence.test(line)) closingFence = null;
			continue;
		}

		const opening = line.match(/^\s*(`{3,}|~{3,})/);
		if (opening?.[1]) {
			const marker = opening[1][0]!;
			closingFence = new RegExp(`^\\s*${escapeRegExp(marker)}{${opening[1].length},}\\s*$`);
			continue;
		}

		keptLines.push(line);
	}

	return keptLines.join("\n");
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isExcerptLine(line: string): boolean {
	return !/^#{1,6}\s+/.test(line.trimStart());
}

function normalizeTags(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value
			.filter((tag): tag is string => typeof tag === "string")
			.map(cleanTag)
			.filter(Boolean);
	}
	if (typeof value === "string") {
		return value.split(/[ ,]+/).map(cleanTag).filter(Boolean);
	}
	return [];
}

function cleanTag(tag: string): string {
	return tag.trim().replace(/^#/, "");
}

async function mapWithConcurrency<T, R>(
	items: T[],
	limit: number,
	mapper: (item: T) => Promise<R>,
): Promise<R[]> {
	const results: R[] = Array.from({ length: items.length });
	let nextIndex = 0;
	const worker = async (): Promise<void> => {
		while (nextIndex < items.length) {
			const index = nextIndex++;
			results[index] = await mapper(items[index]!);
		}
	};
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
	return results;
}
