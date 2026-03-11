import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

const projectDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectDir, "");
  const demoRemoteUrl = env.VITE_DEMO_REMOTE_URL ?? "http://127.0.0.1:3001/assets/remoteEntry.js";
  const backendTarget = env.VITE_BACKEND_PROXY_TARGET ?? "http://127.0.0.1:8080";
  const moduleMode = env.VITE_MODULE_MODE ?? "embedded";

  return {
    resolve: {
      alias: moduleMode === "embedded"
        ? {
            "demoBusiness/register": path.resolve(projectDir, "../demo-business/src/register.ts"),
          }
        : undefined,
    },
    plugins: [
      react(),
      federation({
        name: "shell",
        remotes: moduleMode === "federation" ? {
          demoBusiness: demoRemoteUrl,
        } : {},
        shared: ["react", "react-dom", "react-router-dom", "antd", "@platform/core", "@platform/ui"],
      }),
    ],
    build: {
      target: "esnext",
    },
    server: {
      port: 3000,
      proxy: {
        "/api": backendTarget,
        "/menus": backendTarget,
        "/dict": backendTarget,
        "/notice": backendTarget,
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
