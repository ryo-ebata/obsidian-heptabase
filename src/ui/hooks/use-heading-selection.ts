import type { HeadingDragData } from "@/types/plugin";
import { useCallback, useState } from "react";

function makeKey(filePath: string, headingLine: number): string {
	return `${filePath}:${headingLine}`;
}

export interface UseHeadingSelectionReturn {
	selectedHeadings: HeadingDragData[];
	selectionCount: number;
	isSelected: (filePath: string, headingLine: number) => boolean;
	toggleSelection: (item: HeadingDragData) => void;
	clearSelection: () => void;
}

export function useHeadingSelection(): UseHeadingSelectionReturn {
	const [selectionMap, setSelectionMap] = useState(() => new Map<string, HeadingDragData>());

	const toggleSelection = useCallback((item: HeadingDragData) => {
		setSelectionMap((prev) => {
			const key = makeKey(item.filePath, item.headingLine);
			const next = new Map(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.set(key, item);
			}
			return next;
		});
	}, []);

	const clearSelection = useCallback(() => {
		setSelectionMap(new Map());
	}, []);

	const isSelected = useCallback(
		(filePath: string, headingLine: number): boolean => {
			return selectionMap.has(makeKey(filePath, headingLine));
		},
		[selectionMap],
	);

	const selectedHeadings = Array.from(selectionMap.values());

	return {
		selectedHeadings,
		selectionCount: selectionMap.size,
		isSelected,
		toggleSelection,
		clearSelection,
	};
}
