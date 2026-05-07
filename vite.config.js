import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("@mantine")) return "mantine";
          if (id.includes("react-router")) return "routing";
          if (id.includes("axios")) return "network";
          if (id.includes("@phosphor-icons")) return "icons";
          return "vendor";
        },
      },
    },
  },
});
