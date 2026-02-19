import type { NoteDragData } from "@/types/plugin";
import { useApp } from "@/ui/hooks/use-app";
import { useDragData } from "@/ui/hooks/use-drag-data";
import { useSidebarActions } from "@/ui/hooks/use-sidebar-actions";
import { Component, MarkdownRenderer, Menu, Notice, type TFile } from "obsidian";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";

interface CanvasView {
	canvas?: {
		tx: number;
		ty: number;
		tZoom: number;
		createFileNode: (opts: {
			file: TFile;
			pos: { x: number; y: number };
			size: { width: number; height: number };
			save: boolean;
		}) => void;
	};
}

interface NoteCardProps {
	file: TFile;
	excerpt: string;
}

export function NoteCard({ file, excerpt }: NoteCardProps): React.ReactElement {
	const { app, settings } = useApp();
	const { openInArticle } = useSidebarActions();
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

	const handleContextMenu = useCallback(
		(e: React.MouseEvent) => {
			const menu = new Menu();
			menu.addItem((item) => {
				item.setTitle("Add to Canvas").setIcon("layout-dashboard").onClick(() => {
					const canvasLeaves = app.workspace.getLeavesOfType("canvas");
					const canvasView = canvasLeaves[0]?.view as CanvasView | undefined;
					if (!canvasView?.canvas) {
						new Notice("No canvas is open");
						return;
					}
					const canvas = canvasView.canvas;
					const position = {
						x: Math.round(-canvas.tx / canvas.tZoom),
						y: Math.round(-canvas.ty / canvas.tZoom),
					};
					canvas.createFileNode({
						file,
						pos: position,
						size: {
							width: settings.defaultNodeWidth,
							height: settings.defaultNodeHeight,
						},
						save: true,
					});
					new Notice(`Added "${file.basename}" to Canvas`);
				});
			});
			menu.addItem((item) => {
				item.setTitle("Open in Article").setIcon("file-text").onClick(() => {
					openInArticle(file.path);
				});
			});
			menu.showAtMouseEvent(e.nativeEvent);
		},
		[app.workspace, file, settings.defaultNodeWidth, settings.defaultNodeHeight, openInArticle],
	);

	const className = `p-2 rounded border border-ob-border-subtle cursor-grab hover:bg-ob-hover transition-all duration-150 ease-out hover:-translate-y-0.5 ${isDragging ? "opacity-50" : ""}`;

	return (
		<div
			className={className}
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onContextMenu={handleContextMenu}
		>
			<div className="text-ob-ui-small font-medium truncate">{file.basename}</div>
			{excerpt && (
				<div
					ref={excerptRef}
					className="text-ob-muted text-ob-ui-small mt-1 max-h-20 overflow-hidden card-fade"
				/>
			)}
		</div>
	);
}
