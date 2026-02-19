import type { NoteDragData } from "@/types/plugin";
import { useDragData } from "@/ui/hooks/use-drag-data";
import { useApp } from "@/ui/hooks/use-app";
import { Component, MarkdownRenderer, type TFile } from "obsidian";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";

interface NoteCardProps {
	file: TFile;
	excerpt: string;
}

export function NoteCard({ file, excerpt }: NoteCardProps): React.ReactElement {
	const { app } = useApp();
	const excerptRef = useRef<HTMLDivElement>(null);

	const getDragData = useCallback(
		(): NoteDragData => ({
			type: "note-drag",
			filePath: file.path,
		}),
		[file.path],
	);

	const { isDragging, handleDragStart, handleDragEnd } = useDragData(getDragData);

	useEffect(() => {
		const el = excerptRef.current;
		if (!el || !excerpt) return;
		el.innerHTML = "";
		const component = new Component();
		MarkdownRenderer.render(app, excerpt, el, file.path, component);
		return () => {
			el.innerHTML = "";
		};
	}, [app, excerpt, file.path]);

	const className = `p-2 rounded border border-ob-border cursor-grab hover:bg-ob-hover ${isDragging ? "opacity-50" : ""}`;

	return (
		<div
			className={className}
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className="text-ob-ui-small truncate">{file.basename}</div>
			{excerpt && (
				<div
					ref={excerptRef}
					className="text-ob-muted text-ob-ui-small mt-1 max-h-20 overflow-hidden card-fade"
				/>
			)}
		</div>
	);
}
