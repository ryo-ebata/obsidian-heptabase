import type { HeptabaseSettings } from "@/types/settings";
import type { App } from "obsidian";
import { createContext } from "react";

export interface PluginContextValue {
	app: App;
	settings: HeptabaseSettings;
}

export const PluginContext = createContext<PluginContextValue | null>(null);
