import { SidebarContainer } from "@/ui/components/sidebar-container";
import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "obsidian";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

describe("SidebarContainer", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
		app.workspace.getActiveViewOfType = vi.fn().mockReturnValue(null);
	});

	it("renders sidebar tabs", () => {
		render(<SidebarContainer />, { wrapper: createWrapper(app) });
		expect(screen.getByText("Card Library")).toBeDefined();
		expect(screen.getByText("ToC")).toBeDefined();
	});

	it("shows Card Library panel by default", () => {
		render(<SidebarContainer />, { wrapper: createWrapper(app) });
		const { container } = render(<SidebarContainer />, { wrapper: createWrapper(app) });
		expect(container.querySelector(".p-2.h-full.overflow-y-auto")).not.toBeNull();
	});

	it("switches to ToC panel when ToC tab is clicked", () => {
		render(<SidebarContainer />, { wrapper: createWrapper(app) });

		fireEvent.click(screen.getByText("ToC"));

		expect(screen.getByText("No file open")).toBeDefined();
	});

	it("switches back to Card Library when Card Library tab is clicked", () => {
		render(<SidebarContainer />, { wrapper: createWrapper(app) });

		fireEvent.click(screen.getByText("ToC"));
		fireEvent.click(screen.getByText("Card Library"));

		expect(screen.getByPlaceholderText("Search notes...")).toBeDefined();
	});

	it("switches to Info panel when Info tab is clicked", () => {
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);
		render(<SidebarContainer />, { wrapper: createWrapper(app) });
		fireEvent.click(screen.getByText("Info"));
		expect(screen.getByText("No node selected")).toBeDefined();
	});

	it("applies flex column layout", () => {
		const { container } = render(<SidebarContainer />, { wrapper: createWrapper(app) });
		expect(container.querySelector(".h-full.flex.flex-col")).not.toBeNull();
	});
});
