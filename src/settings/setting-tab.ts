import type { HeptabaseSettings } from "@/types/settings";
import type { App, Plugin } from "obsidian";
import { PluginSettingTab, Setting } from "obsidian";

export class SettingTab extends PluginSettingTab {
	private settings: HeptabaseSettings;
	private onSettingsChange: (settings: HeptabaseSettings) => void;

	constructor(
		app: App,
		plugin: Plugin,
		settings: HeptabaseSettings,
		onSettingsChange: (settings: HeptabaseSettings) => void,
	) {
		super(app, plugin);
		this.settings = settings;
		this.onSettingsChange = onSettingsChange;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Heptabase Settings" });

		new Setting(containerEl)
			.setName("Extracted files folder")
			.setDesc("Folder to save extracted heading files. Leave empty to use source file folder.")
			.addText((text) =>
				text
					.setPlaceholder("e.g. extracted-notes")
					.setValue(this.settings.extractedFilesFolder)
					.onChange(this.updateSetting("extractedFilesFolder")),
			);

		new Setting(containerEl)
			.setName("Default node width")
			.setDesc("Default width for new Canvas nodes")
			.addSlider((slider) =>
				slider
					.setLimits(200, 800, 50)
					.setValue(this.settings.defaultNodeWidth)
					.setDynamicTooltip()
					.onChange(this.updateSetting("defaultNodeWidth")),
			);

		new Setting(containerEl)
			.setName("Default node height")
			.setDesc("Default height for new Canvas nodes")
			.addSlider((slider) =>
				slider
					.setLimits(100, 600, 50)
					.setValue(this.settings.defaultNodeHeight)
					.setDynamicTooltip()
					.onChange(this.updateSetting("defaultNodeHeight")),
			);

		new Setting(containerEl)
			.setName("File name prefix")
			.setDesc("Prefix for extracted file names")
			.addText((text) =>
				text
					.setPlaceholder("e.g. extracted-")
					.setValue(this.settings.fileNamePrefix)
					.onChange(this.updateSetting("fileNamePrefix")),
			);

		new Setting(containerEl)
			.setName("Leave backlink")
			.setDesc("Leave a backlink in the original note after extracting")
			.addToggle((toggle) =>
				toggle.setValue(this.settings.leaveBacklink).onChange(this.updateSetting("leaveBacklink")),
			);

		containerEl.createEl("h2", { text: "Edge Settings" });

		new Setting(containerEl)
			.setName("Default edge color")
			.setDesc("Default color for new edges (1-6 or hex). Leave empty for default.")
			.addText((text) =>
				text
					.setPlaceholder("e.g. 1")
					.setValue(this.settings.defaultEdgeColor)
					.onChange(this.updateSetting("defaultEdgeColor")),
			);

		new Setting(containerEl)
			.setName("Default edge label")
			.setDesc("Default label for new edges. Leave empty for no label.")
			.addText((text) =>
				text
					.setPlaceholder("e.g. relates to")
					.setValue(this.settings.defaultEdgeLabel)
					.onChange(this.updateSetting("defaultEdgeLabel")),
			);
	}

	private updateSetting<K extends keyof HeptabaseSettings>(
		key: K,
	): (value: HeptabaseSettings[K]) => void {
		return (value: HeptabaseSettings[K]) => {
			this.settings[key] = value;
			this.onSettingsChange(this.settings);
		};
	}
}
