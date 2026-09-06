import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "tests"];
const ignoredDirs = new Set(["node_modules", "playwright-report", "test-results", "coverage"]);
const files = [];

for (const root of roots) {
  collectJavaScriptFiles(root);
}

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Checked ${files.length} JavaScript files.`);

function collectJavaScriptFiles(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      if (!ignoredDirs.has(entry)) collectJavaScriptFiles(path);
    } else if (entry.endsWith(".js") || entry.endsWith(".mjs")) {
      files.push(path);
    }
  }
}
