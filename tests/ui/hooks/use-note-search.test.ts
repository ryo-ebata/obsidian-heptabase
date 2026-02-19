import { useNoteSearch } from "@/ui/hooks/use-note-search";
import { act, renderHook } from "@testing-library/react";
import { App, TFile } from "obsidian";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

describe("useNoteSearch", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("loads all notes on initial mount", async () => {
		const app = new App();
		const file = new TFile("notes/hello.md");
		(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
		(app.metadataCache.getFileCache as Mock).mockReturnValue({});

		const { result } = renderHook(() => useNoteSearch(), { wrapper: createWrapper(app) });

		await act(async () => {});

		expect(result.current.query).toBe("");
		expect(result.current.results).toHaveLength(1);
		expect(result.current.results[0].file).toBe(file);
	});

	it("updates the search query with setQuery", () => {
		const { result } = renderHook(() => useNoteSearch(), { wrapper: createWrapper() });

		act(() => {
			result.current.setQuery("test");
		});

		expect(result.current.query).toBe("test");
	});

	it("executes search after debounce", async () => {
		const app = new App();
		const file = new TFile("notes/test.md");
		(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
		(app.metadataCache.getFileCache as Mock).mockReturnValue({});
		(app.vault.read as Mock).mockResolvedValue("");

		const { result } = renderHook(() => useNoteSearch(), { wrapper: createWrapper(app) });

		await act(async () => {});

		act(() => {
			result.current.setQuery("test");
		});

		await act(async () => {
			vi.advanceTimersByTime(300);
		});

		await act(async () => {});

		expect(result.current.results).toHaveLength(1);
		expect(result.current.results[0].file).toBe(file);
	});

	it("resets the previous timer when a new query is entered during debounce", async () => {
		const app = new App();
		const file = new TFile("notes/test.md");
		(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
		(app.metadataCache.getFileCache as Mock).mockReturnValue({});
		(app.vault.read as Mock).mockResolvedValue("");

		const { result } = renderHook(() => useNoteSearch(), { wrapper: createWrapper(app) });

		await act(async () => {});

		act(() => {
			result.current.setQuery("xyz");
		});

		act(() => {
			vi.advanceTimersByTime(200);
		});

		act(() => {
			result.current.setQuery("test");
		});

		expect(result.current.query).toBe("test");

		await act(async () => {
			vi.advanceTimersByTime(300);
		});

		await act(async () => {});

		expect(result.current.results).toHaveLength(1);
		expect(result.current.results[0].file).toBe(file);
	});
});
