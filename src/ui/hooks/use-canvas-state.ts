import { CanvasObserver } from "@/services/canvas-observer";
import type { CanvasNode, CanvasView } from "@/types/obsidian-canvas";
import { useApp } from "@/ui/hooks/use-app";
import { TFile } from "obsidian";
import type React from "react";
import {
	createContext,
	createElement,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

export interface ActiveCanvasState {
	canvasView: CanvasView | null;
	selectedNodes: CanvasNode[];
	inCanvasPaths: ReadonlySet<string>;
	selectedPaths: ReadonlySet<string>;
}

const POLL_INTERVAL = 120;
const EMPTY_STATE: ActiveCanvasState = {
	canvasView: null,
	selectedNodes: [],
	inCanvasPaths: new Set(),
	selectedPaths: new Set(),
};
const CanvasStateContext = createContext<ActiveCanvasState | null>(null);

export function CanvasStateProvider({
	children,
}: {
	children: React.ReactNode;
}): React.ReactElement {
	const state = useCanvasState();
	return createElement(CanvasStateContext.Provider, { value: state }, children);
}

export function useActiveCanvasState(): ActiveCanvasState {
	const state = useContext(CanvasStateContext);
	if (!state) throw new Error("useActiveCanvasState must be used within CanvasStateProvider");
	return state;
}

export function useCanvasState(): ActiveCanvasState {
	const { app, canvasObserver: sharedCanvasObserver } = useApp();
	const observer = useMemo(
		() => sharedCanvasObserver ?? new CanvasObserver(app),
		[app, sharedCanvasObserver],
	);
	const [state, setState] = useState<ActiveCanvasState>(() => readState(observer));
	const previousViewRef = useRef(state.canvasView);
	const signatureRef = useRef(createSignature(state));

	const poll = useCallback(() => {
		const next = readState(observer);
		const signature = createSignature(next);
		if (previousViewRef.current === next.canvasView && signatureRef.current === signature) return;
		previousViewRef.current = next.canvasView;
		signatureRef.current = signature;
		setState(next);
	}, [observer]);

	useEffect(() => {
		poll();
		let interval: number | null = null;
		const stopPolling = (): void => {
			if (interval === null) return;
			window.clearInterval(interval);
			interval = null;
		};
		const startPolling = (): void => {
			if (document.hidden || interval !== null) return;
			interval = window.setInterval(poll, POLL_INTERVAL);
		};
		const handleVisibilityChange = (): void => {
			if (document.hidden) stopPolling();
			else {
				poll();
				startPolling();
			}
		};
		const activeLeafRef = app.workspace.on("active-leaf-change", poll);
		const layoutRef = app.workspace.on("layout-change", poll);
		const modifyRef = app.vault.on("modify", (file) => {
			if (file instanceof TFile && file.extension === "canvas") poll();
		});
		document.addEventListener("visibilitychange", handleVisibilityChange);
		startPolling();
		return () => {
			stopPolling();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			app.workspace.offref(activeLeafRef);
			app.workspace.offref(layoutRef);
			app.vault.offref(modifyRef);
		};
	}, [app.vault, app.workspace, poll]);

	return state;
}

function readState(observer: CanvasObserver): ActiveCanvasState {
	const canvasView = observer.getActiveCanvasView();
	if (!canvasView) return EMPTY_STATE;

	const nodes = canvasView.canvas.getData().nodes ?? [];
	const filePathByNodeId = new Map(
		nodes
			.filter((node) => node.type === "file" && node.file)
			.map((node) => [node.id, node.file!] as const),
	);
	const selectedNodes = Array.from(canvasView.canvas.selection ?? []);
	return {
		canvasView,
		selectedNodes,
		inCanvasPaths: new Set(filePathByNodeId.values()),
		selectedPaths: new Set(
			selectedNodes
				.map((node) => node.file?.path ?? filePathByNodeId.get(node.id))
				.filter((path): path is string => Boolean(path)),
		),
	};
}

function createSignature(state: ActiveCanvasState): string {
	return [
		state.canvasView?.file.path ?? "",
		[...state.inCanvasPaths].toSorted().join("\u0000"),
		state.selectedNodes
			.map(
				(node) =>
					`${node.id}:${node.x}:${node.y}:${node.width}:${node.height}:${node.file?.path ?? ""}`,
			)
			.toSorted()
			.join("\u0000"),
		[...state.selectedPaths].toSorted().join("\u0000"),
	].join("\u0001");
}
