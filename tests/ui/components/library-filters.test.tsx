import { LibraryFilters } from "@/ui/components/library-filters";
import type { SearchResult } from "@/types/plugin";
import { fireEvent, render, screen } from "@testing-library/react";
import { TFile } from "obsidian";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const results: SearchResult[] = [
	{
		file: new TFile("research/Alpha.md"),
		excerpt: "",
		headings: [],
		tags: ["research", "idea"],
		folder: "research",
	},
	{
		file: new TFile("inbox/Beta.md"),
		excerpt: "",
		headings: [],
		tags: ["idea"],
		folder: "inbox",
	},
];

describe("LibraryFilters", () => {
	it("renders deduplicated tag and folder choices", () => {
		render(
			<LibraryFilters
				results={results}
				tag=""
				folder=""
				sort="updated"
				resultCount={2}
				onTagChange={vi.fn()}
				onFolderChange={vi.fn()}
				onSortChange={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Filter and sort cards" }));
		expect(screen.getByRole("option", { name: "#idea" })).toBeDefined();
		expect(screen.getByRole("option", { name: "#research" })).toBeDefined();
		expect(screen.getByRole("option", { name: "inbox" })).toBeDefined();
		expect(screen.getByText("2 cards")).toBeDefined();
	});

	it("reports filter and sort changes", () => {
		const onTagChange = vi.fn();
		const onFolderChange = vi.fn();
		const onSortChange = vi.fn();
		render(
			<LibraryFilters
				results={results}
				tag=""
				folder=""
				sort="updated"
				resultCount={2}
				onTagChange={onTagChange}
				onFolderChange={onFolderChange}
				onSortChange={onSortChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Filter and sort cards" }));
		fireEvent.change(screen.getByLabelText("Filter by tag"), { target: { value: "idea" } });
		fireEvent.change(screen.getByLabelText("Filter by folder"), {
			target: { value: "research" },
		});
		fireEvent.change(screen.getByLabelText("Sort cards"), {
			target: { value: "title-asc" },
		});

		expect(onTagChange).toHaveBeenCalledWith("idea");
		expect(onFolderChange).toHaveBeenCalledWith("research");
		expect(onSortChange).toHaveBeenCalledWith("title-asc");
	});

	it("uses a singular result label for one card", () => {
		render(
			<LibraryFilters
				results={results}
				tag=""
				folder=""
				sort="updated"
				resultCount={1}
				onTagChange={vi.fn()}
				onFolderChange={vi.fn()}
				onSortChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("1 card")).toBeDefined();
	});

	it("shows active conditions as individually removable chips", () => {
		const onTagChange = vi.fn();
		const onFolderChange = vi.fn();
		const onSortChange = vi.fn();
		render(
			<LibraryFilters
				results={results}
				tag="idea"
				folder="research"
				sort="title-asc"
				resultCount={1}
				onTagChange={onTagChange}
				onFolderChange={onFolderChange}
				onSortChange={onSortChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Remove tag idea" }));
		fireEvent.click(screen.getByRole("button", { name: "Remove folder research" }));
		fireEvent.click(screen.getByRole("button", { name: "Reset sort order" }));
		expect(onTagChange).toHaveBeenCalledWith("");
		expect(onFolderChange).toHaveBeenCalledWith("");
		expect(onSortChange).toHaveBeenCalledWith("updated");
	});

	it("limits the library to the current Canvas", () => {
		const onCanvasOnlyChange = vi.fn();
		render(
			<LibraryFilters
				results={results}
				tag=""
				folder=""
				sort="updated"
				resultCount={2}
				hasCanvas
				onTagChange={vi.fn()}
				onFolderChange={vi.fn()}
				onSortChange={vi.fn()}
				onCanvasOnlyChange={onCanvasOnlyChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Filter and sort cards" }));
		fireEvent.click(screen.getByRole("checkbox", { name: "Current Canvas" }));
		expect(onCanvasOnlyChange).toHaveBeenCalledWith(true);
	});

	it("closes the popover with Escape and returns focus to the trigger", () => {
		render(
			<LibraryFilters
				results={results}
				tag=""
				folder=""
				sort="updated"
				resultCount={2}
				onTagChange={vi.fn()}
				onFolderChange={vi.fn()}
				onSortChange={vi.fn()}
			/>,
		);
		const trigger = screen.getByRole("button", { name: "Filter and sort cards" });
		fireEvent.click(trigger);
		fireEvent.keyDown(screen.getByLabelText("Filter by tag"), { key: "Escape" });

		expect(trigger.getAttribute("aria-expanded")).toBe("false");
		expect(document.activeElement).toBe(trigger);
	});

	it("closes the popover after an outside click", () => {
		render(
			<LibraryFilters
				results={results}
				tag=""
				folder=""
				sort="updated"
				resultCount={2}
				onTagChange={vi.fn()}
				onFolderChange={vi.fn()}
				onSortChange={vi.fn()}
			/>,
		);
		const trigger = screen.getByRole("button", { name: "Filter and sort cards" });
		fireEvent.click(trigger);
		fireEvent.mouseDown(document.body);

		expect(trigger.getAttribute("aria-expanded")).toBe("false");
	});
});
