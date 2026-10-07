import { useCanvasState } from "@/ui/hooks/use-canvas-state";
import { act, renderHook } from "@testing-library/react";
import { App, TFile } from "obsidian";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCanvasView } from "../../helpers/create-mock-canvas-view";
import { createWrapper } from "../../helpers/create-wrapper";

describe("useCanvasState", () => {
	let app: App;

	beforeEach(() => {
		vi.useFakeTimers();
		app = new App();
	});

	afterEach(() => vi.useRealTimers());

	it("returns an empty state when no Canvas is open", () => {
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);
		const { result } = renderHook(() => useCanvasState(), { wrapper: createWrapper(app) });

		expect(result.current.canvasView).toBeNull();
		expect(result.current.selectedNodes).toEqual([]);
	});

	it("tracks Canvas files and resolves selected paths from persisted data", () => {
		const view = createMockCanvasView([{ id: "a", x: 0, y: 0, width: 100, height: 80 }]);
		view.canvas.getData = vi.fn().mockReturnValue({
			nodes: [{ id: "a", type: "file", file: "Projects/Direction.md" }],
			edges: [],
		});
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view }]);

		const { result } = renderHook(() => useCanvasState(), { wrapper: createWrapper(app) });

		expect(result.current.inCanvasPaths.has("Projects/Direction.md")).toBe(true);
		expect(result.current.selectedPaths.has("Projects/Direction.md")).toBe(true);
	});

	it("updates selection from the shared polling loop", () => {
		const view = createMockCanvasView();
		view.canvas.selection = new Set();
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view }]);
		const { result } = renderHook(() => useCanvasState(), { wrapper: createWrapper(app) });

		view.canvas.selection.add({
			id: "selected",
			x: 0,
			y: 0,
			width: 100,
			height: 80,
			file: new TFile("Selected.md"),
		});
		act(() => vi.advanceTimersByTime(250));

		expect(result.current.selectedPaths.has("Selected.md")).toBe(true);
	});

	it("replaces a reopened Canvas view even when its path is unchanged", () => {
		const first = createMockCanvasView();
		const second = createMockCanvasView();
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: first }]);
		const { result } = renderHook(() => useCanvasState(), { wrapper: createWrapper(app) });

		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: second }]);
		act(() => vi.advanceTimersByTime(250));

		expect(result.current.canvasView).toBe(second);
	});

	it("refreshes selected node geometry without requiring a selection change", () => {
		const node = { id: "a", x: 0, y: 0, width: 100, height: 80 };
		const view = createMockCanvasView([node]);
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view }]);
		let renderCount = 0;
		const { result } = renderHook(
			() => {
				renderCount++;
				return useCanvasState();
			},
			{ wrapper: createWrapper(app) },
		);
		const initialRenderCount = renderCount;

		node.x = 240;
		act(() => vi.advanceTimersByTime(250));

		expect(result.current.selectedNodes[0]?.x).toBe(240);
		expect(renderCount).toBeGreaterThan(initialRenderCount);
	});

	it("cleans up its only polling interval", () => {
		const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
		const { unmount } = renderHook(() => useCanvasState(), { wrapper: createWrapper(app) });
		unmount();

		expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
	});
});
