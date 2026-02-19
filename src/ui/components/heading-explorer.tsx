import { NoteList } from "@/ui/components/note-list";
import { SearchBar } from "@/ui/components/search-bar";
import { useNoteSearch } from "@/ui/hooks/use-note-search";
import type React from "react";

export function HeadingExplorer(): React.ReactElement {
	const { query, results, setQuery } = useNoteSearch();

	return (
		<div className="p-2 h-full overflow-y-auto">
			<SearchBar query={query} onQueryChange={setQuery} />
			<NoteList results={results} />
		</div>
	);
}
