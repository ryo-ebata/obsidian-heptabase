import { HeadingParser } from "@/services/heading-parser";
import type { SearchResult } from "@/types/plugin";
import { useApp } from "@/ui/hooks/use-app";
import { TFile } from "obsidian";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface NoteSearchState {
	query: string;
	results: SearchResult[];
	isSearching: boolean;
	isHydrating: boolean;
	setQuery: (query: string) => void;
}

const SEARCH_DEBOUNCE_MS = 160;
const VAULT_REFRESH_DEBOUNCE_MS = 80;

export function useNoteSearch(): NoteSearchState {
	const { app } = useApp();
	const parser = useMemo(() => new HeadingParser(app), [app]);
	const [query, setQueryState] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(true);
	const [isHydrating, setIsHydrating] = useState(true);
	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const requestIdRef = useRef(0);
	const mountedRef = useRef(true);
	const queryRef = useRef("");
	const allResultsRef = useRef<SearchResult[]>([]);

	const runSearch = useCallback(
		async (targetQuery: string, showProgress = true): Promise<void> => {
			const requestId = ++requestIdRef.current;
			if (showProgress) setIsSearching(true);
			try {
				const nextResults = await parser.search(targetQuery);
				if (!mountedRef.current || requestId !== requestIdRef.current) return;
				if (targetQuery === "") allResultsRef.current = nextResults;
				setResults(nextResults);
			} catch {
				if (mountedRef.current && requestId === requestIdRef.current) setResults([]);
			} finally {
				if (mountedRef.current && requestId === requestIdRef.current) {
					setIsSearching(false);
					setIsHydrating(false);
				}
			}
		},
		[parser],
	);

	useEffect(() => {
		mountedRef.current = true;
		setResults(parser.list());
		void runSearch("");
		return () => {
			mountedRef.current = false;
		};
	}, [parser, runSearch]);

	useEffect(() => {
		const scheduleRefresh = (path?: string): void => {
			parser.invalidate(path);
			requestIdRef.current += 1;
			if (queryRef.current === "") setResults(parser.list());
			if (refreshTimerRef.current !== null) clearTimeout(refreshTimerRef.current);
			refreshTimerRef.current = setTimeout(() => {
				refreshTimerRef.current = null;
				void runSearch(queryRef.current, false);
			}, VAULT_REFRESH_DEBOUNCE_MS);
		};
		const createRef = app.vault.on("create", (file) => {
			if (file instanceof TFile && file.extension === "md") scheduleRefresh(file.path);
		});
		const modifyRef = app.vault.on("modify", (file) => {
			if (file instanceof TFile && file.extension === "md") scheduleRefresh(file.path);
		});
		const deleteRef = app.vault.on("delete", (file) => {
			if (file instanceof TFile && file.extension === "md") scheduleRefresh(file.path);
		});
		const renameRef = app.vault.on("rename", (file, oldPath) => {
			if (!(file instanceof TFile) || file.extension !== "md") return;
			parser.invalidate(oldPath);
			scheduleRefresh(file.path);
		});
		return () => {
			app.vault.offref(createRef);
			app.vault.offref(modifyRef);
			app.vault.offref(deleteRef);
			app.vault.offref(renameRef);
		};
	}, [app.vault, parser, runSearch]);

	const setQuery = useCallback(
		(newQuery: string) => {
			setQueryState(newQuery);
			requestIdRef.current += 1;
			const normalizedQuery = newQuery.trim();
			queryRef.current = normalizedQuery;
			setIsSearching(true);
			if (searchTimerRef.current !== null) clearTimeout(searchTimerRef.current);

			if (normalizedQuery === "") {
				if (allResultsRef.current.length > 0) setResults(allResultsRef.current);
				void runSearch("");
				return;
			}

			searchTimerRef.current = setTimeout(() => {
				searchTimerRef.current = null;
				void runSearch(normalizedQuery);
			}, SEARCH_DEBOUNCE_MS);
		},
		[runSearch],
	);

	useEffect(() => {
		return () => {
			if (searchTimerRef.current !== null) clearTimeout(searchTimerRef.current);
			if (refreshTimerRef.current !== null) clearTimeout(refreshTimerRef.current);
		};
	}, []);

	return { query, results, isSearching, isHydrating, setQuery };
}
