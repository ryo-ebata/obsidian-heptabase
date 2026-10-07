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
	private readonly canvasCache = new Map<
		string,
		{ mtime: number; placements: { filePath: string; nodeId: string }[] }
	>();
	private readonly pendingCanvasReads = new Map<
		string,
		{ mtime: number; promise: Promise<{ filePath: string; nodeId: string }[]> }
	>();

	constructor(private readonly app: App) {}

	async getForFile(file: TFile): Promise<KnowledgeContext> {
		const backlinks = this.getBacklinks(file);
		const canvases = await this.getCanvasLocations(file);
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
		const livePaths = new Set(canvasFiles.map((canvasFile) => canvasFile.path));
		for (const cachedPath of this.canvasCache.keys()) {
			if (!livePaths.has(cachedPath)) this.canvasCache.delete(cachedPath);
		}
		const locations = await Promise.all(
			canvasFiles.map(async (canvasFile): Promise<CanvasLocation[]> => {
				const requestedMtime = canvasFile.stat.mtime;
				try {
					let cached = this.canvasCache.get(canvasFile.path);
					if (!cached || cached.mtime !== requestedMtime) {
						const placements = await this.readCanvasPlacements(canvasFile, requestedMtime);
						cached = {
							mtime: requestedMtime,
							placements,
						};
						if (canvasFile.stat.mtime === requestedMtime) {
							this.canvasCache.set(canvasFile.path, cached);
						}
					}
					return cached.placements
						.filter((placement) => placement.filePath === file.path)
						.map((placement) => ({
							path: canvasFile.path,
							label: canvasFile.basename,
							nodeId: placement.nodeId,
						}));
				} catch {
					if (this.canvasCache.get(canvasFile.path)?.mtime === requestedMtime) {
						this.canvasCache.delete(canvasFile.path);
					}
					return [];
				}
			}),
		);

		return locations.flat().toSorted((a, b) => a.label.localeCompare(b.label));
	}

	private async readCanvasPlacements(
		canvasFile: TFile,
		mtime: number,
	): Promise<{ filePath: string; nodeId: string }[]> {
		const pending = this.pendingCanvasReads.get(canvasFile.path);
		if (pending?.mtime === mtime) return pending.promise;

		const promise = this.app.vault.cachedRead(canvasFile).then((raw) => {
			const data = JSON.parse(raw) as CanvasData;
			if (!Array.isArray(data.nodes)) return [];
			return data.nodes
				.filter((node) => node.type === "file" && node.file)
				.map((node) => ({ filePath: node.file!, nodeId: node.id }));
		});
		const request = { mtime, promise };
		this.pendingCanvasReads.set(canvasFile.path, request);
		try {
			return await promise;
		} finally {
			if (this.pendingCanvasReads.get(canvasFile.path) === request) {
				this.pendingCanvasReads.delete(canvasFile.path);
			}
		}
	}
}
