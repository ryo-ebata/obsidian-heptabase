export interface GridPosition {
	x: number;
	y: number;
}

export type LayoutMode = "grid" | "horizontal" | "vertical";

export interface GridLayoutOptions {
	layout?: LayoutMode;
	columns?: number;
	gap?: number;
	nodeWidth?: number;
	nodeHeight?: number;
}

export function calculateGridPositions(
	origin: GridPosition,
	count: number,
	options?: GridLayoutOptions,
): GridPosition[] {
	if (count === 0) {
		return [];
	}

	const layout = options?.layout ?? "grid";
	const gap = options?.gap ?? 40;
	const nodeWidth = options?.nodeWidth ?? 400;
	const nodeHeight = options?.nodeHeight ?? 300;

	const positions: GridPosition[] = [];

	if (layout === "horizontal") {
		for (let i = 0; i < count; i++) {
			positions.push({
				x: origin.x + i * (nodeWidth + gap),
				y: origin.y,
			});
		}
		return positions;
	}

	if (layout === "vertical") {
		for (let i = 0; i < count; i++) {
			positions.push({
				x: origin.x,
				y: origin.y + i * (nodeHeight + gap),
			});
		}
		return positions;
	}

	const columns = options?.columns ?? 3;

	for (let i = 0; i < count; i++) {
		const col = i % columns;
		const row = Math.floor(i / columns);

		positions.push({
			x: origin.x + col * (nodeWidth + gap),
			y: origin.y + row * (nodeHeight + gap),
		});
	}

	return positions;
}
