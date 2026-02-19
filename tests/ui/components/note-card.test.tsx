import type { NoteDragData } from "@/types/plugin";
import { NoteCard } from "@/ui/components/note-card";
import { fireEvent, render, screen } from "@testing-library/react";
import { MarkdownRenderer, TFile } from "obsidian";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

describe("NoteCard", () => {
	const file = new TFile("my-note.md");
	const excerpt = "First line of content\nSecond line\nThird line";
	const wrapper = createWrapper();

	it("renders the note name (basename)", () => {
		render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		expect(screen.getByText("my-note")).toBeDefined();
	});

	it("renders excerpt container when excerpt is provided", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const excerptEl = container.querySelector(".card-fade");
		expect(excerptEl).not.toBeNull();
	});

	it("calls MarkdownRenderer.render for excerpt", async () => {
		vi.mocked(MarkdownRenderer.render).mockClear();
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		await vi.waitFor(() => {
			expect(MarkdownRenderer.render).toHaveBeenCalledWith(
				expect.anything(),
				excerpt,
				container.querySelector(".card-fade"),
				file.path,
				expect.anything(),
			);
		});
	});

	it("does not render excerpt div when excerpt is empty", () => {
		const { container } = render(<NoteCard file={file} excerpt="" />, { wrapper });
		expect(container.querySelector(".card-fade")).toBeNull();
	});

	it("has draggable attribute", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const card = container.querySelector("[draggable]");
		expect(card?.getAttribute("draggable")).toBe("true");
	});

	it("sets NoteDragData on drag start", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const card = container.querySelector("[draggable]");

		let capturedData: NoteDragData | null = null;
		const dataTransfer = {
			setData: (_type: string, data: string) => {
				capturedData = JSON.parse(data);
			},
			effectAllowed: "",
		};

		expect(card).not.toBeNull();
		if (card) {
			fireEvent.dragStart(card, { dataTransfer });
		}

		expect(capturedData).not.toBeNull();
		expect(capturedData!.type).toBe("note-drag");
		expect(capturedData!.filePath).toBe("my-note.md");
	});

	it("applies opacity while dragging", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const card = container.querySelector("[draggable]");

		expect(card).not.toBeNull();
		if (card) {
			fireEvent.dragStart(card, {
				dataTransfer: { setData: () => {}, effectAllowed: "" },
			});
			expect(card.classList.contains("opacity-50")).toBe(true);

			fireEvent.dragEnd(card);
			expect(card.classList.contains("opacity-50")).toBe(false);
		}
	});

	it("has card styling with border", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const card = container.querySelector(".border");
		expect(card).not.toBeNull();
	});

	it("title does not have font-medium class", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const title = container.querySelector(".truncate");
		expect(title).not.toBeNull();
		expect(title!.classList.contains("font-medium")).toBe(false);
	});
});
