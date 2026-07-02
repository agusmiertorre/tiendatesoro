import { createClient } from '@supabase/supabase-js';

// Este cliente usa la "anon key" — es seguro exponerlo en el navegador.
// Solo puede hacer lo que las políticas de RLS (Row Level Security) le permitan.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
