import type { NoteDragData, ParsedHeading } from "@/types/plugin";
import { HeadingItem } from "@/ui/components/heading-item";
import type { TFile } from "obsidian";
import type React from "react";
import { useCallback, useState } from "react";

interface NoteItemProps {
	file: TFile;
	headings: ParsedHeading[];
}

export function NoteItem({ file, headings }: NoteItemProps): React.ReactElement {
	const [expanded, setExpanded] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const hasHeadings = headings.length > 0;

	const toggleExpanded = useCallback(() => {
		if (hasHeadings) {
			setExpanded((prev) => !prev);
		}
	}, [hasHeadings]);

	const handleDragStart = useCallback(
		(e: React.DragEvent) => {
			const dragData: NoteDragData = {
				type: "note-drag",
				filePath: file.path,
			};
			e.dataTransfer.setData("application/json", JSON.stringify(dragData));
			e.dataTransfer.effectAllowed = "copy";
			setIsDragging(true);
		},
		[file.path],
	);

	const handleDragEnd = useCallback(() => {
		setIsDragging(false);
	}, []);

	const titleClassName = `flex items-center gap-1 px-2 py-1 cursor-pointer rounded font-medium hover:bg-ob-hover ${isDragging ? "opacity-50" : ""}`;

	return (
		<div className="mb-1">
			<div
				className={titleClassName}
				onClick={toggleExpanded}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						toggleExpanded();
					}
				}}
				draggable
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				{hasHeadings && (
					<span className={`flex transition-transform duration-100 ${expanded ? "" : "-rotate-90"}`}>{"\u25BC"}</span>
				)}
				<span>{file.basename}</span>
			</div>
			{expanded && hasHeadings && (
				<ul className="list-none p-0 m-0">
					{headings.map((heading) => (
						<li key={`${heading.position.start.line}-${heading.heading}`}>
							<HeadingItem heading={heading} filePath={file.path} />
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
