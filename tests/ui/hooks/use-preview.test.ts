import type { HeadingDragData } from "@/types/plugin";
import { usePreview } from "@/ui/hooks/use-preview";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const sampleItems: HeadingDragData[] = [
	{
		type: "heading-explorer-drag",
		filePath: "notes/a.md",
		headingText: "Section A",
		headingLevel: 2,
		headingLine: 5,
	},
	{
		type: "heading-explorer-drag",
		filePath: "notes/b.md",
		headingText: "Section B",
		headingLevel: 2,
		headingLine: 10,
	},
];

const sampleContents = ["## Section A\n\nContent A.", "## Section B\n\nContent B."];

describe("usePreview", () => {
	it("starts closed", () => {
		const { result } = renderHook(() => usePreview());
		expect(result.current.isPreviewOpen).toBe(false);
		expect(result.current.previewSections).toEqual([]);
	});

	it("openPreview sets state and opens", () => {
		const { result } = renderHook(() => usePreview());

		act(() => {
			result.current.openPreview(sampleItems, sampleContents, vi.fn(), vi.fn());
		});

		expect(result.current.isPreviewOpen).toBe(true);
		expect(result.current.previewSections).toHaveLength(2);
		expect(result.current.previewSections[0]).toEqual({
			item: sampleItems[0],
			content: sampleContents[0],
			included: true,
		});
	});

	it("toggleSection excludes section", () => {
		const { result } = renderHook(() => usePreview());

		act(() => {
			result.current.openPreview(sampleItems, sampleContents, vi.fn(), vi.fn());
		});

		act(() => {
			result.current.toggleSection(0);
		});

		expect(result.current.previewSections[0].included).toBe(false);
		expect(result.current.previewSections[1].included).toBe(true);
	});

	it("toggleSection re-includes section", () => {
		const { result } = renderHook(() => usePreview());

		act(() => {
			result.current.openPreview(sampleItems, sampleContents, vi.fn(), vi.fn());
		});

		act(() => {
			result.current.toggleSection(0);
		});
		act(() => {
			result.current.toggleSection(0);
		});

		expect(result.current.previewSections[0].included).toBe(true);
	});

	it("confirmAndExecute calls onConfirm with included indices", () => {
		const onConfirm = vi.fn();
		const { result } = renderHook(() => usePreview());

		act(() => {
			result.current.openPreview(sampleItems, sampleContents, onConfirm, vi.fn());
		});

		act(() => {
			result.current.toggleSection(1);
		});

		act(() => {
			result.current.confirmAndExecute();
		});

		expect(onConfirm).toHaveBeenCalledWith([0]);
		expect(result.current.isPreviewOpen).toBe(false);
	});

	it("uses empty string fallback when contents array is shorter than items", () => {
		const { result } = renderHook(() => usePreview());

		const threeItems: HeadingDragData[] = [
			...sampleItems,
			{
				type: "heading-explorer-drag",
				filePath: "notes/c.md",
				headingText: "Section C",
				headingLevel: 2,
				headingLine: 15,
			},
		];

		act(() => {
			result.current.openPreview(threeItems, sampleContents, vi.fn(), vi.fn());
		});

		expect(result.current.previewSections).toHaveLength(3);
		expect(result.current.previewSections[2]!.content).toBe("");
	});

	it("closePreview calls onCancel and resets state", () => {
		const onCancel = vi.fn();
		const { result } = renderHook(() => usePreview());

		act(() => {
			result.current.openPreview(sampleItems, sampleContents, vi.fn(), onCancel);
		});

		act(() => {
			result.current.closePreview();
		});

		expect(onCancel).toHaveBeenCalled();
		expect(result.current.isPreviewOpen).toBe(false);
		expect(result.current.previewSections).toEqual([]);
	});
});
