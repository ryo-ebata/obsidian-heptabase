import { expect, test, type Page } from "@playwright/test";

const THEMES = {
	dark: {
		"--text-muted": "#999",
		"--text-normal": "#dcddde",
		"--background-primary": "#1e1e1e",
		"--background-secondary": "#262626",
		"--background-modifier-border": "#444",
		"--background-modifier-hover": "rgba(255, 255, 255, 0.08)",
	},
	light: {
		"--text-muted": "#64676d",
		"--text-normal": "#202124",
		"--background-primary": "#ffffff",
		"--background-secondary": "#f4f5f7",
		"--background-modifier-border": "#d9dce1",
		"--background-modifier-hover": "rgba(30, 35, 45, 0.07)",
	},
} as const;

async function prepareSidebar(
	page: Page,
	width: number,
	theme: keyof typeof THEMES,
): Promise<void> {
	await page.setViewportSize({ width: width + 48, height: 900 });
	await page.goto("/");
	await page.locator("#root").evaluate(
		(element, options) => {
			const root = element as HTMLElement;
			root.style.width = `${options.width}px`;
			for (const [property, value] of Object.entries(options.tokens)) {
				document.documentElement.style.setProperty(property, value);
			}
			document.body.style.background = options.tokens["--background-primary"];
		},
		{ width, tokens: THEMES[theme] },
	);
	await expect(page.getByRole("tab", { name: "Card Library" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	await expect(page.locator(".heptabase-note-card").first()).toBeVisible();
}

for (const theme of ["dark", "light"] as const) {
	for (const width of [280, 380] as const) {
		test(`card library remains composed at ${width}px in ${theme} theme`, async ({ page }) => {
			await prepareSidebar(page, width, theme);
			await expect(page.locator("#root")).toHaveScreenshot(`card-library-${theme}-${width}.png`);
		});
	}
}

test("filter popover remains contained at 280px", async ({ page }) => {
	await prepareSidebar(page, 280, "dark");
	await page.locator(".heptabase-library-filters__menu > summary").click();
	const popover = page.locator(".heptabase-library-filters__popover");
	await expect(popover).toBeVisible();
	const [rootBox, popoverBox] = await Promise.all([
		page.locator("#root").boundingBox(),
		popover.boundingBox(),
	]);
	expect(rootBox).not.toBeNull();
	expect(popoverBox).not.toBeNull();
	expect(popoverBox!.x).toBeGreaterThanOrEqual(rootBox!.x);
	expect(popoverBox!.x + popoverBox!.width).toBeLessThanOrEqual(rootBox!.x + rootBox!.width);
	await expect(page.locator("#root")).toHaveScreenshot("card-library-filter-popover-dark-280.png");
});
