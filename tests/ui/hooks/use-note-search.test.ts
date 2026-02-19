import type { PluginContextValue } from "@/ui/context";
import { PluginContext } from "@/ui/context";
import { useNoteSearch } from "@/ui/hooks/use-note-search";
import { act, renderHook } from "@testing-library/react";
import { App } from "obsidian";
import type { ReactNode } from "react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createWrapper() {
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
	return ({ children }: { children: ReactNode }) =>
		React.createElement(PluginContext.Provider, { value: contextValue }, children);
}

describe("useNoteSearch", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("loads all notes on initial mount", () => {
		const { result } = renderHook(() => useNoteSearch(), { wrapper: createWrapper() });

		expect(result.current.query).toBe("");
		expect(result.current.results).toEqual([]);
	});

	it("updates the search query with setQuery", () => {
		const { result } = renderHook(() => useNoteSearch(), { wrapper: createWrapper() });

		act(() => {
			result.current.setQuery("test");
		});

		expect(result.current.query).toBe("test");
	});

	it("executes search after debounce", () => {
		const { result } = renderHook(() => useNoteSearch(), { wrapper: createWrapper() });

		act(() => {
			result.current.setQuery("test");
		});

		expect(result.current.results).toEqual([]);

		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(result.current.results).toEqual([]);
	});

	it("resets the previous timer when a new query is entered during debounce", () => {
		const { result } = renderHook(() => useNoteSearch(), { wrapper: createWrapper() });

		act(() => {
			result.current.setQuery("te");
		});

		act(() => {
			vi.advanceTimersByTime(200);
		});

		act(() => {
			result.current.setQuery("test");
		});

		act(() => {
			vi.advanceTimersByTime(200);
		});

		expect(result.current.query).toBe("test");

		act(() => {
			vi.advanceTimersByTime(100);
		});

		expect(result.current.results).toEqual([]);
	});
});
