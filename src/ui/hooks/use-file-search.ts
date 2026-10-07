import type { TFile } from "obsidian";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "./use-app";

const SEARCH_DEBOUNCE_MS = 160;

interface UseFileSearchReturn {
	query: string;
	setQuery: (q: string) => void;
	results: TFile[];
	selectedFile: TFile | null;
	selectFile: (file: TFile | null) => void;
	searchSettled: boolean;
}

export function useFileSearch(): UseFileSearchReturn {
	const { app } = useApp();
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [searchSettled, setSearchSettled] = useState(true);
	const [selectedFile, setSelectedFile] = useState<TFile | null>(null);

	useEffect(() => {
		setSelectedFile(null);
		const normalizedQuery = query.trim();
		if (normalizedQuery === "") {
			setDebouncedQuery("");
			setSearchSettled(true);
			return;
		}
		setSearchSettled(false);
		const timer = setTimeout(() => {
			setDebouncedQuery(normalizedQuery);
			setSearchSettled(true);
		}, SEARCH_DEBOUNCE_MS);
		return () => {
			clearTimeout(timer);
		};
	}, [query]);

	const results = useMemo(() => {
		if (debouncedQuery === "") {
			return [];
		}
		const files = app.vault.getMarkdownFiles();
		const lowerQuery = debouncedQuery.toLowerCase();
		return files.filter((file) => file.path.toLowerCase().includes(lowerQuery));
	}, [app.vault, debouncedQuery]);

	const selectFile = useCallback((file: TFile | null) => {
		setSelectedFile(file);
	}, []);

	return { query, setQuery, results, selectedFile, selectFile, searchSettled };
}
