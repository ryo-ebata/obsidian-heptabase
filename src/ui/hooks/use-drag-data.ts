import type { DragData } from "@/types/plugin";
import type React from "react";
import { useCallback, useRef, useState } from "react";

export interface DragVisualOptions {
	label?: string;
	badgeCount?: number;
}

export interface UseDragDataReturn {
	isDragging: boolean;
	handleDragStart: (e: React.DragEvent) => void;
	handleDragEnd: () => void;
}

function createGhostElement(options: DragVisualOptions): HTMLElement {
	const ghost = document.createElement("div");
	ghost.style.cssText =
		"position: fixed; top: -1000px; left: -1000px; padding: 6px 12px; background: var(--background-secondary, #333); color: var(--text-normal, #fff); border-radius: 6px; font-size: 13px; display: flex; align-items: center; gap: 6px; pointer-events: none; white-space: nowrap;";

	if (options.label) {
		const label = document.createElement("span");
		label.textContent = options.label;
		ghost.appendChild(label);
	}

	if (options.badgeCount !== undefined && options.badgeCount > 0) {
		const badge = document.createElement("span");
		badge.style.cssText =
			"background: var(--interactive-accent, #7c3aed); color: white; border-radius: 10px; padding: 1px 7px; font-size: 11px; font-weight: 600;";
		badge.textContent = String(options.badgeCount);
		ghost.appendChild(badge);
	}

	document.body.appendChild(ghost);
	return ghost;
}

export function useDragData(
	getData: () => DragData,
	visualOptions?: DragVisualOptions,
): UseDragDataReturn {
	const [isDragging, setIsDragging] = useState(false);
	const ghostRef = useRef<HTMLElement | null>(null);

	const handleDragStart = useCallback(
		(e: React.DragEvent) => {
			e.dataTransfer.setData("application/json", JSON.stringify(getData()));
			e.dataTransfer.effectAllowed = "copy";

			if (visualOptions?.label) {
				const ghost = createGhostElement(visualOptions);
				ghostRef.current = ghost;
				e.dataTransfer.setDragImage(ghost, 0, 0);
			}

			setIsDragging(true);
		},
		[getData, visualOptions],
	);

	const handleDragEnd = useCallback(() => {
		if (ghostRef.current) {
			ghostRef.current.remove();
			ghostRef.current = null;
		}
		setIsDragging(false);
	}, []);

	return { isDragging, handleDragStart, handleDragEnd };
}
