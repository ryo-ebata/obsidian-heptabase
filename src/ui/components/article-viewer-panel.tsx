import { ArticleContent } from "@/ui/components/article-content";
import { FileSearchDropdown } from "@/ui/components/file-search-dropdown";
import { SelectionDragHandle } from "@/ui/components/selection-drag-handle";
import { useFileContent } from "@/ui/hooks/use-file-content";
import { useTextSelection } from "@/ui/hooks/use-text-selection";
import type { TFile } from "obsidian";
import type React from "react";
import { useCallback, useRef, useState } from "react";

export function ArticleViewerPanel(): React.ReactElement {
	const [selectedFile, setSelectedFile] = useState<TFile | null>(null);
	const { content } = useFileContent(selectedFile);
	const contentRef = useRef<HTMLDivElement>(null);
	const { selectedText, selectionRect } = useTextSelection(contentRef);

	const handleFileSelect = useCallback((file: TFile | null) => {
		setSelectedFile(file);
	}, []);

	return (
		<div className="h-full flex flex-col">
			<FileSearchDropdown onSelect={handleFileSelect} />
			{selectedFile && (
				<>
					<ArticleContent content={content} filePath={selectedFile.path} contentRef={contentRef} />
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
