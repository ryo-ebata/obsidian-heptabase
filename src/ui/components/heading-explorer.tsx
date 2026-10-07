import { CardGrid } from "@/ui/components/card-grid";
import { filterAndSortLibraryResults, type LibrarySort } from "@/services/library-results";
import { LibraryFilters } from "@/ui/components/library-filters";
import { SearchBar } from "@/ui/components/search-bar";
import { useActiveCanvasState } from "@/ui/hooks/use-canvas-state";
import { useNoteSearch } from "@/ui/hooks/use-note-search";
import type React from "react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

export function HeadingExplorer(): React.ReactElement {
	const { query, results, isSearching, isHydrating, setQuery } = useNoteSearch();
	const [tag, setTag] = useState("");
	const [folder, setFolder] = useState("");
	const [sort, setSort] = useState<LibrarySort>("updated");
	const [canvasOnly, setCanvasOnly] = useState(false);
	const deferredResults = useDeferredValue(results);
	const deferredTag = useDeferredValue(tag);
	const deferredFolder = useDeferredValue(folder);
	const resultsRef = useRef<HTMLDivElement>(null);
	const canvasContext = useActiveCanvasState();
	const canvasView = canvasContext.canvasView;
	const selectedPathSignature = [...canvasContext.selectedPaths].toSorted().join("\u0000");

	const filteredResults = useMemo(() => {
		const filtered = filterAndSortLibraryResults(deferredResults, {
			tag: deferredTag,
			folder: deferredFolder,
			sort,
		});
		return canvasOnly
			? filtered.filter((result) => canvasContext.inCanvasPaths.has(result.file.path))
			: filtered;
	}, [canvasContext.inCanvasPaths, canvasOnly, deferredFolder, deferredResults, deferredTag, sort]);

	useEffect(() => {
		if (resultsRef.current) resultsRef.current.scrollTop = 0;
	}, [query, tag, folder, sort, canvasOnly]);

	useEffect(() => {
		if (!canvasView) setCanvasOnly(false);
	}, [canvasView]);

	useEffect(() => {
		if (canvasContext.selectedPaths.size !== 1 || !resultsRef.current) return;
		const selectedPath = [...canvasContext.selectedPaths][0];
		const card = [...resultsRef.current.querySelectorAll<HTMLElement>("[data-file-path]")].find(
			(element) => element.dataset.filePath === selectedPath,
		);
		card?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
	}, [canvasContext.selectedPaths, selectedPathSignature]);

	return (
		<div className="heptabase-library p-2 h-full flex flex-col overflow-hidden">
			<div className="heptabase-library__controls shrink-0">
				<SearchBar query={query} onQueryChange={setQuery} />
				<LibraryFilters
					results={results}
					tag={tag}
					folder={folder}
					sort={sort}
					resultCount={filteredResults.length}
					canvasOnly={canvasOnly}
					hasCanvas={Boolean(canvasView)}
					onTagChange={setTag}
					onFolderChange={setFolder}
					onSortChange={setSort}
					onCanvasOnlyChange={setCanvasOnly}
				/>
				<div
					className={`heptabase-search-progress ${isSearching ? "is-active" : ""}`}
					role="progressbar"
					aria-label="Updating card library"
					aria-hidden={!isSearching}
				/>
			</div>
			<div
				ref={resultsRef}
				className="heptabase-library__results flex-1 min-h-0 overflow-y-auto pt-2"
				aria-busy={isSearching}
			>
				<CardGrid
					results={filteredResults}
					query={query}
					inCanvasPaths={canvasContext.inCanvasPaths}
					selectedPaths={canvasContext.selectedPaths}
					isHydrating={isHydrating}
					hasActiveFilters={query.trim() !== "" || tag !== "" || folder !== "" || canvasOnly}
					onClearFilters={() => {
						setQuery("");
						setTag("");
						setFolder("");
						setCanvasOnly(false);
					}}
				/>
			</div>
		</div>
	);
}
