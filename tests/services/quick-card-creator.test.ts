import { CanvasOperator } from "@/services/canvas-operator";
import { FileCreator } from "@/services/file-creator";
import { QuickCardCreator } from "@/services/quick-card-creator";
import type { Canvas } from "@/types/obsidian-canvas";
import { DEFAULT_SETTINGS } from "@/types/settings";
import { App, TFile, TFolder } from "obsidian";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";

describe("QuickCardCreator", () => {
	let app: App;
	let fileCreator: FileCreator;
	let canvasOperator: CanvasOperator;
	let quickCardCreator: QuickCardCreator;
	let canvas: Canvas;
	let canvasFile: TFile;

	beforeEach(() => {
		app = new App();
		fileCreator = new FileCreator(app, DEFAULT_SETTINGS);
		canvasOperator = new CanvasOperator(app, DEFAULT_SETTINGS);
		quickCardCreator = new QuickCardCreator(fileCreator, canvasOperator);

		canvas = {
			getData: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
			setData: vi.fn(),
			requestSave: vi.fn(),
			createFileNode: vi.fn().mockReturnValue({
				id: "node-1",
				x: 100,
				y: 200,
				width: 400,
				height: 300,
				file: new TFile("Untitled.md"),
			}),
		};

		canvasFile = new TFile("canvas.canvas");
		canvasFile.parent = new TFolder("notes");
	});

	describe("createCardAtPosition", () => {
		it("creates a file and adds a node to the canvas", async () => {
			const createdFile = new TFile("notes/Untitled.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(createdFile);

			const result = await quickCardCreator.createCardAtPosition(
				canvas,
				canvasFile,
				{ x: 100, y: 200 },
				"Untitled",
			);

			expect(app.vault.create).toHaveBeenCalled();
			expect(canvas.createFileNode).toHaveBeenCalledWith(
				expect.objectContaining({
					file: createdFile,
					pos: { x: 100, y: 200 },
				}),
			);
			expect(result).toBe(createdFile);
		});

		it("uses the default title for file content", async () => {
			const createdFile = new TFile("notes/My Card.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(createdFile);

			await quickCardCreator.createCardAtPosition(canvas, canvasFile, { x: 0, y: 0 }, "My Card");

			expect(app.vault.create).toHaveBeenCalledWith(expect.any(String), "# My Card");
		});

		it("handles file name collision via FileCreator", async () => {
			const createdFile = new TFile("notes/Untitled_1.md");
			(app.vault.getAbstractFileByPath as Mock)
				.mockReturnValueOnce(new TFile("notes/Untitled.md"))
				.mockReturnValueOnce(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(createdFile);

			const result = await quickCardCreator.createCardAtPosition(
				canvas,
				canvasFile,
				{ x: 50, y: 50 },
				"Untitled",
			);

			expect(app.vault.create).toHaveBeenCalledWith("notes/Untitled_1.md", "# Untitled");
			expect(result).toBe(createdFile);
		});

		it("passes the correct position to canvasOperator", async () => {
			const createdFile = new TFile("notes/Untitled.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(createdFile);

			await quickCardCreator.createCardAtPosition(
				canvas,
				canvasFile,
				{ x: 500, y: 300 },
				"Untitled",
			);

			expect(canvas.createFileNode).toHaveBeenCalledWith(
				expect.objectContaining({
					pos: { x: 500, y: 300 },
				}),
			);
		});

		it("uses canvasFile as the source file for FileCreator", async () => {
			const canvasInSubfolder = new TFile("projects/my-canvas.canvas");
			canvasInSubfolder.parent = new TFolder("projects");

			const createdFile = new TFile("projects/Untitled.md");
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(createdFile);

			await quickCardCreator.createCardAtPosition(
				canvas,
				canvasInSubfolder,
				{ x: 0, y: 0 },
				"Untitled",
			);

			expect(app.vault.create).toHaveBeenCalledWith("projects/Untitled.md", "# Untitled");
		});
	});
});
