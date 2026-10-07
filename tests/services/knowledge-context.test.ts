import { KnowledgeContextService } from "@/services/knowledge-context";
import { App, TFile } from "obsidian";
import { type Mock, describe, expect, it, vi } from "vitest";

describe("KnowledgeContextService", () => {
	it("finds backlinks and every canvas placement", async () => {
		const app = new App();
		const target = new TFile("notes/target.md");
		const source = new TFile("notes/source.md");
		const canvas = new TFile("maps/topic.canvas");
		app.metadataCache.resolvedLinks = {
			[source.path]: { [target.path]: 2 },
		};
		(app.vault.getAbstractFileByPath as Mock).mockImplementation((path: string) =>
			path === source.path ? source : null,
		);
		(app.vault.getFiles as Mock).mockReturnValue([target, source, canvas]);
		(app.vault.cachedRead as Mock).mockResolvedValue(
			JSON.stringify({
				nodes: [
					{ id: "target-node", type: "file", file: target.path },
					{ id: "other-node", type: "file", file: source.path },
				],
				edges: [],
			}),
		);

		const context = await new KnowledgeContextService(app).getForFile(target);

		expect(context.backlinks).toEqual([{ path: source.path, label: "source" }]);
		expect(context.canvases).toEqual([
			{ path: canvas.path, label: "topic", nodeId: "target-node" },
		]);
	});

	it("ignores malformed canvas files", async () => {
		const app = new App();
		const target = new TFile("target.md");
		const canvas = new TFile("broken.canvas");
		(app.vault.getFiles as Mock).mockReturnValue([canvas]);
		(app.vault.cachedRead as Mock).mockResolvedValue("not json");

		await expect(new KnowledgeContextService(app).getForFile(target)).resolves.toEqual({
			backlinks: [],
			canvases: [],
		});
	});

	it("reuses parsed Canvas data until the file mtime changes", async () => {
		const app = new App();
		const target = new TFile("target.md");
		const canvas = new TFile("board.canvas");
		canvas.stat.mtime = 1;
		(app.vault.getFiles as Mock).mockReturnValue([canvas]);
		(app.vault.cachedRead as Mock).mockResolvedValue(
			JSON.stringify({ nodes: [{ id: "node", type: "file", file: target.path }], edges: [] }),
		);
		const service = new KnowledgeContextService(app);

		await service.getForFile(target);
		await service.getForFile(target);
		expect(app.vault.cachedRead).toHaveBeenCalledTimes(1);

		canvas.stat.mtime = 2;
		await service.getForFile(target);
		expect(app.vault.cachedRead).toHaveBeenCalledTimes(2);
	});

	it("does not let an older Canvas read replace a newer cache entry", async () => {
		const app = new App();
		const target = new TFile("target.md");
		const canvas = new TFile("board.canvas");
		canvas.stat.mtime = 1;
		(app.vault.getFiles as Mock).mockReturnValue([canvas]);
		let resolveFirst!: (value: string) => void;
		const firstRead = new Promise<string>((resolve) => {
			resolveFirst = resolve;
		});
		vi.mocked(app.vault.cachedRead)
			.mockReturnValueOnce(firstRead)
			.mockResolvedValueOnce(
				JSON.stringify({ nodes: [{ id: "new", type: "file", file: target.path }], edges: [] }),
			);
		const service = new KnowledgeContextService(app);

		const staleRequest = service.getForFile(target);
		canvas.stat.mtime = 2;
		await expect(service.getForFile(target)).resolves.toMatchObject({
			canvases: [{ nodeId: "new" }],
		});
		resolveFirst(
			JSON.stringify({ nodes: [{ id: "old", type: "file", file: target.path }], edges: [] }),
		);
		await staleRequest;
		await service.getForFile(target);

		expect(app.vault.cachedRead).toHaveBeenCalledTimes(2);
	});
});
