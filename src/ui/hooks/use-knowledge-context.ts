import { KnowledgeContextService, type KnowledgeContext } from "@/services/knowledge-context";
import { useApp } from "@/ui/hooks/use-app";
import type { TFile } from "obsidian";
import { useEffect, useMemo, useRef, useState } from "react";

const EMPTY_CONTEXT: KnowledgeContext = { backlinks: [], canvases: [] };
const REFRESH_DEBOUNCE = 120;

export function useKnowledgeContext(file: TFile | null): KnowledgeContext {
	const { app } = useApp();
	const service = useMemo(() => new KnowledgeContextService(app), [app]);
	const [context, setContext] = useState<KnowledgeContext>(EMPTY_CONTEXT);
	const requestIdRef = useRef(0);

	useEffect(() => {
		if (!file) {
			setContext(EMPTY_CONTEXT);
			return;
		}

		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const refresh = () => {
			const requestId = ++requestIdRef.current;
			service
				.getForFile(file)
				.then((next) => {
					if (!cancelled && requestId === requestIdRef.current) setContext(next);
				})
				.catch(() => {
					if (!cancelled && requestId === requestIdRef.current) setContext(EMPTY_CONTEXT);
				});
		};
		const scheduleRefresh = () => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(refresh, REFRESH_DEBOUNCE);
		};

		refresh();
		const modifyRef = app.vault.on("modify", scheduleRefresh);
		const deleteRef = app.vault.on("delete", scheduleRefresh);
		const metadataRef = app.metadataCache.on("resolved", scheduleRefresh);

		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
			app.vault.offref(modifyRef);
			app.vault.offref(deleteRef);
			app.metadataCache.offref(metadataRef);
		};
	}, [app.metadataCache, app.vault, file, service]);

	return context;
}
