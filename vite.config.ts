import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        frame: './public/frame.html'
      }
    }
  },
  publicDir: 'public'
});
