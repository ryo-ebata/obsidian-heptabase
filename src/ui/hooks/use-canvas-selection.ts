import { CanvasObserver } from "@/services/canvas-observer";
import type { CanvasNode } from "@/types/obsidian-canvas";
import { useApp } from "@/ui/hooks/use-app";
import { useEffect, useMemo, useState } from "react";

export function useCanvasSelection(): CanvasNode[] {
	const { app } = useApp();
	const observer = useMemo(() => new CanvasObserver(app), [app]);
	const [selectedNodes, setSelectedNodes] = useState<CanvasNode[]>(() =>
		observer.getSelectedNodes(),
	);

	useEffect(() => {
		setSelectedNodes(observer.getSelectedNodes());
	}, [observer]);

	return selectedNodes;
}
