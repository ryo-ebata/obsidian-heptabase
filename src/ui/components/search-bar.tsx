import type React from "react";

interface SearchBarProps {
	query: string;
	onQueryChange: (query: string) => void;
}

export function SearchBar({ query, onQueryChange }: SearchBarProps): React.ReactElement {
	return (
		<div className="heading-explorer-search">
			<input
				type="text"
				placeholder="Search notes..."
				value={query}
				onChange={(e) => onQueryChange(e.target.value)}
			/>
		</div>
	);
}
