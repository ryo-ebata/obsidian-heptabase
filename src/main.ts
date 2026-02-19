import { CanvasOperator } from "@/services/canvas-operator";
import { ContentExtractor } from "@/services/content-extractor";
import { FileCreator } from "@/services/file-creator";
import { SettingTab } from "@/settings/setting-tab";
import type { CanvasView } from "@/types/obsidian-canvas";
import type { HeadingDragData } from "@/types/plugin";
import { DEFAULT_SETTINGS, type HeptabaseSettings } from "@/types/settings";
import { HeadingExplorerView, VIEW_TYPE_HEADING_EXPLORER } from "@/views/heading-explorer-view";
import { Notice, Plugin, TFile, type WorkspaceLeaf } from "obsidian";

export default class HeptabasePlugin extends Plugin {
	settings: HeptabaseSettings = DEFAULT_SETTINGS;
	private contentExtractor = new ContentExtractor();
	private fileCreator!: FileCreator;
	private canvasOperator!: CanvasOperator;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.fileCreator = new FileCreator(this.app, this.settings);
		this.canvasOperator = new CanvasOperator(this.app, this.settings);

		this.registerView(VIEW_TYPE_HEADING_EXPLORER, (leaf: WorkspaceLeaf) => {
			return new HeadingExplorerView(leaf, this.app, this.settings);
		});

		this.addRibbonIcon("list-tree", "Heading Explorer", () => {
			this.activateView();
		});

		this.addSettingTab(
			new SettingTab(this.app, this.settings, (newSettings) => {
				this.settings = newSettings;
				this.fileCreator = new FileCreator(this.app, this.settings);
				this.canvasOperator = new CanvasOperator(this.app, this.settings);
				this.saveSettings();
			}),
		);

		this.registerDomEvent(document, "drop", (evt: DragEvent) => {
			this.handleCanvasDrop(evt);
		});
	}

	async onunload(): Promise<void> {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_HEADING_EXPLORER);
	}

	private async activateView(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_HEADING_EXPLORER);
		if (existing.length > 0) {
			this.app.workspace.revealLeaf(existing[0]);
			return;
		}

		const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_HEADING_EXPLORER,
				active: true,
			});
			this.app.workspace.revealLeaf(leaf);
		}
	}

	private async handleCanvasDrop(evt: DragEvent): Promise<void> {
		const data = evt.dataTransfer?.getData("application/json");
		if (!data) {
			return;
		}

		let dragData: HeadingDragData;
		try {
			dragData = JSON.parse(data);
		} catch {
			return;
		}

		if (dragData.type !== "heading-explorer-drag") {
			return;
		}

		const canvasLeaves = this.app.workspace.getLeavesOfType("canvas");
		if (canvasLeaves.length === 0) {
			return;
		}

		const canvasView = canvasLeaves[0].view as unknown as CanvasView;
		if (!canvasView?.canvas) {
			return;
		}

		try {
			const sourceFile = this.app.vault.getAbstractFileByPath(dragData.filePath);
			if (!(sourceFile instanceof TFile)) {
				new Notice("Source file not found");
				return;
			}

			const content = await this.app.vault.read(sourceFile);
			const extracted = this.contentExtractor.extractContentWithHeading(
				content,
				dragData.headingLine,
				dragData.headingLevel,
			);

			const newFile = await this.fileCreator.createFile(
				dragData.headingText,
				extracted,
				sourceFile,
			);

			const dropX = evt.clientX ?? 0;
			const dropY = evt.clientY ?? 0;

			this.canvasOperator.addNodeToCanvas(canvasView.canvas, newFile, {
				x: dropX,
				y: dropY,
			});

			new Notice(`Created "${newFile.basename}" on Canvas`);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			new Notice(`Failed to create node: ${message}`);
		}
	}

	private async loadSettings(): Promise<void> {
		const data = await this.loadData();
		this.settings = { ...DEFAULT_SETTINGS, ...(data ?? {}) };
	}

	private async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
