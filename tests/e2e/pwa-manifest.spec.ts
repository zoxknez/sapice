import {expect, test} from "@playwright/test";

test("Serbian routes expose a Serbian manifest with valid install icons", async ({page}) => {
  await page.goto("/sr");
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBe("/manifest-sr.webmanifest");

  const manifestResponse = await page.request.get(manifestHref!);
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({lang: "sr-Latn", start_url: "/sr", id: "/sr"});
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({src: "/icon-192.png", sizes: "192x192"}),
    expect.objectContaining({src: "/icon-512.png", sizes: "512x512"}),
    expect.objectContaining({src: "/icon-maskable-512.png", purpose: "maskable"})
  ]));
  for (const icon of manifest.icons) {
    const response = await page.request.get(icon.src);
    expect(response.ok(), `${icon.src} should be served`).toBeTruthy();
  }
});

test("English routes expose the matching English manifest", async ({page}) => {
  await page.goto("/en");
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBe("/manifest-en.webmanifest");
  const manifestResponse = await page.request.get(manifestHref!);
  expect(manifestResponse.ok()).toBeTruthy();
  await expect(manifestResponse).toBeOK();
  expect(await manifestResponse.json()).toMatchObject({lang: "en", start_url: "/en", id: "/en"});
});

test("production service worker provides the localized offline fallback", async ({page, context}) => {
  test.skip(process.env.CI !== "true", "the development server intentionally does not register the service worker");

  await page.goto("/sr");
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.goto("/sr/models/route-that-has-not-been-cached");

  await expect(page.getByRole("heading", {name: "Trenutno nema mreže"})).toBeVisible();
  await expect(page.getByText(/Već otvoreni modeli mogu ostati dostupni/)).toBeVisible();
});
