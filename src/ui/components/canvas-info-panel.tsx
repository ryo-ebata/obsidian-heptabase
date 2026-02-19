import type { CanvasEdgeData } from "@/types/obsidian-canvas";
import { useCanvasSelection } from "@/ui/hooks/use-canvas-selection";
import { useCanvasView } from "@/ui/hooks/use-canvas-view";
import type React from "react";

export function CanvasInfoPanel(): React.ReactElement {
	const selectedNodes = useCanvasSelection();

	if (selectedNodes.length === 0) {
		return (
			<div className="p-2 h-full overflow-y-auto">
				<div className="text-ob-muted text-center p-5 text-ob-ui-small">No node selected</div>
			</div>
		);
	}

	return (
		<div className="p-2 h-full overflow-y-auto">
			<div className="px-2 py-1 font-semibold mb-1">
				{selectedNodes.length === 1 ? "1 node selected" : `${selectedNodes.length} nodes selected`}
			</div>
			{selectedNodes.length === 1 && <NodeConnections nodeId={selectedNodes[0].id} />}
		</div>
	);
}

function NodeConnections({ nodeId }: { nodeId: string }): React.ReactElement | null {
	const canvasView = useCanvasView();
	if (!canvasView) {
		return null;
	}

	const data = canvasView.canvas.getData();
	const connectedEdges = data.edges.filter((e) => e.fromNode === nodeId || e.toNode === nodeId);

	if (connectedEdges.length === 0) {
		return null;
	}

	return (
		<div>
			<div className="px-2 py-1 font-medium text-ob-muted text-ob-ui-small mt-2">Connections</div>
			<ul className="list-none p-0 m-0">
				{connectedEdges.map((edge) => (
					<li key={edge.id} className="px-2 py-0.5 rounded text-ob-ui-small hover:bg-ob-hover">
						{formatEdge(edge, nodeId)}
					</li>
				))}
			</ul>
		</div>
	);
}

function formatEdge(edge: CanvasEdgeData, nodeId: string): string {
	if (edge.fromNode === nodeId) {
		return `→ ${edge.toNode}`;
	}
	return `← ${edge.fromNode}`;
}
