import { SidebarContainer } from "@/ui/components/sidebar-container";
import { SidebarActionsContext } from "@/ui/context";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { App } from "obsidian";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

vi.mock("@/ui/components/heading-explorer", () => ({
	HeadingExplorer: () => <div data-testid="heading-explorer" />,
}));

describe("SidebarContainer", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
	});

	it("renders sidebar tabs", () => {
		render(<SidebarContainer />, { wrapper: createWrapper(app) });
		expect(screen.getByText("Card Library")).toBeDefined();
		expect(screen.getByText("Article")).toBeDefined();
		expect(screen.getByText("Canvas")).toBeDefined();
		expect(screen.getByRole("tablist", { name: "Heading Explorer views" })).toBeDefined();
		expect(screen.getByRole("tab", { name: "Card Library" }).getAttribute("aria-selected")).toBe(
			"true",
		);
	});

	it("shares one Canvas polling loop across all mounted tabs", () => {
		const setIntervalSpy = vi.spyOn(window, "setInterval");
		render(<SidebarContainer />, { wrapper: createWrapper(app) });

		expect(setIntervalSpy).toHaveBeenCalledTimes(1);
		setIntervalSpy.mockRestore();
	});

	it("switches tabs with horizontal keyboard navigation", () => {
		const { container } = render(<SidebarContainer />, { wrapper: createWrapper(app) });
		fireEvent.keyDown(screen.getByRole("tab", { name: "Card Library" }), { key: "ArrowRight" });

		const cardLibrary = container.querySelector("[data-tab-panel='card-library']") as HTMLElement;
		const article = container.querySelector("[data-tab-panel='article-viewer']") as HTMLElement;
		expect(cardLibrary.style.display).toBe("none");
		expect(article.style.display).not.toBe("none");
	});

	it("shows Card Library panel by default and hides Article panel", () => {
		const { container } = render(<SidebarContainer />, { wrapper: createWrapper(app) });
		const panels = container.querySelectorAll("[data-tab-panel]");
		expect(panels).toHaveLength(3);

		const cardLibrary = container.querySelector("[data-tab-panel='card-library']") as HTMLElement;
		const article = container.querySelector("[data-tab-panel='article-viewer']") as HTMLElement;
		expect(cardLibrary.style.display).not.toBe("none");
		expect(article.style.display).toBe("none");
	});

	it("switches to Canvas search panel", () => {
		const { container } = render(<SidebarContainer />, { wrapper: createWrapper(app) });

		fireEvent.click(screen.getByText("Canvas"));

		const canvas = container.querySelector("[data-tab-panel='canvas-search']") as HTMLElement;
		expect(canvas.style.display).not.toBe("none");
		expect(screen.getByText("Open a Canvas to search its contents.")).toBeDefined();
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

		expect(screen.getByTestId("heading-explorer")).toBeDefined();
		expect(screen.getByPlaceholderText("Search articles...")).toBeDefined();

		fireEvent.click(screen.getByText("Article"));
		expect(screen.getByTestId("heading-explorer")).toBeDefined();
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
