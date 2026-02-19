import { SidebarContainer } from "@/ui/components/sidebar-container";
import { fireEvent, render, screen } from "@testing-library/react";
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

	it("shows Card Library panel by default", () => {
		const { container } = render(<SidebarContainer />, { wrapper: createWrapper(app) });
		expect(container.querySelector(".p-2.h-full.overflow-y-auto")).not.toBeNull();
	});

	it("switches to Article panel when Article tab is clicked", () => {
		render(<SidebarContainer />, { wrapper: createWrapper(app) });

		fireEvent.click(screen.getByText("Article"));

		expect(screen.getByPlaceholderText("Search articles...")).toBeDefined();
	});

	it("switches back to Card Library when Card Library tab is clicked", () => {
		render(<SidebarContainer />, { wrapper: createWrapper(app) });

		fireEvent.click(screen.getByText("Article"));
		fireEvent.click(screen.getByText("Card Library"));

		expect(screen.getByPlaceholderText("Search notes...")).toBeDefined();
	});

it("applies flex column layout", () => {
		const { container } = render(<SidebarContainer />, { wrapper: createWrapper(app) });
		expect(container.querySelector(".h-full.flex.flex-col")).not.toBeNull();
	});
});
