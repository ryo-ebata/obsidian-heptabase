import type { HeadingDragData, SearchResult } from "@/types/plugin";
import { NoteItem } from "@/ui/components/note-item";
import type React from "react";

interface NoteListProps {
	results: SearchResult[];
	isSelectable?: boolean;
	isSelected?: (filePath: string, headingLine: number) => boolean;
	onToggleSelect?: (item: HeadingDragData) => void;
}

export function NoteList({
	results,
	isSelectable = false,
	isSelected,
	onToggleSelect,
}: NoteListProps): React.ReactElement {
	if (results.length === 0) {
		return <div className="text-ob-muted text-center p-5 text-ob-ui-small">No notes found.</div>;
	}

	return (
		<div className="flex flex-col">
			{results.map((result) => (
				<NoteItem
					key={result.file.path}
					file={result.file}
					headings={result.headings}
					isSelectable={isSelectable}
					isSelected={isSelected}
					onToggleSelect={onToggleSelect}
				/>
			))}
		</div>
	);
}
