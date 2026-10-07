import { CanvasHistory } from "@/services/canvas-history";
import type { Canvas, CanvasData } from "@/types/obsidian-canvas";
import { describe, expect, it, vi } from "vitest";

function createCanvas(): { canvas: Canvas; data: CanvasData } {
	const data: CanvasData = { nodes: [], edges: [] };
	const canvas = {
		getData: vi.fn(() => data),
		setData: vi.fn((next: CanvasData) => {
			data.nodes = next.nodes;
			data.edges = next.edges;
		}),
		requestSave: vi.fn(),
	} as unknown as Canvas;
	return { canvas, data };
}

describe("CanvasHistory", () => {
	it("returns false when there is no history", () => {
		const history = new CanvasHistory();
		const { canvas } = createCanvas();

		expect(history.undo(canvas)).toBe(false);
		expect(history.redo(canvas)).toBe(false);
	});

	it("does not record a no-op change", () => {
		const history = new CanvasHistory();
		const { canvas } = createCanvas();
		const snapshot = { nodes: [], edges: [] };

		history.record(canvas, snapshot, snapshot);

		expect(history.undo(canvas)).toBe(false);
	});

	it("undoes and redoes a change using cloned snapshots", () => {
		const history = new CanvasHistory();
		const { canvas, data } = createCanvas();
		const before = { nodes: [], edges: [] };
		const after = {
			nodes: [{ id: "node-1", type: "text" as const, x: 0, y: 0, width: 100, height: 80 }],
			edges: [],
		};

		history.record(canvas, before, after);
		expect(history.undo(canvas)).toBe(true);
		expect(data.nodes).toEqual([]);
		expect(history.redo(canvas)).toBe(true);
		expect(data.nodes[0]?.id).toBe("node-1");
		expect(canvas.requestSave).toHaveBeenCalledTimes(2);

		after.nodes[0]!.id = "mutated-after-record";
		expect(data.nodes[0]?.id).toBe("node-1");
	});

	it("publishes undo and redo availability changes", () => {
		const history = new CanvasHistory();
		const { canvas } = createCanvas();
		const states: { canUndo: boolean; canRedo: boolean }[] = [];
		const unsubscribe = history.subscribe(canvas, () => states.push(history.getState(canvas)));

		history.record(
			canvas,
			{ nodes: [], edges: [] },
			{ nodes: [{ id: "a", type: "text", x: 0, y: 0, width: 10, height: 10 }], edges: [] },
		);
		history.undo(canvas);
		history.redo(canvas);
		unsubscribe();

		expect(states).toEqual([
			{ canUndo: true, canRedo: false },
			{ canUndo: false, canRedo: true },
			{ canUndo: true, canRedo: false },
		]);
	});

	it("discards redo history after a new change", () => {
		const history = new CanvasHistory();
		const { canvas } = createCanvas();

		history.record(
			canvas,
			{ nodes: [], edges: [] },
			{
				nodes: [],
				edges: [{ id: "edge-1", fromNode: "a", fromSide: "right", toNode: "b", toSide: "left" }],
			},
		);
		expect(history.undo(canvas)).toBe(true);
		history.record(
			canvas,
			{ nodes: [], edges: [] },
			{ nodes: [{ id: "node-1", type: "text", x: 0, y: 0, width: 10, height: 10 }], edges: [] },
		);

		expect(history.redo(canvas)).toBe(false);
	});

	it("bounds memory usage to the latest 100 changes", () => {
		const history = new CanvasHistory();
		const { canvas } = createCanvas();

		for (let index = 0; index < 101; index += 1) {
			history.record(
				canvas,
				{ nodes: [], edges: [] },
				{
					nodes: [{ id: `node-${index}`, type: "text", x: 0, y: 0, width: 10, height: 10 }],
					edges: [],
				},
			);
		}

		let undoCount = 0;
		while (history.undo(canvas)) undoCount += 1;
		expect(undoCount).toBe(100);
	});
});
