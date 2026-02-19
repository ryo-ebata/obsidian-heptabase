import { useClickOutside } from "@/ui/hooks/use-click-outside";
import { useFileSearch } from "@/ui/hooks/use-file-search";
import type { TFile } from "obsidian";
import type React from "react";
import { useCallback, useRef, useState } from "react";

interface FileSearchDropdownProps {
	onSelect: (file: TFile | null) => void;
}

export function FileSearchDropdown({ onSelect }: FileSearchDropdownProps): React.ReactElement {
	const { query, setQuery, results } = useFileSearch();
	const [showResults, setShowResults] = useState(true);
	const containerRef = useRef<HTMLDivElement>(null);

	const handleDismiss = useCallback(() => {
		setShowResults(false);
	}, []);

	useClickOutside(containerRef, handleDismiss);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setQuery(e.target.value);
			setShowResults(true);
		},
		[setQuery],
	);

	const handleSelect = useCallback(
		(file: TFile) => {
			onSelect(file);
			setQuery("");
			setShowResults(false);
		},
		[onSelect, setQuery],
	);

	const visibleResults = showResults ? results : [];

	return (
		<div ref={containerRef} className="px-2 py-1">
			<input
				type="text"
				placeholder="Search articles..."
				value={query}
				onChange={handleChange}
				className="w-full px-2 py-1 border border-ob-border rounded bg-transparent text-ob-normal text-ob-ui-small"
			/>
			{visibleResults.length > 0 && (
				<ul className="mt-1 max-h-48 overflow-y-auto list-none p-0 m-0">
					{visibleResults.map((file) => (
						<FileSearchItem key={file.path} file={file} onSelect={handleSelect} />
					))}
				</ul>
			)}
		</div>
	);
}

interface FileSearchItemProps {
	file: TFile;
	onSelect: (file: TFile) => void;
}

function FileSearchItem({ file, onSelect }: FileSearchItemProps): React.ReactElement {
	const handleClick = useCallback(() => {
		onSelect(file);
	}, [file, onSelect]);

	return (
		<li
			role="listitem"
			className="px-2 py-1 cursor-pointer text-ob-muted hover:text-ob-normal hover:bg-ob-bg-hover rounded text-ob-ui-small"
			onClick={handleClick}
		>
			{file.path}
		</li>
	);
}
