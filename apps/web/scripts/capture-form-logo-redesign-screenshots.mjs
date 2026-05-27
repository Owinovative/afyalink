import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const port = process.env.FORM_LOGO_QA_PORT ?? "3103";
const baseURL = process.env.FORM_LOGO_QA_BASE_URL ?? `http://127.0.0.1:${port}`;
const repoRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const outputDir = resolve(repoRoot, "docs/frontend/visual-qa/form-logo-public-pages-redesign");

const screenshots = [
  { name: "home-desktop", route: "/", width: 1440, height: 1000 },
  { name: "professionals-page", route: "/professionals", width: 1440, height: 1000 },
  { name: "students-page", route: "/students", width: 1440, height: 1000 },
  { name: "facilities-page", route: "/facilities", width: 1440, height: 1000 },
  { name: "matching-page", route: "/matching", width: 1440, height: 1000 },
  { name: "trust-security-page", route: "/trust-security", width: 1440, height: 1000 },
  { name: "professional-register", route: "/auth/register/professional", width: 1440, height: 1000 },
  { name: "student-register", route: "/auth/register/student", width: 1440, height: 1100 },
  { name: "facility-register", route: "/auth/register/facility", width: 1440, height: 1200 },
  { name: "facility-dashboard-logged-out", route: "/portal/facility/dashboard", width: 1440, height: 1000 },
  { name: "admin-dashboard-logged-out", route: "/portal/admin/dashboard", width: 1440, height: 1000 },
  { name: "home-mobile", route: "/", width: 375, height: 900 },
  { name: "facility-register-mobile", route: "/auth/register/facility", width: 375, height: 1100 },
];

const responsiveRoutes = [
  "/",
  "/professionals",
  "/students",
  "/facilities",
  "/matching",
  "/trust-security",
  "/auth/register/professional",
  "/auth/register/student",
  "/auth/register/facility",
  "/portal/facility/dashboard",
  "/portal/admin/dashboard",
];

const widths = [375, 768, 1440, 1920];

async function waitForServer(url, timeoutMs = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function stopTree(child) {
  if (!child || child.killed || child.exitCode !== null || !child.pid) return;

  try {
    child.kill(process.platform === "win32" ? "SIGKILL" : "SIGTERM");
  } catch {
    // Process may already be stopped.
  }

  if (process.platform === "win32") {
    spawnSync("powershell.exe", [
      "-NoProfile",
      "-Command",
      `Stop-Process -Id ${child.pid} -Force -ErrorAction SilentlyContinue`,
    ], { stdio: "ignore", timeout: 5000 });
  }
}

let server;

try {
  if (!process.env.FORM_LOGO_QA_BASE_URL) {
    server = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "start", "-p", port], {
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_PUBLIC_SITE_URL: "https://www.afyalinks.org",
        NEXT_PUBLIC_AFYA_API_BASE: "http://127.0.0.1:8000",
        PUBLIC_CONTACT_PHONE: "+254711776391",
        PUBLIC_LOCATION: "Hardy, Karen",
        PUBLIC_CONTACT_EMAIL: "",
        SUPPORT_EMAIL: "",
      },
    });
    await waitForServer(baseURL);
  }

  mkdirSync(outputDir, { recursive: true });
  for (const item of screenshots) {
    rmSync(resolve(outputDir, `${item.name}-${item.width}.png`), { force: true });
  }
  rmSync(resolve(outputDir, "visual-qa-report.json"), { force: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const captured = [];
  const overflows = [];

  for (const item of screenshots) {
    await page.setViewportSize({ width: item.width, height: item.height });
    await page.goto(`${baseURL}${item.route}`, { waitUntil: "networkidle" });
    const path = resolve(outputDir, `${item.name}-${item.width}.png`);
    await page.screenshot({ path, fullPage: true });
    captured.push({ ...item, path: path.replace(`${repoRoot}\\`, "").replaceAll("\\", "/") });
  }

  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 768 ? 900 : 1000 });
    for (const route of responsiveRoutes) {
      await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      overflows.push({ route, width, overflow });
    }
  }

  await browser.close();

  const report = {
    generated_at: new Date().toISOString(),
    base_url: baseURL,
    screenshots: captured,
    overflow_checks: overflows,
    failures: overflows.filter((item) => item.overflow > 1),
  };

  writeFileSync(resolve(outputDir, "visual-qa-report.json"), `${JSON.stringify(report, null, 2)}\n`);

  if (report.failures.length) {
    console.error(JSON.stringify(report.failures, null, 2));
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  stopTree(server);
}
