import { HeadingParser } from "@/services/heading-parser";
import type { SearchResult } from "@/types/plugin";
import { useApp } from "@/ui/hooks/use-app";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface NoteSearchState {
	query: string;
	results: SearchResult[];
	isSearching: boolean;
	setQuery: (query: string) => void;
}

const SEARCH_DEBOUNCE_MS = 160;

export function useNoteSearch(): NoteSearchState {
	const { app } = useApp();
	const parser = useMemo(() => new HeadingParser(app), [app]);

	const [query, setQueryState] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(true);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const requestIdRef = useRef(0);
	const mountedRef = useRef(true);
	const allResultsRef = useRef<SearchResult[]>([]);
	const hasLoadedAllRef = useRef(false);

	useEffect(() => {
		mountedRef.current = true;
		let cancelled = false;
		const requestId = ++requestIdRef.current;
		parser
			.search("")
			.then((initialResults) => {
				if (!cancelled && mountedRef.current && requestId === requestIdRef.current) {
					allResultsRef.current = initialResults;
					hasLoadedAllRef.current = true;
					setResults(initialResults);
					setIsSearching(false);
				}
			})
			.catch(() => {
				if (!cancelled && mountedRef.current && requestId === requestIdRef.current) {
					setResults([]);
					setIsSearching(false);
				}
			});
		return () => {
			cancelled = true;
			mountedRef.current = false;
		};
	}, [parser]);

	const setQuery = useCallback(
		(newQuery: string) => {
			setQueryState(newQuery);
			setIsSearching(true);

			if (timerRef.current !== null) {
				clearTimeout(timerRef.current);
			}
			if (newQuery.trim() === "") {
				if (hasLoadedAllRef.current) setResults(allResultsRef.current);
				const requestId = ++requestIdRef.current;
				parser
					.search("")
					.then((nextResults) => {
						if (mountedRef.current && requestId === requestIdRef.current) {
							allResultsRef.current = nextResults;
							hasLoadedAllRef.current = true;
							setResults(nextResults);
							setIsSearching(false);
						}
					})
					.catch(() => {
						if (mountedRef.current && requestId === requestIdRef.current) setIsSearching(false);
					});
				return;
			}

			timerRef.current = setTimeout(() => {
				timerRef.current = null;
				const requestId = ++requestIdRef.current;
				parser
					.search(newQuery.trim())
					.then((nextResults) => {
						if (mountedRef.current && requestId === requestIdRef.current) {
							setResults(nextResults);
							setIsSearching(false);
						}
					})
					.catch(() => {
						if (mountedRef.current && requestId === requestIdRef.current) {
							setResults([]);
							setIsSearching(false);
						}
					});
			}, SEARCH_DEBOUNCE_MS);
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

	return { query, results, isSearching, setQuery };
}
