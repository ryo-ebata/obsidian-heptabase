import { useTextSelection } from "@/ui/hooks/use-text-selection";
import { act, renderHook } from "@testing-library/react";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useTextSelection", () => {
	let addEventListenerSpy: Mock;
	let removeEventListenerSpy: Mock;

	beforeEach(() => {
		addEventListenerSpy = vi.spyOn(document, "addEventListener") as unknown as Mock;
		removeEventListenerSpy = vi.spyOn(document, "removeEventListener") as unknown as Mock;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns empty selectedText and null selectionRect initially", () => {
		const containerRef = { current: document.createElement("div") };

		const { result } = renderHook(() => useTextSelection(containerRef));

		expect(result.current.selectedText).toBe("");
		expect(result.current.selectionRect).toBeNull();
	});

	it("updates selectedText and selectionRect when text is selected inside container", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const textNode = document.createTextNode("Hello World");
		container.appendChild(textNode);
		const containerRef = { current: container };

		const mockRect = new DOMRect(10, 20, 100, 30);
		const mockRange = {
			getBoundingClientRect: vi.fn().mockReturnValue(mockRect),
			commonAncestorContainer: textNode,
		};
		const mockSelection = {
			toString: vi.fn().mockReturnValue("Hello"),
			rangeCount: 1,
			getRangeAt: vi.fn().mockReturnValue(mockRange),
		};
		vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);

		const { result } = renderHook(() => useTextSelection(containerRef));

		act(() => {
			document.dispatchEvent(new Event("selectionchange"));
		});

		expect(result.current.selectedText).toBe("Hello");
		expect(result.current.selectionRect).toBe(mockRect);

		document.body.removeChild(container);
	});

	it("ignores selection outside the container", () => {
		const container = document.createElement("div");
		const outsideElement = document.createElement("div");
		document.body.appendChild(container);
		document.body.appendChild(outsideElement);
		const outsideText = document.createTextNode("Outside text");
		outsideElement.appendChild(outsideText);
		const containerRef = { current: container };

		const mockRange = {
			getBoundingClientRect: vi.fn().mockReturnValue(new DOMRect()),
			commonAncestorContainer: outsideText,
		};
		const mockSelection = {
			toString: vi.fn().mockReturnValue("Outside"),
			rangeCount: 1,
			getRangeAt: vi.fn().mockReturnValue(mockRange),
		};
		vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);

		const { result } = renderHook(() => useTextSelection(containerRef));

		act(() => {
			document.dispatchEvent(new Event("selectionchange"));
		});

		expect(result.current.selectedText).toBe("");
		expect(result.current.selectionRect).toBeNull();

		document.body.removeChild(container);
		document.body.removeChild(outsideElement);
	});

	it("removes event listener on cleanup", () => {
		const containerRef = { current: document.createElement("div") };

		const { unmount } = renderHook(() => useTextSelection(containerRef));

		const selectionChangeCalls = addEventListenerSpy.mock.calls.filter(
			(call: [string, ...unknown[]]) => call[0] === "selectionchange",
		);
		expect(selectionChangeCalls.length).toBeGreaterThan(0);

		unmount();

		const removeCalls = removeEventListenerSpy.mock.calls.filter(
			(call: [string, ...unknown[]]) => call[0] === "selectionchange",
		);
		expect(removeCalls.length).toBeGreaterThan(0);
	});
});
