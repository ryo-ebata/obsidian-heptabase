import { ContentExtractor } from "@/services/content-extractor";
import type { App, TFile } from "obsidian";

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

	async appendToConnectionsSection(
		file: TFile,
		linkTarget: string,
		sectionName: string,
	): Promise<void> {
		const content = await this.app.vault.read(file);
		const link = `[[${linkTarget}]]`;

		if (content.includes(link)) {
			return;
		}

		const sectionHeading = `## ${sectionName}`;
		const sectionIndex = content.indexOf(sectionHeading);

		if (sectionIndex === -1) {
			const newContent = `${content.trimEnd()}\n\n${sectionHeading}\n\n- ${link}`;
			await this.app.vault.modify(file, newContent);
			return;
		}

		const lines = content.split("\n");
		const sectionLine = content.substring(0, sectionIndex).split("\n").length - 1;

		let insertLine = sectionLine + 1;
		for (let i = sectionLine + 1; i < lines.length; i++) {
			const line = lines[i];
			if (line.startsWith("## ") || line.startsWith("# ")) {
				break;
			}
			insertLine = i + 1;
		}

		const trimmedInsertLine = this.findLastNonEmptyLine(lines, sectionLine + 1, insertLine);
		const before = lines.slice(0, trimmedInsertLine);
		const after = lines.slice(trimmedInsertLine);

		const newContent = [...before, `- ${link}`, ...after].join("\n").trimEnd();
		await this.app.vault.modify(file, newContent);
	}

	private findLastNonEmptyLine(lines: string[], start: number, end: number): number {
		let last = end;
		for (let i = end - 1; i >= start; i--) {
			if (lines[i].trim() === "") {
				last = i;
			} else {
				break;
			}
		}
		return last;
	}
}
