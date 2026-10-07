import type { CanvasData } from "@/types/obsidian-canvas";
import { TFile, type App } from "obsidian";

export interface KnowledgeReference {
	path: string;
	label: string;
}

export interface CanvasLocation extends KnowledgeReference {
	nodeId: string;
}

export interface KnowledgeContext {
	backlinks: KnowledgeReference[];
	canvases: CanvasLocation[];
}

export class KnowledgeContextService {
	constructor(private readonly app: App) {}

	async getForFile(file: TFile): Promise<KnowledgeContext> {
		const [backlinks, canvases] = await Promise.all([
			Promise.resolve(this.getBacklinks(file)),
			this.getCanvasLocations(file),
		]);
		return { backlinks, canvases };
	}

	private getBacklinks(file: TFile): KnowledgeReference[] {
		const resolvedLinks = this.app.metadataCache.resolvedLinks ?? {};
		const backlinks: KnowledgeReference[] = [];

		for (const [sourcePath, destinations] of Object.entries(resolvedLinks)) {
			if (!destinations[file.path]) continue;
			const source = this.app.vault.getAbstractFileByPath(sourcePath);
			if (source instanceof TFile) {
				backlinks.push({ path: source.path, label: source.basename });
			}
		}

		return backlinks.toSorted((a, b) => a.label.localeCompare(b.label));
	}

	private async getCanvasLocations(file: TFile): Promise<CanvasLocation[]> {
		const canvasFiles = this.app.vault
			.getFiles()
			.filter((candidate) => candidate.extension === "canvas");
		const locations = await Promise.all(
			canvasFiles.map(async (canvasFile): Promise<CanvasLocation[]> => {
				try {
					const raw = await this.app.vault.cachedRead(canvasFile);
					const data = JSON.parse(raw) as CanvasData;
					if (!Array.isArray(data.nodes)) return [];
					return data.nodes
						.filter((node) => node.type === "file" && node.file === file.path)
						.map((node) => ({
							path: canvasFile.path,
							label: canvasFile.basename,
							nodeId: node.id,
						}));
				} catch {
					return [];
				}
			}),
		);

		return locations.flat().toSorted((a, b) => a.label.localeCompare(b.label));
	}
}
