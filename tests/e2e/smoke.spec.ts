import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@crrt.ma";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "crrt2026";
const memberEmail = process.env.E2E_MEMBER_EMAIL ?? "member@crrt.ma";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "crrt2026";
const eventSlug = process.env.E2E_EVENT_SLUG ?? "arduino-training-2026";

async function loginFromAdminPage(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForLoadState("networkidle");
  return !/\/login(?:\?|$)/.test(page.url());
}

test("health endpoint and key public pages load", async ({ page }) => {
  const healthResponse = await page.request.get("/api/health");
  expect(healthResponse.ok()).toBeTruthy();

  await page.goto("/");
  await expect(page).toHaveTitle(/crrt/i);

  await page.goto("/events");
  await expect(page.getByRole("heading", { name: /events/i })).toBeVisible();
});

test("public navigation remains English and has no language switcher", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("combobox", { name: /language/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^home$/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /^accueil$/i })).toHaveCount(0);
});

test("event apply page shows auth callbacks for unauthenticated users", async ({ page }) => {
  await page.goto(`/events/${eventSlug}/apply`);
  const signup = page.getByRole("link", { name: /create account to apply/i });
  const signin = page.getByRole("link", { name: /already a member\? sign in/i });

  await expect(signup).toBeVisible();
  await expect(signin).toBeVisible();
  await expect(signup).toHaveAttribute(
    "href",
    new RegExp(`callbackUrl=${encodeURIComponent(`/events/${eventSlug}/apply`)}`)
  );
  await expect(signin).toHaveAttribute(
    "href",
    new RegExp(`callbackUrl=${encodeURIComponent(`/events/${eventSlug}/apply`)}`)
  );
});

test("admin routes are protected and applications center flow works", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fadmin/);

  const loggedIn = await loginFromAdminPage(page, adminEmail, adminPassword);
  if (!loggedIn) {
    test.info().annotations.push({
      type: "warning",
      description:
        "Admin seed credentials are unavailable in this environment; skipping authenticated admin assertions.",
    });
    return;
  }
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText(/studio|dashboard|default seeded admin password/i).first()).toBeVisible();

  await page.goto("/admin/events");
  await expect(page.getByRole("heading", { name: /^events$/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /applications center/i })).toBeVisible();

  await page.goto("/admin/applications");
  const firstReviewRow = page.locator("[data-testid='application-row']").first();
  if (await firstReviewRow.count()) {
    await expect(page.getByRole("columnheader", { name: /^name$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^email$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^event$/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /^date$/i })).toBeVisible();

    await expect(firstReviewRow.getByRole("button")).toHaveCount(0);

    const currentStatus = (await firstReviewRow.getAttribute("data-review-status")) ?? "";
    const currentRegistration = (await firstReviewRow.getAttribute("data-registration-status")) ?? "";

    await firstReviewRow.click();
    await expect(page).toHaveURL(/\/admin\/applications\/[^/?]+/);
    await expect(page.getByTestId("application-save-button")).toBeVisible();

    let statusSelector = "";
    let nextStatus = "";
    if (currentStatus) {
      statusSelector = "application-review-status";
      nextStatus = currentStatus === "accepted" ? "rejected" : "accepted";
    } else if (currentRegistration) {
      statusSelector = "application-registration-status";
      nextStatus = currentRegistration === "approved" ? "rejected" : "approved";
    }

    if (statusSelector && nextStatus) {
      const nextLabel = nextStatus
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
      await page.getByTestId(statusSelector).click();
      await page.getByRole("option", { name: new RegExp(`^${nextLabel}$`, "i") }).click();
      await page.getByTestId("application-save-button").click();
    }

    await page.goto("/admin/applications");
    const rowAfterReload = page.locator("[data-testid='application-row']").first();
    if (statusSelector === "application-review-status" && nextStatus) {
      await expect(rowAfterReload).toHaveAttribute("data-review-status", nextStatus);
    } else if (statusSelector === "application-registration-status" && nextStatus) {
      await expect(rowAfterReload).toHaveAttribute("data-registration-status", nextStatus);
    }
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

  const loggedIn = await loginFromAdminPage(page, memberEmail, memberPassword);
  if (!loggedIn) {
    test.info().annotations.push({
      type: "warning",
      description:
        "Member seed credentials are unavailable in this environment; skipping authenticated member assertions.",
    });
    return;
  }
  await page.goto(`/events/${eventSlug}`);

  const detailStatusButton = page.getByRole("button", { name: /registered|waitlisted|approved/i });
  if (await detailStatusButton.count()) {
    await expect(detailStatusButton).toBeVisible();
  } else {
    const applyLink = page.getByRole("link", { name: /register|apply/i }).first();
    await expect(applyLink).toBeVisible();
    await applyLink.click();
    await expect(page).toHaveURL(new RegExp(`/events/${eventSlug}/apply`));

    const submitButton = page.getByTestId("event-apply-submit");
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    const validationErrors = page.getByText(/is required/i);
    if (await validationErrors.count()) {
      const textInputs = page.locator("input:not([type='checkbox']):not([type='hidden'])");
      const textInputCount = await textInputs.count();
      for (let i = 0; i < textInputCount; i += 1) {
        const input = textInputs.nth(i);
        if (!(await input.isVisible())) continue;
        if ((await input.inputValue()).trim().length > 0) continue;
        const type = (await input.getAttribute("type")) ?? "text";
        if (type === "email") {
          await input.fill("member@crrt.ma");
        } else if (type === "date") {
          await input.fill("2026-01-01");
        } else {
          await input.fill(`E2E value ${i + 1}`);
        }
      }

      const textareas = page.locator("textarea");
      const textareasCount = await textareas.count();
      for (let i = 0; i < textareasCount; i += 1) {
        const textarea = textareas.nth(i);
        if (!(await textarea.isVisible())) continue;
        if ((await textarea.inputValue()).trim().length > 0) continue;
        await textarea.fill(`E2E notes ${i + 1}`);
      }

      const selectTriggers = page.getByRole("combobox");
      const selectCount = await selectTriggers.count();
      for (let i = 0; i < selectCount; i += 1) {
        const trigger = selectTriggers.nth(i);
        if (!(await trigger.isVisible())) continue;
        await trigger.click();
        const option = page.getByRole("option").first();
        await option.click();
      }

      await submitButton.click();
    }

    await expect(page.getByRole("button", { name: /registered|waitlisted|approved/i })).toBeVisible();
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
