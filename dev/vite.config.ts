import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	root: resolve(import.meta.dirname, "."),
	plugins: [react()],
	resolve: {
		alias: {
			"@": resolve(import.meta.dirname, "../src"),
			obsidian: resolve(import.meta.dirname, "./mock-app.ts"),
		},
	},
});
