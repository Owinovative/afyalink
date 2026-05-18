import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const repoRoot = resolve(webRoot, "../..");
const dist = resolve(webRoot, "dist");
const apiBase = process.env.AFYA_API_BASE ?? "http://localhost:8000";

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
mkdirSync(resolve(dist, "src"), { recursive: true });

cpSync(resolve(webRoot, "index.html"), resolve(dist, "index.html"));
cpSync(resolve(webRoot, "src/styles.css"), resolve(dist, "src/styles.css"));
cpSync(resolve(webRoot, "src/app.js"), resolve(dist, "src/app.js"));
cpSync(resolve(repoRoot, "assets"), resolve(dist, "assets"), { recursive: true });

const escapedApiBase = JSON.stringify(apiBase);
writeFileSync(resolve(dist, "src/env.js"), `window.AFYA_API_BASE = ${escapedApiBase};\n`);

const html = readFileSync(resolve(dist, "index.html"), "utf8");
if (!html.includes("src/env.js")) {
  throw new Error("Render build must load src/env.js before app.js.");
}

console.log(`Afyalink web render build complete with API base ${apiBase}`);
