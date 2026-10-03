import {expect, test} from "@playwright/test";

test("homepage offers four journeys and the design class scale", async ({page}) => {
  await page.goto("/sr");
  const journeys = page.locator(".journey");
  await expect(journeys).toHaveCount(4);
  await expect(page.locator(".class-scale li")).toHaveCount(5);
  await page.locator(".journey-emergency").click();
  await expect(page).toHaveURL(/\/sr\/hitno$/);
});

test("emergency chooser recommends a plan from what is at hand", async ({page}) => {
  await page.goto("/sr/hitno");
  const result = page.locator(".emergency-result");
  await expect(result).toContainText("Još nemate dovoljno");

  for (const item of ["Kartonska kutija", "Folija ili debela kesa", "Lepljiva traka", "Skalpel ili nož"]) {
    await page.getByLabel(item).check();
  }
  await expect(result.locator("h3")).not.toBeEmpty();
  await expect(result.locator(".emergency-steps li").first()).toBeVisible();
  await result.getByRole("link", {name: "Otvori ceo plan"}).click();
  await expect(page).toHaveURL(/\/sr\/modeli\/emergency-/);
  await expect(page.locator("main").getByText("Hitno").first()).toBeVisible();
});

test("workshop inventory splits what you have from what to obtain and persists locally", async ({page}) => {
  await page.goto("/sr/napravi-od-onoga-sto-imas");
  await page.getByRole("button", {name: "Imam dve plastične kutije i slamu"}).click();
  const first = page.locator(".inventory-result").first();
  await expect(first).toBeVisible();
  await expect(first).toContainText("Već imate");
  await expect(first).toContainText("Treba nabaviti");

  const stored = await page.evaluate(() => window.localStorage.getItem("sapice:workshop:v1"));
  expect(stored).toContain("plastic-tote");
  await page.reload();
  await expect(page.locator(".inventory-result").first()).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem("sapice:workshop:v1"))).toContain("plastic-tote");
});

test("budget never invents prices: missing prices stay unknown", async ({page}) => {
  await page.goto("/sr/budzet");
  await page.evaluate(() => window.localStorage.removeItem("sapice:prices:v1"));
  await page.reload();
  const summary = page.locator(".result-summary");
  await expect(summary).toContainText("bez dovoljno cena");
  await expect(page.locator(".fit-badge.fit-unknown").first()).toBeVisible();
  await expect(page.locator(".fit-badge.fit-unknown").first()).toContainText(/Nedostaj/);
});

test("retrofit advisor gives an ordered plan without a thermal claim", async ({page}) => {
  await page.goto("/sr/unapredi-kucicu");
  await expect(page.getByRole("heading", {name: "Šta uraditi i kojim redom"})).toBeVisible();
  const body = await page.locator("main").innerText();
  expect(body).not.toMatch(/bezbedno do\s*-?\d/i);
  expect(body).not.toMatch(/safe to\s*-?\d/i);
});

test("rescue planner nests a whole batch on shared sheets", async ({page}) => {
  await page.goto("/sr/za-udruzenja");
  await expect(page.getByText("Ploče za celu seriju", {exact: true})).toBeVisible();
  await expect(page.getByText(/pojedinačno \d+/).first()).toBeVisible();
  await expect(page.getByText("Ponovljiv raspored sečenja", {exact: true})).toBeVisible();
});

test("materials page explains substitutes with R = d / λ and caveats", async ({page}) => {
  await page.goto("/sr/materijali");
  await expect(page.getByLabel("Nemate ovaj materijal")).toBeVisible();
  const results = page.locator(".substitute-results li");
  await expect(results.first()).toBeVisible();
  await expect(page.locator(".substitute-results")).toContainText(/R \d+\.\d{2} m²K\/W/);
  await expect(page.locator(".caveat-list li").first()).toBeVisible();
});

test("reuse page carries the ISPM 15 and treated wood checklist", async ({page}) => {
  await page.goto("/sr/ponovna-upotreba");
  await expect(page.getByText(/ISPM\s?15/).first()).toBeVisible();
  await expect(page.locator("main")).toContainText(/MB/);
});

test("topic landing pages list only matching models", async ({page}) => {
  await page.goto("/sr/planovi/kucica-za-psa-od-paleta");
  await expect(page.getByRole("heading", {level: 1})).toBeVisible();
  const cards = page.locator(".catalog-card");
  expect(await cards.count()).toBeGreaterThan(0);
  await page.getByRole("button", {name: "Switch to English"}).click();
  await expect(page).toHaveURL(/\/en\/plans\/pallet-dog-house$/);
});

test("new routes switch locale to their localized pair", async ({page}) => {
  const pairs: Array<[string, RegExp]> = [
    ["/sr/hitno", /\/en\/emergency$/],
    ["/sr/napravi-od-onoga-sto-imas", /\/en\/build-with-what-you-have$/],
    ["/sr/budzet", /\/en\/budget$/],
    ["/sr/unapredi-kucicu", /\/en\/retrofit$/],
    ["/sr/za-udruzenja", /\/en\/rescue$/],
    ["/sr/ponovna-upotreba", /\/en\/reuse$/]
  ];
  for (const [path, english] of pairs) {
    await page.goto(path);
    await page.getByRole("button", {name: "Switch to English"}).click();
    await expect(page).toHaveURL(english);
  }
});

test("practical model page separates known from unknown thermal layers", async ({page}) => {
  await page.goto("/sr/modeli/tote-in-tote-straw");
  await expect(page.getByRole("heading", {level: 1})).toBeVisible();
  await expect(page.getByRole("heading", {name: "Poznati i nepoznati slojevi"})).toBeVisible();
  await expect(page.locator("main")).toContainText("nepoznato");
  await expect(page.locator("main")).not.toContainText(/U-vrednost\s*[0-9]/);
});

test("finder 2.0 explains why a model matches", async ({page}) => {
  await page.goto("/sr/pronadji-model");
  await expect(page.locator(".finder-results > *").first()).toBeVisible();
  await expect(page.getByText(/Zašto odgovara/i).first()).toBeVisible();
});

test("emergency page prints the instruction cards without the interactive chooser", async ({page}) => {
  await page.goto("/sr/hitno");
  await page.emulateMedia({media: "print"});
  await expect(page.locator(".emergency-chooser")).toBeHidden();
  await expect(page.locator(".emergency-card").first()).toBeVisible();
});

test("rescue cutting schedule is part of the printed plan", async ({page}) => {
  await page.goto("/sr/za-udruzenja");
  await page.emulateMedia({media: "print"});
  await expect(page.locator(".rescue-panel")).toBeHidden();
  await expect(page.locator(".cutting-schedule li").first()).toBeVisible();
  await expect(page.locator(".cutting-schedule li").first()).toContainText("(skl. 1)");
});

test("service worker pre-caches the emergency route in both languages", async ({request}) => {
  const response = await request.get("/sw.js");
  expect(response.ok()).toBeTruthy();
  const source = await response.text();
  expect(source).toContain("/sr/hitno");
  expect(source).toContain("/en/emergency");
});
