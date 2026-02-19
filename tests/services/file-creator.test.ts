import { FileCreator } from "@/services/file-creator";
import type { HeptabaseSettings } from "@/types/settings";
import { App, TFile, TFolder } from "obsidian";
import { type Mock, beforeEach, describe, expect, it } from "vitest";

describe("FileCreator", () => {
	let app: App;
	let settings: HeptabaseSettings;
	let creator: FileCreator;
	let sourceFile: TFile;

	beforeEach(() => {
		app = new App();
		settings = {
			extractedFilesFolder: "",
			defaultNodeWidth: 400,
			defaultNodeHeight: 300,
			fileNamePrefix: "",
			leaveBacklink: false,
		};
		creator = new FileCreator(app, settings);
		sourceFile = new TFile("notes/source.md");
		sourceFile.parent = new TFolder("notes");
	});

	describe("createFile", () => {
		it("creates with a sanitized filename", async () => {
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(new TFile("notes/HeadingNameTest.md"));

			await creator.createFile("Heading/Name:Test?", "content", sourceFile);

			expect(app.vault.create).toHaveBeenCalledWith("notes/HeadingNameTest.md", "content");
		});

		it("calls vault.create with correct path and content", async () => {
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(new TFile("notes/My Heading.md"));

			const result = await creator.createFile("My Heading", "Some content", sourceFile);

			expect(app.vault.create).toHaveBeenCalledWith("notes/My Heading.md", "Some content");
			expect(result.basename).toBe("My Heading");
		});
	});

	describe("sequential suffix on name collision", () => {
		it("retries with _1 when getAbstractFileByPath returns non-null", async () => {
			(app.vault.getAbstractFileByPath as Mock)
				.mockReturnValueOnce(new TFile("notes/My Heading.md"))
				.mockReturnValueOnce(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(new TFile("notes/My Heading_1.md"));

			const result = await creator.createFile("My Heading", "content", sourceFile);

			expect(app.vault.create).toHaveBeenCalledWith("notes/My Heading_1.md", "content");
			expect(result.basename).toBe("My Heading_1");
		});

		it("creates with _2 when both original and _1 already exist", async () => {
			(app.vault.getAbstractFileByPath as Mock)
				.mockReturnValueOnce(new TFile("notes/My Heading.md"))
				.mockReturnValueOnce(new TFile("notes/My Heading_1.md"))
				.mockReturnValueOnce(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(new TFile("notes/My Heading_2.md"));

			const result = await creator.createFile("My Heading", "content", sourceFile);

			expect(app.vault.create).toHaveBeenCalledWith("notes/My Heading_2.md", "content");
			expect(result.basename).toBe("My Heading_2");
		});
	});

	describe("automatic folder creation", () => {
		it("creates the folder when extractedFilesFolder is set and folder does not exist", async () => {
			settings.extractedFilesFolder = "extracted";
			creator = new FileCreator(app, settings);
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(false);
			(app.vault.create as Mock).mockResolvedValue(new TFile("extracted/My Heading.md"));

			await creator.createFile("My Heading", "content", sourceFile);

			expect(app.vault.createFolder).toHaveBeenCalledWith("extracted");
			expect(app.vault.create).toHaveBeenCalledWith("extracted/My Heading.md", "content");
		});

		it("does not call createFolder when folder already exists", async () => {
			settings.extractedFilesFolder = "extracted";
			creator = new FileCreator(app, settings);
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(new TFile("extracted/My Heading.md"));

			await creator.createFile("My Heading", "content", sourceFile);

			expect(app.vault.createFolder).not.toHaveBeenCalled();
		});
	});

	describe("with prefix", () => {
		it("includes fileNamePrefix in the filename", async () => {
			settings.fileNamePrefix = "Extract - ";
			creator = new FileCreator(app, settings);
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(new TFile("notes/Extract - My Heading.md"));

			const result = await creator.createFile("My Heading", "content", sourceFile);

			expect(app.vault.create).toHaveBeenCalledWith("notes/Extract - My Heading.md", "content");
			expect(result.basename).toBe("Extract - My Heading");
		});
	});

	describe("same folder as source file", () => {
		it("uses sourceFile.parent path when extractedFilesFolder is empty", async () => {
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(new TFile("notes/Title.md"));

			const result = await creator.createFile("Title", "content", sourceFile);

			expect(app.vault.create).toHaveBeenCalledWith("notes/Title.md", "content");
			expect(result.basename).toBe("Title");
		});
	});

	describe("root folder", () => {
		it("creates at root when sourceFile.parent is null", async () => {
			const rootFile = new TFile("root-note.md");
			rootFile.parent = null;
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);
			(app.vault.adapter.exists as Mock).mockResolvedValue(true);
			(app.vault.create as Mock).mockResolvedValue(new TFile("Title.md"));

			const result = await creator.createFile("Title", "content", rootFile);

			expect(app.vault.create).toHaveBeenCalledWith("Title.md", "content");
			expect(result.basename).toBe("Title");
		});
	});

	describe("resolveUniqueFilePath", () => {
		it("returns the path as-is when there is no collision", () => {
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);

			const result = creator.resolveUniqueFilePath("notes", "Title");

			expect(result).toBe("notes/Title.md");
		});

		it("returns a path with sequential suffix when there is a collision", () => {
			(app.vault.getAbstractFileByPath as Mock)
				.mockReturnValueOnce(new TFile("notes/Title.md"))
				.mockReturnValueOnce(null);

			const result = creator.resolveUniqueFilePath("notes", "Title");

			expect(result).toBe("notes/Title_1.md");
		});

		it("returns only the filename when folder is an empty string", () => {
			(app.vault.getAbstractFileByPath as Mock).mockReturnValue(null);

			const result = creator.resolveUniqueFilePath("", "Title");

			expect(result).toBe("Title.md");
		});
	});
});
