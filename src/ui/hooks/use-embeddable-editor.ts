import {
	type EmbeddableEditorHandle,
	type EmbeddableEditorOptions,
	createEmbeddableEditor,
} from "@/services/embeddable-editor";
import type { EditorView } from "@codemirror/view";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "./use-app";

interface UseEmbeddableEditorProps {
	content: string;
	onSave: (newContent: string) => void;
	_containerOverride?: HTMLElement;
}

interface UseEmbeddableEditorReturn {
	containerRef: React.RefObject<HTMLDivElement | null>;
	editorView: EditorView | null;
}

export function useEmbeddableEditor({
	content,
	onSave,
	_containerOverride,
}: UseEmbeddableEditorProps): UseEmbeddableEditorReturn {
	const { app } = useApp();
	const containerRef = useRef<HTMLDivElement | null>(null);
	const editorRef = useRef<EmbeddableEditorHandle | null>(null);
	const [editorView, setEditorView] = useState<EditorView | null>(null);
	const onSaveRef = useRef(onSave);
	onSaveRef.current = onSave;
	const contentRef = useRef(content);
	contentRef.current = content;

	const getContainer = useCallback(() => {
		return _containerOverride ?? containerRef.current;
	}, [_containerOverride]);

	useEffect(() => {
		const container = getContainer();
		if (!container) {
			return;
		}

		const options: EmbeddableEditorOptions = {
			value: contentRef.current,
			onBlur: (editor: EmbeddableEditorHandle) => {
				onSaveRef.current(editor.value);
			},
		};

		const editor = createEmbeddableEditor(app, container, options);
		editorRef.current = editor;
		setEditorView(editor.cm);

		return () => {
			editor.destroy();
			editorRef.current = null;
			setEditorView(null);
		};
	}, [app, getContainer]);

	useEffect(() => {
		if (editorRef.current && content !== editorRef.current.value) {
			editorRef.current.set(content);
		}
	}, [content]);

	return { containerRef, editorView };
}
