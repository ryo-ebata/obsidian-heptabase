import { DEFAULT_SETTINGS } from "@/types/settings";
import { HeadingExplorerView, VIEW_TYPE_HEADING_EXPLORER } from "@/views/heading-explorer-view";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-dom/client", () => ({
	createRoot: vi.fn().mockReturnValue({
		render: vi.fn(),
		unmount: vi.fn(),
	}),
}));

vi.mock("react", () => ({
	default: {
		createElement: vi.fn(),
	},
	createElement: vi.fn(),
	createContext: vi.fn().mockReturnValue({}),
}));

describe("HeadingExplorerView", () => {
	function createMockLeaf() {
		return {} as never;
	}

	function createMockApp() {
		return { vault: {}, workspace: {}, metadataCache: {} } as never;
	}

	it("has correct VIEW_TYPE constant", () => {
		expect(VIEW_TYPE_HEADING_EXPLORER).toBe("heading-explorer-view");
	});

	it("getViewType returns the VIEW_TYPE constant", () => {
		const view = new HeadingExplorerView(createMockLeaf(), createMockApp(), DEFAULT_SETTINGS);
		expect(view.getViewType()).toBe(VIEW_TYPE_HEADING_EXPLORER);
	});

	it("getDisplayText returns Heading Explorer", () => {
		const view = new HeadingExplorerView(createMockLeaf(), createMockApp(), DEFAULT_SETTINGS);
		expect(view.getDisplayText()).toBe("Heading Explorer");
	});

	it("getIcon returns layout-grid", () => {
		const view = new HeadingExplorerView(createMockLeaf(), createMockApp(), DEFAULT_SETTINGS);
		expect(view.getIcon()).toBe("layout-grid");
	});
});
