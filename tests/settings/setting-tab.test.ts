import { SettingTab } from "@/settings/setting-tab";
import { DEFAULT_SETTINGS, type HeptabaseSettings } from "@/types/settings";
import { App, Plugin } from "obsidian";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";

describe("SettingTab", () => {
	let app: App;
	let plugin: Plugin;
	let settings: HeptabaseSettings;
	let onSettingsChange: Mock;
	let tab: SettingTab;

	beforeEach(() => {
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

	it("calls display without error", () => {
		tab.display();
	});
});
