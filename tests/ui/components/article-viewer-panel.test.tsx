import { ArticleViewerPanel } from "@/ui/components/article-viewer-panel";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { App, MarkdownRenderer, TFile } from "obsidian";
import React from "react";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

describe("ArticleViewerPanel", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
		vi.useFakeTimers();
		(MarkdownRenderer.render as Mock).mockReset();
		(MarkdownRenderer.render as Mock).mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders search input", () => {
		render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByPlaceholderText("Search articles...")).toBeDefined();
	});

	it("shows file content after selecting a file", async () => {
		const file = new TFile("notes/hello.md");
		(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
		(app.vault.read as Mock).mockResolvedValue("# Hello World\n\nContent here.");

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

		expect(MarkdownRenderer.render).toHaveBeenCalled();
	});

	it("shows markdown-rendered container after selecting file", async () => {
		const file = new TFile("notes/hello.md");
		(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
		(app.vault.read as Mock).mockResolvedValue("# Hello");

		const { container } = render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });

		fireEvent.change(screen.getByPlaceholderText("Search articles..."), {
			target: { value: "hello" },
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		fireEvent.click(screen.getByText("notes/hello.md"));

		expect(container.querySelector(".markdown-rendered")).not.toBeNull();
	});

	it("renders container with full height", () => {
		const { container } = render(<ArticleViewerPanel />, { wrapper: createWrapper(app) });
		expect(container.querySelector(".h-full.flex.flex-col")).not.toBeNull();
	});
});
