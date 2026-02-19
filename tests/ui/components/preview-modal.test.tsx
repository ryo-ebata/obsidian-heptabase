import type { PreviewSection } from "@/ui/hooks/use-preview";
import { PreviewModal } from "@/ui/components/preview-modal";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const sampleSections: PreviewSection[] = [
	{
		item: {
			type: "heading-explorer-drag",
			filePath: "notes/a.md",
			headingText: "Section A",
			headingLevel: 2,
			headingLine: 5,
		},
		content: "## Section A\n\nContent A.",
		included: true,
	},
	{
		item: {
			type: "heading-explorer-drag",
			filePath: "notes/b.md",
			headingText: "Section B",
			headingLevel: 2,
			headingLine: 10,
		},
		content: "## Section B\n\nContent B.",
		included: false,
	},
];

describe("PreviewModal", () => {
	it("renders nothing when not open", () => {
		const { container } = render(
			<PreviewModal
				isOpen={false}
				sections={[]}
				onToggleSection={vi.fn()}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(container.innerHTML).toBe("");
	});

	it("renders section headings when open", () => {
		render(
			<PreviewModal
				isOpen={true}
				sections={sampleSections}
				onToggleSection={vi.fn()}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(screen.getByText("Section A")).toBeDefined();
		expect(screen.getByText("Section B")).toBeDefined();
	});

	it("shows checkboxes matching included state", () => {
		const { container } = render(
			<PreviewModal
				isOpen={true}
				sections={sampleSections}
				onToggleSection={vi.fn()}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		const checkboxes = container.querySelectorAll("input[type='checkbox']");
		expect(checkboxes).toHaveLength(2);
		expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
		expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
	});

	it("calls onToggleSection when checkbox is clicked", () => {
		const onToggleSection = vi.fn();
		const { container } = render(
			<PreviewModal
				isOpen={true}
				sections={sampleSections}
				onToggleSection={onToggleSection}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		const checkboxes = container.querySelectorAll("input[type='checkbox']");
		fireEvent.click(checkboxes[0]);
		expect(onToggleSection).toHaveBeenCalledWith(0);
	});

	it("calls onConfirm when confirm button is clicked", () => {
		const onConfirm = vi.fn();
		render(
			<PreviewModal
				isOpen={true}
				sections={sampleSections}
				onToggleSection={vi.fn()}
				onConfirm={onConfirm}
				onCancel={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByText("Create"));
		expect(onConfirm).toHaveBeenCalled();
	});

	it("calls onCancel when cancel button is clicked", () => {
		const onCancel = vi.fn();
		render(
			<PreviewModal
				isOpen={true}
				sections={sampleSections}
				onToggleSection={vi.fn()}
				onConfirm={vi.fn()}
				onCancel={onCancel}
			/>,
		);
		fireEvent.click(screen.getByText("Cancel"));
		expect(onCancel).toHaveBeenCalled();
	});

	it("shows content preview for each section", () => {
		render(
			<PreviewModal
				isOpen={true}
				sections={sampleSections}
				onToggleSection={vi.fn()}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(screen.getByText("Content A.")).toBeDefined();
		expect(screen.getByText("Content B.")).toBeDefined();
	});
});
