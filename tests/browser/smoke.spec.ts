import { expect, test } from "@playwright/test";

test("playwright can interact with a page", async ({ page }) => {
  await page.setContent("<main><h1>Keyplane test</h1></main>");

  await expect(page.getByRole("heading", { name: "Keyplane test" })).toBeVisible();
});
