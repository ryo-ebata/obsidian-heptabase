import type React from "react";

interface SearchBarProps {
	query: string;
	onQueryChange: (query: string) => void;
}

export function SearchBar({ query, onQueryChange }: SearchBarProps): React.ReactElement {
	return (
		<div className="w-full mb-2">
			<input
				className="w-full px-2.5 py-1.5"
				type="text"
				placeholder="Search notes..."
				value={query}
				onChange={(e) => onQueryChange(e.target.value)}
			/>
		</div>
	);
}
