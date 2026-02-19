export interface HeptabaseSettings {
	extractedFilesFolder: string;
	defaultNodeWidth: number;
	defaultNodeHeight: number;
	fileNamePrefix: string;
	defaultEdgeColor: string;
	defaultEdgeLabel: string;
	enableEdgeSync: boolean;
	quickCardDefaultTitle: string;
	showPreviewBeforeCreate: boolean;
}

export const DEFAULT_SETTINGS: HeptabaseSettings = {
	extractedFilesFolder: "",
	defaultNodeWidth: 400,
	defaultNodeHeight: 300,
	fileNamePrefix: "",
	defaultEdgeColor: "",
	defaultEdgeLabel: "",
	enableEdgeSync: true,
	quickCardDefaultTitle: "Untitled",
	showPreviewBeforeCreate: false,
};
