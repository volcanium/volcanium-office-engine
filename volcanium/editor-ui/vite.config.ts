import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// Interface « maison » des éditeurs : bundle autonome (IIFE) chargé dans la page de l'éditeur ONLYOFFICE.
export default defineConfig({
  root: here,
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: ["react", "react-dom"] },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: path.resolve(here, "dist"),
    emptyOutDir: true,
    lib: { entry: path.resolve(here, "main.tsx"), formats: ["iife"], name: "VoEditorUI", fileName: () => "vo-editor-ui.js" },
    cssCodeSplit: false,
  },
});
