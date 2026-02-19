import type { HeptabaseSettings } from "@/types/settings";
import { SidebarContainer } from "@/ui/components/sidebar-container";
import type { PluginContextValue } from "@/ui/context";
import { PluginContext } from "@/ui/context";
import type { App } from "obsidian";
import { ItemView, type WorkspaceLeaf } from "obsidian";
import React from "react";
import { type Root, createRoot } from "react-dom/client";

export const VIEW_TYPE_HEADING_EXPLORER = "heading-explorer-view";

export class HeadingExplorerView extends ItemView {
	private root: Root | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly appInstance: App,
		private readonly settings: HeptabaseSettings,
	) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_HEADING_EXPLORER;
	}

	getDisplayText(): string {
		return "Heading Explorer";
	}

	getIcon(): string {
		return "layout-grid";
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		container.empty();

		const contextValue: PluginContextValue = {
			app: this.appInstance,
			settings: this.settings,
		};

		this.root = createRoot(container);
		this.root.render(
			React.createElement(
				PluginContext.Provider,
				{ value: contextValue },
				React.createElement(SidebarContainer),
			),
		);
	}

	async onClose(): Promise<void> {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
	}
}
