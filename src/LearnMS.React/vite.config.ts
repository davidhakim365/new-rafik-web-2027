import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
