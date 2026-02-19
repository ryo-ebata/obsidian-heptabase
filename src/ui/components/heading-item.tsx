import type { HeadingDragData, ParsedHeading } from "@/types/plugin";
import type React from "react";
import { useCallback, useState } from "react";

interface HeadingItemProps {
	heading: ParsedHeading;
	filePath: string;
}

export function HeadingItem({ heading, filePath }: HeadingItemProps): React.ReactElement {
	const [isDragging, setIsDragging] = useState(false);

	const handleDragStart = useCallback(
		(e: React.DragEvent) => {
			const dragData: HeadingDragData = {
				type: "heading-explorer-drag",
				filePath,
				headingText: heading.heading,
				headingLevel: heading.level,
				headingLine: heading.position.start.line,
			};
			e.dataTransfer.setData("application/json", JSON.stringify(dragData));
			e.dataTransfer.effectAllowed = "copy";
			setIsDragging(true);
		},
		[heading, filePath],
	);

	const handleDragEnd = useCallback(() => {
		setIsDragging(false);
	}, []);

	const className = `heading-explorer-heading${isDragging ? " is-dragging" : ""}`;

	return (
		<div
			className={className}
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			style={{ paddingLeft: `${(heading.level - 1) * 16}px` }}
		>
			{heading.heading}
		</div>
	);
}
