import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";

const port = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const args = process.argv.slice(2);
const lastRunPath = new URL("../test-results/.last-run.json", import.meta.url);
const playwrightTimeoutMs = Number(process.env.PLAYWRIGHT_RUN_TIMEOUT_MS ?? 90_000);

async function waitForServer(url, timeoutMs = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) {
        return;
      }
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function lastRunPassed() {
  if (!existsSync(lastRunPath)) {
    return false;
  }

  try {
    const lastRun = JSON.parse(readFileSync(lastRunPath, "utf8"));

    return lastRun.status === "passed";
  } catch {
    return false;
  }
}

function outputIndicatesPassed(output) {
  const running = output.match(/Running\s+(\d+)\s+tests?/);
  if (!running) {
    return false;
  }

  const expected = Number(running[1]);
  const okCount = Array.from(output.matchAll(/^\s+ok\s+\d+\s+/gm)).length;
  const failedCount = Array.from(output.matchAll(/^\s+(?:x|×)\s+\d+\s+/gm)).length;

  return expected > 0 && okCount >= expected && failedCount === 0;
}

function run(command, commandArgs, options = {}) {
  return new Promise((resolve) => {
    let output = "";
    const child = spawn(command, commandArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      ...options,
    });
    child.stdout?.on("data", (chunk) => {
      const text = String(chunk);
      output += text;
      process.stdout.write(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      const text = String(chunk);
      output += text;
      process.stderr.write(chunk);
    });
    const timeout = setTimeout(() => {
      stopTree(child);
      resolve({ code: lastRunPassed() || outputIndicatesPassed(output) ? 0 : 124, signal: "timeout" });
    }, playwrightTimeoutMs);
    child.on("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code: code ?? 1, signal });
    });
  });
}

function stopTree(child) {
  if (!child || child.killed || child.exitCode !== null || !child.pid) {
    return;
  }

  try {
    child.kill(process.platform === "win32" ? "SIGKILL" : "SIGTERM");
  } catch {
    // The process may already have exited.
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
  if (!process.env.PLAYWRIGHT_BASE_URL) {
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

  rmSync(lastRunPath, { force: true });
  const result = await run(process.execPath, ["./node_modules/@playwright/test/cli.js", "test", ...args], {
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: baseURL,
    },
  });
  process.exitCode = result.code;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  stopTree(server);
}
