import type React from "react";
import { useId } from "react";

interface SearchBarProps {
	query: string;
	onQueryChange: (query: string) => void;
}

export function SearchBar({ query, onQueryChange }: SearchBarProps): React.ReactElement {
	const inputId = useId();

	return (
		<div className="heptabase-search-field w-full mb-2">
			<label className="sr-only" htmlFor={inputId}>
				Search card library
			</label>
			<input
				id={inputId}
				className="heptabase-field w-full px-2.5 py-1.5"
				type="text"
				placeholder="Search cards..."
				value={query}
				onChange={(e) => onQueryChange(e.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Escape" && query !== "") {
						event.preventDefault();
						onQueryChange("");
					}
				}}
			/>
			{query !== "" && (
				<button
					type="button"
					className="heptabase-search-clear"
					aria-label="Clear card search"
					onClick={() => onQueryChange("")}
				>
					×
				</button>
			)}
		</div>
	);
}
