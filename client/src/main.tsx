import { trpc } from "@/lib/trpc";
import { registerSW } from 'virtual:pwa-register';
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { LanguageProvider } from "./contexts/LanguageContext";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        // Get JWT token from localStorage
        const token = localStorage.getItem("auth_token");
        
        // Add Authorization header if token exists
        const headers = {
          ...(init?.headers || {}),
        };
        
        if (token) {
          headers["Authorization" as keyof typeof headers] = `Bearer ${token}`;
        }
        
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
          headers,
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")! as HTMLElement as HTMLElement).render(
  <LanguageProvider>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </LanguageProvider>
);

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);
        
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, show update notification
                console.log('[PWA] New content available, please refresh.');
                
                // Optionally show a toast notification to the user
                if (window.confirm('New version available! Refresh to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
    
    // Handle service worker controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Service Worker controller changed, reloading page...');
      window.location.reload();
    });
  });
}

// Request push notification permission (optional, can be triggered by user action)
// Uncomment this if you want to request permission on page load
/*
if ('Notification' in window && 'serviceWorker' in navigator) {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      console.log('[PWA] Notification permission:', permission);
    });
  }
}
*/
