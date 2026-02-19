import type { HeptabaseSettings } from "@/types/settings";
import type { App } from "obsidian";
import { createContext } from "react";

export interface PluginContextValue {
	app: App;
	settings: HeptabaseSettings;
}

export const PluginContext = createContext<PluginContextValue | null>(null);

export interface SidebarActionsValue {
	openInArticle: (filePath: string) => void;
}

export const SidebarActionsContext = createContext<SidebarActionsValue | null>(null);
