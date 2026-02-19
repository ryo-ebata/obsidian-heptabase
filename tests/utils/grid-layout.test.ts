import { calculateGridPositions } from "@/utils/grid-layout";
import { describe, expect, it } from "vitest";

describe("calculateGridPositions", () => {
	const origin = { x: 100, y: 200 };

	it("returns single position for 1 item", () => {
		const positions = calculateGridPositions(origin, 1);
		expect(positions).toEqual([{ x: 100, y: 200 }]);
	});

	it("places 3 items in a single row (default 3 columns)", () => {
		const positions = calculateGridPositions(origin, 3);
		expect(positions).toHaveLength(3);
		expect(positions[0]).toEqual({ x: 100, y: 200 });
		expect(positions[1]).toEqual({ x: 540, y: 200 });
		expect(positions[2]).toEqual({ x: 980, y: 200 });
	});

	it("wraps to next row after 3 columns", () => {
		const positions = calculateGridPositions(origin, 4);
		expect(positions).toHaveLength(4);
		expect(positions[3]).toEqual({ x: 100, y: 540 });
	});

	it("handles 10 items (4 rows)", () => {
		const positions = calculateGridPositions(origin, 10);
		expect(positions).toHaveLength(10);
		expect(positions[9]).toEqual({ x: 100, y: 1220 });
	});

	it("respects custom columns option", () => {
		const positions = calculateGridPositions(origin, 4, { columns: 2 });
		expect(positions).toHaveLength(4);
		expect(positions[0]).toEqual({ x: 100, y: 200 });
		expect(positions[1]).toEqual({ x: 540, y: 200 });
		expect(positions[2]).toEqual({ x: 100, y: 540 });
		expect(positions[3]).toEqual({ x: 540, y: 540 });
	});

	it("respects custom gap option", () => {
		const positions = calculateGridPositions(origin, 2, { gap: 20 });
		expect(positions).toHaveLength(2);
		expect(positions[0]).toEqual({ x: 100, y: 200 });
		expect(positions[1]).toEqual({ x: 520, y: 200 });
	});

	it("respects custom nodeWidth and nodeHeight", () => {
		const positions = calculateGridPositions(origin, 2, {
			nodeWidth: 200,
			nodeHeight: 150,
		});
		expect(positions).toHaveLength(2);
		expect(positions[0]).toEqual({ x: 100, y: 200 });
		expect(positions[1]).toEqual({ x: 340, y: 200 });
	});

	it("returns empty array for 0 items", () => {
		const positions = calculateGridPositions(origin, 0);
		expect(positions).toEqual([]);
	});

	describe("layout modes", () => {
		it("horizontal layout places items in a single row", () => {
			const positions = calculateGridPositions(origin, 4, { layout: "horizontal" });
			expect(positions).toHaveLength(4);
			expect(positions[0]).toEqual({ x: 100, y: 200 });
			expect(positions[1]).toEqual({ x: 540, y: 200 });
			expect(positions[2]).toEqual({ x: 980, y: 200 });
			expect(positions[3]).toEqual({ x: 1420, y: 200 });
		});

		it("vertical layout places items in a single column", () => {
			const positions = calculateGridPositions(origin, 3, { layout: "vertical" });
			expect(positions).toHaveLength(3);
			expect(positions[0]).toEqual({ x: 100, y: 200 });
			expect(positions[1]).toEqual({ x: 100, y: 540 });
			expect(positions[2]).toEqual({ x: 100, y: 880 });
		});

		it("grid layout is the default", () => {
			const gridPositions = calculateGridPositions(origin, 4, { layout: "grid" });
			const defaultPositions = calculateGridPositions(origin, 4);
			expect(gridPositions).toEqual(defaultPositions);
		});

		it("horizontal layout respects custom gap and nodeWidth", () => {
			const positions = calculateGridPositions(origin, 2, {
				layout: "horizontal",
				gap: 20,
				nodeWidth: 200,
			});
			expect(positions[0]).toEqual({ x: 100, y: 200 });
			expect(positions[1]).toEqual({ x: 320, y: 200 });
		});

		it("vertical layout respects custom gap and nodeHeight", () => {
			const positions = calculateGridPositions(origin, 2, {
				layout: "vertical",
				gap: 20,
				nodeHeight: 150,
			});
			expect(positions[0]).toEqual({ x: 100, y: 200 });
			expect(positions[1]).toEqual({ x: 100, y: 370 });
		});
	});
});
