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

	describe("search", () => {
		it("returns all files for an empty query including files without headings", async () => {
			const file1 = new TFile("notes/with-headings.md");
			const file2 = new TFile("notes/no-headings.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2]);

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
				],
			};
			(app.metadataCache.getFileCache as Mock).mockImplementation((file: TFile) => {
				if (file.path === "notes/with-headings.md") return cache;
				return {};
			});

			const result = await parser.search("");

			expect(result).toHaveLength(2);
			expect(result[0].file).toBe(file1);
			expect(result[0].headings).toHaveLength(1);
			expect(result[1].file).toBe(file2);
			expect(result[1].headings).toHaveLength(0);
		});

		it("matches by file title (case insensitive)", async () => {
			const file1 = new TFile("notes/Hello.md");
			const file2 = new TFile("notes/world.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2]);
			(app.metadataCache.getFileCache as Mock).mockReturnValue({});
			(app.vault.read as Mock).mockResolvedValue("");

			const result = await parser.search("hello");

			expect(result).toHaveLength(1);
			expect(result[0].file).toBe(file1);
		});

		it("matches by heading text (case insensitive)", async () => {
			const file1 = new TFile("notes/alpha.md");
			const file2 = new TFile("notes/beta.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2]);
			(app.vault.read as Mock).mockResolvedValue("");

			const cache: CachedMetadata = {
				headings: [
					{
						heading: "Important Topic",
						level: 1,
						position: {
							start: { line: 0, col: 0, offset: 0 },
							end: { line: 0, col: 17, offset: 17 },
						},
					},
				],
			};
			(app.metadataCache.getFileCache as Mock).mockImplementation((file: TFile) => {
				if (file.path === "notes/alpha.md") return cache;
				return {};
			});

			const result = await parser.search("important");

			expect(result).toHaveLength(1);
			expect(result[0].file).toBe(file1);
			expect(result[0].headings).toHaveLength(1);
		});

		it("matches by body content (case insensitive)", async () => {
			const file1 = new TFile("notes/alpha.md");
			const file2 = new TFile("notes/beta.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2]);
			(app.metadataCache.getFileCache as Mock).mockReturnValue({});

			(app.vault.read as Mock).mockImplementation((file: TFile) => {
				if (file.path === "notes/alpha.md") {
					return Promise.resolve("This note contains special keyword in the body.");
				}
				return Promise.resolve("Nothing relevant here.");
			});

			const result = await parser.search("special keyword");

			expect(result).toHaveLength(1);
			expect(result[0].file).toBe(file1);
		});

		it("does not read file content when already matched by title", async () => {
			const file = new TFile("notes/matching-title.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
			(app.metadataCache.getFileCache as Mock).mockReturnValue({});

			const result = await parser.search("matching");

			expect(result).toHaveLength(1);
			expect(app.vault.read).not.toHaveBeenCalled();
		});

		it("does not read file content when already matched by heading", async () => {
			const file = new TFile("notes/unrelated.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);

			const cache: CachedMetadata = {
				headings: [
					{
						heading: "Matching Heading",
						level: 1,
						position: {
							start: { line: 0, col: 0, offset: 0 },
							end: { line: 0, col: 16, offset: 16 },
						},
					},
				],
			};
			(app.metadataCache.getFileCache as Mock).mockReturnValue(cache);

			const result = await parser.search("matching");

			expect(result).toHaveLength(1);
			expect(app.vault.read).not.toHaveBeenCalled();
		});

		it("returns empty array when nothing matches", async () => {
			const file = new TFile("notes/hello.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
			(app.metadataCache.getFileCache as Mock).mockReturnValue({});
			(app.vault.read as Mock).mockResolvedValue("some content");

			const result = await parser.search("xyz");

			expect(result).toEqual([]);
		});

		it("matches across all three criteria", async () => {
			const fileByTitle = new TFile("notes/target-file.md");
			const fileByHeading = new TFile("notes/other.md");
			const fileByBody = new TFile("notes/another.md");
			const fileNoMatch = new TFile("notes/unrelated.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([
				fileByTitle,
				fileByHeading,
				fileByBody,
				fileNoMatch,
			]);

			const headingCache: CachedMetadata = {
				headings: [
					{
						heading: "Target Section",
						level: 1,
						position: {
							start: { line: 0, col: 0, offset: 0 },
							end: { line: 0, col: 14, offset: 14 },
						},
					},
				],
			};
			(app.metadataCache.getFileCache as Mock).mockImplementation((file: TFile) => {
				if (file.path === "notes/other.md") return headingCache;
				return {};
			});
			(app.vault.read as Mock).mockImplementation((file: TFile) => {
				if (file.path === "notes/another.md") {
					return Promise.resolve("This has target in the body.");
				}
				return Promise.resolve("No match here.");
			});

			const result = await parser.search("target");

			expect(result).toHaveLength(3);
			expect(result.map((r) => r.file.path)).toEqual([
				"notes/target-file.md",
				"notes/other.md",
				"notes/another.md",
			]);
		});
	});
});
