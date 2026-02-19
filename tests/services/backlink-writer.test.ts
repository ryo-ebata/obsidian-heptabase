import { BacklinkWriter } from "@/services/backlink-writer";
import { App, TFile, Vault } from "obsidian";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("BacklinkWriter", () => {
	let app: App;
	let vault: Vault;
	let writer: BacklinkWriter;

	beforeEach(() => {
		app = new App();
		vault = app.vault;
		writer = new BacklinkWriter(app);
	});

	describe("replaceSection", () => {
		it("replaces section body with backlink, keeping heading", async () => {
			const content =
				"## First Section\n\nContent of the first\nsection content.\n\n## Second Section\n\nOther content.";
			vault.read = vi.fn().mockResolvedValue(content);

			const sourceFile = new TFile("notes/source.md");
			await writer.replaceSection(sourceFile, 0, 2, "First Section");

			expect(vault.modify).toHaveBeenCalledWith(
				sourceFile,
				"## First Section\n\n[[First Section]]\n\n## Second Section\n\nOther content.",
			);
		});

		it("replaces last section body with backlink", async () => {
			const content =
				"## First Section\n\nSome content.\n\n## Last Section\n\nFinal content.\nMore lines.";
			vault.read = vi.fn().mockResolvedValue(content);

			const sourceFile = new TFile("notes/source.md");
			await writer.replaceSection(sourceFile, 4, 2, "Last Section");

			expect(vault.modify).toHaveBeenCalledWith(
				sourceFile,
				"## First Section\n\nSome content.\n\n## Last Section\n\n[[Last Section]]",
			);
		});

		it("replaces empty section body with backlink", async () => {
			const content = "## Empty Section\n## Next Section\n\nContent.";
			vault.read = vi.fn().mockResolvedValue(content);

			const sourceFile = new TFile("notes/source.md");
			await writer.replaceSection(sourceFile, 0, 2, "Empty Section");

			expect(vault.modify).toHaveBeenCalledWith(
				sourceFile,
				"## Empty Section\n\n[[Empty Section]]\n\n## Next Section\n\nContent.",
			);
		});

		it("handles nested headings (H3 under H2)", async () => {
			const content = "## Parent\n\nContent.\n\n### Child\n\nChild content.\n\n## Next";
			vault.read = vi.fn().mockResolvedValue(content);

			const sourceFile = new TFile("notes/source.md");
			await writer.replaceSection(sourceFile, 0, 2, "Parent");

			expect(vault.modify).toHaveBeenCalledWith(sourceFile, "## Parent\n\n[[Parent]]\n\n## Next");
		});

		it("handles Japanese heading text", async () => {
			const content = "## 日本語の見出し\n\n日本語の本文です。\n\n## 次のセクション";
			vault.read = vi.fn().mockResolvedValue(content);

			const sourceFile = new TFile("notes/source.md");
			await writer.replaceSection(sourceFile, 0, 2, "日本語の見出し");

			expect(vault.modify).toHaveBeenCalledWith(
				sourceFile,
				"## 日本語の見出し\n\n[[日本語の見出し]]\n\n## 次のセクション",
			);
		});

		it("does nothing when heading line is out of range", async () => {
			const content = "## Section\n\nContent.";
			vault.read = vi.fn().mockResolvedValue(content);

			const sourceFile = new TFile("notes/source.md");
			await writer.replaceSection(sourceFile, 999, 2, "Section");

			expect(vault.modify).not.toHaveBeenCalled();
		});
	});

	describe("appendToConnectionsSection", () => {
		it("creates Connections section when it does not exist", async () => {
			const content = "# My Note\n\nSome content.";
			vault.read = vi.fn().mockResolvedValue(content);

			const file = new TFile("notes/target.md");
			await writer.appendToConnectionsSection(file, "Source Note", "Connections");

			expect(vault.modify).toHaveBeenCalledWith(
				file,
				"# My Note\n\nSome content.\n\n## Connections\n\n- [[Source Note]]",
			);
		});

		it("appends to existing Connections section", async () => {
			const content = "# My Note\n\nSome content.\n\n## Connections\n\n- [[Existing Link]]";
			vault.read = vi.fn().mockResolvedValue(content);

			const file = new TFile("notes/target.md");
			await writer.appendToConnectionsSection(file, "New Link", "Connections");

			expect(vault.modify).toHaveBeenCalledWith(
				file,
				"# My Note\n\nSome content.\n\n## Connections\n\n- [[Existing Link]]\n- [[New Link]]",
			);
		});

		it("does not add duplicate link", async () => {
			const content = "# My Note\n\n## Connections\n\n- [[Already Linked]]";
			vault.read = vi.fn().mockResolvedValue(content);

			const file = new TFile("notes/target.md");
			await writer.appendToConnectionsSection(file, "Already Linked", "Connections");

			expect(vault.modify).not.toHaveBeenCalled();
		});

		it("uses custom section name", async () => {
			const content = "# My Note\n\nContent.";
			vault.read = vi.fn().mockResolvedValue(content);

			const file = new TFile("notes/target.md");
			await writer.appendToConnectionsSection(file, "Source", "リンク");

			expect(vault.modify).toHaveBeenCalledWith(
				file,
				"# My Note\n\nContent.\n\n## リンク\n\n- [[Source]]",
			);
		});

		it("appends after the last item in the section, before next heading", async () => {
			const content =
				"# Note\n\n## Connections\n\n- [[A]]\n- [[B]]\n\n## Other Section\n\nContent.";
			vault.read = vi.fn().mockResolvedValue(content);

			const file = new TFile("notes/target.md");
			await writer.appendToConnectionsSection(file, "C", "Connections");

			expect(vault.modify).toHaveBeenCalledWith(
				file,
				"# Note\n\n## Connections\n\n- [[A]]\n- [[B]]\n- [[C]]\n\n## Other Section\n\nContent.",
			);
		});
	});
});
