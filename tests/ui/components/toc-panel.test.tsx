import { DEFAULT_SETTINGS } from "@/types/settings";
import { TocPanel } from "@/ui/components/toc-panel";
import { PluginContext, type PluginContextValue } from "@/ui/context";
import { render, screen } from "@testing-library/react";
import { App, TFile } from "obsidian";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

function createWrapper(app: App) {
	const contextValue: PluginContextValue = {
		app,
		settings: DEFAULT_SETTINGS,
	};
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(PluginContext.Provider, { value: contextValue }, children);
	};
}

describe("TocPanel", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
	});

	it("shows empty message when no file is active", () => {
		render(<TocPanel activeFile={null} />, { wrapper: createWrapper(app) });
		expect(screen.getByText("No file open")).toBeDefined();
	});

	it("shows file name when a file is active", () => {
		const file = new TFile("notes/test.md");
		app.metadataCache.getFileCache = vi.fn().mockReturnValue({
			headings: [
				{
					heading: "Introduction",
					level: 1,
					position: {
						start: { line: 0, col: 0, offset: 0 },
						end: { line: 0, col: 16, offset: 16 },
					},
				},
			],
		});

		render(<TocPanel activeFile={file} />, { wrapper: createWrapper(app) });
		expect(screen.getByText("test")).toBeDefined();
	});

	it("renders headings for the active file", () => {
		const file = new TFile("notes/test.md");
		app.metadataCache.getFileCache = vi.fn().mockReturnValue({
			headings: [
				{
					heading: "Section A",
					level: 2,
					position: {
						start: { line: 2, col: 0, offset: 10 },
						end: { line: 2, col: 13, offset: 23 },
					},
				},
				{
					heading: "Section B",
					level: 2,
					position: {
						start: { line: 5, col: 0, offset: 40 },
						end: { line: 5, col: 13, offset: 53 },
					},
				},
			],
		});

		render(<TocPanel activeFile={file} />, { wrapper: createWrapper(app) });
		expect(screen.getByText("Section A")).toBeDefined();
		expect(screen.getByText("Section B")).toBeDefined();
	});

	it("shows empty message when file has no headings", () => {
		const file = new TFile("notes/empty.md");
		app.metadataCache.getFileCache = vi.fn().mockReturnValue({ headings: [] });

		render(<TocPanel activeFile={file} />, { wrapper: createWrapper(app) });
		expect(screen.getByText("No headings found")).toBeDefined();
	});

	it("applies panel layout classes to container", () => {
		const { container } = render(<TocPanel activeFile={null} />, {
			wrapper: createWrapper(app),
		});
		expect(container.querySelector(".p-2.h-full.overflow-y-auto")).not.toBeNull();
	});

	it("applies indentation based on heading level", () => {
		const file = new TFile("notes/test.md");
		app.metadataCache.getFileCache = vi.fn().mockReturnValue({
			headings: [
				{
					heading: "Deep Heading",
					level: 3,
					position: {
						start: { line: 0, col: 0, offset: 0 },
						end: { line: 0, col: 17, offset: 17 },
					},
				},
			],
		});

		const { container } = render(<TocPanel activeFile={file} />, {
			wrapper: createWrapper(app),
		});
		const heading = container.querySelector(".cursor-pointer.rounded") as HTMLElement;
		expect(heading.style.paddingLeft).toBe("32px");
	});
});
