import type { CanvasObserver } from "@/services/canvas-observer";
import type { CanvasLayoutAction, CanvasOperator } from "@/services/canvas-operator";
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
		if (selectedNodes[0]!.id === selectedNodes[1]!.id) {
			new Notice("Select two different nodes to connect");
			return;
		}

		const canvasView = this.canvasObserver.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		const added = this.canvasOperator.addEdgeToCanvas(canvasView.canvas, {
			fromNode: selectedNodes[0]!.id,
			toNode: selectedNodes[1]!.id,
			color: this.settings.defaultEdgeColor || undefined,
			label: this.settings.defaultEdgeLabel || undefined,
		});

		new Notice(added ? "Connected selected nodes" : "These nodes are already connected");
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

	alignSelectedNodesLeft(): void {
		this.arrangeSelectedNodes("align-left", 2, "Aligned selected nodes to the left");
	}

	alignSelectedNodesTop(): void {
		this.arrangeSelectedNodes("align-top", 2, "Aligned selected nodes to the top");
	}

	distributeSelectedNodesHorizontally(): void {
		this.arrangeSelectedNodes(
			"distribute-horizontal",
			3,
			"Distributed selected nodes horizontally",
		);
	}

	distributeSelectedNodesVertically(): void {
		this.arrangeSelectedNodes("distribute-vertical", 3, "Distributed selected nodes vertically");
	}

	undoLastCanvasChange(): void {
		const canvasView = this.canvasObserver.getActiveCanvasView();
		if (!canvasView || !this.canvasOperator.undo(canvasView.canvas)) {
			new Notice("Nothing to undo");
			return;
		}
		new Notice("Undid last Canvas change");
	}

	redoLastCanvasChange(): void {
		const canvasView = this.canvasObserver.getActiveCanvasView();
		if (!canvasView || !this.canvasOperator.redo(canvasView.canvas)) {
			new Notice("Nothing to redo");
			return;
		}
		new Notice("Redid Canvas change");
	}

	private arrangeSelectedNodes(
		action: CanvasLayoutAction,
		minimumNodes: number,
		successMessage: string,
	): void {
		const selectedNodes = this.canvasObserver.getSelectedNodes();
		if (selectedNodes.length < minimumNodes) {
			new Notice(`Select at least ${minimumNodes} nodes to arrange`);
			return;
		}

		const canvasView = this.canvasObserver.getActiveCanvasView();
		if (!canvasView) return;

		const changed = this.canvasOperator.arrangeNodes(
			canvasView.canvas,
			selectedNodes.map((node) => node.id),
			action,
		);
		new Notice(changed ? successMessage : "Selected nodes are already arranged");
	}
}
