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
		setupFiles: ["./tests/setup.ts"],
		projects: [
			{
				extends: true,
				test: {
					name: "node",
					environment: "node",
					include: ["tests/**/*.test.{ts,tsx}"],
					exclude: [
						"tests/ui/**",
						"tests/handlers/canvas-event-handler.test.ts",
						"tests/settings/**",
						"tests/utils/drop-animation.test.ts",
					],
				},
			},
			{
				extends: true,
				test: {
					name: "jsdom",
					environment: "jsdom",
					include: [
						"tests/ui/**/*.test.{ts,tsx}",
						"tests/handlers/canvas-event-handler.test.ts",
						"tests/settings/**/*.test.ts",
						"tests/utils/drop-animation.test.ts",
					],
				},
			},
		],
	},
});
