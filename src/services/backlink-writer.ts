import { ContentExtractor } from "@/services/content-extractor";
import type { App, TFile } from "obsidian";

const FRONTMATTER_KEY = {
	"->": "connections-to",
	"<-": "connections-from",
} as const;

export class BacklinkWriter {
	private app: App;
	private extractor: ContentExtractor;

	constructor(app: App) {
		this.app = app;
		this.extractor = new ContentExtractor();
	}

	async replaceSection(
		sourceFile: TFile,
		headingLine: number,
		headingLevel: number,
		newFileName: string,
	): Promise<void> {
		const content = await this.app.vault.read(sourceFile);
		const range = this.extractor.getSectionRange(content, headingLine, headingLevel);

		if (!range) {
			return;
		}

		const lines = content.split("\n");
		const headingPart = lines.slice(0, headingLine + 1);
		const afterPart = lines.slice(range.contentEnd);
		const link = `[[${newFileName}]]`;

		const newContent = [...headingPart, "", link, "", ...afterPart]
			.join("\n")
			.replace(/\n{3,}/g, "\n\n")
			.trimEnd();

		await this.app.vault.modify(sourceFile, newContent);
	}

	async appendLink(
		sourceFile: TFile,
		headingLine: number,
		headingLevel: number,
		newFileName: string,
	): Promise<void> {
		const content = await this.app.vault.read(sourceFile);
		const range = this.extractor.getSectionRange(content, headingLine, headingLevel);

		if (!range) {
			return;
		}

		const lines = content.split("\n");
		const link = `> See also: [[${newFileName}]]`;

		const beforePart = lines.slice(0, range.contentEnd);
		const afterPart = lines.slice(range.contentEnd);

		const newContent = [...beforePart, "", link, "", ...afterPart]
			.join("\n")
			.replace(/\n{3,}/g, "\n\n")
			.trimEnd();

		await this.app.vault.modify(sourceFile, newContent);
	}

	async addConnection(file: TFile, target: string, direction: "->" | "<-"): Promise<void> {
		const key = FRONTMATTER_KEY[direction];
		const link = `[[${target}]]`;

		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const connections: string[] = Array.isArray(frontmatter[key]) ? frontmatter[key] : [];

			if (connections.includes(link)) {
				return;
			}

			connections.push(link);
			frontmatter[key] = connections;
		});
	}

	async removeConnection(file: TFile, target: string, direction: "->" | "<-"): Promise<void> {
		const key = FRONTMATTER_KEY[direction];
		const link = `[[${target}]]`;

		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!Array.isArray(frontmatter[key])) {
				return;
			}

			const connections: string[] = frontmatter[key];
			const filtered = connections.filter((c) => c !== link);

			if (filtered.length === 0) {
				delete frontmatter[key];
			} else if (filtered.length < connections.length) {
				frontmatter[key] = filtered;
			}
		});
	}
}
