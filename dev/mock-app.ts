import type { CachedMetadata, HeadingCache } from "obsidian";

export class TFile {
	path: string;
	name: string;
	basename: string;
	extension: string;
	parent: TFolder | null;

	constructor(path: string) {
		this.path = path;
		this.name = path.split("/").pop() ?? path;
		this.basename = this.name.replace(/\.[^.]+$/, "");
		this.extension = "md";
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

const sampleFiles = [
	new TFile("Projects/Getting Started.md"),
	new TFile("Projects/Architecture Overview.md"),
	new TFile("Notes/Daily Note 2025-01-15.md"),
	new TFile("Notes/Meeting Notes.md"),
	new TFile("Ideas/Feature Roadmap.md"),
];

const sampleHeadings: Record<string, HeadingCache[]> = {
	"Projects/Getting Started.md": [
		{
			heading: "Installation",
			level: 2,
			position: { start: { line: 2, col: 0, offset: 20 }, end: { line: 2, col: 16, offset: 36 } },
		},
		{
			heading: "Quick Start",
			level: 2,
			position: {
				start: { line: 10, col: 0, offset: 120 },
				end: { line: 10, col: 15, offset: 135 },
			},
		},
		{
			heading: "Configuration",
			level: 3,
			position: {
				start: { line: 20, col: 0, offset: 250 },
				end: { line: 20, col: 17, offset: 267 },
			},
		},
	],
	"Projects/Architecture Overview.md": [
		{
			heading: "System Design",
			level: 2,
			position: { start: { line: 2, col: 0, offset: 30 }, end: { line: 2, col: 17, offset: 47 } },
		},
		{
			heading: "Components",
			level: 2,
			position: {
				start: { line: 15, col: 0, offset: 200 },
				end: { line: 15, col: 14, offset: 214 },
			},
		},
		{
			heading: "Data Flow",
			level: 3,
			position: {
				start: { line: 30, col: 0, offset: 400 },
				end: { line: 30, col: 13, offset: 413 },
			},
		},
	],
	"Notes/Daily Note 2025-01-15.md": [
		{
			heading: "Tasks",
			level: 2,
			position: { start: { line: 2, col: 0, offset: 25 }, end: { line: 2, col: 9, offset: 34 } },
		},
		{
			heading: "Notes",
			level: 2,
			position: {
				start: { line: 10, col: 0, offset: 100 },
				end: { line: 10, col: 9, offset: 109 },
			},
		},
	],
	"Notes/Meeting Notes.md": [
		{
			heading: "Agenda",
			level: 2,
			position: { start: { line: 2, col: 0, offset: 20 }, end: { line: 2, col: 10, offset: 30 } },
		},
		{
			heading: "Action Items",
			level: 2,
			position: {
				start: { line: 15, col: 0, offset: 180 },
				end: { line: 15, col: 16, offset: 196 },
			},
		},
		{
			heading: "Follow-up",
			level: 3,
			position: {
				start: { line: 25, col: 0, offset: 300 },
				end: { line: 25, col: 13, offset: 313 },
			},
		},
	],
	"Ideas/Feature Roadmap.md": [
		{
			heading: "Q1 Goals",
			level: 2,
			position: { start: { line: 2, col: 0, offset: 25 }, end: { line: 2, col: 12, offset: 37 } },
		},
		{
			heading: "Q2 Goals",
			level: 2,
			position: {
				start: { line: 20, col: 0, offset: 300 },
				end: { line: 20, col: 12, offset: 312 },
			},
		},
		{
			heading: "Backlog",
			level: 2,
			position: {
				start: { line: 40, col: 0, offset: 600 },
				end: { line: 40, col: 10, offset: 610 },
			},
		},
	],
};

const sampleContent: Record<string, string> = {
	"Projects/Getting Started.md":
		"# Getting Started\n\n## Installation\n\nInstall via community plugins.\n\n```bash\npnpm install\n```\n\n## Quick Start\n\nOpen a canvas and start dragging headings.\n\n### Configuration\n\nAdjust settings in the plugin settings tab.",
	"Projects/Architecture Overview.md":
		"# Architecture Overview\n\n## System Design\n\nThe plugin follows a modular architecture with clear separation of concerns.\n\n## Components\n\nEach component handles a specific part of the UI.\n\n### Data Flow\n\nData flows from Obsidian API through services to React components.",
	"Notes/Daily Note 2025-01-15.md":
		"# 2025-01-15\n\n## Tasks\n\n- [x] Review PR\n- [ ] Update docs\n\n## Notes\n\nDiscussed new feature requirements with the team.",
	"Notes/Meeting Notes.md":
		"# Meeting Notes\n\n## Agenda\n\n1. Project status\n2. Feature prioritization\n3. Timeline review\n\n## Action Items\n\n- Update roadmap\n- Schedule follow-up\n\n### Follow-up\n\nScheduled for next week.",
	"Ideas/Feature Roadmap.md":
		"# Feature Roadmap\n\n## Q1 Goals\n\n- Canvas integration\n- Heading explorer\n- Drag and drop\n\n## Q2 Goals\n\n- Edge management\n- Back links\n- Performance optimization\n\n## Backlog\n\n- Multi-canvas support\n- Custom themes\n- Export functionality",
};

type EventCallback = (...args: unknown[]) => void;

interface EventRef {
	id: string;
}

class MockVault {
	private eventListeners = new Map<string, EventCallback[]>();

	getMarkdownFiles(): TFile[] {
		return [...sampleFiles];
	}

	async read(file: TFile): Promise<string> {
		return sampleContent[file.path] ?? "";
	}

	async create(path: string, _content: string): Promise<TFile> {
		return new TFile(path);
	}

	async modify(_file: TFile, _content: string): Promise<void> {}

	async createFolder(_path: string): Promise<void> {}

	getAbstractFileByPath(path: string): TFile | null {
		return sampleFiles.find((f) => f.path === path) ?? null;
	}

	on(event: string, callback: EventCallback): EventRef {
		const listeners = this.eventListeners.get(event) ?? [];
		listeners.push(callback);
		this.eventListeners.set(event, listeners);
		return { id: `vault-${event}-${listeners.length}` };
	}

	adapter = {
		exists: async (_path: string): Promise<boolean> => false,
	};
}

class MockWorkspace {
	private eventListeners = new Map<string, EventCallback[]>();

	getActiveViewOfType(_type: unknown): { file: TFile | null } | null {
		return { file: sampleFiles[0] };
	}

	getLeavesOfType(_type: string): unknown[] {
		return [];
	}

	on(event: string, callback: EventCallback): EventRef {
		const listeners = this.eventListeners.get(event) ?? [];
		listeners.push(callback);
		this.eventListeners.set(event, listeners);
		return { id: `workspace-${event}-${listeners.length}` };
	}

	offref(_ref: EventRef): void {}

	detachLeavesOfType(_type: string): void {}

	getRightLeaf(_createNew: boolean): { setViewState: () => Promise<void> } {
		return { setViewState: async () => {} };
	}

	revealLeaf(_leaf: unknown): void {}

	trigger(event: string, ...args: unknown[]): void {
		const listeners = this.eventListeners.get(event) ?? [];
		for (const listener of listeners) {
			listener(...args);
		}
	}
}

class MockMetadataCache {
	getFileCache(file: TFile): CachedMetadata | null {
		const headings = sampleHeadings[file.path];
		if (!headings) {
			return null;
		}
		return { headings };
	}

	on(event: string, _callback: EventCallback): EventRef {
		return { id: `metadata-${event}` };
	}
}

export function createMockApp(): {
	vault: MockVault;
	workspace: MockWorkspace;
	metadataCache: MockMetadataCache;
} {
	return {
		vault: new MockVault(),
		workspace: new MockWorkspace(),
		metadataCache: new MockMetadataCache(),
	};
}

export class MarkdownView {
	file: TFile | null = null;
}

export const VIEW_TYPE_CANVAS = "canvas";

export class Notice {
	message: string;

	constructor(message: string) {
		this.message = message;
		console.log(`[Notice] ${message}`);
	}
}
