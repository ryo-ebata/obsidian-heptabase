import type { ParsedHeading } from "@/types/plugin";
import { NoteItem } from "@/ui/components/note-item";
import { fireEvent, render, screen } from "@testing-library/react";
import { TFile } from "obsidian";
import React from "react";
import { describe, expect, it } from "vitest";

describe("NoteItem", () => {
	const file = new TFile("my-note.md");
	const headings: ParsedHeading[] = [
		{
			heading: "Section One",
			level: 2,
			position: {
				start: { line: 2, col: 0, offset: 10 },
				end: { line: 2, col: 15, offset: 25 },
			},
		},
		{
			heading: "Section Two",
			level: 2,
			position: {
				start: { line: 5, col: 0, offset: 40 },
				end: { line: 5, col: 15, offset: 55 },
			},
		},
	];

	it("renders the note name (basename)", () => {
		render(<NoteItem file={file} headings={headings} />);
		expect(screen.getByText("my-note")).toBeDefined();
	});

	it("is collapsed by default (headings are hidden)", () => {
		render(<NoteItem file={file} headings={headings} />);
		expect(screen.queryByText("Section One")).toBeNull();
	});

	it("expands and shows headings on click", () => {
		render(<NoteItem file={file} headings={headings} />);

		fireEvent.click(screen.getByText("my-note"));

		expect(screen.getByText("Section One")).toBeDefined();
		expect(screen.getByText("Section Two")).toBeDefined();
	});

	it("collapses on second click", () => {
		render(<NoteItem file={file} headings={headings} />);

		fireEvent.click(screen.getByText("my-note"));
		expect(screen.getByText("Section One")).toBeDefined();

		fireEvent.click(screen.getByText("my-note"));
		expect(screen.queryByText("Section One")).toBeNull();
	});

	it("applies heading-explorer-note class", () => {
		const { container } = render(<NoteItem file={file} headings={headings} />);
		expect(container.querySelector(".heading-explorer-note")).not.toBeNull();
	});

	it("has is-collapsed class when collapsed", () => {
		const { container } = render(<NoteItem file={file} headings={headings} />);
		const icon = container.querySelector(".collapse-icon");
		expect(icon?.classList.contains("is-collapsed")).toBe(true);
	});
});
