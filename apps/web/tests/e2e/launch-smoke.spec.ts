import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/professionals",
  "/students",
  "/facilities",
  "/matching",
  "/how-it-works",
  "/verification",
  "/trust-security",
  "/pricing-access",
  "/about",
  "/contact",
  "/faq",
];

const protectedRoutes = [
  "/portal/professional/dashboard",
  "/portal/facility/dashboard",
  "/portal/facility/requisitions",
  "/portal/admin/dashboard",
  "/portal/admin/users",
];

const widths = [375, 768, 1440, 1920];
const responsiveRoutes = ["/", "/matching", "/contact"];

test.describe("launch public routes", () => {
  test("all public routes load at desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });

    for (const route of publicRoutes) {
      await assertPublicRoute(page, route, 1440);
    }
  });

  test("representative public routes do not overflow at launch widths", async ({ page }) => {
    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 768 ? 900 : 1000 });
      for (const route of responsiveRoutes) {
        await assertPublicRoute(page, route, width);
      }
    }
  });
});

test("protected portal routes hide internal content when logged out", async ({ page }) => {
  for (const route of protectedRoutes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "Sign in to continue." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
    expect(await page.locator(".portal-shell").count()).toBe(0);
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("Recent audit events");
    expect(bodyText).not.toContain("Requisitions awaiting matching");
  }
});

test("wrong-role portal sessions render access denied before dashboard content", async ({ page }) => {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          user: {
            id: 42,
            name: "Facility Owner",
            email: "facility@example.com",
            roles: ["facility_admin"],
          },
        },
      }),
    });
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("afyalink.adminToken", "facility-token-stored-in-wrong-bucket");
  });

  await page.goto("/portal/admin/dashboard");
  await expect(page.getByRole("heading", { name: "Wrong workspace." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to your dashboard" })).toHaveAttribute("href", "/portal/facility/dashboard");
  expect(await page.locator(".portal-shell").count()).toBe(0);

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toContain("Command center");
  expect(bodyText).not.toContain("Applications");
});

test("login redirects by authenticated backend role instead of selected portal", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          token: "facility-login-token",
          user: {
            id: 77,
            name: "Facility Owner",
            email: "facility@example.com",
            roles: ["facility_admin"],
          },
        },
      }),
    });
  });
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          user: {
            id: 77,
            name: "Facility Owner",
            email: "facility@example.com",
            roles: ["facility_admin"],
          },
        },
      }),
    });
  });
  await page.route("**/api/facility/dashboard", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          facility: { display_name: "Facility Demo", review_status: "approved" },
          membership: { role: "facility_admin" },
          access: { active: false, active_subscription: null },
          requests: [],
          recommendation_requests: [],
          recommendation_packages: [],
        },
      }),
    });
  });

  await page.goto("/auth/login");
  await page.locator("select").first().selectOption("admin");
  await page.locator("[name='email']").fill("facility@example.com");
  await page.locator("[name='password']").fill("Password123!");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/portal\/facility\/dashboard/);
});

test("homepage slider controls and 15 second progress are wired", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page.locator(".home-dots button")).toHaveCount(6);
  await expect(page.locator(".home-dots button[aria-label='Show Afyalink']")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".home-progress span")).toHaveAttribute("style", /15000ms/);
  await page.waitForTimeout(1000);

  await page.getByRole("button", { name: "Next homepage section" }).click();
  await expect(page.locator(".home-dots button[aria-label='Show Professionals']")).toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: "Previous homepage section" }).click();
  await expect(page.locator(".home-dots button[aria-label='Show Afyalink']")).toHaveAttribute("aria-selected", "true");
});

test("mobile navigation opens without layout overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");

  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile public navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Facilities" }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" }).last()).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("public contact data uses launch values without placeholder inboxes", async ({ page }) => {
  await page.goto("/contact");

  await expect(page.getByText("Hardy, Karen").first()).toBeVisible();
  await expect(page.getByText("+254 711 776 391").first()).toBeVisible();
  await expect(page.getByText("www.afyalinks.org").first()).toBeVisible();

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toContain("hello@afyalinks.org");
  expect(bodyText).not.toContain("info@example.com");
  expect(bodyText).not.toContain("support@example.com");
  expect(bodyText).not.toContain("info@afyalinks.org");
  expect(bodyText).not.toContain("support@afyalinks.org");
});

test("Afyalink logo appears in public, auth, footer, and protected states", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".marketing-nav .brand-mark img").first()).toHaveAttribute("src", /afyalink-mark/);
  await expect(page.locator("footer .brand-logo-image").first()).toBeVisible();

  await page.goto("/auth/login");
  await expect(page.locator(".auth-brand .brand-logo-image").first()).toBeVisible();
  await expect(page.locator(".auth-card-brand .brand-mark img").first()).toHaveAttribute("src", /afyalink-mark/);

  await page.goto("/portal/facility/dashboard");
  await expect(page.locator(".portal-gate-brand .brand-mark img").first()).toHaveAttribute("src", /afyalink-mark/);
});

test("registration forms expose backend-required contract fields", async ({ page }) => {
  await page.goto("/auth/register/professional");
  for (const name of ["name", "phone", "email", "password", "applicant_track"]) {
    await expect(page.locator(`[name='${name}']`).first()).toBeAttached();
  }
  await expect(page.locator("[name='applicant_track']")).toHaveValue("licensed_professional");
  await assertRequiredFieldsBlockSubmit(page, "**/api/auth/register");

  await page.goto("/auth/register/student");
  for (const name of [
    "name",
    "phone",
    "student_status",
    "target_profession",
    "institution_name",
    "programme_or_course",
    "county",
    "placement_type",
    "notes",
    "email",
    "password",
    "applicant_track",
  ]) {
    await expect(page.locator(`[name='${name}']`).first()).toBeAttached();
  }
  await expect(page.locator("[name='applicant_track']")).toHaveValue("student_awaiting_license");
  await assertRequiredFieldsBlockSubmit(page, "**/api/auth/register/student");

  await page.goto("/auth/register/facility");
  for (const name of [
    "name",
    "phone",
    "legal_name",
    "display_name",
    "facility_type",
    "county",
    "contact_person",
    "email",
    "password",
    "registration_number",
    "location",
    "physical_address",
  ]) {
    await expect(page.locator(`[name='${name}']`).first()).toBeAttached();
  }
  await assertRequiredFieldsBlockSubmit(page, "**/api/facility/auth/register");
});

async function assertPublicRoute(page: import("@playwright/test").Page, route: string, width: number) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toBeVisible();
  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toContain("Application error");
  expect(bodyText).not.toContain("Unhandled Runtime Error");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${route} overflow at ${width}px`).toBeLessThanOrEqual(1);

  const ctaCount = await page.locator("a[href^='/auth'], a[href='/matching'], a[href='/professionals'], a[href='/facilities'], a[href='/contact']").count();
  expect(ctaCount, `${route} should expose a CTA link`).toBeGreaterThan(0);
}

async function assertRequiredFieldsBlockSubmit(page: import("@playwright/test").Page, routePattern: string) {
  let requestCount = 0;
  await page.route(routePattern, async (route) => {
    requestCount += 1;
    await route.fulfill({ status: 500, body: "frontend validation should block this request" });
  });

  await page.getByRole("button", { name: "Continue" }).click();
  const invalidCount = await page.locator("input:invalid, select:invalid, textarea:invalid").count();
  expect(invalidCount).toBeGreaterThan(0);
  expect(requestCount).toBe(0);
  await page.unroute(routePattern);
}
