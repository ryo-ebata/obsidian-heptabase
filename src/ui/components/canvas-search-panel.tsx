import { CanvasSearch } from "@/services/canvas-search";
import { CanvasOperator } from "@/services/canvas-operator";
import { CanvasLayoutToolbar } from "@/ui/components/canvas-layout-toolbar";
import { useApp } from "@/ui/hooks/use-app";
import { useCanvasSelection } from "@/ui/hooks/use-canvas-selection";
import { useCanvasView } from "@/ui/hooks/use-canvas-view";
import type React from "react";
import { useEffect, useMemo, useReducer, useState } from "react";

const KIND_LABELS = {
	file: "Card",
	text: "Text",
	group: "Group",
	link: "Link",
} as const;

export function CanvasSearchPanel(): React.ReactElement {
	const { app, settings, canvasOperator: sharedCanvasOperator } = useApp();
	const canvasView = useCanvasView();
	const selectedNodes = useCanvasSelection(canvasView);
	const search = useMemo(() => new CanvasSearch(), []);
	const canvasOperator = useMemo(
		() => sharedCanvasOperator ?? new CanvasOperator(app, settings),
		[app, settings, sharedCanvasOperator],
	);
	const [query, setQuery] = useState("");
	const [revision, refresh] = useReducer((value: number) => value + 1, 0);

	useEffect(() => {
		if (!canvasView) return;
		const eventRef = app.vault.on("modify", (file) => {
			if (file.path === canvasView.file.path) refresh();
		});
		return () => app.vault.offref(eventRef);
	}, [app.vault, canvasView]);

	const results = useMemo(() => {
		void revision;
		if (!canvasView) return [];
		const data = canvasView.canvas.getData();
		return Array.isArray(data.nodes) ? search.search(data.nodes, query) : [];
	}, [canvasView, query, revision, search]);

	if (!canvasView) {
		return (
			<div role="status" className="p-3 text-ob-muted text-ob-ui-small">
				Open a Canvas to search its contents.
			</div>
		);
	}

	return (
		<div className="canvas-panel h-full flex flex-col">
			<label className="sr-only" htmlFor="heptabase-canvas-search">
				Search current Canvas
			</label>
			<div className="canvas-panel__rail">
				<div className="canvas-panel__search">
					<input
						id="heptabase-canvas-search"
						type="search"
						className="heptabase-field w-full px-2.5 py-1.5"
						placeholder="Search this Canvas..."
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
					{query && (
						<button
							type="button"
							className="canvas-panel__clear"
							aria-label="Clear Canvas search"
							onClick={() => setQuery("")}
						>
							×
						</button>
					)}
				</div>
				<CanvasLayoutToolbar
					canvasView={canvasView}
					selectedNodes={selectedNodes}
					canvasOperator={canvasOperator}
					edgeColor={settings.defaultEdgeColor}
					edgeLabel={settings.defaultEdgeLabel}
					onCanvasChange={refresh}
				/>
			</div>
			<div className="canvas-panel__summary">
				<span className="truncate">{canvasView.file.basename}</span>
				<span aria-label={`${results.length} results`}>{results.length}</span>
			</div>
			<div className="canvas-panel__results flex-1 overflow-y-auto">
				{results.map((result) => (
					<button
						type="button"
						key={result.id}
						className="heptabase-canvas-result"
						onClick={() => search.focus(canvasView.canvas, result.id)}
					>
						<span className="heptabase-canvas-result__kind">{KIND_LABELS[result.kind]}</span>
						<span className="heptabase-canvas-result__label">{result.label}</span>
						<span aria-hidden="true" />
						<span className="heptabase-canvas-result__detail">{result.detail}</span>
					</button>
				))}
				{results.length === 0 && <p className="canvas-panel__empty">No Canvas items found.</p>}
			</div>
		</div>
	);
}
