import { HeadingExplorer } from "@/ui/components/heading-explorer";
import type { PluginContextValue } from "@/ui/context";
import { PluginContext } from "@/ui/context";
import type { UseHeadingSelectionReturn } from "@/ui/hooks/use-heading-selection";
import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "obsidian";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/ui/hooks/use-note-search", () => ({
	useNoteSearch: vi.fn().mockReturnValue({
		query: "",
		results: [],
		setQuery: vi.fn(),
	}),
}));

const mockClearSelection = vi.fn();
const mockToggleSelection = vi.fn();
const mockIsSelected = vi.fn().mockReturnValue(false);

let mockSelectionReturn: UseHeadingSelectionReturn = {
	selectedHeadings: [],
	selectionCount: 0,
	isSelected: mockIsSelected,
	toggleSelection: mockToggleSelection,
	clearSelection: mockClearSelection,
};

vi.mock("@/ui/hooks/use-heading-selection", () => ({
	useHeadingSelection: vi.fn(() => mockSelectionReturn),
}));

function renderWithContext() {
	const app = new App();
	app.vault.getMarkdownFiles = vi.fn().mockReturnValue([]);
	const contextValue: PluginContextValue = {
		app: app as never,
		settings: {
			extractedFilesFolder: "",
			defaultNodeWidth: 400,
			defaultNodeHeight: 300,
			fileNamePrefix: "",
			leaveBacklink: false,
			defaultEdgeColor: "",
			defaultEdgeLabel: "",
			enableEdgeSync: true,
			quickCardDefaultTitle: "Untitled",
			recursiveDecomposition: false,
			showPreviewBeforeCreate: false,
			multiDropLayout: "grid" as const,
			multiDropColumns: 3,
			multiDropGap: 40,
		},
	};
	return render(
		<PluginContext.Provider value={contextValue}>
			<HeadingExplorer />
		</PluginContext.Provider>,
	);
}

function getSelectButton(): HTMLElement {
	return screen.getByRole("button", { name: "Select" });
}

function getDoneButton(): HTMLElement {
	return screen.getByRole("button", { name: "Done" });
}

describe("HeadingExplorer", () => {
	beforeEach(() => {
		mockClearSelection.mockClear();
		mockToggleSelection.mockClear();
		mockIsSelected.mockClear();
		mockSelectionReturn = {
			selectedHeadings: [],
			selectionCount: 0,
			isSelected: mockIsSelected,
			toggleSelection: mockToggleSelection,
			clearSelection: mockClearSelection,
		};
	});

	it("renders the search bar", () => {
		renderWithContext();
		expect(screen.getByPlaceholderText("Search notes...")).toBeDefined();
	});

	it("renders a root container with panel layout classes", () => {
		const { container } = renderWithContext();
		expect(container.querySelector(".p-2.h-full.overflow-y-auto")).not.toBeNull();
	});

	it("Select button click toggles to selection mode showing Done", () => {
		renderWithContext();
		const selectBtn = getSelectButton();
		expect(selectBtn.textContent).toBe("Select");

		fireEvent.click(selectBtn);

		const doneBtn = getDoneButton();
		expect(doneBtn.textContent).toBe("Done");
	});

	it("Done button click exits selection mode and calls clearSelection", () => {
		renderWithContext();

		fireEvent.click(getSelectButton());
		const doneBtn = getDoneButton();
		expect(doneBtn.textContent).toBe("Done");

		fireEvent.click(doneBtn);

		expect(mockClearSelection).toHaveBeenCalled();
		expect(getSelectButton().textContent).toBe("Select");
	});

	it("shows drag bar with count when selectionCount > 0 in selection mode", () => {
		mockSelectionReturn = {
			...mockSelectionReturn,
			selectionCount: 3,
			selectedHeadings: [
				{
					type: "heading-explorer-drag",
					filePath: "a.md",
					headingText: "A",
					headingLevel: 2,
					headingLine: 1,
				},
				{
					type: "heading-explorer-drag",
					filePath: "b.md",
					headingText: "B",
					headingLevel: 2,
					headingLine: 2,
				},
				{
					type: "heading-explorer-drag",
					filePath: "c.md",
					headingText: "C",
					headingLevel: 2,
					headingLine: 3,
				},
			],
		};

		renderWithContext();

		fireEvent.click(getSelectButton());

		expect(screen.getByText("3 headings selected")).toBeDefined();
	});

	it("dragStart on the drag bar sets MultiHeadingDragData", () => {
		const items = [
			{
				type: "heading-explorer-drag" as const,
				filePath: "a.md",
				headingText: "A",
				headingLevel: 2,
				headingLine: 1,
			},
		];
		mockSelectionReturn = {
			...mockSelectionReturn,
			selectionCount: 1,
			selectedHeadings: items,
		};

		renderWithContext();

		fireEvent.click(getSelectButton());

		const dragBar = screen.getByText("1 heading selected").closest("[draggable]")!;

		let setDataKey = "";
		let setDataValue = "";
		const mockDataTransfer = {
			setData: vi.fn((key: string, value: string) => {
				setDataKey = key;
				setDataValue = value;
			}),
			effectAllowed: "",
		};

		fireEvent.dragStart(dragBar, { dataTransfer: mockDataTransfer });

		expect(setDataKey).toBe("application/json");
		const parsed = JSON.parse(setDataValue) as { type: string; items: typeof items };
		expect(parsed.type).toBe("multi-heading-drag");
		expect(parsed.items).toEqual(items);
		expect(mockDataTransfer.effectAllowed).toBe("copy");
	});

	it("does not show drag bar when selectionCount is 0 in selection mode", () => {
		mockSelectionReturn = {
			...mockSelectionReturn,
			selectionCount: 0,
			selectedHeadings: [],
		};

		renderWithContext();
		fireEvent.click(getSelectButton());

		expect(screen.queryByText(/heading.*selected/)).toBeNull();
	});

	it("Clear button click calls clearSelection", () => {
		mockSelectionReturn = {
			...mockSelectionReturn,
			selectionCount: 2,
			selectedHeadings: [
				{
					type: "heading-explorer-drag",
					filePath: "a.md",
					headingText: "A",
					headingLevel: 2,
					headingLine: 1,
				},
				{
					type: "heading-explorer-drag",
					filePath: "b.md",
					headingText: "B",
					headingLevel: 2,
					headingLine: 2,
				},
			],
		};

		renderWithContext();

		fireEvent.click(getSelectButton());

		const clearBtn = screen.getByRole("button", { name: "Clear" });
		fireEvent.click(clearBtn);

		expect(mockClearSelection).toHaveBeenCalled();
	});
});
