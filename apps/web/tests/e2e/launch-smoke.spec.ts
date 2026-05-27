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
