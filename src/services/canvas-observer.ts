import type { CanvasNode, CanvasView } from "@/types/obsidian-canvas";
import type { App } from "obsidian";

export class CanvasObserver {
	constructor(private app: App) {}

	getActiveCanvasView(): CanvasView | null {
		const canvasLeaves = this.app.workspace.getLeavesOfType("canvas");
		const firstLeaf = canvasLeaves[0];
		if (!firstLeaf) {
			return null;
		}

		const canvasView = firstLeaf.view as unknown as CanvasView;
		if (!canvasView?.canvas) {
			return null;
		}

		return canvasView;
	}

	getSelectedNodes(): CanvasNode[] {
		const canvasView = this.getActiveCanvasView();
		if (!canvasView) {
			return [];
		}

		const selection = canvasView.canvas.selection;
		if (!selection) {
			return [];
		}

		return Array.from(selection);
	}
}
