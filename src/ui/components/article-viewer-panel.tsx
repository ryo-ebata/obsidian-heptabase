import { ArticleEditor } from "@/ui/components/article-editor";
import { ArticleHeader } from "@/ui/components/article-header";
import { ArticleInfo } from "@/ui/components/article-info";
import { FileSearchDropdown } from "@/ui/components/file-search-dropdown";
import { SelectionDragHandle } from "@/ui/components/selection-drag-handle";
import { useApp } from "@/ui/hooks/use-app";
import { useEditorSelection } from "@/ui/hooks/use-editor-selection";
import { useFileContent } from "@/ui/hooks/use-file-content";
import { useFileMetadata } from "@/ui/hooks/use-file-metadata";
import { useKnowledgeContext } from "@/ui/hooks/use-knowledge-context";
import { notifyError } from "@/utils/notify-error";
import type { EditorView } from "@codemirror/view";
import { TFile, type TAbstractFile } from "obsidian";
import React, {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useState,
} from "react";

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;
const LEADING_H1_RE = /^((?:[ \t]*\r?\n)*[ \t]*#(?!#)[ \t]+([^\r\n]+)\r?\n(?:[ \t]*\r?\n)?)/;

function stripFrontmatter(content: string): string {
	const match = content.match(FRONTMATTER_RE);
	return match ? content.slice(match[0].length) : content;
}

function extractFrontmatterBlock(content: string): string {
	const match = content.match(FRONTMATTER_RE);
	return match ? match[0] : "";
}

function normalizeTitle(value: string): string {
	return value.normalize("NFKC").trim().toLocaleLowerCase();
}

export function separateDuplicateTitleHeading(
	content: string,
	title: string,
): { body: string; hiddenPrefix: string } {
	const match = content.match(LEADING_H1_RE);
	if (!match) return { body: content, hiddenPrefix: "" };

	const heading = match[2]?.replace(/[ \t]+#+[ \t]*$/, "").trim() ?? "";
	if (normalizeTitle(heading) !== normalizeTitle(title)) {
		return { body: content, hiddenPrefix: "" };
	}

	return {
		body: content.slice(match[1]!.length),
		hiddenPrefix: match[1]!,
	};
}

export interface ArticleViewerPanelHandle {
	selectFile: (path: string, options?: { focusTitle?: boolean }) => void;
}

export const ArticleViewerPanel = forwardRef<ArticleViewerPanelHandle>(
	function ArticleViewerPanelInner(_props, ref) {
		const { app } = useApp();
		const [selectedFile, setSelectedFile] = useState<TFile | null>(null);
		const [shouldFocusTitle, setShouldFocusTitle] = useState(false);
		const { content, save: saveRaw, refresh: refreshContent } = useFileContent(selectedFile);
		const { metadata } = useFileMetadata(selectedFile);
		const knowledgeContext = useKnowledgeContext(selectedFile);
		const [editorView, setEditorView] = useState<EditorView | null>(null);
		const { selectedText, selectionRect } = useEditorSelection(editorView);

		useEffect(() => {
			if (!selectedFile) return;
			const eventRef = app.vault.on("delete", (deletedFile: TAbstractFile) => {
				if (deletedFile.path === selectedFile.path) {
					setSelectedFile(null);
					setEditorView(null);
				}
			});
			return () => app.vault.offref(eventRef);
		}, [app.vault, selectedFile]);

		const articleContent = useMemo(
			() => separateDuplicateTitleHeading(stripFrontmatter(content), metadata?.title ?? ""),
			[content, metadata?.title],
		);

		const saveBody = useCallback(
			async (newBody: string) => {
				const fmBlock = extractFrontmatterBlock(content);
				await saveRaw(fmBlock + articleContent.hiddenPrefix + newBody);
			},
			[articleContent.hiddenPrefix, content, saveRaw],
		);

		useImperativeHandle(ref, () => ({
			selectFile: (path: string, options) => {
				const abstractFile = app.vault.getAbstractFileByPath(path);
				if (abstractFile instanceof TFile) {
					setSelectedFile(abstractFile);
					setEditorView(null);
					setShouldFocusTitle(options?.focusTitle === true);
				}
			},
		}));

		const handleFileSelect = useCallback((file: TFile | null) => {
			setSelectedFile(file);
			setEditorView(null);
			setShouldFocusTitle(false);
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
				try {
					await app.fileManager.renameFile(selectedFile, newPath);
					refreshContent();
				} catch (error) {
					notifyError("Rename failed", error);
				}
			},
			[app.fileManager, selectedFile, refreshContent],
		);

		const handlePropertyChange = useCallback(
			async (key: string, value: unknown) => {
				if (!selectedFile) {
					return;
				}
				try {
					await app.fileManager.processFrontMatter(selectedFile, (fm) => {
						fm[key] = value;
					});
					refreshContent();
				} catch (error) {
					notifyError("Property update failed", error);
				}
			},
			[app.fileManager, selectedFile, refreshContent],
		);

		const handlePropertyDelete = useCallback(
			async (key: string) => {
				if (!selectedFile) {
					return;
				}
				try {
					await app.fileManager.processFrontMatter(selectedFile, (fm) => {
						delete fm[key];
					});
					refreshContent();
				} catch (error) {
					notifyError("Property delete failed", error);
				}
			},
			[app.fileManager, selectedFile, refreshContent],
		);

		const handlePropertyAdd = useCallback(
			async (key: string, value: unknown) => {
				if (!selectedFile) {
					return;
				}
				try {
					await app.fileManager.processFrontMatter(selectedFile, (fm) => {
						fm[key] = value;
					});
					refreshContent();
				} catch (error) {
					notifyError("Property add failed", error);
				}
			},
			[app.fileManager, selectedFile, refreshContent],
		);

		const sourcePath = asString(metadata?.frontmatter["heptabase-source"]);
		const sourceHeading = asString(metadata?.frontmatter["heptabase-source-heading"]);

		return (
			<div className="article-viewer h-full flex flex-col">
				<FileSearchDropdown onSelect={handleFileSelect} />
				{selectedFile && metadata && (
					<>
						<ArticleHeader
							key={selectedFile.path}
							title={metadata.title}
							path={metadata.path}
							frontmatter={metadata.frontmatter}
							autoFocusTitle={shouldFocusTitle}
							onTitleFocused={() => setShouldFocusTitle(false)}
							onRename={handleRename}
							onPropertyChange={handlePropertyChange}
							onPropertyDelete={handlePropertyDelete}
							onPropertyAdd={handlePropertyAdd}
						/>
						<ArticleEditor
							content={articleContent.body}
							onSave={saveBody}
							onEditorView={handleEditorView}
						/>
						<SelectionDragHandle
							selectedText={selectedText}
							selectionRect={selectionRect}
							filePath={selectedFile.path}
						/>
						<ArticleInfo
							sourcePath={sourcePath}
							sourceHeading={sourceHeading}
							backlinks={knowledgeContext.backlinks}
							canvases={knowledgeContext.canvases}
						/>
					</>
				)}
				{!selectedFile && (
					<div role="status" className="p-3 text-ob-muted text-ob-ui-small">
						Select an article to view it
					</div>
				)}
			</div>
		);
	},
);

function asString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}
