import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const projectDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectDir, "");
  const backendTarget = env.VITE_BACKEND_PROXY_TARGET ?? "http://127.0.0.1:8080";

  return {
    resolve: {
      alias: {
        "@": path.resolve(projectDir, "src"),
        "@nebula/auth": path.resolve(projectDir, "../../packages/auth/src/index.ts"),
        "@nebula/request": path.resolve(projectDir, "../../packages/request/src/index.ts"),
        "@nebula/core": path.resolve(projectDir, "../../packages/core/src/index.ts"),
        "@nebula/i18n": path.resolve(projectDir, "../../packages/i18n/src/index.ts"),
        "@nebula/tokens": path.resolve(projectDir, "../../packages/tokens/src/index.ts"),
        "@nebula/ui-web": path.resolve(projectDir, "../../packages/ui-web/src/index.ts"),
        "@nebula/pages-web": path.resolve(projectDir, "../../packages/pages-web/src/index.ts"),
      },
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
