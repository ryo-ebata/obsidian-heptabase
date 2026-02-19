import type { HeadingDragData } from "@/types/plugin";
import { useHeadingSelection } from "@/ui/hooks/use-heading-selection";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const item1: HeadingDragData = {
	type: "heading-explorer-drag",
	filePath: "notes/a.md",
	headingText: "Section A",
	headingLevel: 2,
	headingLine: 4,
};

const item2: HeadingDragData = {
	type: "heading-explorer-drag",
	filePath: "notes/b.md",
	headingText: "Section B",
	headingLevel: 2,
	headingLine: 10,
};

const item3: HeadingDragData = {
	type: "heading-explorer-drag",
	filePath: "notes/a.md",
	headingText: "Section C",
	headingLevel: 3,
	headingLine: 8,
};

describe("useHeadingSelection", () => {
	it("starts with empty selection", () => {
		const { result } = renderHook(() => useHeadingSelection());
		expect(result.current.selectionCount).toBe(0);
		expect(result.current.selectedHeadings).toEqual([]);
	});

	it("toggleSelection adds item", () => {
		const { result } = renderHook(() => useHeadingSelection());

		act(() => {
			result.current.toggleSelection(item1);
		});

		expect(result.current.selectionCount).toBe(1);
		expect(result.current.isSelected("notes/a.md", 4)).toBe(true);
	});

	it("toggleSelection removes item on second call", () => {
		const { result } = renderHook(() => useHeadingSelection());

		act(() => {
			result.current.toggleSelection(item1);
		});
		act(() => {
			result.current.toggleSelection(item1);
		});

		expect(result.current.selectionCount).toBe(0);
		expect(result.current.isSelected("notes/a.md", 4)).toBe(false);
	});

	it("supports multiple items from different files", () => {
		const { result } = renderHook(() => useHeadingSelection());

		act(() => {
			result.current.toggleSelection(item1);
		});
		act(() => {
			result.current.toggleSelection(item2);
		});

		expect(result.current.selectionCount).toBe(2);
		expect(result.current.isSelected("notes/a.md", 4)).toBe(true);
		expect(result.current.isSelected("notes/b.md", 10)).toBe(true);
	});

	it("supports multiple items from same file", () => {
		const { result } = renderHook(() => useHeadingSelection());

		act(() => {
			result.current.toggleSelection(item1);
		});
		act(() => {
			result.current.toggleSelection(item3);
		});

		expect(result.current.selectionCount).toBe(2);
		expect(result.current.isSelected("notes/a.md", 4)).toBe(true);
		expect(result.current.isSelected("notes/a.md", 8)).toBe(true);
	});

	it("clearSelection removes all items", () => {
		const { result } = renderHook(() => useHeadingSelection());

		act(() => {
			result.current.toggleSelection(item1);
		});
		act(() => {
			result.current.toggleSelection(item2);
		});
		act(() => {
			result.current.clearSelection();
		});

		expect(result.current.selectionCount).toBe(0);
		expect(result.current.selectedHeadings).toEqual([]);
	});

	it("selectedHeadings returns all items in insertion order", () => {
		const { result } = renderHook(() => useHeadingSelection());

		act(() => {
			result.current.toggleSelection(item2);
		});
		act(() => {
			result.current.toggleSelection(item1);
		});

		expect(result.current.selectedHeadings).toEqual([item2, item1]);
	});

	it("isSelected returns false for non-selected items", () => {
		const { result } = renderHook(() => useHeadingSelection());

		act(() => {
			result.current.toggleSelection(item1);
		});

		expect(result.current.isSelected("notes/b.md", 10)).toBe(false);
		expect(result.current.isSelected("notes/a.md", 99)).toBe(false);
	});
});
