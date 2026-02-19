import type { RefObject } from "react";
import { useEffect, useState } from "react";

interface UseTextSelectionReturn {
	selectedText: string;
	selectionRect: DOMRect | null;
}

export function useTextSelection(
	containerRef: RefObject<HTMLElement | null>,
): UseTextSelectionReturn {
	const [selectedText, setSelectedText] = useState("");
	const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);

	useEffect(() => {
		const handleSelectionChange = () => {
			const container = containerRef.current;
			if (!container) {
				setSelectedText("");
				setSelectionRect(null);
				return;
			}

			const selection = window.getSelection();
			if (!selection || selection.rangeCount === 0) {
				setSelectedText("");
				setSelectionRect(null);
				return;
			}

			const range = selection.getRangeAt(0);
			if (!container.contains(range.commonAncestorContainer)) {
				setSelectedText("");
				setSelectionRect(null);
				return;
			}

			const text = selection.toString();
			if (text === "") {
				setSelectedText("");
				setSelectionRect(null);
				return;
			}

			setSelectedText(text);
			setSelectionRect(range.getBoundingClientRect());
		};

		document.addEventListener("selectionchange", handleSelectionChange);
		return () => {
			document.removeEventListener("selectionchange", handleSelectionChange);
		};
	}, [containerRef]);

	return { selectedText, selectionRect };
}
