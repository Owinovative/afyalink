import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

const requiredText = [
  "Verify professionals before facilities depend on them.",
  "Milestone 1 workflow",
  "No public credential document links.",
  "Milestone 1 domain foundation is active.",
];

for (const text of requiredText) {
  if (!html.includes(text)) {
    throw new Error(`Missing expected page text: ${text}`);
  }
}

for (const token of ["--navy", "--blue", "--teal", ".workflow-grid", ".trust-panel"]) {
  if (!css.includes(token)) {
    throw new Error(`Missing expected CSS token: ${token}`);
  }
}

console.log("Afyalink web foundation check passed.");

