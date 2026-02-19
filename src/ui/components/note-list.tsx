import type { SearchResult } from "@/types/plugin";
import { NoteItem } from "@/ui/components/note-item";
import type React from "react";

interface NoteListProps {
	results: SearchResult[];
}

export function NoteList({ results }: NoteListProps): React.ReactElement {
	if (results.length === 0) {
		return <div className="heading-explorer-empty">No notes found.</div>;
	}

	return (
		<div className="heading-explorer-notes">
			{results.map((result) => (
				<NoteItem key={result.file.path} file={result.file} headings={result.headings} />
			))}
		</div>
	);
}
