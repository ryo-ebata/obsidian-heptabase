import type { HeptabaseSettings } from "@/types/settings";
import { sanitizeFilename } from "@/utils/sanitize-filename";
import type { App, TFile } from "obsidian";

export class FileCreator {
	private app: App;
	private settings: HeptabaseSettings;

	constructor(app: App, settings: HeptabaseSettings) {
		this.app = app;
		this.settings = settings;
	}

	async createFile(headingText: string, content: string, sourceFile: TFile): Promise<TFile> {
		const baseName = sanitizeFilename(this.settings.fileNamePrefix + headingText);
		const folder = this.resolveFolder(sourceFile);
		await this.ensureFolder(folder);
		const filePath = this.resolveUniqueFilePath(folder, baseName);
		return this.app.vault.create(filePath, content);
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
