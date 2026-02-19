import {
	existsSync,
	lstatSync,
	readlinkSync,
	rmSync,
	symlinkSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const DEFAULT_VAULT_PATH = "/Users/ebataryou/Local";
const PLUGIN_NAME = "obsidian-heptabase";

const vaultPath = process.argv[2] || DEFAULT_VAULT_PATH;
const projectRoot = resolve(import.meta.dirname, "..");
const pluginsDir = join(vaultPath, ".obsidian", "plugins");
const targetPath = join(pluginsDir, PLUGIN_NAME);

if (!existsSync(pluginsDir)) {
	console.error(`Error: Plugins directory not found: ${pluginsDir}`);
	console.error("Make sure the vault path is correct and Obsidian has been opened at least once.");
	process.exit(1);
}

function createSymlink() {
	symlinkSync(projectRoot, targetPath);
	console.log(`Symlink created: ${targetPath} -> ${projectRoot}`);
}

const stat = lstatSync(targetPath, { throwIfNoEntry: false });

if (stat) {
	if (stat.isSymbolicLink()) {
		const currentTarget = readlinkSync(targetPath);
		if (currentTarget === projectRoot) {
			console.log(`Symlink already exists: ${targetPath} -> ${projectRoot}`);
		} else {
			console.log(`Updating symlink: ${currentTarget} -> ${projectRoot}`);
			unlinkSync(targetPath);
			createSymlink();
		}
	} else {
		if (stat.isDirectory()) {
			console.log(`Removing existing directory: ${targetPath}`);
			rmSync(targetPath, { recursive: true });
		} else {
			unlinkSync(targetPath);
		}
		createSymlink();
	}
} else {
	createSymlink();
}

const hotreloadPath = join(projectRoot, ".hotreload");
if (!existsSync(hotreloadPath)) {
	writeFileSync(hotreloadPath, "");
	console.log("Created .hotreload marker file");
} else {
	console.log(".hotreload marker file already exists");
}

console.log("\nSetup complete! Next steps:");
console.log("1. Install & enable 'Hot Reload' plugin in Obsidian (by pjeby)");
console.log("2. Run 'pnpm dev' to start watch build");
console.log("3. Code changes will auto-reload in Obsidian");
