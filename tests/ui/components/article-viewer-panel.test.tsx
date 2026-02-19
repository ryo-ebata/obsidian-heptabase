import type { EmbeddableEditorHandle } from "@/services/embeddable-editor";
import { ArticleViewerPanel } from "@/ui/components/article-viewer-panel";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { EditorView } from "@codemirror/view";
import { App, TFile } from "obsidian";
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

describe("ArticleViewerPanel", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
		vi.useFakeTimers();
		(createEmbeddableEditor as Mock).mockReturnValue(createMockEditor());
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
});
