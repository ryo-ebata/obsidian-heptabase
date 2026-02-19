import type { HeadingDragData, ParsedHeading } from "@/types/plugin";
import { HeadingItem } from "@/ui/components/heading-item";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

describe("HeadingItem", () => {
	const heading: ParsedHeading = {
		heading: "Test Heading",
		level: 2,
		position: {
			start: { line: 5, col: 0, offset: 30 },
			end: { line: 5, col: 16, offset: 46 },
		},
	};

	it("renders heading text", () => {
		render(<HeadingItem heading={heading} filePath="test.md" />);
		expect(screen.getByText("Test Heading")).toBeDefined();
	});

	it("applies cursor-grab class", () => {
		const { container } = render(<HeadingItem heading={heading} filePath="test.md" />);
		const item = container.querySelector(".cursor-grab");
		expect(item).not.toBeNull();
	});

	it("applies indentation based on heading level", () => {
		const { container } = render(<HeadingItem heading={heading} filePath="test.md" />);
		const item = container.querySelector(".cursor-grab") as HTMLElement;
		expect(item.style.paddingLeft).toBe("16px");
	});

	it("sets HeadingDragData on drag start", () => {
		render(<HeadingItem heading={heading} filePath="test.md" />);
		const item = screen.getByText("Test Heading").closest(".cursor-grab");

		const dataTransfer = {
			setData: (type: string, data: string) => {
				const parsed: HeadingDragData = JSON.parse(data);
				expect(type).toBe("application/json");
				expect(parsed.type).toBe("heading-explorer-drag");
				expect(parsed.filePath).toBe("test.md");
				expect(parsed.headingText).toBe("Test Heading");
				expect(parsed.headingLevel).toBe(2);
				expect(parsed.headingLine).toBe(5);
			},
			effectAllowed: "",
		};

		expect(item).not.toBeNull();
		if (item) {
			fireEvent.dragStart(item, { dataTransfer });
		}
	});

	it("has draggable attribute set to true", () => {
		render(<HeadingItem heading={heading} filePath="test.md" />);
		const item = screen.getByText("Test Heading").closest(".cursor-grab");
		expect(item?.getAttribute("draggable")).toBe("true");
	});

	it("shows checkbox when isSelectable is true", () => {
		const { container } = render(
			<HeadingItem
				heading={heading}
				filePath="test.md"
				isSelectable={true}
				isSelected={false}
				onToggleSelect={vi.fn()}
			/>,
		);
		const checkbox = container.querySelector("input[type='checkbox']");
		expect(checkbox).not.toBeNull();
	});

	it("calls onToggleSelect with HeadingDragData on checkbox change", () => {
		const onToggleSelect = vi.fn();
		const { container } = render(
			<HeadingItem
				heading={heading}
				filePath="test.md"
				isSelectable={true}
				isSelected={false}
				onToggleSelect={onToggleSelect}
			/>,
		);
		const checkbox = container.querySelector("input[type='checkbox']") as HTMLInputElement;
		fireEvent.click(checkbox);
		expect(onToggleSelect).toHaveBeenCalledWith({
			type: "heading-explorer-drag",
			filePath: "test.md",
			headingText: "Test Heading",
			headingLevel: 2,
			headingLine: 5,
		});
	});

	it("sets draggable to false when isSelectable is true", () => {
		const { container } = render(
			<HeadingItem heading={heading} filePath="test.md" isSelectable={true} />,
		);
		const item = container.querySelector(".cursor-grab");
		expect(item?.getAttribute("draggable")).toBe("false");
	});

	it("applies bg-ob-hover class when isSelected is true", () => {
		const { container } = render(
			<HeadingItem
				heading={heading}
				filePath="test.md"
				isSelectable={true}
				isSelected={true}
				onToggleSelect={vi.fn()}
			/>,
		);
		const item = container.querySelector(".cursor-grab");
		expect(item?.classList.contains("bg-ob-hover")).toBe(true);
	});

	it("applies opacity while dragging", () => {
		const { container } = render(<HeadingItem heading={heading} filePath="test.md" />);
		const item = container.querySelector(".cursor-grab");

		expect(item).not.toBeNull();
		if (item) {
			fireEvent.dragStart(item, {
				dataTransfer: { setData: () => {}, effectAllowed: "" },
			});
			expect(item.classList.contains("opacity-50")).toBe(true);

			fireEvent.dragEnd(item);
			expect(item.classList.contains("opacity-50")).toBe(false);
		}
	});
});
