export class EditorView {
	state = {
		doc: { toString: () => "", sliceString: () => "" },
		selection: { main: { from: 0, to: 0 } },
	};
	contentDOM = document.createElement("div");
	dispatch() {}
	coordsAtPos() {
		return { left: 0, right: 0, top: 0, bottom: 0 };
	}
	static updateListener = { of: () => ({}) };
}

export const keymap = {
	of: () => ({}),
};

export const placeholder = () => ({});
