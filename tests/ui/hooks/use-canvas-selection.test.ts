import { useCanvasSelection } from "@/ui/hooks/use-canvas-selection";
import { PluginContext, type PluginContextValue } from "@/ui/context";
import { DEFAULT_SETTINGS } from "@/types/settings";
import type { Canvas, CanvasNode, CanvasView } from "@/types/obsidian-canvas";
import { renderHook } from "@testing-library/react";
import { App, TFile } from "obsidian";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

function createWrapper(app: App) {
	const contextValue: PluginContextValue = {
		app,
		settings: DEFAULT_SETTINGS,
	};
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(PluginContext.Provider, { value: contextValue }, children);
	};
}

function createMockCanvasView(selectedNodes: CanvasNode[] = []): CanvasView {
	const canvas: Canvas = {
		getData: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
		setData: vi.fn(),
		requestSave: vi.fn(),
		createFileNode: vi.fn(),
		selection: new Set(selectedNodes),
	};
	return {
		canvas,
		file: new TFile("test.canvas"),
	};
}

describe("useCanvasSelection", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
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
});
