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
	onEditorViewChange?: (view: EditorView | null) => void;
	_containerOverride?: HTMLElement;
}

interface UseEmbeddableEditorReturn {
	containerRef: React.RefObject<HTMLDivElement | null>;
	editorView: EditorView | null;
}

export function useEmbeddableEditor({
	content,
	onSave,
	onEditorViewChange,
	_containerOverride,
}: UseEmbeddableEditorProps): UseEmbeddableEditorReturn {
	const { app } = useApp();
	const containerRef = useRef<HTMLDivElement | null>(null);
	const editorRef = useRef<EmbeddableEditorHandle | null>(null);
	const [editorView, setEditorView] = useState<EditorView | null>(null);
	const onSaveRef = useRef(onSave);
	onSaveRef.current = onSave;
	const onEditorViewChangeRef = useRef(onEditorViewChange);
	onEditorViewChangeRef.current = onEditorViewChange;
	const contentRef = useRef(content);
	contentRef.current = content;
	const debounceTimerRef = useRef<number>(0);

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
			onChange: (editor: EmbeddableEditorHandle) => {
				clearTimeout(debounceTimerRef.current);
				debounceTimerRef.current = window.setTimeout(() => {
					onSaveRef.current(editor.value);
				}, 300);
			},
		};

		const editor = createEmbeddableEditor(app, container, options);
		editorRef.current = editor;
		setEditorView(editor.cm);
		onEditorViewChangeRef.current?.(editor.cm);

		return () => {
			clearTimeout(debounceTimerRef.current);
			editor.destroy();
			editorRef.current = null;
			setEditorView(null);
			onEditorViewChangeRef.current?.(null);
		};
	}, [app, getContainer]);

	useEffect(() => {
		if (editorRef.current && content !== editorRef.current.value) {
			editorRef.current.set(content);
		}
	}, [content]);

	return { containerRef, editorView };
}
