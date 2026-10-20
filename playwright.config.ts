import { defineConfig, devices } from '@playwright/test';
import { E2E_SUPABASE_KEY, E2E_SUPABASE_URL } from './e2e/env';

const PORT = 5179;

// Smoke test e2e con sesión y Supabase simulados (ver e2e/fixtures.ts): no toca la base real
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Nunca reutilizar un servidor ya levantado: podría estar apuntando a un Supabase real
    reuseExistingServer: false,
    // process.env tiene prioridad sobre los archivos .env en Vite, así que esto pisa el .env local
    env: {
      VITE_SUPABASE_URL: E2E_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: E2E_SUPABASE_KEY,
      VITE_SUPABASE_ANON_KEY: E2E_SUPABASE_KEY,
    },
  },
});
