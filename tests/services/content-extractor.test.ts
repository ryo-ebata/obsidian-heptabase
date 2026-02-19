import fs from "node:fs";
import path from "node:path";
import { ContentExtractor } from "@/services/content-extractor";
import { describe, expect, it } from "vitest";

const sampleNote = fs.readFileSync(
	path.resolve(__dirname, "../mocks/fixtures/sample-note.md"),
	"utf-8",
);

describe("ContentExtractor", () => {
	const extractor = new ContentExtractor();

	describe("extractContent", () => {
		it("extracts content under H2 (First Section)", () => {
			const result = extractor.extractContent(sampleNote, 4, 2);
			expect(result).toBe(
				"Content of the first section.\nMore content here.\n\n### Subsection 1.1\n\nNested content under subsection.",
			);
		});

		it("extracts content of the last H2 (Third Section)", () => {
			const result = extractor.extractContent(sampleNote, 17, 2);
			expect(result).toBe("Final section content.\nWith multiple lines.\nAnd some more text.");
		});

		it("extracts content including nested headings (H3 under H2)", () => {
			const result = extractor.extractContent(sampleNote, 4, 2);
			expect(result).toContain("### Subsection 1.1");
			expect(result).toContain("Nested content under subsection.");
		});

		it("returns an empty string for empty headings (next heading immediately follows)", () => {
			const emptyHeadingContent = "## Empty Section\n## Next Section\n\nContent here.";
			const result = extractor.extractContent(emptyHeadingContent, 0, 2);
			expect(result).toBe("");
		});

		it("extracts content under H1 (up to the next H1, or end of file if none)", () => {
			const content = "# Title\n\nIntro text.\n\n# Another Title\n\nOther content.";
			const result = extractor.extractContent(content, 0, 1);
			expect(result).toBe("Intro text.");
		});

		it("extracts to end of file when there is no next H1", () => {
			const result = extractor.extractContent(sampleNote, 0, 1);
			expect(result).toContain("This is an introduction paragraph.");
			expect(result).toContain("## First Section");
			expect(result).toContain("And some more text.");
		});

		it("returns an empty string for non-existent line numbers", () => {
			const result = extractor.extractContent(sampleNote, 999, 2);
			expect(result).toBe("");
		});
	});

	describe("getSectionRange", () => {
		it("returns range for a normal H2 section", () => {
			const result = extractor.getSectionRange(sampleNote, 4, 2);
			expect(result).toEqual({ contentStart: 5, contentEnd: 13 });
		});

		it("returns range for the last section (ends at file end)", () => {
			const result = extractor.getSectionRange(sampleNote, 17, 2);
			const lineCount = sampleNote.split("\n").length;
			expect(result).toEqual({ contentStart: 18, contentEnd: lineCount });
		});

		it("returns empty range for a section immediately followed by another heading", () => {
			const content = "## Empty Section\n## Next Section\n\nContent here.";
			const result = extractor.getSectionRange(content, 0, 2);
			expect(result).toEqual({ contentStart: 1, contentEnd: 1 });
		});

		it("returns range for H1 section", () => {
			const content = "# Title\n\nIntro text.\n\n# Another Title\n\nOther content.";
			const result = extractor.getSectionRange(content, 0, 1);
			expect(result).toEqual({ contentStart: 1, contentEnd: 4 });
		});

		it("returns null for out-of-range line number", () => {
			const result = extractor.getSectionRange(sampleNote, 999, 2);
			expect(result).toBeNull();
		});

		it("returns null for negative line number", () => {
			const result = extractor.getSectionRange(sampleNote, -1, 2);
			expect(result).toBeNull();
		});

		it("returns range for H3 nested section", () => {
			const result = extractor.getSectionRange(sampleNote, 9, 3);
			expect(result).toEqual({ contentStart: 10, contentEnd: 13 });
		});

		it("handles Japanese headings", () => {
			const content = "## 日本語の見出し\n\n日本語の本文です。\n\n## 次のセクション";
			const result = extractor.getSectionRange(content, 0, 2);
			expect(result).toEqual({ contentStart: 1, contentEnd: 4 });
		});
	});

	describe("extractContentWithHeading", () => {
		it("extracts content including the heading line", () => {
			const result = extractor.extractContentWithHeading(sampleNote, 17, 2);
			expect(result).toBe(
				"## Third Section\n\nFinal section content.\nWith multiple lines.\nAnd some more text.",
			);
		});

		it("extracts content under H2 with heading (First Section)", () => {
			const result = extractor.extractContentWithHeading(sampleNote, 4, 2);
			expect(result).toBe(
				"## First Section\n\nContent of the first section.\nMore content here.\n\n### Subsection 1.1\n\nNested content under subsection.",
			);
		});

		it("returns an empty string for non-existent line numbers", () => {
			const result = extractor.extractContentWithHeading(sampleNote, 999, 2);
			expect(result).toBe("");
		});
	});
});
