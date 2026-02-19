import { SearchBar } from "@/ui/components/search-bar";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

describe("SearchBar", () => {
	it("renders the input field", () => {
		render(<SearchBar query="" onQueryChange={vi.fn()} />);
		expect(screen.getByPlaceholderText("Search notes...")).toBeDefined();
	});

	it("reflects the query property", () => {
		render(<SearchBar query="test query" onQueryChange={vi.fn()} />);
		const input = screen.getByPlaceholderText("Search notes...") as HTMLInputElement;
		expect(input.value).toBe("test query");
	});

	it("calls onQueryChange on input", () => {
		const onQueryChange = vi.fn();
		render(<SearchBar query="" onQueryChange={onQueryChange} />);
		const input = screen.getByPlaceholderText("Search notes...");

		fireEvent.change(input, { target: { value: "new query" } });

		expect(onQueryChange).toHaveBeenCalledWith("new query");
	});

	it("applies heading-explorer-search class", () => {
		const { container } = render(<SearchBar query="" onQueryChange={vi.fn()} />);
		expect(container.querySelector(".heading-explorer-search")).not.toBeNull();
	});
});
