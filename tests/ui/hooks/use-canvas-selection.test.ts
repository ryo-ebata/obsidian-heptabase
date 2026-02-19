import type { CanvasNode } from "@/types/obsidian-canvas";
import { useCanvasSelection } from "@/ui/hooks/use-canvas-selection";
import { act, renderHook } from "@testing-library/react";
import { App } from "obsidian";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCanvasView } from "../../helpers/create-mock-canvas-view";
import { createWrapper } from "../../helpers/create-wrapper";

describe("useCanvasSelection", () => {
	let app: App;

	beforeEach(() => {
		vi.useFakeTimers();
		app = new App();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns empty array when no canvas is open", () => {
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);

		const { result } = renderHook(() => useCanvasSelection(), {
			wrapper: createWrapper(app),
		});

		expect(result.current).toEqual([]);
	});

	it("returns selected nodes from canvas", () => {
		const node1: CanvasNode = { id: "n1", x: 0, y: 0, width: 400, height: 300 };
		const node2: CanvasNode = { id: "n2", x: 500, y: 0, width: 400, height: 300 };
		const canvasView = createMockCanvasView([node1, node2]);
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		const { result } = renderHook(() => useCanvasSelection(), {
			wrapper: createWrapper(app),
		});

		expect(result.current).toHaveLength(2);
	});

	it("returns empty array when canvas has no selection", () => {
		const canvasView = createMockCanvasView([]);
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		const { result } = renderHook(() => useCanvasSelection(), {
			wrapper: createWrapper(app),
		});

		expect(result.current).toEqual([]);
	});

	it("updates selection on polling interval", () => {
		const node1: CanvasNode = { id: "n1", x: 0, y: 0, width: 400, height: 300 };
		const canvasView = createMockCanvasView([]);
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		const { result } = renderHook(() => useCanvasSelection(), {
			wrapper: createWrapper(app),
		});

		expect(result.current).toEqual([]);

		canvasView.canvas.selection = new Set([node1]);
		act(() => {
			vi.advanceTimersByTime(500);
		});

		expect(result.current).toHaveLength(1);
		expect(result.current[0].id).toBe("n1");
	});

	it("updates when selection has same length but different node IDs", () => {
		const node1: CanvasNode = { id: "n1", x: 0, y: 0, width: 400, height: 300 };
		const node2: CanvasNode = { id: "n2", x: 0, y: 0, width: 400, height: 300 };
		const canvasView = createMockCanvasView([node1]);
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		const { result } = renderHook(() => useCanvasSelection(), {
			wrapper: createWrapper(app),
		});

		expect(result.current).toHaveLength(1);
		expect(result.current[0]!.id).toBe("n1");

		canvasView.canvas.selection = new Set([node2]);
		act(() => {
			vi.advanceTimersByTime(500);
		});

		expect(result.current).toHaveLength(1);
		expect(result.current[0]!.id).toBe("n2");
	});

	it("does not re-render when selection is the same", () => {
		const node1: CanvasNode = { id: "n1", x: 0, y: 0, width: 400, height: 300 };
		const canvasView = createMockCanvasView([node1]);
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		let renderCount = 0;
		const { result } = renderHook(
			() => {
				renderCount++;
				return useCanvasSelection();
			},
			{ wrapper: createWrapper(app) },
		);

		expect(result.current).toHaveLength(1);
		const countAfterMount = renderCount;

		act(() => {
			vi.advanceTimersByTime(500);
		});

		expect(renderCount).toBe(countAfterMount);
	});

	it("cleans up interval on unmount", () => {
		const canvasView = createMockCanvasView([]);
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		const { unmount } = renderHook(() => useCanvasSelection(), {
			wrapper: createWrapper(app),
		});

		const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
		unmount();

		expect(clearIntervalSpy).toHaveBeenCalled();
		clearIntervalSpy.mockRestore();
	});
});
