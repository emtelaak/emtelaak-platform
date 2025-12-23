import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";


const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  visualizer({
    filename: "dist/stats.html",
    open: false,
    gzipSize: true,
    brotliSize: true,
  }),
  VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
    manifest: {
      name: "Emtelaak - Fractional Real Estate Investment",
      short_name: "Emtelaak",
      description: "Invest in premium real estate properties with fractional ownership starting from 10,000 EGP",
      theme_color: "#1a365d",
      background_color: "#ffffff",
      display: "standalone",
      orientation: "portrait-primary",
      scope: "/",
      start_url: "/",
      categories: ["finance", "business", "investment"],
      lang: "en",
      dir: "auto",
      icons: [
        {
          src: "/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/pwa-maskable-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable"
        },
        {
          src: "/pwa-maskable-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable"
        }
      ],
      screenshots: [
        {
          src: "/screenshot-wide.png",
          sizes: "1280x720",
          type: "image/png",
          form_factor: "wide",
          label: "Emtelaak Dashboard"
        },
        {
          src: "/screenshot-narrow.png",
          sizes: "750x1334",
          type: "image/png",
          form_factor: "narrow",
          label: "Emtelaak Mobile"
        }
      ]
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\.emtelaak\.co\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 // 24 hours
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/.*\.amazonaws\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "s3-images-cache",
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    devOptions: {
      enabled: false // Disable in development
    }
  })
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'router': ['wouter'],
          'trpc': ['@trpc/client', '@trpc/react-query', '@tanstack/react-query'],
          
          // UI library chunks
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
          ],
          
          // Feature chunks (lazy loaded)
          'admin': [
            './client/src/pages/AdminDashboard.tsx',
            './client/src/pages/SuperAdminDashboard.tsx',
          ],
          'helpdesk': [
            './client/src/pages/HelpDesk.tsx',
            './client/src/pages/AgentDashboard.tsx',
            './client/src/components/LiveChat.tsx',
          ],
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
