import type { App } from "obsidian";
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { DEFAULT_SETTINGS } from "@/types/settings";
import { CanvasOperator } from "@/services/canvas-operator";
import { PluginContext } from "@/ui/context";
import { SidebarContainer } from "@/ui/components/sidebar-container";

import { createMockApp } from "./mock-app";
import "../styles.css";

const mockApp = createMockApp() as unknown as App;
const canvasOperator = new CanvasOperator(mockApp, DEFAULT_SETTINGS);

class DevErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
	state = { error: null as Error | null };

	static getDerivedStateFromError(error: Error): { error: Error } {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo): void {
		console.error("Development preview failed", error, info);
	}

	render(): ReactNode {
		if (this.state.error) {
			return (
				<pre className="p-3 whitespace-pre-wrap text-ob-ui-small">
					{this.state.error.stack ?? this.state.error.message}
				</pre>
			);
		}
		return this.props.children;
	}
}

const root = document.getElementById("root");
if (!root) {
	throw new Error("Root element not found");
}

createRoot(root).render(
	<PluginContext.Provider value={{ app: mockApp, settings: DEFAULT_SETTINGS, canvasOperator }}>
		<DevErrorBoundary>
			<SidebarContainer />
		</DevErrorBoundary>
	</PluginContext.Provider>,
);
