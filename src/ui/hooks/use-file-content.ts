import type { TFile } from "obsidian";
import { useCallback, useEffect, useState } from "react";
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

	useEffect(() => {
		if (!file) {
			setContent("");
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		setIsLoading(true);

		app.vault.read(file).then((text) => {
			if (!cancelled) {
				setContent(text);
				setIsLoading(false);
			}
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
		app.vault.read(file).then((text) => {
			setContent(text);
		});
	}, [app.vault, file]);

	return { content, isLoading, save, refresh };
}
