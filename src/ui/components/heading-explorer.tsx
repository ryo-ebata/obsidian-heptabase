import type { MultiHeadingDragData } from "@/types/plugin";
import { NoteList } from "@/ui/components/note-list";
import { SearchBar } from "@/ui/components/search-bar";
import { useHeadingSelection } from "@/ui/hooks/use-heading-selection";
import { useNoteSearch } from "@/ui/hooks/use-note-search";
import type React from "react";
import { useCallback, useState } from "react";

export function HeadingExplorer(): React.ReactElement {
	const { query, results, setQuery } = useNoteSearch();
	const [isSelectionMode, setIsSelectionMode] = useState(false);
	const { selectedHeadings, selectionCount, isSelected, toggleSelection, clearSelection } =
		useHeadingSelection();

	const handleToggleSelectionMode = useCallback(() => {
		setIsSelectionMode((prev) => {
			if (prev) {
				clearSelection();
			}
			return !prev;
		});
	}, [clearSelection]);

	const handleDragStart = useCallback(
		(e: React.DragEvent) => {
			/* v8 ignore next 3 -- drag bar only renders when selectionCount > 0 */
			if (selectionCount === 0) {
				return;
			}
			const dragData: MultiHeadingDragData = {
				type: "multi-heading-drag",
				items: selectedHeadings,
			};
			e.dataTransfer.setData("application/json", JSON.stringify(dragData));
			e.dataTransfer.effectAllowed = "copy";
		},
		[selectedHeadings, selectionCount],
	);

	return (
		<div className="p-2 h-full overflow-y-auto">
			<div className="flex items-center gap-2 mb-2">
				<div className="flex-1">
					<SearchBar query={query} onQueryChange={setQuery} />
				</div>
				<button
					type="button"
					className={`px-2 py-1 rounded text-ob-ui-small ${isSelectionMode ? "bg-ob-accent text-white" : "hover:bg-ob-hover"}`}
					onClick={handleToggleSelectionMode}
					title={isSelectionMode ? "Exit selection mode" : "Select headings"}
				>
					{isSelectionMode ? "Done" : "Select"}
				</button>
			</div>
			<NoteList
				results={results}
				isSelectable={isSelectionMode}
				isSelected={isSelected}
				onToggleSelect={toggleSelection}
			/>
			{isSelectionMode && selectionCount > 0 && (
				<div
					className="sticky bottom-0 flex items-center gap-2 p-2 bg-ob-hover rounded"
					draggable
					onDragStart={handleDragStart}
				>
					<span className="text-ob-ui-small font-medium cursor-grab">
						{selectionCount} heading{selectionCount > 1 ? "s" : ""} selected
					</span>
					<button
						type="button"
						className="ml-auto px-2 py-0.5 rounded text-ob-ui-small hover:bg-ob-border"
						onClick={clearSelection}
					>
						Clear
					</button>
				</div>
			)}
		</div>
	);
}
