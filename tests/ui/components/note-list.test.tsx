import type { SearchResult } from "@/types/plugin";
import { NoteList } from "@/ui/components/note-list";
import { render, screen } from "@testing-library/react";
import { TFile } from "obsidian";
import React from "react";
import { describe, expect, it } from "vitest";

describe("NoteList", () => {
	it("renders a list of notes from search results", () => {
		const results: SearchResult[] = [
			{
				file: new TFile("note1.md") as never,
				headings: [
					{
						heading: "Heading A",
						level: 1,
						position: {
							start: { line: 0, col: 0, offset: 0 },
							end: { line: 0, col: 11, offset: 11 },
						},
					},
				],
			},
			{
				file: new TFile("note2.md") as never,
				headings: [
					{
						heading: "Heading B",
						level: 2,
						position: {
							start: { line: 0, col: 0, offset: 0 },
							end: { line: 0, col: 11, offset: 11 },
						},
					},
				],
			},
		];

		render(<NoteList results={results} />);

		expect(screen.getByText("note1")).toBeDefined();
		expect(screen.getByText("note2")).toBeDefined();
	});

	it("shows a message when results are empty", () => {
		render(<NoteList results={[]} />);
		expect(screen.getByText("No notes found.")).toBeDefined();
	});

	it("applies muted text styling when empty", () => {
		const { container } = render(<NoteList results={[]} />);
		const empty = container.querySelector(".text-ob-muted");
		expect(empty).not.toBeNull();
		expect(empty?.classList.contains("text-center")).toBe(true);
	});
});
