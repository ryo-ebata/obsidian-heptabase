import { KnowledgeContextService } from "@/services/knowledge-context";
import { App, TFile } from "obsidian";
import { type Mock, describe, expect, it } from "vitest";

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
});
