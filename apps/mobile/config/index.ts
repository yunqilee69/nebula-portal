import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "@tarojs/cli"

const configDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(configDir, "..")
const workspaceRoot = path.resolve(appDir, "../..")

export default defineConfig({
  projectName: "nebula-mini-program",
  date: "2026-04-15",
  designWidth: 375,
  deviceRatio: {
    375: 2,
    750: 1,
    828: 1.81,
  },
  sourceRoot: "src",
  outputRoot: "dist",
  framework: "react",
  compiler: {
    type: "webpack5",
    prebundle: {
      enable: false,
    },
  },
  alias: {
    "@": path.resolve(appDir, "src"),
    "@nebula/auth": path.resolve(workspaceRoot, "packages/auth/src/index.ts"),
    "@nebula/request": path.resolve(workspaceRoot, "packages/request/src/index.ts"),
    "@nebula/core": path.resolve(workspaceRoot, "packages/core/src/index.ts"),
    "@nebula/i18n": path.resolve(workspaceRoot, "packages/i18n/src/index.ts"),
    "@nebula/tokens": path.resolve(workspaceRoot, "packages/tokens/src/index.ts"),
  },
  mini: {
    compile: {
      include: [
        path.resolve(workspaceRoot, "packages/auth"),
        path.resolve(workspaceRoot, "packages/request"),
        path.resolve(workspaceRoot, "packages/core"),
        path.resolve(workspaceRoot, "packages/i18n"),
        path.resolve(workspaceRoot, "packages/tokens"),
      ],
    },
  },
})
