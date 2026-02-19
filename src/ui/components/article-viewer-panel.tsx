import { ArticleEditor } from "@/ui/components/article-editor";
import { ArticleHeader } from "@/ui/components/article-header";
import { FileSearchDropdown } from "@/ui/components/file-search-dropdown";
import { SelectionDragHandle } from "@/ui/components/selection-drag-handle";
import { useApp } from "@/ui/hooks/use-app";
import { useEditorSelection } from "@/ui/hooks/use-editor-selection";
import { useFileContent } from "@/ui/hooks/use-file-content";
import { useFileMetadata } from "@/ui/hooks/use-file-metadata";
import type { EditorView } from "@codemirror/view";
import { TFile } from "obsidian";
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

function stripFrontmatter(content: string): string {
	const match = content.match(FRONTMATTER_RE);
	return match ? content.slice(match[0].length) : content;
}

function extractFrontmatterBlock(content: string): string {
	const match = content.match(FRONTMATTER_RE);
	return match ? match[0] : "";
}

export interface ArticleViewerPanelHandle {
	selectFile: (path: string) => void;
}

export const ArticleViewerPanel = forwardRef<ArticleViewerPanelHandle>(
	function ArticleViewerPanelInner(_props, ref) {
		const { app } = useApp();
		const [selectedFile, setSelectedFile] = useState<TFile | null>(null);
		const { content, save: saveRaw, refresh: refreshContent } = useFileContent(selectedFile);
		const { metadata } = useFileMetadata(selectedFile);
		const [editorView, setEditorView] = useState<EditorView | null>(null);
		const { selectedText, selectionRect } = useEditorSelection(editorView);

		const bodyContent = useMemo(() => stripFrontmatter(content), [content]);

		const saveBody = useCallback(
			async (newBody: string) => {
				const fmBlock = extractFrontmatterBlock(content);
				await saveRaw(fmBlock + newBody);
			},
			[content, saveRaw],
		);

		useImperativeHandle(ref, () => ({
			selectFile: (path: string) => {
				const abstractFile = app.vault.getAbstractFileByPath(path);
				if (abstractFile instanceof TFile) {
					setSelectedFile(abstractFile);
					setEditorView(null);
				}
			},
		}));

		const handleFileSelect = useCallback((file: TFile | null) => {
			setSelectedFile(file);
			setEditorView(null);
		}, []);

		const handleEditorView = useCallback((view: EditorView | null) => {
			setEditorView(view);
		}, []);

		const handleRename = useCallback(
			async (newTitle: string) => {
				if (!selectedFile) {
					return;
				}
				const dir = selectedFile.parent?.path ?? "";
				const newPath = dir
					? `${dir}/${newTitle}.${selectedFile.extension}`
					: `${newTitle}.${selectedFile.extension}`;
				await app.fileManager.renameFile(selectedFile, newPath);
				refreshContent();
			},
			[app.fileManager, selectedFile, refreshContent],
		);

		const handlePropertyChange = useCallback(
			async (key: string, value: unknown) => {
				if (!selectedFile) {
					return;
				}
				await app.fileManager.processFrontMatter(selectedFile, (fm) => {
					fm[key] = value;
				});
				refreshContent();
			},
			[app.fileManager, selectedFile, refreshContent],
		);

		const handlePropertyDelete = useCallback(
			async (key: string) => {
				if (!selectedFile) {
					return;
				}
				await app.fileManager.processFrontMatter(selectedFile, (fm) => {
					delete fm[key];
				});
				refreshContent();
			},
			[app.fileManager, selectedFile, refreshContent],
		);

		const handlePropertyAdd = useCallback(
			async (key: string, value: unknown) => {
				if (!selectedFile) {
					return;
				}
				await app.fileManager.processFrontMatter(selectedFile, (fm) => {
					fm[key] = value;
				});
				refreshContent();
			},
			[app.fileManager, selectedFile, refreshContent],
		);

		return (
			<div className="h-full flex flex-col">
				<FileSearchDropdown onSelect={handleFileSelect} />
				{selectedFile && metadata && (
					<>
						<ArticleHeader
							key={selectedFile.path}
							title={metadata.title}
							path={metadata.path}
							frontmatter={metadata.frontmatter}
							onRename={handleRename}
							onPropertyChange={handlePropertyChange}
							onPropertyDelete={handlePropertyDelete}
							onPropertyAdd={handlePropertyAdd}
						/>
						<ArticleEditor content={bodyContent} onSave={saveBody} onEditorView={handleEditorView} />
						<SelectionDragHandle
							selectedText={selectedText}
							selectionRect={selectionRect}
							filePath={selectedFile.path}
						/>
					</>
				)}
			</div>
		);
	},
);
