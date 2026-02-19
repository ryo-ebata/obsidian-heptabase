import { DEFAULT_SETTINGS, type HeptabaseSettings } from "@/types/settings";
import { PluginContext, type PluginContextValue } from "@/ui/context";
import { App } from "obsidian";
import type { ReactNode } from "react";
import React from "react";

export function createWrapper(app?: App, settings?: HeptabaseSettings) {
	const contextValue: PluginContextValue = {
		app: app ?? new App(),
		settings: settings ?? DEFAULT_SETTINGS,
	};
	return function Wrapper({ children }: { children: ReactNode }) {
		return React.createElement(PluginContext.Provider, { value: contextValue }, children);
	};
}
