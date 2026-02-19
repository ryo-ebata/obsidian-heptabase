import { BacklinkWriter } from "@/services/backlink-writer";
import { App, TFile } from "obsidian";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("BacklinkWriter", () => {
	let app: App;
	let writer: BacklinkWriter;

	beforeEach(() => {
		app = new App();
		writer = new BacklinkWriter(app);
	});

	describe("replaceSection", () => {
		it("replaces section body with backlink, keeping heading", async () => {
			const content =
				"## First Section\n\nContent of the first\nsection content.\n\n## Second Section\n\nOther content.";
			app.vault.read = vi.fn().mockResolvedValue(content);

			const sourceFile = new TFile("notes/source.md");
			await writer.replaceSection(sourceFile, 0, 2, "First Section");

			expect(app.vault.modify).toHaveBeenCalledWith(
				sourceFile,
				"## First Section\n\n[[First Section]]\n\n## Second Section\n\nOther content.",
			);
		});

		it("replaces last section body with backlink", async () => {
			const content =
				"## First Section\n\nSome content.\n\n## Last Section\n\nFinal content.\nMore lines.";
			app.vault.read = vi.fn().mockResolvedValue(content);

			const sourceFile = new TFile("notes/source.md");
			await writer.replaceSection(sourceFile, 4, 2, "Last Section");

			expect(app.vault.modify).toHaveBeenCalledWith(
				sourceFile,
				"## First Section\n\nSome content.\n\n## Last Section\n\n[[Last Section]]",
			);
		});

		it("replaces empty section body with backlink", async () => {
			const content = "## Empty Section\n## Next Section\n\nContent.";
			app.vault.read = vi.fn().mockResolvedValue(content);

			const sourceFile = new TFile("notes/source.md");
			await writer.replaceSection(sourceFile, 0, 2, "Empty Section");

			expect(app.vault.modify).toHaveBeenCalledWith(
				sourceFile,
				"## Empty Section\n\n[[Empty Section]]\n\n## Next Section\n\nContent.",
			);
		});

		it("handles nested headings (H3 under H2)", async () => {
			const content = "## Parent\n\nContent.\n\n### Child\n\nChild content.\n\n## Next";
			app.vault.read = vi.fn().mockResolvedValue(content);

			const sourceFile = new TFile("notes/source.md");
			await writer.replaceSection(sourceFile, 0, 2, "Parent");

			expect(app.vault.modify).toHaveBeenCalledWith(sourceFile, "## Parent\n\n[[Parent]]\n\n## Next");
		});

		it("handles Japanese heading text", async () => {
			const content = "## 日本語の見出し\n\n日本語の本文です。\n\n## 次のセクション";
			app.vault.read = vi.fn().mockResolvedValue(content);

			const sourceFile = new TFile("notes/source.md");
			await writer.replaceSection(sourceFile, 0, 2, "日本語の見出し");

			expect(app.vault.modify).toHaveBeenCalledWith(
				sourceFile,
				"## 日本語の見出し\n\n[[日本語の見出し]]\n\n## 次のセクション",
			);
		});

		it("does nothing when heading line is out of range", async () => {
			const content = "## Section\n\nContent.";
			app.vault.read = vi.fn().mockResolvedValue(content);

			const sourceFile = new TFile("notes/source.md");
			await writer.replaceSection(sourceFile, 999, 2, "Section");

			expect(app.vault.modify).not.toHaveBeenCalled();
		});
	});

	describe("addConnection", () => {
		it("adds outgoing connection to empty frontmatter", async () => {
			const file = new TFile("notes/source.md");
			const captured: Record<string, unknown>[] = [];

			app.fileManager.processFrontMatter = vi.fn().mockImplementation(
				async (_file: TFile, fn: (fm: Record<string, unknown>) => void) => {
					const fm: Record<string, unknown> = {};
					fn(fm);
					captured.push(fm);
				},
			);

			await writer.addConnection(file, "NoteB", "->");

			expect(app.fileManager.processFrontMatter).toHaveBeenCalledWith(file, expect.any(Function));
			expect(captured[0]["connections-to"]).toEqual(["[[NoteB]]"]);
			expect(captured[0]["connections-from"]).toBeUndefined();
		});

		it("adds incoming connection to empty frontmatter", async () => {
			const file = new TFile("notes/target.md");
			const captured: Record<string, unknown>[] = [];

			app.fileManager.processFrontMatter = vi.fn().mockImplementation(
				async (_file: TFile, fn: (fm: Record<string, unknown>) => void) => {
					const fm: Record<string, unknown> = {};
					fn(fm);
					captured.push(fm);
				},
			);

			await writer.addConnection(file, "NoteA", "<-");

			expect(captured[0]["connections-from"]).toEqual(["[[NoteA]]"]);
			expect(captured[0]["connections-to"]).toBeUndefined();
		});

		it("appends to existing connections", async () => {
			const file = new TFile("notes/source.md");
			const captured: Record<string, unknown>[] = [];

			app.fileManager.processFrontMatter = vi.fn().mockImplementation(
				async (_file: TFile, fn: (fm: Record<string, unknown>) => void) => {
					const fm: Record<string, unknown> = {
						"connections-to": ["[[NoteA]]"],
					};
					fn(fm);
					captured.push(fm);
				},
			);

			await writer.addConnection(file, "NoteB", "->");

			expect(captured[0]["connections-to"]).toEqual(["[[NoteA]]", "[[NoteB]]"]);
		});

		it("skips duplicate connection", async () => {
			const file = new TFile("notes/source.md");
			const captured: Record<string, unknown>[] = [];

			app.fileManager.processFrontMatter = vi.fn().mockImplementation(
				async (_file: TFile, fn: (fm: Record<string, unknown>) => void) => {
					const fm: Record<string, unknown> = {
						"connections-to": ["[[NoteB]]"],
					};
					fn(fm);
					captured.push(fm);
				},
			);

			await writer.addConnection(file, "NoteB", "->");

			expect(captured[0]["connections-to"]).toEqual(["[[NoteB]]"]);
		});

		it("keeps separate keys for different directions", async () => {
			const file = new TFile("notes/source.md");
			const captured: Record<string, unknown>[] = [];

			app.fileManager.processFrontMatter = vi.fn().mockImplementation(
				async (_file: TFile, fn: (fm: Record<string, unknown>) => void) => {
					const fm: Record<string, unknown> = {
						"connections-to": ["[[NoteB]]"],
					};
					fn(fm);
					captured.push(fm);
				},
			);

			await writer.addConnection(file, "NoteB", "<-");

			expect(captured[0]["connections-to"]).toEqual(["[[NoteB]]"]);
			expect(captured[0]["connections-from"]).toEqual(["[[NoteB]]"]);
		});
	});

	describe("removeConnection", () => {
		it("removes a matching connection entry", async () => {
			const file = new TFile("notes/source.md");
			const captured: Record<string, unknown>[] = [];

			app.fileManager.processFrontMatter = vi.fn().mockImplementation(
				async (_file: TFile, fn: (fm: Record<string, unknown>) => void) => {
					const fm: Record<string, unknown> = {
						"connections-to": ["[[NoteA]]", "[[NoteB]]"],
					};
					fn(fm);
					captured.push(fm);
				},
			);

			await writer.removeConnection(file, "NoteA", "->");

			expect(captured[0]["connections-to"]).toEqual(["[[NoteB]]"]);
		});

		it("deletes key when last entry is removed", async () => {
			const file = new TFile("notes/source.md");
			const captured: Record<string, unknown>[] = [];

			app.fileManager.processFrontMatter = vi.fn().mockImplementation(
				async (_file: TFile, fn: (fm: Record<string, unknown>) => void) => {
					const fm: Record<string, unknown> = {
						"connections-to": ["[[NoteA]]"],
					};
					fn(fm);
					captured.push(fm);
				},
			);

			await writer.removeConnection(file, "NoteA", "->");

			expect(captured[0]["connections-to"]).toBeUndefined();
		});

		it("does nothing when entry not found", async () => {
			const file = new TFile("notes/source.md");
			const captured: Record<string, unknown>[] = [];

			app.fileManager.processFrontMatter = vi.fn().mockImplementation(
				async (_file: TFile, fn: (fm: Record<string, unknown>) => void) => {
					const fm: Record<string, unknown> = {
						"connections-to": ["[[NoteA]]"],
					};
					fn(fm);
					captured.push(fm);
				},
			);

			await writer.removeConnection(file, "NonExistent", "->");

			expect(captured[0]["connections-to"]).toEqual(["[[NoteA]]"]);
		});

		it("does nothing when key does not exist", async () => {
			const file = new TFile("notes/source.md");
			const captured: Record<string, unknown>[] = [];

			app.fileManager.processFrontMatter = vi.fn().mockImplementation(
				async (_file: TFile, fn: (fm: Record<string, unknown>) => void) => {
					const fm: Record<string, unknown> = {};
					fn(fm);
					captured.push(fm);
				},
			);

			await writer.removeConnection(file, "NoteA", "->");

			expect(captured[0]["connections-to"]).toBeUndefined();
		});

		it("only removes from the correct direction key", async () => {
			const file = new TFile("notes/source.md");
			const captured: Record<string, unknown>[] = [];

			app.fileManager.processFrontMatter = vi.fn().mockImplementation(
				async (_file: TFile, fn: (fm: Record<string, unknown>) => void) => {
					const fm: Record<string, unknown> = {
						"connections-to": ["[[NoteA]]"],
						"connections-from": ["[[NoteA]]"],
					};
					fn(fm);
					captured.push(fm);
				},
			);

			await writer.removeConnection(file, "NoteA", "->");

			expect(captured[0]["connections-to"]).toBeUndefined();
			expect(captured[0]["connections-from"]).toEqual(["[[NoteA]]"]);
		});
	});
});
