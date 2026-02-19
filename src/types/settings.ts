export interface HeptabaseSettings {
	extractedFilesFolder: string;
	defaultNodeWidth: number;
	defaultNodeHeight: number;
	fileNamePrefix: string;
	leaveBacklink: boolean;
	defaultEdgeColor: string;
	defaultEdgeLabel: string;
	enableEdgeSync: boolean;
	quickCardDefaultTitle: string;
	recursiveDecomposition: boolean;
	showPreviewBeforeCreate: boolean;
	dropMode: "reference" | "extract";
	multiDropLayout: "grid" | "horizontal" | "vertical";
	multiDropColumns: number;
	multiDropGap: number;
}

export const DEFAULT_SETTINGS: HeptabaseSettings = {
	extractedFilesFolder: "",
	defaultNodeWidth: 400,
	defaultNodeHeight: 300,
	fileNamePrefix: "",
	leaveBacklink: false,
	defaultEdgeColor: "",
	defaultEdgeLabel: "",
	enableEdgeSync: true,
	quickCardDefaultTitle: "Untitled",
	recursiveDecomposition: false,
	showPreviewBeforeCreate: false,
	dropMode: "reference",
	multiDropLayout: "grid",
	multiDropColumns: 3,
	multiDropGap: 40,
};
