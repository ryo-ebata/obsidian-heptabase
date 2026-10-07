import type { Canvas, CanvasData } from "@/types/obsidian-canvas";

interface HistoryEntry {
	before: CanvasData;
	after: CanvasData;
}

const MAX_HISTORY_ENTRIES = 100;

const clone = (data: CanvasData): CanvasData => structuredClone(data);

export class CanvasHistory {
	private readonly undoStacks = new WeakMap<Canvas, HistoryEntry[]>();
	private readonly redoStacks = new WeakMap<Canvas, HistoryEntry[]>();
	private readonly listeners = new WeakMap<Canvas, Set<() => void>>();

	record(canvas: Canvas, before: CanvasData, after: CanvasData): void {
		if (JSON.stringify(before) === JSON.stringify(after)) return;
		const undoStack = this.undoStacks.get(canvas) ?? [];
		undoStack.push({ before: clone(before), after: clone(after) });
		if (undoStack.length > MAX_HISTORY_ENTRIES) undoStack.shift();
		this.undoStacks.set(canvas, undoStack);
		this.redoStacks.delete(canvas);
		this.emit(canvas);
	}

	undo(canvas: Canvas): boolean {
		const undoStack = this.undoStacks.get(canvas);
		const entry = undoStack?.pop();
		if (!entry) return false;
		canvas.setData(clone(entry.before));
		canvas.requestSave();
		const redoStack = this.redoStacks.get(canvas) ?? [];
		redoStack.push(entry);
		this.redoStacks.set(canvas, redoStack);
		this.emit(canvas);
		return true;
	}

	redo(canvas: Canvas): boolean {
		const redoStack = this.redoStacks.get(canvas);
		const entry = redoStack?.pop();
		if (!entry) return false;
		canvas.setData(clone(entry.after));
		canvas.requestSave();
		const undoStack = this.undoStacks.get(canvas) ?? [];
		undoStack.push(entry);
		this.undoStacks.set(canvas, undoStack);
		this.emit(canvas);
		return true;
	}

	getState(canvas: Canvas): { canUndo: boolean; canRedo: boolean } {
		return {
			canUndo: (this.undoStacks.get(canvas)?.length ?? 0) > 0,
			canRedo: (this.redoStacks.get(canvas)?.length ?? 0) > 0,
		};
	}

	subscribe(canvas: Canvas, listener: () => void): () => void {
		const listeners = this.listeners.get(canvas) ?? new Set();
		listeners.add(listener);
		this.listeners.set(canvas, listeners);
		return () => listeners.delete(listener);
	}

	private emit(canvas: Canvas): void {
		for (const listener of this.listeners.get(canvas) ?? []) listener();
	}
}
