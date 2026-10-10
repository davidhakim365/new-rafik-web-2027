import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts") || id.includes("/d3-")) return "charts";
          if (
            id.includes("@uiw") ||
            id.includes("react-markdown") ||
            id.includes("remark") ||
            id.includes("rehype") ||
            id.includes("micromark") ||
            id.includes("mdast") ||
            id.includes("hast")
          )
            return "markdown";
          if (id.includes("quagga") || id.includes("@ericblade")) return "scanner";
          if (id.includes("@uppy") || id.includes("filepond")) return "uploads";
          if (id.includes("framer-motion")) return "motion";
        },
      },
    },
  },
  // build: {
  //   rollupOptions: {
  //     external: [
  //       "react",
  //       "react-dom",
  //       "axios",
  //       "react-router-dom",
  //       "@tanstack/react-query",
  //       "@tanstack/react-query-devtools",
  //     ],
  //   },
  // },
  server: {
    port: 4000,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY ?? "http://localhost:5000",
        changeOrigin: true,
        timeout: 0,
        proxyTimeout: 0,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
