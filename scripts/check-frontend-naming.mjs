import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceRoots = [
  path.join(root, "apps"),
  path.join(root, "packages"),
  path.join(root, "templates"),
];

const ignoredDirNames = new Set(["node_modules", "dist", ".turbo", ".git"]);
const ignoredSourceDirNames = new Set([
  "src",
  "pages",
  "layout",
  "api",
  "modules",
  "components",
  "config",
  "types",
  "auth",
  "dict",
  "menu",
  "notify",
  "platform",
  "runtime",
  "theme",
]);
const allowedFileNames = new Set([
  "index.ts",
  "main.tsx",
  "register.ts",
  "types.ts",
  "routes.tsx",
  "permission.tsx",
  "client.ts",
  "env.ts",
  "styles.css",
  "nebula.css",
  "global.d.ts",
  "README.md",
  "app.config.ts",
  "index.config.ts",
]);

const directoryPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const sourceFilePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.(ts|tsx|css)|\.d\.ts)$/;

const violations = [];

async function walk(currentPath) {
  const entries = await readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (ignoredDirNames.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(currentPath, entry.name);
    const relativePath = path.relative(root, fullPath);

    if (entry.isDirectory()) {
      if (relativePath.includes(`${path.sep}src${path.sep}`) || relativePath.endsWith(`${path.sep}src`)) {
        if (!ignoredSourceDirNames.has(entry.name) && !directoryPattern.test(entry.name)) {
          violations.push(relativePath);
        }
      }

      await walk(fullPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!relativePath.includes(`${path.sep}src${path.sep}`)) {
      continue;
    }

    if (allowedFileNames.has(entry.name)) {
      continue;
    }

    if (!sourceFilePattern.test(entry.name)) {
      violations.push(relativePath);
    }
  }
}

for (const sourceRoot of sourceRoots) {
  const info = await stat(sourceRoot).catch(() => null);
  if (info?.isDirectory()) {
    await walk(sourceRoot);
  }
}

if (violations.length > 0) {
  console.error("Frontend naming check failed. The following paths must use kebab-case:");
  for (const violation of violations.sort()) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Frontend naming check passed.");
