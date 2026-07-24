import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    // Sourcemaps on: when the error boundary fires in production the stack is
    // otherwise minified nonsense like "Oi is not a constructor", which is
    // impossible to act on. The cost is a few extra files nginx never serves
    // unless devtools asks for them.
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: { react: ["react", "react-dom"] },
      },
    },
  },
});
