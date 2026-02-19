import type { EmbeddableEditorHandle } from "@/services/embeddable-editor";
import { ArticleEditor } from "@/ui/components/article-editor";
import { render } from "@testing-library/react";
import { EditorView } from "@codemirror/view";
import { App } from "obsidian";
import React from "react";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("ArticleEditor", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
		(createEmbeddableEditor as Mock).mockReturnValue(createMockEditor());
	});

	it("renders a container div", () => {
		const { container } = render(<ArticleEditor content="# Hello" onSave={vi.fn()} />, {
			wrapper: createWrapper(app),
		});

		expect(container.querySelector(".article-editor")).not.toBeNull();
	});

	it("renders with flex-1 overflow class for layout", () => {
		const { container } = render(<ArticleEditor content="# Hello" onSave={vi.fn()} />, {
			wrapper: createWrapper(app),
		});

		const el = container.querySelector(".article-editor");
		expect(el?.classList.contains("flex-1")).toBe(true);
		expect(el?.classList.contains("overflow-y-auto")).toBe(true);
	});
});
