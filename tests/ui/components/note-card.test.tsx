import type { NoteDragData } from "@/types/plugin";
import { NoteCard } from "@/ui/components/note-card";
import type { SidebarActionsValue } from "@/ui/context";
import { fireEvent, render, screen } from "@testing-library/react";
import { App, MarkdownRenderer, Menu, Notice, TFile } from "obsidian";
import React from "react";
import { type Mock, describe, expect, it, vi } from "vitest";
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

	it("title has font-medium class", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const title = container.querySelector(".truncate");
		expect(title).not.toBeNull();
		expect(title!.classList.contains("font-medium")).toBe(true);
	});

	it("uses subtle border with hover highlight", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const card = container.querySelector("[draggable]");
		expect(card!.classList.contains("border-ob-border-subtle")).toBe(true);
		expect(card!.classList.toString()).toContain("hover:border-ob-border");
	});

	it("has hover transition classes", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const card = container.querySelector("[draggable]");
		expect(card!.classList.contains("transition-all")).toBe(true);
		expect(card!.classList.contains("duration-200")).toBe(true);
	});

	it("shows context menu on right click", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const card = container.querySelector("[draggable]")!;

		fireEvent.contextMenu(card);

		const menu = Menu.lastInstance!;
		expect(menu.addItem).toHaveBeenCalledTimes(2);
		expect(menu.showAtMouseEvent).toHaveBeenCalled();
	});

	it("adds file to canvas via context menu", () => {
		const app = new App();
		const mockCanvas = {
			tx: 0,
			ty: 0,
			tZoom: 1,
			createFileNode: vi.fn(),
		};
		(app.workspace.getLeavesOfType as Mock).mockReturnValue([
			{ view: { canvas: mockCanvas } },
		]);

		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, {
			wrapper: createWrapper(app),
		});
		const card = container.querySelector("[draggable]")!;

		fireEvent.contextMenu(card);

		const menu = Menu.lastInstance!;
		const canvasItem = menu.items[0];
		const onClickCb = (canvasItem.onClick as Mock).mock.calls[0][0];
		onClickCb();

		expect(mockCanvas.createFileNode).toHaveBeenCalledWith(
			expect.objectContaining({
				file,
				save: true,
			}),
		);
	});

	it("shows notice when no canvas is open", () => {
		const app = new App();
		(app.workspace.getLeavesOfType as Mock).mockReturnValue([]);

		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, {
			wrapper: createWrapper(app),
		});
		const card = container.querySelector("[draggable]")!;

		fireEvent.contextMenu(card);

		const menu = Menu.lastInstance!;
		const canvasItem = menu.items[0];
		const onClickCb = (canvasItem.onClick as Mock).mock.calls[0][0];
		onClickCb();

		expect(Notice.lastInstance).not.toBeNull();
		expect(Notice.lastInstance!.message).toBe("No canvas is open");
	});

	it("calls openInArticle via context menu", () => {
		const openInArticle = vi.fn();
		const sidebarActions: SidebarActionsValue = { openInArticle };

		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, {
			wrapper: createWrapper(undefined, undefined, sidebarActions),
		});
		const card = container.querySelector("[draggable]")!;

		fireEvent.contextMenu(card);

		const menu = Menu.lastInstance!;
		const articleItem = menu.items[1];
		const onClickCb = (articleItem.onClick as Mock).mock.calls[0][0];
		onClickCb();

		expect(openInArticle).toHaveBeenCalledWith("my-note.md");
	});
});
