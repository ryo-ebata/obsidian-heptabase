export function showDropAnimation(
	container: HTMLElement,
	position: { x: number; y: number },
	count?: number,
): void {
	const el = document.createElement("div");
	el.setAttribute("data-drop-animation", "");
	el.style.cssText = `position: absolute; left: ${position.x}px; top: ${position.y}px; width: 32px; height: 32px; border-radius: 50%; background: var(--interactive-accent, #7c3aed); opacity: 0.7; pointer-events: none; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 600; transform: scale(0); animation: drop-scale 300ms ease-out forwards;`;

	if (count !== undefined && count > 1) {
		el.textContent = String(count);
	}

	container.appendChild(el);

	setTimeout(() => {
		el.remove();
	}, 300);
}
