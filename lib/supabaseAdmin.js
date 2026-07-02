import { createClient } from '@supabase/supabase-js';

// ⚠️ Este cliente usa la "service_role key" — se salta TODAS las reglas de seguridad (RLS).
// Solo se debe importar dentro de app/api/**/route.js (código de servidor).
// NUNCA lo importes en un componente que corra en el navegador.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
