import { CanvasObserver } from "@/services/canvas-observer";
import type { CanvasView } from "@/types/obsidian-canvas";
import { useApp } from "@/ui/hooks/use-app";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useCanvasView(): CanvasView | null {
	const { app } = useApp();
	const observer = useMemo(() => new CanvasObserver(app), [app]);
	const [canvasView, setCanvasView] = useState<CanvasView | null>(() =>
		observer.getActiveCanvasView(),
	);
	const prevFileRef = useRef<string | null>(canvasView?.file.path ?? null);

	const poll = useCallback(() => {
		const current = observer.getActiveCanvasView();
		const currentPath = current?.file.path ?? null;
		if (prevFileRef.current !== currentPath) {
			prevFileRef.current = currentPath;
			setCanvasView(current);
		}
	}, [observer]);

	useEffect(() => {
		poll();
		const id = setInterval(poll, 500);
		return () => {
			clearInterval(id);
		};
	}, [poll]);

	return canvasView;
}
