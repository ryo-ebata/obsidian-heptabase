import type { EditorView } from "@codemirror/view";
import { useEffect, useState } from "react";

interface UseEditorSelectionReturn {
	selectedText: string;
	selectionRect: DOMRect | null;
}

export function useEditorSelection(editorView: EditorView | null): UseEditorSelectionReturn {
	const [selectedText, setSelectedText] = useState("");
	const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);

	useEffect(() => {
		if (!editorView) {
			setSelectedText("");
			setSelectionRect(null);
			return;
		}

		const readSelection = () => {
			const { from, to } = editorView.state.selection.main;
			if (from === to) {
				setSelectedText("");
				setSelectionRect(null);
				return;
			}

			const text = editorView.state.doc.sliceString(from, to);
			setSelectedText(text);

			const fromCoords = editorView.coordsAtPos(from);
			const toCoords = editorView.coordsAtPos(to);

			if (fromCoords && toCoords) {
				const left = Math.min(fromCoords.left, toCoords.left);
				const top = Math.min(fromCoords.top, toCoords.top);
				const right = Math.max(fromCoords.right, toCoords.right);
				const bottom = Math.max(fromCoords.bottom, toCoords.bottom);
				setSelectionRect(new DOMRect(left, top, right - left, bottom - top));
			} else {
				setSelectionRect(null);
			}
		};

		readSelection();

		const handleSelectionChange = () => {
			readSelection();
		};

		editorView.contentDOM.addEventListener("mouseup", handleSelectionChange);
		editorView.contentDOM.addEventListener("keyup", handleSelectionChange);

		return () => {
			editorView.contentDOM.removeEventListener("mouseup", handleSelectionChange);
			editorView.contentDOM.removeEventListener("keyup", handleSelectionChange);
		};
	}, [editorView]);

	return { selectedText, selectionRect };
}
