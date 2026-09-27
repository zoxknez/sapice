import {expect, test} from "@playwright/test";

test.describe("mobile prototype checklist", () => {
  test.use({
    reducedMotion: "reduce"
  });

  test("checklist items remain tappable after scrolling into view", async ({page}) => {
    await page.goto("/sr/modeli/nordic-quad-winter");
    const checkbox = page.getByLabel("Konstrukcija je stabilna na stvarnoj podlozi");
    await checkbox.scrollIntoViewIfNeeded();

    const geometry = await page.evaluate(() => {
      return {
        viewportWidth: window.visualViewport?.width ?? window.innerWidth,
        documentWidth: document.documentElement.scrollWidth
      };
    });

    await expect(checkbox).toBeVisible();
    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });
});
