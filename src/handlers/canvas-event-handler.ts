import type { CanvasObserver } from "@/services/canvas-observer";
import type { QuickCardCreator } from "@/services/quick-card-creator";
import type { HeptabaseSettings } from "@/types/settings";
import { notifyError } from "@/utils/notify-error";
import { Notice } from "obsidian";

export class CanvasEventHandler {
	constructor(
		private settings: HeptabaseSettings,
		private canvasObserver: CanvasObserver,
		private quickCardCreator: QuickCardCreator,
	) {}

	async handleCanvasDblClick(evt: MouseEvent): Promise<void> {
		if (!evt.metaKey && !evt.ctrlKey) {
			return;
		}

		const target = evt.target as HTMLElement;
		if (!target.closest(".canvas-wrapper")) {
			return;
		}
		if (target.closest(".canvas-node")) {
			return;
		}

		const canvasView = this.canvasObserver.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		const position = canvasView.canvas.posFromEvt(evt);

		try {
			const file = await this.quickCardCreator.createCardAtPosition(
				canvasView.canvas,
				canvasView.file,
				position,
				this.settings.quickCardDefaultTitle,
			);
			new Notice(`Created "${file.basename}" on Canvas`);
		} catch (error) {
			notifyError("Failed to create card", error);
		}
	}

	async createNewCardAtOrigin(): Promise<void> {
		const canvasView = this.canvasObserver.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		try {
			const file = await this.quickCardCreator.createCardAtPosition(
				canvasView.canvas,
				canvasView.file,
				{ x: 0, y: 0 },
				this.settings.quickCardDefaultTitle,
			);
			new Notice(`Created "${file.basename}" on Canvas`);
		} catch (error) {
			notifyError("Failed to create card", error);
		}
	}
}
