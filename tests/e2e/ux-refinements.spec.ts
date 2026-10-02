import {expect, test} from "@playwright/test";

test("finder explains an empty result with one-step relaxations", async ({page}) => {
  await page.goto("/sr/pronadji-model?heating=passive&climate=severe");

  await expect(page.getByRole("heading", {name: "Trenutno nema modela koji prolazi sve uslove."})).toBeVisible();
  await page.getByRole("button", {name: /Uključi i modele predviđene za grejanje/}).click();

  await expect(page.getByText("Nordic Solo Heated", {exact: true})).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.has("heating")).toBe(false);
});

test("finder suggests the smallest sufficient footprint in English", async ({page}) => {
  await page.goto("/en/find-model?animal=dog&dogSize=large&width=900&depth=900");

  await page.getByRole("button", {name: /Allow 1150 × 1350 mm of space/}).click();
  await expect(page.getByText("Alpine Large Winter", {exact: true})).toBeVisible();
  await expect(page.getByText("Dog size class: large").first()).toBeVisible();
});

test("catalog comparison tray tracks the selection", async ({page}) => {
  await page.goto("/sr/modeli");

  await page.getByRole("button", {name: "Uporedi"}).nth(0).click();
  const tray = page.getByRole("region", {name: "Izbor za poređenje"});
  await expect(tray).toBeVisible();
  await expect(tray.getByText("Izaberite još jedan model (do 3).")).toBeVisible();

  await page.getByRole("button", {name: "Uporedi"}).nth(0).click();
  await expect(tray.getByRole("button", {name: "Prikaži tabelu"})).toBeVisible();

  await tray.getByRole("button", {name: "Ukloni Nordic Solo Winter iz izbora"}).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("compare")).toBe("nordic-duo-winter");
});

test("model page links the heating counterpart and related models", async ({page}) => {
  await page.goto("/sr/modeli/nordic-quad-winter");

  await expect(page.getByRole("heading", {name: "Slični modeli"})).toBeAttached();
  await page.locator(".variant-callout").click();
  await expect(page).toHaveURL(/\/sr\/modeli\/nordic-quad-heated$/);
  await expect(page.getByRole("heading", {level: 1, name: "Nordic Quad Heated"})).toBeVisible();
});

test("header marks the current section", async ({page}) => {
  await page.goto("/en/models/alpine-medium-winter");
  // Desktop and mobile navigation both carry the state; only one of them is visible per viewport.
  const current = page.locator('header a[aria-current="page"]');
  await expect(current).toHaveCount(2);
  await expect(current.first()).toHaveText("Models");
});

test("Serbian model page does not leak English status vocabulary", async ({page}) => {
  for (const path of ["/sr", "/sr/metodologija", "/sr/vodici", "/sr/modeli/rescue-modular-eight-heated"]) {
    await page.goto(path);
    const text = await page.locator("main").innerText();
    for (const term of ["PROVISIONAL", "PROVISION ", "ASSUMPTION", "DATA_VALIDATED", "FIELD_TESTED", "community", "DIY", "footprint"]) {
      expect(text, `${path} contains ${term}`).not.toContain(term);
    }
  }
});
