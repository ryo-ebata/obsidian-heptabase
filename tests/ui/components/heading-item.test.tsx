import type { HeadingDragData, ParsedHeading } from "@/types/plugin";
import { HeadingItem } from "@/ui/components/heading-item";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

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

	it("applies heading-explorer-heading class", () => {
		const { container } = render(<HeadingItem heading={heading} filePath="test.md" />);
		const item = container.querySelector(".heading-explorer-heading");
		expect(item).not.toBeNull();
	});

	it("applies indentation based on heading level", () => {
		const { container } = render(<HeadingItem heading={heading} filePath="test.md" />);
		const item = container.querySelector(".heading-explorer-heading") as HTMLElement;
		expect(item.style.paddingLeft).toBe("16px");
	});

	it("sets HeadingDragData on drag start", () => {
		render(<HeadingItem heading={heading} filePath="test.md" />);
		const item = screen.getByText("Test Heading").closest(".heading-explorer-heading");

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
		const item = screen.getByText("Test Heading").closest(".heading-explorer-heading");
		expect(item?.getAttribute("draggable")).toBe("true");
	});

	it("has is-dragging class while dragging", () => {
		const { container } = render(<HeadingItem heading={heading} filePath="test.md" />);
		const item = container.querySelector(".heading-explorer-heading");

		expect(item).not.toBeNull();
		if (item) {
			fireEvent.dragStart(item, {
				dataTransfer: { setData: () => {}, effectAllowed: "" },
			});
			expect(item.classList.contains("is-dragging")).toBe(true);

			fireEvent.dragEnd(item);
			expect(item.classList.contains("is-dragging")).toBe(false);
		}
	});
});
