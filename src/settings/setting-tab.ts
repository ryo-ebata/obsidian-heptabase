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

		new Setting(containerEl)
			.setName("Recursive decomposition")
			.setDesc("Extract nested headings as a tree structure")
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.recursiveDecomposition)
					.onChange(this.updateSetting("recursiveDecomposition")),
			);

		new Setting(containerEl)
			.setName("Show preview before create")
			.setDesc("Show a preview dialog before creating files from headings")
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.showPreviewBeforeCreate)
					.onChange(this.updateSetting("showPreviewBeforeCreate")),
			);

		containerEl.createEl("h2", { text: "Quick Card Settings" });

		new Setting(containerEl)
			.setName("Quick card default title")
			.setDesc("Default title for quick cards created by double-click.")
			.addText((text) =>
				text
					.setPlaceholder("e.g. Untitled")
					.setValue(this.settings.quickCardDefaultTitle)
					.onChange(this.updateSetting("quickCardDefaultTitle")),
			);

		containerEl.createEl("h2", { text: "Edge Sync Settings" });

		new Setting(containerEl)
			.setName("Enable edge sync")
			.setDesc("Automatically create backlinks when drawing arrows between file nodes on Canvas.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.enableEdgeSync)
					.onChange(this.updateSetting("enableEdgeSync")),
			);

		new Setting(containerEl)
			.setName("Connections section name")
			.setDesc("Heading name for the auto-generated connections section.")
			.addText((text) =>
				text
					.setPlaceholder("e.g. Connections")
					.setValue(this.settings.connectionsSectionName)
					.onChange(this.updateSetting("connectionsSectionName")),
			);

		containerEl.createEl("h2", { text: "Multi-Drop Layout Settings" });

		new Setting(containerEl)
			.setName("Layout mode")
			.setDesc("Layout mode for multiple dropped nodes")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("grid", "Grid")
					.addOption("horizontal", "Horizontal")
					.addOption("vertical", "Vertical")
					.setValue(this.settings.multiDropLayout)
					.onChange(this.updateSetting("multiDropLayout") as (value: string) => void),
			);

		new Setting(containerEl)
			.setName("Grid columns")
			.setDesc("Number of columns in grid layout")
			.addSlider((slider) =>
				slider
					.setLimits(2, 6, 1)
					.setValue(this.settings.multiDropColumns)
					.setDynamicTooltip()
					.onChange(this.updateSetting("multiDropColumns")),
			);

		new Setting(containerEl)
			.setName("Drop gap")
			.setDesc("Gap between dropped nodes (px)")
			.addSlider((slider) =>
				slider
					.setLimits(10, 100, 10)
					.setValue(this.settings.multiDropGap)
					.setDynamicTooltip()
					.onChange(this.updateSetting("multiDropGap")),
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
