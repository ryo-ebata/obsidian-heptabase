import type { App } from "obsidian";
import { createRoot } from "react-dom/client";

import { DEFAULT_SETTINGS } from "@/types/settings";
import { PluginContext } from "@/ui/context";
import { SidebarContainer } from "@/ui/components/sidebar-container";

import { createMockApp } from "./mock-app";
import "../styles.css";

const mockApp = createMockApp() as unknown as App;

const root = document.getElementById("root");
if (!root) {
	throw new Error("Root element not found");
}

createRoot(root).render(
	<PluginContext.Provider value={{ app: mockApp, settings: DEFAULT_SETTINGS }}>
		<SidebarContainer />
	</PluginContext.Provider>,
);
