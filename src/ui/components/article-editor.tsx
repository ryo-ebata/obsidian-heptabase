import { useEmbeddableEditor } from "@/ui/hooks/use-embeddable-editor";
import type { EditorView } from "@codemirror/view";
import type React from "react";

interface ArticleEditorProps {
	content: string;
	onSave: (newContent: string) => void;
	onEditorView?: (view: EditorView | null) => void;
}

export function ArticleEditor({
	content,
	onSave,
	onEditorView,
}: ArticleEditorProps): React.ReactElement {
	const { containerRef } = useEmbeddableEditor({
		content,
		onSave,
		onEditorViewChange: onEditorView,
	});

	return <div ref={containerRef} className="article-editor flex-1 overflow-y-auto p-2" />;
}
