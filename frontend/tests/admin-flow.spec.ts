import { expect, test } from "@playwright/test";

const PASSWORD = process.env.ADMIN_PASSWORD ?? "letmein";

test("full admin lifecycle: login, create, edit, delete, logout", async ({
  page,
  context,
}) => {
  // --- login ---
  await page.goto("/admin");
  await expect(page.getByPlaceholder("Password")).toBeVisible();

  await page.getByPlaceholder("Password").fill("definitely-wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Wrong password")).toBeVisible();

  await page.getByPlaceholder("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Content" })).toBeVisible();

  // --- the session cookie is real but invisible to JavaScript ---
  const session = (await context.cookies()).find(
    (c) => c.name === "mathnotes_session",
  );
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "mathnotes_session",
  );

  // --- create a lesson through the editor ---
  const title = `E2E Test Lesson ${Date.now()}`;
  await page.getByRole("link", { name: "New lesson" }).click();
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Summary").fill("Created by the e2e suite.");
  await page
    .getByLabel(/Content/)
    .fill("## E2E\n\nInline math $x^2$ renders.\n");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: `Editing: ${title}` })).toBeVisible();

  // --- it renders publicly, math and all ---
  const slug = page.url().split("/").pop()!;
  await page.goto(`/lessons/${slug}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.locator(".katex").first()).toBeVisible();

  // --- edit round-trip ---
  await page.goto(`/admin/lessons/${slug}`);
  await page.getByLabel("Summary").fill("Updated by the e2e suite.");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // --- delete cleans up ---
  page.on("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await page.waitForURL("**/admin");
  await expect(page.getByRole("heading", { name: "Content" })).toBeVisible();
  await expect(page.getByRole("link", { name: title })).toHaveCount(0);

  // --- logout revokes the session server-side ---
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  const res = await page.request.post("/api/lessons", {
    data: { title: "X", topic_id: 1 },
  });
  expect(res.status()).toBe(401);
});
