import type { NoteDragData, ParsedHeading } from "@/types/plugin";
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

	it("applies margin-bottom to note container", () => {
		const { container } = render(<NoteItem file={file} headings={headings} />);
		expect(container.querySelector(".mb-1")).not.toBeNull();
	});

	it("has rotate class when collapsed", () => {
		const { container } = render(<NoteItem file={file} headings={headings} />);
		const icon = container.querySelector(".flex.transition-transform");
		expect(icon?.classList.contains("-rotate-90")).toBe(true);
	});

	describe("note dragging", () => {
		it("has draggable attribute on note title", () => {
			const { container } = render(<NoteItem file={file} headings={headings} />);
			const title = container.querySelector(".cursor-pointer.rounded");
			expect(title?.getAttribute("draggable")).toBe("true");
		});

		it("sets NoteDragData on drag start", () => {
			const { container } = render(<NoteItem file={file} headings={headings} />);
			const title = container.querySelector(".cursor-pointer.rounded");

			let capturedData: NoteDragData | null = null;
			const dataTransfer = {
				setData: (_type: string, data: string) => {
					capturedData = JSON.parse(data);
				},
				effectAllowed: "",
			};

			expect(title).not.toBeNull();
			if (title) {
				fireEvent.dragStart(title, { dataTransfer });
			}

			expect(capturedData).not.toBeNull();
			expect(capturedData!.type).toBe("note-drag");
			expect(capturedData!.filePath).toBe("my-note.md");
		});

		it("applies opacity while dragging", () => {
			const { container } = render(<NoteItem file={file} headings={headings} />);
			const title = container.querySelector(".cursor-pointer.rounded");

			expect(title).not.toBeNull();
			if (title) {
				fireEvent.dragStart(title, {
					dataTransfer: { setData: () => {}, effectAllowed: "" },
				});
				expect(title.classList.contains("opacity-50")).toBe(true);

				fireEvent.dragEnd(title);
				expect(title.classList.contains("opacity-50")).toBe(false);
			}
		});

		it("still allows click to expand when note has headings", () => {
			render(<NoteItem file={file} headings={headings} />);

			fireEvent.click(screen.getByText("my-note"));
			expect(screen.getByText("Section One")).toBeDefined();
		});
	});
});
