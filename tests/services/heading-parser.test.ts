import { HeadingParser } from "@/services/heading-parser";
import { App, type CachedMetadata, TFile } from "obsidian";
import { type Mock, beforeEach, describe, expect, it } from "vitest";

describe("HeadingParser", () => {
	let app: App;
	let parser: HeadingParser;

	beforeEach(() => {
		app = new App();
		parser = new HeadingParser(app);
	});

	describe("searchNotes", () => {
		it("returns files matching the query", () => {
			const file1 = new TFile("notes/hello.md");
			const file2 = new TFile("notes/world.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2]);

			const result = parser.searchNotes("hello");

			expect(result).toEqual([file1]);
		});

		it("returns all files for an empty query", () => {
			const file1 = new TFile("notes/hello.md");
			const file2 = new TFile("notes/world.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2]);

			const result = parser.searchNotes("");

			expect(result).toEqual([file1, file2]);
		});

		it("ignores case", () => {
			const file1 = new TFile("notes/Hello.md");
			const file2 = new TFile("notes/WORLD.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2]);

			const result = parser.searchNotes("hello");

			expect(result).toEqual([file1]);
		});

		it("returns an empty array when nothing matches", () => {
			const file1 = new TFile("notes/hello.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1]);

			const result = parser.searchNotes("xyz");

			expect(result).toEqual([]);
		});
	});

	describe("getHeadings", () => {
		it("returns headings from cache", () => {
			const file = new TFile("notes/test.md");
			const cache: CachedMetadata = {
				headings: [
					{
						heading: "Title",
						level: 1,
						position: {
							start: { line: 0, col: 0, offset: 0 },
							end: { line: 0, col: 7, offset: 7 },
						},
					},
					{
						heading: "Section",
						level: 2,
						position: {
							start: { line: 2, col: 0, offset: 10 },
							end: { line: 2, col: 10, offset: 20 },
						},
					},
				],
			};
			(app.metadataCache.getFileCache as Mock).mockReturnValue(cache);

			const result = parser.getHeadings(file);

			expect(result).toEqual([
				{
					heading: "Title",
					level: 1,
					position: {
						start: { line: 0, col: 0, offset: 0 },
						end: { line: 0, col: 7, offset: 7 },
					},
				},
				{
					heading: "Section",
					level: 2,
					position: {
						start: { line: 2, col: 0, offset: 10 },
						end: { line: 2, col: 10, offset: 20 },
					},
				},
			]);
		});

		it("returns an empty array when cache is null", () => {
			const file = new TFile("notes/test.md");
			(app.metadataCache.getFileCache as Mock).mockReturnValue(null);

			const result = parser.getHeadings(file);

			expect(result).toEqual([]);
		});

		it("returns an empty array when headings is undefined", () => {
			const file = new TFile("notes/test.md");
			(app.metadataCache.getFileCache as Mock).mockReturnValue({});

			const result = parser.getHeadings(file);

			expect(result).toEqual([]);
		});
	});

	describe("searchNotesWithHeadings", () => {
		it("returns only notes that have headings", () => {
			const file1 = new TFile("notes/with-headings.md");
			const file2 = new TFile("notes/no-headings.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2]);

			const cacheWithHeadings: CachedMetadata = {
				headings: [
					{
						heading: "Title",
						level: 1,
						position: {
							start: { line: 0, col: 0, offset: 0 },
							end: { line: 0, col: 7, offset: 7 },
						},
					},
				],
			};
			(app.metadataCache.getFileCache as Mock).mockImplementation((file: TFile) => {
				if (file.path === "notes/with-headings.md") {
					return cacheWithHeadings;
				}
				return {};
			});

			const result = parser.searchNotesWithHeadings("");

			expect(result).toHaveLength(1);
			expect(result[0].file).toBe(file1);
			expect(result[0].headings).toHaveLength(1);
			expect(result[0].headings[0].heading).toBe("Title");
		});

		it("combines search and filtering", () => {
			const file1 = new TFile("notes/alpha.md");
			const file2 = new TFile("notes/beta.md");
			const file3 = new TFile("notes/alphabet.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2, file3]);

			const cacheWithHeadings: CachedMetadata = {
				headings: [
					{
						heading: "Heading",
						level: 1,
						position: {
							start: { line: 0, col: 0, offset: 0 },
							end: { line: 0, col: 9, offset: 9 },
						},
					},
				],
			};
			(app.metadataCache.getFileCache as Mock).mockImplementation((file: TFile) => {
				if (file.path === "notes/alpha.md") {
					return cacheWithHeadings;
				}
				if (file.path === "notes/alphabet.md") {
					return {};
				}
				return null;
			});

			const result = parser.searchNotesWithHeadings("alpha");

			expect(result).toHaveLength(1);
			expect(result[0].file).toBe(file1);
			expect(result[0].headings[0].heading).toBe("Heading");
		});
	});
});
