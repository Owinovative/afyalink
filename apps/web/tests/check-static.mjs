import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

const requiredText = [
  "Milestone 1 credential intake",
  "Register or sign in",
  "Upload private verification documents",
  "Applications, documents, payment state, and audit trail",
];

for (const text of requiredText) {
  if (!html.includes(text)) {
    throw new Error(`Missing expected page text: ${text}`);
  }
}

for (const token of ["--navy", "--blue", "--teal", ".credential-layout", ".admin-layout"]) {
  if (!css.includes(token)) {
    throw new Error(`Missing expected CSS token: ${token}`);
  }
}

for (const endpoint of [
  "/api/auth/register",
  "/api/professional/profile",
  "/api/professional/credentials",
  "/api/professional/consents",
  "/api/professional/payments",
  "/api/professional/application/submit",
  "/api/admin/applications",
  "/api/admin/audit-logs",
]) {
  if (!js.includes(endpoint)) {
    throw new Error(`Milestone 1 app is not wired to ${endpoint}`);
  }
}

console.log("Afyalink web milestone 1 intake check passed.");
