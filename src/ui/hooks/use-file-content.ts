import type { TFile } from "obsidian";
import { useEffect, useState } from "react";
import { useApp } from "./use-app";

interface UseFileContentReturn {
	content: string;
	isLoading: boolean;
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

	return { content, isLoading };
}
