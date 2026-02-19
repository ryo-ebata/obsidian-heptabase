import { useApp } from "@/ui/hooks/use-app";
import { type TFile, MarkdownView } from "obsidian";
import { useCallback, useEffect, useState } from "react";

export function useActiveFile(): TFile | null {
	const { app } = useApp();

	const getActiveFile = useCallback((): TFile | null => {
		const view = app.workspace.getActiveViewOfType(MarkdownView);
		return view?.file ?? null;
	}, [app]);

	const [activeFile, setActiveFile] = useState<TFile | null>(getActiveFile);

	useEffect(() => {
		const ref = app.workspace.on("file-open", () => {
			setActiveFile(getActiveFile());
		});

		return () => {
			app.workspace.offref(ref);
		};
	}, [app, getActiveFile]);

	return activeFile;
}
