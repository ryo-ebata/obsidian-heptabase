import { BacklinkWriter } from "@/services/backlink-writer";
import { CanvasObserver } from "@/services/canvas-observer";
import { CanvasOperator } from "@/services/canvas-operator";
import { ContentExtractor } from "@/services/content-extractor";
import { EdgeSync } from "@/services/edge-sync";
import { FileCreator } from "@/services/file-creator";
import { PreviewBridge } from "@/services/preview-bridge";
import { QuickCardCreator } from "@/services/quick-card-creator";
import type { HeptabaseSettings } from "@/types/settings";
import type { App } from "obsidian";

export interface Services {
	contentExtractor: ContentExtractor;
	fileCreator: FileCreator;
	canvasOperator: CanvasOperator;
	canvasObserver: CanvasObserver;
	backlinkWriter: BacklinkWriter;
	quickCardCreator: QuickCardCreator;
	edgeSync: EdgeSync;
	previewBridge: PreviewBridge;
}

export function createServices(app: App, settings: HeptabaseSettings): Services {
	const contentExtractor = new ContentExtractor();
	const fileCreator = new FileCreator(app, settings);
	const canvasOperator = new CanvasOperator(app, settings);
	const canvasObserver = new CanvasObserver(app);
	const backlinkWriter = new BacklinkWriter(app);
	const quickCardCreator = new QuickCardCreator(fileCreator, canvasOperator);
	const edgeSync = new EdgeSync(app, settings.connectionsSectionName);
	const previewBridge = new PreviewBridge();

	return {
		contentExtractor,
		fileCreator,
		canvasOperator,
		canvasObserver,
		backlinkWriter,
		quickCardCreator,
		edgeSync,
		previewBridge,
	};
}
