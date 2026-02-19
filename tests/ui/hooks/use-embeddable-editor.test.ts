import type { EmbeddableEditorHandle, EmbeddableEditorOptions } from "@/services/embeddable-editor";
import { useEmbeddableEditor } from "@/ui/hooks/use-embeddable-editor";
import { renderHook } from "@testing-library/react";
import { App } from "obsidian";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "../../helpers/create-wrapper";

vi.mock("@/services/embeddable-editor", () => ({
	createEmbeddableEditor: vi.fn(),
}));

import { createEmbeddableEditor } from "@/services/embeddable-editor";

function createMockEditor(): EmbeddableEditorHandle {
	return {
		value: "",
		set: vi.fn(),
		cm: {} as EmbeddableEditorHandle["cm"],
		destroy: vi.fn(),
	};
}

describe("useEmbeddableEditor", () => {
	let app: App;
	let mockEditor: EmbeddableEditorHandle;

	beforeEach(() => {
		app = new App();
		mockEditor = createMockEditor();
		(createEmbeddableEditor as Mock).mockReturnValue(mockEditor);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("creates editor when container ref is set and content is provided", () => {
		const container = document.createElement("div");

		const { result } = renderHook(
			() =>
				useEmbeddableEditor({
					content: "# Hello",
					onSave: vi.fn(),
				}),
			{ wrapper: createWrapper(app) },
		);

		// Simulate ref assignment
		(result.current.containerRef as { current: HTMLDivElement | null }).current = container;

		// Re-render to trigger effect
		const { result: result2 } = renderHook(
			() =>
				useEmbeddableEditor({
					content: "# Hello",
					onSave: vi.fn(),
				}),
			{ wrapper: createWrapper(app) },
		);

		expect(result2.current.containerRef).toBeDefined();
	});

	it("calls editor.set when content changes", () => {
		const container = document.createElement("div");
		(createEmbeddableEditor as Mock).mockImplementation((_app: App, _container: HTMLElement) => {
			return mockEditor;
		});

		const { rerender } = renderHook(
			({ content }) =>
				useEmbeddableEditor({
					content,
					onSave: vi.fn(),
					_containerOverride: container,
				}),
			{
				wrapper: createWrapper(app),
				initialProps: { content: "# Hello" },
			},
		);

		rerender({ content: "# Updated" });

		expect(mockEditor.set).toHaveBeenCalledWith("# Updated");
	});

	it("calls editor.destroy on unmount", () => {
		const container = document.createElement("div");

		const { unmount } = renderHook(
			() =>
				useEmbeddableEditor({
					content: "# Hello",
					onSave: vi.fn(),
					_containerOverride: container,
				}),
			{ wrapper: createWrapper(app) },
		);

		unmount();

		expect(mockEditor.destroy).toHaveBeenCalled();
	});

	it("passes onBlur that calls onSave with editor value", () => {
		const container = document.createElement("div");
		const onSave = vi.fn();
		let capturedOnBlur: ((editor: EmbeddableEditorHandle) => void) | undefined;

		(createEmbeddableEditor as Mock).mockImplementation(
			(
				_app: App,
				_container: HTMLElement,
				options: { onBlur?: (editor: EmbeddableEditorHandle) => void },
			) => {
				capturedOnBlur = options.onBlur;
				return mockEditor;
			},
		);

		renderHook(
			() =>
				useEmbeddableEditor({
					content: "# Hello",
					onSave,
					_containerOverride: container,
				}),
			{ wrapper: createWrapper(app) },
		);

		expect(capturedOnBlur).toBeDefined();
		const editorWithValue = { ...mockEditor, value: "# Saved content" };
		capturedOnBlur!(editorWithValue);

		expect(onSave).toHaveBeenCalledWith("# Saved content");
	});

	it("returns editorView as null when no container", () => {
		const { result } = renderHook(
			() =>
				useEmbeddableEditor({
					content: "# Hello",
					onSave: vi.fn(),
				}),
			{ wrapper: createWrapper(app) },
		);

		expect(result.current.editorView).toBeNull();
	});

	describe("onChange auto-save", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("passes onChange callback to createEmbeddableEditor", () => {
			const container = document.createElement("div");

			renderHook(
				() =>
					useEmbeddableEditor({
						content: "# Hello",
						onSave: vi.fn(),
						_containerOverride: container,
					}),
				{ wrapper: createWrapper(app) },
			);

			const options = (createEmbeddableEditor as Mock).mock.calls[0][2] as EmbeddableEditorOptions;
			expect(options.onChange).toBeDefined();
			expect(typeof options.onChange).toBe("function");
		});

		it("calls onSave after debounce delay when onChange fires", () => {
			const container = document.createElement("div");
			const onSave = vi.fn();
			let capturedOnChange: ((editor: EmbeddableEditorHandle) => void) | undefined;

			(createEmbeddableEditor as Mock).mockImplementation(
				(_app: App, _container: HTMLElement, options: EmbeddableEditorOptions) => {
					capturedOnChange = options.onChange;
					return mockEditor;
				},
			);

			renderHook(
				() =>
					useEmbeddableEditor({
						content: "# Hello",
						onSave,
						_containerOverride: container,
					}),
				{ wrapper: createWrapper(app) },
			);

			const editorWithValue = { ...mockEditor, value: "# Changed" };
			capturedOnChange!(editorWithValue);

			expect(onSave).not.toHaveBeenCalled();

			vi.advanceTimersByTime(300);

			expect(onSave).toHaveBeenCalledWith("# Changed");
		});

		it("resets debounce timer when onChange fires again before delay", () => {
			const container = document.createElement("div");
			const onSave = vi.fn();
			let capturedOnChange: ((editor: EmbeddableEditorHandle) => void) | undefined;

			(createEmbeddableEditor as Mock).mockImplementation(
				(_app: App, _container: HTMLElement, options: EmbeddableEditorOptions) => {
					capturedOnChange = options.onChange;
					return mockEditor;
				},
			);

			renderHook(
				() =>
					useEmbeddableEditor({
						content: "# Hello",
						onSave,
						_containerOverride: container,
					}),
				{ wrapper: createWrapper(app) },
			);

			capturedOnChange!({ ...mockEditor, value: "# First" });
			vi.advanceTimersByTime(200);

			capturedOnChange!({ ...mockEditor, value: "# Second" });
			vi.advanceTimersByTime(200);

			expect(onSave).not.toHaveBeenCalled();

			vi.advanceTimersByTime(100);

			expect(onSave).toHaveBeenCalledTimes(1);
			expect(onSave).toHaveBeenCalledWith("# Second");
		});

		it("clears debounce timer on unmount", () => {
			const container = document.createElement("div");
			const onSave = vi.fn();
			let capturedOnChange: ((editor: EmbeddableEditorHandle) => void) | undefined;

			(createEmbeddableEditor as Mock).mockImplementation(
				(_app: App, _container: HTMLElement, options: EmbeddableEditorOptions) => {
					capturedOnChange = options.onChange;
					return mockEditor;
				},
			);

			const { unmount } = renderHook(
				() =>
					useEmbeddableEditor({
						content: "# Hello",
						onSave,
						_containerOverride: container,
					}),
				{ wrapper: createWrapper(app) },
			);

			capturedOnChange!({ ...mockEditor, value: "# Pending" });

			unmount();
			vi.advanceTimersByTime(300);

			expect(onSave).not.toHaveBeenCalled();
		});
	});
});
