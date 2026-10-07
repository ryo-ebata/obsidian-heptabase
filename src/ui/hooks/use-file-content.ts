import type { TFile } from "obsidian";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "./use-app";

interface UseFileContentReturn {
	content: string;
	isLoading: boolean;
	save: (newContent: string) => Promise<void>;
	refresh: () => void;
}

export function useFileContent(file: TFile | null): UseFileContentReturn {
	const { app } = useApp();
	const [content, setContent] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const mountedRef = useRef(true);
	const readRequestRef = useRef(0);

	useEffect(() => {
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		if (!file) {
			readRequestRef.current += 1;
			setContent("");
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		const requestId = ++readRequestRef.current;
		setContent("");
		setIsLoading(true);

		app.vault
			.read(file)
			.then((text) => {
				if (!cancelled && requestId === readRequestRef.current) {
					setContent(text);
					setIsLoading(false);
				}
			})
			.catch(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [app.vault, file]);

	const save = useCallback(
		async (newContent: string) => {
			if (!file) {
				return;
			}
			await app.vault.modify(file, newContent);
		},
		[app.vault, file],
	);

	const refresh = useCallback(() => {
		if (!file) {
			return;
		}
		const requestId = ++readRequestRef.current;
		app.vault
			.read(file)
			.then((text) => {
				if (mountedRef.current && requestId === readRequestRef.current) setContent(text);
			})
			.catch(() => undefined);
	}, [app.vault, file]);

	return { content, isLoading, save, refresh };
}
