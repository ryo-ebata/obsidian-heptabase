import { SidebarContainer } from "@/ui/components/sidebar-container";
import { SidebarActionsContext } from "@/ui/context";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { App } from "obsidian";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

describe("SidebarContainer", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
	});

	it("renders sidebar tabs", () => {
		render(<SidebarContainer />, { wrapper: createWrapper(app) });
		expect(screen.getByText("Card Library")).toBeDefined();
		expect(screen.getByText("Article")).toBeDefined();
	});

	it("shows Card Library panel by default and hides Article panel", () => {
		const { container } = render(<SidebarContainer />, { wrapper: createWrapper(app) });
		const panels = container.querySelectorAll("[data-tab-panel]");
		expect(panels).toHaveLength(2);

		const cardLibrary = container.querySelector("[data-tab-panel='card-library']") as HTMLElement;
		const article = container.querySelector("[data-tab-panel='article-viewer']") as HTMLElement;
		expect(cardLibrary.style.display).not.toBe("none");
		expect(article.style.display).toBe("none");
	});

	it("switches to Article panel when Article tab is clicked", () => {
		const { container } = render(<SidebarContainer />, { wrapper: createWrapper(app) });

		fireEvent.click(screen.getByText("Article"));

		const cardLibrary = container.querySelector("[data-tab-panel='card-library']") as HTMLElement;
		const article = container.querySelector("[data-tab-panel='article-viewer']") as HTMLElement;
		expect(cardLibrary.style.display).toBe("none");
		expect(article.style.display).not.toBe("none");
	});

	it("switches back to Card Library when Card Library tab is clicked", () => {
		const { container } = render(<SidebarContainer />, { wrapper: createWrapper(app) });

		fireEvent.click(screen.getByText("Article"));
		fireEvent.click(screen.getByText("Card Library"));

		const cardLibrary = container.querySelector("[data-tab-panel='card-library']") as HTMLElement;
		const article = container.querySelector("[data-tab-panel='article-viewer']") as HTMLElement;
		expect(cardLibrary.style.display).not.toBe("none");
		expect(article.style.display).toBe("none");
	});

	it("keeps both panels mounted across tab switches", () => {
		render(<SidebarContainer />, { wrapper: createWrapper(app) });

		expect(screen.getByPlaceholderText("Search notes...")).toBeDefined();
		expect(screen.getByPlaceholderText("Search articles...")).toBeDefined();

		fireEvent.click(screen.getByText("Article"));
		expect(screen.getByPlaceholderText("Search notes...")).toBeDefined();
		expect(screen.getByPlaceholderText("Search articles...")).toBeDefined();
	});

	it("applies flex column layout", () => {
		const { container } = render(<SidebarContainer />, { wrapper: createWrapper(app) });
		expect(container.querySelector(".h-full.flex.flex-col")).not.toBeNull();
	});

	it("provides SidebarActionsContext", () => {
		let contextValue: { openInArticle: (filePath: string) => void } | null = null;
		function Consumer() {
			contextValue = React.useContext(SidebarActionsContext);
			return null;
		}

		render(
			<SidebarContainer>
				<Consumer />
			</SidebarContainer>,
			{ wrapper: createWrapper(app) },
		);

		expect(contextValue).not.toBeNull();
		expect(typeof contextValue!.openInArticle).toBe("function");
	});

	it("switches to article-viewer tab when openInArticle is called", () => {
		let contextValue: { openInArticle: (filePath: string) => void } | null = null;
		function Consumer() {
			contextValue = React.useContext(SidebarActionsContext);
			return null;
		}

		const { container } = render(
			<SidebarContainer>
				<Consumer />
			</SidebarContainer>,
			{ wrapper: createWrapper(app) },
		);

		expect(contextValue).not.toBeNull();
		act(() => {
			contextValue!.openInArticle("notes/test.md");
		});

		const article = container.querySelector("[data-tab-panel='article-viewer']") as HTMLElement;
		expect(article.style.display).not.toBe("none");
	});
});
