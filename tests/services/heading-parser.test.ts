import { HeadingParser } from "@/services/heading-parser";
import { App, TFile } from "obsidian";
import { type Mock, beforeEach, describe, expect, it } from "vitest";

describe("HeadingParser", () => {
	let app: App;
	let parser: HeadingParser;

	beforeEach(() => {
		app = new App();
		parser = new HeadingParser(app);
	});

	describe("search", () => {
		it("returns all files for an empty query with excerpts", async () => {
			const file1 = new TFile("notes/with-content.md");
			const file2 = new TFile("notes/empty.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2]);
			(app.vault.cachedRead as Mock).mockImplementation((file: TFile) => {
				if (file.path === "notes/with-content.md") {
					return Promise.resolve("First line\nSecond line\nThird line");
				}
				return Promise.resolve("");
			});

			const result = await parser.search("");

			expect(result).toHaveLength(2);
			expect(result[0].file).toBe(file1);
			expect(result[0].excerpt).toBe("First line\nSecond line\nThird line");
			expect(result[1].file).toBe(file2);
			expect(result[1].excerpt).toBe("");
		});

		it("strips frontmatter from excerpt", async () => {
			const file = new TFile("notes/with-fm.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
			(app.vault.cachedRead as Mock).mockResolvedValue(
				"---\ntitle: Test\n---\nFirst body line\nSecond line",
			);

			const result = await parser.search("");

			expect(result).toHaveLength(1);
			expect(result[0].excerpt).toBe("First body line\nSecond line");
		});

		it("skips blank lines in excerpt", async () => {
			const file = new TFile("notes/blanks.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
			(app.vault.cachedRead as Mock).mockResolvedValue(
				"\n\nFirst\n\nSecond\n\nThird\n\nFourth",
			);

			const result = await parser.search("");

			expect(result[0].excerpt).toBe("First\nSecond\nThird");
		});

		it("matches by file title (case insensitive)", async () => {
			const file1 = new TFile("notes/Hello.md");
			const file2 = new TFile("notes/world.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2]);
			(app.vault.cachedRead as Mock).mockResolvedValue("content");
			(app.vault.read as Mock).mockResolvedValue("");

			const result = await parser.search("hello");

			expect(result).toHaveLength(1);
			expect(result[0].file).toBe(file1);
		});

		it("matches by body content (case insensitive)", async () => {
			const file1 = new TFile("notes/alpha.md");
			const file2 = new TFile("notes/beta.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file1, file2]);

			(app.vault.read as Mock).mockImplementation((file: TFile) => {
				if (file.path === "notes/alpha.md") {
					return Promise.resolve("This note contains special keyword in the body.");
				}
				return Promise.resolve("Nothing relevant here.");
			});
			(app.vault.cachedRead as Mock).mockResolvedValue("content");

			const result = await parser.search("special keyword");

			expect(result).toHaveLength(1);
			expect(result[0].file).toBe(file1);
		});

		it("does not read file content when already matched by title", async () => {
			const file = new TFile("notes/matching-title.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
			(app.vault.cachedRead as Mock).mockResolvedValue("content");

			const result = await parser.search("matching");

			expect(result).toHaveLength(1);
			expect(app.vault.read).not.toHaveBeenCalled();
		});

		it("returns empty array when nothing matches", async () => {
			const file = new TFile("notes/hello.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
			(app.vault.read as Mock).mockResolvedValue("some content");

			const result = await parser.search("xyz");

			expect(result).toEqual([]);
		});

		it("returns excerpt from content when matched by body", async () => {
			const file = new TFile("notes/body-match.md");
			(app.vault.getMarkdownFiles as Mock).mockReturnValue([file]);
			(app.vault.read as Mock).mockResolvedValue(
				"Line one\nLine two\nLine three\nLine four",
			);

			const result = await parser.search("line two");

			expect(result).toHaveLength(1);
			expect(result[0].excerpt).toBe("Line one\nLine two\nLine three");
		});
	});
});
