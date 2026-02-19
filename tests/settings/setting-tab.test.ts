import { SettingTab } from "@/settings/setting-tab";
import { DEFAULT_SETTINGS, type HeptabaseSettings } from "@/types/settings";
import { App, Plugin, Setting } from "obsidian";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";

const settingInstances: InstanceType<typeof Setting>[] = [];

vi.mock("obsidian", async () => {
	const actual = await vi.importActual<typeof import("obsidian")>("obsidian");
	class TrackedSetting extends actual.Setting {
		constructor(containerEl: HTMLElement) {
			super(containerEl);
			settingInstances.push(this);
		}
	}
	return {
		...actual,
		Setting: TrackedSetting,
	};
});

describe("SettingTab", () => {
	let app: App;
	let plugin: Plugin;
	let settings: HeptabaseSettings;
	let onSettingsChange: Mock;
	let tab: SettingTab;

	beforeEach(() => {
		settingInstances.length = 0;
		vi.clearAllMocks();
		app = new App();
		plugin = { app } as unknown as Plugin;
		settings = { ...DEFAULT_SETTINGS };
		onSettingsChange = vi.fn();
		tab = new SettingTab(app, plugin, settings, onSettingsChange);
	});

	it("is an instance of SettingTab", () => {
		expect(tab).toBeInstanceOf(SettingTab);
	});

	it("stores the app reference", () => {
		expect(tab.app).toBe(app);
	});

	describe("display", () => {
		it("calls containerEl.empty()", () => {
			tab.display();
			expect(tab.containerEl.empty).toHaveBeenCalled();
		});

		it("creates h2 headers via createEl", () => {
			tab.display();
			const createElMock = vi.mocked(tab.containerEl.createEl);
			const h2Calls = createElMock.mock.calls.filter(
				(call) => call[0] === "h2",
			);
			expect(h2Calls.length).toBeGreaterThanOrEqual(1);
			expect(h2Calls[0]).toEqual(["h2", { text: "Heptabase Settings" }]);
		});

		it("creates all section headers", () => {
			tab.display();
			const createElMock = vi.mocked(tab.containerEl.createEl);
			const h2Texts = createElMock.mock.calls
				.filter((call) => call[0] === "h2")
				.map((call) => (call[1] as Record<string, string> | undefined)?.text);
			expect(h2Texts).toContain("Heptabase Settings");
			expect(h2Texts).toContain("Quick Card Settings");
			expect(h2Texts).toContain("Edge Sync Settings");
			expect(h2Texts).toContain("Multi-Drop Layout Settings");
			expect(h2Texts).toContain("Edge Settings");
		});

		it("creates 14 Setting instances", () => {
			tab.display();
			expect(settingInstances).toHaveLength(14);
		});

		it("calls setName and setDesc on all Settings", () => {
			tab.display();
			for (const instance of settingInstances) {
				expect(instance.setName).toHaveBeenCalled();
				expect(instance.setDesc).toHaveBeenCalled();
			}
		});
	});

	describe("updateSetting via onChange callbacks", () => {
		function getOnChangeCallback(instance: InstanceType<typeof Setting>): (value: never) => void {
			const onChangeMock = vi.mocked(instance.onChange);
			return onChangeMock.mock.calls[0][0] as (value: never) => void;
		}

		it("updates extractedFilesFolder (text - Setting #0)", () => {
			tab.display();
			const instance = settingInstances[0];
			expect(instance.addText).toHaveBeenCalled();
			expect(instance.setPlaceholder).toHaveBeenCalledWith("e.g. extracted-notes");
			expect(instance.setValue).toHaveBeenCalledWith(DEFAULT_SETTINGS.extractedFilesFolder);

			const onChange = getOnChangeCallback(instance);
			onChange("my-folder" as never);
			expect(settings.extractedFilesFolder).toBe("my-folder");
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates defaultNodeWidth (slider - Setting #1)", () => {
			tab.display();
			const instance = settingInstances[1];
			expect(instance.addSlider).toHaveBeenCalled();
			expect(instance.setLimits).toHaveBeenCalledWith(200, 800, 50);
			expect(instance.setValue).toHaveBeenCalledWith(DEFAULT_SETTINGS.defaultNodeWidth);
			expect(instance.setDynamicTooltip).toHaveBeenCalled();

			const onChange = getOnChangeCallback(instance);
			onChange(600 as never);
			expect(settings.defaultNodeWidth).toBe(600);
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates defaultNodeHeight (slider - Setting #2)", () => {
			tab.display();
			const instance = settingInstances[2];
			expect(instance.addSlider).toHaveBeenCalled();
			expect(instance.setLimits).toHaveBeenCalledWith(100, 600, 50);
			expect(instance.setValue).toHaveBeenCalledWith(DEFAULT_SETTINGS.defaultNodeHeight);

			const onChange = getOnChangeCallback(instance);
			onChange(500 as never);
			expect(settings.defaultNodeHeight).toBe(500);
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates fileNamePrefix (text - Setting #3)", () => {
			tab.display();
			const instance = settingInstances[3];
			expect(instance.addText).toHaveBeenCalled();
			expect(instance.setPlaceholder).toHaveBeenCalledWith("e.g. extracted-");

			const onChange = getOnChangeCallback(instance);
			onChange("prefix-" as never);
			expect(settings.fileNamePrefix).toBe("prefix-");
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates leaveBacklink (toggle - Setting #4)", () => {
			tab.display();
			const instance = settingInstances[4];
			expect(instance.addToggle).toHaveBeenCalled();
			expect(instance.setValue).toHaveBeenCalledWith(DEFAULT_SETTINGS.leaveBacklink);

			const onChange = getOnChangeCallback(instance);
			onChange(true as never);
			expect(settings.leaveBacklink).toBe(true);
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates recursiveDecomposition (toggle - Setting #5)", () => {
			tab.display();
			const instance = settingInstances[5];
			expect(instance.addToggle).toHaveBeenCalled();

			const onChange = getOnChangeCallback(instance);
			onChange(true as never);
			expect(settings.recursiveDecomposition).toBe(true);
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates showPreviewBeforeCreate (toggle - Setting #6)", () => {
			tab.display();
			const instance = settingInstances[6];
			expect(instance.addToggle).toHaveBeenCalled();

			const onChange = getOnChangeCallback(instance);
			onChange(true as never);
			expect(settings.showPreviewBeforeCreate).toBe(true);
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates quickCardDefaultTitle (text - Setting #7)", () => {
			tab.display();
			const instance = settingInstances[7];
			expect(instance.addText).toHaveBeenCalled();
			expect(instance.setPlaceholder).toHaveBeenCalledWith("e.g. Untitled");

			const onChange = getOnChangeCallback(instance);
			onChange("New Card" as never);
			expect(settings.quickCardDefaultTitle).toBe("New Card");
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates enableEdgeSync (toggle - Setting #8)", () => {
			tab.display();
			const instance = settingInstances[8];
			expect(instance.addToggle).toHaveBeenCalled();

			const onChange = getOnChangeCallback(instance);
			onChange(false as never);
			expect(settings.enableEdgeSync).toBe(false);
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates multiDropLayout (dropdown - Setting #9)", () => {
			tab.display();
			const instance = settingInstances[9];
			expect(instance.addDropdown).toHaveBeenCalled();
			expect(instance.addOption).toHaveBeenCalledWith("grid", "Grid");
			expect(instance.addOption).toHaveBeenCalledWith("horizontal", "Horizontal");
			expect(instance.addOption).toHaveBeenCalledWith("vertical", "Vertical");
			expect(instance.setValue).toHaveBeenCalledWith(DEFAULT_SETTINGS.multiDropLayout);

			const onChange = getOnChangeCallback(instance);
			onChange("horizontal" as never);
			expect(settings.multiDropLayout).toBe("horizontal");
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates multiDropColumns (slider - Setting #10)", () => {
			tab.display();
			const instance = settingInstances[10];
			expect(instance.addSlider).toHaveBeenCalled();
			expect(instance.setLimits).toHaveBeenCalledWith(2, 6, 1);

			const onChange = getOnChangeCallback(instance);
			onChange(4 as never);
			expect(settings.multiDropColumns).toBe(4);
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates multiDropGap (slider - Setting #11)", () => {
			tab.display();
			const instance = settingInstances[11];
			expect(instance.addSlider).toHaveBeenCalled();
			expect(instance.setLimits).toHaveBeenCalledWith(10, 100, 10);

			const onChange = getOnChangeCallback(instance);
			onChange(60 as never);
			expect(settings.multiDropGap).toBe(60);
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates defaultEdgeColor (text - Setting #12)", () => {
			tab.display();
			const instance = settingInstances[12];
			expect(instance.addText).toHaveBeenCalled();
			expect(instance.setPlaceholder).toHaveBeenCalledWith("e.g. 1");

			const onChange = getOnChangeCallback(instance);
			onChange("3" as never);
			expect(settings.defaultEdgeColor).toBe("3");
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});

		it("updates defaultEdgeLabel (text - Setting #13)", () => {
			tab.display();
			const instance = settingInstances[13];
			expect(instance.addText).toHaveBeenCalled();
			expect(instance.setPlaceholder).toHaveBeenCalledWith("e.g. relates to");

			const onChange = getOnChangeCallback(instance);
			onChange("links to" as never);
			expect(settings.defaultEdgeLabel).toBe("links to");
			expect(onSettingsChange).toHaveBeenCalledWith(settings);
		});
	});

	describe("display called multiple times", () => {
		it("calls empty() each time to clear previous content", () => {
			tab.display();
			tab.display();
			expect(tab.containerEl.empty).toHaveBeenCalledTimes(2);
		});
	});
});
