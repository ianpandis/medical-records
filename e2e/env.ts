// Supabase simulado para los tests e2e: playwright.config.ts lo inyecta en el webServer
// (webServer.env tiene prioridad sobre el .env del desarrollador) y fixtures.ts intercepta sus requests.
export const E2E_SUPABASE_URL = 'https://e2e-mock.supabase.co';
export const E2E_SUPABASE_KEY = 'e2e-anon-key';

// Misma clave que usa supabase-js para guardar la sesión en localStorage
export const E2E_STORAGE_KEY = `sb-${new URL(E2E_SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
