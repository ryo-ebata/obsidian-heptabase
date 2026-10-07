import { ContentExtractor } from "@/services/content-extractor";
import type { NoteDragData, ParsedHeading, TextSelectionDragData } from "@/types/plugin";
import { useApp } from "@/ui/hooks/use-app";
import { useDragData } from "@/ui/hooks/use-drag-data";
import { useSidebarActions } from "@/ui/hooks/use-sidebar-actions";
import { Component, MarkdownRenderer, Menu, Notice, type TFile } from "obsidian";
import type React from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

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
	headings?: ParsedHeading[];
	tags?: string[];
	query?: string;
	isInCanvas?: boolean;
	isCanvasSelected?: boolean;
}

const COLLAPSED_HEADING_COUNT = 3;

export const NoteCard = memo(function NoteCardInner({
	file,
	excerpt,
	headings = [],
	tags = [],
	query = "",
	isInCanvas = false,
	isCanvasSelected = false,
}: NoteCardProps): React.ReactElement {
	const { app, settings } = useApp();
	const { openInArticle } = useSidebarActions();
	const excerptRef = useRef<HTMLDivElement>(null);
	const [content, setContent] = useState("");
	const [headingsExpanded, setHeadingsExpanded] = useState(false);
	const extractor = useRef(new ContentExtractor()).current;
	const distinctHeadings = headings.filter(
		(heading, index) => index !== 0 || heading.heading.trim() !== file.basename.trim(),
	);
	const visibleHeadings = headingsExpanded
		? distinctHeadings
		: distinctHeadings.slice(0, COLLAPSED_HEADING_COUNT);
	const hiddenHeadingCount = distinctHeadings.length - visibleHeadings.length;

	const getDragData = useCallback(
		(): NoteDragData => ({
			type: "note-drag",
			filePath: file.path,
		}),
		[file.path],
	);

	const { isDragging, handleDragStart, handleDragEnd } = useDragData(getDragData);

	useEffect(() => {
		if (headings.length === 0) return;
		let cancelled = false;
		app.vault
			.cachedRead(file)
			.then((value) => {
				if (!cancelled) setContent(value);
			})
			.catch(() => {
				if (!cancelled) setContent("");
			});
		return () => {
			cancelled = true;
		};
	}, [app, file, headings.length]);

	const getHeadingDragData = useCallback(
		(heading: ParsedHeading): TextSelectionDragData => ({
			type: "text-selection-drag",
			filePath: file.path,
			selectedText: content
				? extractor.extractContentWithHeading(content, heading.position.start.line, heading.level)
				: `${"#".repeat(heading.level)} ${heading.heading}`,
			title: heading.heading,
			sourceHeading: heading.heading,
		}),
		[content, extractor, file.path],
	);

	useEffect(() => {
		const el = excerptRef.current;
		if (!el || !excerpt) return;
		let cancelled = false;
		const component = new Component();
		const renderTarget = document.createElement("div");
		component.load();
		void MarkdownRenderer.render(app, excerpt, renderTarget, file.path, component)
			.then(() => {
				if (!cancelled) {
					highlightText(renderTarget, query);
					el.replaceChildren(...renderTarget.childNodes);
				}
			})
			.catch(() => {
				if (!cancelled) el.textContent = excerpt;
			});
		return () => {
			cancelled = true;
			component.unload();
		};
	}, [app, excerpt, file.path, query]);

	const handleContextMenu = useCallback(
		(e: React.MouseEvent) => {
			const menu = new Menu();
			menu.addItem((item) => {
				item
					.setTitle("Add to Canvas")
					.setIcon("layout-dashboard")
					.onClick(() => {
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
				item
					.setTitle("Open in Article")
					.setIcon("file-text")
					.onClick(() => {
						openInArticle(file.path);
					});
			});
			menu.showAtMouseEvent(e.nativeEvent);
		},
		[app.workspace, file, settings.defaultNodeWidth, settings.defaultNodeHeight, openInArticle],
	);

	const className = `heptabase-note-card p-2 rounded border border-ob-border-subtle cursor-grab ${isDragging ? "is-dragging" : ""} ${isInCanvas ? "is-in-canvas" : ""} ${isCanvasSelected ? "is-canvas-selected" : ""}`;

	return (
		<div
			className={className}
			draggable
			data-file-path={file.path}
			data-canvas-selected={isCanvasSelected || undefined}
			aria-current={isCanvasSelected ? "true" : undefined}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onContextMenu={handleContextMenu}
		>
			<a
				href={`#${encodeURIComponent(file.path)}`}
				className="heptabase-note-card__title text-ob-ui-small font-medium"
				title={file.basename}
				onClick={(event) => {
					event.preventDefault();
					openInArticle(file.path);
				}}
				onKeyDown={(event) => {
					if (event.key === " ") {
						event.preventDefault();
						openInArticle(file.path);
					}
				}}
			>
				<HighlightedText text={file.basename} query={query} />
			</a>
			{isInCanvas && (
				<span className="heptabase-note-card__canvas-status" aria-label="On current Canvas">
					Canvas
				</span>
			)}
			{excerpt && (
				<div
					ref={excerptRef}
					className="heptabase-note-card__excerpt text-ob-muted text-ob-ui-small mt-1 max-h-20 overflow-hidden card-fade"
				/>
			)}
			{tags.length > 0 && (
				<div className="heptabase-note-card__tags flex flex-wrap gap-1 mt-1.5" aria-label="Tags">
					{tags.slice(0, 3).map((tag) => (
						<span
							key={tag}
							className="px-1.5 py-0.5 rounded text-ob-muted text-ob-ui-small bg-ob-hover"
						>
							#{tag}
						</span>
					))}
					{tags.length > 3 && (
						<span className="px-1 py-0.5 text-ob-muted text-ob-ui-small">+{tags.length - 3}</span>
					)}
				</div>
			)}
			{distinctHeadings.length > 0 && (
				<div className="heptabase-note-card__headings mt-2 space-y-1" aria-label="Headings">
					{visibleHeadings.map((heading) => (
						<HeadingItem
							key={`${heading.position.start.line}-${heading.heading}`}
							heading={heading}
							onGetDragData={getHeadingDragData}
							onActivate={() => openInArticle(file.path)}
						/>
					))}
					{distinctHeadings.length > COLLAPSED_HEADING_COUNT && (
						<button
							type="button"
							className="heptabase-note-card__heading-toggle"
							aria-expanded={headingsExpanded}
							onClick={() => setHeadingsExpanded((expanded) => !expanded)}
						>
							{headingsExpanded ? "Show less" : `${hiddenHeadingCount} more`}
						</button>
					)}
				</div>
			)}
		</div>
	);
});

function HighlightedText({ text, query }: { text: string; query: string }): React.ReactElement {
	const normalizedQuery = query.trim();
	if (!normalizedQuery) return <>{text}</>;
	const index = text.toLocaleLowerCase().indexOf(normalizedQuery.toLocaleLowerCase());
	if (index < 0) return <>{text}</>;
	return (
		<>
			{text.slice(0, index)}
			<mark className="heptabase-search-match">
				{text.slice(index, index + normalizedQuery.length)}
			</mark>
			{text.slice(index + normalizedQuery.length)}
		</>
	);
}

function highlightText(root: HTMLElement, query: string): void {
	const normalizedQuery = query.trim();
	if (!normalizedQuery) return;
	const lowerQuery = normalizedQuery.toLocaleLowerCase();
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const matches: Text[] = [];
	let node: Node | null;
	while ((node = walker.nextNode())) {
		if (node.textContent?.toLocaleLowerCase().includes(lowerQuery)) matches.push(node as Text);
	}
	for (const textNode of matches) {
		const text = textNode.data;
		const index = text.toLocaleLowerCase().indexOf(lowerQuery);
		if (index < 0) continue;
		const mark = document.createElement("mark");
		mark.className = "heptabase-search-match";
		mark.textContent = text.slice(index, index + normalizedQuery.length);
		textNode.replaceWith(text.slice(0, index), mark, text.slice(index + normalizedQuery.length));
	}
}

function HeadingItem({
	heading,
	onGetDragData,
	onActivate,
}: {
	heading: ParsedHeading;
	onGetDragData: (heading: ParsedHeading) => TextSelectionDragData;
	onActivate: () => void;
}): React.ReactElement {
	const { isDragging, handleDragStart, handleDragEnd } = useDragData(() => onGetDragData(heading), {
		label: heading.heading,
	});

	return (
		<div
			draggable
			role="button"
			tabIndex={0}
			aria-label={`Drag heading ${heading.heading}`}
			className={`heptabase-heading-item text-ob-ui-small text-ob-muted truncate cursor-grab ${isDragging ? "is-dragging" : ""}`}
			style={{ paddingLeft: `${Math.max(0, heading.level - 1) * 8}px` }}
			onDragStart={(event) => {
				event.stopPropagation();
				handleDragStart(event);
			}}
			onDragEnd={(event) => {
				event.stopPropagation();
				handleDragEnd();
			}}
			onClick={onActivate}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onActivate();
				}
			}}
		>
			{heading.heading}
		</div>
	);
}
