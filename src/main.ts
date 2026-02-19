import { BacklinkWriter } from "@/services/backlink-writer";
import { CanvasObserver } from "@/services/canvas-observer";
import { CanvasOperator } from "@/services/canvas-operator";
import { ContentExtractor } from "@/services/content-extractor";
import { EdgeSync } from "@/services/edge-sync";
import { FileCreator } from "@/services/file-creator";
import { QuickCardCreator } from "@/services/quick-card-creator";
import { SettingTab } from "@/settings/setting-tab";
import type { CanvasView } from "@/types/obsidian-canvas";
import type { DragData, HeadingDragData, NoteDragData } from "@/types/plugin";
import { DEFAULT_SETTINGS, type HeptabaseSettings } from "@/types/settings";
import { clientToCanvasPos } from "@/utils/canvas-coordinates";
import { HeadingExplorerView, VIEW_TYPE_HEADING_EXPLORER } from "@/views/heading-explorer-view";
import { Notice, Plugin, TFile, type WorkspaceLeaf } from "obsidian";

export default class HeptabasePlugin extends Plugin {
	settings: HeptabaseSettings = DEFAULT_SETTINGS;
	private contentExtractor = new ContentExtractor();
	private fileCreator!: FileCreator;
	private canvasOperator!: CanvasOperator;
	private canvasObserver!: CanvasObserver;
	private backlinkWriter!: BacklinkWriter;
	private quickCardCreator!: QuickCardCreator;
	private edgeSync!: EdgeSync;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.fileCreator = new FileCreator(this.app, this.settings);
		this.canvasOperator = new CanvasOperator(this.app, this.settings);
		this.canvasObserver = new CanvasObserver(this.app);
		this.backlinkWriter = new BacklinkWriter(this.app);
		this.quickCardCreator = new QuickCardCreator(this.fileCreator, this.canvasOperator);
		this.edgeSync = new EdgeSync(this.app, this.settings.connectionsSectionName);

		this.registerView(VIEW_TYPE_HEADING_EXPLORER, (leaf: WorkspaceLeaf) => {
			return new HeadingExplorerView(leaf, this.app, this.settings);
		});

		this.addRibbonIcon("list-tree", "Heading Explorer", () => {
			this.activateView();
		});

		this.addSettingTab(
			new SettingTab(this.app, this, this.settings, (newSettings) => {
				this.settings = newSettings;
				this.fileCreator = new FileCreator(this.app, this.settings);
				this.canvasOperator = new CanvasOperator(this.app, this.settings);
				this.quickCardCreator = new QuickCardCreator(this.fileCreator, this.canvasOperator);
				this.edgeSync = new EdgeSync(this.app, this.settings.connectionsSectionName);
				this.saveSettings();
			}),
		);

		this.registerDomEvent(document, "drop", (evt: DragEvent) => {
			this.handleCanvasDrop(evt);
		});

		this.addCommand({
			id: "connect-selected-nodes",
			name: "Connect selected nodes",
			callback: () => {
				this.connectSelectedNodes();
			},
		});

		this.addCommand({
			id: "group-selected-nodes",
			name: "Group selected nodes",
			callback: () => {
				this.groupSelectedNodes();
			},
		});

		this.addCommand({
			id: "create-new-card",
			name: "Create new card",
			callback: () => {
				this.createNewCardAtOrigin();
			},
		});

