import type { SearchResult } from "@/types/plugin";
import { NoteCard } from "@/ui/components/note-card";
import { useInfiniteScroll } from "@/ui/hooks/use-infinite-scroll";
import type React from "react";

const PAGE_SIZE = 20;

interface CardGridProps {
	results: SearchResult[];
	query?: string;
	inCanvasPaths?: ReadonlySet<string>;
	selectedPaths?: ReadonlySet<string>;
	isHydrating?: boolean;
	hasActiveFilters?: boolean;
	onClearFilters?: () => void;
}

export function CardGrid({
	results,
	query = "",
	inCanvasPaths = new Set(),
	selectedPaths = new Set(),
	isHydrating = false,
	hasActiveFilters = false,
	onClearFilters,
}: CardGridProps): React.ReactElement {
	const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(results, PAGE_SIZE);

	if (results.length === 0) {
		return (
			<div className="heptabase-empty-state text-ob-muted text-center p-5 text-ob-ui-small">
				<p>{hasActiveFilters ? "No cards match these filters." : "No cards in this vault yet."}</p>
				{hasActiveFilters && onClearFilters && (
					<button type="button" className="heptabase-text-action" onClick={onClearFilters}>
						Clear filters
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="@container">
			<div className="heptabase-library__grid grid grid-cols-1 @[440px]:grid-cols-2">
				{visibleItems.map((result) => (
					<NoteCard
						key={result.file.path}
						file={result.file}
						excerpt={result.excerpt}
						headings={result.headings}
						tags={result.tags}
						query={query}
						isInCanvas={inCanvasPaths.has(result.file.path)}
						isCanvasSelected={selectedPaths.has(result.file.path)}
						isHydrating={isHydrating}
					/>
				))}
				{hasMore && <div ref={sentinelRef} data-testid="sentinel" className="h-full" />}
			</div>
		</div>
	);
}
