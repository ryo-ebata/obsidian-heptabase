import type { CanvasLayoutAction, CanvasOperator } from "@/services/canvas-operator";
import type { CanvasNode, CanvasView } from "@/types/obsidian-canvas";
import type React from "react";
import { useEffect, useState } from "react";

interface CanvasLayoutToolbarProps {
	canvasView: CanvasView;
	selectedNodes: CanvasNode[];
	canvasOperator: CanvasOperator;
	edgeColor?: string;
	edgeLabel?: string;
	onCanvasChange: () => void;
}

const ACTIONS: {
	action: CanvasLayoutAction;
	label: string;
	accessibleLabel: string;
	minimum: number;
	icon: React.ReactNode;
}[] = [
	{
		action: "align-left",
		label: "Left",
		accessibleLabel: "Align left",
		minimum: 2,
		icon: <LayoutGlyph direction="left" />,
	},
	{
		action: "align-top",
		label: "Top",
		accessibleLabel: "Align top",
		minimum: 2,
		icon: <LayoutGlyph direction="top" />,
	},
	{
		action: "distribute-horizontal",
		label: "Across",
		accessibleLabel: "Distribute horizontally",
		minimum: 3,
		icon: <LayoutGlyph direction="horizontal" />,
	},
	{
		action: "distribute-vertical",
		label: "Down",
		accessibleLabel: "Distribute vertically",
		minimum: 3,
		icon: <LayoutGlyph direction="vertical" />,
	},
];

export function CanvasLayoutToolbar({
	canvasView,
	selectedNodes,
	canvasOperator,
	edgeColor,
	edgeLabel,
	onCanvasChange,
}: CanvasLayoutToolbarProps): React.ReactElement {
	const selectedIds = selectedNodes.map((node) => node.id);
	const [historyState, setHistoryState] = useState(() =>
		canvasOperator.getHistoryState(canvasView.canvas),
	);

	useEffect(() => {
		const update = () => setHistoryState(canvasOperator.getHistoryState(canvasView.canvas));
		update();
		return canvasOperator.onHistoryChange(canvasView.canvas, update);
	}, [canvasOperator, canvasView]);

	const runChange = (change: () => boolean): void => {
		if (change()) onCanvasChange();
	};

	return (
		<section
			className="canvas-layout-toolbar"
			data-has-selection={selectedNodes.length > 0}
			aria-label="Canvas selection tools"
		>
			<div className="canvas-layout-toolbar__status" aria-live="polite">
				<span className="sr-only">{selectedNodes.length} selected</span>
				<span className="canvas-layout-toolbar__count">{selectedNodes.length}</span>
				<span aria-hidden="true">
					{selectedNodes.length === 0 ? "Select cards to arrange" : "cards selected"}
				</span>
			</div>
			{selectedNodes.length > 0 && (
				<div className="canvas-layout-toolbar__actions">
					{ACTIONS.map(({ action, label, accessibleLabel, minimum, icon }) => (
						<button
							type="button"
							key={action}
							className="canvas-layout-tool"
							disabled={selectedNodes.length < minimum}
							aria-label={accessibleLabel}
							title={
								selectedNodes.length < minimum
									? `Select at least ${minimum} nodes`
									: accessibleLabel
							}
							onClick={() => {
								runChange(() =>
									canvasOperator.arrangeNodes(canvasView.canvas, selectedIds, action),
								);
							}}
						>
							{icon}
							<span>{label}</span>
						</button>
					))}
				</div>
			)}
			<div className="canvas-layout-toolbar__actions canvas-layout-toolbar__actions--secondary">
				{selectedNodes.length > 0 && (
					<>
						<ToolButton
							label="Link"
							accessibleLabel="Connect selected nodes"
							disabled={selectedNodes.length !== 2}
							disabledHint="Select exactly 2 nodes"
							icon={<RelationGlyph kind="link" />}
							onClick={() =>
								runChange(() =>
									canvasOperator.addEdgeToCanvas(canvasView.canvas, {
										fromNode: selectedIds[0]!,
										toNode: selectedIds[1]!,
										color: edgeColor || undefined,
										label: edgeLabel || undefined,
									}),
								)
							}
						/>
						<ToolButton
							label="Group"
							accessibleLabel="Group selected nodes"
							disabled={false}
							disabledHint="Select at least 1 node"
							icon={<RelationGlyph kind="group" />}
							onClick={() =>
								runChange(() => canvasOperator.addGroupToCanvas(canvasView.canvas, selectedNodes))
							}
						/>
					</>
				)}
				<ToolButton
					label="Undo"
					accessibleLabel="Undo last Canvas change"
					disabled={!historyState.canUndo}
					disabledHint="Nothing to undo"
					icon={<RelationGlyph kind="undo" />}
					onClick={() => runChange(() => canvasOperator.undo(canvasView.canvas))}
				/>
				<ToolButton
					label="Redo"
					accessibleLabel="Redo last Canvas change"
					disabled={!historyState.canRedo}
					disabledHint="Nothing to redo"
					icon={<RelationGlyph kind="redo" />}
					onClick={() => runChange(() => canvasOperator.redo(canvasView.canvas))}
				/>
			</div>
		</section>
	);
}

interface ToolButtonProps {
	label: string;
	accessibleLabel: string;
	disabled: boolean;
	disabledHint: string;
	icon: React.ReactNode;
	onClick: () => void;
}

function ToolButton({
	label,
	accessibleLabel,
	disabled,
	disabledHint,
	icon,
	onClick,
}: ToolButtonProps): React.ReactElement {
	return (
		<button
			type="button"
			className="canvas-layout-tool"
			disabled={disabled}
			aria-label={accessibleLabel}
			title={disabled ? disabledHint : accessibleLabel}
			onClick={onClick}
		>
			{icon}
			<span>{label}</span>
		</button>
	);
}

function LayoutGlyph({
	direction,
}: {
	direction: "left" | "top" | "horizontal" | "vertical";
}): React.ReactElement {
	return (
		<span className={`canvas-layout-glyph canvas-layout-glyph--${direction}`} aria-hidden="true">
			<i />
			<i />
			<i />
		</span>
	);
}

function RelationGlyph({ kind }: { kind: "link" | "group" | "undo" | "redo" }): React.ReactElement {
	return (
		<span className={`canvas-relation-glyph canvas-relation-glyph--${kind}`} aria-hidden="true" />
	);
}
