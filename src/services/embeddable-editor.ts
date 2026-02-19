import { EditorSelection, type Extension, Prec } from "@codemirror/state";
import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import type { App } from "obsidian";

// --- Internal Obsidian type declarations ---
// These use non-public APIs; may break on Obsidian updates.

interface InternalWidgetEditorView {
	editable: boolean;
	showEditor: () => void;
	editMode: unknown;
	unload: () => void;
}

interface ScrollableMarkdownEditorInstance {
	editor: {
		cm: EditorView;
	};
	editorEl: HTMLElement;
	set: (value: string) => void;
	onUpdate: (update: unknown, changed: boolean) => void;
	buildLocalExtensions: () => Extension[];
	destroy: () => void;
	unload: () => void;
	_loaded: boolean;
	owner: Record<string, unknown>;
	activeCM: { hasFocus: boolean };
	register: (uninstaller: () => void) => void;
	containerEl: HTMLElement;
}

type ScrollableMarkdownEditorConstructor = new (
	app: App,
	container: HTMLElement,
	options: Record<string, unknown>,
) => ScrollableMarkdownEditorInstance;

// --- around helper (replaces monkey-around) ---

function around<T extends Record<string, unknown>>(
	obj: T,
	patches: Record<
		string,
		(original: (...args: unknown[]) => unknown) => (...args: unknown[]) => unknown
	>,
): () => void {
	const originals: Record<string, unknown> = {};
	for (const key of Object.keys(patches)) {
		originals[key] = obj[key];
		const wrapper = patches[key]!(obj[key] as (...args: unknown[]) => unknown);
		(obj as Record<string, unknown>)[key] = wrapper;
	}
	return () => {
		for (const key of Object.keys(originals)) {
			(obj as Record<string, unknown>)[key] = originals[key];
		}
	};
}

// --- Prototype resolution ---

let EditorPrototype: ScrollableMarkdownEditorConstructor | null = null;

function resolveEditorPrototype(app: App): ScrollableMarkdownEditorConstructor {
	if (EditorPrototype) {
		return EditorPrototype;
	}

	// @ts-expect-error — accessing internal Obsidian API
	const embedFn = app.embedRegistry.embedByExtension.md;
	const widgetEditorView: InternalWidgetEditorView = embedFn(
		{ app, containerEl: document.createElement("div") },
		null,
		"",
	);

	widgetEditorView.editable = true;
	widgetEditorView.showEditor();

	const proto = Object.getPrototypeOf(Object.getPrototypeOf(widgetEditorView.editMode));

	widgetEditorView.unload();

	EditorPrototype = proto.constructor as ScrollableMarkdownEditorConstructor;
	return EditorPrototype;
}

// --- Public API ---

export interface EmbeddableEditorOptions {
	value?: string;
	placeholder?: string;
	cls?: string;
	cursorLocation?: { anchor: number; head: number };
	onBlur?: (editor: EmbeddableEditorHandle) => void;
	onChange?: (editor: EmbeddableEditorHandle) => void;
}

export interface EmbeddableEditorHandle {
	readonly value: string;
	set: (content: string) => void;
	readonly cm: EditorView;
	destroy: () => void;
}

export function createEmbeddableEditor(
	app: App,
	container: HTMLElement,
	options: EmbeddableEditorOptions = {},
): EmbeddableEditorHandle {
	const Ctor = resolveEditorPrototype(app);

	const instance = new Ctor(app, container, {
		app,
		onMarkdownScroll: () => {},
		getMode: () => "source",
	});

	// @ts-expect-error — internal owner setup
	instance.owner.editMode = instance;
	instance.owner.editor = instance.editor;

	if (options.value) {
		instance.set(options.value);
	}

	// Patch workspace.setActiveLeaf so it doesn't steal focus from our editor
	instance.register(
		around(app.workspace as unknown as Record<string, unknown>, {
			setActiveLeaf:
				(oldMethod: (...args: unknown[]) => unknown) =>
				(...args: unknown[]) => {
					if (!instance.activeCM.hasFocus) {
						oldMethod.call(app.workspace, ...args);
					}
				},
		}),
	);

	// Override buildLocalExtensions to add our extensions
	const originalBuild = instance.buildLocalExtensions.bind(instance);
	instance.buildLocalExtensions = (): Extension[] => {
		const extensions = originalBuild();

		if (options.placeholder) {
			extensions.push(cmPlaceholder(options.placeholder));
		}

		extensions.push(
			Prec.highest(
				keymap.of([
					{
						key: "Escape",
						run: () => {
							instance.editor.cm.contentDOM.blur();
							return true;
						},
						preventDefault: true,
					},
				]),
			),
		);

		return extensions;
	};

	// Set up blur handler
	if (options.onBlur) {
		const blurCallback = options.onBlur;
		instance.editor.cm.contentDOM.addEventListener("blur", () => {
			if (instance._loaded) {
				blurCallback(handle);
			}
		});
	}

	// Set up change handler
	if (options.onChange) {
		const changeCallback = options.onChange;
		const originalOnUpdate = instance.onUpdate.bind(instance);
		instance.onUpdate = (update: unknown, changed: boolean) => {
			originalOnUpdate(update, changed);
			if (changed) {
				changeCallback(handle);
			}
		};
	}

	// Focus management
	// @ts-expect-error — accessing internal keymap/scope APIs
	const appScope = app.keymap;
	instance.editor.cm.contentDOM.addEventListener("focusin", () => {
		if (appScope?.pushScope) {
			appScope.pushScope(instance);
		}
		// @ts-expect-error — internal workspace.activeEditor
		app.workspace.activeEditor = instance.owner;
	});

	if (options.cls) {
		instance.editorEl.classList.add(options.cls);
	}

	if (options.cursorLocation) {
		instance.editor.cm.dispatch({
			selection: EditorSelection.range(options.cursorLocation.anchor, options.cursorLocation.head),
		});
	}

	const handle: EmbeddableEditorHandle = {
		get value() {
			return instance.editor.cm.state.doc.toString();
		},
		set(content: string) {
			instance.set(content);
		},
		get cm() {
			return instance.editor.cm;
		},
		destroy() {
			if (instance._loaded) {
				instance.unload();
			}
			if (appScope?.popScope) {
				appScope.popScope(instance);
			}
			// @ts-expect-error — internal workspace.activeEditor
			app.workspace.activeEditor = null;
			container.innerHTML = "";
		},
	};

	return handle;
}
