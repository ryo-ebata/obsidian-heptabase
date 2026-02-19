import { ArticleEditor } from "@/ui/components/article-editor";
import { FileSearchDropdown } from "@/ui/components/file-search-dropdown";
import { SelectionDragHandle } from "@/ui/components/selection-drag-handle";
import { useEditorSelection } from "@/ui/hooks/use-editor-selection";
import { useFileContent } from "@/ui/hooks/use-file-content";
import type { EditorView } from "@codemirror/view";
import type { TFile } from "obsidian";
import type React from "react";
import { useCallback, useState } from "react";

export function ArticleViewerPanel(): React.ReactElement {
	const [selectedFile, setSelectedFile] = useState<TFile | null>(null);
	const { content, save } = useFileContent(selectedFile);
	const [editorView, setEditorView] = useState<EditorView | null>(null);
	const { selectedText, selectionRect } = useEditorSelection(editorView);

	const handleFileSelect = useCallback((file: TFile | null) => {
		setSelectedFile(file);
		setEditorView(null);
	}, []);

	const handleEditorView = useCallback((view: EditorView | null) => {
		setEditorView(view);
	}, []);

	return (
		<div className="h-full flex flex-col">
			<FileSearchDropdown onSelect={handleFileSelect} />
			{selectedFile && (
				<>
					<ArticleEditor content={content} onSave={save} onEditorView={handleEditorView} />
					<SelectionDragHandle
						selectedText={selectedText}
						selectionRect={selectionRect}
						filePath={selectedFile.path}
					/>
				</>
			)}
		</div>
	);
}
