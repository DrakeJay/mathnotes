import { expect, test } from "@playwright/test";

/* The 1999 theme is a data-theme attribute on <html> plus CSS. These tests
   check the three things that can actually break: the toggle flips it, it
   survives a reload without a flash of the modern site, and the lesson prose
   stays dark-on-cream even when the OS asks for dark mode. */

test("the 1999 theme toggles, persists, and turns off again", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/");
  const html = page.locator("html");
  const marquee = page.locator(".hypno-marquee");
  await expect(html).not.toHaveAttribute("data-theme", "hypno");
  await expect(marquee).toBeHidden();

  const toggle = page.getByRole("button", { name: "Toggle 1999 theme" });
  await expect(toggle).toHaveText("✦ 1999 mode");
  await toggle.click();

  await expect(html).toHaveAttribute("data-theme", "hypno");
  await expect(toggle).toHaveText("⬅ exit '99");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(marquee).toBeVisible();
  await expect(page.getByLabel("visitor counter")).toBeVisible();

  // The inline head script applies the theme before paint, so it's already on
  // the element when a navigation's HTML lands — no flash of the modern site.
  await page.goto("/lessons/context-switching");
  await expect(html).toHaveAttribute("data-theme", "hypno");
  await expect(
    page.getByRole("heading", { name: "Context Switching", level: 1 }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Toggle 1999 theme" }).click();
  await expect(html).not.toHaveAttribute("data-theme", "hypno");
  await page.reload();
  await expect(html).not.toHaveAttribute("data-theme", "hypno");

  expect(pageErrors).toEqual([]);
});

test("1999 lesson prose stays readable when the OS is in dark mode", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();

  await page.goto("/lessons/context-switching");
  await page.getByRole("button", { name: "Toggle 1999 theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "hypno");

  // The panel is cream and the body text is dark ink — `dark:prose-invert`
  // must not win here (it would leave near-white text on the cream panel).
  const article = page.locator("article").first();
  await expect(article).toHaveCSS("background-color", "rgb(255, 251, 232)");
  const paragraph = page.locator(".prose p").first();
  await expect(paragraph).toHaveCSS("color", "rgb(24, 0, 50)");

  // Demos keep their light-mode canvas/SVG surface in this theme too.
  await expect(page.getByText("One context switch, stage by stage")).toBeVisible();

  await context.close();
});
