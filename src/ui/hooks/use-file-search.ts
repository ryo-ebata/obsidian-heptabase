import type { TFile } from "obsidian";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "./use-app";

interface UseFileSearchReturn {
	query: string;
	setQuery: (q: string) => void;
	results: TFile[];
	selectedFile: TFile | null;
	selectFile: (file: TFile | null) => void;
}

export function useFileSearch(): UseFileSearchReturn {
	const { app } = useApp();
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [selectedFile, setSelectedFile] = useState<TFile | null>(null);

	useEffect(() => {
		if (query === "") {
			setDebouncedQuery("");
			return;
		}
		const timer = setTimeout(() => {
			setDebouncedQuery(query);
		}, 300);
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

	return { query, setQuery, results, selectedFile, selectFile };
}
