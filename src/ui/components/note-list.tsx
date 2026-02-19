import type { SearchResult } from "@/types/plugin";
import { NoteItem } from "@/ui/components/note-item";
import type React from "react";

interface NoteListProps {
	results: SearchResult[];
}

export function NoteList({ results }: NoteListProps): React.ReactElement {
	if (results.length === 0) {
		return <div className="text-ob-muted text-center p-5 text-ob-ui-small">No notes found.</div>;
	}

	return (
		<div className="flex flex-col">
			{results.map((result) => (
				<NoteItem key={result.file.path} file={result.file} headings={result.headings} />
			))}
		</div>
	);
}
