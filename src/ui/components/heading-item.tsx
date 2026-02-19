import type { HeadingDragData, ParsedHeading } from "@/types/plugin";
import { useDragData } from "@/ui/hooks/use-drag-data";
import type React from "react";
import { useCallback } from "react";

interface HeadingItemProps {
	heading: ParsedHeading;
	filePath: string;
	isSelectable?: boolean;
	isSelected?: boolean;
	onToggleSelect?: (item: HeadingDragData) => void;
}

export function HeadingItem({
	heading,
	filePath,
	isSelectable = false,
	isSelected = false,
	onToggleSelect,
}: HeadingItemProps): React.ReactElement {
	const getDragData = useCallback(
		(): HeadingDragData => ({
			type: "heading-explorer-drag",
			filePath,
			headingText: heading.heading,
			headingLevel: heading.level,
			headingLine: heading.position.start.line,
		}),
		[heading, filePath],
	);

	const { isDragging, handleDragStart, handleDragEnd } = useDragData(getDragData);

	const handleCheckboxChange = useCallback(() => {
		onToggleSelect?.(getDragData());
	}, [getDragData, onToggleSelect]);

	const className = `flex items-center gap-1 px-2 py-0.5 cursor-grab rounded truncate hover:bg-ob-hover ${isDragging ? "opacity-50" : ""} ${isSelected ? "bg-ob-hover" : ""}`;

	return (
		<div
			className={className}
			draggable={!isSelectable}
			onDragStart={isSelectable ? undefined : handleDragStart}
			onDragEnd={isSelectable ? undefined : handleDragEnd}
			style={{ paddingLeft: `${(heading.level - 1) * 16}px` }}
		>
			{isSelectable && (
				<input
					type="checkbox"
					checked={isSelected}
					onChange={handleCheckboxChange}
					className="mr-1"
				/>
			)}
			{heading.heading}
		</div>
	);
}
