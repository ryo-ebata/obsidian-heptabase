import type { TextSelectionDragData } from "@/types/plugin";
import { useDragData } from "@/ui/hooks/use-drag-data";
import type React from "react";
import { useCallback, useMemo } from "react";

interface SelectionDragHandleProps {
	selectedText: string;
	selectionRect: DOMRect | null;
	filePath: string;
}

function deriveTitle(text: string): string {
	const firstLine = text.split("\n")[0] ?? "Untitled";
	return firstLine.length <= 50 ? firstLine : firstLine.slice(0, 50);
}

export function SelectionDragHandle({
	selectedText,
	selectionRect,
	filePath,
}: SelectionDragHandleProps): React.ReactElement | null {
	const getData = useCallback(
		(): TextSelectionDragData => ({
			type: "text-selection-drag",
			filePath,
			selectedText,
			title: deriveTitle(selectedText),
		}),
		[filePath, selectedText],
	);

	const visualOptions = useMemo(() => ({ label: deriveTitle(selectedText) }), [selectedText]);

	const { handleDragStart, handleDragEnd } = useDragData(getData, visualOptions);

	if (!selectedText || !selectionRect) {
		return null;
	}

	return (
		<div
			draggable
			title="Drag to Canvas"
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			style={{
				position: "fixed",
				left: `${selectionRect.right + 4}px`,
				top: `${selectionRect.top}px`,
				cursor: "grab",
				zIndex: 1000,
				padding: "4px 8px",
				borderRadius: "4px",
				background: "var(--interactive-accent, #7c3aed)",
				color: "white",
				fontSize: "12px",
				userSelect: "none",
				display: "flex",
				alignItems: "center",
				gap: "4px",
			}}
		>
			⊕
		</div>
	);
}
