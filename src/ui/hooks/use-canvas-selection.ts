import type { CanvasNode } from "@/types/obsidian-canvas";
import { useCanvasView } from "@/ui/hooks/use-canvas-view";
import { useCallback, useEffect, useRef, useState } from "react";

function isSameSelection(prev: CanvasNode[], next: CanvasNode[]): boolean {
	if (prev.length !== next.length) {
		return false;
	}
	for (let i = 0; i < prev.length; i++) {
		if (prev[i]!.id !== next[i]!.id) {
			return false;
		}
	}
	return true;
}

function getSelectedNodes(selection: Set<CanvasNode> | undefined): CanvasNode[] {
	return selection ? Array.from(selection) : [];
}

export function useCanvasSelection(): CanvasNode[] {
	const canvasView = useCanvasView();
	const [selectedNodes, setSelectedNodes] = useState<CanvasNode[]>(() =>
		getSelectedNodes(canvasView?.canvas.selection),
	);
	const prevRef = useRef<CanvasNode[]>(selectedNodes);

	const poll = useCallback(() => {
		const current = getSelectedNodes(canvasView?.canvas.selection);
		if (!isSameSelection(prevRef.current, current)) {
			prevRef.current = current;
			setSelectedNodes(current);
		}
	}, [canvasView]);

	useEffect(() => {
		poll();
		const id = setInterval(poll, 500);
		return () => {
			clearInterval(id);
		};
	}, [poll]);

	return selectedNodes;
}
