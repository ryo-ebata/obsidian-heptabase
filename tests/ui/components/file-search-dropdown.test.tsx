import { FileSearchDropdown } from "@/ui/components/file-search-dropdown";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { App, TFile } from "obsidian";
import React from "react";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

describe("FileSearchDropdown", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders search input", () => {
		render(<FileSearchDropdown onSelect={vi.fn()} />, { wrapper: createWrapper(app) });
		expect(screen.getByPlaceholderText("Search articles...")).toBeDefined();
	});

	it("shows no results when query is empty", () => {
		render(<FileSearchDropdown onSelect={vi.fn()} />, { wrapper: createWrapper(app) });
		expect(screen.queryByRole("listitem")).toBeNull();
	});

	it("shows matching files after debounce", async () => {
		const file1 = new TFile("notes/hello.md");
		const file2 = new TFile("notes/world.md");
		(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2]);

		render(<FileSearchDropdown onSelect={vi.fn()} />, { wrapper: createWrapper(app) });

		fireEvent.change(screen.getByPlaceholderText("Search articles..."), {
			target: { value: "hello" },
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		expect(screen.getByText("notes/hello.md")).toBeDefined();
		expect(screen.queryByText("notes/world.md")).toBeNull();
	});

	it("calls onSelect when a file is clicked", async () => {
		const file1 = new TFile("notes/hello.md");
		(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1]);
		const onSelect = vi.fn();

		render(<FileSearchDropdown onSelect={onSelect} />, { wrapper: createWrapper(app) });

		fireEvent.change(screen.getByPlaceholderText("Search articles..."), {
			target: { value: "hello" },
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		fireEvent.click(screen.getByText("notes/hello.md"));
		expect(onSelect).toHaveBeenCalledWith(file1);
	});
});
