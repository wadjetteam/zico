import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    proxy: {
    "/api": { target: "http://localhost:5000", changeOrigin: true },
      "/audit-api": { target: "http://localhost:5002", changeOrigin: true, rewrite: (p) => p.replace(/^\/audit-api/, "/api/audit") },
    },
  },
});
