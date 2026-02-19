import { HeadingExplorer } from "@/ui/components/heading-explorer";
import type { PluginContextValue } from "@/ui/context";
import { PluginContext } from "@/ui/context";
import { render, screen } from "@testing-library/react";
import { App } from "obsidian";
import React from "react";
import { describe, expect, it, vi } from "vitest";

function renderWithContext() {
	const app = new App();
	app.vault.getMarkdownFiles = vi.fn().mockReturnValue([]);
	const contextValue: PluginContextValue = {
		app: app as never,
		settings: {
			extractedFilesFolder: "",
			defaultNodeWidth: 400,
			defaultNodeHeight: 300,
			fileNamePrefix: "",
			leaveBacklink: false,
		},
	};
	return render(
		<PluginContext.Provider value={contextValue}>
			<HeadingExplorer />
		</PluginContext.Provider>,
	);
}

describe("HeadingExplorer", () => {
	it("renders the search bar", () => {
		renderWithContext();
		expect(screen.getByPlaceholderText("Search notes...")).toBeDefined();
	});

	it("renders a root container with heading-explorer-container class", () => {
		const { container } = renderWithContext();
		expect(container.querySelector(".heading-explorer-container")).not.toBeNull();
	});
});
