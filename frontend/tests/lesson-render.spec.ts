import { expect, test } from "@playwright/test";

test("lesson page renders KaTeX math and a live server-computed demo", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("/lessons/gradient-descent");
  await expect(
    page.getByRole("heading", { name: "Gradient Descent", level: 1 }),
  ).toBeVisible();
  await expect(page.locator(".katex").first()).toBeVisible();

  // Both server-computed demos on this page fetch and render their charts
  // (each shows a "Loss at each step" caption once its data arrives).
  await expect(page.getByText("Gradient descent, live")).toBeVisible();
  await expect(page.getByText("Plain gradient descent vs. momentum")).toBeVisible();
  await expect(page.getByText("Loss at each step")).toHaveCount(2, {
    timeout: 10_000,
  });
  await expect(page.getByText(/final loss/).first()).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("home page lists the seeded curriculum", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "The math behind machine learning" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Backpropagation/ })).toBeVisible();
});
