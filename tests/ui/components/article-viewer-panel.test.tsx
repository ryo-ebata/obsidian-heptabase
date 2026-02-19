import type { EmbeddableEditorHandle } from "@/services/embeddable-editor";
import { ArticleViewerPanel } from "@/ui/components/article-viewer-panel";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { EditorView } from "@codemirror/view";
import { App, TFile, TFolder } from "obsidian";
import React from "react";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

vi.mock("@/services/embeddable-editor", () => ({
	createEmbeddableEditor: vi.fn(),
}));

import { createEmbeddableEditor } from "@/services/embeddable-editor";

function createMockEditor(): EmbeddableEditorHandle {
	return {
		value: "",
		set: vi.fn(),
		cm: new EditorView(),
		destroy: vi.fn(),
	};
}

async function selectFile(app: App, file: TFile) {
	(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
	(app.vault.read as Mock).mockResolvedValue("# Content");
	(app.metadataCache.getFileCache as Mock).mockReturnValue({
		frontmatter: {
			position: {
				start: { line: 0, col: 0, offset: 0 },
				end: { line: 2, col: 3, offset: 20 },
			},
			status: "draft",
		},
	});

	fireEvent.change(screen.getByPlaceholderText("Search articles..."), {
		target: { value: file.basename },
	});

	await act(async () => {
		await vi.advanceTimersByTimeAsync(300);
	});

	fireEvent.click(screen.getByText(file.path));

	await act(async () => {
		await vi.advanceTimersByTimeAsync(0);
	});
}

describe("ArticleViewerPanel", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
		vi.useFakeTimers();
		(createEmbeddableEditor as Mock).mockReturnValue(createMockEditor());
		(app.metadataCache.getFileCache as Mock).mockReturnValue(null);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders search input", () => {
		render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByPlaceholderText("Search articles...")).toBeDefined();
	});

	it("shows editor after selecting a file", async () => {
		const file = new TFile("notes/hello.md");
		(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
		(app.vault.read as Mock).mockResolvedValue("# Hello World\n\nContent here.");

		const { container } = render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });

		fireEvent.change(screen.getByPlaceholderText("Search articles..."), {
			target: { value: "hello" },
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		fireEvent.click(screen.getByText("notes/hello.md"));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(container.querySelector(".article-editor")).not.toBeNull();
	});

	it("renders container with full height", () => {
		const { container } = render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });
		expect(container.querySelector(".h-full.flex.flex-col")).not.toBeNull();
	});

	it("does not show editor before file selection", () => {
		const { container } = render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });
		expect(container.querySelector(".article-editor")).toBeNull();
	});

	it("shows ArticleHeader after selecting a file", async () => {
		const file = new TFile("notes/hello.md");

		const { container } = render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });
		await selectFile(app, file);

		expect(container.querySelector(".article-header-title")).not.toBeNull();
		expect(screen.getByDisplayValue("hello")).toBeDefined();
		expect(screen.getByText("notes/hello.md")).toBeDefined();
	});

	it("shows frontmatter properties in ArticleHeader", async () => {
		const file = new TFile("notes/hello.md");

		render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });
		await selectFile(app, file);

		expect(screen.getByText("status")).toBeDefined();
		expect(screen.getByDisplayValue("draft")).toBeDefined();
	});

	it("calls processFrontMatter on property change", async () => {
		const file = new TFile("notes/hello.md");

		render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });
		await selectFile(app, file);

		const valueInput = screen.getByDisplayValue("draft");
		fireEvent.change(valueInput, { target: { value: "published" } });
		fireEvent.blur(valueInput);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(app.fileManager.processFrontMatter).toHaveBeenCalled();
	});

	it("calls processFrontMatter on property delete", async () => {
		const file = new TFile("notes/hello.md");

		render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });
		await selectFile(app, file);

		fireEvent.click(screen.getByLabelText("Delete status"));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(app.fileManager.processFrontMatter).toHaveBeenCalled();
	});

	it("calls processFrontMatter on property add", async () => {
		const file = new TFile("notes/hello.md");

		render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });
		await selectFile(app, file);

		fireEvent.click(screen.getByText("+ Add property"));
		fireEvent.change(screen.getByPlaceholderText("Key"), {
			target: { value: "author" },
		});
		fireEvent.change(screen.getByPlaceholderText("Value"), {
			target: { value: "John" },
		});
		fireEvent.click(screen.getByText("Add"));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(app.fileManager.processFrontMatter).toHaveBeenCalled();
	});

	it("calls renameFile on title change", async () => {
		const file = new TFile("notes/hello.md");
		file.parent = new TFolder("notes");

		render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });
		await selectFile(app, file);

		const titleInput = screen.getByDisplayValue("hello");
		fireEvent.change(titleInput, { target: { value: "new-name" } });
		fireEvent.blur(titleInput);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(app.fileManager.renameFile).toHaveBeenCalledWith(file, "notes/new-name.md");
	});

	it("strips frontmatter from content passed to editor", async () => {
		const file = new TFile("notes/hello.md");
		const rawContent = "---\nmarp: true\ntheme: default\n---\n# Hello World\n\nBody text.";
		(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
		(app.vault.read as Mock).mockResolvedValue(rawContent);
		(app.metadataCache.getFileCache as Mock).mockReturnValue({
			frontmatter: {
				position: {
					start: { line: 0, col: 0, offset: 0 },
					end: { line: 3, col: 3, offset: 30 },
				},
				marp: true,
				theme: "default",
			},
		});

		const mockEditor = createMockEditor();
		(createEmbeddableEditor as Mock).mockReturnValue(mockEditor);

		render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });

		fireEvent.change(screen.getByPlaceholderText("Search articles..."), {
			target: { value: "hello" },
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		fireEvent.click(screen.getByText("notes/hello.md"));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(mockEditor.set).toHaveBeenCalledWith("# Hello World\n\nBody text.");
	});
});
