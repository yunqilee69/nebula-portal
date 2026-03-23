import { cp, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const templateDir = path.join(rootDir, "templates/business-starter");
const appsDir = path.join(rootDir, "apps");

const rl = readline.createInterface({ input, output });

async function prompt(question) {
  const answer = await rl.question(question);
  return answer.trim();
}

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return "";
  }
  return process.argv[index + 1]?.trim() ?? "";
}

async function replaceInFile(filePath, replacements) {
  const content = await readFile(filePath, "utf8");
  let next = content;
  for (const [search, value] of replacements) {
    next = next.split(search).join(value);
  }
  await writeFile(filePath, next, "utf8");
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  try {
    const appName = readArg("--name") || (await prompt("Application name (english, e.g. crm): "));
    const title = readArg("--title") || (await prompt("Display name (e.g. Customer Management): "));
    const route = readArg("--route") || (await prompt("Route prefix (e.g. /crm): "));
    const port = readArg("--port") || (await prompt("Development port: "));

    if (!appName || !title || !route || !port) {
      throw new Error("All fields are required.");
    }

    const targetDir = path.join(appsDir, appName);
    await mkdir(appsDir, { recursive: true });

    try {
      await stat(targetDir);
      throw new Error(`Target already exists: ${targetDir}`);
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
        throw error;
      }
    }

    await cp(templateDir, targetDir, { recursive: true });
    const remoteName = `${appName}Remote`;
    const componentKey = `${appName}/HomePage`;
    const replacements = [
      ["__APP_PACKAGE__", appName],
      ["__APP_TITLE__", title],
      ["__APP_PORT__", port],
      ["__REMOTE_NAME__", remoteName],
      ["__MODULE_ID__", `@business/${appName}`],
      ["__COMPONENT_KEY__", componentKey],
      ["__MENU_ID__", `${appName}-menu`],
      ["__ROUTE_PATH__", route],
    ];

    for (const file of await walk(targetDir)) {
      await replaceInFile(file, replacements);
    }

    output.write(`Created app at ${targetDir}\n`);
    output.write(`Next: add ${remoteName} to shell VITE_REMOTE_MODULES config (or the default remote list in apps/shell/src/config/env.ts)\n`);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  output.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
