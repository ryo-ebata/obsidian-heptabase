import { DropHandler } from "@/handlers/drop-handler";
import type { BacklinkWriter } from "@/services/backlink-writer";
import type { CanvasObserver } from "@/services/canvas-observer";
import type { CanvasOperator } from "@/services/canvas-operator";
import type { ContentExtractor } from "@/services/content-extractor";
import type { FileCreator } from "@/services/file-creator";
import type { PreviewBridge } from "@/services/preview-bridge";
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
		settings = { ...DEFAULT_SETTINGS, dropMode: "extract" as const };
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
			appendLink: vi.fn().mockResolvedValue(undefined),
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

		it("calls appendLink when leaveBacklink is enabled", async () => {
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

			expect(backlinkWriter.appendLink).toHaveBeenCalledWith(sourceFile, 5, 2, "Section-A");
			expect(backlinkWriter.replaceSection).not.toHaveBeenCalled();
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

			expect(backlinkWriter.appendLink).not.toHaveBeenCalled();
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

		it("shows Notice when source file is not TFile", async () => {
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(noticeSpy).toHaveBeenCalledWith("Source file not found");
			expect(fileCreator.createFile).not.toHaveBeenCalled();
		});

		it("returns early when no active canvas", async () => {
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(null);
			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(fileCreator.createFile).not.toHaveBeenCalled();
		});

		it("calls requestPreview when showPreviewBeforeCreate and previewBridge", async () => {
			const previewBridge = {
				requestPreview: vi.fn().mockReturnValue(true),
			} as unknown as PreviewBridge;
			settings.showPreviewBeforeCreate = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
				previewBridge,
			);

			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(previewBridge.requestPreview as Mock).toHaveBeenCalledWith(
				[headingDragData],
				["extracted content"],
				expect.any(Function),
				expect.any(Function),
			);
			expect(fileCreator.createFile).not.toHaveBeenCalled();
		});

		it("preview with selectedIndices=[] does not call createNode", async () => {
			const previewBridge = {
				requestPreview: vi.fn().mockReturnValue(true),
			} as unknown as PreviewBridge;
			settings.showPreviewBeforeCreate = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
				previewBridge,
			);

			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			const onConfirm = (previewBridge.requestPreview as Mock).mock.calls[0][2] as (
				indices: number[],
			) => Promise<void>;
			await onConfirm([]);

			expect(fileCreator.createFile).not.toHaveBeenCalled();
		});

		it("preview with selectedIndices=[0] calls createNode", async () => {
			const previewBridge = {
				requestPreview: vi.fn().mockReturnValue(true),
			} as unknown as PreviewBridge;
			settings.showPreviewBeforeCreate = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
				previewBridge,
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

			const onConfirm = (previewBridge.requestPreview as Mock).mock.calls[0][2] as (
				indices: number[],
			) => Promise<void>;
			await onConfirm([0]);

			expect(fileCreator.createFile).toHaveBeenCalledWith(
				"Section A",
				"extracted content",
				sourceFile,
			);
			expect(canvasOperator.addNodeToCanvas).toHaveBeenCalled();
		});

		it("preview callback error calls notifyError", async () => {
			const previewBridge = {
				requestPreview: vi.fn().mockReturnValue(true),
			} as unknown as PreviewBridge;
			settings.showPreviewBeforeCreate = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
				previewBridge,
			);

			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(fileCreator.createFile as Mock).mockRejectedValue(new Error("preview error"));
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			const onConfirm = (previewBridge.requestPreview as Mock).mock.calls[0][2] as (
				indices: number[],
			) => Promise<void>;
			await onConfirm([0]);

			expect(noticeSpy).toHaveBeenCalledWith("Failed to create node: preview error");
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

		it("skips null node from addNodeToCanvas and does not group", async () => {
			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(contentExtractor.extractContentWithHeading as Mock).mockReturnValue("extracted");
			(fileCreator.createFile as Mock)
				.mockResolvedValueOnce(new TFile("A.md"))
				.mockResolvedValueOnce(new TFile("B.md"));
			(canvasOperator.addNodeToCanvas as Mock).mockReturnValue(null);
			(canvasOperator as Record<string, unknown>).addGroupToCanvas = vi.fn();
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(multiDragData));
			await handler.handleCanvasDrop(evt);

			expect(canvasOperator.addNodeToCanvas).toHaveBeenCalledTimes(2);
			expect((canvasOperator as Record<string, Mock>).addGroupToCanvas).not.toHaveBeenCalled();
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

		it("calls requestPreview for multi when showPreviewBeforeCreate and previewBridge", async () => {
			const previewBridge = {
				requestPreview: vi.fn().mockReturnValue(true),
			} as unknown as PreviewBridge;
			settings.showPreviewBeforeCreate = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
				previewBridge,
			);

			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(contentExtractor.extractContentWithHeading as Mock).mockReturnValue("extracted");
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(multiDragData));
			await handler.handleCanvasDrop(evt);

			expect(previewBridge.requestPreview as Mock).toHaveBeenCalledWith(
				multiDragData.items,
				["extracted", "extracted"],
				expect.any(Function),
				expect.any(Function),
			);
			expect(fileCreator.createFile).not.toHaveBeenCalled();
		});

		it("pushes empty content when sourceFile is not TFile", async () => {
			const multiDataMixed = {
				type: "multi-heading-drag",
				items: [
					{
						type: "heading-explorer-drag",
						filePath: "missing.md",
						headingText: "Gone",
						headingLevel: 2,
						headingLine: 1,
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

			(app.vault.getAbstractFileByPath as Mock).mockImplementation((path: string) => {
				if (path === "notes/test.md") {
					return new TFile("notes/test.md");
				}
				return null;
			});
			(app.vault.read as Mock).mockResolvedValue("content");
			(contentExtractor.extractContentWithHeading as Mock).mockReturnValue("extracted");
			(fileCreator.createFile as Mock).mockResolvedValue(new TFile("B.md"));
			(canvasOperator.addNodeToCanvas as Mock).mockReturnValue({
				id: "n",
				x: 0,
				y: 0,
				width: 400,
				height: 300,
			});
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(multiDataMixed));
			await handler.handleCanvasDrop(evt);

			expect(fileCreator.createFile).toHaveBeenCalledTimes(1);
			expect(fileCreator.createFile).toHaveBeenCalledWith(
				"Section B",
				"extracted",
				expect.any(TFile),
			);
		});

		it("calls appendLink for each item when leaveBacklink enabled", async () => {
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
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(contentExtractor.extractContentWithHeading as Mock).mockReturnValue("extracted");
			(fileCreator.createFile as Mock)
				.mockResolvedValueOnce(new TFile("Section-A.md"))
				.mockResolvedValueOnce(new TFile("Section-B.md"));
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

			expect(backlinkWriter.appendLink).toHaveBeenCalledTimes(2);
			expect(backlinkWriter.appendLink).toHaveBeenCalledWith(sourceFile, 5, 2, "Section-A");
			expect(backlinkWriter.appendLink).toHaveBeenCalledWith(sourceFile, 10, 2, "Section-B");
			expect(backlinkWriter.replaceSection).not.toHaveBeenCalled();
		});

		it("multi preview onConfirm calls createMultipleNodes", async () => {
			const previewBridge = {
				requestPreview: vi.fn().mockReturnValue(true),
			} as unknown as PreviewBridge;
			settings.showPreviewBeforeCreate = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
				previewBridge,
			);

			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(contentExtractor.extractContentWithHeading as Mock).mockReturnValue("extracted");
			(fileCreator.createFile as Mock).mockResolvedValue(new TFile("A.md"));
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

			const onConfirm = (previewBridge.requestPreview as Mock).mock.calls[0][2] as (
				indices: number[],
			) => Promise<void>;
			await onConfirm([0, 1]);

			expect(fileCreator.createFile).toHaveBeenCalledTimes(2);
		});

		it("multi preview onConfirm error calls notifyError", async () => {
			const previewBridge = {
				requestPreview: vi.fn().mockReturnValue(true),
			} as unknown as PreviewBridge;
			settings.showPreviewBeforeCreate = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
				previewBridge,
			);

			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(app.vault.read as Mock).mockResolvedValue("content");
			(contentExtractor.extractContentWithHeading as Mock).mockReturnValue("extracted");
			(fileCreator.createFile as Mock).mockRejectedValue(new Error("multi preview error"));
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(multiDragData));
			await handler.handleCanvasDrop(evt);

			const onConfirm = (previewBridge.requestPreview as Mock).mock.calls[0][2] as (
				indices: number[],
			) => Promise<void>;
			await onConfirm([0]);

			expect(noticeSpy).toHaveBeenCalledWith("Failed to create nodes: multi preview error");
		});

		it("skips sourceFile not TFile inside createMultipleNodes", async () => {
			const multiDataMixed = {
				type: "multi-heading-drag",
				items: [
					{
						type: "heading-explorer-drag",
						filePath: "missing.md",
						headingText: "Gone",
						headingLevel: 2,
						headingLine: 1,
					},
				],
			};

			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(multiDataMixed));
			await handler.handleCanvasDrop(evt);

			expect(fileCreator.createFile).not.toHaveBeenCalled();
		});
	});

	describe("reference mode - heading drop", () => {
		const headingDragData = {
			type: "heading-explorer-drag",
			filePath: "notes/test.md",
			headingText: "Section A",
			headingLevel: 2,
			headingLine: 5,
		};

		beforeEach(() => {
			settings.dropMode = "reference";
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

		it("does not call fileCreator.createFile", async () => {
			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(fileCreator.createFile).not.toHaveBeenCalled();
		});

		it("does not call contentExtractor.extractContentWithHeading", async () => {
			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(contentExtractor.extractContentWithHeading).not.toHaveBeenCalled();
		});

		it("does not call backlinkWriter.replaceSection", async () => {
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
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(backlinkWriter.replaceSection).not.toHaveBeenCalled();
		});

		it("calls addNodeToCanvas with subpath", async () => {
			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(canvasOperator.addNodeToCanvas).toHaveBeenCalledWith(
				canvasView.canvas,
				sourceFile,
				{ x: 100, y: 200 },
				"#Section A",
			);
		});

		it("shows reference notice", async () => {
			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(noticeSpy).toHaveBeenCalledWith('Added "Section A" reference to Canvas');
		});

		it("skips preview even when showPreviewBeforeCreate is enabled", async () => {
			const previewBridge = {
				requestPreview: vi.fn().mockReturnValue(true),
			} as unknown as PreviewBridge;
			settings.showPreviewBeforeCreate = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
				previewBridge,
			);

			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(headingDragData));
			await handler.handleCanvasDrop(evt);

			expect(previewBridge.requestPreview as Mock).not.toHaveBeenCalled();
			expect(canvasOperator.addNodeToCanvas).toHaveBeenCalledWith(
				canvasView.canvas,
				sourceFile,
				{ x: 100, y: 200 },
				"#Section A",
			);
		});
	});

	describe("reference mode - multi-heading drop", () => {
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

		beforeEach(() => {
			settings.dropMode = "reference";
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

		it("does not call fileCreator or contentExtractor", async () => {
			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
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

			expect(fileCreator.createFile).not.toHaveBeenCalled();
			expect(contentExtractor.extractContentWithHeading).not.toHaveBeenCalled();
		});

		it("calls addNodeToCanvas with correct subpath for each item", async () => {
			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
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

			expect(canvasOperator.addNodeToCanvas).toHaveBeenCalledTimes(2);
			expect((canvasOperator.addNodeToCanvas as Mock).mock.calls[0][3]).toBe("#Section A");
			expect((canvasOperator.addNodeToCanvas as Mock).mock.calls[1][3]).toBe("#Section B");
		});

		it("groups created nodes", async () => {
			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
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

		it("skips preview even when showPreviewBeforeCreate is enabled", async () => {
			const previewBridge = {
				requestPreview: vi.fn().mockReturnValue(true),
			} as unknown as PreviewBridge;
			settings.showPreviewBeforeCreate = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
				previewBridge,
			);

			const sourceFile = new TFile("notes/test.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
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

			expect(previewBridge.requestPreview as Mock).not.toHaveBeenCalled();
		});

		it("skips items where source file is not TFile", async () => {
			const multiDataMixed = {
				type: "multi-heading-drag",
				items: [
					{
						type: "heading-explorer-drag",
						filePath: "missing.md",
						headingText: "Gone",
						headingLevel: 2,
						headingLine: 1,
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

			(app.vault.getAbstractFileByPath as Mock).mockImplementation((path: string) => {
				if (path === "notes/test.md") {
					return new TFile("notes/test.md");
				}
				return null;
			});
			(canvasOperator.addNodeToCanvas as Mock).mockReturnValue({
				id: "n",
				x: 0,
				y: 0,
				width: 400,
				height: 300,
			});
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(multiDataMixed));
			await handler.handleCanvasDrop(evt);

			expect(canvasOperator.addNodeToCanvas).toHaveBeenCalledTimes(1);
			expect((canvasOperator.addNodeToCanvas as Mock).mock.calls[0][3]).toBe("#Section B");
		});
	});

	describe("text-selection drop", () => {
		const textSelectionDragData = {
			type: "text-selection-drag",
			filePath: "notes/article.md",
			selectedText: "This is the selected paragraph text.",
			title: "Selected Text",
		};

		it("creates file and adds node to canvas", async () => {
			const sourceFile = new TFile("notes/article.md");
			const newFile = new TFile("Selected-Text.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(fileCreator.createFile as Mock).mockResolvedValue(newFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(textSelectionDragData));
			await handler.handleCanvasDrop(evt);

			expect(fileCreator.createFile).toHaveBeenCalledWith(
				"Selected Text",
				"This is the selected paragraph text.",
				sourceFile,
			);
			expect(canvasOperator.addNodeToCanvas).toHaveBeenCalledWith(canvasView.canvas, newFile, {
				x: 100,
				y: 200,
			});
		});

		it("shows notice on success", async () => {
			const sourceFile = new TFile("notes/article.md");
			const newFile = new TFile("Selected-Text.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(fileCreator.createFile as Mock).mockResolvedValue(newFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(textSelectionDragData));
			await handler.handleCanvasDrop(evt);

			expect(noticeSpy).toHaveBeenCalledWith('Created "Selected-Text" on Canvas');
		});

		it("does nothing when no active canvas", async () => {
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(null);
			const evt = createMockDragEvent(JSON.stringify(textSelectionDragData));
			await handler.handleCanvasDrop(evt);

			expect(fileCreator.createFile).not.toHaveBeenCalled();
		});

		it("shows Notice when source file is not TFile", async () => {
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(textSelectionDragData));
			await handler.handleCanvasDrop(evt);

			expect(noticeSpy).toHaveBeenCalledWith("Source file not found");
			expect(fileCreator.createFile).not.toHaveBeenCalled();
		});

		it("shows error notice when createFile throws", async () => {
			const sourceFile = new TFile("notes/article.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(fileCreator.createFile as Mock).mockRejectedValue(new Error("create error"));
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(textSelectionDragData));
			await handler.handleCanvasDrop(evt);

			expect(noticeSpy).toHaveBeenCalledWith("Failed to create note: create error");
		});

		it("calls requestPreview when showPreviewBeforeCreate and previewBridge", async () => {
			const previewBridge = {
				requestPreview: vi.fn().mockReturnValue(true),
			} as unknown as PreviewBridge;
			settings.showPreviewBeforeCreate = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
				previewBridge,
			);

			const sourceFile = new TFile("notes/article.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(textSelectionDragData));
			await handler.handleCanvasDrop(evt);

			expect(previewBridge.requestPreview as Mock).toHaveBeenCalledWith(
				[
					{
						headingText: "Selected Text",
						headingLevel: 0,
						headingLine: 0,
						type: "heading-explorer-drag",
						filePath: "notes/article.md",
					},
				],
				["This is the selected paragraph text."],
				expect.any(Function),
				expect.any(Function),
			);
			expect(fileCreator.createFile).not.toHaveBeenCalled();
		});

		it("preview onConfirm creates node", async () => {
			const previewBridge = {
				requestPreview: vi.fn().mockReturnValue(true),
			} as unknown as PreviewBridge;
			settings.showPreviewBeforeCreate = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
				previewBridge,
			);

			const sourceFile = new TFile("notes/article.md");
			const newFile = new TFile("Selected-Text.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(fileCreator.createFile as Mock).mockResolvedValue(newFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(textSelectionDragData));
			await handler.handleCanvasDrop(evt);

			const onConfirm = (previewBridge.requestPreview as Mock).mock.calls[0][2] as (
				indices: number[],
			) => Promise<void>;
			await onConfirm([0]);

			expect(fileCreator.createFile).toHaveBeenCalledWith(
				"Selected Text",
				"This is the selected paragraph text.",
				sourceFile,
			);
		});

		it("preview onConfirm with empty indices does nothing", async () => {
			const previewBridge = {
				requestPreview: vi.fn().mockReturnValue(true),
			} as unknown as PreviewBridge;
			settings.showPreviewBeforeCreate = true;
			handler = new DropHandler(
				app,
				settings,
				canvasObserver,
				canvasOperator,
				contentExtractor,
				fileCreator,
				backlinkWriter,
				previewBridge,
			);

			const sourceFile = new TFile("notes/article.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(textSelectionDragData));
			await handler.handleCanvasDrop(evt);

			const onConfirm = (previewBridge.requestPreview as Mock).mock.calls[0][2] as (
				indices: number[],
			) => Promise<void>;
			await onConfirm([]);

			expect(fileCreator.createFile).not.toHaveBeenCalled();
		});

		it("derives title from first line when title is empty", async () => {
			const data = {
				type: "text-selection-drag",
				filePath: "notes/article.md",
				selectedText: "First line of text\nSecond line",
				title: "",
			};
			const sourceFile = new TFile("notes/article.md");
			const newFile = new TFile("First-line-of-text.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(fileCreator.createFile as Mock).mockResolvedValue(newFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(data));
			await handler.handleCanvasDrop(evt);

			expect(fileCreator.createFile).toHaveBeenCalledWith(
				"First line of text",
				"First line of text\nSecond line",
				sourceFile,
			);
		});

		it("truncates long derived title to 50 characters", async () => {
			const longText = "A".repeat(80);
			const data = {
				type: "text-selection-drag",
				filePath: "notes/article.md",
				selectedText: longText,
				title: "",
			};
			const sourceFile = new TFile("notes/article.md");
			const newFile = new TFile("truncated.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(sourceFile);
			(fileCreator.createFile as Mock).mockResolvedValue(newFile);
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockDragEvent(JSON.stringify(data));
			await handler.handleCanvasDrop(evt);

			const calledTitle = (fileCreator.createFile as Mock).mock.calls[0][0] as string;
			expect(calledTitle.length).toBeLessThanOrEqual(50);
		});
	});
});
