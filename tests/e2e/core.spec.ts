import {expect, test} from "@playwright/test";

test("SR homepage exposes the real engineering workflow", async ({page}) => {
  await page.goto("/sr");

  await expect(
    page.getByRole("heading", {level: 1, name: /Toplije i bezbednije kućice/i})
  ).toBeVisible();

  await expect(page.getByText("Krojna lista + nesting")).toBeVisible();
  await expect(page.getByText("Troškovnik bez izmišljenih cena")).toBeVisible();
  await expect(page.getByText("Build mode u radionici")).toBeVisible();
});

test("model page exposes compiled workshop sections", async ({page}) => {
  await page.goto("/sr/modeli/nordic-quad-winter");

  await expect(page.getByRole("heading", {level: 1, name: "Nordic Quad Winter"})).toBeVisible();
  await expect(page.getByRole("heading", {name: "Transparentna termička procena"})).toBeVisible();
  await expect(page.getByRole("heading", {name: "Raspored na tablama"})).toBeVisible();
  await expect(page.getByRole("heading", {name: "Troškovnik"})).toBeVisible();
  await expect(page.getByRole("heading", {name: "Raspored letvi i nosača"})).toBeVisible();
  await expect(page.getByRole("heading", {name: "Pričvršćivači, servisni krov i voda"})).toBeVisible();
});

test("dynamic locale switch preserves the model slug", async ({page}) => {
  await page.goto("/sr/modeli/nordic-quad-winter");
  await page.getByRole("button", {name: "Switch to English"}).click();

  await expect(page).toHaveURL(/\/en\/models\/nordic-quad-winter$/);
  await expect(page.getByRole("heading", {level: 1, name: "Nordic Quad Winter"})).toBeVisible();
  await expect(page.getByRole("heading", {name: "Transparent thermal estimate"})).toBeVisible();
});

test("large dog request never surfaces small or medium dog models", async ({page}) => {
  await page.goto("/sr/pronadji-model");

  await page.getByLabel("Životinja").selectOption("dog");
  await page.getByLabel("Veličina psa").selectOption("large");

  await expect(page.getByText("Alpine Large Winter", {exact: true})).toBeVisible();
  await expect(page.getByText("Alpine Small Winter", {exact: true})).toHaveCount(0);
  await expect(page.getByText("Alpine Medium Winter", {exact: true})).toHaveCount(0);
});

test("English model route is directly addressable", async ({page}) => {
  await page.goto("/en/models/alpine-medium-winter");

  await expect(page.getByRole("heading", {level: 1, name: "Alpine Medium Winter"})).toBeVisible();
  await expect(page.getByText("Print / Save PDF")).toBeVisible();
  await expect(page.getByText("Share plan")).toBeVisible();
});


test("prototype evidence persists against the exact compiled plan", async ({page}) => {
  await page.goto("/sr/modeli/nordic-quad-winter");

  await expect(
    page.getByRole("heading", {name: "Radni list fizičke provere"})
  ).toBeVisible();

  const prototypeId = page.getByLabel("ID / naziv prototipa");
  await prototypeId.fill("P-E2E-001");

  const stableCheck = page.getByLabel(
    "Konstrukcija je stabilna na stvarnoj podlozi"
  );
  await stableCheck.check();

  await page.reload();

  await expect(page.getByLabel("ID / naziv prototipa"))
    .toHaveValue("P-E2E-001");
  await expect(
    page.getByLabel("Konstrukcija je stabilna na stvarnoj podlozi")
  ).toBeChecked();
});


test("heated finder coverage exists for every dog size", async ({page}) => {
  await page.goto("/sr/pronadji-model");

  await page.getByLabel("Životinja").selectOption("dog");
  await page.getByRole("combobox", {name: /Grejanje/}).selectOption("heated");
  await page.getByLabel("Zimski profil").selectOption("severe");

  for (const [size, modelName] of [
    ["small", "Alpine Small Heated"],
    ["medium", "Alpine Medium Heated"],
    ["large", "Alpine Large Heated"]
  ] as const) {
    await page.getByLabel("Veličina psa").selectOption(size);
    await expect(page.getByText(modelName, {exact: true})).toBeVisible();
  }
});
