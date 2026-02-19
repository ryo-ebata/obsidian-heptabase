import type { SearchResult } from "@/types/plugin";
import { CardGrid } from "@/ui/components/card-grid";
import { render, screen } from "@testing-library/react";
import { TFile } from "obsidian";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

let mockObserve: ReturnType<typeof vi.fn>;
let mockDisconnect: ReturnType<typeof vi.fn>;

beforeEach(() => {
	mockObserve = vi.fn();
	mockDisconnect = vi.fn();

	class MockIntersectionObserver {
		constructor(_cb: IntersectionObserverCallback) {}
		observe = mockObserve;
		disconnect = mockDisconnect;
		unobserve = vi.fn();
	}

	vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("CardGrid", () => {
	const wrapper = createWrapper();

	it("renders a grid of note cards from search results", () => {
		const results: SearchResult[] = [
			{
				file: new TFile("note1.md") as never,
				excerpt: "Content of note 1",
			},
			{
				file: new TFile("note2.md") as never,
				excerpt: "Content of note 2",
			},
		];

		render(<CardGrid results={results} />, { wrapper });

		expect(screen.getByText("note1")).toBeDefined();
		expect(screen.getByText("note2")).toBeDefined();
	});

	it("shows a message when results are empty", () => {
		render(<CardGrid results={[]} />, { wrapper });
		expect(screen.getByText("No notes found.")).toBeDefined();
	});

	it("applies muted text styling when empty", () => {
		const { container } = render(<CardGrid results={[]} />, { wrapper });
		const empty = container.querySelector(".text-ob-muted");
		expect(empty).not.toBeNull();
		expect(empty?.classList.contains("text-center")).toBe(true);
	});

	it("renders with grid layout classes", () => {
		const results: SearchResult[] = [
			{
				file: new TFile("note1.md") as never,
				excerpt: "Content",
			},
		];

		const { container } = render(<CardGrid results={results} />, { wrapper });
		const grid = container.querySelector(".grid.grid-cols-2.gap-2");
		expect(grid).not.toBeNull();
	});

	it("renders only first page of items for large result sets", () => {
		const results: SearchResult[] = Array.from({ length: 50 }, (_, i) => ({
			file: new TFile(`note-${i}.md`) as never,
			excerpt: `Content ${i}`,
		}));

		const { container } = render(<CardGrid results={results} />, { wrapper });
		const cards = container.querySelectorAll("[draggable]");
		expect(cards.length).toBeLessThan(50);
		expect(cards.length).toBe(20);
	});

	it("renders sentinel element when there are more items", () => {
		const results: SearchResult[] = Array.from({ length: 50 }, (_, i) => ({
			file: new TFile(`note-${i}.md`) as never,
			excerpt: `Content ${i}`,
		}));

		const { container } = render(<CardGrid results={results} />, { wrapper });
		const sentinel = container.querySelector("[data-testid='sentinel']");
		expect(sentinel).not.toBeNull();
	});

	it("does not render sentinel when all items are visible", () => {
		const results: SearchResult[] = [
			{
				file: new TFile("note1.md") as never,
				excerpt: "Content",
			},
		];

		const { container } = render(<CardGrid results={results} />, { wrapper });
		const sentinel = container.querySelector("[data-testid='sentinel']");
		expect(sentinel).toBeNull();
	});
});
