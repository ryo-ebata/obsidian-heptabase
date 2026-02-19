import { DEFAULT_SETTINGS, type HeptabaseSettings } from "@/types/settings";
import {
	PluginContext,
	type PluginContextValue,
	SidebarActionsContext,
	type SidebarActionsValue,
} from "@/ui/context";
import { App } from "obsidian";
import type { ReactNode } from "react";
import React from "react";
import { vi } from "vitest";

export function createWrapper(
	app?: App,
	settings?: HeptabaseSettings,
	sidebarActions?: SidebarActionsValue,
) {
	const contextValue: PluginContextValue = {
		app: app ?? new App(),
		settings: settings ?? DEFAULT_SETTINGS,
	};
	const actionsValue: SidebarActionsValue = sidebarActions ?? {
		openInArticle: vi.fn(),
	};
	return function Wrapper({ children }: { children: ReactNode }) {
		return React.createElement(
			PluginContext.Provider,
			{ value: contextValue },
			React.createElement(SidebarActionsContext.Provider, { value: actionsValue }, children),
		);
	};
}
