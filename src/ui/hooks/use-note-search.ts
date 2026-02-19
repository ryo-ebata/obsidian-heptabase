import { HeadingParser } from "@/services/heading-parser";
import type { SearchResult } from "@/types/plugin";
import { useApp } from "@/ui/hooks/use-app";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface NoteSearchState {
	query: string;
	results: SearchResult[];
	setQuery: (query: string) => void;
}

export function useNoteSearch(): NoteSearchState {
	const { app } = useApp();
	const parser = useMemo(() => new HeadingParser(app), [app]);

	const [query, setQueryState] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		parser.search("").then(setResults);
	}, [parser]);

	const setQuery = useCallback(
		(newQuery: string) => {
			setQueryState(newQuery);

			if (timerRef.current !== null) {
				clearTimeout(timerRef.current);
			}

			timerRef.current = setTimeout(() => {
				parser.search(newQuery).then(setResults);
			}, 300);
		},
		[parser],
	);

	useEffect(() => {
		return () => {
			if (timerRef.current !== null) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	return { query, results, setQuery };
}