		this.registerDomEvent(document, "dblclick", (evt: MouseEvent) => {
			this.handleCanvasDblClick(evt);
		});

		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (this.settings.enableEdgeSync && file instanceof TFile) {
					this.edgeSync.onCanvasModified(file);
				}
			}),
		);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.initializeEdgeSync();
			}),
		);

		this.initializeEdgeSync();
	}

	async onunload(): Promise<void> {
		this.edgeSync.reset();
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_HEADING_EXPLORER);
	}

	private initializeEdgeSync(): void {
		const canvasView = this.getActiveCanvasView();
		if (canvasView) {
			this.edgeSync.initializeFromCanvas(canvasView.file);
		} else {
			this.edgeSync.reset();
		}
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

		let dragData: DragData;
		try {
			dragData = JSON.parse(data);
		} catch {
			return;
		}

		if (dragData.type === "note-drag") {
			await this.handleNoteDrop(evt, dragData);
		} else if (dragData.type === "heading-explorer-drag") {
			await this.handleHeadingDrop(evt, dragData);
		}
	}

	private async handleNoteDrop(evt: DragEvent, dragData: NoteDragData): Promise<void> {
		const canvasView = this.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		try {
			const file = this.app.vault.getAbstractFileByPath(dragData.filePath);
			if (!(file instanceof TFile)) {
				new Notice("Source file not found");
				return;
			}

			const dropX = evt.clientX ?? 0;
			const dropY = evt.clientY ?? 0;

			this.canvasOperator.addNodeToCanvas(canvasView.canvas, file, {
				x: dropX,
				y: dropY,
			});

			new Notice(`Added "${file.basename}" to Canvas`);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			new Notice(`Failed to add note: ${message}`);
		}
	}

	private async handleHeadingDrop(evt: DragEvent, dragData: HeadingDragData): Promise<void> {
		const canvasView = this.getActiveCanvasView();
		if (!canvasView) {
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

			if (this.settings.leaveBacklink) {
				await this.backlinkWriter.replaceSection(
					sourceFile,
					dragData.headingLine,
					dragData.headingLevel,
					newFile.basename,
				);
			}

			new Notice(`Created "${newFile.basename}" on Canvas`);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			new Notice(`Failed to create node: ${message}`);
		}
	}

	private groupSelectedNodes(): void {
		const selectedNodes = this.canvasObserver.getSelectedNodes();
		if (selectedNodes.length === 0) {
			new Notice("Select at least 1 node to group");
			return;
		}

		const canvasView = this.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		this.canvasOperator.addGroupToCanvas(canvasView.canvas, selectedNodes);
		new Notice("Grouped selected nodes");
	}

	private connectSelectedNodes(): void {
		const selectedNodes = this.canvasObserver.getSelectedNodes();
		if (selectedNodes.length !== 2) {
			new Notice("Select exactly 2 nodes to connect");
			return;
		}

		const canvasView = this.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		this.canvasOperator.addEdgeToCanvas(canvasView.canvas, {
			fromNode: selectedNodes[0].id,
			toNode: selectedNodes[1].id,
			color: this.settings.defaultEdgeColor || undefined,
			label: this.settings.defaultEdgeLabel || undefined,
		});

		new Notice("Connected selected nodes");
	}

	private async handleCanvasDblClick(evt: MouseEvent): Promise<void> {
		if (!evt.metaKey && !evt.ctrlKey) {
			return;
		}

		const target = evt.target as HTMLElement;
		if (!target.closest(".canvas-wrapper")) {
			return;
		}
		if (target.closest(".canvas-node")) {
			return;
		}

		const canvasView = this.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		const canvasEl = target.closest(".canvas-wrapper");
		if (!canvasEl) {
			return;
		}

		const position = clientToCanvasPos(
			evt.clientX,
			evt.clientY,
			canvasView.canvas,
			canvasEl as HTMLElement,
		);

		try {
			const file = await this.quickCardCreator.createCardAtPosition(
				canvasView.canvas,
				canvasView.file,
				position,
				this.settings.quickCardDefaultTitle,
			);
			new Notice(`Created "${file.basename}" on Canvas`);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			new Notice(`Failed to create card: ${message}`);
		}
	}

	private async createNewCardAtOrigin(): Promise<void> {
		const canvasView = this.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		try {
			const file = await this.quickCardCreator.createCardAtPosition(
				canvasView.canvas,
				canvasView.file,
				{ x: 0, y: 0 },
				this.settings.quickCardDefaultTitle,
			);
			new Notice(`Created "${file.basename}" on Canvas`);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			new Notice(`Failed to create card: ${message}`);
		}
	}

	private getActiveCanvasView(): CanvasView | null {
		const canvasLeaves = this.app.workspace.getLeavesOfType("canvas");
		if (canvasLeaves.length === 0) {
			return null;
		}

		const canvasView = canvasLeaves[0].view as unknown as CanvasView;
		if (!canvasView?.canvas) {
			return null;
		}

		return canvasView;
	}

	private async loadSettings(): Promise<void> {
		const data = await this.loadData();
		this.settings = { ...DEFAULT_SETTINGS, ...data };
	}

	private async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
