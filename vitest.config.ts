import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			obsidian: path.resolve(__dirname, "./tests/mocks/obsidian.ts"),
		},
	},
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./tests/setup.ts"],
		include: ["tests/**/*.test.{ts,tsx}"],
		environmentMatchGlobs: [["tests/ui/**", "jsdom"]],
	},
});
