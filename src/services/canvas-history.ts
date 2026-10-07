import type { Canvas, CanvasData, CanvasEdgeData, CanvasNodeData } from "@/types/obsidian-canvas";

interface CollectionPatch<T extends { id: string }> {
	removeIds: string[];
	upserts: Array<{
		item: T;
		previousId?: string;
		nextId?: string;
	}>;
}

interface CanvasPatch {
	nodes: CollectionPatch<CanvasNodeData>;
	edges: CollectionPatch<CanvasEdgeData>;
}

interface HistoryEntry {
	undo: CanvasPatch;
	redo: CanvasPatch;
	size: number;
}

const MAX_HISTORY_ENTRIES = 100;
const MAX_HISTORY_BYTES = 4 * 1024 * 1024;

const clone = <T>(value: T): T => structuredClone(value);

export class CanvasHistory {
	private readonly undoStacks = new WeakMap<Canvas, HistoryEntry[]>();
	private readonly redoStacks = new WeakMap<Canvas, HistoryEntry[]>();
	private readonly listeners = new WeakMap<Canvas, Set<() => void>>();

	record(canvas: Canvas, before: CanvasData, after: CanvasData): void {
		const undo = createCanvasPatch(after, before);
		const redo = createCanvasPatch(before, after);
		if (isEmptyPatch(redo)) return;

		const entry = { undo, redo, size: JSON.stringify({ undo, redo }).length * 2 };
		const undoStack = this.undoStacks.get(canvas) ?? [];
		undoStack.push(entry);
		while (
			undoStack.length > 1 &&
			(undoStack.length > MAX_HISTORY_ENTRIES ||
				undoStack.reduce((total, candidate) => total + candidate.size, 0) > MAX_HISTORY_BYTES)
		) {
			undoStack.shift();
		}
		this.undoStacks.set(canvas, undoStack);
		this.redoStacks.delete(canvas);
		this.emit(canvas);
	}

	undo(canvas: Canvas): boolean {
		const undoStack = this.undoStacks.get(canvas);
		const entry = undoStack?.pop();
		if (!entry) return false;
		this.apply(canvas, entry.undo);
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
		this.apply(canvas, entry.redo);
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

	private apply(canvas: Canvas, patch: CanvasPatch): void {
		const current = canvas.getData();
		canvas.setData({
			nodes: applyCollectionPatch(current.nodes, patch.nodes),
			edges: applyCollectionPatch(current.edges, patch.edges),
		});
		canvas.requestSave();
	}

	private emit(canvas: Canvas): void {
		for (const listener of this.listeners.get(canvas) ?? []) listener();
	}
}

function createCanvasPatch(source: CanvasData, target: CanvasData): CanvasPatch {
	return {
		nodes: createCollectionPatch(source.nodes, target.nodes),
		edges: createCollectionPatch(source.edges, target.edges),
	};
}

function createCollectionPatch<T extends { id: string }>(
	source: T[],
	target: T[],
): CollectionPatch<T> {
	const sourceById = new Map(source.map((item) => [item.id, item]));
	const targetIds = new Set(target.map((item) => item.id));
	return {
		removeIds: source.filter((item) => !targetIds.has(item.id)).map((item) => item.id),
		upserts: target
			.map((item, index) => ({ item, index }))
			.filter(({ item }) => {
				const previous = sourceById.get(item.id);
				return !previous || JSON.stringify(previous) !== JSON.stringify(item);
			})
			.map(({ item, index }) => ({
				item: clone(item),
				previousId: target[index - 1]?.id,
				nextId: target[index + 1]?.id,
			})),
	};
}

function applyCollectionPatch<T extends { id: string }>(
	current: T[],
	patch: CollectionPatch<T>,
): T[] {
	const removed = new Set(patch.removeIds);
	const upserts = new Map(patch.upserts.map(({ item }) => [item.id, item]));
	const existingIds = new Set(current.map((item) => item.id));
	const result = current
		.filter((item) => !removed.has(item.id))
		.map((item) => clone(upserts.get(item.id) ?? item));
	for (const { item, previousId, nextId } of patch.upserts) {
		if (existingIds.has(item.id)) continue;
		const nextIndex = nextId ? result.findIndex((candidate) => candidate.id === nextId) : -1;
		if (nextIndex >= 0) {
			result.splice(nextIndex, 0, clone(item));
			continue;
		}
		const previousIndex = previousId
			? result.findIndex((candidate) => candidate.id === previousId)
			: -1;
		result.splice(previousIndex >= 0 ? previousIndex + 1 : result.length, 0, clone(item));
	}
	return result;
}

function isEmptyPatch(patch: CanvasPatch): boolean {
	return (
		patch.nodes.removeIds.length === 0 &&
		patch.nodes.upserts.length === 0 &&
		patch.edges.removeIds.length === 0 &&
		patch.edges.upserts.length === 0
	);
}
