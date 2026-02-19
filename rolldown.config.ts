import builtins from "builtin-modules";
import { defineConfig } from "rolldown";

const production = process.env.BUILD === "production";

export default defineConfig({
	input: "src/main.ts",
	external: [
		"obsidian",
		"electron",
		/^@codemirror\/.*/,
		/^@lezer\/.*/,
		...builtins,
	],
	platform: "node",
	resolve: {
		tsconfigFilename: "tsconfig.json",
	},
	output: {
		file: "main.js",
		format: "cjs",
		exports: "auto",
		sourcemap: production ? false : "inline",
		minify: production,
	},
});
