export interface HeptabaseSettings {
	extractedFilesFolder: string;
	defaultNodeWidth: number;
	defaultNodeHeight: number;
	fileNamePrefix: string;
	leaveBacklink: boolean;
}

export const DEFAULT_SETTINGS: HeptabaseSettings = {
	extractedFilesFolder: "",
	defaultNodeWidth: 400,
	defaultNodeHeight: 300,
	fileNamePrefix: "",
	leaveBacklink: false,
};
