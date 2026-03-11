import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@crrt.ma";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "crrt2026";
const memberEmail = process.env.E2E_MEMBER_EMAIL ?? "member@crrt.ma";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "crrt2026";
const eventSlug = process.env.E2E_EVENT_SLUG ?? "arduino-training-2026";

async function loginFromAdminPage(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test("health endpoint and key public pages load", async ({ page }) => {
  const healthResponse = await page.request.get("/api/health");
  expect(healthResponse.ok()).toBeTruthy();

  await page.goto("/");
  await expect(page).toHaveTitle(/crrt/i);

  await page.goto("/events");
  await expect(page.getByRole("heading", { name: /events/i })).toBeVisible();
});

test("admin routes are protected and applications center flow works", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fadmin/);

  await loginFromAdminPage(page, adminEmail, adminPassword);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText(/studio|dashboard|default seeded admin password/i).first()).toBeVisible();

  await page.goto("/admin/events");
  await expect(page.getByRole("heading", { name: /^events$/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /applications center/i })).toBeVisible();

  const deepLink = page.getByRole("link", { name: /^applications$/i }).first();
  if (await deepLink.count()) {
    await deepLink.click();
    await expect(page).toHaveURL(/\/admin\/applications\?eventId=/);
  }

  await page.goto("/admin/applications");
  const firstReviewRow = page.locator("[data-testid='application-row']").first();
  if (await firstReviewRow.count()) {
    const registrationBefore = (await firstReviewRow.getAttribute("data-registration-status")) ?? "";
    const currentStatus = (await firstReviewRow.getAttribute("data-review-status")) ?? "new";
    const nextStatus = currentStatus === "accepted" ? "rejected" : "accepted";

    await firstReviewRow
      .locator("td")
      .nth(3)
      .getByRole("button", { name: new RegExp(`^${nextStatus.replace("_", " ")}$`, "i") })
      .click();
    await expect(firstReviewRow).toHaveAttribute("data-review-status", nextStatus);

    await page.reload();
    const rowAfterReload = page.locator("[data-testid='application-row']").first();
    await expect(rowAfterReload).toHaveAttribute("data-review-status", nextStatus);
    const registrationAfter = (await rowAfterReload.getAttribute("data-registration-status")) ?? "";
    expect(registrationAfter).toBe(registrationBefore);
  } else {
    await expect(page.getByText(/no applications match|no applications found/i)).toBeVisible();
  }

  const uniqueSuffix = Date.now();
  const slug = `e2e-tabbed-event-${uniqueSuffix}`;

  await page.goto("/admin/events/new");
  await expect(page.getByRole("tab", { name: /^details$/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^registration$/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^form builder$/i })).toBeVisible();
  await page.getByTestId("event-field-title").fill(`E2E Tabbed Event ${uniqueSuffix}`);
  await page.getByTestId("event-field-slug").fill(slug);
  await page.getByTestId("event-field-description").fill("E2E event created from tabbed editor.");
  await page.getByTestId("event-field-startDate").fill("2026-12-31T10:00");
  await page.getByRole("button", { name: /^save$/i }).click();
  await expect(page).toHaveURL(/\/admin\/events(?:\?.*)?$/);

  const createdRow = page.locator("tr", { hasText: slug }).first();
  await expect(createdRow).toBeVisible();
  await createdRow.locator("a[title='Edit']").click();
  await expect(page).toHaveURL(/\/admin\/events\/.+/);
  await expect(page.getByRole("tab", { name: /^applications$/i })).toBeVisible();
  await page.getByRole("button", { name: /^save$/i }).click();
  await expect(page).toHaveURL(/\/admin\/events(?:\?.*)?$/);
});

test("member can register for an event and view private resources", async ({ page }) => {
  const privateBefore = await page.request.get("/api/resources/private");
  expect(privateBefore.status()).toBe(401);

  await loginFromAdminPage(page, memberEmail, memberPassword);
  await page.goto(`/events/${eventSlug}`);

  const signInPrompt = page.getByRole("link", { name: /sign in to register/i });
  await expect(signInPrompt).toHaveCount(0);

  const registerButton = page.getByRole("button", { name: /register/i });
  const statusButton = page.getByRole("button", { name: /registered|waitlisted|approved/i });

  if (await registerButton.count()) {
    await registerButton.click();
    await expect(statusButton).toBeVisible();
  } else {
    await expect(statusButton).toBeVisible();
  }

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /recent applications/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /private resources/i })).toBeVisible();

  const privateAfter = await page.request.get("/api/resources/private");
  expect(privateAfter.status()).toBe(200);
  const payload = (await privateAfter.json()) as unknown[];
  expect(Array.isArray(payload)).toBeTruthy();
  expect(payload.length).toBeGreaterThan(0);
});
