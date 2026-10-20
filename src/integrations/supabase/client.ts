import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuración por variables de entorno (ver .env.example)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Falta configurar Supabase: copiá .env.example a .env y completá VITE_SUPABASE_URL y ' +
      'VITE_SUPABASE_PUBLISHABLE_KEY con los valores de tu proyecto (Supabase → Project Settings → API). ' +
      'Después reiniciá el servidor de desarrollo.'
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
