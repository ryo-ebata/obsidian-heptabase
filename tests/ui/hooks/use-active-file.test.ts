import { useActiveFile } from "@/ui/hooks/use-active-file";
import { PluginContext, type PluginContextValue } from "@/ui/context";
import { DEFAULT_SETTINGS } from "@/types/settings";
import { renderHook, act } from "@testing-library/react";
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

describe("useActiveFile", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
	});

	it("returns null when no file is open", () => {
		app.workspace.getActiveViewOfType = vi.fn().mockReturnValue(null);

		const { result } = renderHook(() => useActiveFile(), {
			wrapper: createWrapper(app),
		});

		expect(result.current).toBeNull();
	});

	it("returns the active file when a markdown file is open", () => {
		const file = new TFile("notes/active.md");
		app.workspace.getActiveViewOfType = vi.fn().mockReturnValue({ file });

		const { result } = renderHook(() => useActiveFile(), {
			wrapper: createWrapper(app),
		});

		expect(result.current).toBe(file);
	});

	it("updates when file-open event fires", () => {
		const file1 = new TFile("notes/first.md");
		const file2 = new TFile("notes/second.md");
		app.workspace.getActiveViewOfType = vi.fn().mockReturnValue({ file: file1 });

		let fileOpenCallback: ((file: TFile | null) => void) | null = null;
		app.workspace.on = vi
			.fn()
			.mockImplementation((event: string, cb: (file: TFile | null) => void) => {
				if (event === "file-open") {
					fileOpenCallback = cb;
				}
				return { id: "mock-event-ref" };
			});

		const { result } = renderHook(() => useActiveFile(), {
			wrapper: createWrapper(app),
		});

		expect(result.current).toBe(file1);

		app.workspace.getActiveViewOfType = vi.fn().mockReturnValue({ file: file2 });
		act(() => {
			fileOpenCallback?.(file2);
		});

		expect(result.current).toBe(file2);
	});
});
