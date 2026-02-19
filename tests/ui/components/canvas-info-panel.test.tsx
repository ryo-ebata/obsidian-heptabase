import { DEFAULT_SETTINGS } from "@/types/settings";
import { CanvasInfoPanel } from "@/ui/components/canvas-info-panel";
import { PluginContext, type PluginContextValue } from "@/ui/context";
import { render, screen } from "@testing-library/react";
import { App, TFile } from "obsidian";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

function createWrapper(app: App) {
	const contextValue: PluginContextValue = {
		app,
		settings: DEFAULT_SETTINGS,
	};
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(PluginContext.Provider, { value: contextValue }, children);
	};
}

describe("CanvasInfoPanel", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);
	});

	it("shows empty message when no nodes are selected", () => {
		render(<CanvasInfoPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByText("No node selected")).toBeDefined();
	});

	it("applies panel layout classes", () => {
		const { container } = render(<CanvasInfoPanel />, {
			wrapper: createWrapper(app),
		});
		expect(container.querySelector(".p-2.h-full.overflow-y-auto")).not.toBeNull();
	});

	it("shows node info when a node is selected", () => {
		const file = new TFile("notes/test.md");
		const canvasView = {
			canvas: {
				getData: vi.fn().mockReturnValue({
					nodes: [
						{ id: "n1", type: "file", file: "notes/test.md", x: 0, y: 0, width: 400, height: 300 },
					],
					edges: [],
				}),
				setData: vi.fn(),
				requestSave: vi.fn(),
				createFileNode: vi.fn(),
				selection: new Set([{ id: "n1", x: 0, y: 0, width: 400, height: 300, file }]),
			},
			file: new TFile("test.canvas"),
		};
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		render(<CanvasInfoPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByText("1 node selected")).toBeDefined();
	});

	it("shows multiple nodes info", () => {
		const canvasView = {
			canvas: {
				getData: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
				setData: vi.fn(),
				requestSave: vi.fn(),
				createFileNode: vi.fn(),
				selection: new Set([
					{ id: "n1", x: 0, y: 0, width: 400, height: 300 },
					{ id: "n2", x: 500, y: 0, width: 400, height: 300 },
				]),
			},
			file: new TFile("test.canvas"),
		};
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		render(<CanvasInfoPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByText("2 nodes selected")).toBeDefined();
	});

	it("shows connections for a selected node", () => {
		const file = new TFile("notes/test.md");
		const canvasView = {
			canvas: {
				getData: vi.fn().mockReturnValue({
					nodes: [
						{ id: "n1", type: "file", file: "notes/test.md", x: 0, y: 0, width: 400, height: 300 },
						{ id: "n2", type: "file", file: "notes/other.md", x: 500, y: 0, width: 400, height: 300 },
					],
					edges: [
						{ id: "e1", fromNode: "n1", fromSide: "right", toNode: "n2", toSide: "left" },
					],
				}),
				setData: vi.fn(),
				requestSave: vi.fn(),
				createFileNode: vi.fn(),
				selection: new Set([{ id: "n1", x: 0, y: 0, width: 400, height: 300, file }]),
			},
			file: new TFile("test.canvas"),
		};
		app.workspace.getLeavesOfType = vi.fn().mockReturnValue([{ view: canvasView }]);

		render(<CanvasInfoPanel />, { wrapper: createWrapper(app) });
		expect(screen.getByText("Connections")).toBeDefined();
		expect(screen.getByText("→ n2")).toBeDefined();
	});
});
