import {expect, test} from "@playwright/test";

const viewports = [
  {width: 1440, height: 900},
  {width: 1280, height: 800},
  {width: 768, height: 1024},
  {width: 390, height: 844},
  {width: 360, height: 800}
];

const pages = [
  ["homepage", "/sr"],
  ["catalog", "/sr/modeli"],
  ["finder", "/sr/pronadji-model"],
  ["passive model", "/sr/modeli/nordic-solo-winter"],
  ["heated model", "/sr/modeli/nordic-solo-heated"],
  ["large multichamber model", "/sr/modeli/rescue-modular-eight"],
  ["methodology", "/sr/metodologija"],
  ["model sources", "/sr/modeli/nordic-quad-winter#sources"],
  ["offline page", "/sr/offline"],
  ["not-found page", "/sr/modeli/nonexistent-model"]
] as const;

test("core routes fit the requested responsive widths", async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Uses exact CSS viewport sizes.");
  const runtimeErrors: string[] = [];
  let currentPage = "initial";
  let currentWidth = 0;
  let checkRuntimeErrors = true;
  page.on("console", (message) => {
    if (checkRuntimeErrors && message.type() === "error") {
      runtimeErrors.push(`${currentPage} at ${currentWidth}px: ${message.text()} (${message.location().url})`);
    }
  });
  page.on("pageerror", (error) => {
    if (checkRuntimeErrors) runtimeErrors.push(`${currentPage} at ${currentWidth}px: ${error.message}`);
  }
  );
  page.on("response", (response) => {
    if (checkRuntimeErrors && response.status() >= 400 && response.request().resourceType() !== "document") {
      runtimeErrors.push(
        `${currentPage} at ${currentWidth}px: ${response.status()} ${response.url()}`
      );
    }
  });

  for (const viewport of viewports) {
    currentWidth = viewport.width;
    await page.setViewportSize(viewport);

    for (const [pageName, path] of pages) {
      currentPage = pageName;
      checkRuntimeErrors = pageName !== "not-found page";
      const response = await page.goto(path);
      expect(response?.status(), `${pageName} response at ${viewport.width}px`)
        .toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();

      if (path.includes("#sources")) {
        const sourceLinks = page.locator("#sources a[href^='http']");
        expect(await sourceLinks.count(), "compiled model source links").toBeGreaterThan(0);
        const missingUrls = await page.locator("#sources a").evaluateAll((links) =>
          links.filter((link) => !link.getAttribute("href")).length
        );
        expect(missingUrls, "source links without URLs").toBe(0);
      }

      const documentWidth = await page.evaluate(() =>
        Math.max(document.body.scrollWidth, document.documentElement.scrollWidth)
      );
      expect(
        documentWidth,
        `${pageName} overflows at ${viewport.width}px`
      ).toBeLessThanOrEqual(viewport.width + 1);
    }
  }

  expect(runtimeErrors, JSON.stringify(runtimeErrors, null, 2)).toEqual([]);
});
