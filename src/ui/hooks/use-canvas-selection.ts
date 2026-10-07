import type { CanvasNode, CanvasView } from "@/types/obsidian-canvas";
import { useCallback, useEffect, useRef, useState } from "react";

const SELECTION_POLL_INTERVAL = 120;

export function useCanvasSelection(canvasView: CanvasView | null): CanvasNode[] {
	const [nodes, setNodes] = useState<CanvasNode[]>([]);
	const signatureRef = useRef<string | null>(null);

	const readSelection = useCallback(() => {
		const selection = canvasView?.canvas.selection;
		const nextNodes = selection ? Array.from(selection) : [];
		const signature = nextNodes
			.map((node) => node.id)
			.toSorted()
			.join("\u0000");
		if (signature === signatureRef.current) return;
		signatureRef.current = signature;
		setNodes(nextNodes);
	}, [canvasView]);

	useEffect(() => {
		signatureRef.current = null;
		readSelection();
		const interval = window.setInterval(readSelection, SELECTION_POLL_INTERVAL);
		return () => window.clearInterval(interval);
	}, [readSelection]);

	return nodes;
}
