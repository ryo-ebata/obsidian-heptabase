import type { SearchResult } from "@/types/plugin";
import { NoteCard } from "@/ui/components/note-card";
import { useInfiniteScroll } from "@/ui/hooks/use-infinite-scroll";
import type React from "react";

const PAGE_SIZE = 20;

interface CardGridProps {
	results: SearchResult[];
}

export function CardGrid({ results }: CardGridProps): React.ReactElement {
	const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(results, PAGE_SIZE);

	if (results.length === 0) {
		return <div className="text-ob-muted text-center p-5 text-ob-ui-small">No notes found.</div>;
	}

	return (
		<div className="@container">
			<div className="grid grid-cols-1 @[320px]:grid-cols-2 gap-2">
				{visibleItems.map((result) => (
					<NoteCard key={result.file.path} file={result.file} excerpt={result.excerpt} />
				))}
				{hasMore && <div ref={sentinelRef} data-testid="sentinel" className="h-full" />}
			</div>
		</div>
	);
}
