import type { NoteDragData } from "@/types/plugin";
import type { ParsedHeading, TextSelectionDragData } from "@/types/plugin";
import { NoteCard } from "@/ui/components/note-card";
import type { SidebarActionsValue } from "@/ui/context";
import { fireEvent, render, screen } from "@testing-library/react";
import { App, Component, MarkdownRenderer, Menu, Notice, TFile } from "obsidian";
import React from "react";
import { type Mock, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

describe("NoteCard", () => {
	const file = new TFile("my-note.md");
	const excerpt = "First line of content\nSecond line\nThird line";
	const wrapper = createWrapper();
	const headings: ParsedHeading[] = [
		{
			heading: "Setup",
			level: 2,
			position: {
				start: { line: 2, col: 0, offset: 0 },
				end: { line: 2, col: 8, offset: 8 },
			},
		},
	];

	it("renders the note name (basename)", () => {
		render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		expect(screen.getByText("my-note")).toBeDefined();
	});

	it("marks a card that is selected on the current Canvas", () => {
		const { container } = render(
			<NoteCard file={file} excerpt={excerpt} isInCanvas isCanvasSelected />,
			{ wrapper },
		);
		const card = container.querySelector(".heptabase-note-card");
		expect(card?.classList.contains("is-in-canvas")).toBe(true);
		expect(card?.classList.contains("is-canvas-selected")).toBe(true);
		expect(card?.getAttribute("aria-current")).toBe("true");
		expect(screen.getByLabelText("On current Canvas")).toBeDefined();
	});

	it("highlights a matching title fragment", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} query="note" />, {
			wrapper,
		});
		expect(container.querySelector("mark.heptabase-search-match")?.textContent).toBe("note");
	});

	it("does not repeat a first heading that matches the note title", () => {
		const duplicateHeading = { ...headings[0]!, heading: "my-note" };
		render(<NoteCard file={file} excerpt={excerpt} headings={[duplicateHeading]} />, { wrapper });
		expect(screen.queryByRole("button", { name: "Drag heading my-note" })).toBeNull();
	});

	it("opens the article from the card title", () => {
		const openInArticle = vi.fn();
		render(<NoteCard file={file} excerpt={excerpt} />, {
			wrapper: createWrapper(undefined, undefined, { openInArticle }),
		});

		fireEvent.click(screen.getByRole("link", { name: "my-note" }));
		expect(openInArticle).toHaveBeenCalledWith("my-note.md");
	});

	it("opens the article from the card title with Space", () => {
		const openInArticle = vi.fn();
		render(<NoteCard file={file} excerpt={excerpt} />, {
			wrapper: createWrapper(undefined, undefined, { openInArticle }),
		});

		fireEvent.keyDown(screen.getByRole("link", { name: "my-note" }), { key: " " });
		expect(openInArticle).toHaveBeenCalledWith("my-note.md");
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
				expect.any(HTMLElement),
				file.path,
				expect.anything(),
			);
		});
		expect(container.querySelector(".card-fade")).not.toBeNull();
		expect(Component.lastInstance?.load).toHaveBeenCalledOnce();
	});

	it("unloads the markdown component when the card leaves the view", async () => {
		const { unmount } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		await vi.waitFor(() => expect(Component.lastInstance?.load).toHaveBeenCalledOnce());
		const component = Component.lastInstance;

		unmount();

		expect(component?.unload).toHaveBeenCalledOnce();
	});

	it("falls back to readable text when markdown rendering fails", async () => {
		vi.mocked(MarkdownRenderer.render).mockRejectedValueOnce(new Error("render failed"));
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });

		await vi.waitFor(() => {
			expect(container.querySelector(".card-fade")?.textContent).toBe(excerpt);
		});
	});

	it("does not let a stale markdown render replace a newer excerpt", async () => {
		let finishFirstRender: (() => void) | undefined;
		const firstRender = new Promise<void>((resolve) => {
			finishFirstRender = resolve;
		});
		vi.mocked(MarkdownRenderer.render)
			.mockImplementationOnce(async (_app, markdown, element) => {
				await firstRender;
				element.textContent = markdown;
			})
			.mockImplementationOnce(async (_app, markdown, element) => {
				element.textContent = markdown;
			});

		const { container, rerender } = render(<NoteCard file={file} excerpt="Older excerpt" />, {
			wrapper,
		});
		rerender(<NoteCard file={file} excerpt="Newest excerpt" />);

		await vi.waitFor(() => {
			expect(container.querySelector(".card-fade")?.textContent).toBe("Newest excerpt");
		});
		finishFirstRender?.();
		await firstRender;

		expect(container.querySelector(".card-fade")?.textContent).toBe("Newest excerpt");
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

	it("renders draggable heading items with extracted section data", async () => {
		const app = new App();
		(app.vault.cachedRead as Mock).mockResolvedValue(
			"# Note\n\n## Setup\n\nInstall it.\n\n## Next\n\nDone.",
		);
		const { container } = render(<NoteCard file={file} excerpt={excerpt} headings={headings} />, {
			wrapper: createWrapper(app),
		});

		const heading = await screen.findByRole("button", { name: "Drag heading Setup" });
		let capturedData: TextSelectionDragData | null = null;
		fireEvent.dragStart(heading, {
			dataTransfer: {
				setData: (_type: string, data: string) => {
					capturedData = JSON.parse(data);
				},
				setDragImage: () => {},
				effectAllowed: "",
			},
		});

		expect(container.querySelectorAll("[draggable]")).toHaveLength(2);
		expect(capturedData).toMatchObject({
			type: "text-selection-drag",
			filePath: "my-note.md",
			title: "Setup",
			selectedText: "## Setup\n\nInstall it.",
		});
	});

	it("opens the source article with Enter on a heading", async () => {
		const openInArticle = vi.fn();
		const { container } = render(<NoteCard file={file} excerpt={excerpt} headings={headings} />, {
			wrapper: createWrapper(undefined, undefined, { openInArticle }),
		});

		const heading = await screen.findByRole("button", { name: "Drag heading Setup" });
		fireEvent.keyDown(heading, { key: "Enter" });

		expect(openInArticle).toHaveBeenCalledWith("my-note.md");
		expect(container.querySelector("[aria-label='Drag heading Setup']")).not.toBeNull();
	});

	it("opens the source article when a heading is clicked", async () => {
		const openInArticle = vi.fn();
		const { container } = render(<NoteCard file={file} excerpt={excerpt} headings={headings} />, {
			wrapper: createWrapper(undefined, undefined, { openInArticle }),
		});

		const heading = await screen.findByRole("button", { name: "Drag heading Setup" });
		fireEvent.click(heading);

		expect(openInArticle).toHaveBeenCalledWith("my-note.md");
		void container;
	});

	it("progressively reveals long heading lists", () => {
		const app = new App();
		(app.vault.cachedRead as Mock).mockReturnValue(new Promise(() => undefined));
		const longHeadings = Array.from(
			{ length: 5 },
			(_, index): ParsedHeading => ({
				heading: `Section ${index + 1}`,
				level: 2,
				position: {
					start: { line: index + 1, col: 0, offset: index * 10 },
					end: { line: index + 1, col: 10, offset: index * 10 + 10 },
				},
			}),
		);

		render(<NoteCard file={file} excerpt={excerpt} headings={longHeadings} />, {
			wrapper: createWrapper(app),
		});

		expect(screen.queryByText("Section 4")).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "2 more" }));
		expect(screen.getByText("Section 4")).toBeDefined();
		expect(screen.getByRole("button", { name: "Show less" }).getAttribute("aria-expanded")).toBe(
			"true",
		);
	});

	it("preserves heading level when content is not loaded yet", async () => {
		const app = new App();
		const { container } = render(<NoteCard file={file} excerpt={excerpt} headings={headings} />, {
			wrapper: createWrapper(app),
		});
		const heading = await screen.findByRole("button", { name: "Drag heading Setup" });
		let capturedData: TextSelectionDragData | null = null;
		fireEvent.dragStart(heading, {
			dataTransfer: {
				setData: (_type: string, data: string) => {
					capturedData = JSON.parse(data);
				},
				setDragImage: () => {},
				effectAllowed: "",
			},
		});

		expect(capturedData?.selectedText).toBe("## Setup");
		fireEvent.dragEnd(container.querySelector("[aria-label='Drag heading Setup']"));
	});

	it("applies opacity while dragging", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const card = container.querySelector("[draggable]");

		expect(card).not.toBeNull();
		if (card) {
			fireEvent.dragStart(card, {
				dataTransfer: { setData: () => {}, effectAllowed: "" },
			});
			expect(card.classList.contains("is-dragging")).toBe(true);

			fireEvent.dragEnd(card);
			expect(card.classList.contains("is-dragging")).toBe(false);
		}
	});

	it("has card styling with border", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const card = container.querySelector(".border");
		expect(card).not.toBeNull();
	});

	it("uses the emphasized two-line title surface", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const title = container.querySelector(".heptabase-note-card__title");
		expect(title).not.toBeNull();
		expect(title!.classList.contains("font-medium")).toBe(true);
		expect(title!.classList.contains("truncate")).toBe(false);
	});

	it("uses subtle border with hover highlight", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const card = container.querySelector("[draggable]");
		expect(card!.classList.contains("border-ob-border-subtle")).toBe(true);
		expect(card!.classList.contains("heptabase-note-card")).toBe(true);
	});

	it("uses the stable card interaction surface", () => {
		const { container } = render(<NoteCard file={file} excerpt={excerpt} />, { wrapper });
		const card = container.querySelector("[draggable]");
		expect(card!.classList.contains("heptabase-note-card")).toBe(true);
		expect(card!.classList.toString()).not.toContain("translate");
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
		(app.workspace.getLeavesOfType as Mock).mockReturnValue([{ view: { canvas: mockCanvas } }]);

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
