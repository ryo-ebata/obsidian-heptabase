import { useCanvasView } from "@/ui/hooks/use-canvas-view";
import { act, renderHook } from "@testing-library/react";
import { App } from "obsidian";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCanvasView } from "../../helpers/create-mock-canvas-view";
import { createWrapper } from "../../helpers/create-wrapper";

describe("useCanvasView", () => {
	let app: App;

	beforeEach(() => {
		vi.useFakeTimers();
		app = new App();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns null when no canvas is open", () => {
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);

		const { result } = renderHook(() => useCanvasView(), {
			wrapper: createWrapper(app),
		});

		expect(result.current).toBeNull();
	});

	it("returns canvas view when canvas is open", () => {
		const canvasView = createMockCanvasView();
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		const { result } = renderHook(() => useCanvasView(), {
			wrapper: createWrapper(app),
		});

		expect(result.current).not.toBeNull();
		expect(result.current?.file.path).toBe("test.canvas");
	});

	it("updates when canvas view changes", () => {
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);

		const { result } = renderHook(() => useCanvasView(), {
			wrapper: createWrapper(app),
		});

		expect(result.current).toBeNull();

		const canvasView = createMockCanvasView();
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		act(() => {
			vi.advanceTimersByTime(500);
		});

		expect(result.current).not.toBeNull();
	});

	it("does not re-render when canvas view path is the same", () => {
		const canvasView = createMockCanvasView();
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		let renderCount = 0;
		const { result } = renderHook(
			() => {
				renderCount++;
				return useCanvasView();
			},
			{ wrapper: createWrapper(app) },
		);

		expect(result.current).not.toBeNull();
		const countAfterMount = renderCount;

		act(() => {
			vi.advanceTimersByTime(500);
		});

		expect(renderCount).toBe(countAfterMount);
	});

	it("cleans up interval on unmount", () => {
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);

		const { unmount } = renderHook(() => useCanvasView(), {
			wrapper: createWrapper(app),
		});

		const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
		unmount();

		expect(clearIntervalSpy).toHaveBeenCalled();
		clearIntervalSpy.mockRestore();
	});
});
