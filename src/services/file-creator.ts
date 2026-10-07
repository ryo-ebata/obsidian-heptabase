import type { HeptabaseSettings } from "@/types/settings";
import { sanitizeFilename } from "@/utils/sanitize-filename";
import type { App, TFile } from "obsidian";

export interface ExtractionProvenance {
	sourceHeading?: string;
	canvasPath?: string;
}

export class FileCreator {
	private app: App;
	private settings: HeptabaseSettings;

	constructor(app: App, settings: HeptabaseSettings) {
		this.app = app;
		this.settings = settings;
	}

	async createFile(
		headingText: string,
		content: string,
		sourceFile: TFile,
		provenance: ExtractionProvenance = {},
	): Promise<TFile> {
		const baseName = sanitizeFilename(this.settings.fileNamePrefix + headingText);
		const folder = this.resolveFolder(sourceFile);
		await this.ensureFolder(folder);
		const filePath = this.resolveUniqueFilePath(folder, baseName);
		const fileContent =
			provenance.sourceHeading || provenance.canvasPath
				? this.withProvenance(content, sourceFile, provenance)
				: content;
		return this.app.vault.create(filePath, fileContent);
	}

	async removeFile(file: TFile): Promise<void> {
		await this.app.vault.delete(file);
	}

	private withProvenance(
		content: string,
		sourceFile: TFile,
		provenance: ExtractionProvenance,
	): string {
		const metadata = [
			"---",
			`heptabase-source: ${JSON.stringify(sourceFile.path)}`,
			...(provenance.sourceHeading
				? [`heptabase-source-heading: ${JSON.stringify(provenance.sourceHeading)}`]
				: []),
			...(provenance.canvasPath
				? [`heptabase-canvas: ${JSON.stringify(provenance.canvasPath)}`]
				: []),
			`heptabase-extracted-at: ${JSON.stringify(new Date().toISOString())}`,
			"---",
			"",
		].join("\n");

		return `${metadata}${content}`;
	}

	resolveUniqueFilePath(folder: string, baseName: string): string {
		let filePath = this.buildPath(folder, `${baseName}.md`);
		let suffix = 0;

		while (this.app.vault.getAbstractFileByPath(filePath) !== null) {
			suffix++;
			filePath = this.buildPath(folder, `${baseName}_${suffix}.md`);
		}

		return filePath;
	}

	private resolveFolder(sourceFile: TFile): string {
		if (this.settings.extractedFilesFolder) {
			return this.settings.extractedFilesFolder;
		}
		return sourceFile.parent?.path ?? "";
	}

	private async ensureFolder(folder: string): Promise<void> {
		if (!folder) {
			return;
		}
		const exists = await this.app.vault.adapter.exists(folder);
		if (!exists) {
			await this.app.vault.createFolder(folder);
		}
	}

	private buildPath(folder: string, fileName: string): string {
		return folder ? `${folder}/${fileName}` : fileName;
	}
}
