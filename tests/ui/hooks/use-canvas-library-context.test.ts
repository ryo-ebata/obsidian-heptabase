import type { CanvasView } from "@/types/obsidian-canvas";
import { useCanvasLibraryContext } from "@/ui/hooks/use-canvas-library-context";
import { act, renderHook } from "@testing-library/react";
import { TFile } from "obsidian";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useCanvasLibraryContext", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it("tracks files on the Canvas and the selected file", () => {
		const selectedFile = new TFile("Research/Graph.md");
		const view = {
			file: new TFile("Board.canvas"),
			canvas: {
				getData: () => ({
					nodes: [
						{ id: "a", type: "file", file: "Research/Graph.md" },
						{ id: "b", type: "text", text: "Idea" },
					],
					edges: [],
				}),
				selection: new Set([{ id: "a", file: selectedFile }]),
			},
		} as unknown as CanvasView;

		const { result } = renderHook(() => useCanvasLibraryContext(view));

		expect(result.current.inCanvasPaths.has("Research/Graph.md")).toBe(true);
		expect(result.current.selectedPaths.has("Research/Graph.md")).toBe(true);
	});

	it("updates when the Canvas selection changes", () => {
		const selection = new Set<{ id: string; file: TFile }>();
		const view = {
			file: new TFile("Board.canvas"),
			canvas: {
				getData: () => ({ nodes: [], edges: [] }),
				selection,
			},
		} as unknown as CanvasView;
		const { result } = renderHook(() => useCanvasLibraryContext(view));

		selection.add({ id: "a", file: new TFile("Selected.md") });
		act(() => vi.advanceTimersByTime(160));

		expect(result.current.selectedPaths.has("Selected.md")).toBe(true);
	});

	it("resolves a selected file from persisted Canvas data when the runtime node has no file", () => {
		const view = {
			file: new TFile("Board.canvas"),
			canvas: {
				getData: () => ({
					nodes: [{ id: "a", type: "file", file: "Projects/Direction.md" }],
					edges: [],
				}),
				selection: new Set([{ id: "a" }]),
			},
		} as unknown as CanvasView;

		const { result } = renderHook(() => useCanvasLibraryContext(view));

		expect(result.current.selectedPaths.has("Projects/Direction.md")).toBe(true);
	});
});
