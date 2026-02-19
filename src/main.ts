import { CanvasEventHandler } from "@/handlers/canvas-event-handler";
import { CommandHandler } from "@/handlers/command-handler";
import { DropHandler } from "@/handlers/drop-handler";
import { type Services, createServices } from "@/services/service-registry";
import { SettingTab } from "@/settings/setting-tab";
import { DEFAULT_SETTINGS, type HeptabaseSettings } from "@/types/settings";
import { HeadingExplorerView, VIEW_TYPE_HEADING_EXPLORER } from "@/views/heading-explorer-view";
import { Plugin, TFile, type WorkspaceLeaf } from "obsidian";

export default class HeptabasePlugin extends Plugin {
	settings: HeptabaseSettings = DEFAULT_SETTINGS;
	private services!: Services;
	private dropHandler!: DropHandler;
	private commandHandler!: CommandHandler;
	private canvasEventHandler!: CanvasEventHandler;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.initializeServices();

		this.registerView(VIEW_TYPE_HEADING_EXPLORER, (leaf: WorkspaceLeaf) => {
			return new HeadingExplorerView(leaf, this.app, this.settings);
		});

		this.addRibbonIcon("list-tree", "Heading Explorer", () => {
			this.activateView();
		});

		this.addSettingTab(
			new SettingTab(this.app, this, this.settings, (newSettings) => {
				this.settings = newSettings;
				this.initializeServices();
				this.saveSettings();
			}),
		);

		this.registerDomEvent(document, "drop", (evt: DragEvent) => {
			this.dropHandler.handleCanvasDrop(evt);
		});

		this.addCommand({
			id: "connect-selected-nodes",
			name: "Connect selected nodes",
			callback: () => {
				this.commandHandler.connectSelectedNodes();
			},
		});

		this.addCommand({
			id: "group-selected-nodes",
			name: "Group selected nodes",
			callback: () => {
				this.commandHandler.groupSelectedNodes();
			},
		});

		this.addCommand({
			id: "create-new-card",
			name: "Create new card",
			callback: () => {
				this.canvasEventHandler.createNewCardAtOrigin();
			},
		});

		this.registerDomEvent(document, "dblclick", (evt: MouseEvent) => {
			this.canvasEventHandler.handleCanvasDblClick(evt);
		});

		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (this.settings.enableEdgeSync && file instanceof TFile) {
					this.services.edgeSync.onCanvasModified(file);
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
		this.services.edgeSync.reset();
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_HEADING_EXPLORER);
	}

	private initializeServices(): void {
		this.services = createServices(this.app, this.settings);
		this.dropHandler = new DropHandler(
			this.app,
			this.settings,
			this.services.canvasObserver,
			this.services.canvasOperator,
			this.services.fileCreator,
			this.services.previewBridge,
		);
		this.commandHandler = new CommandHandler(
			this.settings,
			this.services.canvasObserver,
			this.services.canvasOperator,
		);
		this.canvasEventHandler = new CanvasEventHandler(
			this.settings,
			this.services.canvasObserver,
			this.services.quickCardCreator,
		);
	}

	private initializeEdgeSync(): void {
		const canvasView = this.services.canvasObserver.getActiveCanvasView();
		if (canvasView) {
			this.services.edgeSync.initializeFromCanvas(canvasView.file);
		} else {
			this.services.edgeSync.reset();
		}
	}

	private async activateView(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_HEADING_EXPLORER);
		const first = existing[0];
		if (first) {
			this.app.workspace.revealLeaf(first);
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

	private async loadSettings(): Promise<void> {
		const data = await this.loadData();
		this.settings = { ...DEFAULT_SETTINGS, ...data };
	}

	private async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
