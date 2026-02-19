import type { HeadingDragData } from "@/types/plugin";
import { describe, expect, it } from "vitest";

describe("HeptabasePlugin", () => {
	describe("HeadingDragData", () => {
		it("has correct drag data type", () => {
			const dragData: HeadingDragData = {
				type: "heading-explorer-drag",
				filePath: "notes/test.md",
				headingText: "Test Heading",
				headingLevel: 2,
				headingLine: 5,
			};

			expect(dragData.type).toBe("heading-explorer-drag");
			expect(dragData.headingLevel).toBe(2);
		});

		it("can parse HeadingDragData from DataTransfer", () => {
			const dragData: HeadingDragData = {
				type: "heading-explorer-drag",
				filePath: "notes/sample.md",
				headingText: "Section 1",
				headingLevel: 2,
				headingLine: 10,
			};
			const parsed: HeadingDragData = JSON.parse(JSON.stringify(dragData));
			expect(parsed.type).toBe("heading-explorer-drag");
			expect(parsed.filePath).toBe("notes/sample.md");
		});

		it("can identify invalid drag data", () => {
			const parsed = JSON.parse(JSON.stringify({ type: "other-drag" }));
			expect(parsed.type).not.toBe("heading-explorer-drag");
		});
	});
});
