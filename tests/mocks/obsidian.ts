import { vi } from "vitest";

export interface Pos {
	start: { line: number; col: number; offset: number };
	end: { line: number; col: number; offset: number };
}

export interface HeadingCache {
	heading: string;
	level: number;
	position: Pos;
}

export interface CachedMetadata {
	headings?: HeadingCache[];
}

export const VIEW_TYPE_CANVAS = "canvas";

export class TFile {
	path: string;
	name: string;
	basename: string;
	extension: string;
	parent: TFolder | null;

	constructor(path = "test.md") {
		this.path = path;
		this.name = path.split("/").pop() ?? path;
		this.basename = this.name.replace(/\.[^.]+$/, "");
		this.extension = this.name.split(".").pop() ?? "";
		this.parent = null;
	}
}

export class TFolder {
	path: string;
	name: string;
	children: (TFile | TFolder)[];

	constructor(path = "") {
		this.path = path;
		this.name = path.split("/").pop() ?? path;
		this.children = [];
	}
}

export class Vault {
	getAbstractFileByPath = vi.fn();
	getMarkdownFiles = vi.fn().mockReturnValue([]);
	read = vi.fn().mockResolvedValue("");
	cachedRead = vi.fn().mockResolvedValue("");
	create = vi.fn().mockResolvedValue(new TFile());
	modify = vi.fn().mockResolvedValue(undefined);
	createFolder = vi.fn().mockResolvedValue(undefined);
	on = vi.fn().mockReturnValue({ id: "vault-event-ref" });
	adapter = {
		exists: vi.fn().mockResolvedValue(false),
	};
}

export class FileManager {
	processFrontMatter = vi
		.fn()
		.mockImplementation(
			async (_file: TFile, fn: (frontmatter: Record<string, unknown>) => void) => {
				const frontmatter: Record<string, unknown> = {};
				fn(frontmatter);
			},
		);
}

export class Workspace {
	getActiveViewOfType = vi.fn().mockReturnValue(null);
	getLeavesOfType = vi.fn().mockReturnValue([]);
	on = vi.fn().mockReturnValue({ id: "workspace-event-ref" });
	offref = vi.fn();
	detachLeavesOfType = vi.fn();
	getRightLeaf = vi.fn().mockReturnValue({
		setViewState: vi.fn().mockResolvedValue(undefined),
	});
	revealLeaf = vi.fn();
}

export class MarkdownView {
	file: TFile | null = null;
}

export class MetadataCache {
	getFileCache = vi.fn().mockReturnValue(null);
	on = vi.fn();
}

export class App {
	vault: Vault;
	workspace: Workspace;
	metadataCache: MetadataCache;
	fileManager: FileManager;

	constructor() {
		this.vault = new Vault();
		this.workspace = new Workspace();
		this.metadataCache = new MetadataCache();
		this.fileManager = new FileManager();
	}
}

export class WorkspaceLeaf {
	setViewState = vi.fn().mockResolvedValue(undefined);
}

export abstract class Plugin {
	app: App;

	constructor(app?: App) {
		this.app = app ?? new App();
	}

	loadData = vi.fn().mockResolvedValue(null);
	saveData = vi.fn().mockResolvedValue(undefined);
	addRibbonIcon = vi.fn();
	addCommand = vi.fn();
	registerView = vi.fn();
	addSettingTab = vi.fn();
	registerDomEvent = vi.fn();
	registerEvent = vi.fn();
}

export abstract class ItemView {
	private _containerEl: HTMLElement | null = null;
	leaf: WorkspaceLeaf;

	get containerEl(): HTMLElement {
		if (!this._containerEl) {
			this._containerEl = document.createElement("div");
			const header = document.createElement("div");
			const content = document.createElement("div");
			(content as HTMLElement & { empty: () => void }).empty = vi.fn();
			this._containerEl.appendChild(header);
			this._containerEl.appendChild(content);
		}
		return this._containerEl;
	}

	constructor(leaf?: WorkspaceLeaf) {
		this.leaf = leaf ?? new WorkspaceLeaf();
	}

	abstract getViewType(): string;
	abstract getDisplayText(): string;

	onOpen = vi.fn().mockResolvedValue(undefined);
	onClose = vi.fn().mockResolvedValue(undefined);
}

export const MarkdownRenderer = {
	render: vi.fn().mockResolvedValue(undefined),
};

export class Component {
	_stub = true;
}

export class Notice {
	message: string;

	constructor(message: string) {
		this.message = message;
	}
}

export class PluginSettingTab {
	app: App;
	private _containerEl: unknown;

	get containerEl(): HTMLElement & {
		empty: () => void;
		createEl: (tag: string, attrs?: Record<string, string>) => HTMLElement;
	} {
		if (!this._containerEl) {
			const el = document.createElement("div") as HTMLElement & {
				empty: () => void;
				createEl: (tag: string, attrs?: Record<string, string>) => HTMLElement;
			};
			el.empty = vi.fn(() => {
				el.innerHTML = "";
			});
			el.createEl = vi.fn((tag: string, _attrs?: Record<string, string>) => {
				const child = document.createElement(tag);
				el.appendChild(child);
				return child;
			});
			this._containerEl = el;
		}
		return this._containerEl as HTMLElement & {
			empty: () => void;
			createEl: (tag: string, attrs?: Record<string, string>) => HTMLElement;
		};
	}

	constructor(app: App, _plugin?: unknown) {
		this.app = app;
	}
}

export class Setting {
	private el: HTMLElement;

	constructor(containerEl: HTMLElement) {
		this.el = containerEl;
	}

	setName = vi.fn().mockReturnThis();
	setDesc = vi.fn().mockReturnThis();
	addText = vi.fn().mockImplementation((cb: (text: Setting) => void) => {
		cb(this);
		return this;
	});
	addToggle = vi.fn().mockImplementation((cb: (toggle: Setting) => void) => {
		cb(this);
		return this;
	});
	addSlider = vi.fn().mockImplementation((cb: (slider: Setting) => void) => {
		cb(this);
		return this;
	});
	addDropdown = vi.fn().mockImplementation((cb: (dropdown: Setting) => void) => {
		cb(this);
		return this;
	});
	addOption = vi.fn().mockReturnThis();
	setValue = vi.fn().mockReturnThis();
	setPlaceholder = vi.fn().mockReturnThis();
	onChange = vi.fn().mockReturnThis();
	setDynamicTooltip = vi.fn().mockReturnThis();
	setLimits = vi.fn().mockReturnThis();
}
