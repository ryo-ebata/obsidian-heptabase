import { DropHandler } from "@/handlers/drop-handler";
import type { BacklinkWriter } from "@/services/backlink-writer";
import type { CanvasObserver } from "@/services/canvas-observer";
import type { CanvasOperator } from "@/services/canvas-operator";
import type { ContentExtractor } from "@/services/content-extractor";
import type { FileCreator } from "@/services/file-creator";
import type { CanvasView } from "@/types/obsidian-canvas";
import { DEFAULT_SETTINGS, type HeptabaseSettings } from "@/types/settings";
import * as obsidian from "obsidian";
import { App, TFile } from "obsidian";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createMockDragEvent(data?: string): DragEvent {
	return {
		dataTransfer: data ? { getData: vi.fn().mockReturnValue(data) } : null,
		clientX: 100,
		clientY: 200,
	} as unknown as DragEvent;
}

function createMockCanvasView(): CanvasView {
	return {
		canvas: {
			getData: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
			setData: vi.fn(),
			requestSave: vi.fn(),
			createFileNode: vi.fn(),
			selection: new Set(),
			tx: 0,
			ty: 0,
			tZoom: 1,
		},
		file: new TFile("test.canvas"),
	};
}

describe("DropHandler", () => {
	let handler: DropHandler;
	let app: App;
	let settings: HeptabaseSettings;
	let canvasObserver: CanvasObserver;
	let canvasOperator: CanvasOperator;
	let contentExtractor: ContentExtractor;
	let fileCreator: FileCreator;
	let backlinkWriter: BacklinkWriter;
	let noticeSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		noticeSpy = vi.spyOn(obsidian, "Notice");
		app = new App();
		settings = { ...DEFAULT_SETTINGS };
		canvasObserver = {
			getActiveCanvasView: vi.fn().mockReturnValue(null),
			getSelectedNodes: vi.fn().mockReturnValue([]),
		} as unknown as CanvasObserver;
		canvasOperator = {
			addNodeToCanvas: vi.fn(),
		} as unknown as CanvasOperator;
		contentExtractor = {
			extractContentWithHeading: vi.fn().mockReturnValue("extracted content"),
		} as unknown as ContentExtractor;
		fileCreator = {
			createFile: vi.fn().mockResolvedValue(new TFile("new-file.md")),
		} as unknown as FileCreator;
		backlinkWriter = {
			replaceSection: vi.fn().mockResolvedValue(undefined),
		} as unknown as BacklinkWriter;

		handler = new DropHandler(
			app,
			settings,
			canvasObserver,
			canvasOperator,
			contentExtractor,
			fileCreator,
			backlinkWriter,
		);
	});

	afterEach(() => {
		noticeSpy.mockRestore();
	});

	it("does nothing when no dataTransfer data", async () => {
		const evt = createMockDragEvent();
		await handler.handleCanvasDrop(evt);
		expect(canvasObserver.getActiveCanvasView).not.toHaveBeenCalled();
	});

	it("does nothing when JSON is invalid", async () => {
		const evt = createMockDragEvent("not json");
		await handler.handleCanvasDrop(evt);
		expect(canvasObserver.getActiveCanvasView).not.toHaveBeenCalled();
	});

	it("does nothing for unknown drag type", async () => {
		const data = JSON.stringify({ type: "unknown" });
		const evt = createMockDragEvent(data);
		await handler.handleCanvasDrop(evt);
		expect(canvasObserver.getActiveCanvasView).not.toHaveBeenCalled();
	});

	describe("note drop", () => {
		it("adds file node to canvas on note-drag", async () => {
			const file = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(file);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const data = JSON.stringify({ type: "note-drag", filePath: "notes/test.md" });
			const evt = createMockDragEvent(data);
			await handler.handleCanvasDrop(evt);

			expect(canvasOperator.addNodeToCanvas).toHaveBeenCalledWith(canvasView.canvas, file, {
				x: 100,
				y: 200,
			});
		});

		it("shows notice when source file not found", async () => {
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const data = JSON.stringify({ type: "note-drag", filePath: "missing.md" });
			const evt = createMockDragEvent(data);
			await handler.handleCanvasDrop(evt);

			expect(canvasOperator.addNodeToCanvas).not.toHaveBeenCalled();
		});

		it("does nothing when no active canvas", async () => {
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(null);
			const data = JSON.stringify({ type: "note-drag", filePath: "test.md" });
			const evt = createMockDragEvent(data);
			await handler.handleCanvasDrop(evt);

			expect(canvasOperator.addNodeToCanvas).not.toHaveBeenCalled();
		});

		it("shows error notice when addNodeToCanvas throws", async () => {
			const file = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(file);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);
			(canvasOperator.addNodeToCanvas as Mock).mockImplementation(() => {
				throw new Error("canvas error");
			});

			const data = JSON.stringify({ type: "note-drag", filePath: "notes/test.md" });
			const evt = createMockDragEvent(data);
			await handler.handleCanvasDrop(evt);

			expect(noticeSpy).toHaveBeenCalledWith("Failed to add note: canvas error");
		});
	});

	describe("heading drop", () => {
		const headingDragData = {
			type: "heading-explorer-drag",
			filePath: "notes/test.md",
			headingText: "Section A",
			headingLevel: 2,
			headingLine: 5,
		};

		it("creates file and adds node to canvas", async () => {
			const sourceFile = new TFile("notes/test.md");
			const newFile = new TFile("Section-A.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("# Title\n\n## Section A\ncontent");
			(fileCreator.createFile as Mock).mockResolvedValue(newFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(contentExtractor.extractContentWithHeading).toHaveBeenCalledWith(
				"# Title\n\n## Section A\ncontent",
				5,
				2,
			);
			expect(fileCreator.createFile).toHaveBeenCalledWith(
				"Section A",
				"extracted content",
				sourceFile,
			);
			expect(canvasOperator.addNodeToCanvas).toHaveBeenCalledWith(canvasView.canvas, newFile, {
				x: 100,
				y: 200,
			});
		});

		it("writes backlink when leaveBacklink is enabled", async () => {
			settings.leaveBacklink = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
			);

			const sourceFile = new TFile("notes/test.md");
			const newFile = new TFile("Section-A.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(fileCreator.createFile as Mock).mockResolvedValue(newFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(backlinkWriter.replaceSection).toHaveBeenCalledWith(sourceFile, 5, 2, "Section-A");
		});

		it("does not write backlink when leaveBacklink is disabled", async () => {
			settings.leaveBacklink = false;
			const sourceFile = new TFile("notes/test.md");
			const newFile = new TFile("Section-A.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(fileCreator.createFile as Mock).mockResolvedValue(newFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(backlinkWriter.replaceSection).not.toHaveBeenCalled();
		});

		it("shows error notice when createFile throws", async () => {
			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(fileCreator.createFile as Mock).mockRejectedValue(new Error("file error"));
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(noticeSpy).toHaveBeenCalledWith("Failed to create node: file error");
		});
	});

	describe("multi-heading drop", () => {
		const multiDragData = {
			type: "multi-heading-drag",
			items: [
				{
					type: "heading-explorer-drag",
					filePath: "notes/test.md",
					headingText: "Section A",
					headingLevel: 2,
					headingLine: 5,
				},
				{
					type: "heading-explorer-drag",
					filePath: "notes/test.md",
					headingText: "Section B",
					headingLevel: 2,
					headingLine: 10,
				},
			],
		};

		it("creates files and adds nodes in grid layout", async () => {
			const sourceFile = new TFile("notes/test.md");
			const newFileA = new TFile("Section-A.md");
			const newFileB = new TFile("Section-B.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(contentExtractor.extractContentWithHeading as Mock).mockReturnValue("extracted");
			(fileCreator.createFile as Mock)
				.mockResolvedValueOnce(newFileA)
				.mockResolvedValueOnce(newFileB);
			(canvasOperator.addNodeToCanvas as Mock).mockReturnValue({
				id: "node-1",
				x: 0,
				y: 0,
				width: 400,
				height: 300,
			});
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(multiDragData));
			await handler.handleCanvasDrop(evt);

			expect(fileCreator.createFile).toHaveBeenCalledTimes(2);
			expect(canvasOperator.addNodeToCanvas).toHaveBeenCalledTimes(2);
		});

		it("places nodes at grid positions", async () => {
			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(contentExtractor.extractContentWithHeading as Mock).mockReturnValue("extracted");
			(fileCreator.createFile as Mock)
				.mockResolvedValueOnce(new TFile("A.md"))
				.mockResolvedValueOnce(new TFile("B.md"));
			(canvasOperator.addNodeToCanvas as Mock).mockReturnValue({
				id: "n",
				x: 0,
				y: 0,
				width: 400,
				height: 300,
			});
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(multiDragData));
			await handler.handleCanvasDrop(evt);

			const firstCall = (canvasOperator.addNodeToCanvas as Mock).mock.calls[0];
			const secondCall = (canvasOperator.addNodeToCanvas as Mock).mock.calls[1];
			expect(firstCall[2]).toEqual({ x: 100, y: 200 });
			expect(secondCall[2]).toEqual({ x: 540, y: 200 });
		});

		it("groups created nodes", async () => {
			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(contentExtractor.extractContentWithHeading as Mock).mockReturnValue("extracted");
			(fileCreator.createFile as Mock)
				.mockResolvedValueOnce(new TFile("A.md"))
				.mockResolvedValueOnce(new TFile("B.md"));
			const mockNode = { id: "n", x: 0, y: 0, width: 400, height: 300 };
			(canvasOperator.addNodeToCanvas as Mock).mockReturnValue(mockNode);
			(canvasOperator as Record<string, unknown>).addGroupToCanvas = vi.fn();
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(multiDragData));
			await handler.handleCanvasDrop(evt);

			expect((canvasOperator as Record<string, Mock>).addGroupToCanvas).toHaveBeenCalledWith(
				canvasView.canvas,
				[mockNode, mockNode],
			);
		});

		it("does nothing when no active canvas", async () => {
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(null);
			const evt = createMockDragEvent(JSON.stringify(multiDragData));
			await handler.handleCanvasDrop(evt);

			expect(fileCreator.createFile).not.toHaveBeenCalled();
		});

		it("shows error notice when one createFile fails", async () => {
			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(contentExtractor.extractContentWithHeading as Mock).mockReturnValue("extracted");
			(fileCreator.createFile as Mock).mockRejectedValue(new Error("multi error"));
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(multiDragData));
			await handler.handleCanvasDrop(evt);

			expect(noticeSpy).toHaveBeenCalledWith("Failed to create nodes: multi error");
		});
	});
});
