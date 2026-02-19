import type { BacklinkWriter } from "@/services/backlink-writer";
import type { CanvasObserver } from "@/services/canvas-observer";
import type { CanvasOperator } from "@/services/canvas-operator";
import type { ContentExtractor } from "@/services/content-extractor";
import type { FileCreator } from "@/services/file-creator";
import type { PreviewBridge } from "@/services/preview-bridge";
import type { Canvas, CanvasNode } from "@/types/obsidian-canvas";
import type { DragData, HeadingDragData, MultiHeadingDragData, NoteDragData } from "@/types/plugin";
import type { HeptabaseSettings } from "@/types/settings";
import { calculateGridPositions } from "@/utils/grid-layout";
import { notifyError } from "@/utils/notify-error";
import { Notice, TFile, type App } from "obsidian";

function getDropPosition(evt: DragEvent): { x: number; y: number } {
	/* v8 ignore next -- DragEvent always has clientX/clientY */
	return { x: evt.clientX ?? 0, y: evt.clientY ?? 0 };
}

export class DropHandler {
	constructor(
		private app: App,
		private settings: HeptabaseSettings,
		private canvasObserver: CanvasObserver,
		private canvasOperator: CanvasOperator,
		private contentExtractor: ContentExtractor,
		private fileCreator: FileCreator,
		private backlinkWriter: BacklinkWriter,
		private previewBridge?: PreviewBridge,
	) {}

	async handleCanvasDrop(evt: DragEvent): Promise<void> {
		const data = evt.dataTransfer?.getData("application/json");
		if (!data) {
			return;
		}

		let dragData: DragData;
		try {
			dragData = JSON.parse(data);
		} catch {
			return;
		}

		if (dragData.type === "note-drag") {
			await this.handleNoteDrop(evt, dragData);
		} else if (dragData.type === "heading-explorer-drag") {
			await this.handleHeadingDrop(evt, dragData);
		} else if (dragData.type === "multi-heading-drag") {
			await this.handleMultiHeadingDrop(evt, dragData);
		}
	}

	private async handleNoteDrop(evt: DragEvent, dragData: NoteDragData): Promise<void> {
		const canvasView = this.canvasObserver.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		try {
			const file = this.app.vault.getAbstractFileByPath(dragData.filePath);
			if (!(file instanceof TFile)) {
				new Notice("Source file not found");
				return;
			}

			this.canvasOperator.addNodeToCanvas(canvasView.canvas, file, getDropPosition(evt));

			new Notice(`Added "${file.basename}" to Canvas`);
		} catch (error) {
			notifyError("Failed to add note", error);
		}
	}

	private async handleHeadingDrop(evt: DragEvent, dragData: HeadingDragData): Promise<void> {
		const canvasView = this.canvasObserver.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		try {
			const sourceFile = this.app.vault.getAbstractFileByPath(dragData.filePath);
			if (!(sourceFile instanceof TFile)) {
				new Notice("Source file not found");
				return;
			}

			const content = await this.app.vault.read(sourceFile);
			const extracted = this.contentExtractor.extractContentWithHeading(
				content,
				dragData.headingLine,
				dragData.headingLevel,
			);

			const position = getDropPosition(evt);

			const createNode = async () => {
				const newFile = await this.fileCreator.createFile(
					dragData.headingText,
					extracted,
					sourceFile,
				);
				this.canvasOperator.addNodeToCanvas(canvasView.canvas, newFile, position);
				if (this.settings.leaveBacklink) {
					await this.backlinkWriter.replaceSection(
						sourceFile,
						dragData.headingLine,
						dragData.headingLevel,
						newFile.basename,
					);
				}
				new Notice(`Created "${newFile.basename}" on Canvas`);
			};

			if (this.settings.showPreviewBeforeCreate && this.previewBridge) {
				this.previewBridge.requestPreview(
					[dragData],
					[extracted],
					async (selectedIndices: number[]) => {
						if (selectedIndices.length === 0) {
							return;
						}
						try {
							await createNode();
						} catch (error) {
							notifyError("Failed to create node", error);
						}
					},
					() => {},
				);
				return;
			}

			await createNode();
		} catch (error) {
			notifyError("Failed to create node", error);
		}
	}

	private async handleMultiHeadingDrop(
		evt: DragEvent,
		dragData: MultiHeadingDragData,
	): Promise<void> {
		const canvasView = this.canvasObserver.getActiveCanvasView();
		if (!canvasView) {
			return;
		}

		try {
			const position = getDropPosition(evt);
			const items = dragData.items;
			const contents: string[] = [];

			for (const item of items) {
				const sourceFile = this.app.vault.getAbstractFileByPath(item.filePath);
				if (!(sourceFile instanceof TFile)) {
					contents.push("");
					continue;
				}
				const content = await this.app.vault.read(sourceFile);
				const extracted = this.contentExtractor.extractContentWithHeading(
					content,
					item.headingLine,
					item.headingLevel,
				);
				contents.push(extracted);
			}

			if (this.settings.showPreviewBeforeCreate && this.previewBridge) {
				this.previewBridge.requestPreview(
					items,
					contents,
					async (selectedIndices: number[]) => {
						try {
							await this.createMultipleNodes(
								items.filter((_, i) => selectedIndices.includes(i)),
								contents.filter((_, i) => selectedIndices.includes(i)),
								position,
								canvasView,
							);
						} catch (error) {
							notifyError("Failed to create nodes", error);
						}
					},
					() => {},
				);
				return;
			}

			await this.createMultipleNodes(items, contents, position, canvasView);
		} catch (error) {
			notifyError("Failed to create nodes", error);
		}
	}

	private async createMultipleNodes(
		items: HeadingDragData[],
		contents: string[],
		origin: { x: number; y: number },
		canvasView: { canvas: Canvas },
	): Promise<void> {
		const positions = calculateGridPositions(origin, items.length, {
			layout: this.settings.multiDropLayout,
			columns: this.settings.multiDropColumns,
			gap: this.settings.multiDropGap,
			nodeWidth: this.settings.defaultNodeWidth,
			nodeHeight: this.settings.defaultNodeHeight,
		});

		const createdNodes: CanvasNode[] = [];

		for (let i = 0; i < items.length; i++) {
			const item = items[i]!;
			const extracted = contents[i]!;
			const sourceFile = this.app.vault.getAbstractFileByPath(item.filePath);
			if (!(sourceFile instanceof TFile)) {
				continue;
			}

			const newFile = await this.fileCreator.createFile(item.headingText, extracted, sourceFile);

			const node = this.canvasOperator.addNodeToCanvas(canvasView.canvas, newFile, positions[i]!);

			if (node) {
				createdNodes.push(node);
			}

			if (this.settings.leaveBacklink) {
				await this.backlinkWriter.replaceSection(
					sourceFile,
					item.headingLine,
					item.headingLevel,
					newFile.basename,
				);
			}
		}

		if (createdNodes.length > 1) {
			this.canvasOperator.addGroupToCanvas(canvasView.canvas, createdNodes);
		}

		new Notice(`Created ${createdNodes.length} nodes on Canvas`);
	}
}
