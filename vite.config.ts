import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Relative base ('./') keeps the build host-agnostic: it works on GitHub Pages
// project sites (served from /<repo>/), Cloudflare Pages and Vercel alike.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
