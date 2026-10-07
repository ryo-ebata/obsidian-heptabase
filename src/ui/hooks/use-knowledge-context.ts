import { KnowledgeContextService, type KnowledgeContext } from "@/services/knowledge-context";
import { useApp } from "@/ui/hooks/use-app";
import type { TFile } from "obsidian";
import { useEffect, useMemo, useState } from "react";

const EMPTY_CONTEXT: KnowledgeContext = { backlinks: [], canvases: [] };

export function useKnowledgeContext(file: TFile | null): KnowledgeContext {
	const { app } = useApp();
	const service = useMemo(() => new KnowledgeContextService(app), [app]);
	const [context, setContext] = useState<KnowledgeContext>(EMPTY_CONTEXT);

	useEffect(() => {
		if (!file) {
			setContext(EMPTY_CONTEXT);
			return;
		}

		let cancelled = false;
		const refresh = () => {
			service
				.getForFile(file)
				.then((next) => {
					if (!cancelled) setContext(next);
				})
				.catch(() => {
					if (!cancelled) setContext(EMPTY_CONTEXT);
				});
		};

		refresh();
		const modifyRef = app.vault.on("modify", refresh);
		const deleteRef = app.vault.on("delete", refresh);
		const metadataRef = app.metadataCache.on("resolved", refresh);

		return () => {
			cancelled = true;
			app.vault.offref(modifyRef);
			app.vault.offref(deleteRef);
			app.metadataCache.offref(metadataRef);
		};
	}, [app.metadataCache, app.vault, file, service]);

	return context;
}
