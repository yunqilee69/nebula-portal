import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(projectDir, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectDir, "");
  const backendTarget = env.VITE_BACKEND_PROXY_TARGET ?? "http://127.0.0.1:8080";

  return {
    resolve: {
      alias: [
        { find: "@", replacement: path.resolve(projectDir, "src") },
        { find: "@nebula/auth", replacement: path.resolve(workspaceRoot, "packages/auth/src/index.ts") },
        { find: "@nebula/request", replacement: path.resolve(workspaceRoot, "packages/request/src/index.ts") },
        { find: "@nebula/core/", replacement: path.resolve(workspaceRoot, "packages/core/src/") },
        { find: "@nebula/core", replacement: path.resolve(workspaceRoot, "packages/core/src/index.ts") },
        { find: "@nebula/tokens", replacement: path.resolve(workspaceRoot, "packages/tokens/src/index.ts") },
        { find: "@nebula/ui-web", replacement: path.resolve(workspaceRoot, "packages/ui-web/src/index.ts") },
        { find: "@nebula/pages-web", replacement: path.resolve(workspaceRoot, "packages/pages-web/src/index.ts") },
      ],
    },
    plugins: [react()],
    build: {
      target: "esnext",
    },
    server: {
      port: 3000,
      proxy: {
        "/api": backendTarget,
        "/menus": backendTarget,
        "/dict": backendTarget,
        "/notify": backendTarget,
        "/api/auth": backendTarget,
        "/api/dict": backendTarget,
        "/api/notify": backendTarget,
        "/api/param": backendTarget,
        "/permissions": backendTarget,
        "/users": backendTarget,
        "/roles": backendTarget,
        "/orgs": backendTarget,
        "/params": backendTarget,
        "/system-params": backendTarget,
        "/oauth2": backendTarget,
        "/buttons": backendTarget,
        "/storage": backendTarget,
      },
    },
  };
});
