import { SidebarTabs } from "@/ui/components/sidebar-tabs";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

describe("SidebarTabs", () => {
	it("renders Card Library and ToC tabs", () => {
		render(<SidebarTabs activeTab="card-library" onTabChange={vi.fn()} />);
		expect(screen.getByText("Card Library")).toBeDefined();
		expect(screen.getByText("ToC")).toBeDefined();
	});

	it("marks the active tab with accent border", () => {
		const { container } = render(
			<SidebarTabs activeTab="card-library" onTabChange={vi.fn()} />,
		);
		const tabs = container.querySelectorAll("button");
		expect(tabs[0].classList.contains("border-b-ob-accent")).toBe(true);
		expect(tabs[1].classList.contains("border-b-transparent")).toBe(true);
	});

	it("marks toc tab as active when activeTab is toc", () => {
		const { container } = render(
			<SidebarTabs activeTab="toc" onTabChange={vi.fn()} />,
		);
		const tabs = container.querySelectorAll("button");
		expect(tabs[0].classList.contains("border-b-transparent")).toBe(true);
		expect(tabs[1].classList.contains("border-b-ob-accent")).toBe(true);
	});

	it("calls onTabChange when a tab is clicked", () => {
		const onTabChange = vi.fn();
		render(<SidebarTabs activeTab="card-library" onTabChange={onTabChange} />);

		fireEvent.click(screen.getByText("ToC"));
		expect(onTabChange).toHaveBeenCalledWith("toc");
	});

	it("calls onTabChange with card-library when Card Library tab is clicked", () => {
		const onTabChange = vi.fn();
		render(<SidebarTabs activeTab="toc" onTabChange={onTabChange} />);

		fireEvent.click(screen.getByText("Card Library"));
		expect(onTabChange).toHaveBeenCalledWith("card-library");
	});

	it("applies flex layout to container", () => {
		const { container } = render(
			<SidebarTabs activeTab="card-library" onTabChange={vi.fn()} />,
		);
		expect(container.querySelector(".flex.border-b")).not.toBeNull();
	});
});
