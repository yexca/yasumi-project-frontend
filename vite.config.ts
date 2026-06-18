import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("@powersync") || id.includes("wa-sqlite")) {
            return "powersync-vendor";
          }

          return "vendor";
        },
      },
    },
  },
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 7650,
  },
  preview: {
    host: "0.0.0.0",
    port: 7650,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
