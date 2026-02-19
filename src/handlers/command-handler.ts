import type { CanvasObserver } from "@/services/canvas-observer";
import type { CanvasOperator } from "@/services/canvas-operator";
import type { HeptabaseSettings } from "@/types/settings";
import { Notice } from "obsidian";

export class CommandHandler {
	constructor(
		private settings: HeptabaseSettings,
		private canvasObserver: CanvasObserver,
		private canvasOperator: CanvasOperator,
	) {}

	connectSelectedNodes(): void {
		const selectedNodes = this.canvasObserver.getSelectedNodes();
		if (selectedNodes.length !== 2) {
			new Notice("Select exactly 2 nodes to connect");
			return;
		}

		const canvasView = this.canvasObserver.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		this.canvasOperator.addEdgeToCanvas(canvasView.canvas, {
			fromNode: selectedNodes[0].id,
			toNode: selectedNodes[1].id,
			color: this.settings.defaultEdgeColor || undefined,
			label: this.settings.defaultEdgeLabel || undefined,
		});

		new Notice("Connected selected nodes");
	}

	groupSelectedNodes(): void {
		const selectedNodes = this.canvasObserver.getSelectedNodes();
		if (selectedNodes.length === 0) {
			new Notice("Select at least 1 node to group");
			return;
		}

		const canvasView = this.canvasObserver.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		this.canvasOperator.addGroupToCanvas(canvasView.canvas, selectedNodes);
		new Notice("Grouped selected nodes");
	}
}
