import { expect, test } from "@playwright/test";

const marketServiceUrl =
  process.env.MARKET_SERVICE_URL ?? "http://localhost:9002";

test("moves between both applications", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Measure one home. Read the whole market.",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Open estimator/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Locate a property on the value scale.",
    }),
  ).toBeVisible();
  await expect(page.getByLabel(/Interior area/)).toHaveAttribute(
    "min",
    "1",
  );

  await page.getByRole("link", { name: "Market" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Read the market as measured ground.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Price distribution")).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
});

test("runs a property estimate", async ({ page }) => {
  await page.goto("/estimator");
  await page.getByRole("button", { name: /Estimate value/ }).click();
  await expect(page.getByText("Estimated value")).toBeVisible();
  await expect(page.getByText("Time")).toBeVisible();
});

test("compares properties and exposes the saved history", async ({
  page,
}) => {
  await page.goto("/estimator/compare");
  await page.getByRole("button", { name: "Compare values" }).click();
  await expect(page.getByText("Comparative reading")).toBeVisible();
  await expect(page.getByText(/Highest · Property/)).toBeVisible();
  await expect(page.getByText(/Lowest · Property/)).toBeVisible();
  await expect(page.getByText("Value spread")).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: "Side-by-side property comparison",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "History" }).click();
  await expect(
    page.getByRole("heading", { name: "Previous model readings." }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: "Previous property estimates, newest first",
    }),
  ).toBeVisible();
});

test("keeps market filters, sorting and pagination in the URL", async ({
  page,
}) => {
  await page.goto("/market");
  const bedrooms = page.getByRole("group", { name: "Bedrooms" });
  const firstBedroom = bedrooms.getByRole("checkbox").first();
  const selectedBedroom = await firstBedroom.getAttribute("value");
  await firstBedroom.check();
  await page.getByRole("button", { name: "Apply segment" }).click();
  await expect(page).toHaveURL(
    new RegExp(`bedrooms=${selectedBedroom}.*offset=0`),
  );

  await page.getByRole("button", { name: /Sort by Price/ }).click();
  await expect(page).toHaveURL(/sort_by=price/);
  await expect(page).toHaveURL(/offset=0/);

  await page.goto("/market?min_price=999999999");
  await expect(
    page.getByRole("heading", {
      name: "No properties match this segment",
    }),
  ).toBeVisible();
});

test("runs what-if validation and displays signed differences", async ({
  page,
}) => {
  await page.goto("/market/what-if");
  const baselineBedrooms = page
    .locator('section[data-coordinate^="BASE"]')
    .getByLabel("Bedrooms");
  await baselineBedrooms.fill("2.5");
  await page.getByRole("button", { name: "Run what-if" }).click();
  await expect(
    page.getByText("Bedrooms must be a whole number."),
  ).toBeVisible();

  await baselineBedrooms.fill("3");
  const scenario = page.locator('section[data-coordinate^="SCN"]').first();
  await scenario.getByRole("button", { name: "Add feature" }).click();
  const featureSelects = scenario.getByRole("combobox");
  await expect(featureSelects).toHaveCount(2);
  await expect(
    featureSelects
      .nth(1)
      .locator('option[value="square_footage"]'),
  ).toHaveCount(0);
  await featureSelects.nth(0).selectOption("school_rating");
  await expect(featureSelects.nth(0)).toHaveValue("school_rating");
  await expect(featureSelects.nth(1)).toHaveValue("bedrooms");
  await scenario
    .getByLabel("New school rating for scenario 1")
    .fill("8.5");
  await scenario
    .getByLabel("New bedrooms for scenario 1")
    .fill("4");

  await page.getByRole("button", { name: "Run what-if" }).click();
  await expect(page.getByText("Scenario readings")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Scenario prices" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Difference from baseline" }),
  ).toHaveCount(0);
  const priceBars = page.locator(
    ".what-if-price-chart path.what-if-price-bar",
  );
  await expect(priceBars).toHaveCount(2);
  await priceBars.nth(1).hover();
  const tooltip = page.locator(".chart-tooltip");
  await expect(tooltip.getByText("Price", { exact: true })).toBeVisible();
  await expect(tooltip.getByText("Change", { exact: true })).toBeVisible();
  await expect(
    tooltip.getByText("Percentage", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", { name: "What-if scenario results" }),
  ).toBeVisible();
});

test("exports the current market segment as CSV and PDF", async ({
  request,
}) => {
  const csv = await request.get(
    `${marketServiceUrl}/api/properties/export/csv?bedrooms=3&sort_by=price&sort_direction=desc`,
  );
  expect(csv.ok()).toBeTruthy();
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(csv.headers()["content-disposition"]).toContain("filename=");
  expect((await csv.body()).byteLength).toBeGreaterThan(20);

  const pdf = await request.get(
    "/api/reports/market?bedrooms=3",
  );
  expect(pdf.ok()).toBeTruthy();
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect(pdf.headers()["content-disposition"]).toContain(
    "market-analysis.pdf",
  );
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
});

test("supports keyboard navigation through the application rail", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Housing Insights home" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Estimator", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/estimator$/);
});
