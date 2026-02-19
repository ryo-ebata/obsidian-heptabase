import type { PluginContextValue } from "@/ui/context";
import { PluginContext } from "@/ui/context";
import { useHeadings } from "@/ui/hooks/use-headings";
import { renderHook } from "@testing-library/react";
import { App, TFile } from "obsidian";
import type { ReactNode } from "react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

function createWrapper(app?: App) {
	const mockApp = app ?? new App();
	const contextValue: PluginContextValue = {
		app: mockApp as never,
		settings: {
			extractedFilesFolder: "",
			defaultNodeWidth: 400,
			defaultNodeHeight: 300,
			fileNamePrefix: "",
			leaveBacklink: false,
		},
	};
	return ({ children }: { children: ReactNode }) =>
		React.createElement(PluginContext.Provider, { value: contextValue }, children);
}

describe("useHeadings", () => {
	it("returns headings for the specified file", () => {
		const app = new App();
		const mockHeadings = [
			{
				heading: "Title",
				level: 1,
				position: {
					start: { line: 0, col: 0, offset: 0 },
					end: { line: 0, col: 7, offset: 7 },
				},
			},
		];
		app.metadataCache.getFileCache = vi.fn().mockReturnValue({ headings: mockHeadings });
		const file = new TFile("test.md");

		const { result } = renderHook(() => useHeadings(file), {
			wrapper: createWrapper(app),
		});

		expect(result.current).toEqual(mockHeadings);
	});

	it("returns an empty array when cache is not available", () => {
		const app = new App();
		app.metadataCache.getFileCache = vi.fn().mockReturnValue(null);
		const file = new TFile("test.md");

		const { result } = renderHook(() => useHeadings(file), {
			wrapper: createWrapper(app),
		});

		expect(result.current).toEqual([]);
	});
});
