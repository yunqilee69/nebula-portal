import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "__REMOTE_NAME__",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/app.tsx",
        "./register": "./src/register.ts",
      },
      shared: ["react", "react-dom", "react-router-dom", "antd", "@platform/core", "@platform/ui"],
    }),
  ],
  build: {
    target: "esnext",
    modulePreload: false,
    cssCodeSplit: false,
  },
  preview: {
    port: Number("__APP_PORT__"),
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  server: {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
});
