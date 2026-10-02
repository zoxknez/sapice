import {expect, test} from "@playwright/test";

test("Finder restores shared criteria in Serbian and English", async ({page}) => {
  for (const route of ["/sr/pronadji-model", "/en/find-model"]) {
    await page.goto(`${route}?animal=dog&count=4&dogSize=large&heating=heated&climate=severe&width=2400&depth=1800`);
    const finder = page.getByRole("region", {
      name: route.startsWith("/sr") ? "Uslovi za izbor modela" : "Model matching constraints"
    });

    await expect(finder.getByLabel(route.startsWith("/sr") ? "Životinja" : "Animal"))
      .toHaveValue("dog");
    await expect(finder.getByLabel(route.startsWith("/sr") ? "Veličina psa" : "Dog size"))
      .toHaveValue("large");
    await expect(finder.getByLabel(route.startsWith("/sr") ? "Grejanje" : "Heating"))
      .toHaveValue("heated");
    await expect(finder.getByLabel(route.startsWith("/sr") ? "Zimski profil" : "Winter profile"))
      .toHaveValue("severe");
    await expect(page.getByText("Alpine Large Heated", {exact: true}))
      .toBeVisible();

    await page.reload();
    await expect(finder.getByLabel(route.startsWith("/sr") ? "Veličina psa" : "Dog size"))
      .toHaveValue("large");
  }
});

test("Finder writes changed criteria to the URL and keeps unrelated query values", async ({page}) => {
  await page.goto("/sr/pronadji-model?utm_source=community");
  const finder = page.getByRole("region", {name: "Uslovi za izbor modela"});

  await finder.getByLabel("Životinja").selectOption("dog");
  await finder.getByLabel("Veličina psa").selectOption("large");
  await finder.getByLabel("Grejanje").selectOption("heated");

  await expect.poll(() => {
    const url = new URL(page.url());
    return [url.searchParams.get("animal"), url.searchParams.get("dogSize"), url.searchParams.get("heating"), url.searchParams.get("utm_source")].join("|");
  }).toBe("dog|large|heated|community");

  await page.reload();
  await expect(finder.getByLabel("Veličina psa")).toHaveValue("large");
  await expect(finder.getByLabel("Grejanje")).toHaveValue("heated");
});

test("catalog restores shareable filters and comparison selection after reload", async ({page}) => {
  await page.goto("/sr/modeli?animal=cat&heating=passive&q=Nordic&compare=nordic-solo-winter%2Cnordic-duo-winter");

  await expect(page.getByLabel("Pretražite modele")).toHaveValue("Nordic");
  await expect(page.getByRole("button", {name: "Mačke"})).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", {name: "Pasivni"})).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", {name: "U poređenju"})).toHaveCount(2);
  await expect(page.getByRole("heading", {name: "Poređenje modela"})).toBeVisible();

  await page.reload();

  await expect(page.getByLabel("Pretražite modele")).toHaveValue("Nordic");
  await expect(page.getByRole("button", {name: "U poređenju"})).toHaveCount(2);
  await expect(page.getByRole("heading", {name: "Poređenje modela"})).toBeVisible();
});

test("catalog comparison actions update the URL", async ({page}) => {
  await page.goto("/sr/modeli?utm_campaign=winter");

  await page.getByRole("button", {name: "Uporedi"}).nth(0).click();
  await page.getByRole("button", {name: "Uporedi"}).nth(0).click();

  await expect.poll(() => {
    const url = new URL(page.url());
    return [url.searchParams.get("compare"), url.searchParams.get("utm_campaign")].join("|");
  }).toBe("nordic-solo-winter,nordic-duo-winter|winter");

  await page.reload();
  await expect(page.getByRole("button", {name: "U poređenju"})).toHaveCount(2);

  await page.getByRole("button", {name: "Očisti"}).click();
  await expect.poll(() => new URL(page.url()).searchParams.has("compare")).toBe(false);
});
