import {expect, test} from "@playwright/test";

test("mobile model detail leads with identity, validation and safety context", async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto("/sr/modeli/nordic-quad-winter");

  const summary = await page.locator(".detail-summary").boundingBox();
  const viewer = await page.locator(".viewer").boundingBox();
  const notice = await page.locator(".notice").boundingBox();
  const metrics = await page.locator(".metric-grid").boundingBox();
  const actions = await page.locator(".detail-actions").boundingBox();

  expect(summary).not.toBeNull();
  expect(viewer).not.toBeNull();
  expect(notice).not.toBeNull();
  expect(metrics).not.toBeNull();
  expect(actions).not.toBeNull();
  expect(summary!.y).toBeLessThan(viewer!.y);
  expect(notice!.y).toBeLessThan(metrics!.y);
  expect(notice!.y).toBeLessThan(actions!.y);
  await expect(page.getByRole("heading", {level: 1, name: "Nordic Quad Winter"})).toBeVisible();
});

test("3D viewer loads only after the user requests it", async ({page}) => {
  await page.goto("/sr/modeli/nordic-quad-winter");

  const launch = page.getByRole("button", {name: "Pokreni interaktivni 3D prikaz"});
  await expect(launch).toBeVisible();
  await expect(page.locator(".viewer canvas")).toHaveCount(0);

  await launch.click();
  await expect(page.locator(".viewer canvas")).toBeVisible();

  const cameraAngle = page.getByLabel("Ugao kamere");
  await expect(cameraAngle).toHaveValue("isometric");
  await cameraAngle.selectOption("front");
  await expect(cameraAngle).toHaveValue("front");
});

test("build mode manages keyboard focus and restores it when closed", async ({page}) => {
  await page.goto("/sr/modeli/nordic-quad-winter");
  const openBuildMode = page.getByRole("button", {name: "Režim izrade"});
  await openBuildMode.click();

  const dialog = page.getByRole("dialog");
  const close = dialog.getByRole("button", {name: "Zatvori režim izrade"});
  const next = dialog.getByRole("button", {name: "Sledeći"});
  await expect(dialog).toBeVisible();
  await expect(close).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(next).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(openBuildMode).toBeFocused();
});

test("production defers the heavy 3D JavaScript until launch", async ({page}) => {
  test.skip(process.env.CI !== "true", "bundle transfer is measured against the production server in CI mode");
  const scriptBytes = new Map<string, Promise<number>>();
  page.on("response", (response) => {
    if (
      response.status() === 200 &&
      response.request().resourceType() === "script" &&
      response.url().includes("/_next/static/chunks/")
    ) {
      scriptBytes.set(response.url(), response.body().then((body) => body.byteLength));
    }
  });

  await page.goto("/sr/modeli/nordic-quad-winter");
  await page.waitForLoadState("networkidle");
  const initialUrls = new Set(scriptBytes.keys());
  const initialEntries = await Promise.all(
    [...scriptBytes.entries()].map(async ([url, size]) => [url, await size] as const)
  );
  const initialBytes = initialEntries.map(([, size]) => size);
  expect(Math.max(0, ...initialBytes)).toBeLessThan(500_000);

  await page.getByRole("button", {name: "Pokreni interaktivni 3D prikaz"}).click();
  await expect(page.locator(".viewer canvas")).toBeVisible();
  await page.waitForLoadState("networkidle");
  const deferredBytes = await Promise.all(
    [...scriptBytes.entries()]
      .filter(([url]) => !initialUrls.has(url))
      .map(([, size]) => size)
  );
  console.log(
    `Production model detail JavaScript: ${initialBytes.reduce((sum, size) => sum + size, 0)} bytes before activation; ` +
    `${deferredBytes.reduce((sum, size) => sum + size, 0)} bytes fetched after 3D activation.`
  );
  expect(Math.max(0, ...deferredBytes)).toBeGreaterThan(800_000);
});
