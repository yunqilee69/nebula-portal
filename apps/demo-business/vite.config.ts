import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "demoBusiness",
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
    port: 3001,
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
