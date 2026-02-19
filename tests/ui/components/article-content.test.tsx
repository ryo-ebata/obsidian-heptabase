import { ArticleContent } from "@/ui/components/article-content";
import { render } from "@testing-library/react";
import { App, MarkdownRenderer } from "obsidian";
import React, { createRef } from "react";
import { type Mock, beforeEach, describe, expect, it } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

describe("ArticleContent", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
		(MarkdownRenderer.render as Mock).mockReset();
		(MarkdownRenderer.render as Mock).mockResolvedValue(undefined);
	});

	it("calls MarkdownRenderer.render with content and filePath", () => {
		const contentRef = createRef<HTMLDivElement>();
		render(<ArticleContent content="# Hello" filePath="notes/test.md" contentRef={contentRef} />, {
			wrapper: createWrapper(app),
		});

		expect(MarkdownRenderer.render).toHaveBeenCalledWith(
			app,
			"# Hello",
			expect.any(HTMLElement),
			"notes/test.md",
			expect.any(Object),
		);
	});

	it("does not call render when content is empty", () => {
		const contentRef = createRef<HTMLDivElement>();
		render(<ArticleContent content="" filePath="notes/test.md" contentRef={contentRef} />, {
			wrapper: createWrapper(app),
		});

		expect(MarkdownRenderer.render).not.toHaveBeenCalled();
	});

	it("re-renders when content changes", () => {
		const contentRef = createRef<HTMLDivElement>();
		const { rerender } = render(
			<ArticleContent content="# First" filePath="notes/test.md" contentRef={contentRef} />,
			{ wrapper: createWrapper(app) },
		);

		(MarkdownRenderer.render as Mock).mockClear();

		rerender(
			<ArticleContent content="# Second" filePath="notes/test.md" contentRef={contentRef} />,
		);

		expect(MarkdownRenderer.render).toHaveBeenCalledWith(
			app,
			"# Second",
			expect.any(HTMLElement),
			"notes/test.md",
			expect.any(Object),
		);
	});

	it("renders a container div with markdown-rendered class", () => {
		const contentRef = createRef<HTMLDivElement>();
		const { container } = render(
			<ArticleContent content="# Hello" filePath="notes/test.md" contentRef={contentRef} />,
			{ wrapper: createWrapper(app) },
		);

		expect(container.querySelector(".markdown-rendered")).not.toBeNull();
	});
});
