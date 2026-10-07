import { CanvasSearchPanel } from "@/ui/components/canvas-search-panel";
import type { CanvasNode } from "@/types/obsidian-canvas";
import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "obsidian";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { createMockCanvasView } from "../../helpers/create-mock-canvas-view";
import { createWrapper } from "../../helpers/create-wrapper";

describe("CanvasSearchPanel", () => {
	it("arranges the current Canvas selection from the layout toolbar", () => {
		const app = new App();
		const selectedNodes: CanvasNode[] = [
			{ id: "a", x: 40, y: 20, width: 100, height: 80 },
			{ id: "b", x: 240, y: 100, width: 100, height: 80 },
		];
		const canvasView = createMockCanvasView(selectedNodes);
		canvasView.canvas.getData = vi.fn().mockReturnValue({
			nodes: [
				{ ...selectedNodes[0], type: "text", text: "A" },
				{ ...selectedNodes[1], type: "text", text: "B" },
			],
			edges: [],
		});
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		render(<CanvasSearchPanel />, { wrapper: createWrapper(app) });
		fireEvent.click(screen.getByRole("button", { name: "Align left" }));

		const arranged = vi.mocked(canvasView.canvas.setData).mock.calls[0][0];
		expect(arranged.nodes.map((node) => node.x)).toEqual([40, 40]);
		expect(screen.getByText("2 selected")).toBeDefined();
		expect(
			screen.getByRole("button", { name: "Distribute horizontally" }).hasAttribute("disabled"),
		).toBe(true);

		fireEvent.click(screen.getByRole("button", { name: "Connect selected nodes" }));
		const connected = vi.mocked(canvasView.canvas.setData).mock.calls[1][0];
		expect(connected.edges).toHaveLength(1);

		const undoButton = screen.getByRole("button", { name: "Undo last Canvas change" });
		expect(undoButton.hasAttribute("disabled")).toBe(false);
		fireEvent.click(undoButton);
		expect(vi.mocked(canvasView.canvas.setData)).toHaveBeenCalledTimes(3);
		expect(
			screen.getByRole("button", { name: "Redo last Canvas change" }).hasAttribute("disabled"),
		).toBe(false);
	}, 10_000);

	it("searches the active Canvas and focuses a selected result", () => {
		const app = new App();
		const canvasView = createMockCanvasView();
		const runtimeNode: CanvasNode = {
			id: "research-card",
			x: 0,
			y: 0,
			width: 400,
			height: 300,
		};
		canvasView.canvas.getData = vi.fn().mockReturnValue({
			nodes: [
				{
					id: runtimeNode.id,
					type: "file",
					file: "notes/Research question.md",
					x: 0,
					y: 0,
					width: 400,
					height: 300,
				},
			],
			edges: [],
		});
		canvasView.canvas.nodes = new Map([[runtimeNode.id, runtimeNode]]);
		canvasView.canvas.selectOnly = vi.fn();
		canvasView.canvas.zoomToSelection = vi.fn();
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		render(<CanvasSearchPanel />, { wrapper: createWrapper(app) });

		fireEvent.change(screen.getByPlaceholderText("Search this Canvas..."), {
			target: { value: "research" },
		});
		fireEvent.click(screen.getByText("Research question"));

		expect(canvasView.canvas.selectOnly).toHaveBeenCalledWith(runtimeNode);
		expect(canvasView.canvas.zoomToSelection).toHaveBeenCalled();
	});

	it("clears the Canvas search without disturbing the active Canvas", () => {
		const app = new App();
		const canvasView = createMockCanvasView();
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		render(<CanvasSearchPanel />, { wrapper: createWrapper(app) });
		const searchInput = screen.getByPlaceholderText("Search this Canvas...");
		fireEvent.change(searchInput, { target: { value: "research" } });
		fireEvent.click(screen.getByRole("button", { name: "Clear Canvas search" }));

		expect((searchInput as HTMLInputElement).value).toBe("");
	});

	it("collapses selection-only tools until a card is selected", () => {
		const app = new App();
		const canvasView = createMockCanvasView();
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		render(<CanvasSearchPanel />, { wrapper: createWrapper(app) });

		expect(screen.queryByRole("button", { name: "Align left" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Connect selected nodes" })).toBeNull();
		expect(screen.getByRole("button", { name: "Undo last Canvas change" })).toBeDefined();
	});

	it("guides the user when no Canvas is open", () => {
		const app = new App();
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);

		render(<CanvasSearchPanel />, { wrapper: createWrapper(app) });

		expect(screen.getByText("Open a Canvas to search its contents.")).toBeDefined();
	});
});
