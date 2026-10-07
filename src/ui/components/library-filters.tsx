import type { SearchResult } from "@/types/plugin";
import type { LibrarySort } from "@/services/library-results";
import type React from "react";
import { memo, useId, useMemo } from "react";

interface LibraryFiltersProps {
	results: SearchResult[];
	tag: string;
	folder: string;
	sort: LibrarySort;
	resultCount: number;
	canvasOnly?: boolean;
	hasCanvas?: boolean;
	onTagChange: (tag: string) => void;
	onFolderChange: (folder: string) => void;
	onSortChange: (sort: LibrarySort) => void;
	onCanvasOnlyChange?: (canvasOnly: boolean) => void;
}

export const LibraryFilters = memo(function LibraryFiltersInner({
	results,
	tag,
	folder,
	sort,
	resultCount,
	canvasOnly = false,
	hasCanvas = false,
	onTagChange,
	onFolderChange,
	onSortChange,
	onCanvasOnlyChange,
}: LibraryFiltersProps): React.ReactElement {
	const tagFilterId = useId();
	const folderFilterId = useId();
	const sortId = useId();
	const { tags, folders } = useMemo(() => {
		const tagSet = new Set<string>();
		const folderSet = new Set<string>();
		for (const result of results) {
			for (const resultTag of result.tags ?? []) tagSet.add(resultTag);
			folderSet.add(result.folder ?? "/");
		}
		return {
			tags: [...tagSet].toSorted((a, b) => a.localeCompare(b)),
			folders: [...folderSet].toSorted((a, b) => a.localeCompare(b)),
		};
	}, [results]);

	return (
		<div className="heptabase-library-filters">
			<div className="heptabase-library-filters__bar">
				<span className="heptabase-library-filters__count" aria-live="polite">
					{resultCount} {resultCount === 1 ? "card" : "cards"}
				</span>
				<details className="heptabase-library-filters__menu">
					<summary aria-label="Filter and sort cards">
						<span aria-hidden="true" className="heptabase-library-filters__glyph" />
						Refine
					</summary>
					<div className="heptabase-library-filters__popover">
						<label htmlFor={tagFilterId}>Tag</label>
						<select
							id={tagFilterId}
							aria-label="Filter by tag"
							className="heptabase-field w-full min-w-0"
							value={tag}
							onChange={(event) => onTagChange(event.target.value)}
						>
							<option value="">All tags</option>
							{tags.map((value) => (
								<option key={value} value={value}>
									#{value}
								</option>
							))}
						</select>
						<label htmlFor={folderFilterId}>Folder</label>
						<select
							id={folderFilterId}
							aria-label="Filter by folder"
							className="heptabase-field w-full min-w-0"
							value={folder}
							onChange={(event) => onFolderChange(event.target.value)}
						>
							<option value="">All folders</option>
							{folders.map((value) => (
								<option key={value} value={value}>
									{value}
								</option>
							))}
						</select>
						<label htmlFor={sortId}>Sort</label>
						<select
							id={sortId}
							aria-label="Sort cards"
							className="heptabase-field w-full min-w-0"
							value={sort}
							onChange={(event) => onSortChange(event.target.value as LibrarySort)}
						>
							<option value="updated">Recently updated</option>
							<option value="title-asc">Title A–Z</option>
							<option value="title-desc">Title Z–A</option>
						</select>
						<span className="heptabase-library-filters__label">Scope</span>
						<label className="heptabase-library-filters__check" htmlFor={`${sortId}-canvas`}>
							<input
								id={`${sortId}-canvas`}
								type="checkbox"
								checked={canvasOnly}
								disabled={!hasCanvas}
								onChange={(event) => onCanvasOnlyChange?.(event.target.checked)}
							/>
							Current Canvas
						</label>
					</div>
				</details>
			</div>
			{(tag || folder || sort !== "updated" || canvasOnly) && (
				<div className="heptabase-library-filters__active" aria-label="Active filters">
					{tag && (
						<button type="button" onClick={() => onTagChange("")} aria-label={`Remove tag ${tag}`}>
							#{tag}
							<span aria-hidden="true">×</span>
						</button>
					)}
					{folder && (
						<button
							type="button"
							onClick={() => onFolderChange("")}
							aria-label={`Remove folder ${folder}`}
						>
							{folder}
							<span aria-hidden="true">×</span>
						</button>
					)}
					{sort !== "updated" && (
						<button
							type="button"
							onClick={() => onSortChange("updated")}
							aria-label="Reset sort order"
						>
							{sort === "title-asc" ? "A–Z" : "Z–A"}
							<span aria-hidden="true">×</span>
						</button>
					)}
					{canvasOnly && (
						<button
							type="button"
							onClick={() => onCanvasOnlyChange?.(false)}
							aria-label="Show cards from the entire vault"
						>
							Current Canvas<span aria-hidden="true">×</span>
						</button>
					)}
				</div>
			)}
		</div>
	);
});
