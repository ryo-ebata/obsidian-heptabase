export interface HeptabaseSettings {
	extractedFilesFolder: string;
	defaultNodeWidth: number;
	defaultNodeHeight: number;
	fileNamePrefix: string;
	leaveBacklink: boolean;
	defaultEdgeColor: string;
	defaultEdgeLabel: string;
}

export const DEFAULT_SETTINGS: HeptabaseSettings = {
	extractedFilesFolder: "",
	defaultNodeWidth: 400,
	defaultNodeHeight: 300,
	fileNamePrefix: "",
	leaveBacklink: false,
	defaultEdgeColor: "",
	defaultEdgeLabel: "",
};
