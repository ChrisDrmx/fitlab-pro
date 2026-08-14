import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-32.png", "apple-touch-icon.png", "icon.svg"],
      manifest: {
        name: "FitLab Pro — Fitting fers & bois",
        short_name: "FitLab Pro",
        description:
          "Diagnostic de fitting fers et bois : mesures statiques, lie dynamique, données Trackman, chartes constructeurs et rapport client PDF.",
        lang: "fr",
        dir: "ltr",
        start_url: "./index.html#/",
        scope: "./",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#1b3a2c",
        theme_color: "#1b3a2c",
        categories: ["sports", "productivity", "utilities"],
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Polices Fontshare : disponibles hors ligne apres la premiere visite.
            urlPattern: /^https:\/\/api\.fontshare\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fitlab-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Analyses IA et Supabase : jamais servies depuis le cache.
            urlPattern: /\/api\/|supabase\.co/i,
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  base: "./",
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: { strict: true, deny: ["**/.*"] },
  },
});
