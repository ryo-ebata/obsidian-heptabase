import { CanvasEventHandler } from "@/handlers/canvas-event-handler";
import type { CanvasObserver } from "@/services/canvas-observer";
import type { QuickCardCreator } from "@/services/quick-card-creator";
import type { CanvasView } from "@/types/obsidian-canvas";
import { DEFAULT_SETTINGS, type HeptabaseSettings } from "@/types/settings";
import * as obsidian from "obsidian";
import { TFile } from "obsidian";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

function createMockMouseEvent(overrides: Partial<MouseEvent> = {}): MouseEvent {
	const canvasWrapper = document.createElement("div");
	canvasWrapper.classList.add("canvas-wrapper");
	canvasWrapper.getBoundingClientRect = vi.fn().mockReturnValue({
		left: 0,
		top: 0,
		width: 800,
		height: 600,
	});

	const target = document.createElement("div");
	canvasWrapper.appendChild(target);

	return {
		metaKey: true,
		ctrlKey: false,
		clientX: 100,
		clientY: 200,
		target,
		...overrides,
	} as unknown as MouseEvent;
}

describe("CanvasEventHandler", () => {
	let handler: CanvasEventHandler;
	let settings: HeptabaseSettings;
	let canvasObserver: CanvasObserver;
	let quickCardCreator: QuickCardCreator;
	let noticeSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		noticeSpy = vi.spyOn(obsidian, "Notice");
		settings = { ...DEFAULT_SETTINGS };
		canvasObserver = {
			getActiveCanvasView: vi.fn().mockReturnValue(null),
		} as unknown as CanvasObserver;
		quickCardCreator = {
			createCardAtPosition: vi.fn().mockResolvedValue(new TFile("Untitled.md")),
		} as unknown as QuickCardCreator;
		handler = new CanvasEventHandler(settings, canvasObserver, quickCardCreator);
	});

	afterEach(() => {
		noticeSpy.mockRestore();
	});

	describe("handleCanvasDblClick", () => {
		it("does nothing when neither metaKey nor ctrlKey is pressed", async () => {
			const evt = createMockMouseEvent({ metaKey: false, ctrlKey: false });
			await handler.handleCanvasDblClick(evt);
			expect(canvasObserver.getActiveCanvasView).not.toHaveBeenCalled();
		});

		it("does nothing when target is not in canvas-wrapper", async () => {
			const target = document.createElement("div");
			const evt = {
				metaKey: true,
				ctrlKey: false,
				target,
			} as unknown as MouseEvent;
			await handler.handleCanvasDblClick(evt);
			expect(canvasObserver.getActiveCanvasView).not.toHaveBeenCalled();
		});

		it("does nothing when target is a canvas-node", async () => {
			const canvasWrapper = document.createElement("div");
			canvasWrapper.classList.add("canvas-wrapper");
			const canvasNode = document.createElement("div");
			canvasNode.classList.add("canvas-node");
			canvasWrapper.appendChild(canvasNode);
			const target = document.createElement("div");
			canvasNode.appendChild(target);

			const evt = {
				metaKey: true,
				ctrlKey: false,
				target,
			} as unknown as MouseEvent;
			await handler.handleCanvasDblClick(evt);
			expect(canvasObserver.getActiveCanvasView).not.toHaveBeenCalled();
		});

		it("creates card on canvas when metaKey + dblclick on empty canvas area", async () => {
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockMouseEvent();
			await handler.handleCanvasDblClick(evt);

			expect(quickCardCreator.createCardAtPosition).toHaveBeenCalledWith(
				canvasView.canvas,
				canvasView.file,
				expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
				"Untitled",
			);
		});

		it("creates card on canvas when ctrlKey + dblclick", async () => {
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			const evt = createMockMouseEvent({ metaKey: false, ctrlKey: true });
			await handler.handleCanvasDblClick(evt);

			expect(quickCardCreator.createCardAtPosition).toHaveBeenCalled();
		});

		it("shows error notice when createCardAtPosition throws", async () => {
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);
			(quickCardCreator.createCardAtPosition as Mock).mockRejectedValue(new Error("card error"));

			const evt = createMockMouseEvent();
			await handler.handleCanvasDblClick(evt);

			expect(noticeSpy).toHaveBeenCalledWith("Failed to create card: card error");
		});
	});

	describe("createNewCardAtOrigin", () => {
		it("does nothing when no active canvas", async () => {
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(null);
			await handler.createNewCardAtOrigin();
			expect(quickCardCreator.createCardAtPosition).not.toHaveBeenCalled();
		});

		it("creates card at origin (0,0)", async () => {
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);

			await handler.createNewCardAtOrigin();

			expect(quickCardCreator.createCardAtPosition).toHaveBeenCalledWith(
				canvasView.canvas,
				canvasView.file,
				{ x: 0, y: 0 },
				"Untitled",
			);
		});

		it("shows error notice when createCardAtPosition throws", async () => {
			const canvasView = createMockCanvasView();
			(canvasObserver.getActiveCanvasView as Mock).mockReturnValue(canvasView);
			(quickCardCreator.createCardAtPosition as Mock).mockRejectedValue(new Error("origin error"));

			await handler.createNewCardAtOrigin();

			expect(noticeSpy).toHaveBeenCalledWith("Failed to create card: origin error");
		});
	});
});
