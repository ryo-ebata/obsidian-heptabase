import type { NoteDragData } from "@/types/plugin";
import { describe, expect, it } from "vitest";

describe("DragData types", () => {
	describe("NoteDragData", () => {
		it("has correct drag data type", () => {
			const dragData: NoteDragData = {
				type: "note-drag",
				filePath: "notes/test.md",
			};

			expect(dragData.type).toBe("note-drag");
			expect(dragData.filePath).toBe("notes/test.md");
		});

		it("can parse NoteDragData from DataTransfer", () => {
			const dragData: NoteDragData = {
				type: "note-drag",
				filePath: "notes/sample.md",
			};
			const parsed: NoteDragData = JSON.parse(JSON.stringify(dragData));
			expect(parsed.type).toBe("note-drag");
			expect(parsed.filePath).toBe("notes/sample.md");
		});

		it("can distinguish NoteDragData from HeadingDragData by type", () => {
			const noteDrag = JSON.parse(JSON.stringify({ type: "note-drag", filePath: "test.md" }));
			const headingDrag = JSON.parse(
				JSON.stringify({ type: "heading-explorer-drag", filePath: "test.md" }),
			);
			expect(noteDrag.type).not.toBe(headingDrag.type);
		});
	});
});
