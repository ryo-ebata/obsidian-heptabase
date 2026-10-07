import type { CanvasView } from "@/types/obsidian-canvas";
import { useCallback, useEffect, useRef, useState } from "react";

interface CanvasLibraryContext {
	inCanvasPaths: ReadonlySet<string>;
	selectedPaths: ReadonlySet<string>;
}

const EMPTY_CONTEXT: CanvasLibraryContext = {
	inCanvasPaths: new Set(),
	selectedPaths: new Set(),
};

const CONTEXT_POLL_INTERVAL = 160;

export function useCanvasLibraryContext(canvasView: CanvasView | null): CanvasLibraryContext {
	const [context, setContext] = useState<CanvasLibraryContext>(EMPTY_CONTEXT);
	const signatureRef = useRef("");

	const readContext = useCallback(() => {
		if (!canvasView) {
			if (signatureRef.current !== "") {
				signatureRef.current = "";
				setContext(EMPTY_CONTEXT);
			}
			return;
		}

		const canvasNodes = canvasView.canvas.getData().nodes;
		const filePathByNodeId = new Map(
			canvasNodes
				.filter((node) => node.type === "file" && node.file)
				.map((node) => [node.id, node.file!] as const),
		);
		const inCanvasPaths = new Set(filePathByNodeId.values());
		const selectedPaths = new Set(
			Array.from(canvasView.canvas.selection ?? [])
				.map((node) => node.file?.path ?? filePathByNodeId.get(node.id))
				.filter((path): path is string => Boolean(path)),
		);
		const signature = `${[...inCanvasPaths].toSorted().join("\u0000")}\u0001${[...selectedPaths]
			.toSorted()
			.join("\u0000")}`;
		if (signature === signatureRef.current) return;
		signatureRef.current = signature;
		setContext({ inCanvasPaths, selectedPaths });
	}, [canvasView]);

	useEffect(() => {
		signatureRef.current = "\u0002";
		readContext();
		const interval = window.setInterval(readContext, CONTEXT_POLL_INTERVAL);
		return () => window.clearInterval(interval);
	}, [readContext]);

	return context;
}
